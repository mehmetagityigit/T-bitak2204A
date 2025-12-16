import React from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, MessageSquare, User, ClipboardList, Droplet, UtensilsCrossed, Zap } from 'lucide-react';
import { UserProfile } from '../types';

interface Props {
  profile?: UserProfile;
}

export const Navigation: React.FC<Props> = ({ profile }) => {
  const isAthlete = profile?.preferences?.isAthleteMode;

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `relative group flex items-center justify-center flex-col md:flex-row gap-1 md:gap-2 px-3 py-2 rounded-xl transition-all duration-300 ${
      isActive 
        ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 shadow-sm md:bg-transparent md:shadow-none font-bold' 
        : 'text-gray-400 dark:text-gray-500 hover:text-teal-500 hover:bg-gray-50 dark:hover:bg-navy-800'
    }`;

  return (
    <>
      {/* DESKTOP NAVIGATION (Top Bar) */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 h-20 bg-white/80 dark:bg-navy-950/80 backdrop-blur-md border-b border-gray-100 dark:border-navy-800 shadow-sm transition-colors duration-300">
        <div className="container h-full max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-teal-600 p-2 rounded-lg text-white shadow-lg shadow-teal-200 dark:shadow-none">
              <Activity size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">SağlıkAsist</h1>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium tracking-wider uppercase">AI Health Guardian</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NavLink to="/" className={navItemClass}>
              <Activity size={20} />
              <span className="text-sm">Durum</span>
            </NavLink>
            <NavLink to="/diet" className={navItemClass}>
              <UtensilsCrossed size={20} />
              <span className="text-sm">Diyet</span>
            </NavLink>
            
            {/* Athlete Mode Link */}
            {isAthlete && (
               <NavLink to="/performance" className={navItemClass}>
                 <Zap size={20} className="text-orange-500" />
                 <span className="text-sm text-orange-600 dark:text-orange-400">Performans</span>
               </NavLink>
            )}

            <NavLink to="/blood-values" className={navItemClass}>
              <Droplet size={20} />
              <span className="text-sm">Tahlil</span>
            </NavLink>
            <NavLink to="/entry" className={navItemClass}>
              <ClipboardList size={20} />
              <span className="text-sm">Giriş</span>
            </NavLink>
            <NavLink to="/chat" className={navItemClass}>
              <MessageSquare size={20} />
              <span className="text-sm">Asistan</span>
            </NavLink>
            <div className="w-px h-8 bg-gray-200 dark:bg-navy-700 mx-2"></div>
            <NavLink to="/profile" className={navItemClass}>
              <div className="w-8 h-8 bg-gray-100 dark:bg-navy-800 rounded-full flex items-center justify-center border border-gray-200 dark:border-navy-700">
                <User size={16} />
              </div>
            </NavLink>
          </div>
        </div>
      </nav>

      {/* MOBILE NAVIGATION (Bottom Bar) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-navy-950 border-t border-gray-200 dark:border-navy-800 pb-safe transition-colors duration-300">
        <div className="flex justify-around items-center h-16 px-1">
          <NavLink to="/" className={navItemClass}>
            <Activity size={24} strokeWidth={2.5} />
            <span className="text-[10px] font-medium hidden xs:block">Durum</span>
          </NavLink>
          
          {isAthlete ? (
            <NavLink to="/performance" className={navItemClass}>
               <Zap size={24} strokeWidth={2.5} />
               <span className="text-[10px] font-medium hidden xs:block">Spor</span>
            </NavLink>
          ) : (
            <NavLink to="/diet" className={navItemClass}>
              <UtensilsCrossed size={24} strokeWidth={2.5} />
              <span className="text-[10px] font-medium hidden xs:block">Diyet</span>
            </NavLink>
          )}

          <NavLink to="/entry" className="-mt-8">
            <div className="w-14 h-14 bg-teal-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-teal-300 dark:shadow-black/50 border-4 border-white dark:border-navy-900 transform transition active:scale-95">
              <ClipboardList size={24} />
            </div>
          </NavLink>
          <NavLink to="/chat" className={navItemClass}>
            <MessageSquare size={24} strokeWidth={2.5} />
            <span className="text-[10px] font-medium hidden xs:block">Asistan</span>
          </NavLink>
          <NavLink to="/profile" className={navItemClass}>
            <User size={24} strokeWidth={2.5} />
            <span className="text-[10px] font-medium hidden xs:block">Profil</span>
          </NavLink>
        </div>
      </nav>
    </>
  );
};