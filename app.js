/* Required Modules */
const express = require("express");
/* The following modules are required for https server */
const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const domains = require("./domains.json");

// Compression
const compression = require("compression");
const shrinkRay = require("shrink-ray-current");
const cookieParser = require("cookie-parser");

dotenv.config();

/* Setting up https certificate */
const privateKey = process.env.privateKeyPath
    ? fs.readFileSync(process.env.privateKeyPath, "utf-8")
    : null;
const certificate = process.env.certificatePath
    ? fs.readFileSync(process.env.certificatePath, "utf-8")
    : null;
const credentials = { key: privateKey, cert: certificate };

/* App Variables */
const app = express();
app.use(express.text());

app.use("/javascript", express.static("javascript"));
app.set("/views", "./views");
app.set("view engine", "pug");
app.use("/html", express.static(path.join(__dirname, "resources", "html")));
app.get("/https", function (request, response) {});
app.use(cookieParser());

function sendFile(response, path) {
    fs.readFile(path, function (error, data) {
        if (error) {
            return res.status(500).send("Error reading file");
        }
        const modifiedHtml = replaceDomains(data.toString());

        response.send(modifiedHtml);
    });
}

function replaceDomains(html) {
    let result = html.replace(/{{first-party}}/g, domains["first-party"]);
    result = result.replace(/{{third-party}}/g, domains["third-party"]);

    return result;
}

function getFirstPartyPath(filename) {
    return path.join(__dirname, "resources", "tests", "first-party", filename);
}

function getThirdPartyPath(filename) {
    return path.join(__dirname, "resources", "tests", "third-party", filename);
}

function isFirstParty(request) {
    return request.hostname == domains["first-party"];
}

app.get("/", function (request, response) {
    console.log(request.path);
    console.log(request.hostname);

    // Strict-Transport-Security: max-age=<expire-time>
    if (request.protocol == "http") {
        response.send("HTTP Request");
    } else if (request.protocol == "https") {
        response.send("HTTPS Request");
    }
});

// MARK: Report endpoint
app.post("/report", cors({ origin: true }), function (request, response) {
    console.log("Report received");
    console.log(request.body);
    response.send("Done");
});

// app.get("/fetch_http", function (request, response) {
//     console.log(request.path);

//     response.sendFile(getPathOfFile("fetch_http.html"));
// });

// app.get("/fetch_http_embeddings", function (request, response) {
//     console.log(request.path);

//     response.sendFile(getPathOfFile("fetch_http_embeddings.html"));
// });

// app.get("/hsts", function (request, response) {
//     console.log(request.path);

//     response.set("Strict-Transport-Security", "max-age=120");
//     response.sendFile(getPathOfFile("hsts.html"));
// });

// app.get("/get_sec_cookie", function (request, response) {
//     console.log(request.path);

//     response.cookie("secure_cookie", "test", { secure: true });
//     response.sendFile(getPathOfFile("secure.html"));
// });

// app.get("/test_cookie", function (request, response) {
//     console.log(request.path);

//     response.sendFile(getPathOfFile("get_secure_cookie_embed.html"));
// });

// app.get("/check_sec_cookie", function (request, response) {
//     console.log(request.path);

//     let cookies = request.headers["cookie"];
//     if (cookies && cookies.includes("secure_cookie"))
//         response.send("Secure cookie received!");
//     else response.send("Secure cookie not received!");
// });

// MARK: CORS
// var corsOptions = {
//     origin: "*",
// };

// app.get("/cors", function (request, response) {
//     response.json({ message: "Hello from the server!" });
// });

// app.get("/cors_script", cors(corsOptions), function (request, response) {
//     response.set("Cross-Origin-Resource-Policy", "cross-origin");
//     response.sendFile(
//         "/home/mali92/electron-sec-headers/javascript/cors_script.js"
//     );
// });

// app.get("/cors_audio", cors(corsOptions), function (request, response) {
//     response.set("Cross-Origin-Resource-Policy", "cross-origin");
//     response.sendFile("/home/mali92/electron-sec-headers/resources/audio.mp3");
// });

// app.get("/cors_img", cors(corsOptions), function (request, response) {
//     response.set("Cross-Origin-Resource-Policy", "cross-origin");
//     response.sendFile("/home/mali92/electron-sec-headers/resources/rick.jpg");
// });

// app.get("/test_img", cors(corsOptions), function (request, response) {
//     response.sendFile("/home/mali92/electron-sec-headers/resources/rick.jpg");
// });

// app.get("/cors_video", cors(corsOptions), function (request, response) {
//     response.set("Cross-Origin-Resource-Policy", "cross-origin");
//     response.sendFile(
//         "/home/mali92/electron-sec-headers/resources/rickroll.mp4"
//     );
// });

// app.get("/get_cors", function (request, response) {
//     response.sendFile(getPathOfFile("get_cors.html"));
// });

// MARK: X-FRAME-OPTIONS
// app.get("/frameoptions_deny", function (request, response) {
//     console.log(request.path);

//     response.set("X-Frame-Options", "DENY");
//     response.sendFile(getPathOfFile("x-frame-option.html"));
// });

// app.get("/frameoptions_sameorigin", function (request, response) {
//     console.log(request.path);

//     response.set("X-Frame-Options", "SAMEORIGIN");
//     response.sendFile(getPathOfFile("x-frame-option.html"));
// });

// Verified
app.get("/xfo_embed", function (request, response) {
    console.log(request.path);
    if (isFirstParty(request)) {
        sendFile(response, getFirstPartyPath("xfo_embed.html"));
    } else {
        response.set("Cache-Control", "no-store");
        sendFile(response, getThirdPartyPath("xfo_embed.html"));
    }
});

// Verified
// Automatic
// GET /xfo?policy=DENY|SAMEORIGIN & origin=SAME|CROSS|LOCAL
app.get("/xfo", function (request, response) {
    console.log(request.path);

    let policy = request.query.policy;
    let origin = request.query.origin;
    let embed = request.query.embed;
    response.set("X-Frame-Options", policy);
    response.render("xfo", {
        origin: origin,
        policy: policy,
        embed: embed,
        firstparty: domains["first-party"],
        thirdparty: domains["third-party"],
    });
});

// MARK: Permission Policy
// ~~~~~~~~~~~~~ PERMISSIONS POLICY ~~~~~~~~~~~~~
// let permission = "()";
// Use query string to set the permission header

// app.get("/camera", function (request, response) {
//     console.log(request.path);

//     response.set("Permissions-Policy", "camera=" + permission);
//     response.sendFile(getPathOfFile("permission-policy/camera.html"));
// });

// app.get("/camera_embed", function (request, response) {
//     console.log(request.path);

//     response.set("Permissions-Policy", "camera=" + permission);
//     response.sendFile(getPathOfFile("permission-policy/camera_embed.html"));
// });

// app.get("/microphone", function (request, response) {
//     console.log(request.path);

//     response.set("Permissions-Policy", "microphone=" + permission);
//     response.sendFile(getPathOfFile("permission-policy/microphone.html"));
// });

