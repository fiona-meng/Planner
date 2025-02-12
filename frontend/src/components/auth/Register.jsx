import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { useState } from 'react';
import loginImage from '../../assets/images/login.jpg';
import './Register.css';

function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            const response = await authAPI.register({ email, password });
            if (response.data.success) {
                localStorage.setItem('token', response.data.token);
                navigate('/dashboard');
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="login-container">
            <div className="row h-100 m-0">
                <div className="col-md-7 login-form">
                    <div className="login-form-content">
                        <h1 className="login-title">Sign up</h1>
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

                            <div className="mb-3">
                                <label className="form-label">Confirm Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <button type="submit" className="btn btn-primary w-100 login-button">
                                Sign up
                            </button>

                            <div className="mb-3 register">
                                <p>Already have an account? <Link to="/login">Log in</Link></p>
                            </div>
                        </form>
                    </div>
                </div>
                <div className="col-md-5 image-container">
                    <img src={loginImage} alt="Register" className="login-image" />
                </div>
            </div>
        </div>
    );
}

export default Register;  