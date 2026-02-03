import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [transcript, setTranscript] = useState("");
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isSignup ? 'signup' : 'login';
      await axios.post(`http://127.0.0.1:5000/api/${endpoint}`, { email, password });
      if (isSignup) {
        alert("✨ Account created! Now you can Login.");
        setIsSignup(false);
      } else {
        setIsLoggedIn(true);
        fetchHistory();
      }
    } catch (err) { alert(err.response?.data?.error || "Auth Failed"); }
  };

  const handleAudioProcessing = async (file) => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('audio', file);
    try {
      const res = await axios.post('http://localhost:5000/api/transcribe', formData);
      setTranscript(res.data.transcript);
      fetchHistory();
    } catch (e) { alert("Server Error"); }
    finally { setLoading(false); }
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      mediaRecorder.current.ondataavailable = (e) => chunks.current.push(e.data);
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/wav' });
        handleAudioProcessing(blob);
        chunks.current = [];
      };
      mediaRecorder.current.start();
      setIsRecording(true);
    } else {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/history');
      setHistory(res.data);
    } catch (e) { console.error(e); }
  };

  // --- PAGE 1: LOGIN/SIGNUP ---
  if (!isLoggedIn) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#05070a] p-4">
        <div className="neon-card p-10 rounded-[2.5rem] w-full max-w-[360px] text-center border border-white/5 shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="flex items-end gap-1 h-8">
              <div className="w-1 h-3 bg-cyan-500 rounded-full animate-bounce"></div>
              <div className="w-1 h-8 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1 h-5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
          
          {/* UPDATED HEADING: Only "speech to text" is natural font using Tailwind */}
          
          <h1 className="mb-2 uppercase tracking-tighter text-white font-bold text-2xl">
            {isSignup ? "Create Account" : (
              <>
              <span className="font-serif  lowercase tracking-normal font-black">Welcome to Speech To Text</span>
              <br></br>
              </>
            )}
          </h1>
          
          <p className="text-cyan-500 text-[9px] font-bold tracking-[0.2em] uppercase mb-10 opacity-80">
            Capturing the rhythm of your words, instantly.
            </p>

          <form onSubmit={handleAuth} className="space-y-4">
            <input type="email" placeholder="Email" required className="w-full bg-[#0d1117] border border-white/10 p-4 rounded-xl text-xs text-white outline-none focus:border-cyan-500" onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" required className="w-full bg-[#0d1117] border border-white/10 p-4 rounded-xl text-xs text-white outline-none focus:border-cyan-500" onChange={(e) => setPassword(e.target.value)} />
            <button type="submit" className="w-full bg-cyan-600 text-white font-black py-4 rounded-xl uppercase tracking-widest text-[10px]">
              {isSignup ? "Sign Up" : "Login"}
            </button>
          </form>
          <button onClick={() => setIsSignup(!isSignup)} className="mt-8 text-[9px] text-slate-500 hover:text-white uppercase font-bold tracking-widest">
            {isSignup ? "Already have an account? Login" : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    );
  }

  // --- PAGE 2: DASHBOARD (UNCHANGED) ---
  return (
    <div className="flex flex-col h-screen bg-[#05070a]">
      <nav className="h-16 px-10 border-b border-white/5 flex items-center justify-between">
        {/*<span className="font-black text-sm italic text-white uppercase tracking-tighter">Decoding the human voice with AI precision.</span>*/}
        {/*<span className="text-cyan-400 text-[10px] font-bold tracking-[0.25em] uppercase opacity-90 italic">Decoding the human voice with AI precision.</span>*/}
        <span className="text-cyan-400 text-sm font-bold tracking-[0.25em] uppercase opacity-90 italic">Decoding the human voice with AI precision.</span>   
        <div className="flex gap-4">
         <button onClick={() => setShowHistory(!showHistory)} className="px-5 py-2 rounded-lg bg-cyan-600 text-white text-[9px] font-black uppercase tracking-[0.2em] shadow-lg hover:bg-cyan-500 transition-all">History</button>
          <button onClick={() => setIsLoggedIn(false)} className="px-5 py-2 rounded-lg border border-red-900/30 text-red-500 text-[9px] font-bold uppercase tracking-widest hover:bg-red-950/20">Logout</button>
        </div>
      </nav>
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <div className="w-full max-w-lg neon-card rounded-[2.5rem] p-10 flex flex-col items-center">
          <h2 className="text-[10px] font-bold tracking-[0.4em] text-slate-600 uppercase mb-8">Audio Intelligence Lab</h2>
          <div className="w-full dashed-area rounded-[2rem] p-8 min-h-[140px] flex items-center justify-center mb-10 text-center bg-black/20">
             {loading ? <span className="animate-pulse text-cyan-500 text-[10px] font-black uppercase tracking-widest">Processing...</span> : 
             <p className="text-sm font-medium leading-relaxed text-slate-400 italic">{transcript || "Waiting for signal input..."}</p>}
          </div>
          <div className="w-full space-y-4">
            <button onClick={toggleRecording} className={`w-full py-5 rounded-2xl font-black text-[10px] tracking-[0.2em] shadow-xl ${isRecording ? 'bg-red-600 animate-pulse text-white' : 'bg-cyan-600 text-white hover:bg-cyan-500'}`}>
              {isRecording ? "STOP RECORDING" : " LIVE RECORDING "}
            </button>
            <div className="relative w-full">
              <input type="file" accept="audio/*" onChange={(e) => handleAudioProcessing(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
              <button className="w-full bg-[#0d1117] border border-white/5 py-4 rounded-xl text-[9px] font-bold text-slate-500 uppercase tracking-widest">Import Audio File</button>
            </div>
          </div>
        </div>
        <aside className={`fixed top-16 right-0 h-full w-[320px] bg-[#0d1117] border-l border-white/5 p-8 transition-transform duration-500 z-40 ${showHistory ? 'translate-x-0' : 'translate-x-full'}`}>
          <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-cyan-500 mb-8 border-b border-white/5 pb-2">Logs</h3>
          <div className="space-y-4 max-h-[75vh] overflow-y-auto">
            {history.map(item => (
              <div key={item.id} className="p-4 rounded-xl bg-white/5 border border-white/5">
                <p className="text-xs text-slate-400 italic">"{item.text}"</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}