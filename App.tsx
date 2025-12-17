import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

import { Dashboard } from './components/Dashboard';
import { DailyEntry } from './components/DailyEntry';
import { AIChat } from './components/AIChat';
import { ProfileConfig } from './components/ProfileConfig';
import { BloodValuesPage } from './components/BloodValuesPage';
import { DietPage } from './components/DietPage';
import { PerformancePage } from './components/PerformancePage';
import { Navigation } from './components/Navigation';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { UserProfile, INITIAL_PROFILE, DailyLog, SymptomLog } from './types';
import { Loader2, Wifi } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // --- GLOBAL BLUETOOTH STATE ---
  const [liveHeartRate, setLiveHeartRate] = useState<number>(0);
  // BluetoothDevice is not a standard type in TypeScript DOM lib, using any
  const [bluetoothDevice, setBluetoothDevice] = useState<any | null>(null);
  const [isDeviceConnected, setIsDeviceConnected] = useState(false);
  
  // Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch User Profile from Firestore
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          // Merge with default preferences if missing
          const safeProfile = {
             ...data,
             preferences: {
                theme: 'light',
                isAthleteMode: false,
                ...data.preferences
             },
             performanceLogs: data.performanceLogs || []
          };
          setProfile(safeProfile as UserProfile);
        } else {
          setProfile(INITIAL_PROFILE);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle Dark Mode Effect
  useEffect(() => {
    if (profile?.preferences?.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [profile?.preferences?.theme]);

  // --- OFFLINE SYNC LOGIC ---
  useEffect(() => {
    const handleStatusChange = () => {
      setIsOnline(navigator.onLine);
      if (navigator.onLine && profile) {
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
     const offlineDataStr = localStorage.getItem('offline_symptoms');
     if (!offlineDataStr) return;

     const offlineItems = JSON.parse(offlineDataStr);
     if (offlineItems.length === 0) return;

     setSyncMessage("Çevrimdışı veriler senkronize ediliyor...");

     // Create new symptom logs from offline interactions
     const newSymptoms: SymptomLog[] = offlineItems.map((item: any, idx: number) => ({
        id: `offline-${Date.now()}-${idx}`,
        timestamp: item.timestamp,
        symptom: item.text,
        notes: `Offline AI Analysis: Detected ${item.disease} (Risk: ${item.risk})`
     }));

     const updatedProfile = {
        ...currentProfile,
        symptomHistory: [...currentProfile.symptomHistory, ...newSymptoms]
     };

     // Update Profile
     await handleUpdateProfile(updatedProfile);
     
     // Clear Storage
     localStorage.removeItem('offline_symptoms');
     setSyncMessage("Senkronizasyon tamamlandı!");
     setTimeout(() => setSyncMessage(null), 3000);
  };

  // --- REAL BLUETOOTH HANDLER ---
  const handleBluetoothConnect = async () => {
    try {
      // @ts-ignore - Navigator.bluetooth types
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }]
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('heart_rate');
      const characteristic = await service.getCharacteristic('heart_rate_measurement');

      await characteristic.startNotifications();
      
      characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
        const value = event.target.value;
        const flags = value.getUint8(0);
        const rate16Bits = flags & 0x1;
        let heartRateMeasurement = 0;
        
        if (rate16Bits) {
          heartRateMeasurement = value.getUint16(1, true); // Little Endian
        } else {
          heartRateMeasurement = value.getUint8(1);
        }
        
        setLiveHeartRate(heartRateMeasurement);
      });

      setBluetoothDevice(device);
      setIsDeviceConnected(true);

      if (profile && user) {
        const updatedProfile = {
          ...profile,
          connectedDevice: {
            id: device.id,
            name: device.name || 'Nabız Bandı',
            type: 'watch' as const,
            lastSync: new Date().toISOString(),
            isConnected: true
          }
        };
        handleUpdateProfile(updatedProfile);
      }

      device.addEventListener('gattserverdisconnected', () => {
        setIsDeviceConnected(false);
        setLiveHeartRate(0);
        alert("Cihaz bağlantısı koptu.");
      });

    } catch (error) {
      console.error("Bluetooth Connection Error:", error);
      throw error;
    }
  };

  const handleBluetoothDisconnect = () => {
    if (bluetoothDevice && bluetoothDevice.gatt?.connected) {
      bluetoothDevice.gatt.disconnect();
    }
    setIsDeviceConnected(false);
    setLiveHeartRate(0);
    setBluetoothDevice(null);

    if (profile && user) {
      const updatedProfile = {
        ...profile,
        connectedDevice: {
          ...profile.connectedDevice!,
          isConnected: false
        }
      };
      handleUpdateProfile(updatedProfile);
    }
  };

  // Sync state changes to Firestore
  const handleUpdateProfile = async (updated: UserProfile) => {
    setProfile(updated);
    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid), updated);
      } catch (e) {
        console.error("Error updating profile:", e);
      }
    }
  };

  const handleAddLog = async (log: DailyLog) => {
    if (!profile) return;
    const otherLogs = profile.dailyLogs.filter(l => l.date !== log.date);
    const newLogs = [...otherLogs, log].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const updatedProfile = {
      ...profile,
      dailyLogs: newLogs
    };
    await handleUpdateProfile(updatedProfile);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-navy-950">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans transition-colors duration-300 dark:bg-navy-950 dark:text-gray-100">
        {syncMessage && (
           <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[60] bg-green-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-bold animate-in slide-in-from-top-2">
             <Wifi size={16} /> {syncMessage}
           </div>
        )}
        
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />

          <Route path="*" element={
            user && profile ? (
              <>
                <main className="md:ml-0 md:pt-16 pb-16 md:pb-0">
                  <Routes>
                    <Route 
                      path="/" 
                      element={<Dashboard profile={profile} liveHeartRate={liveHeartRate} isDeviceConnected={isDeviceConnected} />} 
                    />
                    <Route path="/blood-values" element={<BloodValuesPage profile={profile} onUpdate={handleUpdateProfile} />} />
                    <Route path="/diet" element={<DietPage profile={profile} onUpdate={handleAddLog} onUpdateProfile={handleUpdateProfile} />} />
                    <Route path="/entry" element={<DailyEntry onSave={handleAddLog} profile={profile} />} />
                    <Route path="/chat" element={<AIChat profile={profile} onUpdateProfile={handleUpdateProfile} />} />
                    
                    {/* Conditional Performance Route */}
                    {profile.preferences?.isAthleteMode && (
                       <Route path="/performance" element={<PerformancePage profile={profile} onUpdateProfile={handleUpdateProfile} />} />
                    )}

                    <Route 
                      path="/profile" 
                      element={
                        <ProfileConfig 
                          profile={profile} 
                          onUpdate={handleUpdateProfile}
                          onConnectBluetooth={handleBluetoothConnect}
                          onDisconnectBluetooth={handleBluetoothDisconnect}
                          isDeviceConnected={isDeviceConnected}
                        />
                      } 
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
                <Navigation profile={profile} />
              </>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
        </Routes>
      </div>
    </HashRouter>
  );
};

export default App;