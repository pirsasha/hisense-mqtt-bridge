const mqtt = require("mqtt");
const fs = require("fs");

const config = JSON.parse(fs.readFileSync("/data/options.json", "utf8"));

const hisenseClient = mqtt.connect({
  host: "192.168.2.150",
  port: 36669,
  protocol: "mqtts",
  clientId: "mqtt-explorer-" + Math.random().toString(16).substr(2, 8),
  username: "hisenseservice",
  password: "multimqttservice",
  cert: fs.readFileSync("/ssl/rcm_certchain_pem.cer"),
  key: fs.readFileSync("/ssl/rcm_pem_privkey.pkcs8"),
  rejectUnauthorized: false
});

const localClient = mqtt.connect({
  host: config.mqtt_host || "localhost",
  port: config.mqtt_port || 1883,
  username: config.mqtt_username,
  password: config.mqtt_password
});

let hisenseUUID = null;

// UUID из логов приложения для changesource / sendkey
const SOURCE_UUID = "f1:39:b0:73:5a:ad";

function sendKey(keycode) {
  const targetTopic = `/remoteapp/tv/remote_service/${SOURCE_UUID}$vidaa_common/actions/sendkey`;
  hisenseClient.publish(targetTopic, keycode);
  console.log(`📤 Sent key: ${keycode} → ${targetTopic}`);
}

function launchApp(appPayload) {
  const appTopic = `/remoteapp/tv/ui_service/${hisenseUUID}$vidaa_common/actions/launchapp`;
  hisenseClient.publish(appTopic, JSON.stringify(appPayload));
  console.log(`📤 Launched app: ${appPayload.name} → ${appTopic}`);
}

function switchSource(source) {
  const sourceMap = {
    hdmi1: {
      displayname: "HDMI1",
      displayname2: "",
      has_signal: "1",
      hotel_mode: "0",
      httpIcon: "",
      is_lock: "0",
      is_signal: "1",
      sourceid: "HDMI1",
      sourcename: "HDMI1"
    },
    hdmi2: {
      displayname: "HDMI2",
      displayname2: "AX 3100G",
      has_signal: "0",
      hotel_mode: "0",
      httpIcon: "",
      is_lock: "0",
      is_signal: "0",
      sourceid: "HDMI2",
      sourcename: "HDMI2"
    },
    hdmi3: {
      displayname: "HDMI3",
      displayname2: "",
      has_signal: "0",
      hotel_mode: "0",
      httpIcon: "",
      is_lock: "0",
      is_signal: "0",
      sourceid: "HDMI3",
      sourcename: "HDMI3"
    },
    tv: {
      displayname: "TV",
      displayname2: "",
      has_signal: "0",
      hotel_mode: "0",
      httpIcon: "",
      is_lock: "0",
      is_signal: "0",
      sourceid: "TV",
      sourcename: "TV"
    },
    av: {
      displayname: "AV",
      displayname2: "",
      has_signal: "0",
      hotel_mode: "0",
      httpIcon: "",
      is_lock: "0",
      is_signal: "0",
      sourceid: "AVS",
      sourcename: "AV"
    }
  };

  const src = sourceMap[source];

  if (!src) {
    console.warn("⚠️ Неизвестный источник:", source);
    return;
  }

  const topic = `/remoteapp/tv/ui_service/${SOURCE_UUID}$vidaa_common/actions/changesource`;
  hisenseClient.publish(topic, JSON.stringify(src));

  console.log(`📤 Change source: ${source} → ${topic}`);
}

function changeVolume(code) {
  const topic = `/remoteapp/tv/platform_service/${SOURCE_UUID}$vidaa_common/actions/changevolume`;
  hisenseClient.publish(topic, String(code));
  console.log(`🔊 Change volume: ${code} → ${topic}`);
}

