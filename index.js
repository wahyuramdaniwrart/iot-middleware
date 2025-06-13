const mqtt = require('mqtt');
const admin = require('firebase-admin');
const express = require('express');
const app = express();

// === Firebase via ENV variable (FIREBASE_KEY as JSON string) ===
const firebasePrivate = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(firebasePrivate),
  databaseURL: "https://your-project-id.firebaseio.com"  // Ganti dengan URL Firebase kamu
});

const db = admin.database();

// === MQTT SETUP ===
const mqttClient = mqtt.connect('mqtt://mqtt.eclipseprojects.io');

mqttClient.on('connect', () => {
  console.log("✅ MQTT Connected");
  mqttClient.subscribe('sensor/#');
});

// === HANDLE INCOMING MQTT DATA ===
mqttClient.on('message', (topic, message) => {
  const payload = message.toString();
  const ref = db.ref("sensorData");

  if (topic === 'sensor/tegangan') {
    ref.child("tegangan").set(Number(payload));
  } else if (topic === 'sensor/arus') {
    ref.child("arus").set(Number(payload));
  } else if (topic === 'sensor/waktu') {
    ref.child("waktu").set(payload);
  } else if (topic === 'sensor/energi') {
    ref.child("energi").set(Number(payload));
  }
});

// === LISTEN TO FIREBASE COMMANDS ===
db.ref("perintah").on("value", snapshot => {
  const cmd = snapshot.val();
  if (cmd === "START" || cmd === "STOP") {
    console.log("🔁 Kirim perintah ke MQTT:", cmd);
    mqttClient.publish("sensor/control", cmd, { retain: true });
  }
});

// === Express Web Server (opsional untuk status) ===
app.get("/", (req, res) => {
  res.send("🔥 MQTT to Firebase Middleware Aktif");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Server berjalan di port ${PORT}`);
});
