import { useState, type SubmitEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Login() {
    // states for form inputs
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const { login } = useAuth();

    // handle form submission
    const handleSubmit = async (e: SubmitEvent) => {
        e.preventDefault(); // prevents page reload
        try {
            // call backend
            const response = await axios.post('http://localhost:3000/login', {
                email,
                password
            }, {
                withCredentials: true // for sessions
            });

            // if successful
            if (response.data.success) {
                // save user to context
                login({
                    id: response.data.user.id,
                    name: response.data.user.name,
                    email: response.data.user.email,
                    role: response.data.user.role
                });

                // navigate based on role
                if (response.data.user.role === 'student') {
                    navigate('/student-dashboard')
                } else if (response.data.user.role === 'instructor') {
                    navigate('/instructor-dashboard')
                } else if (response.data.user.role === 'admin') {
                    navigate('/admin-dashboard')
                }
            }
        } catch (err) {
            setError('Invalid credentials');
        }
    };

    return (
        <div>
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)} // update state on every keystroke
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Login</button>
                {error && <p style={{ color: 'red' }}>{error}</p>}
            </form>
            <p>
                Don't have an account? <Link to="/register">Register</Link>
            </p>
        </div>
    )
}

export default Login;