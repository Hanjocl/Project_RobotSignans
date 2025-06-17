This is the ReadME for Project Signans. It will contain a TO-DO list and a update-log.

This git contains all the files to run a webserver front end (NextJS & DaisyUI) and a backend in python on a the Raspberry Pi 5.
The raspberry is used to create a user interface, two way communication with a ESP32 running Marlin 2.0 (see the following git for custom marlin version for robot Signas: ADD LINK)


Naming convention fro the raspberry pi:     
Hostname = RoboSignans[x]
username = robosigans[x]

Overview Setup:
---
1. Update all Packages
2. Download python
3. Download this git to Pi **(I put it in the home dir)**
4. setup Frontend
5. setup backend
6. Set power over GPIO

**Setup Front-end (NextJS)**
1. Install NodeSource (see: https://github.com/nodesource/distributions?tab=readme-ov-file#installation-instructions)
2. Install Yarn (see: https://classic.yarnpkg.com/lang/en/docs/install/#windows-stable)
3. In the folder signans_connect, Install Yarn more: with commands
     ```
    yarn install
    yarn add next react react-dom
    ```
5. Start server in development mode:
    ```
    yarn dev
    ```
7. Build for deployment (restart services for sanity sake)
    ```
    yarn build
    ```
9. Start server manaully:
    ```
    yarn start
    ```
     

  **Setup Back-end (Python)**
1. Navigate to signans_python folder
2. Create Virtual Environment for python
    ```
    python3 -m venv .venv
    source .venv/bin/activate
    ```
    * To deactivate:
   ```
   deactivate (for getting out of venv)
   ```
4. Install following packages with pip:
    ```
    pip install fastapi
    pip install uvicorn
    pip install websockets
    pip install opencv-contrib-python
    pip install matplotlib
    pip install pyserial
    ```
6. To run back-end in Virtual env
    ```
    python main.py
    ```
  
To make it run on boot:
---
1. In the home/[user] dir, create a file called "start-all.sh"

    ```
   nano /home/[USERNAME]/start-all.sh
    ```
3. Put the following in there (also included in the docs):
    ```
    #!/bin/bash

    set -e
    set -x
    
    cd /home/[USERNAME]/Project_RobotSignans/signans_connect
    yarn install
    yarn start &
    
    sleep 1
    cd /home/[USERNAME]/Project_RobotSignans/signans_python
    source .venv/bin/activate
    python main.py > /tmp/main.log 2>&1 &
    
    
    
    # Wait here forever so the script doesn't exit
    wait
    ```
5. Use this command to make it executable:

    ```
    chmod +x start-all.sh
    ```
   
3.Use this command to make it executable:

```
chmod +x start-all.sh
```
4. Test exectuable with:

    ```
   ./start-all.sh
    ```
6. Create service file:
    
    ```
   sudo nano /etc/systemd/system/robo_signans.service
    ```

8. Add the following (ctrl+0, enter, ctrl+x to save):
    ```
    [Unit]
    Description=Start Next.js frontend and Python backend on boot
    After=network-online.target
    
    [Service]
    Type=simple
    User=[USERNAME]
    WorkingDirectory=/home/[USERNAME]
    ExecStart=/home/[USERNAME]/Project_RobotSignans/Start_Scripts/start-all.sh
    Restart=on-failure
    
    [Install]
    WantedBy=multi-user.target
    ```
9.  Reload services & check status:
    ```
    sudo systemctl daemon-reload
    sudo systemctl enable robo_signans.service
    sudo systemctl start robo_signans.service
    sudo systemctl status robo_signans.service
    ```
    OR
     ```
    sudo systemctl daemon-reload
    sudo systemctl restart robo_signans.service
    sudo systemctl status robo_signans.service
    ```
    
10. Reboot and hope it works:

    ```
    sudo reboot
    ```

11. See real-tine logging:

    ```
    journalctl -u robo_signans.service -f
    ```

13. To stop service for development:

    ```
    sudo systemctl stop robo_signans.service
    sudo systemctl disable robo_signans.service
    sudo systemctl daemon-reload
    sudo systemctl status robo_signans.service
    ```
14. Turn off GUI on boot:


    ```
    sudo raspi-config
    ```
    -> system options -> boot -> Console

    -> system options -> auto login -> enable


Set Power Over GPIO:
---
1. Edit EEPROM:
     ```
     sudo rpi-eeprom-config --edit
     ```
2. Add the following line to the end:
      ```
      PSU_MAX_CURRENT=5000
      ```
3. Edit config.txt:
     ```
     sudo nano /boot/firmware/config.txt
     ```
4. Add the following line under [all]:
   ```
     usb_max_current_enable=1
   ```
5. Reboot system
      
