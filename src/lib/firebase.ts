import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, doc, getDocFromServer } from "firebase/firestore";

// Config from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyAh7qsHrPvKWL9dCU_6zK8NoJ41FlCWd_Q",
  authDomain: "gen-lang-client-0639312500.firebaseapp.com",
  projectId: "gen-lang-client-0639312500",
  storageBucket: "gen-lang-client-0639312500.firebasestorage.app",
  messagingSenderId: "472895977859",
  appId: "1:472895977859:web:b336cb89a0741ba67f1eb6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, "ai-studio-94a6a521-af2d-4be8-8cc4-a0e78ad66030");

// Verify Firestore connectivity on start
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("Firebase connection initialized successfully.");
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Please check your Firebase configuration: Client is offline.");
    } else {
      console.log("Firebase initialized (offline capability active).", error);
    }
  }
}
testConnection();
