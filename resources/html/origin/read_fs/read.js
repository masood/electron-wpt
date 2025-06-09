function read() {
    fetch("../../Library/Application Support/origin/Cookies")
        .then((response) => response.text())
        .then((text) => {
            let h1 = document.createElement("h1");
            h1.textContent = "Cookies";
            document.body.appendChild(h1);
            return text;
        })
        .then((text) => {
            text.split("\n").forEach((line) => {
                let p = document.createElement("p");
                p.textContent = line;
                document.body.appendChild(p);
            });
        });
}

read();