// app.get("/microphone_embed", function (request, response) {
//     console.log(request.path);

//     response.set("Permissions-Policy", "microphone=" + permission);
//     response.sendFile(getPathOfFile("permission-policy/microphone_embed.html"));
// });

// app.get("/display-capture", function (request, response) {
//     console.log(request.path);

//     response.set("Permissions-Policy", "display-capture=" + permission);
//     response.sendFile(getPathOfFile("permission-policy/display-capture.html"));
// });

// app.get("/display-capture_embed", function (request, response) {
//     console.log(request.path);

//     response.set("Permissions-Policy", "display-capture=" + permission);
//     response.sendFile(
//         getPathOfFile("permission-policy/display-capture_embed.html")
//     );
// });

// app.get("/fullscreen", function (request, response) {
//     console.log(request.path);

//     response.set("Permissions-Policy", "fullscreen=" + permission);
//     response.sendFile(getPathOfFile("permission-policy/fullscreen.html"));
// });

// app.get("/fullscreen_embed", function (request, response) {
//     console.log(request.path);

//     response.set("Permissions-Policy", "fullscreen=" + permission);
//     response.sendFile(getPathOfFile("permission-policy/fullscreen_embed.html"));
// });

// app.get("/geolocation", function (request, response) {
//     console.log(request.path);

//     response.set("Permissions-Policy", "geolocation=" + permission);
//     response.sendFile(getPathOfFile("permission-policy/geolocation.html"));
// });

// app.get("/geolocation_embed", function (request, response) {
//     console.log(request.path);

//     response.set("Permissions-Policy", "geolocation=" + permission);
//     response.sendFile(
//         getPathOfFile("permission-policy/geolocation_embed.html")
//     );
// });

// ~~~~~~~~~~~~~~~~~ END PERMISSIONS POLICY ~~~~~~~~~~~~~~~~~

// MARK: No sniff

// app.get("/nosniff", function (request, response) {
//     console.log(request.path);

//     //response.set("X-Content-Type-Options", "nosniff");
//     response.set("Content-Type", "text/html");
//     response.sendFile(getPathOfFile("nosniff.html"));
// });

// app.get("/nosniff_css", function (request, response) {
//     console.log(request.path);

//     response.set("X-Content-Type-Options", "nosniff");
//     response.set("Content-Type", "text/html");
//     response.sendFile(getPathOfFile("nosniff_css.html"));
// });

// app.get("/nosniff_page", function (request, response) {
//     console.log(request.path);

//     response.sendFile(getPathOfFile("nosniff_page.html"));
// });

// app.get("/nosniff_css_page", function (request, response) {
//     console.log(request.path);

//     response.sendFile(getPathOfFile("nosniff_css_page.html"));
// });

// app.get("/nosniff_embed", function (request, response) {
//     console.log(request.path);

//     response.sendFile(getPathOfFile("nosniff_embed.html"));
// });

// MARK: XSS Filter

// app.get("/xss", function (request, response) {
//     console.log(request.path);

//     // Read request query string
//     let query = request.query;
//     // Display the query string on the response
//     console.log(query);

//     response.set("X-XSS-Protection", "1 mode=block");
//     response.sendFile(getPathOfFile("xss_filter.html"));
// });

// MARK: COOP

// Verified
/*
 * Fetch a cross-origin page
 * query string: coop=same-origin|same-origin-allow-popups|unsafe-none
 */
app.get("/coop_cross", function (request, response) {
    console.log(request.path);

    let coop = request.query.coop;
    response.set("Cross-Origin-Opener-Policy", coop);
    sendFile(response, getFirstPartyPath("coop_cross.html"));
});

// Verified
/*
 * Fetch a same-origin page
 * query string: coop=same-origin|same-origin-allow-popups|unsafe-none
 */
app.get("/coop_same", function (request, response) {
    console.log(request.path);

    let coop = request.query.coop;
    response.set("Cross-Origin-Opener-Policy", coop);
    sendFile(response, getFirstPartyPath("coop_same.html"));
});
// Verified
app.get("/coop_check_opener", function (request, response) {
    console.log(request.path);

    sendFile(response, getFirstPartyPath("coop_check_opener.html"));
});
// Verified
app.get("/coop_iframe", function (request, response) {
    console.log(request.path);

    sendFile(response, getFirstPartyPath("coop_iframe.html"));
});

// app.get("/isolation", function (request, response) {
//     console.log(request.path);

//     response.set("Cross-Origin-Opener-Policy", "same-origin");
//     response.set("Cross-Origin-Embedder-Policy", "require-corp");
//     response.sendFile(getPathOfFile("cross_origin_isolation.html"));
// });

// MARK: NEL
// ----------------- NEL -----------------
// app.use(
//     express.json({
//         type: ["application/json", "application/reports+json"],
//     })
// );
// app.use(express.urlencoded());

// app.get("/nel", (request, response) => {
//     response.set("NEL", `{"report_to": "network-errors", "max_age": 2592000}`);

//     // The Report-To header tells the browser where to send network errors.
//     // The default group (first example below) captures interventions and
//     // deprecation reports. Other groups, like the network-error group, are referenced by their "group" name.
//     response.set(
//         "Report-To",
//         `{"group": "network-errors", "max_age": 2592000, "endpoints": [{ "url": "https://mali92.cs.uic.edu/network-reports" }]}`
//     );

//     response.sendFile(getPathOfFile("nel.html"));
// });

// function echoReports(request, response) {
//     // Record report in server logs or otherwise process results.
//     for (const report of request.body) {
//         console.log(report.body);
//     }
//     response.send(request.body);
// }

// app.post("/network-reports", (request, response) => {
//     console.log(`${request.body.length} Network error reports:`);
//     echoReports(request, response);
// });

// ----------------- END NEL -----------------

// MARK: CACHE

// app.get("/cache", function (request, response) {
//     console.log(request.path);

//     response.set("Cache-Control", "max-age=30, stale-while-revalidate=60");
//     response.sendFile(getPathOfFile("cache.html"));
// });

// app.get("/csd", function (request, response) {
//     console.log(request.path);

//     response.cookie("test_cookie", "test");
//     response.set("Cache-Control", "max-age=100");
//     // response.set("Clear-Site-Data", '"cache"');
//     response.sendFile(getPathOfFile("csd.html"));
// });

// app.get("/verify_csd", function (request, response) {
//     console.log(request.path);

//     //response.set("Clear-Site-Data", '"cookies", "storage"');
//     response.sendFile(getPathOfFile("clear_and_verify_cookies.html"));
// });

// app.get("/sample_script", function (request, response) {
//     response.set("Cache-Control", "max-age=100");
//     response.sendFile(
//         "/home/mali92/electron-sec-headers/javascript/sample_script.js"
//     );
// });

// const disableCacheControl = {
//     cacheControl: false,
// };

// app.get("/expires", function (request, response) {
//     console.log(request.path);

//     response.set("Expires", "Sat, 02 Mar 2024 23:12:00 GMT");
//     // response.set("Expires", "0");
//     response.sendFile(getPathOfFile("expires.html", disableCacheControl));
// });

