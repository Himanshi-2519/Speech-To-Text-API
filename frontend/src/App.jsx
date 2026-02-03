import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
// Change VITE_API_BASE_URL to VITE_API_URL to match your Vercel settings
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://speech-to-text-api-u2tn.onrender.com";
//const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

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
      await axios.post(`${API_BASE_URL}/api/${endpoint}`, { email, password });
      if (isSignup) {
        alert("✨ Account created! Now you can Login.");
        setIsSignup(false);
      } else {
        setIsLoggedIn(true);
        fetchHistory();
      }
    } catch (err) { alert(err.response?.data?.error || "Auth Failed"); }
  };
    //--handle audio 
    const handleAudioProcessing = async (file) => {
        
      if (!file) return;
      
  // IMPROVED LOGIC: 
  // If the file has a type, and that type isn't in our list, AND it's not a blob (empty type), then block it.
  // ✅ FIX: allow all audio MIME types (fixes live mic recording)
      if (file.type && !file.type.startsWith("audio/")) {
  setTranscript("");
  setLoading(false);
  alert("❌ Invalid File Type: Please upload an audio file.");
  return;
      }

  if (file.size > 10 * 1024 * 1024) {
    setLoading(false);
    alert("❌ File too large: Maximum size is 10MB.");
    return;
  }

  setLoading(true);
  setTranscript("Processing file..."); 
  
  const formData = new FormData();
  // We specify a filename 'speech.webm' so the backend always knows it's audio
  formData.append('audio', file, 'speech.webm');
  formData.append('email', email);

  try {
    const res = await axios.post(`${API_BASE_URL}/api/transcribe`, formData);
    setTranscript(res.data.transcript);
    fetchHistory();
  } catch (e) {
    const errorMsg = e.response?.data?.error || "AI could not process this file.";
    setTranscript(`Error: ${errorMsg}`);
    console.error("Transcription Error:", e);
  } finally {
    setLoading(false);
    setIsRecording(false); 
  }
};
      //-- for mic 
      
   const toggleRecording = async () => {
    if (!isRecording) {
      try {
        // IMPROVEMENT: Added high-gain and noise suppression
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true, 
            autoGainControl: true, // Forces the mic to be louder
            channelCount: 1,
            sampleRate: 48000 
          } 
        });

      
        const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/wav";

        mediaRecorder.current = new MediaRecorder(stream, { mimeType });
        chunks.current = [];

        mediaRecorder.current.ondataavailable = (e) => { 
          if (e.data.size > 0) {
            chunks.current.push(e.data); 
          }
        };

          mediaRecorder.current.onstop = async () => {
              const recordedType = mediaRecorder.current.mimeType || "audio/webm";

const blob = new Blob(chunks.current, { type: recordedType });

const extension = recordedType.includes("wav") ? "wav" : "webm";

const file = new File([blob], `speech.${extension}`, {
  type: recordedType,
});

  stream.getTracks().forEach(track => track.stop());
  await handleAudioProcessing(file);
};
        
          mediaRecorder.current.start();
          setIsRecording(true);

      } catch (err) { 
        console.error("Mic Error:", err);
        alert("Mic error: Please check permissions."); 
      }
    } else {
      if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
        mediaRecorder.current.stop();
      }
      setIsRecording(false);
    }
  };

  //- For History 
   const fetchHistory = async () => {
  try {
    // We add ?email= to the URL so the backend knows which user is logged in
    const res = await axios.get(`${API_BASE_URL}/api/history?email=${email}`);
    setHistory(res.data);
  } catch (e) { console.error(e); }
};

  const deleteItem = async (id) => {
    if (!window.confirm("Delete record?")) return;
    // UPDATED LINE BELOW: Added ?email=${email}
    await axios.delete(`${API_BASE_URL}/api/history/${id}?email=${email}`);  
    setHistory(history.filter(item => item.id !== id));
  };

  const clearAll = async () => {
    if (!window.confirm("Clear all?")) return;
    // UPDATED LINE BELOW: Added ?email=${email}
    await axios.delete(`${API_BASE_URL}/api/history?email=${email}`);
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
    const downloadHistoryItem = (text, date) => {
    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    // This names the file with the date of that specific recording
    element.download = `transcript-${date.replace(/\//g, '-')}.txt`;
    //element.download = `transcript-${date}.txt`;
    document.body.appendChild(element);
    element.click();
    };


  if (!isLoggedIn) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#05070a] p-4">
        <div className="neon-card pt-16 pb-12 px-10 rounded-[2.5rem] w-full max-w-[380px] text-center border border-white/5 shadow-2xl bg-[#0d1117]">
          
<div className="flex justify-center items-end gap-2 h-14 mb-8 mt-4">
  <style>{`
    @keyframes true-wave {
      0%, 100% { height: 10px; transform: scaleY(1); }
      50% { height: 40px; transform: scaleY(1.2); }
    }
  `}</style>

  {[ "bg-cyan-500", "bg-blue-500", "bg-cyan-400", "bg-blue-400", "bg-cyan-600", "bg-blue-500", "bg-cyan-400", "bg-blue-600", "bg-cyan-500" ].map((color, i) => (
    <div 
      key={i} 
      className={`w-1.5 rounded-full ${color} shadow-sm shadow-cyan-500/20`}
      style={{ height: '10px', animation: 'true-wave 1.5s ease-in-out infinite', animationDelay: `${i * 0.2}s` }}
    ></div>
  ))}
</div>
          <h1 className="mb-2 uppercase tracking-tighter text-white font-bold text-2xl">
            {isSignup ? "Create Account" : "Welcome to speech to text"}
          </h1>
          <p className="text-cyan-400 text-[10px] font-bold tracking-[0.25em] uppercase mb-12 opacity-90 italic">
            Capturing the Rhythm of your words, instantly.
          </p>

      
          
          <form onSubmit={handleAuth} className="space-y-4">
            <input type="email" value={email} placeholder="Email" className="w-full bg-[#05070a] border border-white/10 p-4 rounded-xl text-xs text-white outline-none focus:border-cyan-500" onChange={(e) => setEmail(e.target.value)} />
            <input type="password" value={password} placeholder="Password" className="w-full bg-[#05070a] border border-white/10 p-4 rounded-xl text-xs text-white outline-none focus:border-cyan-500" onChange={(e) => setPassword(e.target.value)} />
            {/*<input type="email" placeholder="Email" className="w-full bg-[#05070a] border border-white/10 p-4 rounded-xl text-xs text-white outline-none focus:border-cyan-500" onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" className="w-full bg-[#05070a] border border-white/10 p-4 rounded-xl text-xs text-white outline-none focus:border-cyan-500" onChange={(e) => setPassword(e.target.value)} />*/}
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
    <div className="flex flex-col min-h-screen bg-[#05070a] text-white">
      {/* Navbar Fixed at Top */}
      <nav className="h-16 px-10 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#05070a] z-50">
        <span className="text-cyan-400 text-base font-bold tracking-[0.25em] opacity-90 italic">Real-time speech intelligence at your fingertips.</span>   
        <div className="flex gap-4">
          <button onClick={() => setShowHistory(!showHistory)} className="px-5 py-2 rounded-lg bg-cyan-600 text-white text-[9px] font-black uppercase">History</button>
          {/* Search for your Logout button near the top of the return block */}
            <button onClick={() => {setIsLoggedIn(false); // Log the user out
                setEmail("");         // Clear the email state
                setPassword("");      // Clear the password state
                }} 
                className="px-5 py-2 rounded-lg border border-red-900/30 text-red-500 text-[9px] font-bold uppercase hover:bg-red-950/20"> Logout
            </button>
          {/*<button onClick={() => setIsLoggedIn(false)} className="px-5 py-2 rounded-lg border border-red-900/30 text-red-500 text-[9px] font-bold uppercase hover:bg-red-950/20">Logout</button>*/}
        </div>
      </nav>

      {/* Main Container - Centered Content */}
      <div className="flex-1 flex flex-col items-center">
        
        {/* CENTERED BOX (Same as your original code) */}
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] w-full">
            <div className="w-full max-w-md bg-[#0d1117] border border-white/5 rounded-[2rem] p-8 flex flex-col items-center shadow-2xl">
            <h2 className="text-[10px] font-bold tracking-[0.4em] text-slate-500 uppercase mb-6">Audio Intelligence Lab</h2>
            
            <div className="flex items-end justify-center gap-2 h-14 mb-8">
            <style>{`
                @keyframes natural-ripple {
                0%, 100% { height: 10px; transform: scaleY(1); }
                50% { height: 45px; transform: scaleY(1.2); }
                }
            `}</style>

            {isRecording ? (
                [...Array(12)].map((_, i) => (
                <div 
                    key={i} 
                    className={`w-1.5 rounded-full shadow-sm ${ i % 2 === 0 ? 'bg-cyan-500 shadow-cyan-500/20' : 'bg-purple-500 shadow-purple-500/20' }`}
                    style={{ height: '10px', animation: 'natural-ripple 1.4s ease-in-out infinite', animationDelay: `${i * 0.15}s` }}
                ></div>
                ))
            ) : (
                <div className="w-48 h-[2px] bg-white/10 rounded-full"></div>
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
            {/* Upload Section with increased visibility and folder emoji */}
            <div className="mt-6">
                <input 
                  type="file" 
                  accept="audio/*" 
                  id="file-upload" 
                  onChange={(e) => handleAudioProcessing(e.target.files[0])} 
                  className="hidden" 
                />
                <label 
                  htmlFor="file-upload" 
                  className="text-sm text-slate-400 uppercase font-bold tracking-wider hover:text-cyan-400 cursor-pointer transition-colors flex items-center gap-2"
                >
                  <span>📁  Click to upload audio file</span>
                </label>
            </div>
            </div>
        </div>

        {/* --- History Grid Section --- */}
        {showHistory && (
          <div className="w-full max-w-6xl px-10 pb-20 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500">Transcription History</h2>
              <button onClick={clearAll} className="text-[9px] text-red-500 font-bold uppercase hover:text-red-400 tracking-widest">Clear All</button>
            </div>
            
            {/* CARD LAYOUT GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {history.map(item => (
                <div key={item.id} className="p-6 rounded-2xl bg-[#0d1117] border border-white/5 flex flex-col justify-between hover:border-cyan-500/40 transition-all shadow-xl min-h-[150px]">
                  <p className="text-sm text-slate-300 italic leading-relaxed mb-6">"{item.text}"</p>

                    <div className="flex justify-between items-center pt-4 border-t border-white/5">
                      <span className="text-[8px] font-mono text-slate-600 uppercase">Created: {new Date(item.created_at).toLocaleDateString()}</span>
                    {/* This div holds  two buttons side-by-side */}
                    <div className="flex gap-3">
                      <button onClick={() => downloadHistoryItem(item.text, new Date(item.created_at).toLocaleDateString())} className="text-[8px] text-cyan-500/70 hover:text-cyan-400 font-bold uppercase transition-all">
                        Download </button>
                      <button onClick={() => deleteItem(item.id)} className="text-[8px] text-red-500/50 hover:text-red-500 font-bold uppercase transition-all">
                        Delete</button> </div></div>
                        </div>
              ))}
              {history.length === 0 && (
                <div className="col-span-full text-center py-10 opacity-20 text-xs uppercase tracking-widest italic">No history records found</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}