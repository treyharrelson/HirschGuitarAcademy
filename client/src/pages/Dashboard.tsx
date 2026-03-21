import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { DashButton } from '../components/generic/Buttons';

type RoleLink = {
    label: string;
    path: string;
    button: React.ElementType;
}

const NAV_LINKS: Record<string, RoleLink[]> = {
    // need to populate appropriately
    guest: [
        { label: 'Create Account', path: '/', button: DashButton }
    ],
    student: [
        { label: 'Forum', path: '/forum', button: DashButton },
        { label: 'View Available Courses', path: '/all-courses', button: DashButton },
        { label: 'My Courses', path: '/courses', button: DashButton },
        { label: 'Metronome', path: '/metronome', button: DashButton },
        { label: 'Timer', path: '/timer', button: DashButton },
        { label: 'LMS Redirect', path: '/home', button: DashButton }
    ],
    instructor: [
        { label: 'Instructor View', path: '/instructor', button: DashButton },
        { label: 'Add Course', path: '/instructor/add-course', button: DashButton },
    ],
    admin: [
        //dunno yet
    ]
};


function Dashboard() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    const links = user?.role ? NAV_LINKS[user.role] : NAV_LINKS['guest'];

    const RenderLinks = () => (
        <>
            {links.map((link, index) => (
                <link.button onClick={() => navigate(link.path)}>
                    {link.label}
                </link.button>
            ))}
        </>
    );

    // show loading while checking auth
    if (loading) {
        return <div>Loading...</div>;
    }
    // if not logged in after loading, redirect to login
    if (!user) {
        navigate('/');
        return null;
    }

    return (
        <div>
            <h1>Welcome, {user.name}!</h1>
            <p>Email: {user.email}</p>
            <p>Role: {user.role}</p>
            <div className='mt-10 flex flex-col'>
                <h2 className="mb-4 text-xl font-semibold">Quick Links</h2>
                <ul className="flex flex-col gap-2 w-48">
                    <RenderLinks />
                </ul>
            </div>
        </div>
    );
}

export default Dashboard;