// app.get("/pragma", function (request, response) {
//     console.log(request.path);

//     // response.set("Pragma", "no-cache");
//     response.sendFile(getPathOfFile("pragma.html", disableCacheControl));
// });

// MARK: Timing Allow Origin

// app.get("/timingAPI", function (request, response) {
//     console.log(request.path);

//     response.set("Timing-Allow-Origin", "*");
//     response.sendFile(getPathOfFile("timingAPI.html"));
// });

// MARK: WWW-Authenticate
// app.get("/auth", function (request, response) {
//     if (request.headers.authorization) {
//         response.send("Authorized");
//     } else {
//         response.set(
//             "WWW-Authenticate",
//             'Basic realm="Access to the staging site", charset="UTF-8"'
//         );
//         response.status(401).send("Unauthorized");
//     }
// });

// MARK: Client Hints
// app.get("/client_hints", function (request, response) {
//     console.log(request.path);

//     response.set(
//         "Accept-CH",
//         "Sec-CH-UA, Sec-CH-UA-Mobile, Sec-CH-UA-Full-Version, Sec-CH-UA-Arch, Sec-CH-UA-Bitness, Sec-CH-UA-Full-Version-List, Sec-CH-UA-Model, Sec-CH-UA-Platform, Sec-CH-UA-Platform-Version, Sec-CH-Prefers-Reduced-Motion, Sec-CH-Prefers-Color-Scheme, Device-Memory, Width, Viewport-Width, Save-Data, Downlink, ECT, RTT"
//     );
//     response.sendFile(getPathOfFile("client_hints.html"));
// });

// app.get("/print_ch", function (request, response) {
//     console.log(request.path);

//     response.send(request.headers);
// });

// MARK: Server Timing
// app.get("/performance_server_timing", function (request, response) {
//     console.log(request.path);

//     response.set("Timing-Allow-Origin", "none");
//     response.set("Server-Timing", "db;dur=53, app;dur=47");
//     response.sendFile(getPathOfFile("performance_server_timing.html"));
// });

// MARK: Retry After
// app.get("/retry_after", function (request, response) {
//     console.log(request.path);

//     response.set("Retry-After", "10");
//     console.log(getPathOfFile("retry_after.html"));
//     response.status(503).sendFile(getPathOfFile("retry_after.html"));
// });

// MARK: Accept
// app.get("/accept", function (request, response) {
//     console.log(request.path);
//     console.log(request.headers.accept);
//     response.send(request.headers.accept);
// });

app.get("/send_credentials_auto", function (req, res) {
    let embed = req.query.embed;
    res.render("third_credentials_template", {
        embed: embed,
        firstparty: domains["first-party"],
        thirdparty: domains["third-party"],
    });
});

// Verified
app.get("/accept_charset_embeddings", function (request, response) {
    console.log(request.path);
    sendFile(response, getFirstPartyPath("accept_charset_embeddings.html"));
});

// Verified
// TODO Go to report endpoint
app.get("/check_accept_charset", function (request, response) {
    console.log(request.path);
    let origin = "";
    if (request.query.origin) {
        origin = request.query.origin;
    }
    if (request.query.embed == "iframe") {
        if (request.headers["accept-charset"]) {
            console.log(`Accept-Charset iframe ${origin} received: 0`);
        } else {
            console.log(`Accept-Charset iframe ${origin} not received: 1`);
        }
    } else if (request.query.embed == "webview") {
        if (request.headers["accept-charset"]) {
            console.log(`Accept-Charset webview ${origin} received: 0`);
        } else {
            console.log(`Accept-Charset webview ${origin} not received: 1`);
        }
    } else {
        if (request.headers["accept-charset"]) {
            console.log("Accept-Charset no embed remote received: 0");
        } else {
            console.log("Accept-Charset no embed remote not received: 1");
        }
    }
    response.send("Check Accept-Charset");
});

// MARK: Access Control Allow Credentials
let allowCredentialsPreflightIDs = [];

var corsOptionsPreflightDelegate = function (req, callback) {
    var corsOptions;
    if (req.query.preflight === "true") {
        corsOptions = { origin: true, credentials: true }; // reflect (enable) the requested origin in the CORS response
    } else {
        corsOptions = { origin: true, credentials: false }; // disable CORS for this request
    }
    callback(null, corsOptions); // callback expects two parameters: error and options
};

var corsOptionsRequestDelegate = function (req, callback) {
    var corsOptions;
    if (req.query.request === "true") {
        corsOptions = { origin: true, credentials: true }; // reflect (enable) the requested origin in the CORS response
    } else {
        corsOptions = { origin: true, credentials: false }; // disable CORS for this request
    }
    callback(null, corsOptions); // callback expects two parameters: error and options
};

// Verified
app.options(
    "/access_control_allow_credentials",
    function (request, response, next) {
        console.log("Preflight " + request.path);
        let id = request.query.id;
        allowCredentialsPreflightIDs.push(id);
        next();
    },
    cors(corsOptionsPreflightDelegate)
);

// Verified
app.get(
    "/access_control_allow_credentials",
    cors(corsOptionsRequestDelegate),
    function (request, response) {
        console.log(request.path);
        //console.log(request.headers.authorization);
        if (
            request.query.id &&
            allowCredentialsPreflightIDs.includes(request.query.id)
        ) {
            allowCredentialsPreflightIDs.splice(
                allowCredentialsPreflightIDs.indexOf(request.query.id),
                1
            );
            response.send("Accessed");
        } else {
            console.log("Preflight not received");
            response.status(403).send("Preflight not received");
        }
    }
);

// Verified
// MARK: Expose Headers
app.get(
    "/expose_headers",
    cors({ origin: true }),
    function (request, response) {
        console.log(request.path);
        if (isFirstParty(request)) {
            let exposed = request.query.expose;
            response.set("Custom-Header", "Exposed");
            if (exposed == "true") {
                response.set("Access-Control-Expose-Headers", "Custom-Header");
            }
            response.set("Cache-Control", "no-store");
            response.send("Exposed");
        } else {
            let embed = request.query.embed;
            response.render("third_expose_headers_template", {
                embed: embed,
                firstparty: domains["first-party"],
                thirdparty: domains["third-party"],
            });
        }
    }
);

// MARK: Access Control Request Headers

let requestHeadersPreflightIDs = [];

var headersCorsOptionsPreflightDelegate = function (req, callback) {
    var corsOptions;
    if (req.query.allow === "true") {
        corsOptions = { origin: true, allowedHeaders: "custom-header" };
    } else {
        corsOptions = { origin: true, allowedHeaders: "Content-Type" };
    }
    callback(null, corsOptions); // callback expects two parameters: error and options
};

// Verified
app.options(
    "/request_headers",
    function (request, response, next) {
        console.log("Preflight " + request.path);
        let id = request.query.id;
        requestHeadersPreflightIDs.push(id);
        next();
    },
    cors(headersCorsOptionsPreflightDelegate)
);

