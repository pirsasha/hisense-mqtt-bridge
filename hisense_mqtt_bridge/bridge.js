const mqtt = require('mqtt');
const fs = require('fs');

const LOCAL_MQTT_HOST = process.env.MQTT_HOST || 'localhost';
const LOCAL_MQTT_PORT = process.env.MQTT_PORT || '1883';
const LOCAL_MQTT_USER = process.env.MQTT_USERNAME || '';
const LOCAL_MQTT_PASS = process.env.MQTT_PASSWORD || '';

const HISENSE_MQTT_HOST = process.env.HISENSE_HOST || '192.168.2.150';
const HISENSE_MQTT_PORT = process.env.HISENSE_PORT || '36669';

const HISENSE_TOPIC_PREFIX = '/remoteapp/tv';

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

  const topic = remoteTopic('ui_service', 'sourceswitch');
  const payload = JSON.stringify({
    sourceid: src.sourceid,
    sourcename: src.sourcename,
    displayname: src.displayname,
    is_signal: 1,
    is_lock: 0,
    hotel_mode: 0
  });

  remoteClient.publish(topic, payload);
  console.log(`📤 Source switch: ${source} → ${topic}`);
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
    storeType: 99,
    move: true,
    appId: '110',
    name: 'Rutube',
    from: '',
    isunInstalled: false,
    isFav: true,
    httpIcon: 'data:image/png;base64,iconDownloadhttps://img.vidaahub.com/vidaa/2024/2/202402260758182936.png',
    url: 'url110'
  },

  lampa: {
    url: 'urlLampadebug',
    isunInstalled: true,
    name: 'Lampa',
    from: '',
    storeType: 98,
    appId: 'Lampadebug',
    move: true,
    isFav: true,
    httpIcon: 'data:image/png;base64,iconDownloadhttp://195.58.50.236/img/anb_lampa.png'
  },

  wink: {
    url: 'url2102',
    isunInstalled: false,
    name: 'Wink',
    from: '',
    storeType: 99,
    appId: '2102',
    move: true,
    isFav: true
  },

  ivi: {
    url: 'url53',
    isunInstalled: false,
    name: 'Иви',
    from: '',
    storeType: 98,
    appId: '53',
    move: true,
    isFav: true
  },

  vkvideo: {
    url: 'url2202',
    isunInstalled: false,
    name: 'VK Видео',
    from: '',
    storeType: 99,
    appId: '2202',
    move: true,
    isFav: true
  }
};

const keyMap = {
  home: 'KEY_HOME',
  back: 'KEY_BACK',
  ok: 'KEY_OK',
  enter: 'KEY_OK',
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

remoteClient.on('error', (err) => {
  console.log('❌ Hisense error:', err);
});

localClient.on('error', (err) => {
  console.log('❌ Local MQTT error:', err);
});

remoteClient.on('message', (topic, message) => {
  const text = message.toString();

  console.log(`📩 [${topic}] ${text}`);

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
