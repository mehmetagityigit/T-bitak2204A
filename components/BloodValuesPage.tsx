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
  // Merge current profile values with defaults to handle old user data
  const [bloodValues, setBloodValues] = useState({
    ...INITIAL_PROFILE.bloodValues,
    ...profile.bloodValues,
    customValues: profile.bloodValues.customValues || []
  });

  const [newCustom, setNewCustom] = useState({ name: '', value: '', unit: 'mg/dL' });
  const [isSaved, setIsSaved] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Standard Fields
  const handleChange = (key: string, value: string) => {
    setBloodValues(prev => ({
      ...prev,
      [key]: Number(value)
    }));
  };

  // Handle Image Upload & AI Analysis
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);

    try {
      // Convert to Base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64Data = base64String.split(',')[1];
        const mimeType = file.type;

        try {
          const extractedData = await analyzeBloodResult(base64Data, mimeType);
          
          if (Object.keys(extractedData).length === 0) {
            alert("Görselden anlamlı veri okunamadı. Lütfen fotoğrafın net olduğundan emin olun.");
          } else {
            // Update state with found values
            setBloodValues(prev => ({
              ...prev,
              ...extractedData
            }));
            alert(`Başarıyla okunan değerler: ${Object.keys(extractedData).join(', ')}`);
          }
        } catch (error) {
          console.error("AI Analysis Error:", error);
          alert("Analiz sırasında bir hata oluştu. Lütfen internet bağlantınızı kontrol edin.");
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

  // Handle Custom Fields Adding
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

  // Handle Custom Fields Deleting
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
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <ScanLine /> Akıllı Tahlil Okuyucu
            </h3>
            <p className="text-teal-50 text-sm mt-1">
              Tahlil kağıdının fotoğrafını çekin, değerleri otomatik dolduralım.
            </p>
          </div>
          
          <button 
            onClick={triggerFileInput}
            disabled={isAnalyzing}
            className="bg-white text-teal-700 px-6 py-3 rounded-xl font-bold shadow-md hover:bg-teal-50 transition active:scale-95 flex items-center gap-2 whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="animate-spin" size={20} /> Analiz Ediliyor...
              </>
            ) : (
              <>
                <Camera size={20} /> Fotoğraf Yükle
              </>
            )}
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
        {/* Decor */}
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 p-4 opacity-[0.03] pointer-events-none">
          <Droplet size={200} className="text-red-900" />
        </div>

        <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Temel Kan Değerleri</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          
          {/* Hemoglobin */}
          <div className="space-y-2">
            <label className="flex items-center justify-between text-gray-700 font-bold">
              <span>Hemoglobin (HGB)</span>
              <span className="text-xs font-normal bg-gray-100 px-2 py-1 rounded text-gray-500">Ref: 12-17 g/dL</span>
            </label>
            <div className="relative">
              <input 
                type="number" 
                value={bloodValues.hemoglobin} 
                onChange={(e) => handleChange('hemoglobin', e.target.value)}
                className="w-full p-3 border border-red-100 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-300 outline-none text-lg font-medium text-gray-800 transition-colors"
              />
              <div className="absolute right-3 top-3 text-gray-400 text-sm">g/dL</div>
            </div>
            {bloodValues.hemoglobin < 12 && <p className="text-xs text-red-500 font-medium">⚠️ Kansızlık (Anemi) riski</p>}
          </div>

          {/* Ferritin */}
          <div className="space-y-2">
            <label className="flex items-center justify-between text-gray-700 font-bold">
              <span>Ferritin (Depo Demir)</span>
              <span className="text-xs font-normal bg-gray-100 px-2 py-1 rounded text-gray-500">Ref: 30-400 ng/mL</span>
            </label>
            <div className="relative">
              <input 
                type="number" 
                value={bloodValues.ferritin} 
                onChange={(e) => handleChange('ferritin', e.target.value)}
                className="w-full p-3 border border-red-100 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-300 outline-none text-lg font-medium text-gray-800"
              />
              <div className="absolute right-3 top-3 text-gray-400 text-sm">ng/mL</div>
            </div>
            {bloodValues.ferritin < 30 && <p className="text-xs text-red-500 font-medium">⚠️ Demir depoları düşük</p>}
          </div>

          {/* Demir */}
          <div className="space-y-2">
            <label className="flex items-center justify-between text-gray-700 font-bold">
              <span>Demir (Serum Iron)</span>
              <span className="text-xs font-normal bg-gray-100 px-2 py-1 rounded text-gray-500">Ref: 60-170 ug/dL</span>
            </label>
            <div className="relative">
              <input 
                type="number" 
                value={bloodValues.iron} 
                onChange={(e) => handleChange('iron', e.target.value)}
                className="w-full p-3 border border-red-100 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-300 outline-none text-lg font-medium text-gray-800"
              />
              <div className="absolute right-3 top-3 text-gray-400 text-sm">ug/dL</div>
            </div>
            {bloodValues.iron < 60 && <p className="text-xs text-red-500 font-medium">⚠️ Referans değerin altında</p>}
          </div>

          {/* B12 */}
          <div className="space-y-2">
            <label className="flex items-center justify-between text-gray-700 font-bold">
              <span>B12 Vitamini</span>
              <span className="text-xs font-normal bg-gray-100 px-2 py-1 rounded text-gray-500">Ref: 200-900 pg/mL</span>
            </label>
            <div className="relative">
              <input 
                type="number" 
                value={bloodValues.b12} 
                onChange={(e) => handleChange('b12', e.target.value)}
                className="w-full p-3 border border-red-100 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-300 outline-none text-lg font-medium text-gray-800"
              />
              <div className="absolute right-3 top-3 text-gray-400 text-sm">pg/mL</div>
            </div>
            {bloodValues.b12 < 200 && <p className="text-xs text-red-500 font-medium">⚠️ Referans değerin altında</p>}
          </div>

          {/* D3 */}
          <div className="space-y-2">
            <label className="flex items-center justify-between text-gray-700 font-bold">
              <span>D3 Vitamini</span>
              <span className="text-xs font-normal bg-gray-100 px-2 py-1 rounded text-gray-500">Ref: 30-100 ng/mL</span>
            </label>
            <div className="relative">
              <input 
                type="number" 
                value={bloodValues.d3} 
                onChange={(e) => handleChange('d3', e.target.value)}
                className="w-full p-3 border border-red-100 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-300 outline-none text-lg font-medium text-gray-800"
              />
              <div className="absolute right-3 top-3 text-gray-400 text-sm">ng/mL</div>
            </div>
            {bloodValues.d3 < 30 && <p className="text-xs text-red-500 font-medium">⚠️ Referans değerin altında</p>}
          </div>

          {/* Magnesium */}
          <div className="space-y-2">
            <label className="flex items-center justify-between text-gray-700 font-bold">
              <span>Magnezyum</span>
              <span className="text-xs font-normal bg-gray-100 px-2 py-1 rounded text-gray-500">Ref: 1.7-2.2 mg/dL</span>
            </label>
            <div className="relative">
              <input 
                type="number" 
                value={bloodValues.magnesium} 
                onChange={(e) => handleChange('magnesium', e.target.value)}
                className="w-full p-3 border border-red-100 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-300 outline-none text-lg font-medium text-gray-800"
              />
              <div className="absolute right-3 top-3 text-gray-400 text-sm">mg/dL</div>
            </div>
          </div>

          {/* Glucose */}
          <div className="space-y-2">
            <label className="flex items-center justify-between text-gray-700 font-bold">
              <span>Açlık Şekeri (Glukoz)</span>
              <span className="text-xs font-normal bg-gray-100 px-2 py-1 rounded text-gray-500">Ref: 70-100 mg/dL</span>
            </label>
            <div className="relative">
              <input 
                type="number" 
                value={bloodValues.glucose} 
                onChange={(e) => handleChange('glucose', e.target.value)}
                className="w-full p-3 border border-red-100 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-300 outline-none text-lg font-medium text-gray-800"
              />
              <div className="absolute right-3 top-3 text-gray-400 text-sm">mg/dL</div>
            </div>
          </div>

           {/* TSH */}
           <div className="space-y-2">
            <label className="flex items-center justify-between text-gray-700 font-bold">
              <span>TSH (Tiroid)</span>
              <span className="text-xs font-normal bg-gray-100 px-2 py-1 rounded text-gray-500">Ref: 0.4-4.0 mIU/L</span>
            </label>
            <div className="relative">
              <input 
                type="number" 
                value={bloodValues.tsh} 
                onChange={(e) => handleChange('tsh', e.target.value)}
                className="w-full p-3 border border-red-100 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-300 outline-none text-lg font-medium text-gray-800"
              />
              <div className="absolute right-3 top-3 text-gray-400 text-sm">mIU/L</div>
            </div>
          </div>

          {/* WBC */}
          <div className="space-y-2">
            <label className="flex items-center justify-between text-gray-700 font-bold">
              <span>WBC (Lökosit)</span>
              <span className="text-xs font-normal bg-gray-100 px-2 py-1 rounded text-gray-500">Ref: 4000-10000</span>
            </label>
            <div className="relative">
              <input 
                type="number" 
                value={bloodValues.wbc} 
                onChange={(e) => handleChange('wbc', e.target.value)}
                className="w-full p-3 border border-red-100 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-300 outline-none text-lg font-medium text-gray-800"
              />
              <div className="absolute right-3 top-3 text-gray-400 text-sm">mcL</div>
            </div>
             {bloodValues.wbc > 10000 && <p className="text-xs text-orange-500 font-medium">⚠️ Enfeksiyon riski olabilir</p>}
          </div>
        </div>

        {/* Custom Values Section */}
        <h3 className="font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
          <Beaker size={20} className="text-teal-600" /> Diğer Tahliller
        </h3>
        
        {/* List Existing Custom Values */}
        {bloodValues.customValues.length > 0 && (
          <div className="space-y-3 mb-6">
            {bloodValues.customValues.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-200">
                <div>
                  <div className="font-bold text-gray-800">{item.name}</div>
                  <div className="text-sm text-gray-500">{item.value} <span className="text-xs bg-gray-200 px-1 rounded">{item.unit}</span></div>
                </div>
                <button 
                  onClick={() => handleDeleteCustom(item.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Custom Value Form */}
        <div className="bg-teal-50 p-4 rounded-xl border border-teal-100">
          <h4 className="text-sm font-bold text-teal-800 mb-3">Yeni Tahlil Ekle</h4>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="md:col-span-5">
              <input 
                type="text" 
                placeholder="Test Adı (Örn: Kolesterol)" 
                value={newCustom.name}
                onChange={e => setNewCustom({...newCustom, name: e.target.value})}
                className="w-full p-2 border border-teal-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
              />
            </div>
            <div className="md:col-span-3">
              <input 
                type="number" 
                placeholder="Değer" 
                value={newCustom.value}
                onChange={e => setNewCustom({...newCustom, value: e.target.value})}
                className="w-full p-2 border border-teal-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
              />
            </div>
            <div className="md:col-span-3">
              <select 
                value={newCustom.unit}
                onChange={e => setNewCustom({...newCustom, unit: e.target.value})}
                className="w-full p-2 border border-teal-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-300"
              >
                {COMMON_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="md:col-span-1">
              <button 
                onClick={handleAddCustom}
                disabled={!newCustom.name || !newCustom.value}
                className="w-full h-full bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center justify-center disabled:opacity-50 transition"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-xs text-gray-400">Son Güncelleme: {profile.bloodValues.lastTestDate}</span>
        </div>
      </div>

      <button 
        onClick={handleSave}
        className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg transform transition active:scale-95 flex items-center justify-center gap-2"
      >
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