// Verified
app.get(
    "/request_headers",
    cors({ origin: true }),
    function (request, response) {
        console.log(request.path);
        //console.log(request.headers.authorization);
        if (
            request.query.id &&
            requestHeadersPreflightIDs.includes(request.query.id)
        ) {
            requestHeadersPreflightIDs.splice(
                requestHeadersPreflightIDs.indexOf(request.query.id),
                1
            );
            response.send("Success");
        } else {
            console.log("Preflight not received");
            response.status(403).send("Preflight not received");
        }
    }
);

// MARK: Access Control Request Method

let requestMethodPreflightIDs = [];

var methodCorsOptionsPreflightDelegate = function (req, callback) {
    var corsOptions;
    if (req.query.allow === "true") {
        corsOptions = { origin: true, methods: "DELETE" };
    } else {
        corsOptions = { origin: true, methods: "GET,POST" };
    }
    callback(null, corsOptions); // callback expects two parameters: error and options
};

// Verified
app.options(
    "/request_method",
    function (request, response, next) {
        console.log("Preflight " + request.path);
        let id = request.query.id;
        requestMethodPreflightIDs.push(id);
        next();
    },
    cors(methodCorsOptionsPreflightDelegate)
);

// Verified
app.delete(
    "/request_method",
    cors({ origin: true }),
    function (request, response) {
        console.log(request.path);
        if (
            request.query.id &&
            requestMethodPreflightIDs.includes(request.query.id)
        ) {
            requestMethodPreflightIDs.splice(
                requestMethodPreflightIDs.indexOf(request.query.id),
                1
            );
            response.send("Success");
        } else {
            console.log("Preflight not received");
            response.status(403).send("Preflight not received");
        }
    }
);

// MARK: ALLOW
// -------------- ALLOW ----------------
// app.get("/allow", function (request, response) {
//     response.set("Allow", "POST");
//     response.send(405);
// });

// app.post("/allow", function (request, response) {
//     response.send("POST request received");
// });

// MARK: ALT-SVC
// -------------- ALT-SVC ----------------
// app.get("/alt_svc", function (request, response) {
//     response.set(
//         "Alt-Svc",
//         'h2="wcbtre04ddgw6eeg.myfritz.net:443; ma=2592000; persist=1"'
//     );
//     response.send("Connected to UIC server");
// });

// Verified
// MARK: Content-Disposition
// -------------- CONTENT-DISPOSITION ----------------
app.get("/content_disposition", function (request, response) {
    //TODO Change to actual report
    console.log(
        "Content-Disposition request: " +
            request.query.disposition +
            ", " +
            request.query.embed
    );
    if (request.query.disposition == "attachment") {
        if (request.query.encodingtest == "true") {
            response.set(
                "Content-Disposition",
                "attachment; filename=Dont_use_this.txt; filename*=UTF-8''Use_this.txt"
            );
        } else if (request.query.security == "path") {
            response.set(
                "Content-Disposition",
                "attachment; filename=/browsertest/test1/test2/example.txt"
            );
        } else if (request.query.security == "type") {
            response.set(
                "Content-Disposition",
                "attachment; filename=executable_file.exe"
            );
        } else if (request.query.security == "whitespace") {
            response.set(
                "Content-Disposition",
                "attachment; filename=    example file.txt       "
            );
        } else if (request.query.security == "special") {
            response.set("Content-Disposition", "attachment; filename=..txt");
        } else {
            response.set(
                "Content-Disposition",
                "ATTACHMENT; filename=example.txt"
            );
        } // Upper to test that it's case insensitive
    } else if (request.query.disposition == "inline") {
        response.set("Content-Disposition", "inline");
    } else if (request.query.disposition == "form-data") {
        response.set("Content-Disposition", "form-data");
    } else {
        response.status(400).send("Invalid query parameter");
    }
    response.render("content_disposition", {
        disposition: request.query.disposition,
        embed: request.query.embed,
        firstparty: domains["first-party"],
        thirdparty: domains["third-party"],
    });
});

// Verified
// MARK: Compression
app.get("/compression_gzip", compression(), function (request, response) {
    //TODO Change into actual report
    let embed = request.query.embed;
    console.log(
        "Compression request received " +
            embed +
            ", supported: " +
            request.headers["accept-encoding"]
    );
    response.render("compression", {
        compression: "gzip",
        embed: embed,
        firstparty: domains["first-party"],
        thirdparty: domains["third-party"],
    });
});

// Verified
app.get("/compression_br", shrinkRay(), function (request, response) {
    let embed = request.query.embed;
    response.render("compression", {
        compression: "br",
        embed: embed,
        firstparty: domains["first-party"],
        thirdparty: domains["third-party"],
    });
});

// Verified
app.get("/compression_no", function (request, response) {
    let embed = request.query.embed;
    response.set("Content-Encoding", "gzip");
    response.render("compression", {
        compression: "none",
        embed: embed,
        firstparty: domains["first-party"],
        thirdparty: domains["third-party"],
    });
});

// app.get("/content_length", function (request, response) {
//     response.set("Content-Length", "100000");
//     response.send("Content-Length: 100000");
// });

// MARK: Content-Language
// -------------- CONTENT-LANGUAGE ----------------

let contentLanguagePreflightsIDs = [];
// Verified
app.options(
    "/content_language",
    function (request, response, next) {
        console.log("Content-Language Preflight received");
        contentLanguagePreflightsIDs.push(request.query.id);
        next();
    },
    cors({ origin: true, allowedHeaders: "Content-Language" })
);
// Verified
app.get(
    "/content_language",
    cors({ origin: true }),
    function (request, response) {
        console.log("Content-Language request received");
        if (isFirstParty(request)) {
            if (
                request.query.id &&
                contentLanguagePreflightsIDs.includes(request.query.id)
            ) {
                response.send("Request received");
                contentLanguagePreflightsIDs.splice(
                    contentLanguagePreflightsIDs.indexOf(request.query.id),
                    1
                );
            } else {
                response.status(403).send("Preflight not received");
            }
        } else {
            let embed = req.query.embed;
            res.render("third_content_language_template", {
                embed: embed,
                firstparty: domains["first-party"],
                thirdparty: domains["third-party"],
            });
        }
    }
);

// MARK: Content-Type
// ----------------- CONTENT-TYPE -----------------

let contentTypePreflightsIDs = [];
app.get("/content_type", function (req, res) {
    let embed = req.query.embed;
    res.render("third_content_type_template", {
        embed: embed,
        firstparty: domains["first-party"],
        thirdparty: domains["third-party"],
    });
});
// Verified
app.options(
    "/content_type",
    function (request, response, next) {
        console.log("Content-Type Preflight received");
        contentTypePreflightsIDs.push(request.query.id);
        next();
    },
    cors({ origin: true, allowedHeaders: "Content-Type" })
);
// Verified
app.post("/content_type", cors({ origin: true }), function (request, response) {
    console.log("Content-Type request received");
    if (
        request.query.id &&
        contentTypePreflightsIDs.includes(request.query.id)
    ) {
        response.send("Request received");
        contentTypePreflightsIDs.splice(
            contentTypePreflightsIDs.indexOf(request.query.id),
            1
        );
    } else {
        response.status(403).send("Preflight not received");
    }
});

