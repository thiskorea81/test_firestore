import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // 추가됨

const firebaseConfig = {
  apiKey: "YourApiKey",
  authDomain: "teacherdiary-f2ddb.firebaseapp.com",
  projectId: "teacherdiary-f2ddb",
  storageBucket: "teacherdiary-f2ddb.firebasestorage.app",
  messagingSenderId: "318404667697",
  appId: "1:318404667697:web:5649d7d193340081572810",
  measurementId: "G-KWQSVBFBYP"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // 추가됨

// 로컬 테스트용 ID 고정
const getAppId = () => {
  return 'teacher-diary-test'; 
};

export { app, analytics, auth, db, storage, getAppId };