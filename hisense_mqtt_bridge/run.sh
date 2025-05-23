#!/bin/bash
touch /app/log.txt

# Запускаем подписку через mosquitto_sub в фоне
mosquitto_sub \
  -h 192.168.2.150 -p 36669 \
  --cert /ssl/rcm_certchain_pem.cer \
  --key /ssl/rcm_pem_privkey.pkcs8 \
  --insecure \
  -u hisenseservice -P multimqttservice \
  -v -t "#" >> /app/log.txt 2>&1 &

# Запускаем web-интерфейс
python3 webserver.py