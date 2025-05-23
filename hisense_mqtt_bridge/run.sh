#!/usr/bin/with-contenv bashio

bashio::log.info "Starting Hisense MQTT Bridge..."

mosquitto_pub -h 192.168.2.150 -p 36669 \
  --cafile /ssl/rcm_certchain_pem.cer \
  --cert /ssl/rcm_certchain_pem.cer \
  --key /ssl/rcm_pem_privkey.pkcs8 \
  -u hisenseservice -P multimqttservice \
  -t "/remoteapp/tv/remote_service/user4321$normal_v4/actions/sendkey" \
  -m "KEY_HOME"
