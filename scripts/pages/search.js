const createElement = (from, to) => {
    const element = document.createElement("details");

    const summary = document.createElement("summary");
    summary.innerText = `${from.actual} → ${to ? to.actual : "N/A"}`;
    element.appendChild(summary);

    const methods = document.createElement("ul");
    for (let [name, method] of Object.entries(from.methods)) {
        const methodElement = document.createElement("li");
        methodElement.innerHTML = `<strong>${method}</strong> → <span>${to ? to.methods[name] : "N/A"}</span>`;
        methods.appendChild(methodElement);
    }

    const fields = document.createElement("ul");
    for (let [name, field] of Object.entries(from.fields)) {
        const fieldElement = document.createElement("li");
        fieldElement.innerHTML = `<strong>${field}</strong> → <span>${to ? to.fields[name] : "N/A"}</span>`;
        fields.appendChild(fieldElement);
    }

    element.appendChild(document.createElement("hr"));

    if (Object.keys(from.methods).length !== 0) {
        element.append("Methods:");
        element.appendChild(methods);
    }
    if (Object.keys(from.fields).length !== 0) {
        element.append("Fields:");
        element.appendChild(fields);
    }

    return element;
}

const version = new URLSearchParams(window.location.search).get("version") || "1.21.7";

const search = (mappings, source, destination, query) => {
    const resultsElement = document.getElementById("results");
    const results = Object.entries(source)
        .filter(([_, data]) => data.actual.toLowerCase().includes(query))
        .map(([name, _]) => name)
        .splice(0, 10);

    resultsElement.innerHTML = "";

    for (let result of results) {
        const from = source[result];
        const to = destination[result];

        resultsElement.appendChild(createElement(from, to));
    }
}

const setup = (version) => {
    parse(version).then(mappings => {
        const searchElement = document.getElementById("search");
        const fromElement = document.getElementById("from");
        const toElement = document.getElementById("to");

        searchElement.disabled = false;

        const onchange = () => search(
            mappings,
            mappings[fromElement.value],
            mappings[toElement.value],
            searchElement.value.toLowerCase()
        )

        fromElement.onchange = onchange
        toElement.onchange = onchange
        searchElement.onchange = onchange
    });
};

if (version) {
    setup(version);
} else {
    const url = new URL(window.location.href);
    url.pathname = "/index.html";

    window.location.href = url.toString();
}