# Quickstart Guide
1. Start the LDAP Database
    - Import the [docker image](/ldap_backup.tar) using `docker import ldap_backup ldap`
    - Run the new image on port `10389` using
    ```
        docker run ldap -t -i -p 10389:10389 ldap /bin/sh
    ```
    
2. Create SSL certificates
    - Install [mkcert](https://mkcert.org/) and generate a Root-CA certificate
    - Move to the directory in which the certificate should be saved.
    - Create an SSL certificate for `localhost` with
    ```cmd
    mkcert localhost
    ```
    - Remember the location of the certificates

3. Link the shared utilities
    - Clone the GitHub repository [shared-utilities](https://github.com/l-nn-rt/nfc-door-control-system-shared-utilitites.git)
    - In the cloned direcotry, run `npm install`
    - In the cloned directory, create a global link for the module with `npm link`

4. Start the midware
    - Clone this GitHub repository
    - Go to config folder to copy the certificates and rename the  key to `server.key` and the cert into `server.cert`.
    - Install dependencies with `npm run init`
    - Start the midware with `npm start`

5. Start the door-controller
    - Clone the GitHub repository for the [door-controller](https://github.com/davidgru/nfc-door-controll-system-esp32-firmware)
    - Wiring
        - Connect a LED to GPIO25 and GND of ESP32
        - Connect a LED to GPIO33 and GND of ESP32
        - Connect a Button to GPIO26 and GND of ESP32
        - Wire the NFC-Reader according to the following diagram:
    ![](https://github.com/davidgru/nfc-door-control-system-esp32-firmware/blob/main/esp32-rfid-rc522-wiring-diagram.jpg)
    - In `build_flags` in `platformio.ini` set...
        - `WIFI_SSID` to your wifi ssid
        - `WIFI_PASSWORD` to your wifi password
        - `DC_MIDWARE_BASE_URL` to `https://$(midware_url)/`
        - `DC_SERVER_SECURE` to `false`
    - Connect the ESP32 to a USB port
    - Use PlatformIO to upload to the ESP32
        - `pio run` using the cli
        - or via `PlatformIO: Upload` in the vscode command palette
    - You can run `pio test` to verify

6. Start the progressive web-app
    - Clone the GitHub repository for the [PWA](https://github.com/ZaTTTel/nfc-door-control-system-pwa/).
    - Run `npm install` to install dependencies
    - Build the app using `ng build`
    - Install http-server using `npm install --global http-server`
    - Host the app by running
    ```
    npx http-server -p 4201 --cert ${cert location} --key ${key location} dist -S
    ```
    - The app will be accessible to all devices that have installed your root-certificate on `https://localhost:4201`
 

You should be able to log into the account with username `Alex` and password `test1234`.
