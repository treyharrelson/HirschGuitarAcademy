import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../assets/HGA_Logo_No_Background.png'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axiosInstance';
import { assets } from '../../assets/assets'
import { BigBlueButton } from './Buttons';




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



  return (
    <div className={'w-full flex items-center justify-between px-4 sm:px-10 md:px-14 lg:px-36 border-b border-gray-200 sticky top-0 left-0 z-40 py-4 bg-white'}>
      <Link to='/home' >
        <img src={logo} alt='Logo goes here' className='w-28 lg:w-32 cursor-pointer' />
      </Link>
      <div className='hidden md:flex items-center'>
        <div className='flex items-center gap-8'>
          {user && (
            <div className='flex items-center gap-4 sm:gap-6 border-l pl-4 sm:pl-8 border-gray-100'>
              <BigBlueButton onClick={handleLogout}>
                Logout
              </BigBlueButton>
              <button 
                onClick={() => navigate(`/profile/${user.id}`)}
                className='flex items-center gap-2 sm:gap-3 cursor-pointer group'
              >
                <div className='w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-base sm:text-lg border border-blue-100 group-hover:ring-2 group-hover:ring-blue-200 transition-all'>
                  {user.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className='hidden lg:block text-left'>
                  <p className='text-[10px] font-bold text-blue-600 uppercase tracking-wider leading-none mb-1'>{user.role}</p>
                  <p className='text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors leading-none'>{user.name}</p>
                </div>
              </button>
              
            </div>
          )}
        </div>
      </div>
      {/* For phone screens */}
      <div className='md:hidden flex items-center gap-2 sm:gap-5 text-gray-500'>
        <div className='flex items-center gap-4'>
        </div>
        {user && (
          <button 
            onClick={() => navigate(`/profile/${user.id}`)}
            className='w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm border border-blue-100'
          >
            {user.name?.charAt(0).toUpperCase() || '?'}
          </button>
        )}
        <button onClick={handleLogout} className="cursor-pointer"><img src={assets.logoutIcon} alt='Logout Icon' className='w-6 h-6' /></button>
      </div>
    </div>
  )
}

export default Navbar
