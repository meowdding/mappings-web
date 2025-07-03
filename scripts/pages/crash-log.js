const version = new URLSearchParams(window.location.search).get("version");

const methodRegex = /(?<class>net\.minecraft\.class_\d+)\.(?<method>method_\d+)/g;
const classRegex = /(?<class>net\.minecraft\.class_\d+)/g;
const class2Regex = /(?<class>class_\d+)/g;

const setup = (version) => {
    parse(version).then(mappings => {
        const mapElement = document.getElementById("map");
        const logElement = document.getElementById("log");
        const toElement = document.getElementById("to");

        logElement.disabled = false;

        mapElement.onclick = () => {
            const log = logElement.value;
            const source = mappings["intermediary"];
            const destination = mappings[toElement.value];

            const classes = {}
            const methods = {}
            for (let [className, data] of Object.entries(source)) {
                const actual = destination[className]

                for (let [id, method] of Object.entries(data.methods)) {
                    methods[method] = actual.methods[id];
                }

                classes[data.actual] = actual.actual
            }

            let newLog;
            newLog = log.replace(methodRegex, (_, className, methodName) => {
                return `${classes[className]}.${methods[methodName] || methodName}`;
            });
            newLog = newLog.replace(classRegex, (_, className) =>
                classes[className] || className
            );
            newLog = newLog.replace(class2Regex, (_, className) => {
                const result = classes[`net.minecraft.${className}`];
                if (result) return result.substring(result.lastIndexOf(".") + 1);
                return className;
            });

            logElement.value = newLog;
        }
    });
}

if (version) {
    setup(version);
} else {
    const url = new URL(window.location.href);
    url.pathname = "/index.html";

    window.location.href = url.toString();
}