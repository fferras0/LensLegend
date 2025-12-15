import React, { useEffect, useState, useRef } from 'react';
import { LandmarkData } from '../types';

interface ARResultViewProps {
  data: LandmarkData;
  onReset: () => void;
}

export const ARResultView: React.FC<ARResultViewProps> = ({ data, onReset }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const isAr = data.language === 'ar';

  useEffect(() => {
    // Initialize Audio
    if (data.audioBuffer) {
        // Auto play on mount
        playAudio();
    }
    
    return () => {
      stopAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.audioBuffer]);

  const playAudio = async () => {
    if (!data.audioBuffer) return;

    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    
    // Resume context if needed
    if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
    }

    if (sourceNodeRef.current) {
        try { sourceNodeRef.current.stop(); } catch (e) { /* ignore */ }
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = data.audioBuffer;
    source.connect(audioContextRef.current.destination);
    
    source.onended = () => setIsPlaying(false);

    source.start(0, currentTime);
    sourceNodeRef.current = source;
    setIsPlaying(true);
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
        try { sourceNodeRef.current.stop(); } catch (e) { /* ignore */ }
        sourceNodeRef.current = null;
    }
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const togglePlayback = () => {
      if (isPlaying) {
          stopAudio();
      } else {
          playAudio();
      }
  };

  // Translations
  const t = {
    liveGuide: isAr ? 'دليل مباشر' : 'LIVE GUIDE',
    verified: isAr ? 'مصادر موثوقة' : 'Verified Sources',
    audio: isAr ? 'دليل صوتي' : 'Audio Guide',
    playing: isAr ? 'تشغيل' : 'Playing',
    paused: isAr ? 'متوقف' : 'Paused'
  };

  return (
    <div className={`relative h-screen w-full bg-black overflow-hidden ${isAr ? 'font-arabic' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
        <style>{`
          @keyframes scan {
            0% { top: 0%; opacity: 0; }
            15% { opacity: 1; }
            85% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
          }
          .animate-scan {
            animation: scan 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }
        `}</style>

        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-center bg-cover bg-no-repeat transition-transform duration-[20s] ease-linear scale-100 hover:scale-105"
          style={{ backgroundImage: `url(${data.originalImage})` }}
        />
        
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />

        {/* AR Overlay Layer - Visuals only */}
        <div className="absolute inset-0 z-0 pointer-events-none">
            {/* Central Target Reticle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] border border-white/20 rounded-2xl opacity-80">
                {/* Glowing Corners */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-indigo-400 -mt-0.5 -ml-0.5 shadow-[0_0_10px_rgba(99,102,241,0.6)]"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-indigo-400 -mt-0.5 -mr-0.5 shadow-[0_0_10px_rgba(99,102,241,0.6)]"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-indigo-400 -mb-0.5 -ml-0.5 shadow-[0_0_10px_rgba(99,102,241,0.6)]"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-indigo-400 -mb-0.5 -mr-0.5 shadow-[0_0_10px_rgba(99,102,241,0.6)]"></div>
                
                {/* Scanning Laser */}
                <div className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent animate-scan shadow-[0_0_15px_rgba(99,102,241,1)]"></div>
                
                {/* Subtle Grid Pattern inside */}
                <div className="absolute inset-0 opacity-10" 
                     style={{backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px'}}>
                </div>
            </div>

            {/* Feature Points (Simulated Computer Vision dots) */}
            <div className="absolute top-[35%] left-[30%] w-1.5 h-1.5 bg-indigo-300 rounded-full animate-ping opacity-75" style={{animationDuration: '2s'}}></div>
            <div className="absolute top-[45%] right-[25%] w-1 h-1 bg-white rounded-full animate-pulse opacity-60" style={{animationDuration: '1.5s'}}></div>
            <div className="absolute bottom-[40%] left-[40%] w-1 h-1 bg-indigo-200 rounded-full animate-ping opacity-50" style={{animationDelay: '1s'}}></div>
            
            {/* Center Pulse Ring */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-indigo-500/10 rounded-full animate-ping" style={{animationDuration: '3s'}}></div>
        </div>

        {/* Top Controls */}
        <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-10">
            <button 
                onClick={onReset}
                className="bg-black/40 backdrop-blur-md text-white p-2 rounded-full border border-white/20 hover:bg-black/60 transition"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            <div className="px-3 py-1 bg-indigo-600/80 backdrop-blur-md rounded-full text-xs font-bold text-white border border-indigo-400/30 shadow-lg flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                {t.liveGuide}
            </div>
        </div>

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 w-full p-6 pb-10 z-20 flex flex-col gap-4">
            
            {/* Title Card */}
            <div className={isAr ? 'text-right' : 'text-left'}>
                <h1 className="text-4xl font-bold text-white drop-shadow-md mb-1 leading-tight tracking-tight">
                    {data.name}
                </h1>
                <div className={`h-1 w-12 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)] ${isAr ? 'mr-0 ml-auto' : ''}`}></div>
            </div>

            {/* Info Card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 shadow-2xl relative overflow-hidden group">
                <div className={`absolute top-0 opacity-20 p-3 ${isAr ? 'left-0' : 'right-0'}`}>
                    <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                </div>
                
                <p className="text-gray-100 text-sm leading-relaxed relative z-10 font-light">
                    {data.description}
                </p>

                {/* Sources */}
                {data.sources && data.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-xs text-indigo-300 font-medium mb-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>
                      {t.verified}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {data.sources.slice(0, 2).map((source, i) => (
                        <a 
                          key={i} 
                          href={source.uri} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[10px] bg-black/40 text-gray-300 px-2 py-1 rounded hover:bg-indigo-600/50 transition truncate max-w-[120px]"
                        >
                          {source.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            {/* Audio Player Control */}
            {data.audioBuffer && (
                <div className="flex items-center gap-4 bg-gray-900/80 backdrop-blur-xl p-3 rounded-xl border border-white/10">
                    <button 
                        onClick={togglePlayback}
                        className="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-500 text-white shadow-lg hover:bg-indigo-400 transition-transform active:scale-95"
                    >
                        {isPlaying ? (
                             <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                        ) : (
                             <svg className={`w-5 h-5 ${isAr ? '-translate-x-0.5' : 'translate-x-0.5'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        )}
                    </button>
                    <div className="flex-1">
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1 uppercase tracking-wider font-semibold">
                            <span>{t.audio}</span>
                            <span>{isPlaying ? t.playing : t.paused}</span>
                        </div>
                        {/* Fake Waveform Visualizer */}
                        <div className={`flex items-center gap-[2px] h-6 ${isAr ? 'flex-row-reverse' : ''}`}>
                           {[...Array(20)].map((_, i) => (
                               <div 
                                 key={i} 
                                 className={`w-1 rounded-full transition-all duration-300 ${isPlaying ? 'bg-indigo-400 animate-pulse' : 'bg-gray-600'}`}
                                 style={{ 
                                     height: isPlaying ? `${Math.max(20, Math.random() * 100)}%` : '20%',
                                     animationDelay: `${i * 0.05}s`
                                 }} 
                               />
                           ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};