#!/bin/bash

set -e
set -x

cd /home/[USERNAME]/nextjs-frontend
yarn install
yarn start &

cd /home/[USERNAME]/backend
source venv/bin/activate
python main.py &

# Wait here forever so the script doesn't exit
wait