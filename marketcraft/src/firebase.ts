import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB-TnqWmxfZZaAbECZh9HaGWi8GfrPO7HQ",
  authDomain: "marketcraft-app.firebaseapp.com",
  projectId: "marketcraft-app",
  storageBucket: "marketcraft-app.firebasestorage.app",
  messagingSenderId: "10800568456",
  appId: "1:10800568456:web:4caa9e429dc5da1225273d",
  measurementId: "G-RP3ZZ4YN0Q"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// Helper to create/update user data
export async function initializeUser(userId: string, userName: string, userEmail: string) {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // New user: Set starting balance in MMF
    await setDoc(userRef, {
      name: userName,
      email: userEmail,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      portfolio: {
        mmf: { // Money Market Fund (cash)
          value: 10000.00,
          interestRate: 0, // We'll update via API later
          lastUpdated: serverTimestamp()
        },
        positions: [], // Array of {symbol, quantity, avgCost, etc.}
        closedPositions: [] // Array of {symbol, cost, proceeds, gainLoss, dateSold}
      }
    });
  } else {
    // Existing user: Check daily bonus (Pacific Time)
    const data = userSnap.data();
    const lastLogin = data.lastLogin.toDate();
    const now = new Date();
    const pstOffset = -7 * 60; // Pacific Time UTC offset (adjust for DST if needed, but simple for now)
    const lastLoginPST = new Date(lastLogin.getTime() + pstOffset * 60 * 1000);
    const nowPST = new Date(now.getTime() + pstOffset * 60 * 1000);

    if (nowPST.getTime() - lastLoginPST.getTime() >= 24 * 60 * 60 * 1000) {
      // Add $10 bonus to MMF
      await updateDoc(userRef, {
        'portfolio.mmf.value': data.portfolio.mmf.value + 10.00,
        lastLogin: serverTimestamp()
      });
    } else {
      // Just update lastLogin
      await updateDoc(userRef, { lastLogin: serverTimestamp() });
    }
  }
}