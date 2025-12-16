import React from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, MessageSquare, User, ClipboardList, Droplet, Dumbbell, UtensilsCrossed } from 'lucide-react';

export const Navigation: React.FC = () => {
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center w-full h-full space-y-1 text-sm font-medium transition-colors ${
      isActive ? 'text-teal-600 bg-teal-50 border-t-2 border-teal-600' : 'text-gray-500 hover:text-teal-500 hover:bg-gray-50'
    }`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white border-t border-gray-200 shadow-lg md:top-0 md:bottom-auto md:h-16 md:border-t-0 md:border-b">
      <div className="container h-full max-w-5xl mx-auto">
        <div className="flex items-center justify-between h-full px-1 md:px-8">
          {/* Logo - Desktop only */}
          <div className="hidden text-xl font-bold text-teal-700 md:flex items-center gap-2">
            <div className="p-1 bg-teal-600 rounded text-white"><Activity size={20}/></div>
            SağlıkAsist
          </div>

          <div className="flex w-full h-full md:w-auto md:gap-4 lg:gap-6 justify-between md:justify-start">
            <NavLink to="/" className={navClass}>
              <Activity className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-[9px] md:text-sm">Durum</span>
            </NavLink>
            <NavLink to="/diet" className={navClass}>
              <UtensilsCrossed className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-[9px] md:text-sm">Diyet</span>
            </NavLink>
             <NavLink to="/blood-values" className={navClass}>
              <Droplet className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-[9px] md:text-sm">Tahlil</span>
            </NavLink>
            <NavLink to="/fitness" className={navClass}>
              <Dumbbell className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-[9px] md:text-sm">Fitness</span>
            </NavLink>
            <NavLink to="/entry" className={navClass}>
              <ClipboardList className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-[9px] md:text-sm">Giriş</span>
            </NavLink>
            <NavLink to="/chat" className={navClass}>
              <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-[9px] md:text-sm">Asistan</span>
            </NavLink>
            <NavLink to="/profile" className={navClass}>
              <User className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-[9px] md:text-sm">Profil</span>
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
};