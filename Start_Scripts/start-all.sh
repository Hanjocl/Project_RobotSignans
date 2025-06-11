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