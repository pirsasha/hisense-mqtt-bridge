const mqtt = require("mqtt");
const fs = require("fs");

const options = {
  host: "192.168.2.150",
  port: 36669,
  protocol: "mqtts",
  clientId: "mqtt-explorer-6ac7432f",
  username: "hisenseservice",
  password: "multimqttservice",
  cert: fs.readFileSync("/ssl/rcm_certchain_pem.cer"),
  key: fs.readFileSync("/ssl/rcm_pem_privkey.pkcs8"),
  rejectUnauthorized: false
};

const client = mqtt.connect(options);

client.on("connect", () => {
  console.log("✅ Connected to Hisense MQTT");
  client.subscribe("#", (err) => {
    if (err) {
      console.log("❌ Subscribe error:", err);
    } else {
      console.log("📡 Subscribed to all topics");
    }
  });
});

client.on("message", (topic, message) => {
  console.log(`📩 [${topic}] ${message.toString()}`);
});

client.on("error", (err) => {
  console.error("❌ Connection error:", err);
});