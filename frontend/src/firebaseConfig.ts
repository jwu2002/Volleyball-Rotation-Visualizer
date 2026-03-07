import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDOV_6hv6jEhSxKr8cpBxkhmKVlOy-7dfI",
  authDomain: "volleyball-visualization.firebaseapp.com",
  projectId: "volleyball-visualization",
  storageBucket: "volleyball-visualization.firebasestorage.app",
  messagingSenderId: "982533496737",
  appId: "1:982533496737:web:3762717ae761b9c78075e0",
  measurementId: "G-RJ2YGBT8M4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
