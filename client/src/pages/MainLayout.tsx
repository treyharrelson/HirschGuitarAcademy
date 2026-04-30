import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from '../components/generic/Navbar';
import Sidebar, { SidebarLink } from '../components/generic/Sidebar';
import { DashButton } from '../components/generic/Buttons';
import { useAuth } from '../context/AuthContext';
import { assets } from '../assets/assets';

type RoleLink = {
  label: string;
  path: string;
  icon?: React.ReactNode;
  button?: React.ElementType;
}

const Icons = {
  CreateAccount: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>,
  Forum: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>,
  Follows: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>,
  Courses: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  Enrollments: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>,
  Metronome: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>,
  Timer: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Instructor: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  Admin: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
};

const NAV_LINKS: Record<string, RoleLink[]> = {
  guest: [
    { label: 'Create Account', path: '/', icon: Icons.CreateAccount }
  ],
  student: [
    { label: 'Home', path: '/home', icon: assets.homeIcon },
    { label: 'Forum', path: '/forum', icon: Icons.Forum },
    { label: 'Followed Threads', path: '/follows', icon: Icons.Follows },
    { label: 'View Available Courses', path: '/all-courses', icon: Icons.Courses },
    { label: 'My Enrollments', path: '/my-enrollments', icon: Icons.Enrollments },
    { label: 'Metronome', path: '/metronome', icon: Icons.Metronome },
    { label: 'Timer', path: '/timer', icon: Icons.Timer },
  ],
  instructor: [
    { label: 'Home', path: '/home', icon: assets.homeIcon },
    { label: 'Forum', path: '/forum', icon: Icons.Forum },
    { label: 'Followed Threads', path: '/follows', icon: Icons.Follows },
    { label: 'Metronome', path: '/metronome', icon: Icons.Metronome },
    { label: 'Timer', path: '/timer', icon: Icons.Timer },
    { label: 'Instructor Dashboard', path: '/instructor', icon: assets.newspaper_icon },
    { label: 'Add Course', path: '/instructor/add-course', icon: assets.duplicate_icon },
    { label: 'Manage Courses', path: '/instructor/my-courses', icon: assets.book_icon },

  ],
  moderator: [
    { label: 'Home', path: '/home', icon: assets.homeIcon },
    { label: 'Forum', path: '/forum', icon: Icons.Forum },
    { label: 'Followed Threads', path: '/follows', icon: Icons.Follows },
    { label: 'Metronome', path: '/metronome', icon: Icons.Metronome },
    { label: 'Timer', path: '/timer', icon: Icons.Timer },
    { label: 'Instructor Dashboard', path: '/instructor', icon: assets.newspaper_icon },
    { label: 'Add Course', path: '/instructor/add-course', icon: assets.duplicate_icon },
    { label: 'Manage Courses', path: '/instructor/my-courses', icon: assets.book_icon },
  ],
  admin: [
    { label: 'Home', path: '/home', icon: assets.homeIcon },
    { label: 'Forum', path: '/forum', button: DashButton },
    { label: 'Followed Threads', path: '/follows', icon: Icons.Follows },
    { label: 'Metronome', path: '/metronome', icon: Icons.Metronome },
    { label: 'Timer', path: '/timer', icon: Icons.Timer },
    { label: 'Manage Threads', path: '/manage/threads', button: DashButton },
    { label: 'Instructor Dashboard', path: '/instructor', icon: assets.newspaper_icon },
    { label: 'Add Course', path: '/instructor/add-course', icon: assets.duplicate_icon },
    { label: 'Manage Courses', path: '/instructor/my-courses', icon: assets.book_icon },
  ]
};

const MainLayout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showButton, setShowButton] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleInternalScroll = () => {
      if (scrollRef.current) {
        setShowButton(scrollRef.current.scrollTop > 100);
      }
    };

    const container = scrollRef.current;
    if (container) {
      container.addEventListener('scroll', handleInternalScroll);
    }
    return () => container?.removeEventListener('scroll', handleInternalScroll);
  }, []);

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex flex-col">
      {/* The Navbar stays pinned to the top */}
      <Navbar />
      <div className='flex flex-1 overflow-hidden pt-2 pl-2'>
        <Sidebar>
          {user?.role && (NAV_LINKS[user.role] || NAV_LINKS['guest']).map((link, index) => {
            const renderIcon = () => {
              if (typeof link.icon === 'string') {
                return (
                  <img
                    src={link.icon}
                    alt={link.label}
                    className={`w-5 h-5 object-contain transition-all ${isActive
                      ? 'brightness-0 invert-[30%] sepia(100%) saturate(500%) hue-rotate(190deg)'
                      : 'grayscale opacity-60'
                      }`}
                  />
                );
              }

              if (React.isValidElement(link.icon)) {
                return React.cloneElement(link.icon as React.ReactElement<{ className?: string }>, {
                  className: `w-5 h-5 transition-all ${isActive ? 'text-sky-600 stroke-[2.5px]' : 'text-gray-600 opacity-80 stroke-[2px]'} fill-none`
                });
              }
            }
            const isActive = location.pathname === link.path;
            return (
              <SidebarLink
                key={index}
                icon={renderIcon()}
                label={link.label}
                isActive={isActive}
                onClick={() => { navigate(link.path); scrollToTop(); }}
              />
            );
          })}
        </Sidebar>

        {/* The Outlet is where your actual page content renders */}
        <main className="flex-grow overflow-y-auto relative px-8 pb-20" ref={scrollRef}>
          <Outlet />
          {showButton && (
            <button
              onClick={scrollToTop}
              className="fixed bottom-8 right-8 z-50 p-3 bg-sky-600 text-white rounded-full shadow-2xl hover:bg-sky-700 transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center"
              title="Back to Top">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://w3.org">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          )}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;