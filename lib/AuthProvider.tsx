"use client";

/**
 * AuthProvider.tsx
 * Full auth context: Email/Password sign-up & sign-in, Google OAuth,
 * sign-out, Firestore profile sync, and geolocation integration.
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "./firebase";
import {
  detectLocation,
  getCachedLocation,
  setCachedLocation,
  clearCachedLocation,
  buildManualLocation,
  LocationData,
} from "./locationService";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  location: string; // human-readable "City, State"
  locationData?: LocationData;
  farmArea?: number;
  crops?: string[];
  createdAt: string;
  lastWeather?: any;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  locationLoading: boolean;
  locationError: string | null;
  // Auth actions
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  // Profile actions
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  syncWeather: (weather: any) => Promise<void>;
  refreshLocation: () => Promise<void>;
  setManualLocation: (cityState: string) => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  locationLoading: false,
  locationError: null,
  signUp: async () => {},
  signIn: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  updateProfile: async () => {},
  syncWeather: async () => {},
  refreshLocation: async () => {},
  setManualLocation: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// ─── Helper: create/update Firestore doc ─────────────────────────────────────

async function upsertUserDoc(
  uid: string,
  data: Partial<UserProfile>
): Promise<void> {
  try {
    const ref = doc(db, "users", uid);
    await setDoc(ref, data, { merge: true });
  } catch (err) {
    console.warn("Firestore upsert failed (likely permissions):", err);
    // During pitch, we don't want to crash if rules are misconfigured
  }
}

async function fetchUserDoc(uid: string): Promise<UserProfile | null> {
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as UserProfile) : null;
  } catch (err) {
    console.warn("Firestore fetch failed (likely permissions):", err);
    return null;
  }
}

// ─── Provider ────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // ── Internal: initialise profile for a newly authenticated user ───────────
  const initProfile = async (firebaseUser: User): Promise<UserProfile> => {
    const existing = await fetchUserDoc(firebaseUser.uid);
    if (existing) return existing;

    // Try to get location from cache first (fast path)
    const cached = getCachedLocation();
    const locationDisplay = cached?.display ?? "India";

    const newProfile: UserProfile = {
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName ?? "Farmer",
      email: firebaseUser.email ?? "",
      location: locationDisplay,
      locationData: cached ?? undefined,
      farmArea: 2.5,
      crops: ["Wheat", "Rice"],
      createdAt: new Date().toISOString(),
    };

    await upsertUserDoc(firebaseUser.uid, newProfile);
    return newProfile;
  };

  // ── Auto-detect location and sync ─────────────────────────────────────────
  const detectAndSaveLocation = async (uid: string) => {
    setLocationLoading(true);
    setLocationError(null);
    try {
      const loc = await detectLocation();
      setCachedLocation(loc);
      const update: Partial<UserProfile> = {
        location: loc.display,
        locationData: loc,
      };
      await upsertUserDoc(uid, update);
      setProfile((prev) => prev ? { ...prev, ...update } : prev);
    } catch (err: any) {
      const msg = err.message ?? "Location detection failed";
      setLocationError(msg);
      // Don't overwrite existing location on failure
    } finally {
      setLocationLoading(false);
    }
  };

  // ── Sign Up ────────────────────────────────────────────────────────────────
  const signUp = async (email: string, password: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await firebaseUpdateProfile(cred.user, { displayName: name });
    const newProfile: UserProfile = {
      uid: cred.user.uid,
      displayName: name,
      email,
      location: "India",
      farmArea: 2.5,
      crops: ["Wheat", "Rice"],
      createdAt: new Date().toISOString(),
    };
    try {
      await upsertUserDoc(cred.user.uid, newProfile);
    } catch {
      console.warn("Firestore save failed, degrading gracefully.");
    }
    setProfile(newProfile);
    // Fire geolocation after account creation (non-blocking)
    detectAndSaveLocation(cred.user.uid);
  };

  // ── Sign In (email/password) ───────────────────────────────────────────────
  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged listener picks up the rest
  };

  // ── Google Sign-In ────────────────────────────────────────────────────────
  const signInWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    try {
      const existing = await fetchUserDoc(cred.user.uid);
      if (!existing) {
        const newProfile: UserProfile = {
          uid: cred.user.uid,
          displayName: cred.user.displayName ?? "Farmer",
          email: cred.user.email ?? "",
          location: "India",
          farmArea: 2.5,
          crops: ["Wheat", "Rice"],
          createdAt: new Date().toISOString(),
        };
        await upsertUserDoc(cred.user.uid, newProfile);
        setProfile(newProfile);
        detectAndSaveLocation(cred.user.uid);
      }
    } catch {
      // If Firestore fails, just provide a fallback profile so login still works
      console.warn("Firestore fetch/save failed, providing fallback profile.");
      setProfile({
        uid: cred.user.uid,
        displayName: cred.user.displayName ?? "Farmer",
        email: cred.user.email ?? "",
        location: "India",
        farmArea: 2.5,
        crops: [],
        createdAt: new Date().toISOString(),
      });
      detectAndSaveLocation(cred.user.uid);
    }
    // If existing, onAuthStateChanged will load the profile
  };

  // ── Sign Out ──────────────────────────────────────────────────────────────
  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setProfile(null);
    // Clear session cookie for middleware
    document.cookie = "__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  };

  // ── Update Profile ────────────────────────────────────────────────────────
  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    await upsertUserDoc(user.uid, data);
    setProfile((prev) => (prev ? { ...prev, ...data } : prev));
    // If location changed, update cache too
    if (data.locationData) setCachedLocation(data.locationData);
    else if (data.location) {
      const loc = buildManualLocation(data.location);
      setCachedLocation(loc);
    }
  };

  // ── Sync Weather ──────────────────────────────────────────────────────────
  const syncWeather = async (weather: any) => {
    if (!user) return;
    await upsertUserDoc(user.uid, { lastWeather: weather } as any);
    setProfile((prev) => (prev ? { ...prev, lastWeather: weather } : prev));
  };

  // ── Refresh location (GPS re-detect) ─────────────────────────────────────
  const refreshLocation = async () => {
    if (!user) return;
    clearCachedLocation();
    await detectAndSaveLocation(user.uid);
  };

  // ── Manual location override ──────────────────────────────────────────────
  const setManualLocation = async (cityState: string) => {
    if (!user) return;
    const loc = buildManualLocation(cityState);
    setCachedLocation(loc);
    const update: Partial<UserProfile> = { location: loc.display, locationData: loc };
    await upsertUserDoc(user.uid, update);
    setProfile((prev) => (prev ? { ...prev, ...update } : prev));
  };

  // ── Auth state listener ───────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          // Write session cookie for Next.js middleware
          const token = await firebaseUser.getIdToken();
          document.cookie = `__session=${token}; path=/; max-age=3600; SameSite=Lax`;

          let p = await fetchUserDoc(firebaseUser.uid);
          if (!p) {
            p = await initProfile(firebaseUser);
          }
          setProfile(p);

          // Auto-detect location only if no location already stored
          if (!p.locationData && !getCachedLocation()) {
            detectAndSaveLocation(firebaseUser.uid);
          }
        } catch {
          // Firestore might be offline — degrade gracefully
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        locationLoading,
        locationError,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        updateProfile,
        syncWeather,
        refreshLocation,
        setManualLocation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
