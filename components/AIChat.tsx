import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, UserProfile, SymptomLog } from '../types';
import { createGeminiChat } from '../services/geminiService';
import { processOfflineQuery } from '../services/ruleEngine';
import { Send, WifiOff, Wifi, Bot, User, Stethoscope, Server, FileText, AlertTriangle, Database } from 'lucide-react';
import { Chat, GenerateContentResponse } from '@google/genai';

interface Props {
  profile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
}

// Helper to parse simple markdown (Bold)
const formatText = (text: string) => {
  return text.split(/(\*\*.*?\*\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

export const AIChat: React.FC<Props> = ({ profile, onUpdateProfile }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: `Merhaba ${profile.name}! Bugün nasıl hissediyorsun? Senin sağlık verilerine göre sana önerilerde bulunabilirim.`,
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [loggedSymptomAlert, setLoggedSymptomAlert] = useState<string | null>(null);
  
  // Custom Response States (e.g. Doctor Note)
  const [lastDoctorNote, setLastDoctorNote] = useState<string | null>(null);

  const chatRef = useRef<HTMLDivElement>(null);
  const geminiChatRef = useRef<Chat | null>(null);

  // Initialize Gemini Chat session
  useEffect(() => {
    if (!isOfflineMode) {
      geminiChatRef.current = createGeminiChat(profile);
    }
  }, [isOfflineMode]); 

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, loggedSymptomAlert, lastDoctorNote]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setLoggedSymptomAlert(null);
    setLastDoctorNote(null);

    try {
      let responseText = "";
      
      if (isOfflineMode) {
        // --- OFFLINE RULE ENGINE MODE ---
        const result = await processOfflineQuery(userMsg.text, profile);
        responseText = result.response;

        if (result.doctorNote) {
           setLastDoctorNote(result.doctorNote);
        }

        // Store offline message to LocalStorage for Syncing later
        const pendingSync = JSON.parse(localStorage.getItem('offline_symptoms') || '[]');
        pendingSync.push({
           text: userMsg.text,
           risk: result.risk,
           disease: result.disease,
           timestamp: new Date().toISOString()
        });
        localStorage.setItem('offline_symptoms', JSON.stringify(pendingSync));

      } else {
        // --- ONLINE GEMINI MODE ---
        if (geminiChatRef.current) {
          try {
             let result: GenerateContentResponse = await geminiChatRef.current.sendMessage({
                message: userMsg.text
             });

             // Handle Function Calls (Tools)
             while (result.functionCalls && result.functionCalls.length > 0) {
               const functionCalls = result.functionCalls;
               const responseParts: any[] = [];

               for (const call of functionCalls) {
                 if (call.name === 'logSymptom') {
                   const args = call.args as any;
                   const newSymptom: SymptomLog = {
                     id: Date.now().toString(),
                     timestamp: new Date().toISOString(),
                     symptom: args.symptom,
                     severity: args.severity,
                     duration: args.duration
                   };
                   
                   const updatedProfile = {
                     ...profile,
                     symptomHistory: [...profile.symptomHistory, newSymptom]
                   };
                   onUpdateProfile(updatedProfile);

                   setLoggedSymptomAlert(`Semptom kaydedildi: ${args.symptom}`);

                   responseParts.push({
                     functionResponse: {
                       id: call.id,
                       name: call.name,
                       response: { result: "Symptom logged successfully." }
                     }
                   });
                 }
               }

               if (responseParts.length > 0) {
                 result = await geminiChatRef.current.sendMessage({ message: responseParts });
               } else {
                 break;
               }
             }

             responseText = result.text || "Bir hata oluştu.";

          } catch (error) {
            console.error("Gemini Error:", error);
            responseText = "Bağlantı hatası. İnternetiniz yoksa 'Çevrimdışı Mod'a geçebilirsiniz.";
          }
        }
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now(),
        isOfflineResponse: isOfflineMode
      };
      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Bir hata oluştu. Lütfen tekrar deneyin.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] md:h-[calc(100vh-80px)] bg-gray-50">
      
      {/* Chat Header */}
      <div className="bg-white p-4 shadow-sm flex items-center justify-between z-10">
        <div>
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <Bot className="text-teal-600" /> 
            Sağlık Asistanı
          </h2>
          <p className="text-xs text-gray-500">
            {isOfflineMode ? "Yerel Veritabanı (Offline)" : "Gemini AI (Online)"}
          </p>
        </div>
        <button 
          onClick={() => setIsOfflineMode(!isOfflineMode)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
            isOfflineMode ? 'bg-indigo-100 text-indigo-700' : 'bg-teal-100 text-teal-700'
          }`}
        >
          {isOfflineMode ? <Database size={14} /> : <Wifi size={14} />}
          {isOfflineMode ? 'Çevrimdışı Mod' : 'Online Mod'}
        </button>
      </div>

      {/* Messages Area */}
      <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[85%] md:max-w-[70%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-2`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : (msg.isOfflineResponse ? 'bg-orange-100 text-orange-600' : 'bg-teal-100 text-teal-600')
              }`}>
                {msg.role === 'user' ? <User size={16}/> : <Bot size={16}/>}
              </div>
              
              <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
              }`}>
                {formatText(msg.text)}
                {msg.isOfflineResponse && (
                  <div className="mt-2 text-[10px] opacity-70 border-t border-gray-200 pt-1 flex items-center gap-1 text-orange-600">
                    <Database size={10} /> Yerel Veri Kaynağı
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Doctor Note Card (For Medium/High Risk) */}
        {lastDoctorNote && (
           <div className="flex justify-start animate-in fade-in slide-in-from-bottom-4">
              <div className="ml-10 max-w-[80%] bg-yellow-50 border border-yellow-200 p-4 rounded-2xl rounded-tl-none shadow-md">
                 <div className="flex items-center gap-2 text-yellow-800 font-bold mb-2 border-b border-yellow-200 pb-2">
                    <FileText size={18} /> Doktora İletilecek Not
                 </div>
                 <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono bg-white p-3 rounded border border-gray-100">
                    {lastDoctorNote}
                 </pre>
                 <div className="mt-2 text-[10px] text-yellow-700 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    Bu notu doktorunuzla daha iyi iletişim kurmak için kullanabilirsiniz.
                 </div>
              </div>
           </div>
        )}

        {/* System Alert for Logging */}
        {loggedSymptomAlert && (
          <div className="flex justify-center my-2">
            <div className="bg-teal-50 border border-teal-200 text-teal-700 px-3 py-1 rounded-full text-xs flex items-center gap-2 shadow-sm animate-pulse">
              <Stethoscope size={12} />
              {loggedSymptomAlert}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100">
               <div className="flex space-x-1">
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
               </div>
             </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white p-4 border-t border-gray-200 mb-16 md:mb-0">
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isOfflineMode ? "Yerel veritabanında ara (Örn: Baş ağrısı)..." : "AI Yaşam Koçuna sor..."}
            className="flex-1 p-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-2">
          {isOfflineMode ? "Çevrimdışı Mod: Veriler cihazınızdaki kural seti ile eşleştiriliyor." : "Yapay zeka tıbbi teşhis koyamaz. Acil durumlarda doktora başvurunuz."}
        </p>
      </div>

    </div>
  );
};