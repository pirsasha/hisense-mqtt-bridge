#!/bin/bash
touch /app/log.txt

echo "=== STARTING mosquitto_sub ===" >> /app/log.txt

mosquitto_sub \
  -d \
  -h 192.168.2.150 -p 36669 \
  --cert /ssl/rcm_certchain_pem.cer \
  --key /ssl/rcm_pem_privkey.pkcs8 \
  --insecure \
  -u hisenseservice -P multimqttservice \
  -v -t "#" >> /app/log.txt 2>&1 &

echo "=== STARTING Flask WEB UI ===" >> /app/log.txt
python3 webserver.py
