import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import './Login.css';
import loginImage from '../../assets/images/new_login.png';


function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await authAPI.login({ email, password });
            if (response.data.success) {
                localStorage.setItem('token', response.data.token);
                navigate('/dashboard');
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Login failed');
        }
    };

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const result = await authAPI.googleLogin({
                    access_token: tokenResponse.access_token
                });
                if (result.data.success) {
                    localStorage.setItem('token', result.data.token);
                    navigate('/dashboard');
                }
            } catch (error) {
                setError('Google login failed');
            }
        },
        onError: () => {
            setError('Google login failed');
        }
    });

    return (
        <div className="login-container">
            <div className="row h-100 m-0">
                <div className="col-md-7 login-form">
                    <div className="login-form-content">
                        <h1 className="login-title">Log in</h1>
                        {error && <div className="alert alert-danger">{error}</div>}
                        
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <button type="submit" className="btn btn-primary w-100 login-button">
                               Log in
                            </button>

                            <div className="social-login mt-4">
                                <button 
                                    type="button"
                                    onClick={() => googleLogin()}
                                    className="btn btn-outline-dark w-100"
                                >
                                    <i className="bi bi-google me-2"></i>
                                    Continue with Google
                                </button>
                            </div>

                            <div className="mb-3 register">
                                <p>Don't have an account? <Link to="/register">Sign up</Link></p>
                            </div>
                        </form>
                    </div>
                </div>
                <div className="col-md-5 image-container">
                    <img src={loginImage} alt="Login" className="login-image" />
                </div>
            </div>
        </div>
    );
}

export default Login;