async function test() {
	// Wait one second
	await new Promise((resolve) => setTimeout(resolve, 1000));
    fetch("https://<server>/analyze_origin", {
        method: "POST",
        body: "script",
    });
    let iframes = Array.from(document.getElementsByClassName("ifr"));
    let webviews = Array.from(document.getElementsByClassName("webview"));
	
    iframes.forEach((iframe) => {
		try {
            let iframeWindow =
                iframe.contentDocument || iframe.contentWindow.document;
            let el = iframeWindow.getElementById("test");
            el.innerHTML = "Modified!";}
		catch (e) {
			console.log(e);
		}
    });

    webviews.forEach((webview) => {
		try {
            let webviewWindow =
                webview.contentDocument || webview.contentWindow.document;
            let el = webvieWindow.getElementById("test");
            el.innerHTML = "Modified!";
		} catch (e) {
			console.log(e);
		}
    });
}

document.addEventListener("DOMContentLoaded", test);
