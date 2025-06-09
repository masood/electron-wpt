const express = require("express");
const app = express();
const path = require("path");
const https = require("https");
const http = require("http");
const fs = require("fs");
const cors = require("cors");
const { exec } = require("child_process");

var bodyParser = require("body-parser");
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(
    bodyParser.urlencoded({
        // to support URL-encoded bodies
        extended: true,
    })
);
app.use(express.json()); // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies

const port = 3000;

const options = {
    cert: fs.readFileSync("./keys/fullchain.pem"),
    key: fs.readFileSync("./keys/privkey.pem"),
};

const corsOptions = {
    origin: "https://mozilla.org",
};

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "resources")));
app.set("/views", "./views");
app.set("view engine", "pug");

// respond with "hello world" when a GET req is made to the homepage
app.get("/", function (req, res) {
    console.log("Received connection on / with protocol " + req.protocol);
    res.sendFile("index.html", { root: path.join(__dirname, "public") });
});

app.get("/pug", function (req, res) {
    res.render("index");
});

//Automatic
// app.get("/xfo_embed", function (req, res) {
//     res.set("Cache-Control", "no-store");
//     res.sendFile("xfo_embed.html", {
//         root: path.join(__dirname, "public", "test1"),
//     });
// });

// app.get("/send_credentials_auto", function (req, res) {
//     let embed = req.query.embed;
//     res.render("third_credentials_template", { embed: embed });
// });

// app.get("/expose_headers", function (req, res) {
//     let embed = req.query.embed;
//     res.render("third_expose_headers_template", { embed: embed });
// });

// app.get("/req_headers", function (req, res) {
//     let embed = req.query.embed;
//     res.render("third_req_headers_template", { embed: embed });
// });

// app.get("/req_method", function (req, res) {
//     let embed = req.query.embed;
//     res.render("third_req_method_template", { embed: embed });
// });

// app.get("/content_language", function (req, res) {
//     let embed = req.query.embed;
//     res.render("third_content_language_template", { embed: embed });
// });

app.get("/content_type", function (req, res) {
    let embed = req.query.embed;
    res.render("third_content_type_template", { embed: embed });
});

app.get("/check_set_cookie_visibility", function (req, res) {
    let embed = req.query.embed;
    res.render("third_check_set_cookie_visibility_template", { embed: embed });
});

app.get("/check_cookie_samesite", function (req, res) {
    let embed = req.query.embed;
    let policy = req.query.policy;
    let cookie_name = req.query.name;
    let protocol = req.query.protocol;
    let expected_result = req.query.expected_result;
    let usenavigation = req.query.usenavigation == "true" ? true : false;

    if (!usenavigation)
        res.render("third_check_cookie_samesite_fetch", {
            embed: embed,
            name: cookie_name,
            policy: policy,
            protocol: protocol,
            expected_result: expected_result,
        });
    else
        res.render("third_check_cookie_samesite_navigation", {
            embed: embed,
            name: cookie_name,
            policy: policy,
            old_protocol: req.protocol,
            new_protocol: protocol,
            expected_result: expected_result,
        });
});

app.get("/check_cookie_samesite_embed", function (req, res) {
    res.sendFile("check_cookie_samesite_embed.html", {
        root: path.join(__dirname, "public"),
    });
});

app.get("/third_party_cookie", function (req, res) {
    res.cookie("Third_party" + String.fromCharCode(129), "test", {
        sameSite: "None",
        secure: true,
    });
    res.send("Cookie sent");
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

https.createServer(options, app).listen(443);
