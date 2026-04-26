import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDj_gVw3drdiflJIPAYr45jVJDQ9HJyjXU",
  authDomain: "fir-otp-app-8e6d8.firebaseapp.com",
  projectId: "fir-otp-app-8e6d8",
  storageBucket: "fir-otp-app-8e6d8.firebasestorage.app",
  messagingSenderId: "386329202609",
  appId: "1:386329202609:web:21552c6f0f8cb59422b790",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;