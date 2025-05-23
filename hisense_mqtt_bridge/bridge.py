import ssl
import time
import paho.mqtt.client as mqtt

MQTT_HOST = "192.168.2.150"
MQTT_PORT = 36669
MQTT_USER = "hisenseservice"
MQTT_PASS = "multimqttservice"

def on_connect(client, userdata, flags, rc):
    print("✅ Connected with result code", rc)
    client.subscribe("RemoteControl/Status")

def on_message(client, userdata, msg):
    print(f"📩 Message from {msg.topic}: {msg.payload.decode()}")

client = mqtt.Client()
client.username_pw_set(MQTT_USER, MQTT_PASS)

# Используем client cert/key, но отключаем валидацию сервера
client.tls_set(
    ca_certs=None,
    certfile="/ssl/rcm_certchain_pem.cer",
    keyfile="/ssl/rcm_pem_privkey.pkcs8",
    tls_version=ssl.PROTOCOL_TLS_CLIENT
)
client.tls_insecure_set(True)

client.on_connect = on_connect
client.on_message = on_message

try:
    print("🔗 Подключаюсь к MQTT...")
    client.connect(MQTT_HOST, MQTT_PORT)
    client.loop_forever()
except Exception as e:
    print("❌ Ошибка подключения:", e)
