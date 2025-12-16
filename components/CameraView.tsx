import React, { useRef, useState, useEffect } from 'react';
import { Language } from '../types';

interface CameraViewProps {
  onImageCapture: (file: File) => void;
  language: Language;
  onToggleLanguage: () => void;
  hasSavedData?: boolean;
  onRestore?: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ 
  onImageCapture, 
  language, 
  onToggleLanguage,
  hasSavedData,
  onRestore 
}) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  
  const isAr = language === 'ar';
  const [time, setTime] = useState('');

  // Clock for HUD
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImageCapture(e.target.files[0]);
    }
  };

  const triggerCamera = () => {
    cameraInputRef.current?.click();
  };

  const triggerUpload = () => {
    uploadInputRef.current?.click();
  };

  // Translations
  const t = {
    system: isAr ? 'النظام جاهز' : 'SYSTEM READY',
    scan: isAr ? 'مسح' : 'SCAN',
    upload: isAr ? 'رفع ملف' : 'UPLOAD',
    restore: isAr ? 'السابق' : 'HISTORY',
    mode: isAr ? 'الوضع: ذكاء اصطناعي' : 'MODE: AI_SIGHT',
    loc: isAr ? 'تحديد الموقع...' : 'LOC: 34.05°N, 118.24°W',
    instruction: isAr ? 'وجه الكاميرا أو ارفع ملف' : 'ALIGN TARGET OR UPLOAD',
    langLabel: isAr ? 'EN' : 'عربي'
  };

  return (
    <div className={`relative h-screen w-full bg-slate-950 overflow-hidden flex flex-col justify-between ${isAr ? 'font-arabic' : 'font-sans'}`} dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* Background Grid Animation */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
           style={{
             backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)',
             backgroundSize: '40px 40px'
           }}>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-transparent to-slate-950 z-0 pointer-events-none"></div>

      {/* TOP HUD */}
      <div className="relative z-10 w-full p-4 flex justify-between items-start text-cyan-400">
        <div className="flex flex-col gap-1">
          <div className="text-xs font-mono-tech opacity-70 border-l-2 border-cyan-500 pl-2">
            {t.system}<br/>
            {time}
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
           <button 
            onClick={onToggleLanguage}
            className="font-mono-tech text-xs border border-cyan-500/50 bg-cyan-950/30 px-3 py-1 text-cyan-300 hover:bg-cyan-500 hover:text-black transition-all"
          >
            {t.langLabel}
          </button>
        </div>
      </div>

      {/* CENTER VIEWFINDER */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8">
        <div className="relative w-full aspect-[3/4] max-w-sm border border-cyan-500/30 rounded-lg bg-cyan-900/5 mb-8">
          {/* Corners */}
          <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-cyan-400"></div>
          <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-cyan-400"></div>
          <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-cyan-400"></div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-cyan-400"></div>
          
          {/* Center Crosshair */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 pointer-events-none">
             <div className="absolute top-1/2 left-0 w-full h-[1px] bg-cyan-400/50"></div>
             <div className="absolute top-0 left-1/2 h-full w-[1px] bg-cyan-400/50"></div>
          </div>

          {/* Dynamic Elements */}
          <div className="absolute top-4 left-4 text-[10px] font-mono-tech text-cyan-300/80 tracking-widest">
            {t.mode}
          </div>

          {/* Prompt Text - HIGH VISIBILITY */}
          <div className="absolute bottom-16 left-0 w-full flex justify-center pointer-events-none">
             <div className="bg-black/70 backdrop-blur-md border border-cyan-500/40 px-6 py-2 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)]">
               <p className="text-sm font-bold text-white tracking-widest uppercase animate-pulse">
                 {t.instruction}
               </p>
             </div>
          </div>
        </div>
      </div>

      {/* BOTTOM CONTROLS */}
      <div className="relative z-10 w-full pb-10 pt-4 flex items-center justify-center gap-8 bg-gradient-to-t from-slate-950 via-slate-900/90 to-transparent">
        
        {/* INPUTS */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          ref={cameraInputRef}
          onChange={handleFileChange}
        />
        <input
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          ref={uploadInputRef}
          onChange={handleFileChange}
        />
        
        {/* UPLOAD BUTTON (Left) */}
        <div className="flex flex-col items-center gap-2 pt-4">
            <button 
                onClick={triggerUpload}
                className="w-12 h-12 rounded-full bg-slate-800/80 border border-cyan-500/30 flex items-center justify-center hover:bg-cyan-900/40 transition-all active:scale-95"
            >
                <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
            </button>
            <span className="text-[9px] font-mono-tech text-cyan-600 tracking-widest">{t.upload}</span>
        </div>

        {/* SHUTTER BUTTON - CENTERED */}
        <div className="flex flex-col items-center gap-2 -mt-8 z-20">
            <button 
              onClick={triggerCamera}
              className="group relative flex items-center justify-center w-24 h-24"
            >
              {/* Rotating Rings */}
              <div className="absolute inset-0 rounded-full border border-cyan-500/30 group-hover:border-cyan-400/60 transition-all duration-700"></div>
              <div className="absolute inset-2 rounded-full border-2 border-t-cyan-400 border-r-transparent border-b-cyan-400 border-l-transparent animate-spin-slow opacity-80"></div>
              
              {/* Inner Core */}
              <div className="absolute w-16 h-16 bg-cyan-500/10 backdrop-blur-md rounded-full border border-cyan-400 flex items-center justify-center group-active:scale-95 transition-transform shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                 <div className="w-10 h-10 bg-cyan-400 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.8)]"></div>
              </div>
            </button>
            <span className="text-[10px] font-mono-tech text-cyan-600 tracking-[0.2em] uppercase">{t.scan}</span>
        </div>

        {/* RESTORE BUTTON (Right) */}
        <div className="flex flex-col items-center gap-2 pt-4 w-12">
            {hasSavedData && onRestore ? (
                <>
                <button 
                    onClick={onRestore}
                    className="w-12 h-12 rounded-full bg-slate-800/80 border border-cyan-500/30 flex items-center justify-center hover:bg-cyan-900/40 transition-all active:scale-95"
                >
                    <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>
                <span className="text-[9px] font-mono-tech text-cyan-600 tracking-widest">{t.restore}</span>
                </>
            ) : (
                <div className="w-12"></div>
            )}
        </div>

      </div>

      {/* Credit Footer - Absolute Bottom Center */}
      <div className="absolute bottom-4 left-0 w-full flex justify-center z-20 pointer-events-none">
          <span className="text-[10px] font-mono-tech text-cyan-600/60 uppercase tracking-widest">
            {isAr ? 'صنع بواسطة فراس' : 'Made by Feras'}
          </span>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }
      `}</style>
    </div>
  );
};