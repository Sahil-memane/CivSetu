import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  User as FirebaseUser,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type UserRole = "citizen" | "official";

export interface User {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  role: UserRole;
  department?: string;
  createdAt: any; // Date or Firestore Timestamp
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loginWithEmail: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; user?: User }>;
  signupWithEmail: (
    data: SignupData
  ) => Promise<{ success: boolean; error?: string }>;
  loginWithPhone: (
    phone: string,
    appVerifier: RecaptchaVerifier
  ) => Promise<{
    success: boolean;
    confirmationResult?: ConfirmationResult;
    error?: string;
  }>;
  verifyOtp: (
    confirmationResult: ConfirmationResult,
    otp: string
  ) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

interface SignupData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
  department?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          try {
            // Get Id Token
            const token = await firebaseUser.getIdToken();

            // Fetch user profile from Backend
            const response = await fetch("/api/auth/me", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (response.ok) {
              const userData = await response.json();
              setUser({ ...userData, id: firebaseUser.uid });
            } else {
              console.error(
                "Backend verification failed:",
                response.status,
                response.statusText
              );
              // CRITICAL: If backend cannot verify, we must log out
              await signOut(auth);
              setUser(null);
            }
          } catch (err) {
            console.error(
              "Backend connection error. Logging out for security.",
              err
            );
            await signOut(auth);
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Strict Backend Verification
      const token = await userCredential.user.getIdToken();
      let userData: User | undefined;

      try {
        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(
            `Backend verification failed: ${response.statusText}`
          );
        }

        const backendUser = await response.json();
        userData = { ...backendUser, id: userCredential.user.uid };

        // Optional: Pre-load user data here if needed, or let useEffect handle it
        // But we MUST wait for success before returning
      } catch (backendError: any) {
        console.error("Backend login verification failed:", backendError);
        await signOut(auth);
        return {
          success: false,
          error: "Login failed: Unable to verify with server.",
        };
      }

      return { success: true, user: userData };
    } catch (error: any) {
      console.error("Login error:", error);
      return { success: false, error: error.message };
    }
  };

  const signupWithEmail = async (
    data: SignupData
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      // Fix: Immediately update the display name so the token contains it
      await updateProfile(userCredential.user, {
        displayName: data.name,
      });

      // Force token refresh to ensure 'name' claim is present
      const token = await userCredential.user.getIdToken(true);

      // Call Backend to Sync User
      const newUser = {
        email: data.email,
        phone: data.phone,
        name: data.name,
        role: data.role,
        department: data.department,
      };

      await fetch("/api/auth/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });

      // Update local state immediately (optional, or wait for onAuthStateChanged)
      setUser({
        ...newUser,
        id: userCredential.user.uid,
        createdAt: new Date(),
      } as User);

      return { success: true };
    } catch (error: any) {
      console.error("Signup error:", error);
      return { success: false, error: error.message };
    }
  };

  const loginWithPhone = async (
    phone: string,
    appVerifier: RecaptchaVerifier
  ): Promise<{
    success: boolean;
    confirmationResult?: ConfirmationResult;
    error?: string;
  }> => {
    try {
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phone,
        appVerifier
      );
      return { success: true, confirmationResult };
    } catch (error: any) {
      console.error("Phone login error:", error);
      return { success: false, error: error.message };
    }
  };

  const verifyOtp = async (
    confirmationResult: ConfirmationResult,
    otp: string
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      const result = await confirmationResult.confirm(otp);
      const firebaseUser = result.user;

      // Strict Backend Verification & Sync for Phone Users
      const token = await firebaseUser.getIdToken();

      const phoneUserData = {
        uid: firebaseUser.uid,
        phone: firebaseUser.phoneNumber || "",
        role: "citizen", // Default for phone login
        name: "Citizen", // Default
      };

      let userData: User | undefined;

      try {
        // Use sync endpoint for phone login as it might be a new user
        const response = await fetch("/api/auth/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(phoneUserData), // Send partial data, backend handles merge
        });

        if (!response.ok) {
          throw new Error(`Backend sync failed: ${response.statusText}`);
        }

        // Fetch latest full profile to update state
        // (Or rely on the user object returned by sync if any)
        const syncResult = await response.json();
        if (syncResult.user) {
          userData = {
            ...syncResult.user,
            id: firebaseUser.uid,
            createdAt: new Date(),
          } as User;

          // Update local state immediately
          setUser(userData);
        }
      } catch (backendError: any) {
        console.error("Backend phone verification failed:", backendError);
        await signOut(auth);
        return {
          success: false,
          error: "Login failed: Unable to verify with server.",
        };
      }

      return { success: true, user: userData };
    } catch (error: any) {
      console.error("OTP verification error:", error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loginWithEmail,
        signupWithEmail,
        loginWithPhone,
        verifyOtp,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