// MARK: COOKIES
// ----------------- COOKIES -----------------

// This endpoint is only for testing purposes
// app.get("/get_cookie", function (request, response) {
//     response.set("Set-Cookie", "=nameless");

//     response.send("Done");
// });

app.get(
    "/check_set_cookie_visibility",
    cors({ origin: true }),
    function (request, response) {
        if (isFirstParty(request)) {
            response.cookie("test", "test");
            response.send("Cookie set");
        } else {
            let embed = req.query.embed;
            res.render("third_check_set_cookie_visibility_template", {
                embed: embed,
                firstparty: domains["first-party"],
                thirdparty: domains["third-party"],
            });
        }
    }
);

// Verified
app.get(
    "/check_cookie_name",
    cors({ origin: true }),
    function (request, response) {
        let embed = request.query.embed;
        for (let i = 0; i < 128; i++) {
            try {
                response.cookie(String.fromCharCode(i), "test" + i, {
                    httpOnly: false,
                    sameSite: "none",
                    secure: true,
                });
            } catch (error) {
                console.log("Error with character with code " + i);
            }
        }
        response.render("check_cookie_name", {
            embed: embed,
            firstparty: domains["first-party"],
            thirdparty: domains["third-party"],
        });
    }
);

// Verified
app.get(
    "/check_cookie_value",
    cors({ origin: true }),
    function (request, response) {
        let embed = request.query.embed;
        let cookies = [];
        let not_allowed = [59, 44, 34, 92];
        for (const i of not_allowed) {
            try {
                cookies.push(
                    "test" +
                        i +
                        "=" +
                        String.fromCharCode(i) +
                        "; SameSite=None; Secure"
                );
            } catch (error) {
                console.log("Error with character with code " + i);
            }
        }
        response.setHeader("Set-Cookie", cookies);
        response.render("check_cookie_value", {
            embed: embed,
            firstparty: domains["first-party"],
            thirdparty: domains["third-party"],
        });
    }
);

// Verified
app.get("/check_cookie_prefix", function (request, response) {
    let set_flag = request.query.flag == "true";
    let is_https = request.protocol == "https";
    let cookie_name = request.query.name;
    let embed = request.query.embed;
    response.cookie("__Secure-" + cookie_name, "test", {
        secure: set_flag,
        sameSite: "none",
    });

    response.render("check_cookie_prefix", {
        embed: embed,
        is_https: is_https,
        is_flag_set: set_flag,
        cookie_name: cookie_name,
        firstparty: domains["first-party"],
        thirdparty: domains["third-party"],
    });
});

// Verified
/*
 * Send a __Host- cookie and check whether it is set
 * query string: secure=true|false, set_domain=true|false, set_path=true|false, name, expected_result=true|false
 * secure: whether to set the secure flag
 * set_domain: whether to set the domain
 * set_path: whether to set the path
 * name: name of the cookie
 * expected_result: whether the cookie is expected to be set
 */
app.get("/check_cookie_prefix_host", function (request, response) {
    let secure = request.query.secure == "true" ? true : false;
    let set_domain = request.query.set_domain == "true" ? request.hostname : "";
    let set_path =
        request.query.set_path == "true" ? "/check_cookie_prefix_host" : "/";
    let protocol = request.protocol;
    let name = request.query.name;
    let expected_result = request.query.expected_result;

    response.cookie("__Host-" + name, "test", {
        secure: secure,
        sameSite: "none",
        domain: set_domain,
        path: set_path,
    });
    response.render("check_cookie_prefix_host", {
        secure: secure,
        domain: set_domain,
        path: set_path,
        name: name,
        expected_result: expected_result,
        protocol: protocol,
        firstparty: domains["first-party"],
        thirdparty: domains["third-party"],
    });
});

// Verified
app.get("/check_cookie_httponly", function (request, response) {
    let embed = request.query.embed;
    let flag = request.query.flag === "true" ? true : false;
    let name = request.query.name;
    response.cookie(name, "test", {
        httpOnly: flag,
        sameSite: "none",
        secure: true,
    });
    response.render("check_cookie_httponly", {
        embed: embed,
        flag: flag,
        name: name,
        firstparty: domains["first-party"],
        thirdparty: domains["third-party"],
    });
});

// Verified
app.get("/check_cookie_httponly_embed", function (request, response) {
    sendFile(response, getFirstPartyPath("check_cookie_httponly_embed.html"));
});

// app.get("/test_weird_cookies", function (request, response) {
//     response.cookie("' OR 1=1 --", "normalValue", {
//         maxAge: 40000,
//         secure: true,
//         sameSite: "none",
//         httpOnly: false,
//     });
//     // for (let i = 33; i < 256; i++) {
//     //     if (i == 127) continue;
//     //     response.cookie(
//     //         "__Sec" + String.fromCharCode(i) + "ure-test",
//     //         "asciiCode" + i,
//     //         {
//     //             maxAge: 300000,
//     //             httpOnly: false,
//     //         }
//     //     );
//     // }
//     response.sendFile(getPathOfFile("check_cookie_name.html"));
// });

// app.get("/test_weird_2", function (request, response) {
//     response.cookie("test", "test");
//     response.sendFile(getPathOfFile("test_weird_cookies.html"));
// });

// Verified
app.get(
    "/check_cookie_samesite",
    cors({ origin: true }),
    function (request, response) {
        if (isFirstParty(request)) {
            let embed = request.query.embed;
            let policy = request.query.policy;
            let is_cross = request.query.cross == "true";
            let cookie_name = request.query.name;
            let change_protocol =
                request.query.changeprotocol == "true" ? true : false;
            let expected_result = request.query.expected_result;
            let usenavigation =
                request.query.usenavigation == "true" ? true : false;
            let protocol = "https";

            response.cookie(cookie_name, "test", {
                sameSite: policy,
            });

            if (change_protocol) {
                protocol = request.protocol == "http" ? "https" : "http";
            } else {
                protocol = request.protocol;
            }
            console.log("Protocol: " + protocol);

            if (is_cross) {
                response.render("check_cookie_samesite_cross", {
                    embed: embed,
                    name: cookie_name,
                    policy: policy,
                    protocol: protocol,
                    expected_result: expected_result,
                    usenavigation: usenavigation,
                    firstparty: domains["first-party"],
                    thirdparty: domains["third-party"],
                });
            } else {
                if (!usenavigation)
                    response.render("check_cookie_samesite_fetch", {
                        embed: embed,
                        name: cookie_name,
                        policy: policy,
                        protocol: protocol,
                        expected_result: expected_result,
                        firstparty: domains["first-party"],
                        thirdparty: domains["third-party"],
                    });
                else
                    response.render("check_cookie_samesite_navigation", {
                        embed: embed,
                        name: cookie_name,
                        policy: policy,
                        old_protocol: request.protocol,
                        new_protocol: protocol,
                        expected_result: expected_result,
                        firstparty: domains["first-party"],
                        thirdparty: domains["third-party"],
                    });
            }
        } else {
            let embed = req.query.embed;
            let policy = req.query.policy;
            let cookie_name = req.query.name;
            let protocol = req.query.protocol;
            let expected_result = req.query.expected_result;
            let usenavigation =
                req.query.usenavigation == "true" ? true : false;

            if (!usenavigation)
                res.render("third_check_cookie_samesite_fetch", {
                    embed: embed,
                    name: cookie_name,
                    policy: policy,
                    protocol: protocol,
                    expected_result: expected_result,
                    firstparty: domains["first-party"],
                    thirdparty: domains["third-party"],
                });
            else
                res.render("third_check_cookie_samesite_navigation", {
                    embed: embed,
                    name: cookie_name,
                    policy: policy,
                    old_protocol: req.protocol,
                    new_protocol: protocol,
                    expected_result: expected_result,
                    firstparty: domains["first-party"],
                    thirdparty: domains["third-party"],
                });
        }
    }
);

