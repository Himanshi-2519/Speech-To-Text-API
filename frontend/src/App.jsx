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
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder.current = new MediaRecorder(stream);
        chunks.current = [];
        mediaRecorder.current.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data); };
        mediaRecorder.current.onstop = () => {
          const blob = new Blob(chunks.current, { type: 'audio/wav' });
          stream.getTracks().forEach(track => track.stop()); 
          handleAudioProcessing(blob);
        };
        mediaRecorder.current.start(100); 
        setIsRecording(true);
      } catch (err) { alert("Mic error"); }
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

  const deleteItem = async (id) => {
    if (!window.confirm("Delete record?")) return;
    await axios.delete(`http://localhost:5000/api/history/${id}`);
    setHistory(history.filter(item => item.id !== id));
  };

  const clearAll = async () => {
    if (!window.confirm("Clear all?")) return;
    await axios.delete('http://localhost:5000/api/history');
    setHistory([]);
  };

  const downloadTxt = () => {
    const element = document.createElement("a");
    const file = new Blob([transcript], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "transcript.txt";
    document.body.appendChild(element);
    element.click();
  };

  if (!isLoggedIn) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#05070a] p-4">
        <div className="neon-card pt-16 pb-12 px-10 rounded-[2.5rem] w-full max-w-[380px] text-center border border-white/5 shadow-2xl bg-[#0d1117]">
          
          {/* LOGIN PAGE WAVEFORM - FORCED ANIMATION */}
          <div className="flex justify-center items-end gap-2 h-12 mb-8 mt-4">
            <div className="w-1.5 bg-cyan-500 rounded-full animate-wave-fast h-4"></div>
            <div className="w-1.5 bg-blue-500 rounded-full animate-wave-fast h-8 delay-75"></div>
            <div className="w-1.5 bg-cyan-400 rounded-full animate-wave-fast h-6 delay-150"></div>
            <div className="w-1.5 bg-blue-400 rounded-full animate-wave-fast h-10 delay-300"></div>
            <div className="w-1.5 bg-cyan-600 rounded-full animate-wave-fast h-5 delay-200"></div>
          </div>

          <h1 className="mb-2 uppercase tracking-tighter text-white font-bold text-2xl">
            {isSignup ? "Create Account" : "Welcome to speech to text"}
          </h1>
          <p className="text-cyan-400 text-[10px] font-bold tracking-[0.25em] uppercase mb-12 opacity-90 italic">
            Capturing the rhythm of your words, instantly.
          </p>
          
          <form onSubmit={handleAuth} className="space-y-4">
            <input type="email" placeholder="Email" className="w-full bg-[#05070a] border border-white/10 p-4 rounded-xl text-xs text-white outline-none focus:border-cyan-500" onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" className="w-full bg-[#05070a] border border-white/10 p-4 rounded-xl text-xs text-white outline-none focus:border-cyan-500" onChange={(e) => setPassword(e.target.value)} />
            <button type="submit" className="w-full bg-cyan-600 text-white font-black py-4 rounded-xl uppercase tracking-widest text-[10px]">
              {isSignup ? "Sign Up" : "Login"}
            </button>
          </form>

          <button onClick={() => setIsSignup(!isSignup)} className="mt-8 text-[9px] text-slate-500 hover:text-white uppercase font-bold tracking-widest transition-colors">
            {isSignup ? "Already have an account? Login" : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#05070a] text-white">
      <nav className="h-16 px-10 border-b border-white/5 flex items-center justify-between">
        <span className="text-cyan-400 text-base font-bold tracking-[0.25em] uppercase opacity-90 italic">Decoding the human voice with AI precision.</span>   
        <div className="flex gap-4">
          <button onClick={() => setShowHistory(!showHistory)} className="px-5 py-2 rounded-lg bg-cyan-600 text-white text-[9px] font-black uppercase tracking-[0.2em]">History</button>
          <button onClick={() => setIsLoggedIn(false)} className="px-5 py-2 rounded-lg border border-red-900/30 text-red-500 text-[9px] font-bold uppercase tracking-widest hover:bg-red-950/20">Logout</button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <div className="w-full max-w-md bg-[#0d1117] border border-white/5 rounded-[2rem] p-8 flex flex-col items-center shadow-2xl">
          <h2 className="text-[10px] font-bold tracking-[0.4em] text-slate-500 uppercase mb-6">Audio Intelligence Lab</h2>
          
          {/* MAIN PAGE WAVEFORM - FORCED ANIMATION */}
          <div className="flex items-end justify-center gap-1.5 h-12 mb-8">
            {isRecording ? (
              [...Array(12)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-1.5 bg-cyan-400 rounded-full animate-wave-fast" 
                  style={{ height: '10px', animationDelay: `${i * 0.1}s` }}
                ></div>
              ))
            ) : (
              <div className="w-32 h-[2px] bg-white/10 rounded-full"></div>
            )}
          </div>

          <div className="w-full bg-black/40 border border-white/5 rounded-[1.5rem] p-6 min-h-[120px] flex flex-col items-center justify-center mb-8 text-center">
             {loading ? <span className="animate-pulse text-cyan-500 text-[10px] font-black uppercase tracking-widest">Processing...</span> : 
             <p className="text-sm font-medium leading-relaxed text-slate-300 italic">{transcript || "Ready..."}</p>}
             {transcript && !loading && (
               <button onClick={downloadTxt} className="mt-4 text-[10px] text-cyan-400 font-bold border border-cyan-400/30 px-6 py-2 rounded-full hover:bg-cyan-400/10 transition-all italic">📥 DOWNLOAD TRANSCRIPT</button>
             )}
          </div>

          <button onClick={toggleRecording} className={`w-full py-4 rounded-xl font-black text-[11px] tracking-[0.2em] transition-all shadow-lg ${isRecording ? 'bg-red-600 animate-pulse text-white' : 'bg-cyan-600 text-white hover:bg-cyan-500'}`}>
            {isRecording ? "STOP RECORDING" : "LIVE RECORD"}
          </button>
          
          <div className="mt-4">
              <input type="file" accept="audio/*" id="file-upload" onChange={(e) => handleAudioProcessing(e.target.files[0])} className="hidden" />
              <label htmlFor="file-upload" className="text-[9px] text-slate-500 uppercase font-bold tracking-widest hover:text-cyan-400 transition-colors cursor-pointer italic">or upload file</label>
          </div>
        </div>

        <aside className={`fixed top-16 right-0 h-full w-[300px] bg-[#0d1117] border-l border-white/5 p-6 transition-transform duration-500 z-40 ${showHistory ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-2">
            <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-cyan-500">History Logs</h3>
            <button onClick={clearAll} className="text-[9px] text-red-500 font-bold uppercase hover:text-red-400">Clear All</button>
          </div>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {history.map(item => (
              <div key={item.id} className="group p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-start gap-2">
                <p className="text-xs text-slate-400 italic flex-1 leading-snug">"{item.text}"</p>
                <button onClick={() => deleteItem(item.id)} className="text-[8px] text-red-500/50 hover:text-red-500 font-bold uppercase transition-all">Delete</button>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <style>{`
        @keyframes wave-animation {
          0%, 100% { height: 10px; transform: scaleY(1); }
          50% { height: 40px; transform: scaleY(1.2); }
        }
        .animate-wave-fast {
          animation: wave-animation 0.5s ease-in-out infinite;
          min-height: 10px; /* Ensures it is always visible */
        }
        .delay-75 { animation-delay: 0.075s; }
        .delay-150 { animation-delay: 0.15s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }

        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #164e63; border-radius: 10px; }
      `}</style>
    </div>
  );
}