const apps = {
  youtube: {
    appId: "3",
    name: "YouTube",
    provider: 0,
    storeType: 98,
    url: "url3",
    urlType: 0
  },

  rutube: {
    storeType: 99,
    move: true,
    appId: "110",
    name: "Rutube",
    from: "",
    isunInstalled: false,
    isFav: true,
    httpIcon: "data:image/png;base64,iconDownloadhttps://img.vidaahub.com/vidaa/2024/2/202402260758182936.png",
    url: "url110"
  },

  kinopoisk: {
    appId: "1509",
    name: "Кинопоиск",
    provider: 0,
    storeType: 99,
    url: "url1509",
    urlType: 0
  },

  lampa: {
    url: "urlLampadebug",
    isunInstalled: true,
    name: "Lampa",
    from: "",
    storeType: 98,
    appId: "Lampadebug",
    move: true,
    isFav: true,
    httpIcon: "data:image/png;base64,iconDownloadhttp://195.58.50.236/img/anb_lampa.png"
  },

  wink: {
    url: "url2102",
    isunInstalled: false,
    name: "Wink",
    from: "",
    storeType: 99,
    appId: "2102",
    move: true,
    isFav: true
  },

  ivi: {
    url: "url53",
    isunInstalled: false,
    name: "Иви",
    from: "",
    storeType: 98,
    appId: "53",
    move: true,
    isFav: true
  },

  vkvideo: {
    url: "url2202",
    isunInstalled: false,
    name: "VK Видео",
    from: "",
    storeType: 99,
    appId: "2202",
    move: true,
    isFav: true
  }
};

const keyMap = {
  home: "KEY_HOME",
  back: "KEY_RETURNS",
  return: "KEY_RETURNS",

  ok: "KEY_OK",
  enter: "KEY_OK",

  up: "KEY_UP",
  down: "KEY_DOWN",
  left: "KEY_LEFT",
  right: "KEY_RIGHT",

  power: "KEY_POWER",
  poweroff: "KEY_POWER",

  menu: "KEY_MENU",
  source: "KEY_SOURCE",

  volume_up: "KEY_VOLUMEUP",
  vol_up: "KEY_VOLUMEUP",
  volume_down: "KEY_VOLUMEDOWN",
  vol_down: "KEY_VOLUMEDOWN",
  mute: "KEY_MUTE",

  play: "KEY_PLAY",
  pause: "KEY_PAUSE",
  stop: "KEY_STOP"
};

hisenseClient.on("connect", () => {
  console.log("✅ Connected to Hisense MQTT");
  hisenseClient.subscribe("#", () => console.log("📡 Subscribed to all topics"));
});

hisenseClient.on("message", (topic, message) => {
  const payload = message.toString();
  const cleanTopic = topic.startsWith("/") ? topic.slice(1) : topic;

  console.log(`📩 [${topic}] ${payload}`);

  localClient.publish(`hisense/${cleanTopic}`, payload, { retain: true });

  if (topic.endsWith("uuidlist/data")) {
    try {
      const uuids = JSON.parse(payload);
      const found = uuids.find((u) => u.uuid && u.uuid.includes(":"));

      if (found) {
        hisenseUUID = found.uuid;
        console.log(`🔑 Hisense UUID найден: ${hisenseUUID}`);
      }
    } catch (e) {
      console.error("❌ Ошибка парсинга uuidlist:", e.message);
    }
  }
});

localClient.on("connect", () => {
  console.log("✅ Connected to local MQTT");
  localClient.subscribe("hisense/command", (err) => {
    if (!err) console.log("📥 Subscribed to hisense/command");
  });
});

localClient.on("message", (topic, message) => {
  const command = message.toString().trim();

  if (topic !== "hisense/command") return;

  if (!hisenseUUID) {
    console.warn("⚠️ UUID ещё не получен. Команда не отправлена.");
    return;
  }

  console.log(`📥 Local command: ${command}`);

  if (command.startsWith("KEY_")) {
    sendKey(command);
    return;
  }

  try {
    const obj = JSON.parse(command);

    if (obj.launch && apps[obj.launch]) {
      launchApp(apps[obj.launch]);
      return;
    }

    if (obj.source) {
      switchSource(String(obj.source).toLowerCase());
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

    if (obj.volume === "up") {
      changeVolume(102);
      return;
    }

    if (obj.volume === "down") {
      changeVolume(101);
      return;
    }

    if (typeof obj.volume === "number") {
      const volTopic = `/remoteapp/mobile/broadcast/platform_service/actions/volumechange`;
      const volPayload = {
        volume_type: 1,
        volume_value: obj.volume
      };

      hisenseClient.publish(volTopic, JSON.stringify(volPayload));
      console.log(`🔊 Volume set to ${obj.volume} → ${volTopic}`);
      return;
    }

    if (obj.mute === true) {
      sendKey("KEY_MUTE");
      return;
    }

    if (obj.power === "toggle") {
      sendKey("KEY_POWER");
      return;
    }

    console.warn("⚠️ Unknown command:", obj);
  } catch (e) {
    sendKey(command);
  }
});

hisenseClient.on("error", (err) => console.error("❌ Hisense error:", err));
localClient.on("error", (err) => console.error("❌ Local MQTT error:", err));