// Verified
app.get("/check_cookie_samesite_embed", function (request, response) {
    if (isFirstParty(request))
        sendFile(
            response,
            getFirstPartyPath("check_cookie_samesite_embed.html")
        );
    else
        sendFile(
            response,
            getThirdPartyPath("check_cookie_samesite_embed.html")
        );
});

// Verified
app.get(
    "/check_cookie_samesite_nopage",
    cors({ origin: true }),
    function (request, response) {
        let policy = request.query.policy;
        let cookie_name = request.query.name;

        response.cookie(cookie_name, "test", {
            sameSite: policy,
        });

        response.send("Cookie set");
    }
);

// Verified
app.get(
    "/check_cookie_samesite_navigation_result",
    function (request, response) {
        let embed = request.query.embed;
        let policy = request.query.policy;
        let cookie_name = request.query.name;
        let old_protocol = request.query.old_protocol;
        let expected_result = request.query.expected_result;
        let isCookiePresent = false;
        let is_cross = request.query.cross == "true";

        if (request.cookies[cookie_name]) {
            isCookiePresent = true;
        }

        response.render("check_cookie_samesite_navigation_result", {
            embed: embed,
            name: cookie_name,
            policy: policy,
            old_protocol: old_protocol,
            expected_result: expected_result,
            isCookiePresent: isCookiePresent,
            is_cross: is_cross,
            firstparty: domains["first-party"],
            thirdparty: domains["third-party"],
        });
    }
);

// Verified
app.get(
    "/check_cookie_samesite_result",
    cors({ origin: true, credentials: true }),
    function (request, response) {
        let cookie_name = request.query.name;
        let isCookiePresent = false;
        console.log("Request cookie " + cookie_name);
        if (request.cookies[cookie_name]) {
            isCookiePresent = true;
        }
        response.json({ isCookiePresent: isCookiePresent });
    }
);

// Verified
app.get("/check_cookie_samesite_set", function (request, response) {
    let should_be_sent = request.query.should_be_sent;
    let origin = request.query.origin;

    response.render("check_cookie_samesite_set", {
        should_be_sent: should_be_sent,
        origin: origin,
        firstparty: domains["first-party"],
        thirdparty: domains["third-party"],
    });
});

// Verified
/*
 * The request to this endpoint should come from a subdomain
 * Send a cookie setting the Domain to a higher domain, then check if the cookie is set.
 */
app.get("/check_cookie_domain_sethigher", function (request, response) {
    let original = request.hostname;
    // Get higher domain
    let domain = original.split(".");
    domain.shift();
    domain = domain.join(".");
    let cookie_name = uuidv4();
    let embed = request.query.embed;

    response.cookie(cookie_name, "test", {
        secure: true,
        sameSite: "none",
        domain: domain,
    });
    response.redirect(
        "https://" +
            domain +
            "/check_cookie_domain_result?name=" +
            cookie_name +
            "&visited=higher%20domain&expected_result=true&domain_value=higher%20domain&embed=" +
            embed
    );
});

// Verified
/*
 * The request to this endpoint should come from a domain that has a subdomain.
 * The subdomain must be '1.'
 * Send a cookie setting the Domain to the subdomain, then check if the cookie is set.
 */
app.get("/check_cookie_domain_setsubdomain", function (request, response) {
    let new_domain = "1." + request.hostname; //TODO Change fixed subdomain
    let cookie_name = uuidv4();
    let embed = request.query.embed;

    response.cookie(cookie_name, "test", {
        domain: new_domain,
        secure: true,
        sameSite: "none",
    });
    response.redirect(
        "https://" +
            new_domain +
            "/check_cookie_domain_result?name=" +
            cookie_name +
            "&visited=subdomain&domain_value=subdomain&embed=" +
            embed
    );
});

// Verified
/*
 * The request to this endpoint should come from a domain that has a subdomain.
 * Send a cookie setting (or not) the Domain to the domain itself (the higher domain).
 * Then, visit the subdomain and check if the cookie is visible.
 * query string: set
 * set: whether the Domain attribute should be set or not
 */
app.get("/check_cookie_domain_verifysubdomain", function (request, response) {
    let set = request.query.set === "true" ? true : false;
    let new_domain = "1." + request.hostname; //TODO Change fixed subdomain
    let cookie_name = uuidv4();
    let embed = request.query.embed;

    if (set) {
        response.cookie(cookie_name, "test", {
            domain: request.hostname,
            secure: true,
            sameSite: "none",
        });
        response.redirect(
            "https://" +
                new_domain +
                "/check_cookie_domain_result?name=" +
                cookie_name +
                "&visited=subdomain&expected_result=true&domain_value=higher%20domain&embed=" +
                embed
        );
    } else {
        response.cookie(cookie_name, "test", {
            secure: true,
            sameSite: "none",
        });
        response.redirect(
            "https://" +
                new_domain +
                "/check_cookie_domain_result?name=" +
                cookie_name +
                "&visited=subdomain&domain_value=NOT%20SET&embed=" +
                embed
        );
    }
});

// Verified
/*
 * Send a cookie setting as Domain a completely different domain.
 * Then, check if the cookie is visible from that domain.
 */
app.get("/check_cookie_domain_differentdomain", function (request, response) {
    let new_domain = domains["first-party"];
    let cookie_name = uuidv4();
    let embed = request.query.embed;

    response.cookie(cookie_name, "test", {
        domain: new_domain,
        secure: true,
        sameSite: "none",
    });
    response.redirect(
        "https://" +
            new_domain +
            "/check_cookie_domain_result?name=" +
            cookie_name +
            "&visited=different%20domain&expected_result=false&domain_value=different%20domain&embed=" +
            embed
    );
});

// Verified
/*
 * The request to this endpoint should come from a domain that has a higher domain.
 * Send a cookie setting (or not) the Domain to the domain itself (the subdomain).
 * Then, visit the higher domain and check if the cookie is visible.
 * query string: set
 * set: whether the Domain attribute should be set or not
 */
