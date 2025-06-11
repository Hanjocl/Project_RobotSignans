This is the ReadME for Project Signans. It will contain a TO-DO list and a update-log.

This git contains all the files to run a webserver front end (NextJS & DaisyUI) and a backend in python on a the Raspberry Pi 5.
The raspberry is used to create a user interface, two way communication with a ESP32 running Marlin 2.0 (see the following git for custom marlin version for robot Signas: ADD LINK)


Initial Setup:
---
1. Update all packages
2. Download python
3. Download this git to Pi

**Setup Front-end (NextJS)**
5. Install NodeSource (see: https://github.com/nodesource/distributions?tab=readme-ov-file#installation-instructions)
6. Install Yarn (see: https://classic.yarnpkg.com/lang/en/docs/install/#windows-stable)
7. Install Yarn more: with commands
    ```yarn install```
    ```yarn add next react react-dom```
8. To for development:
    ```yarn dev```
9. Build for deployment:
    ```yarn build```
10. Start server:
    ```yarn start```
     

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
      ```python main.py```
  
To make it run on boot:
---
1. In the home/[user] dir, create a file called "start-all.sh"

    ```nano /home/[USERNAME]/start-all.sh```
2. Put the following in there (also included in the docs):
    ```
    #!/bin/bash
    
    set -e
    set -x
    
    cd /home/robosignans2/nextjs-frontend
    yarn install
    yarn start &
    
    cd /home/robosignans2/backend
    source venv/bin/activate
    python main.py &
    
    # Wait here forever so the script doesn't exit
    wait
    ```
   
3.Use this command to make it executable:

    ```chmod +x start-all.sh```
4. Test exectuable with:

    ```./start-all.sh```
5. Create service file:
    
    ```sudo nano /etc/systemd/system/startup-apps.service```

6. Add the following (ctrl+0, enter, ctrl+x to save):
    ```
    [Unit]
    Description=Start Next.js frontend and Python backend on boot
    After=network.target
    
    [Service]
    Type=simple
    User=[USERNAME]
    WorkingDirectory=/home/[USERNAME]
    ExecStart=/home/[USERNAME]/start-all.sh
    Restart=on-failure
    
    [Install]
    WantedBy=multi-user.target
    ```
7.  Reload services & check status:
    ```
    sudo systemctl daemon-reload
    sudo systemctl enable startup-apps.service
    sudo systemctl status startup-apps.service
    ```
8. Reboot and hope it works:

    ```sudo reboot```

9. See real-tine logging:

    ```journalctl -u startup-apps.service -f```

10. To stop service for development:

    ```sudo systemctl stop startup-apps.service```

