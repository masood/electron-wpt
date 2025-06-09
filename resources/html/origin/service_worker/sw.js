// Redirect every fetch
addEventListener("fetch", function (event) {
    console.log("Zio cane");
    event.respondWith(Response.redirect("https://paloscia.com"));
});
