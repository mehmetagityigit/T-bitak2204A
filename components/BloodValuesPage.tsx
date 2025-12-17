import React, { useState, useRef } from 'react';
import { UserProfile, INITIAL_PROFILE, CustomBloodValue } from '../types';
import { Droplet, Save, AlertCircle, Plus, Trash2, Beaker, Camera, Upload, Loader2, ScanLine } from 'lucide-react';
import { analyzeBloodResult } from '../services/geminiService';

interface Props {
  profile: UserProfile;
  onUpdate: (p: UserProfile) => void;
}

const COMMON_UNITS = [
  "mg/dL",
  "ug/dL",
  "ng/mL",
  "pg/mL",
  "mIU/L",
  "U/L",
  "g/dL",
  "mcL",
  "%"
];

export const BloodValuesPage: React.FC<Props> = ({ profile, onUpdate }) => {
  const [bloodValues, setBloodValues] = useState({
    ...INITIAL_PROFILE.bloodValues,
    ...profile.bloodValues,
    customValues: profile.bloodValues.customValues || []
  });

  const [newCustom, setNewCustom] = useState({ name: '', value: '', unit: 'mg/dL' });
  const [isSaved, setIsSaved] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (key: string, value: string) => {
    setBloodValues(prev => ({
      ...prev,
      [key]: Number(value)
    }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        const mimeType = file.type;

        try {
          const extractedData = await analyzeBloodResult(base64Data, mimeType);
          if (Object.keys(extractedData).length === 0) {
            alert("Görselden anlamlı veri okunamadı. Lütfen fotoğrafın net olduğundan emin olun.");
          } else {
            setBloodValues(prev => ({
              ...prev,
              ...extractedData
            }));
            alert(`Başarıyla okunan değerler: ${Object.keys(extractedData).join(', ')}`);
          }
        } catch (error) {
          console.error("AI Analysis Error:", error);
          alert("Analiz sırasında bir hata oluştu.");
        } finally {
          setIsAnalyzing(false);
        }
      };
    } catch (e) {
      console.error("File reading error", e);
      setIsAnalyzing(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleAddCustom = () => {
    if (!newCustom.name || !newCustom.value) return;
    const newVal: CustomBloodValue = {
      id: Date.now().toString(),
      name: newCustom.name,
      value: Number(newCustom.value),
      unit: newCustom.unit
    };
    setBloodValues(prev => ({
      ...prev,
      customValues: [...prev.customValues, newVal]
    }));
    setNewCustom({ name: '', value: '', unit: 'mg/dL' });
  };

  const handleDeleteCustom = (id: string) => {
    setBloodValues(prev => ({
      ...prev,
      customValues: prev.customValues.filter(v => v.id !== id)
    }));
  };

  const handleSave = () => {
    onUpdate({
      ...profile,
      bloodValues: {
        ...bloodValues,
        lastTestDate: new Date().toISOString().split('T')[0] 
      }
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Droplet className="text-red-500" /> Tahlil Sonuçları
        </h1>
        <p className="text-gray-500 mt-1">
          Son yaptırdığınız kan testi sonuçlarını manuel girebilir veya fotoğrafını yükleyerek yapay zekaya okutabilirsiniz.
        </p>
      </header>

      {/* AI Scan Section */}
      <div className="bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center text-center md:flex-row md:text-left md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold flex items-center justify-center md:justify-start gap-2">
              <ScanLine /> Akıllı Tahlil Okuyucu
            </h3>
            <p className="text-teal-50 text-sm mt-1">
              Tahlil kağıdının fotoğrafını çekin, değerleri otomatik dolduralım.
            </p>
          </div>
          
          <button 
            onClick={triggerFileInput}
            disabled={isAnalyzing}
            className="w-full md:w-auto bg-white text-teal-700 px-8 py-4 rounded-xl font-extrabold shadow-md hover:bg-teal-50 transition active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="animate-spin" size={24} /> Analiz Ediliyor...
              </>
            ) : (
              <>
                <Camera size={24} /> Fotoğraf Çek / Yükle
              </>
            )}
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            capture="environment"
            className="hidden" 
          />
        </div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 p-4 opacity-[0.03] pointer-events-none">
          <Droplet size={200} className="text-red-900" />
        </div>

        <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Temel Kan Değerleri</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-8">
          {[
            { key: 'hemoglobin', label: 'Hemoglobin (HGB)', unit: 'g/dL', ref: '12-17' },
            { key: 'ferritin', label: 'Ferritin', unit: 'ng/mL', ref: '30-400' },
            { key: 'iron', label: 'Demir', unit: 'ug/dL', ref: '60-170' },
            { key: 'b12', label: 'B12 Vitamini', unit: 'pg/mL', ref: '200-900' },
            { key: 'd3', label: 'D3 Vitamini', unit: 'ng/mL', ref: '30-100' },
            { key: 'magnesium', label: 'Magnezyum', unit: 'mg/dL', ref: '1.7-2.2' },
            { key: 'glucose', label: 'Açlık Şekeri', unit: 'mg/dL', ref: '70-100' },
            { key: 'tsh', label: 'TSH (Tiroid)', unit: 'mIU/L', ref: '0.4-4.0' },
            { key: 'wbc', label: 'WBC (Lökosit)', unit: 'mcL', ref: '4000-10000' },
          ].map((item) => (
             <div key={item.key} className="space-y-1">
                <label className="flex items-center justify-between text-gray-700 text-xs font-bold uppercase tracking-wide">
                  <span>{item.label}</span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] text-gray-500">Ref: {item.ref}</span>
                </label>
                <div className="relative">
                  <input 
                    type="number" inputMode="decimal"
                    value={(bloodValues as any)[item.key]} 
                    onChange={(e) => handleChange(item.key, e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-lg font-medium text-gray-800 bg-gray-50 focus:bg-white transition-colors"
                  />
                  <div className="absolute right-3 top-3.5 text-gray-400 text-xs">{item.unit}</div>
                </div>
             </div>
          ))}
        </div>

        <h3 className="font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
          <Beaker size={20} className="text-teal-600" /> Diğer Tahliller
        </h3>
        
        {bloodValues.customValues.length > 0 && (
          <div className="space-y-3 mb-6">
            {bloodValues.customValues.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-200">
                <div>
                  <div className="font-bold text-gray-800">{item.name}</div>
                  <div className="text-sm text-gray-500">{item.value} <span className="text-xs bg-gray-200 px-1 rounded">{item.unit}</span></div>
                </div>
                <button onClick={() => handleDeleteCustom(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="bg-teal-50 p-4 rounded-xl border border-teal-100">
          <h4 className="text-sm font-bold text-teal-800 mb-3">Yeni Tahlil Ekle</h4>
          <div className="grid grid-cols-1 gap-3">
            <input 
              type="text" placeholder="Test Adı (Örn: Kolesterol)" 
              value={newCustom.name} onChange={e => setNewCustom({...newCustom, name: e.target.value})}
              className="w-full p-3 border border-teal-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
            />
            <div className="flex gap-2">
                <input 
                  type="number" inputMode="decimal" placeholder="Değer" 
                  value={newCustom.value} onChange={e => setNewCustom({...newCustom, value: e.target.value})}
                  className="w-full p-3 border border-teal-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                />
                <select 
                  value={newCustom.unit} onChange={e => setNewCustom({...newCustom, unit: e.target.value})}
                  className="w-24 p-3 border border-teal-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-300"
                >
                  {COMMON_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
            </div>
            <button onClick={handleAddCustom} disabled={!newCustom.name || !newCustom.value}
              className="w-full p-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center justify-center disabled:opacity-50 transition font-bold"
            >
              <Plus size={20} className="mr-2"/> Ekle
            </button>
          </div>
        </div>
      </div>

      <button onClick={handleSave} className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-lg transform transition active:scale-[0.98] flex items-center justify-center gap-2 mb-8">
        {isSaved ? "Kaydedildi!" : (
          <>
            <Save size={20} />
            Sonuçları Güncelle
          </>
        )}
      </button>
    </div>
  );
};
