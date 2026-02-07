import { createContext, useContext, useState, type ReactNode } from 'react';
import { type User } from '../types/user'

interface AuthContextType {
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

// create container to hold auth data
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// provides auth context to the whole app
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    // save data to state when someone logs in
    const login = (userData: User) => {
        setUser(userData);
    };

    // clears the user
    const logout = () => {
        setUser(null);
    };

    // checks if user exists
    const isAuthenticated = user !== null;

    // provides the values to all children. This makes user, login, logout, and isAuthenticated
    // available to any child component (everything  wrapped by <AuthProvider>)
    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
}

// custom hook to use the auth context
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}