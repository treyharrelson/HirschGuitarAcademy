import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../assets/HGA_Logo_No_Background.png'
import { useAuth } from '../../context/AuthContext'
import { NavBarButton, BigBlueButton } from './Buttons'
import api from '../../api/axiosInstance';

type RoleLink = {
  label: string;
  path: string;
  button: React.ElementType;
}

const NAV_LINKS: Record<string, RoleLink[]> = {
  guest: [
    { label: 'Create Account', path: '/', button: BigBlueButton }
  ],
  student: [
    { label: 'Dashboard', path: '/student-dashboard', button: NavBarButton },
    { label: 'My Courses', path: '/courses', button: NavBarButton },
  ],
  instructor: [
    { label: 'Instructor View', path: '/instructor', button: NavBarButton },
    { label: 'Add Course', path: '/instructor/add-course', button: NavBarButton },
  ],
  admin: [
    //dunno yet
  ]
};


const Navbar = () => {
  const { user, logout } = useAuth();
  const handleLogout = async () => {
    try {
      await api.post('/logout', {});
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      logout();
      window.location.href = '/';
    }
  };

  const navigate = useNavigate();

  const isCourseListPage = location.pathname.includes('/course-list');


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

  return (
    <div className={'w-full flex items-center justify-between px-4 sm:px-10 md:px-14 lg:px-36 border-b border-gray-200 sticky top-0 left-0 z-40 py-4 bg-white'}>
      <Link to='/home' >
        <img src={logo} alt='Logo goes here' className='w-28 lg:w-32 cursor-pointer' />
      </Link>
      <div className='hidden md:flex items-center'>
        <div className='flex items-center gap-8'>
          <RenderLinks />
          {user && (
            <BigBlueButton onClick={handleLogout}>
              Logout
            </BigBlueButton>
          )}
        </div>
      </div>
      {/* For phone screens */}
      <div className='md:hidden flex items-center gap-2 sm:gap-5 text-gray-500'>
        <div>
          <RenderLinks />
        </div>
        <button><img src='' alt='User Icon' /></button>
      </div>
    </div>
  )
}

export default Navbar
