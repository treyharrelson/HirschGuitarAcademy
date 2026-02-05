import { useState, type SubmitEventHandler } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login() {
    // states for form inputs
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const navigate = useNavigate();

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

            // if successful, naviage based on role
            if (response.data.success) {
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
                    onChange={(e) => setEmail(e.target.value)}
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
        </div>
    )
}