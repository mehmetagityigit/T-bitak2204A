import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

import { Dashboard } from './components/Dashboard';
import { DailyEntry } from './components/DailyEntry';
import { AIChat } from './components/AIChat';
import { ProfileConfig } from './components/ProfileConfig';
import { BloodValuesPage } from './components/BloodValuesPage';
import { FitnessPage } from './components/FitnessPage';
import { Navigation } from './components/Navigation';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { UserProfile, INITIAL_PROFILE, DailyLog } from './types';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch User Profile from Firestore
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          // Fallback if auth exists but no profile doc
          setProfile(INITIAL_PROFILE);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
    
    // Check if log for this date exists and remove it (to replace with new one)
    const otherLogs = profile.dailyLogs.filter(l => l.date !== log.date);
    
    // Sort logs by date just in case
    const newLogs = [...otherLogs, log].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const updatedProfile = {
      ...profile,
      dailyLogs: newLogs
    };
    await handleUpdateProfile(updatedProfile);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />

          {/* Protected Routes */}
          <Route path="*" element={
            user && profile ? (
              <>
                <main className="md:ml-0 md:pt-16 pb-16 md:pb-0">
                  <Routes>
                    <Route path="/" element={<Dashboard profile={profile} />} />
                    <Route path="/blood-values" element={<BloodValuesPage profile={profile} onUpdate={handleUpdateProfile} />} />
                    <Route path="/fitness" element={<FitnessPage profile={profile} onUpdate={handleUpdateProfile} />} />
                    <Route path="/entry" element={<DailyEntry onSave={handleAddLog} profile={profile} />} />
                    <Route path="/chat" element={<AIChat profile={profile} onUpdateProfile={handleUpdateProfile} />} />
                    <Route path="/profile" element={<ProfileConfig profile={profile} onUpdate={handleUpdateProfile} />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
                <Navigation />
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