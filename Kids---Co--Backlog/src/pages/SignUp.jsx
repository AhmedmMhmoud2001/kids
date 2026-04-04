import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { registerUser, verifyEmail, resendVerificationCode, checkEmail } from '../api/auth';
import { API_BASE_URL } from '../api/config';

const SignUp = () => {
  const navigate = useNavigate();
  const { login } = useApp();
  const [step, setStep] = useState('register'); // 'register' | 'verify'
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState({ field: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const codeInputRefs = useRef([]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // OAuth handlers
  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  const handleFacebookLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/facebook`;
  };

  // Validate email on blur
  const handleEmailBlur = async () => {
    if (!formData.email) return;
    
    try {
      const result = await checkEmail(formData.email);
      if (!result.isValid) {
        setFieldError({ field: 'email', message: result.error || 'Invalid email address' });
      } else if (result.isDisposable) {
        setFieldError({ field: 'email', message: 'Disposable emails are not allowed' });
      } else if (result.warning) {
        setFieldError({ field: 'email', message: result.warning });
      } else {
        setFieldError({ field: '', message: '' });
      }
    } catch {
      // Ignore check errors
    }
  };

  // Registration form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldError({ field: '', message: '' });

    // Validations
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setFieldError({ field: 'password', message: 'Password must be at least 6 characters' });
      return;
    }

    if (!formData.agreeToTerms) {
      setError('Please agree to terms and conditions');
      return;
    }

    setIsLoading(true);

    try {
      const res = await registerUser(formData);

      if (res.success) {
        // Check if verification is required
        if (res.data.requiresVerification) {
          setStep('verify');
          setResendCooldown(60);
        } else if (res.data.user) {
          // Direct login (verification skipped, token in httpOnly cookie)
          login(res.data);
          navigate('/');
        }
      } else {
        setError(res.message || 'Registration failed');
      }
    } catch (err) {
      const message = err.message || 'Registration failed. Please try again.';
      // Check if it's a field-specific error
      if (message.toLowerCase().includes('email')) {
        setFieldError({ field: 'email', message });
      } else if (message.toLowerCase().includes('password')) {
        setFieldError({ field: 'password', message });
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle verification code input
  const handleCodeChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;
    
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle paste for verification code
  const handleCodePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      setVerificationCode(pastedData.split(''));
      codeInputRefs.current[5]?.focus();
    }
  };

  // Handle backspace in code input
  const handleCodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  // Verify email code
  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');

    const code = verificationCode.join('');
    if (code.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setIsLoading(true);

    try {
      const res = await verifyEmail(formData.email, code);

      if (res.success && res.data.user) {
        // Token is in httpOnly cookie
        login(res.data);
        navigate('/');
      } else {
        setError(res.message || 'Verification failed');
      }
    } catch (err) {
      setError(err.message || 'Invalid verification code');
      setVerificationCode(['', '', '', '', '', '']);
      codeInputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  // Resend verification code
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    setError('');
    setIsLoading(true);

    try {
      await resendVerificationCode(formData.email);
      setResendCooldown(60);
      setVerificationCode(['', '', '', '', '', '']);
    } catch (err) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear field error when user types
    if (fieldError.field === name) {
      setFieldError({ field: '', message: '' });
    }
  };

  // Verification Step UI
  if (step === 'verify') {
    return (
      <div className="container mx-auto px-4 sm:px-6 md:px-10 lg:px-20 py-16">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Verify Your Email</h1>
            <p className="text-gray-600">
              We sent a 6-digit code to<br />
              <span className="font-semibold text-gray-800">{formData.email}</span>
            </p>
          </div>

          {/* Verification Form */}
          <div className="bg-white shadow-md p-8">
            <form onSubmit={handleVerify} className="space-y-6">
              {/* Code Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4 text-center">
                  Enter verification code
                </label>
                <div className="flex justify-center gap-2 sm:gap-3" onPaste={handleCodePaste}>
                  {verificationCode.map((digit, index) => (
                    <input
                      key={index}
                      ref={el => codeInputRefs.current[index] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(index, e)}
                      className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm text-center rounded-lg">
                  {error}
                </div>
              )}

              {/* Verify Button */}
              <button
                type="submit"
                disabled={isLoading || verificationCode.join('').length !== 6}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {isLoading ? 'Verifying...' : 'Verify Email'}
              </button>

              {/* Resend */}
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
                {resendCooldown > 0 ? (
                  <p className="text-sm text-gray-400">
                    Resend in {resendCooldown}s
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isLoading}
                    className="text-green-600 hover:text-green-700 font-semibold text-sm"
                  >
                    Resend Code
                  </button>
                )}
              </div>

              {/* Change Email */}
              <div className="text-center pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setStep('register');
                    setVerificationCode(['', '', '', '', '', '']);
                    setError('');
                  }}
                  className="text-gray-600 hover:text-gray-800 text-sm"
                >
                  ← Change email address
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Registration Step UI
  return (
    <div className="container mx-auto px-4 sm:px-6 md:px-10 lg:px-20 py-16">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-gray-600">Join us and start shopping premium kids fashion</p>
        </div>

        {/* Sign Up Form */}
        <div className="bg-white shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    fieldError.field === 'firstName' ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="John"
                />
                {fieldError.field === 'firstName' && (
                  <p className="text-red-500 text-xs mt-1">{fieldError.message}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    fieldError.field === 'lastName' ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Doe"
                />
                {fieldError.field === 'lastName' && (
                  <p className="text-red-500 text-xs mt-1">{fieldError.message}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleEmailBlur}
                required
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  fieldError.field === 'email' ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="your.email@example.com"
              />
              {fieldError.field === 'email' && (
                <p className="text-red-500 text-xs mt-1">{fieldError.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  fieldError.field === 'password' ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Create a password (min. 6 characters)"
              />
              {fieldError.field === 'password' && (
                <p className="text-red-500 text-xs mt-1">{fieldError.message}</p>
              )}
              <p className="text-gray-400 text-xs mt-1">At least 6 characters with letters and numbers</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Re-enter your password"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm rounded-lg">
                {error}
              </div>
            )}

            {/* Terms & Conditions */}
            <div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  className="w-4 h-4 mt-0.5 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  I agree to the{' '}
                  <Link to="/terms" className="text-blue-500 hover:text-blue-600">
                    Terms & Conditions
                  </Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="text-blue-500 hover:text-blue-600">
                    Privacy Policy
                  </Link>
                </span>
              </label>
            </div>

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or sign up with</span>
              </div>
            </div>

            {/* Social Sign Up */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={handleFacebookLogin}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="text-sm font-medium">Facebook</span>
              </button>
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-sm font-medium">Google</span>
              </button>
            </div>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/signin" className="text-blue-500 hover:text-blue-600 font-semibold">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
