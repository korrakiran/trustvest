import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, PieChart, GraduationCap, AlertTriangle, LogOut, Activity } from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800";

  const handleLogout = () => {
    // In a real app, clear tokens here
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-8 w-8 text-emerald-400" />
            <span className="text-xl font-bold">TrustVest</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">AI-Powered Investing</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link to="/dashboard" className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive('/dashboard')}`}>
            <PieChart size={20} />
            <span>Dashboard</span>
          </Link>
          <Link to="/simulator" className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive('/simulator')}`}>
            <Activity size={20} />
            <span>Crash Simulator</span>
          </Link>
          <Link to="/education" className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive('/education')}`}>
            <GraduationCap size={20} />
            <span>Learn & Protect</span>
          </Link>
          <Link to="/fraud-control" className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive('/fraud-control')}`}>
            <AlertTriangle size={20} />
            <span>Fraud Monitor</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button onClick={handleLogout} className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors">
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-slate-900 text-white z-50 p-4 flex justify-between items-center">
         <div className="flex items-center space-x-2">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
            <span className="text-lg font-bold">TrustVest</span>
          </div>
          <div className="flex space-x-4">
            <Link to="/dashboard"><PieChart size={24} /></Link>
            <Link to="/simulator"><Activity size={24} /></Link>
          </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-20 md:pt-8">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;