import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { assets } from '../assets/assets'

function Register() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [userName, setUserName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const inputStyle = 'w-full border px-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200';

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); // prevents page reload

        try {
            const response = await axios.post('http://localhost:3000/register', {
                firstName,
                lastName,
                userName,
                email,
                password,
                role
            }, {
                withCredentials: true
            });

            // If successful, redirect to login
            if (response.data.success) {
                navigate('/');
            }
        } catch (err: any) {
            // Should probably use all over, ? makes it so if backend completely crashes doesn't crash frontend,
            //  err returns err.response is from server, .data is json in that, .message is what I set to be the error message
            const errormessage = err.response?.data?.message;
            if(errormessage) {
                setError(errormessage);
            }
            else {
                setError('Error registering user.');
            }
        }
    };

    return (
        <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4'>
            <div className='w-full max-w-md'>
                <div className='bg-white rounded-md shadow-xl p-8'>
                    { /* Logo */}
                    <div className='flex items-center justify-center'>
                        <img src={assets.logoNoBackground} alt='Big Logo' width="300" height="300"/>
                    </div>
                    {/** Register Form */}
                    <h2 className='flex items-center justify-center'>Register an Account</h2>
                    <form onSubmit={handleSubmit} className='space-y-2'>
                        {/** First Name */}
                        <div>
                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">First Name:</label>
                            <input
                                type="text"
                                placeholder="First Name"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                                className={inputStyle}
                            />
                        </div>

                        {/** Last Name */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Last Name:</label>
                            <input
                                type="text"
                                placeholder="Last Name"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                                className={inputStyle}
                            />
                        </div>

                        {/** Username */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Username:</label>
                            <input
                                type="text"
                                placeholder="Username"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                required
                                className={inputStyle}
                            />
                        </div>

                        {/** Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address:</label>
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className={inputStyle}
                            />
                        </div>

                        {/** Password */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Password:</label>
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className={inputStyle}
                            />
                        </div>

                        {/** Role */}
                        <div className='flex space-x-2'>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Role:</label>
                            <select className='border rounded-md' value={role} onChange={(e) => setRole(e.target.value)}>
                                <option value="student">Student</option>
                                <option value="instructor">Instructor</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        <button className='w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded' type="submit">Register</button>
                        {error && <p style={{ color: 'red' }}>{error}</p>}
                    </form>
                    <p>
                        Already have an account? <Link className='text-blue-600' to="/">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Register;
