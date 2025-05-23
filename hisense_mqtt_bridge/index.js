const mqtt = require("mqtt");
const fs = require("fs");

// Загрузка конфигурации из options.json
const config = JSON.parse(fs.readFileSync("/data/options.json", "utf8"));

// Подключение к Hisense MQTT
const hisenseOptions = {
  host: "192.168.2.150",
  port: 36669,
  protocol: "mqtts",
  clientId: "mqtt-explorer-" + Math.random().toString(16).substr(2, 8),
  username: "hisenseservice",
  password: "multimqttservice",
  cert: fs.readFileSync("/ssl/rcm_certchain_pem.cer"),
  key: fs.readFileSync("/ssl/rcm_pem_privkey.pkcs8"),
  rejectUnauthorized: false
};

const hisenseClient = mqtt.connect(hisenseOptions);

// Подключение к локальному MQTT
const localClient = mqtt.connect({
  host: config.mqtt_host || "localhost",
  port: config.mqtt_port || 1883,
  username: config.mqtt_username,
  password: config.mqtt_password
});

hisenseClient.on("connect", () => {
  console.log("✅ Connected to Hisense MQTT");
  hisenseClient.subscribe("#", (err) => {
    if (err) console.log("❌ Subscribe error:", err);
    else console.log("📡 Subscribed to all topics");
  });
});

hisenseClient.on("message", (topic, message) => {
  const payload = message.toString();
  console.log(`📩 [${topic}] ${payload}`);
  localClient.publish(`hisense/${topic}`, payload);
});

hisenseClient.on("error", (err) => {
  console.error("❌ Connection error:", err);
});