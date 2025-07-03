const reader = new JSZip();

/**
 * @param url {string}
 * @returns {Promise<string[]>}
 */
const fetchMavenMetadataVersions = async (url) => {
    const data = await fetch(url).then(it => it.text());

    const parser = new DOMParser();
    const xml = parser.parseFromString(data, "text/xml");
    const versions = xml.querySelector("metadata > versioning > versions");

    const output = [];

    for (let child of versions.children) {
        output.push(child.textContent);
    }

    return output;
}

/**
 * @param version {string}
 * @returns {Promise<string>}
 */
const downloadYarnMappings = async (version) => {
    const metadata = await fetchMavenMetadataVersions("https://maven.fabricmc.net/net/fabricmc/yarn/maven-metadata.xml");
    const yarnVersion = metadata.findLast(it => it.startsWith(version));
    const mappings = await fetch(`https://maven.fabricmc.net/net/fabricmc/yarn/${yarnVersion}/yarn-${yarnVersion}.jar`)
        .then(it => it.arrayBuffer())
        .then(it => reader.loadAsync(it))
        .then(it => it.file("mappings/mappings.tiny").async("string"));

    return mappings;
}

/**
 * @param version {string}
 * @returns {Promise<{
 *     client: string,
 *     server: string
 * }>}
 */
const downloadMojmapMappings = async (version) => {
    const manifest = await fetch("https://piston-meta.mojang.com/mc/game/version_manifest_v2.json").then(it => it.json());
    const url = manifest.versions.find(it => it.id === version).url;

    const versionData = await fetch(url).then(it => it.json());

    const clientMappings = await fetch(versionData.downloads.client_mappings.url).then(it => it.text());
    const serverMappings = await fetch(versionData.downloads.server_mappings.url).then(it => it.text());

    return {
        client: clientMappings,
        server: serverMappings
    }
}