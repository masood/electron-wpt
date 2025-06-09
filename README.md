# Lost in Translation: Exploring the Risks of Web-to-Cross-platform Application Migration

This repository contains the code and security testing templates used for our **cross-platform analysis of Electron security headers**. 
It includes the necessary components of the Empirical Analysis stage.


## **1. Repository Contents**  
- **`app.js`** – Main Node.js server script containing all endpoints. 
- **`/views/`** – Directory containing **templates** used for testing security headers.
- **`/server/webserver_test/`** – Contains an external server instance for **third-party testing**.
- **`/resources/tests/first-party/`** – Test cases for **security interactions (1st party)**.
- **`/resources/tests/third-party/`** – Test cases for **security interactions (3rd party)**.
- **`/resources/html/`** – Additional test cases for:
  - **Cross-Origin Isolation (`/origin/`)**
  - **Permissions Policy (`/permission-policy/`)**
- **`domains.json`** – The domain names for both first and third party servers. 


## **2. Setting Up first-party servers**  
This server provides test endpoints for security header evaluation.

1. Navigate to the top of the repo directory.

2. Start the server:
   ```sh
   node app.js
   ```  
3. The first-party server will now be running and serving test pages.

The deployment for the external domain is identical and the same configuration cam be used.

## **3. Setting Up the external server**  
This server provides test endpoints for security header evaluation.

1. Navigate to the  server directory:
   ```sh
   cd server/webserver_test
   ```  
2. Install dependencies:
   ```sh
   npm install
   ```  
3. Start the server:
   ```sh
   node app.js
   ```  
4. The server will now be running and serving test pages.

The deployment for the external domain is identical and the same configuration cam be used.


## **3. Running Tests**  

### **Available Test Categories:**  
- **Main Templates (`/views/`)**  
  - Example: `views/xfo.pug` tests X-Frame-Options behavior.
- **First-Party Tests (`/resources/tests/first-party/`)**  
  - Example: `coop_iframe.html` tests COOP behavior in iframes.
- **Third-Party Tests (`/resources/tests/third-party/`)**  
  - Example: `xfo_embed.html` tests clickjacking via embedded iframes.
- **Cross-Origin & Permissions Tests (`/resources/html/`)**  
  - Example: `resources/html/other/nosniff.html` tests MIME-type sniffing.

### **How to Run the Tests**  
1. Start both **first-party** and **third-party** servers.
2. Open a browser or Electron application and navigate to:
   - `http://<domain>/views/xfo.pug` (or another test page)
   - `http://<domain>/resources/tests/first-party/coop_iframe.html`

Citation
--------

If you use this artifact in your research, please cite our PETS 2025 publication. You can use the following BibTeX.

    @inproceedings{paloscia2025,
        author = {Paloscia, Claudio and Solomos, Kostas and Ali, Mir Masood and Polakis, Jason},
        title = {Lost in {Translation}: {Exploring} the {Risks} of {Web}-to-{Cross}-platform {Application} {Migration}},
        booktitle = {Proceedings on Privacy Enhancing Technologies Symposium},
        address = {Washington, DC, USA},
        year = {2025}
    }

License
--------

This repository is licensed under GNU GPLv3.