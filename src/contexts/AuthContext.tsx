import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type UserRole = "citizen" | "official";

export interface User {
  id: string;
  email: string;
  phone?: string;
  name: string;
  role: UserRole;
  department?: string;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
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

// Local storage keys
const USER_KEY = "civsetu_user";
const USERS_DB_KEY = "civsetu_users_db";

// Helper to get users from local storage
const getLocalUsers = (): Array<User & { password: string }> => {
  const data = localStorage.getItem(USERS_DB_KEY);
  return data ? JSON.parse(data) : [];
};

// Helper to save users to local storage
const saveLocalUsers = (users: Array<User & { password: string }>) => {
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, role: UserRole): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const users = getLocalUsers();
    const foundUser = users.find(u => u.email === email && u.password === password && u.role === role);
    
    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem(USER_KEY, JSON.stringify(userWithoutPassword));
      setIsLoading(false);
      return { success: true };
    }
    
    setIsLoading(false);
    return { success: false, error: "Invalid credentials or account not found" };
  };

  const signup = async (data: SignupData): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const users = getLocalUsers();
    
    // Check if user already exists
    if (users.some(u => u.email === data.email)) {
      setIsLoading(false);
      return { success: false, error: "An account with this email already exists" };
    }
    
    const newUser: User & { password: string } = {
      id: crypto.randomUUID(),
      email: data.email,
      phone: data.phone,
      name: data.name,
      role: data.role,
      department: data.department,
      password: data.password,
      createdAt: new Date(),
    };
    
    users.push(newUser);
    saveLocalUsers(users);
    
    const { password: _, ...userWithoutPassword } = newUser;
    setUser(userWithoutPassword);
    localStorage.setItem(USER_KEY, JSON.stringify(userWithoutPassword));
    
    setIsLoading(false);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      signup,
      logout,
      isAuthenticated: !!user,
    }}>
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
