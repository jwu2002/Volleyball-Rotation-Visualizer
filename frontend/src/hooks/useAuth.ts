import { useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  EmailAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  linkWithPopup,
  signInWithCredential,
  linkWithCredential,
} from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "../firebaseConfig";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        if (!u) {
          const cred = await signInAnonymously(auth);
          setUser(cred.user);
        } else {
          setUser(u);
        }
      } catch (err) {
        console.error("Auth error:", err);
      }
    });
    return () => unsub();
  }, []);

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.isAnonymous) {
        try {
          const result = await linkWithPopup(currentUser, provider);
          console.log("✅ Linked anonymous account to Google:", result.user.uid);
          alert("Linked this session to your Google account!");
        } catch (err: unknown) {
          const e = err as { code?: string };
          console.warn("Link with Google failed:", e?.code, err);
          if (
            e?.code === "auth/credential-already-in-use" ||
            e?.code === "auth/account-exists-with-different-credential"
          ) {
            const cred = GoogleAuthProvider.credentialFromError(err as unknown as Parameters<typeof GoogleAuthProvider.credentialFromError>[0]);
            if (cred) {
              const res = await signInWithCredential(auth, cred);
              console.log("✅ Signed in with existing Google account:", res.user.uid);
              alert("Signed in with your existing Google account.");
            } else {
              const res = await signInWithPopup(auth, provider);
              console.log("✅ Signed in with Google via popup:", res.user.uid);
              alert("Signed in with Google.");
            }
          } else if (e?.code === "auth/popup-closed-by-user") {
            return;
          } else {
            throw err;
          }
        }
      } else {
        const res = await signInWithPopup(auth, provider);
        console.log("✅ Signed in with Google:", res.user.uid);
        alert("Signed in with Google.");
      }
      setShowAccountMenu(false);
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      console.error("🔥 Google sign-in error:", err);
      alert(`Google sign-in failed: ${e?.code || e?.message || "Unknown error"}`);
    }
  };

  const handleEmailSignUp = async () => {
    try {
      if (!email || !password) {
        alert("Please enter email and password.");
        return;
      }
      const cred = EmailAuthProvider.credential(email, password);
      if (user && user.isAnonymous) {
        await linkWithCredential(user, cred);
        alert("Account created and linked to this session!");
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("Account created!");
      }
      setEmail("");
      setPassword("");
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code === "auth/email-already-in-use") {
        alert("That email is already in use. Try 'Sign in with email' instead.");
      } else {
        console.error("Email sign-up error:", err);
        alert("Email sign-up failed. Check console for details.");
      }
    }
  };

  const handleEmailSignIn = async () => {
    try {
      if (!email || !password) {
        alert("Please enter email and password.");
        return;
      }
      await signInWithEmailAndPassword(auth, email, password);
      alert("Signed in with email.");
      setEmail("");
      setPassword("");
    } catch (err) {
      console.error("Email sign-in error:", err);
      alert("Email sign-in failed. Check email/password and try again.");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error("Sign-out error:", err);
    }
  };

  return {
    user,
    email,
    setEmail,
    password,
    setPassword,
    showAccountMenu,
    setShowAccountMenu,
    handleGoogleSignIn,
    handleEmailSignUp,
    handleEmailSignIn,
    handleSignOut,
  };
}
