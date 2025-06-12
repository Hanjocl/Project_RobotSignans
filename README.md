This is the ReadME for Project Signans. It will contain a TO-DO list and a update-log.

This git contains all the files to run a webserver front end (NextJS & DaisyUI) and a backend in python on a the Raspberry Pi 5.
The raspberry is used to create a user interface, two way communication with a ESP32 running Marlin 2.0 (see the following git for custom marlin version for robot Signas: ADD LINK)


Initial Setup:
---
1. Update all Packages
2. Download python
3. Download this git to Pi (I put it in the home dir)

**Setup Front-end (NextJS)**
1. Install NodeSource (see: https://github.com/nodesource/distributions?tab=readme-ov-file#installation-instructions)
2. Install Yarn (see: https://classic.yarnpkg.com/lang/en/docs/install/#windows-stable)
3. Install Yarn more: with commands
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
    
    cd /home/robosignans2/Project_RobotSignans/signans_connect
    yarn install
    yarn start &
    
    sleep 1
    cd /home/robosignans2/Project_RobotSignans/signans_python
    source .venv/bin/activate
    python main.py > /tmp/main.log 2>&1 &
    
    
    
    # Wait here forever so the script doesn't exit
    wait
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
    
    ```sudo nano /etc/systemd/system/startup-apps.service```

7. Add the following (ctrl+0, enter, ctrl+x to save):
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
8.  Reload services & check status:
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
    
9. Reboot and hope it works:

    ```
   sudo reboot
    ```

11. See real-tine logging:

    ```
    journalctl -u startup-apps.service -f
    ```

13. To stop service for development:

    ```
    sudo systemctl stop startup-apps.service
    ```

