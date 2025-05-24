
const mqtt = require('mqtt');
const fs = require('fs');

const LOCAL_MQTT_HOST = process.env.MQTT_HOST || 'localhost';
const LOCAL_MQTT_PORT = process.env.MQTT_PORT || '1883';
const LOCAL_MQTT_USER = process.env.MQTT_USERNAME || '';
const LOCAL_MQTT_PASS = process.env.MQTT_PASSWORD || '';

const HISENSE_MQTT_HOST = '192.168.2.150';
const HISENSE_MQTT_PORT = '36669';
const HISENSE_TOPIC_PREFIX = '/remoteapp/tv';
const UUID = 'f1:39:b0:73:5a:ad'; // замените на ваш UUID

const fs_cert = '/ssl/rcm_certchain_pem.cer';
const fs_key = '/ssl/rcm_pem_privkey.pkcs8';

const localClient = mqtt.connect({
  host: LOCAL_MQTT_HOST,
  port: parseInt(LOCAL_MQTT_PORT),
  username: LOCAL_MQTT_USER,
  password: LOCAL_MQTT_PASS
});

const remoteClient = mqtt.connect({
  host: HISENSE_MQTT_HOST,
  port: parseInt(HISENSE_MQTT_PORT),
  protocol: 'mqtts',
  rejectUnauthorized: false,
  cert: fs.readFileSync(fs_cert),
  key: fs.readFileSync(fs_key),
  clientId: 'hisense-bridge-' + Math.random().toString(16).substr(2, 8)
});

remoteClient.on('connect', () => {
  console.log('✅ Connected to Hisense MQTT');
  remoteClient.subscribe('#');
});

remoteClient.on('message', (topic, message) => {
  const cleanTopic = topic.startsWith("/") ? topic.slice(1) : topic;
  localClient.publish(`hisense/${cleanTopic}`, message.toString());
});

localClient.on('connect', () => {
  console.log('✅ Connected to Local MQTT');
  localClient.subscribe('hisense/command');
});

localClient.on('message', (topic, message) => {
  if (topic === 'hisense/command') {
    let payload = message.toString();
    let remoteTopic = '';

    if (payload.startsWith('KEY_')) {
      remoteTopic = `${HISENSE_TOPIC_PREFIX}/remote_service/${UUID}$vidaa_common/actions/sendkey`;
      remoteClient.publish(remoteTopic, JSON.stringify({ keycode: payload }));
      console.log(`📤 Sent command: ${payload} → ${remoteTopic}`);
    }

    try {
      const obj = JSON.parse(payload);
      if (obj.launch === 'kinopoisk') {
        remoteTopic = `${HISENSE_TOPIC_PREFIX}/ui_service/${UUID}$vidaa_common/actions/launchapp`;
        const appPayload = {
          appId: "1509",
          name: "Кинопоиск",
          provider: 0,
          storeType: 99,
          url: "url1509",
          urlType: 0
        };
        remoteClient.publish(remoteTopic, JSON.stringify(appPayload));
        console.log(`📤 Launched app: Кинопоиск → ${remoteTopic}`);
      } else if (obj.launch === 'youtube') {
        remoteTopic = `${HISENSE_TOPIC_PREFIX}/ui_service/${UUID}$vidaa_common/actions/launchapp`;
        const appPayload = {
          appId: "3",
          name: "YouTube",
          provider: 0,
          storeType: 98,
          url: "url3",
          urlType: 0
        };
        remoteClient.publish(remoteTopic, JSON.stringify(appPayload));
        console.log(`📤 Launched app: YouTube → ${remoteTopic}`);
      }
    } catch (e) {
      // ignore invalid JSON
    }
  }
});
