// Import necessary Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBUYkptzOR6CigaN38SeFislLsLltTsqM0",
  authDomain: "pydahticket.firebaseapp.com",
  projectId: "pydahticket",
  storageBucket: "pydahticket.firebasestorage.app",
  messagingSenderId: "14405900912",
  appId: "1:14405900912:web:1ecc1781a298d461eab2b5",
  measurementId: "G-KMCC4KG3JK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export the Firebase services
export { auth, db };
