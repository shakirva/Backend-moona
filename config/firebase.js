// config/firebase.js
const admin = require("firebase-admin");
const serviceAccount = require("./firebaseServiceKey.json"); // downloaded from Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
