import ssl
import time
import paho.mqtt.client as mqtt

MQTT_HOST = "192.168.2.150"
MQTT_PORT = 36669

def on_connect(client, userdata, flags, rc):
    print("✅ Connected with result code", rc)
    client.subscribe("RemoteControl/Status")

def on_message(client, userdata, msg):
    print(f"📩 Message from {msg.topic}: {msg.payload.decode()}")

client = mqtt.Client()
client.tls_set(
    ca_certs=None,
    certfile="/ssl/rcm_certchain_pem.cer",
    keyfile="/ssl/rcm_pem_privkey.pkcs8",
    tls_version=ssl.PROTOCOL_TLS_CLIENT
)
client.tls_insecure_set(True)  # <--- вот это

client.on_connect = on_connect
client.on_message = on_message

try:
    client.connect(MQTT_HOST, MQTT_PORT)
    client.loop_forever()
except Exception as e:
    print("❌ Ошибка подключения:", e)
