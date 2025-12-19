
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, UserProfile, SymptomLog } from '../types';
import { createGeminiChat } from '../services/geminiService';
import { processOfflineQuery } from '../services/ruleEngine';
import { Send, Wifi, Bot, User, Stethoscope, Database, Sparkles } from 'lucide-react';
import { Chat, GenerateContentResponse } from '@google/genai';

interface Props {
  profile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
}

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
      text: `Merhaba ${profile.firstName}! Bugün sağlık verilerini analiz etmemi ister misin?`,
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const geminiChatRef = useRef<Chat | null>(null);

  useEffect(() => {
    if (!isOfflineMode) {
      geminiChatRef.current = createGeminiChat(profile);
    }
  }, [isOfflineMode, profile]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      let responseText = "";
      if (isOfflineMode) {
        const result = await processOfflineQuery(userMsg.text, profile);
        responseText = result.response;
      } else if (geminiChatRef.current) {
        let result: GenerateContentResponse = await geminiChatRef.current.sendMessage({ message: userMsg.text });
        responseText = result.text || "Yanıt alınamadı.";
      }
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: responseText, timestamp: Date.now(), isOfflineResponse: isOfflineMode }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Hata oluştu. İnterneti kontrol edin.", timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] md:h-[calc(100vh-80px)] bg-gray-50 dark:bg-navy-950">
      <div className="bg-white dark:bg-navy-900 p-4 shadow-sm flex items-center justify-between border-b dark:border-navy-800">
        <div className="flex items-center gap-2">
          <Bot className="text-teal-600" />
          <h2 className="font-bold dark:text-white">Sağlık Asistanı</h2>
        </div>
        <button onClick={() => setIsOfflineMode(!isOfflineMode)} className={`px-3 py-1 rounded-full text-xs font-bold ${isOfflineMode ? 'bg-orange-100 text-orange-700' : 'bg-teal-100 text-teal-700'}`}>
          {isOfflineMode ? <Database size={14} className="inline mr-1"/> : <Wifi size={14} className="inline mr-1"/>}
          {isOfflineMode ? 'Çevrimdışı' : 'Online'}
        </button>
      </div>

      <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-2`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-teal-600 text-white shadow-md' : 'bg-white dark:bg-navy-800 text-teal-600 border dark:border-navy-700 shadow-sm'}`}>
                {msg.role === 'user' ? <User size={16}/> : <Bot size={16}/>}
              </div>
              <div className={`p-4 rounded-3xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-teal-600 text-white rounded-tr-none' : 'bg-white dark:bg-navy-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-navy-700 rounded-tl-none'}`}>
                {formatText(msg.text)}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
           <div className="flex gap-2 items-center text-xs text-gray-400 dark:text-gray-500 animate-pulse px-2">
              <Sparkles size={14} className="animate-spin" /> Asistan düşünüyor...
           </div>
        )}
      </div>

      <div className="p-4 bg-white dark:bg-navy-900 border-t dark:border-navy-800 mb-16 md:mb-0">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Sorunuzu yazın..." className="flex-1 p-4 bg-gray-100 dark:bg-navy-950 dark:text-white rounded-2xl outline-none focus:ring-2 focus:ring-teal-500 transition-all"/>
          <button onClick={handleSend} disabled={isLoading || !input.trim()} className="p-4 bg-teal-600 text-white rounded-2xl shadow-lg active:scale-95 disabled:opacity-50 transition-all"><Send size={20}/></button>
        </div>
      </div>
    </div>
  );
};
