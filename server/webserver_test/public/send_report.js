function send_report(message) {
    fetch("https://mali92.cs.uic.edu/report", {
        method: "POST",
        headers: {
            "Content-Type": "text/plain",
        },
        body: message,
    });
}

export { send_report };
