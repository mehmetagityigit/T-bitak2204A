
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, MessageSquare, User, ClipboardList, Droplet, UtensilsCrossed, Zap, Pill, Menu, X, LayoutGrid, ChevronRight } from 'lucide-react';
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
    return `relative group flex items-center justify-center flex-col gap-1 px-3 py-2 rounded-xl transition-all duration-300 ${
      isActive 
        ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 font-bold' 
        : 'text-gray-400 dark:text-gray-500 hover:text-teal-500'
    }`;
  };

  const FullMenu = () => (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-navy-950 p-6 animate-in slide-in-from-right duration-300 flex flex-col">
       <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">Sağlık Menüsü</h2>
          <button onClick={() => setIsMenuOpen(false)} className="p-3 bg-gray-100 dark:bg-navy-800 rounded-full">
             <X size={24} />
          </button>
       </div>

       <div className="flex-1 space-y-4 overflow-y-auto pb-10">
          <MenuLink to="/medications" icon={<Pill className="text-blue-500"/>} title="İlaç Takibi" sub="Dozlar ve hatırlatıcılar" onClick={() => setIsMenuOpen(false)}/>
          <MenuLink to="/blood-values" icon={<Droplet className="text-red-500"/>} title="Tahlil Sonuçları" sub="AI destekli analizler" onClick={() => setIsMenuOpen(false)}/>
          <MenuLink to="/diet" icon={<UtensilsCrossed className="text-orange-500"/>} title="Diyet & Kalori" sub="Günlük beslenme raporu" onClick={() => setIsMenuOpen(false)}/>
          {isAthlete && (
            <MenuLink to="/performance" icon={<Zap className="text-yellow-500"/>} title="Performans" sub="Sporcu gelişim analizi" onClick={() => setIsMenuOpen(false)}/>
          )}
          <MenuLink to="/entry" icon={<ClipboardList className="text-teal-500"/>} title="Günlük Veri Girişi" sub="Sağlık hafızanı güncelle" onClick={() => setIsMenuOpen(false)}/>
          <MenuLink to="/chat" icon={<MessageSquare className="text-indigo-500"/>} title="AI Asistan" sub="Gemini ile sağlık sohbeti" onClick={() => setIsMenuOpen(false)}/>
          <MenuLink to="/profile" icon={<User className="text-gray-500"/>} title="Profil Ayarları" sub="Tercihler ve Bluetooth" onClick={() => setIsMenuOpen(false)}/>
       </div>

       <div className="bg-teal-50 dark:bg-teal-900/10 p-4 rounded-2xl">
          <p className="text-xs text-center text-teal-700 dark:text-teal-400 font-bold">SağlıkAsist v2.5 • PHM v2.0 Aktif</p>
       </div>
    </div>
  );

  const MenuLink = ({ to, icon, title, sub, onClick }: any) => (
    <Link to={to} onClick={onClick} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-navy-900 rounded-2xl border border-gray-100 dark:border-navy-800 group">
       <div className="flex items-center gap-4">
          <div className="p-3 bg-white dark:bg-navy-800 rounded-xl shadow-sm group-hover:scale-110 transition-transform">{icon}</div>
          <div>
             <div className="font-bold text-gray-900 dark:text-white">{title}</div>
             <div className="text-xs text-gray-500 dark:text-gray-400">{sub}</div>
          </div>
       </div>
       <ChevronRight size={18} className="text-gray-300" />
    </Link>
  );

  return (
    <>
      {isMenuOpen && <FullMenu />}

      {/* DESKTOP (Hidden on mobile) */}
      <nav className="hidden lg:block fixed top-0 left-0 right-0 z-50 h-20 bg-white/80 dark:bg-navy-950/80 backdrop-blur-md border-b border-gray-100 dark:border-navy-800">
        <div className="container h-full max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-teal-600 p-2 rounded-lg text-white">
              <Activity size={24} />
            </div>
            <h1 className="text-xl font-black text-gray-800 dark:text-white">SağlıkAsist</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className={getNavItemClass('/')}>Durum</Link>
            <Link to="/medications" className={getNavItemClass('/medications')}>İlaç</Link>
            <Link to="/diet" className={getNavItemClass('/diet')}>Diyet</Link>
            <Link to="/blood-values" className={getNavItemClass('/blood-values')}>Tahlil</Link>
            <Link to="/entry" className={getNavItemClass('/entry')}>Veri Girişi</Link>
            <Link to="/chat" className={getNavItemClass('/chat')}>Asistan</Link>
            <Link to="/profile" className={getNavItemClass('/profile')}><User/></Link>
          </div>
        </div>
      </nav>

      {/* MOBILE (Optimized for small screens) */}
      <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-navy-950 border-t border-gray-200 dark:border-navy-800 pb-safe ${isAccessible ? 'h-24' : 'h-16'}`}>
        <div className="flex justify-around items-center h-full px-2">
          <Link to="/" className={getNavItemClass('/')}>
            <Activity size={isAccessible ? 32 : 24} />
            <span className="text-[10px] uppercase font-bold">Durum</span>
          </Link>
          <Link to="/chat" className={getNavItemClass('/chat')}>
            <MessageSquare size={isAccessible ? 32 : 24} />
            <span className="text-[10px] uppercase font-bold">Asistan</span>
          </Link>
          <Link to="/entry" className="-mt-12">
            <div className="bg-teal-600 rounded-full w-14 h-14 flex items-center justify-center text-white shadow-xl border-4 border-white dark:border-navy-950 transform active:scale-90 transition">
              <ClipboardList size={28} />
            </div>
          </Link>
          <button onClick={() => setIsMenuOpen(true)} className="flex flex-col items-center justify-center text-gray-400 p-2">
            <LayoutGrid size={isAccessible ? 32 : 24} />
            <span className="text-[10px] uppercase font-bold">Menü</span>
          </button>
          <Link to="/profile" className={getNavItemClass('/profile')}>
            <User size={isAccessible ? 32 : 24} />
            <span className="text-[10px] uppercase font-bold">Profil</span>
          </Link>
        </div>
      </nav>
    </>
  );
};
