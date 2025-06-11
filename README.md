This is the ReadME for Project Signans. It will contain a TO-DO list and a update-log.

This git contains all the files to run a webserver front end (NextJS & DaisyUI) and a backend in python on a the Raspberry Pi 5.


The raspberry is used to create a user interface, two way communication with a ESP32 running Marlin 2.0 (see the following git for custom marlin version for robot Signas: ADD LINK)

Dependencies:
- Python



Initial Setup:
1. Install dependencies
   - NodeSource
   - NPM
   - YARN
   - 
3. Create folder in document folder:
   -> signans_python
   -> signans_connect
4. Create Virtual Environment for python
  -> 'python3 -m venv .venv'
  -> 'source .venv/bin/activate'
  -> to deactivate: 'deactivate'




TERMINAL COMMANDS:
Check versions:
python -v
node -v
yarn --version
npm --version


step to get it working:
1. Update all packages
2. Download python
3. Download this git to Pi

**Setup Front-end (NextJS)**
5. Install NodeSource (see: https://github.com/nodesource/distributions?tab=readme-ov-file#installation-instructions)
6. Install Yarn (see: https://classic.yarnpkg.com/lang/en/docs/install/#windows-stable)
7. Install Yarn more: with commands
  -> yarn install
  -> yarn add next react react-dom
8. run yarn dev for development
9. Build webserver with:
  -> yarn build

  **Setup Back-end (NextJS)**
1. Navigate to signans_python folder
2. Create Virtual Environment for python
  -> python3 -m venv .venv
  -> source .venv/bin/activate
  -> deactivate (for getting out of venv)
3. Install following packages with pip:
  -> pip install fastapi
  -> pip install uvicorn
  -> pip install websockets
  -> pip install opencv-contrib-python
  -> pip install matplotlib
  -> pip install pyserial
   

5. run
   -> python main.py
  
