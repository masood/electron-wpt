// shared-worker.js
let connections = [];

self.onconnect = function (event) {
    const port = event.ports[0];
    connections.push(port);

    port.onmessage = function (e) {
        console.log("Message received from tab:", e.data);

        // Respond to all connected clients
        connections.forEach((conn) => conn.postMessage(`Message: ${e.data}`));
    };

    port.start();
};
