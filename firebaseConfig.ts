import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object
const firebaseConfig = {
  apiKey: "AIzaSyAfblL6ebyIOZOCxFPi37WVD2sZVF8klz8",
  authDomain: "saglikprofilideneme.firebaseapp.com",
  databaseURL: "https://saglikprofilideneme-default-rtdb.firebaseio.com",
  projectId: "saglikprofilideneme",
  storageBucket: "saglikprofilideneme.firebasestorage.app",
  messagingSenderId: "276541545104",
  appId: "1:276541545104:web:af4cf76dae26fe2d0d1615",
  measurementId: "G-E2XDRPF3TC"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);

// Initialize Services
export const auth = app.auth();
export const db = app.firestore();
export default app;