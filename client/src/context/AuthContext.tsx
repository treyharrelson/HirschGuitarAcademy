import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type User } from '../types/user'
import api from '../api/axiosInstance';

interface AuthContextType {
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
}

// create container to hold auth data
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// provides auth context to the whole app
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // check session on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await api.get('/api/me');

                if (response.status === 200 && response.data?.success) {
                    setUser(response.data.user);
                }
            } catch (err: any) {
                // ONLY logout if the error is specifically "Unauthorized"
                if (err.response?.status === 401) {
                    setUser(null);
                } else {
                    // For 500 errors or network issues, keep the user logged in 
                    // but maybe show a "Server Error" toast/notification
                    console.error("Server or Network Error:", err.message);
                }
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

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
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated, loading }}>
            {children}
        </AuthContext.Provider>
    );
}