import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, MessageSquare, User, ClipboardList, Droplet, UtensilsCrossed, Zap, Pill } from 'lucide-react';
import { UserProfile } from '../types';

interface Props {
  profile?: UserProfile;
}

export const Navigation: React.FC<Props> = ({ profile }) => {
  const isAthlete = profile?.preferences?.isAthleteMode;
  const isAccessible = profile?.preferences?.accessibilityMode;
  const location = useLocation();

  const getNavItemClass = (path: string) => {
    const isActive = location.pathname === path;
    const baseClasses = `relative group flex items-center justify-center flex-col md:flex-row rounded-xl transition-all duration-300 ${isAccessible ? 'px-4 py-3 gap-2' : 'gap-1 md:gap-2 px-3 py-2'}`;
    const activeClasses = isActive 
        ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 shadow-sm md:bg-transparent md:shadow-none font-bold' 
        : 'text-gray-400 dark:text-gray-500 hover:text-teal-500 hover:bg-gray-50 dark:hover:bg-navy-800';
    
    return `${baseClasses} ${activeClasses}`;
  };

  const iconSize = isAccessible ? 28 : 20;

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
            <Link to="/" className={getNavItemClass('/')}>
              <Activity size={iconSize} />
              <span className="text-sm">Durum</span>
            </Link>
            
            <Link to="/medications" className={getNavItemClass('/medications')}>
              <Pill size={iconSize} />
              <span className="text-sm">İlaç</span>
            </Link>

            <Link to="/diet" className={getNavItemClass('/diet')}>
              <UtensilsCrossed size={iconSize} />
              <span className="text-sm">Diyet</span>
            </Link>
            
            {/* Athlete Mode Link */}
            {isAthlete && (
               <Link to="/performance" className={getNavItemClass('/performance')}>
                 <Zap size={iconSize} className="text-orange-500" />
                 <span className="text-sm text-orange-600 dark:text-orange-400">Performans</span>
               </Link>
            )}

            <Link to="/blood-values" className={getNavItemClass('/blood-values')}>
              <Droplet size={iconSize} />
              <span className="text-sm">Tahlil</span>
            </Link>
            <Link to="/entry" className={getNavItemClass('/entry')}>
              <ClipboardList size={iconSize} />
              <span className="text-sm">Giriş</span>
            </Link>
            <Link to="/chat" className={getNavItemClass('/chat')}>
              <MessageSquare size={iconSize} />
              <span className="text-sm">Asistan</span>
            </Link>
            <div className="w-px h-8 bg-gray-200 dark:bg-navy-700 mx-2"></div>
            <Link to="/profile" className={getNavItemClass('/profile')}>
              <div className="w-8 h-8 bg-gray-100 dark:bg-navy-800 rounded-full flex items-center justify-center border border-gray-200 dark:border-navy-700">
                <User size={16} />
              </div>
            </Link>
          </div>
        </div>
      </nav>

      {/* MOBILE NAVIGATION (Bottom Bar) */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-navy-950/95 backdrop-blur-md border-t border-gray-200 dark:border-navy-800 pb-2 pt-1 transition-colors duration-300 shadow-[0_-5px_10px_rgba(0,0,0,0.02)] ${isAccessible ? 'h-20' : 'h-16'}`}>
        <div className="flex justify-around items-center h-full px-1">
          <Link to="/" className={getNavItemClass('/')}>
            <Activity size={isAccessible ? 32 : 24} strokeWidth={2.5} />
            <span className="text-[10px] font-medium hidden xs:block">Durum</span>
          </Link>
          
          <Link to="/medications" className={getNavItemClass('/medications')}>
            <Pill size={isAccessible ? 32 : 24} strokeWidth={2.5} />
            <span className="text-[10px] font-medium hidden xs:block">İlaç</span>
          </Link>

          {isAthlete ? (
            <Link to="/performance" className={getNavItemClass('/performance')}>
               <Zap size={isAccessible ? 32 : 24} strokeWidth={2.5} />
               <span className="text-[10px] font-medium hidden xs:block">Spor</span>
            </Link>
          ) : (
             !isAccessible && (
                <Link to="/diet" className={getNavItemClass('/diet')}>
                <UtensilsCrossed size={24} strokeWidth={2.5} />
                <span className="text-[10px] font-medium hidden xs:block">Diyet</span>
                </Link>
             )
          )}

          <Link to="/entry" className="-mt-8">
            <div className={`rounded-full flex items-center justify-center text-white shadow-lg shadow-teal-300/50 dark:shadow-black/50 border-4 border-white dark:border-navy-900 transform transition active:scale-95 ${isAccessible ? 'w-16 h-16 bg-teal-700' : 'w-14 h-14 bg-teal-600'}`}>
              <ClipboardList size={isAccessible ? 32 : 24} />
            </div>
          </Link>

          <Link to="/chat" className={getNavItemClass('/chat')}>
            <MessageSquare size={isAccessible ? 32 : 24} strokeWidth={2.5} />
            <span className="text-[10px] font-medium hidden xs:block">Asistan</span>
          </Link>
          <Link to="/profile" className={getNavItemClass('/profile')}>
            <User size={isAccessible ? 32 : 24} strokeWidth={2.5} />
            <span className="text-[10px] font-medium hidden xs:block">Profil</span>
          </Link>
        </div>
      </nav>
    </>
  );
};
