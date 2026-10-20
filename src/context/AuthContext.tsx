import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { StaffUser, StaffRole } from '../lib/types';
import { dataService } from '../lib/dataService';

interface AuthContextValue {
  user: StaffUser | null;
  loading: boolean;
  error: string | null;
  isFirebaseLive: boolean;
  login: (email: string, password: string) => Promise<StaffUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Pre-configured mock staff for development & demo mode ───────────────────
const MOCK_STAFF: Record<string, StaffUser> = {
  'adminmain23@gmail.com': {
    uid: 'admin-main',
    email: 'adminmain23@gmail.com',
    username: 'admin',
    password: 'royalchef200',
    name: 'Master Admin',
    role: 'admin',
    isActive: true,
  },
  'admin@royalsaffron.in': {
    uid: 'admin-1',
    email: 'admin@royalsaffron.in',
    username: 'admin',
    password: 'royalchef200',
    name: 'Rajesh Kumar (Admin)',
    role: 'admin',
    isActive: true,
  },
  'kitchen@royalsaffron.in': {
    uid: 'kitchen-1',
    email: 'kitchen@royalsaffron.in',
    username: 'cooker',
    password: 'cooker123',
    name: 'Chef Amar',
    role: 'kitchen',
    isActive: true,
  },
  'cooker@royalsaffron.in': {
    uid: 'kitchen-1',
    email: 'cooker@royalsaffron.in',
    username: 'cooker',
    password: 'cooker123',
    name: 'Chef Amar',
    role: 'kitchen',
    isActive: true,
  },
  'waiter@royalsaffron.in': {
    uid: 'waiter-1',
    email: 'waiter@royalsaffron.in',
    username: 'waiter',
    password: 'waiter123',
    name: 'Priya Singh',
    role: 'waiter',
    isActive: true,
  },
};

const USE_MOCK_AUTH =
  import.meta.env.VITE_FIREBASE_PROJECT_ID === undefined ||
  import.meta.env.VITE_FIREBASE_PROJECT_ID === 'demo-project';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (USE_MOCK_AUTH) {
      // Restore mock session from storage
      const saved = sessionStorage.getItem('mockStaff');
      if (saved) {
        try {
          setUser(JSON.parse(saved));
        } catch {
          /* ignore */
        }
      }
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'staff', firebaseUser.uid));
        if (snap.exists()) {
          setUser(snap.data() as StaffUser);
        } else {
          // If staff document does not exist yet, infer role from email
          const email = firebaseUser.email || '';
          const role = email.includes('admin')
            ? 'admin'
            : email.includes('kitchen')
            ? 'kitchen'
            : 'waiter';
          const name =
            role === 'admin'
              ? 'Rajesh Kumar (Admin)'
              : role === 'kitchen'
              ? 'Chef Amar'
              : 'Priya Singh';

          const fallbackStaff: StaffUser = {
            uid: firebaseUser.uid,
            email,
            name,
            role,
            isActive: true,
          };
          await setDoc(doc(db, 'staff', firebaseUser.uid), fallbackStaff, { merge: true });
          setUser(fallbackStaff);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return unsub;
  }, []);

  const login = async (email: string, password: string): Promise<StaffUser> => {
    setError(null);
    const cleanIdentifier = email.toLowerCase().trim();
    const cleanEmail = cleanIdentifier;

    try {
      // 1. Master Admin credentials configured by Owner
      if (
        (cleanIdentifier === 'adminmain23@gmail.com' || cleanIdentifier === 'adminmain23') &&
        password === 'royalchef200'
      ) {
        const masterAdmin: StaffUser = {
          uid: 'admin-main',
          email: 'adminmain23@gmail.com',
          username: 'admin',
          password: 'royalchef200',
          name: 'Master Admin',
          role: 'admin',
          isActive: true,
        };
        setUser(masterAdmin);
        sessionStorage.setItem('mockStaff', JSON.stringify(masterAdmin));
        return masterAdmin;
      }

      // 2. Dynamic Staff DB check (Waiters & Cookers configured by Admin in Dashboard)
      const staffList = dataService.getStaffSync();
      const staffMember = staffList.find(
        (s) =>
          s.email.toLowerCase() === cleanIdentifier ||
          (s.username && s.username.toLowerCase() === cleanIdentifier)
      );

      if (staffMember) {
        const expected = staffMember.password || (staffMember.role === 'admin' ? 'royalchef200' : 'password123');
        if (password === expected) {
          setUser(staffMember);
          sessionStorage.setItem('mockStaff', JSON.stringify(staffMember));
          return staffMember;
        }
        throw new Error('Incorrect password. Please verify with the Administrator.');
      }

      if (USE_MOCK_AUTH) {
        let staff = MOCK_STAFF[cleanIdentifier];
        if (!staff && (password === 'password123' || password === 'royalchef200')) {
          const role: StaffRole = cleanIdentifier.includes('admin')
            ? 'admin'
            : cleanIdentifier.includes('kitchen') || cleanIdentifier.includes('cook')
            ? 'kitchen'
            : 'waiter';
          staff = {
            uid: `user-${Date.now()}`,
            email: cleanIdentifier,
            username: cleanIdentifier.split('@')[0],
            name: role === 'admin' ? 'Admin Manager' : role === 'kitchen' ? 'Head Chef' : 'Staff Waiter',
            role,
            isActive: true,
          };
        }
        if (staff) {
          const expected = staff.role === 'admin' ? 'royalchef200' : (staff.password || 'password123');
          if (password === expected || password === 'password123') {
            setUser(staff);
            sessionStorage.setItem('mockStaff', JSON.stringify(staff));
            return staff;
          }
        }
        throw new Error('Invalid Username/Email or Password. Check with Admin.');
      }

      // Real Firebase Auth
      let cred;
      try {
        cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      } catch (signInErr: unknown) {
        const errCode = (signInErr as { code?: string })?.code;
        // If account does not exist yet in Firebase Auth, auto-create it (Zero friction on Spark free plan!)
        if (
          errCode === 'auth/user-not-found' ||
          errCode === 'auth/invalid-credential' ||
          errCode === 'auth/invalid-login-credentials'
        ) {
          try {
            cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
          } catch {
            throw signInErr;
          }
        } else {
          throw signInErr;
        }
      }

      if (!cred || !cred.user) {
        throw new Error('Could not authenticate user with Firebase.');
      }

      const snap = await getDoc(doc(db, 'staff', cred.user.uid));
      if (!snap.exists()) {
        const role = cleanEmail.includes('admin')
          ? 'admin'
          : cleanEmail.includes('kitchen')
          ? 'kitchen'
          : 'waiter';
        const name =
          role === 'admin'
            ? 'Rajesh Kumar (Admin)'
            : role === 'kitchen'
            ? 'Chef Amar'
            : 'Priya Singh';

        const newStaff: StaffUser = {
          uid: cred.user.uid,
          email: cleanEmail,
          name,
          role,
          isActive: true,
        };
        await setDoc(doc(db, 'staff', cred.user.uid), newStaff);
        setUser(newStaff);
        return newStaff;
      }

      const activeStaff = snap.data() as StaffUser;
      setUser(activeStaff);
      return activeStaff;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed.';
      setError(msg);
      throw err;
    }
  };

  const logout = async () => {
    if (USE_MOCK_AUTH) {
      sessionStorage.removeItem('mockStaff');
      setUser(null);
      return;
    }
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isFirebaseLive: !USE_MOCK_AUTH,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
