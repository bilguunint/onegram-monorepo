"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getDb, getFirebaseAuth } from "@/lib/firebase/client";
import { isValidRole, type AdminRole } from "@/lib/auth/roles";

export type AdminData = {
  uid: string;
  name: string;
  email: string | null;
  role: AdminRole;
};

type AuthState = {
  user: User | null;
  adminData: AdminData | null;
  loading: boolean;
  error: string | null;
};

type AuthContextValue = AuthState & {
  signIn: (email: string, password: string) => Promise<AdminData>;
  signOut: () => Promise<void>;
  hasRole: (role: AdminRole) => boolean;
  hasAnyRole: (roles: AdminRole[]) => boolean;
  isAdmin: () => boolean;
  isManager: () => boolean;
  isAccountant: () => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchAdminData(user: User): Promise<AdminData> {
  const snap = await getDoc(doc(getDb(), "admins", user.uid));
  if (!snap.exists()) {
    throw new Error("Хэрэглэгч admins хэсэгт олдсонгүй.");
  }
  const data = snap.data() as { name?: string; role?: string };
  if (!isValidRole(data.role)) {
    throw new Error("Хэрэглэгчийн эрх хүчингүй байна.");
  }
  return {
    uid: user.uid,
    name: data.name || user.email || "",
    email: user.email,
    role: data.role,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    adminData: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ user: null, adminData: null, loading: false, error: null });
        return;
      }
      try {
        const adminData = await fetchAdminData(user);
        setState({ user, adminData, loading: false, error: null });
      } catch (e) {
        await fbSignOut(auth).catch(() => {});
        setState({
          user: null,
          adminData: null,
          loading: false,
          error: e instanceof Error ? e.message : "Нэвтрэх боломжгүй.",
        });
      }
    });
    return () => unsub();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const adminData = await fetchAdminData(cred.user).catch(async (e) => {
      await fbSignOut(auth).catch(() => {});
      throw e;
    });
    setState({ user: cred.user, adminData, loading: false, error: null });
    return adminData;
  }, []);

  const signOut = useCallback(async () => {
    await fbSignOut(getFirebaseAuth());
    setState({ user: null, adminData: null, loading: false, error: null });
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const role = state.adminData?.role ?? null;
    return {
      ...state,
      signIn,
      signOut,
      hasRole: (r) => role === r,
      hasAnyRole: (rs) => !!role && rs.includes(role),
      isAdmin: () => role === "admin",
      isManager: () => role === "manager",
      isAccountant: () => role === "accountant",
    };
  }, [state, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}
