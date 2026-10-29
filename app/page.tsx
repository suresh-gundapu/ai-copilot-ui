"use client";
import React, { useState, useEffect, useRef } from 'react';

export default function AgentUI() {
  const [isRecording, setIsRecording] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<any[]>([]);
  
  const recognitionRef = useRef<any>(null);
  
  // మొబైల్ లో మైక్ కట్ అవ్వకుండా ఆటో-రీస్టార్ట్ ట్రాక్ చేయడానికి
  const isRecordingRef = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              const text = event.results[i][0].transcript;
              // కొత్త లాజిక్: స్క్రోల్ చేయాల్సిన పని లేకుండా కొత్త మెసేజ్ ముందే (Top) పడుతుంది
              setLiveTranscript(prev => [{ id: Date.now(), role: 'Speaker', text: text }, ...prev]);
            }
          }
        };

        // ఆటో-రీస్టార్ట్ లాజిక్ (మొబైల్ బ్రౌజర్ ఆటోమేటిక్ గా మైక్ ఆపితే, వెంటనే మళ్లీ స్టార్ట్ చేస్తుంది)
        recognitionRef.current.onend = () => {
          if (isRecordingRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (error) {
              console.error("Mic restart wait...", error);
            }
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("మైక్ ఎర్రర్: ", event.error);
        };
      }
    }
  }, []);

  const handleCallToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      isRecordingRef.current = false;
      setShowSummary(true);
      if (recognitionRef.current) recognitionRef.current.stop();
    } else {
      setIsRecording(true);
      isRecordingRef.current = true;
      setShowSummary(false);
      setLiveTranscript([]);
      if (recognitionRef.current) recognitionRef.current.start();
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
        
        <button 
          onClick={handleCallToggle}
          className={`px-6 py-2.5 rounded-full font-bold text-white transition-all shadow-lg hover:scale-105 ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : 'bg-emerald-500 hover:bg-emerald-600'
          }`}
        >
          {isRecording ? '🛑 End Live Call' : '🎙️ Start Call'}
        </button>
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
            {liveTranscript.length === 0 ? (
              <p className="text-gray-500 text-sm text-center mt-10 italic">
                {isRecording ? "Listening... మైక్ లో మాట్లాడండి..." : "కాల్ స్టార్ట్ చేయడానికి పైన బటన్ నొక్కండి."}
              </p>
            ) : (
              liveTranscript.map((msg) => (
                <div key={msg.id} className="bg-gray-700/50 p-3 rounded-lg border border-gray-600/50 transition-all animate-in fade-in slide-in-from-top-2">
                  <p className="text-sm text-blue-300 font-semibold mb-1">{msg.role}:</p>
                  <p className="text-md leading-relaxed">{msg.text}</p>
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
             <p className="text-gray-500 text-sm text-center mt-10 italic">బ్యాకెండ్ కనెక్ట్ అయ్యాక ఇక్కడ తెలుగు వస్తుంది...</p>
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
            <p className="text-gray-500 text-sm text-center mt-10 italic">బ్యాకెండ్ కనెక్ట్ అయ్యాక ఇక్కడ ఆన్సర్స్ వస్తాయి...</p>
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
               <p className="text-gray-400 italic">Gemini API నుండి ఫైనల్ సమ్మరీ ఇక్కడ వస్తుంది...</p>
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