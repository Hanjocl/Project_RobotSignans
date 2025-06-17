#!/bin/bash -l
env > /tmp/env_before.log

set -e
set -x

echo "HOME is $HOME"
echo "USER is $USER"
echo "PATH is $PATH"

cd $HOME/Project_RobotSignans/signans_connect
#yarn install
yarn start > /tmp/yarn.log 2>&1 &

sleep 1
cd $HOME/Project_RobotSignans/signans_python
source .venv/bin/activate
echo "Activated venv"

python main.py > $HOME/main.log 2>&1
echo "main.py finished with exit code $?" >> $HOME/startup_debug.log

sleep 2
# Wait here forever so the script doesn't exit
wait