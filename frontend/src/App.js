import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Login from './components/auth/Login';
import Register from './components/auth/Register';  
import Dashboard from './components/Dashboard/Dashboard';
import PrivateRoute from './components/auth/PrivateRoute';

const GOOGLE_CLIENT_ID = "278037344784-ogfpaqcmbg2arj10rqfr0d83jt8msvq6.apps.googleusercontent.com";

function App() {
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route 
                        path="/dashboard" 
                        element={
                            <PrivateRoute>
                                <Dashboard />
                            </PrivateRoute>
                        } 
                    />
                    <Route path="/" element={<Login />} />
                </Routes>
            </Router>
        </GoogleOAuthProvider>
    );
}

export default App;
