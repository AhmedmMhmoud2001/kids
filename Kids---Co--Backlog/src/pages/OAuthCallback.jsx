import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { fetchMe } from '../api/auth';
import { getCsrfToken } from '../api/apiClient';

const OAuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useApp();
    const [error, setError] = useState('');

    useEffect(() => {
        const handleCallback = async () => {
            const success = searchParams.get('success');
            const errorParam = searchParams.get('error');

            if (errorParam) {
                const errorMessages = {
                    'google_not_configured': 'Google sign in is not configured.',
                    'facebook_not_configured': 'Facebook sign in is not configured.',
                    'google_auth_failed': 'Google authentication failed.',
                    'facebook_auth_failed': 'Facebook authentication failed.',
                    'invalid_state': 'Invalid authentication state. Please try again.'
                };
                setError(errorMessages[errorParam] || 'Authentication failed. Please try again.');
                setTimeout(() => navigate('/signin'), 3000);
                return;
            }

            if (success !== 'true') {
                setError('Authentication was not completed.');
                setTimeout(() => navigate('/signin'), 3000);
                return;
            }

            try {
                // Token is now in httpOnly cookie, set by backend
                // Fetch CSRF token first
                await getCsrfToken();
                
                // Fetch user data (auth cookie is automatically sent)
                const res = await fetchMe();
                
                if (res.success) {
                    // Login user in context
                    login(res.data);
                    
                    // Navigate to homepage
                    navigate('/');
                } else {
                    throw new Error('Failed to fetch user data');
                }
            } catch (err) {
                console.error('OAuth callback error:', err);
                setError('Authentication failed. Please try again.');
                setTimeout(() => navigate('/signin'), 3000);
            }
        };

        handleCallback();
    }, [searchParams, navigate, login]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                {error ? (
                    <div className="space-y-4">
                        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <p className="text-red-600 font-medium">{error}</p>
                        <p className="text-gray-500 text-sm">Redirecting to sign in...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="text-gray-600">Completing sign in...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OAuthCallback;
