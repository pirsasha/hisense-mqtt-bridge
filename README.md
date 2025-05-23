# 📺 Hisense MQTT Bridge (Toshiba / Hisense VIDAA)

MQTT-бридж для управления телевизорами **Hisense и Toshiba** (на платформе VIDAA) из Home Assistant.

Позволяет:
- 📡 Чтение состояний с TV (источник, запущенное приложение, громкость, capabilities)
- 📤 Отправка команд (например, `KEY_HOME`, `KEY_VOLUP`)
- 🧠 Автоматическое определение `UUID` телевизора
- 🔗 Проброс сообщений из Hisense MQTT в локальный брокер (Mosquitto)
- 🧪 Возможность использовать Home Assistant автоматизации

---

## 🚀 Возможности

### ✅ Двусторонний MQTT-мост:
- Подключение к **Hisense MQTT-брокеру** (порт `36669`) по TLS с сертификатами
- Подключение к **локальному Mosquitto в Home Assistant**
- Все данные от Hisense ретранслируются в `hisense/`-топики

### 🔁 Управление телевизором:
- Отправка команд в топик `hisense/command`
- Автоматическая маршрутизация в правильный MQTT-топик:
  ```
  /remoteapp/tv/remote_service/<uuid>$vidaa_common/actions/sendkey
  ```

- Поддержка команд:  
  `KEY_HOME`, `KEY_VOLUP`, `KEY_POWER`, `KEY_LEFT`, `KEY_RIGHT`, `KEY_OK`, `KEY_BACK` и др.

### 📡 Чтение состояния:
- Запущенное приложение:  
  ```json
  {"statetype":"app","name":"kinopoisk","url":"..."}
  ```

- Источник HDMI, статус сигнала, capabilities, sourcelist и многое другое

---

## ⚙️ Установка

1. Склонируй репозиторий или добавь его в Home Assistant:
   ```
   https://github.com/USERNAME/hisense-mqtt-bridge
   ```

2. В интерфейсе Home Assistant перейди в:
   ```
   Настройки → Дополнения → Добавить по ссылке (репозиторий)
   ```

3. Установи `Hisense MQTT Bridge`, заполни параметры подключения к Mosquitto:

   ```json
   {
     "mqtt_host": "АДРЕС_МОСКИТО_БРОКЕРА",
     "mqtt_port": 1883,
     "mqtt_username": "ИМЯ_ПОЛЬЗОВАТЕЛЯ",
     "mqtt_password": "ПАРОЛЬ"
   }
   ```

4. Помести в `/ssl/` сертификаты (для подключения к Hisense MQTT):
   - `rcm_certchain_pem.cer`
   - `rcm_pem_privkey.pkcs8`

---

## 🔍 Сенсоры и автоматизация

### Сенсор активного приложения:
```yaml
sensor:
  - platform: mqtt
    name: Запущенное приложение на ТВ
    state_topic: "hisense/remoteapp/mobile/broadcast/ui_service/state"
    value_template: >
      {% if value_json.statetype == "app" %}
        {{ value_json.name }}
      {% else %}
        None
      {% endif %}
```

### Автоматизация:
```yaml
automation:
  - alias: "Выключить свет если не играет YouTube"
    trigger:
      - platform: state
        entity_id: binary_sensor.motion_livingroom
        to: "on"
    condition:
      - condition: not
        conditions:
          - condition: state
            entity_id: sensor.zapushchennoe_prilozhenie_na_tv
            state: "youtube"
    action:
      - service: light.turn_off
        target:
          entity_id: light.tv_backlight
```

---

## 📜 Лицензия

MIT — используй, расширяй и адаптируй под свои нужды.

---

## 🙌 Автор

Разработка: [Александр Пирогов](https://t.me/pirogovc)  
Проект сделан с любовью к умным домам, Home Assistant и VIDAA.
