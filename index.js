// index.js

require('dotenv').config();
const mqtt = require('mqtt');
const admin = require('firebase-admin');

// Load Firebase credentials from environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DB_URL,
});

const db = admin.database();

const mqttClient = mqtt.connect(process.env.MQTT_BROKER);
const mqttTopic = process.env.MQTT_TOPIC || 'sensor/data';

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  mqttClient.subscribe(mqttTopic, (err) => {
    if (err) console.error('Failed to subscribe:', err);
    else console.log(`Subscribed to topic: ${mqttTopic}`);
  });
});

mqttClient.on('message', (topic, message) => {
  try {
    const payload = message.toString().split(',');
    const [arus, tegangan, durasi] = payload.map(parseFloat);
    const timestamp = new Date().toISOString();

    const energi = arus * tegangan * (durasi / 3600); // Wh

    const dataRef = db.ref('sensor_log').push();
    dataRef.set({
      timestamp,
      arus,
      tegangan,
      durasi,
      energi
    });

    console.log(`Data disimpan ke Firebase:
  Arus: ${arus} A
  Tegangan: ${tegangan} V
  Durasi: ${durasi} s
  Energi: ${energi.toFixed(4)} Wh`);

  } catch (err) {
    console.error('Error parsing or saving data:', err);
  }
});
