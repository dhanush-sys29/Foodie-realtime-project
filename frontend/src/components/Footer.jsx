import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-secondary border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <span className="font-pacifico text-3xl text-primary">FOODIE</span>
            <p className="text-textSecondary text-sm mt-3 font-inter leading-relaxed">
              Redefining the way you discover food. Connecting customers, restaurants, and delivery agents in one unified platform.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold font-poppins mb-4 text-sm uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2">
              {[['/', 'Browse Restaurants'], ['/login', 'Sign In'], ['/checkout', 'Cart']].map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="text-textSecondary hover:text-primary transition-colors text-sm font-inter">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Team */}
          <div>
            <h4 className="text-white font-semibold font-poppins mb-4 text-sm uppercase tracking-wider">Built By</h4>
            <ul className="space-y-1 text-sm text-textSecondary font-inter">
              <li>A. Vinay (24X31A0504)</li>
              <li>A. Sai Sree (24X31A0508)</li>
              <li>B. Sravya (24X31A0532)</li>
              <li>Ch. Dhanush Reddy (24X31A0558)</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-textSecondary text-xs font-inter">
            © 2025-2026 FOODIE · Sri Indu Institute of Engineering and Technology — CSE
          </p>
          <p className="text-textSecondary text-xs font-inter">Built with ❤️ using MERN Stack</p>
        </div>
      </div>
    </footer>
  );
}
