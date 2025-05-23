#!/bin/bash
touch /app/log.txt
cd /app
npm install >> /app/log.txt 2>&1
node index.js >> /app/log.txt 2>&1 &
python3 webserver.py