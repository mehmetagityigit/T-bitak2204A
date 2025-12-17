
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, MessageSquare, User, ClipboardList, Droplet, UtensilsCrossed, Zap, Pill, Menu, X, LayoutGrid } from 'lucide-react';
import { UserProfile } from '../types';

interface Props {
  profile?: UserProfile;
}

export const Navigation: React.FC<Props> = ({ profile }) => {
  const isAthlete = profile?.preferences?.isAthleteMode;
  const isAccessible = profile?.preferences?.accessibilityMode;
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getNavItemClass = (path: string) => {
    const isActive = location.pathname === path;
    return `relative group flex items-center justify-center flex-col md:flex-row gap-1 md:gap-2 px-3 py-2 rounded-xl transition-all duration-300 ${
      isActive 
        ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 font-bold' 
        : 'text-gray-400 dark:text-gray-500 hover:text-teal-500'
    }`;
  };

  const iconSize = isAccessible ? 28 : 20;

  const MenuOverlay = () => (
    <div className={`fixed inset-0 z-[100] bg-white dark:bg-navy-950 p-6 animate-in fade-in slide-in-from-bottom-10 flex flex-col`}>
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white">Tüm Menüler</h2>
        <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-gray-100 dark:bg-navy-800 rounded-full">
          <X size={24} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link onClick={() => setIsMenuOpen(false)} to="/medications" className="bg-gray-50 dark:bg-navy-900 p-6 rounded-3xl flex flex-col items-center gap-3 border border-gray-100 dark:border-navy-800">
           <Pill size={32} className="text-blue-500" />
           <span className="font-bold">İlaçlarım</span>
        </Link>
        <Link onClick={() => setIsMenuOpen(false)} to="/blood-values" className="bg-gray-50 dark:bg-navy-900 p-6 rounded-3xl flex flex-col items-center gap-3 border border-gray-100 dark:border-navy-800">
           <Droplet size={32} className="text-red-500" />
           <span className="font-bold">Tahlillerim</span>
        </Link>
        <Link onClick={() => setIsMenuOpen(false)} to="/diet" className="bg-gray-50 dark:bg-navy-900 p-6 rounded-3xl flex flex-col items-center gap-3 border border-gray-100 dark:border-navy-800">
           <UtensilsCrossed size={32} className="text-orange-500" />
           <span className="font-bold">Diyet & Kalori</span>
        </Link>
        {isAthlete && (
           <Link onClick={() => setIsMenuOpen(false)} to="/performance" className="bg-gray-50 dark:bg-navy-900 p-6 rounded-3xl flex flex-col items-center gap-3 border border-gray-100 dark:border-navy-800">
             <Zap size={32} className="text-yellow-500" />
             <span className="font-bold">Performans</span>
           </Link>
        )}
        <Link onClick={() => setIsMenuOpen(false)} to="/" className="bg-gray-50 dark:bg-navy-900 p-6 rounded-3xl flex flex-col items-center gap-3 border border-gray-100 dark:border-navy-800">
           <Activity size={32} className="text-teal-500" />
           <span className="font-bold">Durum Özeti</span>
        </Link>
        <Link onClick={() => setIsMenuOpen(false)} to="/profile" className="bg-gray-50 dark:bg-navy-900 p-6 rounded-3xl flex flex-col items-center gap-3 border border-gray-100 dark:border-navy-800">
           <User size={32} className="text-indigo-500" />
           <span className="font-bold">Profil</span>
        </Link>
      </div>

      <div className="mt-auto p-4 bg-teal-50 dark:bg-teal-900/10 rounded-2xl text-center">
         <p className="text-xs text-teal-700 dark:text-teal-400 font-bold">SağlıkAsist v2.0 - PHM Aktif</p>
      </div>
    </div>
  );

  return (
    <>
      {isMenuOpen && <MenuOverlay />}

      {/* DESKTOP NAVIGATION */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 h-20 bg-white/80 dark:bg-navy-950/80 backdrop-blur-md border-b border-gray-100 dark:border-navy-800 shadow-sm">
        <div className="container h-full max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-teal-600 p-2 rounded-lg text-white">
              <Activity size={24} />
            </div>
            <h1 className="text-xl font-black text-gray-800 dark:text-white">SağlıkAsist</h1>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/" className={getNavItemClass('/')}><Activity size={iconSize}/> <span className="text-sm">Durum</span></Link>
            <Link to="/medications" className={getNavItemClass('/medications')}><Pill size={iconSize}/> <span className="text-sm">İlaç</span></Link>
            <Link to="/diet" className={getNavItemClass('/diet')}><UtensilsCrossed size={iconSize}/> <span className="text-sm">Diyet</span></Link>
            <Link to="/blood-values" className={getNavItemClass('/blood-values')}><Droplet size={iconSize}/> <span className="text-sm">Tahlil</span></Link>
            <Link to="/entry" className={getNavItemClass('/entry')}><ClipboardList size={iconSize}/> <span className="text-sm">Giriş</span></Link>
            <Link to="/chat" className={getNavItemClass('/chat')}><MessageSquare size={iconSize}/> <span className="text-sm">Asistan</span></Link>
            <Link to="/profile" className={getNavItemClass('/profile')}><User size={iconSize}/></Link>
          </div>
        </div>
      </nav>

      {/* MOBILE NAVIGATION */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-navy-950 border-t border-gray-200 dark:border-navy-800 pb-safe ${isAccessible ? 'h-24' : 'h-16'}`}>
        <div className="flex justify-around items-center h-full px-1">
          <Link to="/" className={getNavItemClass('/')}>
            <Activity size={isAccessible ? 32 : 24} />
          </Link>
          <Link to="/chat" className={getNavItemClass('/chat')}>
            <MessageSquare size={isAccessible ? 32 : 24} />
          </Link>
          <Link to="/entry" className="-mt-10">
            <div className="bg-teal-600 rounded-full w-14 h-14 flex items-center justify-center text-white shadow-xl border-4 border-white dark:border-navy-950">
              <ClipboardList size={28} />
            </div>
          </Link>
          <button onClick={() => setIsMenuOpen(true)} className="flex items-center justify-center text-gray-400 p-2">
            <LayoutGrid size={isAccessible ? 32 : 24} />
          </button>
          <Link to="/profile" className={getNavItemClass('/profile')}>
            <User size={isAccessible ? 32 : 24} />
          </Link>
        </div>
      </nav>
    </>
  );
};
