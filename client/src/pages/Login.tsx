import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { assets } from '../assets/assets'

function Login() {
    // states for form inputs
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const { login } = useAuth();

    // handle form submission
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); // prevents page reload
        try {
            // call backend
            const response = await api.post('/login', {
                email,
                password
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
                navigate('/home')
            }
        } catch (err) {
            setError('Invalid credentials');
        }
    };

    return (
        <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4'>
            <div className='w-full max-w-md'>
                <div className='bg-white rounded-md shadow-xl p-8'>
                    { /* Logo */}
                    <div className='flex items-center justify-center'>
                        <img src={assets.logoNoBackground} alt='Big Logo' width="300" height="300" />
                    </div>
                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className='space-y-6'>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                            <input
                                type="text"
                                placeholder="Email or Username"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)} // update state on every keystroke
                                required
                                className='w-full border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200'
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className='w-full border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200'
                            />
                        </div>



                        <button className='w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded' type="submit">Login</button>

                        {error && <p style={{ color: 'red' }}>{error}</p>}
                    </form>
                    {/* End of Form */}

                    <p className='pt-2'>
                        Don't have an account? <Link className='text-blue-600' to="/register">Register</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login;