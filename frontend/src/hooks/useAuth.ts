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

type ToastType = "success" | "error" | "info";

export function useAuth(options?: { showToast: (message: string, type?: ToastType) => void }) {
  const showToast = options?.showToast ?? ((msg: string) => alert(msg));
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
          showToast("Account linked to Google.", "success");
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
              showToast("Signed in with your existing Google account.", "success");
            } else {
              const res = await signInWithPopup(auth, provider);
              console.log("✅ Signed in with Google via popup:", res.user.uid);
              showToast("Signed in with Google.", "success");
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
        showToast("Signed in with Google.", "success");
      }
      setShowAccountMenu(false);
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      console.error("🔥 Google sign-in error:", err);
      showToast(`Sign-in failed: ${e?.code || e?.message || "Unknown error"}`, "error");
    }
  };

  const handleEmailSignUp = async () => {
    try {
      if (!email || !password) {
        showToast("Please enter email and password.", "info");
        return;
      }
      const cred = EmailAuthProvider.credential(email, password);
      if (user && user.isAnonymous) {
        await linkWithCredential(user, cred);
        showToast("Account created and linked to this session.", "success");
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        showToast("Account created.", "success");
      }
      setEmail("");
      setPassword("");
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code === "auth/email-already-in-use") {
        showToast("That email is already in use. Try 'Sign in with email' instead.", "error");
      } else {
        console.error("Email sign-up error:", err);
        showToast("Sign-up failed. Check email and try again.", "error");
      }
    }
  };

  const handleEmailSignIn = async () => {
    try {
      if (!email || !password) {
        showToast("Please enter email and password.", "info");
        return;
      }
      await signInWithEmailAndPassword(auth, email, password);
      showToast("Signed in with email.", "success");
      setEmail("");
      setPassword("");
    } catch (err) {
      console.error("Email sign-in error:", err);
      showToast("Sign-in failed. Check email and password.", "error");
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
