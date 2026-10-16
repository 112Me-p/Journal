// 1) Create a Firebase project at https://console.firebase.google.com/
// 2) Add a Web App and paste its config values below.
// 3) Enable Authentication > Sign-in method > Google.
// 4) Create Firestore Database and publish the security rules from README.md.
// Leave placeholders unchanged to use local demo mode (no Google login / cloud sync).
export const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_FIREBASE_APP_ID"
};
export const isFirebaseConfigured = !Object.values(firebaseConfig).some(v => String(v).startsWith("YOUR_"));
