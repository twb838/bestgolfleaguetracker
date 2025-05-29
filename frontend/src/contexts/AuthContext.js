import React, { createContext, useState, useContext, useEffect } from 'react';
import { get, post } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log('AuthProvider mounting...'); // Debug log
        const token = localStorage.getItem('token');
        console.log('Token from localStorage:', token); // Debug log

        if (token) {
            fetchUserProfile();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUserProfile = async () => {
        try {
            console.log('Fetching user profile...'); // Debug log
            const userData = await get('/users/me');
            console.log('User profile fetched:', userData); // Debug log
            setUser(userData);
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
            // Don't redirect here, let the API service handle it
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, password) => {
        setError(null);
        try {
            console.log('Attempting login...'); // Debug log
            const data = await post('/auth/login/json', { username, password });

            console.log('Login successful, saving token'); // Debug log
            localStorage.setItem('token', data.access_token);
            await fetchUserProfile();
            return true;
        } catch (error) {
            console.error('Login error:', error); // Debug log
            setError(error.message);
            return false;
        }
    };

    const register = async (userData) => {
        setError(null);
        try {
            await post('/auth/register', userData);
            return true;
        } catch (error) {
            setError(error.message);
            return false;
        }
    };

    const logout = () => {
        console.log('Logging out...'); // Debug log
        localStorage.removeItem('token');
        setUser(null);
    };

    const value = {
        user,
        loading,
        error,
        login,
        register,
        logout,
        isAuthenticated: !!user
    };

    console.log('AuthContext value:', value); // Debug log

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};