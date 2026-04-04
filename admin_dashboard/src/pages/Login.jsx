import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/useApp';
import { loginUser } from '../api/auth';
import { useLanguage } from '../context/LanguageContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useApp();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            // Use auth API so cookies are sent/received (credentials: 'include')
            const result = await loginUser(email, password);

            const authData = result.data;
            if (!authData || !authData.user) {
                throw new Error('Invalid response from server');
            }

            // Check if user has admin privileges
            const allowedRoles = ['SYSTEM_ADMIN', 'ADMIN_KIDS', 'ADMIN_NEXT'];
            if (!allowedRoles.includes(authData.user.role)) {
                throw new Error('Unauthorized access');
            }

            login(authData, () => navigate('/'));
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-96">
                <h2 className="text-2xl font-bold mb-6 text-center">{t('login.title')}</h2>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">{t('login.email')}</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 mb-2">{t('login.password')}</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
                    >
                        {t('login.signIn')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