app.get(
    "/check_cookie_domain_verifyhigherdomain",
    function (request, response) {
        let set = request.query.set === "true" ? true : false;
        let new_domain = request.hostname.split(".");
        new_domain.shift();
        new_domain = new_domain.join(".");
        let cookie_name = uuidv4();
        let embed = request.query.embed;

        if (set) {
            response.cookie(cookie_name, "test", {
                domain: request.hostname,
                secure: true,
                sameSite: "none",
            });
            response.redirect(
                "https://" +
                    new_domain +
                    "/check_cookie_domain_result?name=" +
                    cookie_name +
                    "&visited=higher%20domain&domain_value=subdomain&embed=" +
                    embed
            );
        } else {
            response.cookie(cookie_name, "test", {
                secure: true,
                sameSite: "none",
            });
            response.redirect(
                "https://" +
                    new_domain +
                    "/check_cookie_domain_result?name=" +
                    cookie_name +
                    "&visited=higher%20domain&domain_value=NOT%20SET&embed=" +
                    embed
            );
        }
    }
);

// Verified
/*
 * Send a cookie setting the Domain to a public suffix domain (e.g. .edu or .com)
 * Fetch the endpoint from a subdomain of the public suffix domain.
 * Check if the cookie is visible.
 */
app.get("/check_cookie_domain_publicsuffix", function (request, response) {
    let suffix = "edu";
    let cookie_name = uuidv4();
    let embed = request.query.embed;

    response.cookie(cookie_name, "test", {
        domain: suffix,
        secure: true,
        sameSite: "none",
    });
    response.redirect(
        "https://" +
            request.hostname +
            "/check_cookie_domain_result?name=" +
            cookie_name +
            "&visited=domain%20with%20same%20public%20suffix&domain_value=public%20suffix%20(" +
            suffix +
            ")&embed=" +
            embed
    );
});

// Verified
/*
 * This endpoint is fetched to verify whether a specific cookie has been set or not when testing the Domain attribute.
 * The returned page will then send a report to the server.
 * query string: visited, name, expected_result, domain_value
 * visited: a string identifying the domain that the cookie is being checked from (e.g. higher domain, subdomain, etc.)
 * domain_value: a string identifying the domain that the cookie has been set for (e.g. higher domain, subdomain, etc.)
 * name: the name of the cookie being checked
 * expected_result: whether the cookie is expected to be set or not
 */
app.get("/check_cookie_domain_result", function (request, response) {
    let visited = request.query.visited;
    let name = request.query.name;
    let expected_result =
        request.query.expected_result === "true" ? true : false;
    let domain_value = request.query.domain_value;
    let embed = request.query.embed;

    response.render("check_cookie_domain", {
        visited: visited,
        name: name,
        expected_result: expected_result,
        domain_value: domain_value,
        embed: embed,
        firstparty: domains["first-party"],
        thirdparty: domains["third-party"],
    });
});

// Verified
/*
 * This endpoint is reached through /parent/check_cookie_path
 * It checks whether the cookie set in /parent/check_cookie_path is visible from the parent folder
 */
app.get("/parent", function (request, response) {
    let embed = request.query.embed;
    let cookie_name = request.query.name;

    response.render("check_cookie_path", {
        embed: embed,
        expected_result: false,
        visited: "parent folder",
        name: cookie_name,
        firstparty: domains["first-party"],
        thirdparty: domains["third-party"],
    });
});

// Verified
/*
 * Send a cookie with the Path attribute set to a specific path.
 * Then, check if the cookie is visible from a subfolder or a parent folder.
 * query string: check_sub, expected_result, embed
 * check_sub: whether to check the cookie from a subfolder
 * embed: whether the request is coming from and embed (and which)
 */
app.get("/parent/check_cookie_path", function (request, response) {
    let embed = request.query.embed;
    if (typeof embed === "undefined") {
        embed = "No%20embedding";
    }
    let check_sub = request.query.check_sub === "true" ? true : false;
    let cookie_name = uuidv4();
    response.cookie(cookie_name, "test", {
        path: "/parent/check_cookie_path",
        secure: true,
        sameSite: "none",
    });

    if (check_sub) {
        response.redirect(
            "/parent/check_cookie_path/sub?embed=" +
                embed +
                "&name=" +
                cookie_name
        );
    } else {
        response.redirect("/parent?embed=" + embed + "&name=" + cookie_name);
    }
});

// Verified
/*
 * This endpoint is reached through /parent/check_cookie_path
 * It checks whether the cookie set in /parent/check_cookie_path is visible from the subfolder
 */
app.get("/parent/check_cookie_path/sub", function (request, response) {
    let embed = request.query.embed;
    let cookie_name = request.query.name;

    response.render("check_cookie_path", {
        embed: embed,
        expected_result: true,
        visited: "subfolder",
        name: cookie_name,
        firstparty: domains["first-party"],
        thirdparty: domains["third-party"],
    });
});

// app.get("/xss_cookie", function (request, response) {
//     response.cookie(
//         "<script>alert('Ciao')</script>",
//         "prova" +
//             String.fromCharCode(13) +
//             String.fromCharCode(10) +
//             "test-header: ciao",
//         {
//             secure: true,
//             sameSite: "none",
//         }
//     );
//     response.sendFile(getPathOfFile("xss_cookie.html"));
// });

// app.get("/run_xss_cookie", function (request, response) {
//     let cookies = [];
//     for (const [key, value] of Object.entries(request.cookies)) {
//         cookies.push(value);
//     }
//     response.render("xss_cookie", { injection: cookies });
// });

// Verified
app.get("/send_cookie", function (request, response) {
    console.log(request.cookies);
    console.log(request.headers);
    if (request.cookies["__Host-test"]) {
        console.log("AAAAAAAAAAAAAHHHHHHHHHHHH!!!!!!!!!!!!!!!");
    }
    let res = "";
    for (const [key, value] of Object.entries(request.cookies)) {
        res += key + "=" + value + "; ";
    }
    response.send(res);
});

// app.get("/cookies", function (request, response) {
//     console.log(request.path);
//     response.cookie("cookie1", "value1", {
//         sameSite: "strict",
//         secure: true,
//         httpOnly: true,
//         maxAge: 10000,
//     });
//     response.sendFile(getPathOfFile("cookies.html"));
// });

// app.get("/mixed-content", function (request, response) {
//     response.sendFile(getPathOfFile("wpt/mixed-content.html"));
// });

// app.get('/javascript/sample_script', function(request, response) {
//     response.sendFile("/home/mali92/electron-sec-headers/javascript/sample_script.js");
// })

/* Tests WPT found issues with permissions */
// app.get("/wpt_permissions", function (request, response) {
//     response.sendFile(getPathOfFile("wpt/permissions.html"));
// });

// /* Tests WPT found issues with mixed-content */
// app.get("/worker.js", function (request, response) {
//     response.sendFile(getPathOfFile("wpt/mixed-content-worker.js"));
// });

// app.get("/origin_check.html", function (request, response) {
//     response.sendFile(getPathOfFile("origin/origin.html"));
// });

// app.get("/origin.html", function (request, response) {
//     response.sendFile(getPathOfFile("origin/load_origin.html"));
// });

// app.post(
//     "/analyze_origin",
//     cors({ allow: true }),
//     function (request, response) {
//         console.log(request.body, request.headers["origin"]);
//         response.send("Received");
//     }
// );

