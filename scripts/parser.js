const chunkProguard = (data) => {
    const output = {};
    let key = null;
    for (let line of data.split("\n")) {
        if (line.startsWith("#")) continue;
        if (line.trim().length === 0) continue;

        if (line.startsWith("    ")) {
            if (key) {
                output[key].push(line.trim());
            }
        } else {
            key = line.trim();
            output[key] = [];
        }
    }

    return output;
}

const chunkTiny = (data) => {
    const output = {};

    let key = null;

    for (let line of data.split("\n").toSpliced(0, 1)) {
        if (line.startsWith("CLASS")) {
            key = line
            output[key] = [];
        } else if (key) {
            output[key].push(line.trim());
        }
    }

    return output;
}

const BYTECODES = {
    boolean: "Z",
    byte: "B",
    char: "C",
    short: "S",
    int: "I",
    long: "J",
    float: "F",
    double: "D",
}

const parseMojmap = async (mappings) => {
    const output = {}

    const client = chunkProguard(mappings.client);
    const server = chunkProguard(mappings.server);

    const classLookup = {};

    for (let clazz of [...Object.keys(client), ...Object.keys(server)]) {
        const split = clazz.split(" ");
        classLookup[split[0]] = `L${split[2].substring(0, split[2].length - 1)};`
    }

    const getDescriptor = (name) => {
        if (classLookup[name.trim()]) return classLookup[name.trim()];
        if (BYTECODES[name.trim()]) return BYTECODES[name.trim()];
        name = name.trim().replaceAll(".", "/");
        return `L${name};`;
    }

    for (let [clazz, entries] of [...Object.entries(client), ...Object.entries(server)]) {
        const split = clazz.split(" ");
        const classOutput = {
            actual: split[0],
            methods: {},
            fields: {}
        }

        for (let entry of entries) {
            const split = entry.split(" ");
            const name = split[1];
            const to = split[3];

            if (name.endsWith(")")) {
                // Method
                const method = name.substring(0, name.indexOf("("))
                if (method === "<init>" || method === "<clinit>") continue;
                const desc = name.substring(name.indexOf("(") + 1, name.indexOf(")"))
                    .split(",")
                    .filter((x => x.trim() !== ""))
                    .map(getDescriptor)
                    .join("");

                classOutput.methods[`${to}(${desc})`] = method;
            } else {
                // Field
                classOutput.fields[to] = name;
            }
        }

        const obfuscated = split[2];

        if (!obfuscated) console.error("No obfuscated name found for class:", clazz);

        output[split[2].substring(0, split[2].length - 1)] = classOutput;
    }

    return output;
}

const parseTiny = async (offset, mappings) => {
    const output = {};

    for (let [clazz, entries] of Object.entries(chunkTiny(mappings))) {
        const split = clazz.split("\t");

        const classOutput = {
            actual: split[2 + offset].replaceAll("/", "."),
            methods: {},
            fields: {}
        }

        for (let entry of entries) {
            const split = entry.split("\t");
            if (split[0] === "METHOD") {
                // Method
                const desc = split[2].substring(1, split[2].indexOf(")"))
                classOutput.methods[`${split[3]}(${desc})`] = split[4 + offset];
            } else if (split[0] === "FIELD") {
                // Field
                classOutput.fields[split[3]] = split[4 + offset];
            }
        }

        output[split[1].replaceAll("/", ".")] = classOutput;
    }

    return output;
}

/**
 * @param version
 * @returns {Promise<{mojmap: {}, yarn: {}, intermediary: {}}>}
 */
const parse = async (version) => {
    const yarn = await downloadYarnMappings(version);
    const mojmap = await downloadMojmapMappings(version);

    const yarnMappings = await parseTiny(1, yarn);
    const intermediaryMappings = await parseTiny(0, yarn);
    const mojmapMappings = await parseMojmap(mojmap);

    return {
        yarn: yarnMappings,
        intermediary: intermediaryMappings,
        mojmap: mojmapMappings
    };
}