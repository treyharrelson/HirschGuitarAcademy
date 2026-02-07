import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await axios.post('http://localhost:3000/logout', {}, {
                withCredentials: true
            });
            logout();
            navigate('/');
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>Welcome, {user.name}!</h1>
            <p>Email: {user.email}</p>
            <p>Role: {user.role}</p>

            <button onClick={handleLogout}>Logout</button>
        
            <div>
                <h2>Quick Links</h2>
                <ul>
                    <li><a href="/forum">Forum</a></li>
                    <li><a href="/courses">My Courses</a></li>
                </ul>
            </div>
        </div>
    );
}

export default Dashboard;