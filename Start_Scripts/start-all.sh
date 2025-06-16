#!/bin/bash

set -e
set -x

cd $HOME/Project_RobotSignans/signans_connect
yarn install
yarn start > /tmp/yarn.log 2>&1 &

cd $HOME/Project_RobotSignans/signans_python
source .venv/bin/activate
python main.py > /tmp/main.log 2>&1 &

# Wait here forever so the script doesn't exit
wait