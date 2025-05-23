const mqtt = require("mqtt");
const fs = require("fs");

const options = {
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

const hisenseClient = mqtt.connect(options);
const localClient = mqtt.connect("mqtt://localhost:1883");

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