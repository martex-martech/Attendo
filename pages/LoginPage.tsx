import React, { useState } from 'react';
import type { User } from '../types';
import api from '../utils/api';

const Icon = ({ name, className }: { name: string; className?: string }) => (
    <span className={`material-icons ${className || ''}`}>{name}</span>
);

const LoginPage: React.FC<{ onLoginSuccess: (user: User, token: string) => void }> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/login', { email, password });
            const { user, token } = response.data;
            onLoginSuccess(user, token);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md m-4">
                <div className="text-center">
                    <h1 className="text-3xl font-bold flex items-center justify-center text-gray-800">
                        <Icon name="task_alt" className="mr-2 text-red-500 text-4xl" />
                        <span>Martex</span>
                    </h1>
                    <p className="text-gray-500 mt-2">Sign in to your account</p>
                </div>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                        <div className="mt-1">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm bg-white text-black"
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center justify-between">
                            <label htmlFor="password"  className="block text-sm font-medium text-gray-700">Password</label>
                        </div>
                        <div className="mt-1">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm bg-white text-black"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center text-sm text-red-600 bg-red-50 p-3 rounded-md">
                            <Icon name="error_outline" className="mr-2" />
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:bg-red-300"
                        >
                            {loading ? 'Signing In...' : 'Sign in'}
                        </button>
                    </div>
                </form>

                <div className="mt-6 p-4 bg-gray-100 rounded-md text-sm text-gray-700">
                    <h3 className="font-semibold mb-2">User Login Info (for reference):</h3>
                    <ul className="list-disc list-inside space-y-1">
                        <li><strong>Super Admin:</strong> super@martex.com / superpassword</li>
                        <li><strong>Admin:</strong> admin@martex.com / adminpassword</li>
                        <li><strong>Employee:</strong> employee@martex.com / employeepassword</li>
                    </ul>
                </div>

                <footer className="text-center py-4 text-gray-500">
                    © 2025 Martex. All rights reserved.
                </footer>
            </div>
        </div>
    );
};

export default LoginPage;
