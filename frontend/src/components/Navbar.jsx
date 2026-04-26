import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-secondary/90 backdrop-blur-md border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center gap-2 text-decoration-none">
            <span className="text-3xl font-pacifico text-primary tracking-wide drop-shadow-sm">FOODIE</span>
          </Link>
          
          <div className="flex items-center gap-6">
            {user ? (
              <>
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-textSecondary text-sm font-inter">
                    Hi, <span className="font-semibold text-white">{user.name}</span>
                  </span>
                  <span className="text-xs text-accent font-medium uppercase tracking-wider bg-accent/10 px-2 py-0.5 rounded-full mt-1">
                    {user.role}
                  </span>
                </div>
                
                {user.role === 'customer' && (
                  <Link 
                    to="/checkout" 
                    className="relative text-white hover:text-primary transition-colors p-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </Link>
                )}
                
                <button 
                  onClick={handleLogout} 
                  className="font-poppins text-sm font-semibold text-error border border-error/50 hover:bg-error/10 px-4 py-2 rounded-lg transition-all duration-300"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link 
                to="/login" 
                className="font-poppins text-sm font-semibold bg-primary hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
