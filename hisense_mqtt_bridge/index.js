const mqtt = require("mqtt");
const fs = require("fs");

// Загрузка конфигурации
const config = JSON.parse(fs.readFileSync("/data/options.json", "utf8"));

// Hisense MQTT (TLS)
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

// Home Assistant MQTT
const localClient = mqtt.connect({
  host: config.mqtt_host || "localhost",
  port: config.mqtt_port || 1883,
  username: config.mqtt_username,
  password: config.mqtt_password
});

// От Hisense к HA
hisenseClient.on("connect", () => {
  console.log("✅ Connected to Hisense MQTT");
  hisenseClient.subscribe("#", (err) => {
    if (err) console.log("❌ Subscribe error:", err);
    else console.log("📡 Subscribed to all topics");
  });
});

hisenseClient.on("message", (topic, message) => {
  const payload = message.toString();
  const cleanTopic = topic.startsWith("/") ? topic.slice(1) : topic;
  console.log(`📩 [${topic}] ${payload}`);
  localClient.publish(`hisense/${cleanTopic}`, payload);
});

// От HA к Hisense
localClient.on("connect", () => {
  console.log("✅ Connected to local MQTT");
  localClient.subscribe("hisense/command", (err) => {
    if (err) console.error("❌ Error subscribing to hisense/command:", err);
    else console.log("📥 Subscribed to hisense/command");
  });
});

localClient.on("message", (topic, message) => {
  const command = message.toString().trim();
  if (topic === "hisense/command") {
    const payload = JSON.stringify({ keycode: command });
    hisenseClient.publish("/remoteapp/mobile/request/keyevent", payload);
    console.log(`📤 Sent command to Hisense: ${command}`);
  }
});

hisenseClient.on("error", (err) => console.error("❌ Hisense error:", err));
localClient.on("error", (err) => console.error("❌ Local MQTT error:", err));