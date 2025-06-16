#!/bin/bash

set -e
set -x

cd $HOME/Project_RobotSignans/signans_connect
echo $HOME/Project_RobotSignans/signans_connect
yarn install
yarn start &


cd $HOME/Project_RobotSignans/signans_python
echo $HOME/Project_RobotSignans/signans_python
source .venv/bin/activate
python main.py > /tmp/main.log 2>&1 &
echo "Starting back-end"



# Wait here forever so the script doesn't exit
wait