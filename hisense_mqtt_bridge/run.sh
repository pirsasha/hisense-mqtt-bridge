#!/bin/bash
touch /app/log.txt
python3 bridge.py >> /app/log.txt 2>&1 &
python3 webserver.py