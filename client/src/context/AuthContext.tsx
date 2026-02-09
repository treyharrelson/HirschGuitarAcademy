import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type User } from '../types/user'
import axios from 'axios';

interface AuthContextType {
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
}

// create container to hold auth data
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// provides auth context to the whole app
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // check session on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await axios.get('http://localhost:3000/api/me', {
                    withCredentials: true
                });

                if (response.data.success) {
                    setUser(response.data.user);
                }
            } catch (err) {
                // not logged in
                console.log('Not authenticated');
            } finally {
                setLoading(false); // done checking
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

// custom hook to use the auth context
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}