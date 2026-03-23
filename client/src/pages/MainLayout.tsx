import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/generic/Navbar';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* The Navbar stays pinned to the top */}
      <Navbar />
      
      {/* The Outlet is where your actual page content will render! */}
      <main className="flex-grow">
        <Outlet /> 
      </main>
    </div>
  );
};

export default MainLayout;