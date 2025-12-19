
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User } from 'firebase/auth'; 
import { auth, db } from './firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore'; 

import { Dashboard } from './components/Dashboard';
import { DailyEntry } from './components/DailyEntry';
import { AIChat } from './components/AIChat';
import { ProfileConfig } from './components/ProfileConfig';
import { BloodValuesPage } from './components/BloodValuesPage';
import { DietPage } from './components/DietPage';
import { PerformancePage } from './components/PerformancePage';
import { MedicationPage } from './components/MedicationPage';
import { Navigation } from './components/Navigation';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { UserProfile, INITIAL_PROFILE, DailyLog, SymptomLog } from './types';
import { Loader2, Wifi, WifiOff, CloudOff } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // --- GLOBAL BLUETOOTH STATE ---
  const [liveHeartRate, setLiveHeartRate] = useState<number>(0);
  const [bluetoothDevice, setBluetoothDevice] = useState<any | null>(null);
  const [isDeviceConnected, setIsDeviceConnected] = useState(false);
  
  // INITIAL LOAD: Check for Offline Profile first to speed up mobile start
  useEffect(() => {
    const checkOfflineAccess = () => {
      if (!navigator.onLine) {
        const cachedProfile = localStorage.getItem('offline_profile');
        const cachedUser = localStorage.getItem('offline_user');
        if (cachedProfile && cachedUser) {
          setProfile(JSON.parse(cachedProfile));
          setUser(JSON.parse(cachedUser));
          setLoading(false);
        }
      }
    };
    checkOfflineAccess();
  }, []);

  // Monitor Auth State
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Save basic user info for offline verification
        localStorage.setItem('offline_user', JSON.stringify({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName
        }));

        const docRef = doc(db, "users", currentUser.uid);
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            const safeProfile = {
               ...data,
               preferences: {
                  theme: 'light',
                  isAthleteMode: false,
                  accessibilityMode: false,
                  ...data.preferences
               },
               performanceLogs: data.performanceLogs || [],
               medications: data.medications || []
            };
            setProfile(safeProfile);
            // CACHE FOR OFFLINE
            localStorage.setItem('offline_profile', JSON.stringify(safeProfile));
          } else {
            setProfile(INITIAL_PROFILE);
          }
        } catch (e) {
          console.error("Online fetch failed, checking local cache...");
          const cached = localStorage.getItem('offline_profile');
          if (cached) setProfile(JSON.parse(cached));
        }
      } else {
        setUser(null);
        localStorage.removeItem('offline_profile');
        localStorage.removeItem('offline_user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync Logic
  useEffect(() => {
    const handleStatusChange = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      if (online && profile) {
         syncOfflineData(profile);
      }
    };

    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, [profile]);

  const syncOfflineData = async (currentProfile: UserProfile) => {
     const offlineLogs = localStorage.getItem('queued_logs');
     if (!offlineLogs) return;

     const logsToSync = JSON.parse(offlineLogs);
     if (logsToSync.length === 0) return;

     setSyncMessage("Çevrimdışı veriler bulutla eşitleniyor...");
     
     // Merge offline logs into profile
     const updatedProfile = {
        ...currentProfile,
        dailyLogs: [...currentProfile.dailyLogs, ...logsToSync].filter((v, i, a) => a.findIndex(t => t.date === v.date) === i)
     };

     await handleUpdateProfile(updatedProfile);
     localStorage.removeItem('queued_logs');
     setSyncMessage("Senkronizasyon başarılı!");
     setTimeout(() => setSyncMessage(null), 3000);
  };

  const handleUpdateProfile = async (updated: UserProfile) => {
    setProfile(updated);
    // Always update local cache immediately
    localStorage.setItem('offline_profile', JSON.stringify(updated));

    if (navigator.onLine && user) {
      try {
        await setDoc(doc(db, "users", user.uid), updated);
      } catch (e) {
        console.error("Error updating online profile:", e);
      }
    } else {
      // Queue changes if offline
      console.log("Offline: Profile change cached locally.");
    }
  };

  const handleAddLog = async (log: DailyLog) => {
    if (!profile) return;
    const otherLogs = profile.dailyLogs.filter(l => l.date !== log.date);
    const newLogs = [...otherLogs, log].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const updatedProfile = { ...profile, dailyLogs: newLogs };
    
    if (!navigator.onLine) {
      const existingQueue = JSON.parse(localStorage.getItem('queued_logs') || '[]');
      localStorage.setItem('queued_logs', JSON.stringify([...existingQueue, log]));
    }
    
    await handleUpdateProfile(updatedProfile);
  };

  // Bluetooth Handlers (existing logic kept)
  const handleBluetoothConnect = async () => {
    try {
      const device = await (navigator as any).bluetooth.requestDevice({ filters: [{ services: ['heart_rate'] }] });
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('heart_rate');
      const characteristic = await service.getCharacteristic('heart_rate_measurement');
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
        const value = event.target.value;
        const flags = value.getUint8(0);
        const rate16Bits = flags & 0x1;
        let heartRateMeasurement = rate16Bits ? value.getUint16(1, true) : value.getUint8(1);
        setLiveHeartRate(heartRateMeasurement);
      });
      setBluetoothDevice(device);
      setIsDeviceConnected(true);
    } catch (error) { console.error("Bluetooth Error:", error); }
  };

  const handleBluetoothDisconnect = () => {
    if (bluetoothDevice?.gatt?.connected) bluetoothDevice.gatt.disconnect();
    setIsDeviceConnected(false);
    setLiveHeartRate(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-navy-950">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className={`min-h-screen font-sans transition-colors duration-300 ${profile?.preferences?.theme === 'dark' ? 'dark bg-navy-950' : 'bg-gray-50'}`}>
        
        {/* OFFLINE INDICATOR */}
        {!isOnline && (
           <div className="fixed top-0 left-0 right-0 z-[100] bg-orange-500 text-white text-[10px] font-bold py-1 px-4 flex items-center justify-center gap-2">
              <WifiOff size={12} /> Çevrimdışı Mod: Veriler yerel hafızaya kaydediliyor.
           </div>
        )}

        {syncMessage && (
           <div className="fixed top-12 left-1/2 transform -translate-x-1/2 z-[60] bg-teal-600 text-white px-6 py-2 rounded-full shadow-2xl flex items-center gap-2 text-sm font-bold animate-in slide-in-from-top-4">
             <Wifi size={16} /> {syncMessage}
           </div>
        )}
        
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />

          <Route path="*" element={
            user && profile ? (
              <>
                <main className={`md:ml-0 ${!isOnline ? 'pt-12' : 'pt-16'} pb-20 md:pb-0 min-h-screen`}>
                  <Routes>
                    <Route path="/" element={<Dashboard profile={profile} liveHeartRate={liveHeartRate} isDeviceConnected={isDeviceConnected} />} />
                    <Route path="/blood-values" element={<BloodValuesPage profile={profile} onUpdate={handleUpdateProfile} />} />
                    <Route path="/diet" element={<DietPage profile={profile} onUpdate={handleAddLog} onUpdateProfile={handleUpdateProfile} />} />
                    <Route path="/medications" element={<MedicationPage profile={profile} onUpdateProfile={handleUpdateProfile} />} />
                    <Route path="/entry" element={<DailyEntry onSave={handleAddLog} profile={profile} />} />
                    <Route path="/chat" element={<AIChat profile={profile} onUpdateProfile={handleUpdateProfile} />} />
                    {profile.preferences?.isAthleteMode && <Route path="/performance" element={<PerformancePage profile={profile} onUpdateProfile={handleUpdateProfile} />} />}
                    <Route path="/profile" element={<ProfileConfig profile={profile} onUpdate={handleUpdateProfile} onConnectBluetooth={handleBluetoothConnect} onDisconnectBluetooth={handleBluetoothDisconnect} isDeviceConnected={isDeviceConnected} />} />
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </main>
                <Navigation profile={profile} />
              </>
            ) : (
              <Navigate to="/login" />
            )
          } />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
