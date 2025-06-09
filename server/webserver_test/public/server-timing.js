let p = document.getElementById("test");
for (const entryType of ["navigation", "resource"]) {
    for (const { name: url, serverTiming } of performance.getEntriesByType(
        entryType
    )) {
        if (serverTiming) {
            for (const { name, description, duration } of serverTiming) {
                p.innerText += `${name} (${description}) duration: ${duration} `;

                // Logs "cache (Cache Read) duration: 23.2"
            }
        }
    }
}
