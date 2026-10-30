"use client";
import React, { useState, useRef } from 'react';

export default function AgentUI() {
  const [isRecording, setIsRecording] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  
  // కొత్త లాజిక్: ఒకేసారి English, Telugu, Suggestion మూడింటినీ స్టోర్ చేయడానికి
  const [messages, setMessages] = useState<any[]>([]); 

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  // కాల్ స్టార్ట్ చేయగానే...
  const handleStartCall = async () => {
    setIsRecording(true);
    setShowSummary(false);
    setMessages([]);

    try {
      // 1. WebSocket కి కనెక్ట్ అవ్వడం (బ్యాకెండ్ కి)
      // నెక్స్ట్ స్టెప్ లో ఇక్కడ మనం ngrok లింక్ పెడతాం
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";
      socketRef.current = new WebSocket(wsUrl);

      // బ్యాకెండ్ నుండి జెమినీ రిజల్ట్ రాగానే...
      socketRef.current.onmessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        // కొత్త మెసేజ్ ముందే (Top) పడుతుంది
        setMessages(prev => [{
          id: Date.now(),
          english: data.english,
          telugu: data.telugu,
          suggestion: data.answer
        }, ...prev]);
      };

      // 2. లాప్‌టాప్ స్పీకర్ వాయిస్ రికార్డ్ అవ్వడానికి ఏ ఫిల్టర్స్ లేకుండా రా-ఆడియో సెటప్
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,   // ఎకో క్యాన్సిలేషన్ ఆఫ్
          noiseSuppression: false, // నాయిస్ ఫిల్టర్ ఆఫ్
          autoGainControl: false   // ఆటో వాల్యూమ్ ఆఫ్
        }
      });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // ప్రతి 2 సెకన్లకి ఆడియో ముక్కని బ్యాకెండ్ కి పంపుతుంది
      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0 && socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(event.data);
        }
      };

      mediaRecorder.start(2000); // 2000ms (2 seconds) chunks
    } catch (err) {
      console.error("మైక్ లేదా వెబ్‌సాకెట్ కనెక్ట్ అవ్వలేదు:", err);
      alert("మైక్ పర్మిషన్ ఇవ్వు మచ్చా!");
      setIsRecording(false);
    }
  };

  // కాల్ ఎండ్ చేయగానే...
  const handleEndCall = () => {
    setIsRecording(false);
    setShowSummary(true);
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    if (socketRef.current) {
      socketRef.current.close();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6 font-sans relative">
      
      {/* Navbar / Header */}
      <header className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            AI Co-Pilot Agent 🚀
          </h1>
          <p className="text-sm text-gray-400 mt-1">HMCA Legacy Data Fix - Context Active</p>
        </div>
        
        {isRecording ? (
          <button onClick={handleEndCall} className="px-6 py-2.5 rounded-full font-bold text-white transition-all shadow-lg hover:scale-105 bg-red-500 hover:bg-red-600 animate-pulse">
            🛑 End Live Call
          </button>
        ) : (
          <button onClick={handleStartCall} className="px-6 py-2.5 rounded-full font-bold text-white transition-all shadow-lg hover:scale-105 bg-emerald-500 hover:bg-emerald-600">
            🎙️ Start Call
          </button>
        )}
      </header>

      {/* 3-Column Layout */}
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all ${showSummary ? 'blur-sm pointer-events-none' : ''}`}>
        
        {/* Column 1: Live English Transcript */}
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-2xl flex flex-col h-[75vh]">
          <div className="flex items-center mb-4">
            <div className={`w-3 h-3 rounded-full mr-2 ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
            <h2 className="text-lg font-semibold text-gray-200">Live Transcript</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-600">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-sm text-center mt-10 italic">
                {isRecording ? "Listening & Sending to Backend..." : "కాల్ స్టార్ట్ చేయడానికి పైన బటన్ నొక్కండి."}
              </p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="bg-gray-700/50 p-3 rounded-lg border border-gray-600/50 transition-all animate-in fade-in slide-in-from-top-2">
                  <p className="text-md leading-relaxed text-gray-200">{msg.english}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: Telugu Translation */}
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-2xl flex flex-col h-[75vh]">
          <div className="flex items-center mb-4">
            <span className="text-xl mr-2">🗣️</span>
            <h2 className="text-lg font-semibold text-orange-300">Telugu Translation</h2>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-600">
             {messages.length === 0 ? (
               <p className="text-gray-500 text-sm text-center mt-10 italic">ట్రాన్స్‌లేషన్ కోసం వెయిటింగ్...</p>
             ) : (
               messages.map((msg) => (
                 <div key={msg.id} className="bg-gray-700/50 p-3 rounded-lg border-l-2 border-orange-400 mb-3 animate-in fade-in slide-in-from-top-2">
                   <p className="text-md text-gray-200">{msg.telugu}</p>
                 </div>
               ))
             )}
          </div>
        </div>

        {/* Column 3: AI Suggestions */}
        <div className="bg-gray-800 rounded-xl p-5 border border-blue-900/50 shadow-2xl flex flex-col h-[75vh] relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-blue-600 text-xs px-3 py-1 font-bold rounded-bl-lg">Gemini 1.5 Active</div>
          <div className="flex items-center mb-4 mt-2">
            <span className="text-xl mr-2">🧠</span>
            <h2 className="text-lg font-semibold text-emerald-400">Agent Suggestions</h2>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-gray-600">
             {messages.length === 0 ? (
               <p className="text-gray-500 text-sm text-center mt-10 italic">ఆన్సర్స్ కోసం వెయిటింగ్...</p>
             ) : (
               messages.map((msg) => (
                 // కేవలం ఆన్సర్ ఉంటేనే ఈ బాక్స్ చూపిస్తుంది
                 msg.suggestion && (
                   <div key={msg.id} className="bg-blue-900/20 p-4 rounded-lg border-l-4 border-emerald-500 shadow-inner mb-3 animate-in fade-in slide-in-from-top-2">
                     <p className="text-xs font-bold text-emerald-400 mb-2 uppercase">Suggested Answer:</p>
                     <p className="text-md text-gray-200 font-medium">{msg.suggestion}</p>
                   </div>
                 )
               ))
             )}
          </div>
        </div>

      </div>

      {/* SUMMARY MODAL */}
      {showSummary && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSummary(false)}></div>
          <div className="relative bg-gray-800 border border-gray-600 rounded-2xl shadow-2xl w-full max-w-3xl p-8 animate-in fade-in zoom-in duration-300">
            <button onClick={() => setShowSummary(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✖</button>
            <h2 className="text-2xl font-bold text-emerald-400 mb-6 flex items-center"><span className="mr-2">📋</span> మీటింగ్ సమ్మరీ & యాక్షన్ ఐటెమ్స్</h2>
            <div className="space-y-4 text-gray-200">
               <p className="text-gray-400 italic">Gemini API నుండి ఫైనల్ సమ్మరీ వస్తుంది...</p>
            </div>
            <div className="mt-8 flex justify-end">
              <button onClick={() => setShowSummary(false)} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors text-white">Close Summary</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}