// app.get("/load_origin_script", function (request, response) {
//     response.sendFile(getPathOfFile("origin/load_origin_script.html"));
// });

// app.get("/origin_script", function (request, response) {
//     response.sendFile(getPathOfFile("origin/origin_script.js"));
// });

// app.get("/partition_home", function (request, response) {
//     response.sendFile(getPathOfFile("origin/partition_home.html"));
// });

// app.get("/partition_contain_embed", function (request, response) {
//     response.sendFile(getPathOfFile("origin/partition_contain_embed.html"));
// });

// app.get("/partition_sendreceivecookie", function (request, response) {
//     let cookies = request.headers["cookie"];
//     if (cookies && cookies.includes("partition_cookie"))
//         response.send("Cookie received!");
//     else {
//         response.setHeader(
//             "Set-Cookie",
//             "partition_cookie=partition_cookie; SameSite=None; Secure; Partitioned;"
//         );
//         response.send("Cookie not received! Sent one.");
//     }
// });

// app.get("/ab-testing-worklet.js", function (request, response) {
//     response.header("supports-loading-mode", "fenced-frame");
//     response.sendFile(
//         getPathOfFile("privacy-sandbox/fencedframes/ab-testing-worklet.js")
//     );
// });

// app.get("/ab-testing.html", function (request, response) {
//     response.header("supports-loading-mode", "fenced-frame");
//     response.sendFile(
//         getPathOfFile("privacy-sandbox/fencedframes/ab-testing.html")
//     );
// });

// app.get("/cache_img", function (request, response) {
//     console.log("Received request for cached image");
//     response.header("Cache-Control", "private, max-age=31536000");
//     response.sendFile("/home/mali92/electron-sec-headers/resources/rick.jpg");
// });

// app.get("/cache_basic", function (request, response) {
//     response.sendFile(
//         "/home/mali92/electron-sec-headers/resources/html/origin/cache_partitioning.html/basic.html"
//     );
// });

// app.get("/set_local", function (request, response) {
//     response.sendFile(
//         "/home/mali92/electron-sec-headers/resources/html/origin/storage_partitioning/set_local.html"
//     );
// });

// app.get("/read_local", function (request, response) {
//     response.sendFile(
//         "/home/mali92/electron-sec-headers/resources/html/origin/storage_partitioning/read_local.html"
//     );
// });
// app.get("/contain_set_local", function (request, response) {
//     response.sendFile(
//         "/home/mali92/electron-sec-headers/resources/html/origin/storage_partitioning/contain_set_local.html"
//     );
// });
// app.get("/contain_read_local", function (request, response) {
//     response.sendFile(
//         "/home/mali92/electron-sec-headers/resources/html/origin/storage_partitioning/contain_read_local.html"
//     );
// });

// app.get("/set_session", function (request, response) {
//     response.sendFile(
//         "/home/mali92/electron-sec-headers/resources/html/origin/storage_partitioning/set_session.html"
//     );
// });

// app.get("/read_session", function (request, response) {
//     response.sendFile(
//         "/home/mali92/electron-sec-headers/resources/html/origin/storage_partitioning/read_session.html"
//     );
// });
// app.get("/contain_set_session", function (request, response) {
//     response.sendFile(
//         "/home/mali92/electron-sec-headers/resources/html/origin/storage_partitioning/contain_set_session.html"
//     );
// });
// app.get("/contain_read_session", function (request, response) {
//     response.sendFile(
//         "/home/mali92/electron-sec-headers/resources/html/origin/storage_partitioning/contain_read_session.html"
//     );
// });

// app.get("/set_indexeddb", function (request, response) {
//     response.sendFile(
//         "/home/mali92/electron-sec-headers/resources/html/origin/storage_partitioning/set_indexeddb.html"
//     );
// });
// app.get("/read_indexeddb", function (request, response) {
//     response.sendFile(
//         "/home/mali92/electron-sec-headers/resources/html/origin/storage_partitioning/read_indexeddb.html"
//     );
// });
// app.get("/contain_set_indexeddb", function (request, response) {
//     response.sendFile(
//         "/home/mali92/electron-sec-headers/resources/html/origin/storage_partitioning/contain_set_indexeddb.html"
//     );
// });
// app.get("/contain_read_indexeddb", function (request, response) {
//     response.sendFile(
//         "/home/mali92/electron-sec-headers/resources/html/origin/storage_partitioning/contain_read_indexeddb.html"
//     );
// });

// app.get("/load_sw", function (request, response) {
//     response.sendFile(
//         "/home/mali92/electron-sec-headers/resources/html/origin/service_worker/load_sw.html"
//     );
// });

// app.get("/sw", function (request, response) {
//     response.sendFile(
//         "/home/mali92/electron-sec-headers/resources/html/origin/service_worker/sw.js"
//     );
// });

// app.get("/hsts_resource", cors({ origin: true }), function (request, response) {
//     response.setHeader(
//         "Strict-Transport-Security",
//         "max-age=31536000; includeSubDomains"
//     );
//     response.sendFile("/home/mali92/electron-sec-headers/resources/rick.jpg");
// });

// app.get("/hsts_basic", function (request, response) {
//     response.sendFile(
//         "/home/mali92/electron-sec-headers/resources/html/origin/hsts/basic.html"
//     );
// });
// app.get("/shared-worker.js", function (request, response) {
//     response.sendFile(
//         "/home/mali92/electron-sec-headers/resources/html/origin/shared-worker/shared-worker.js"
//     );
// });
// app.get("/shared_basic", function (request, response) {
//     response.sendFile(
//         "/home/mali92/electron-sec-headers/resources/html/origin/shared-worker/basic.html"
//     );
// });

// app.get("/read.js", cors({ origin: true }), function (request, response) {
//     response.cookie("supersecretcookie", "supersecretvalue", {
//         secure: true,
//         sameSite: "none",
//         expires: new Date("Wed, 22 Oct 2025 07:28:00 GMT"),
//     });
//     response.sendFile(
//         "/home/mali92/electron-sec-headers/resources/html/origin/read_fs/read.js"
//     );
// });

// app.get("/get_camera_feed", function (request, response) {
//     response.header("Permissions-Policy", "camera=*");
//     response.sendFile(
//         "/home/mali92/electron-sec-headers/resources/html/get_camera_feed.html"
//     );
// });

app.get("/req_headers", function (req, res) {
    let embed = req.query.embed;
    res.render("third_req_headers_template", {
        embed: embed,
        firstparty: domains["first-party"],
        thirdparty: domains["third-party"],
    });
});

app.get("/req_method", function (req, res) {
    let embed = req.query.embed;
    res.render("third_req_method_template", {
        embed: embed,
        firstparty: domains["first-party"],
        thirdparty: domains["third-party"],
    });
});

/* Server Activation */
var httpsServer = https.createServer(credentials, app);
var httpServer = http.createServer(app);

httpsServer.listen(443);
console.log("HTTPS server running on port 443");
httpServer.listen(80);
console.log("HTTP server running on port 80");
