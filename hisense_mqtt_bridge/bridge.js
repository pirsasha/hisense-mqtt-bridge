const mqtt = require('mqtt');
const fs = require('fs');

const LOCAL_MQTT_HOST = process.env.MQTT_HOST || 'localhost';
const LOCAL_MQTT_PORT = process.env.MQTT_PORT || '1883';
const LOCAL_MQTT_USER = process.env.MQTT_USERNAME || '';
const LOCAL_MQTT_PASS = process.env.MQTT_PASSWORD || '';

const HISENSE_MQTT_HOST = process.env.HISENSE_HOST || '192.168.2.150';
const HISENSE_MQTT_PORT = process.env.HISENSE_PORT || '36669';

const HISENSE_TOPIC_PREFIX = '/remoteapp/tv';

// Лучше использовать UUID из логов
let UUID = process.env.HISENSE_UUID || '9f:08:8f:6b:d1:9b';

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
  clientId: 'hisense-bridge-' + Math.random().toString(16).slice(2, 10)
});

function remoteTopic(service, action) {
  return `${HISENSE_TOPIC_PREFIX}/${service}/${UUID}$vidaa_common/actions/${action}`;
}

function sendKey(keycode) {
  const topic = remoteTopic('remote_service', 'sendkey');
  const payload = JSON.stringify({ keycode });
  remoteClient.publish(topic, payload);
  console.log(`📤 Sent key: ${keycode} → ${topic}`);
}

function launchApp(appPayload) {
  const topic = remoteTopic('ui_service', 'launchapp');
  remoteClient.publish(topic, JSON.stringify(appPayload));
  console.log(`📤 Launched app: ${appPayload.name} → ${topic}`);
}

function sendSource(source) {
  const sourceMap = {
    hdmi1: {
      sourceid: 'HDMI1',
      sourcename: 'HDMI1',
      displayname: 'HDMI1'
    },
    hdmi2: {
      sourceid: 'HDMI2',
      sourcename: 'HDMI2',
      displayname: 'HDMI2'
    },
    hdmi3: {
      sourceid: 'HDMI3',
      sourcename: 'HDMI3',
      displayname: 'HDMI3'
    }
  };

  const src = sourceMap[source];

  if (!src) {
    console.log(`⚠️ Unknown source: ${source}`);
    return;
  }

  // Основная попытка переключить источник
  const topic = remoteTopic('ui_service', 'sourceswitch');
  const payload = JSON.stringify({
    sourceid: src.sourceid,
    sourcename: src.sourcename,
    displayname: src.displayname
  });

  remoteClient.publish(topic, payload);
  console.log(`📤 Source switch: ${source} → ${topic}`);

  // Дополнительный fallback - открыть меню источников
  setTimeout(() => {
    sendKey('KEY_SOURCE');
  }, 700);
}

const apps = {
  youtube: {
    appId: '3',
    name: 'YouTube',
    provider: 0,
    storeType: 98,
    url: 'url3',
    urlType: 0
  },

  kinopoisk: {
    appId: '1509',
    name: 'Кинопоиск',
    provider: 0,
    storeType: 99,
    url: 'url1509',
    urlType: 0
  },

  rutube: {
    appId: 'rutube',
    name: 'rutube',
    provider: 0,
    storeType: 98,
    url: 'https://rutube.ru/tv-release/hisense.server/hisense/',
    urlType: 0
  }
};

const keyMap = {
  home: 'KEY_HOME',
  back: 'KEY_BACK',
  ok: 'KEY_OK',
  up: 'KEY_UP',
  down: 'KEY_DOWN',
  left: 'KEY_LEFT',
  right: 'KEY_RIGHT',

  power: 'KEY_POWER',
  poweroff: 'KEY_POWER',
  menu: 'KEY_MENU',
  source: 'KEY_SOURCE',

  volume_up: 'KEY_VOLUMEUP',
  vol_up: 'KEY_VOLUMEUP',
  volume_down: 'KEY_VOLUMEDOWN',
  vol_down: 'KEY_VOLUMEDOWN',
  mute: 'KEY_MUTE',

  play: 'KEY_PLAY',
  pause: 'KEY_PAUSE',
  stop: 'KEY_STOP'
};

remoteClient.on('connect', () => {
  console.log('✅ Connected to Hisense MQTT');
  remoteClient.subscribe('#');
  console.log('📡 Subscribed to all Hisense topics');
});

remoteClient.on('message', (topic, message) => {
  const text = message.toString();

  console.log(`📩 [${topic}] ${text}`);

  // Автоматически берём UUID из телевизора
  if (topic.includes('/uuidlist/data')) {
    try {
      const list = JSON.parse(text);
      if (Array.isArray(list) && list.length > 0 && list[0].uuid) {
        UUID = list[0].uuid;
        console.log(`🔑 Hisense UUID найден: ${UUID}`);
      }
    } catch (e) {
      console.log('⚠️ UUID parse error:', e.message);
    }
  }

  // Прокидываем всё в локальный MQTT для Home Assistant
  const cleanTopic = topic.startsWith('/') ? topic.slice(1) : topic;
  localClient.publish(`hisense/${cleanTopic}`, text, { retain: true });
});

localClient.on('connect', () => {
  console.log('✅ Connected to local MQTT');
  localClient.subscribe('hisense/command');
  console.log('📥 Subscribed to hisense/command');
});

localClient.on('message', (topic, message) => {
  if (topic !== 'hisense/command') return;

  const payload = message.toString();
  console.log(`📥 Local command: ${payload}`);

  // Старый формат: KEY_HOME, KEY_BACK и т.д.
  if (payload.startsWith('KEY_')) {
    sendKey(payload);
    return;
  }

  try {
    const obj = JSON.parse(payload);

    if (obj.launch && apps[obj.launch]) {
      launchApp(apps[obj.launch]);
      return;
    }

    if (obj.key && keyMap[obj.key]) {
      sendKey(keyMap[obj.key]);
      return;
    }

    if (obj.keycode) {
      sendKey(obj.keycode);
      return;
    }

    if (obj.source) {
      sendSource(String(obj.source).toLowerCase());
      return;
    }

    if (obj.volume === 'up') {
      sendKey('KEY_VOLUMEUP');
      return;
    }

    if (obj.volume === 'down') {
      sendKey('KEY_VOLUMEDOWN');
      return;
    }

    if (obj.mute === true) {
      sendKey('KEY_MUTE');
      return;
    }

    if (obj.power === 'toggle') {
      sendKey('KEY_POWER');
      return;
    }

    console.log('⚠️ Unknown command:', obj);
  } catch (e) {
    console.log('⚠️ Invalid JSON command:', payload);
  }
});
