const setVersion = (version) => {
    const searchElement = document.getElementById("search");
    const crashLogElement = document.getElementById("crash-log");

    searchElement.href = "search.html?version=" + version;
    crashLogElement.href = "crash-log.html?version=" + version;
}

fetch("https://piston-meta.mojang.com/mc/game/version_manifest_v2.json")
    .then(it => it.json())
    .then(data => {
        const selectorElement = document.getElementById("version");
        const versions = data.versions.filter(it => it.type === "release").map(it => it.id)

        setVersion(versions[0]);

        selectorElement.onchange = () => {
            setVersion(selectorElement.value);
        }

        versions.forEach(version => {
            const option = document.createElement("option");
            option.value = version;
            option.textContent = version;
            selectorElement.appendChild(option);
        });

    });