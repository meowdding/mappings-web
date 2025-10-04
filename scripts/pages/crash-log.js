const version = new URLSearchParams(window.location.search).get("version");

const fullyQualifiedClassRegex = /(?<class>net\.minecraft(?:\.class_\d+)+)/g;
const classNameRegex = /(?<class>class_\d+(?:\.?class_\d+)*)/g;
const methodRegex = /(?<method>method_\d+)/g;
const fieldRegex = /(?<method>field_\d+)/g;

String.prototype.replaceAfter = function(splitter, token, replacement) {
    const indexOf = this.indexOf(splitter)

    return this.substring(0, indexOf) + this.substring(indexOf).replace(token, replacement)
}

function remapClass(classes, input) {
    return classes[input] || classes[input.replaceAfter("class_", ".", "$")] || input
}

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
            const fields = {}
            for (let [className, data] of Object.entries(source)) {
                const actual = destination[className]
                if (actual === undefined) {
                    continue
                }

                for (let [id, method] of Object.entries(data.methods)) {
                    if (method in methods) {
                        continue
                    }
                    methods[method] = actual.methods[id];
                }
                for (let [id, field] of Object.entries(data.fields)) {
                    if (field in fields) {
                        continue
                    }
                    fields[field] = actual.fields[id];
                }

                classes[data.actual] = actual.actual
            }

            let newLog;
            newLog = log.replace(fullyQualifiedClassRegex, (_, className) => remapClass(classes, className));
            newLog = newLog.replace(classNameRegex, (_, className) => {
                const result = remapClass(classes, `net.minecraft.${className}`);
                if (result) return result.substring(result.lastIndexOf(".") + 1).replace("$", ".");
                return className;
            });
            newLog = newLog.replace(methodRegex, (_, methodName) => methods[methodName] || methodName)
            newLog = newLog.replace(fieldRegex, (_, fieldName) => fields[fieldName] || fieldName)

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