
const mqtt = require("mqtt");
const fs = require("fs");

// Конфиг HA MQTT
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

hisenseClient.on("connect", () => {
  console.log("✅ Connected to Hisense MQTT");
  hisenseClient.subscribe("#", () => console.log("📡 Subscribed to all topics"));
});

hisenseClient.on("message", (topic, message) => {
  const payload = message.toString();
  const cleanTopic = topic.startsWith("/") ? topic.slice(1) : topic;
  console.log(`📩 [${topic}] ${payload}`);
  localClient.publish(`hisense/${cleanTopic}`, payload);

  if (topic.endsWith("uuidlist/data")) {
    try {
      const uuids = JSON.parse(payload);
      const found = uuids.find(u => u.uuid && u.uuid.includes(":"));
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

  if (topic === "hisense/command") {
    if (!hisenseUUID) {
      console.warn("⚠️ UUID ещё не получен. Команда не отправлена.");
      return;
    }

    try {
      const obj = JSON.parse(command);

      if (obj.launch === "kinopoisk") {
        const appTopic = `/remoteapp/tv/ui_service/${hisenseUUID}$vidaa_common/actions/launchapp`;
        const appPayload = {
          appId: "1509",
          name: "Кинопоиск",
          provider: 0,
          storeType: 99,
          url: "url1509",
          urlType: 0
        };
        hisenseClient.publish(appTopic, JSON.stringify(appPayload));
        console.log(`📤 Launched app: Кинопоиск → ${appTopic}`);
        return;
      } else if (obj.launch === "youtube") {
        const appTopic = `/remoteapp/tv/ui_service/${hisenseUUID}$vidaa_common/actions/launchapp`;
        const appPayload = {
          appId: "3",
          name: "YouTube",
          provider: 0,
          storeType: 98,
          url: "url3",
          urlType: 0
        };
        hisenseClient.publish(appTopic, JSON.stringify(appPayload));
        console.log(`📤 Launched app: YouTube → ${appTopic}`);
        return;
      } else if (typeof obj.volume === "number") {
        const volTopic = `/remoteapp/mobile/broadcast/platform_service/actions/volumechange`;
        const volPayload = {
          volume_type: 1,
          volume_value: obj.volume
        };
        hisenseClient.publish(volTopic, JSON.stringify(volPayload));
        console.log(`🔊 Volume set to ${obj.volume} → ${volTopic}`);
        return;
      }
    } catch (e) {
      // не JSON — команда типа KEY_HOME
    }

    const targetTopic = `/remoteapp/tv/remote_service/${hisenseUUID}$vidaa_common/actions/sendkey`;
    hisenseClient.publish(targetTopic, command);
    console.log(`📤 Sent command: ${command} → ${targetTopic}`);
  }
});

hisenseClient.on("error", (err) => console.error("❌ Hisense error:", err));
localClient.on("error", (err) => console.error("❌ Local MQTT error:", err));
