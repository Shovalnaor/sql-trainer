// Cross-device sync is OFF until this file holds a real Firebase config.
// Leave it as is and the trainer keeps working on this device only.
//
// To turn it on (about five minutes, free tier):
//   1. console.firebase.google.com  ->  Add project  ->  skip Analytics
//   2. Build  ->  Firestore Database  ->  Create database  ->  Production mode
//   3. Build  ->  Authentication  ->  Get started  ->  enable Google
//   4. Authentication  ->  Settings  ->  Authorized domains  ->  add shovalnaor.github.io
//   5. Project settings  ->  Your apps  ->  Web  ->  register, then copy the config here
//   6. Firestore  ->  Rules  ->  paste the contents of firestore.rules  ->  Publish
//
// These values are identifiers, not secrets: Google documents the web API key as safe
// to embed in client code. What protects the data is firestore.rules.
window.SYNC_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};
