const resources = window.performance.getEntriesByType("resource");
resources.forEach((entry) => {
    console.log(entry);
});
