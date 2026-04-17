import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, firebaseConfig } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'owner' or other
  const [loading, setLoading] = useState(true);

  // Sign up
  async function signup(email, password, displayName, adminKey) {
    // Only allow owner registration with a specific secret key for now
    if (adminKey !== 'AdminS123') {
      throw new Error('Invalid Admin Key. You cannot register as an owner.');
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    
    // Save role to firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email,
      displayName,
      role: 'owner',
      createdAt: new Date().toISOString()
    });

    return userCredential;
  }

  // Create secondary account behind the scenes (for HR and Employees)
  async function createSecondaryAccount(email, password, displayName, role, extraData = {}) {
    if (!currentUser) throw new Error("Must be logged in to create accounts.");
    if (userRole !== 'owner' && userRole !== 'hr') throw new Error("Permission denied.");

    // Use Firebase REST API to create user without changing current auth state
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message || "Failed to create user account.");
    }

    const { localId: uid } = data;

    // Save profile data into Firestore (merge extra details)
    await setDoc(doc(db, 'users', uid), {
      email,
      displayName,
      role,
      createdAt: new Date().toISOString(),
      ...extraData
    });

    return uid;
  }

  // Login
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Logout
  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    let unsubscribeDoc = null;
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Sync role
        unsubscribeDoc = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUserRole(docSnap.data().role);
          } else {
            console.warn("User document not found.");
            setUserRole(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user role:", error);
          setUserRole(null);
          setLoading(false);
        });
      } else {
        setUserRole(null);
        setLoading(false);
        if (unsubscribeDoc) unsubscribeDoc();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const value = {
    currentUser,
    userRole,
    login,
    signup,
    logout,
    createSecondaryAccount
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
