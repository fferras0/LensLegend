import React, { useEffect, useState } from 'react';
import { Language } from '../types';

interface LoadingScreenProps {
  status: string;
  language: Language;
  imageSrc?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ status, language, imageSrc }) => {
  const isAr = language === 'ar';
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 400);
    return () => clearInterval(interval);
  }, []);
  
  // Cyberpunk translations
  const t = {
    identifying: isAr ? 'تحليل الصورة' : 'ANALYZING_VISUAL_DATA',
    searching: isAr ? 'جاري استدعاء المعلومات' : 'FETCHING_DATABASE_HISTORY',
    generating: isAr ? 'تكوين الرد الصوتي' : 'SYNTHESIZING_AUDIO_STREAM'
  };

  let mainText = t.identifying;
  if (status.includes("Searching")) mainText = t.searching;
  if (status.includes("Generating")) mainText = t.generating;

  return (
    <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 overflow-hidden ${isAr ? 'font-arabic' : 'font-mono-tech'}`} dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* Background Image Layer */}
      {imageSrc && (
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 blur-md scale-110 transition-transform duration-1000"
          style={{ backgroundImage: `url(${imageSrc})` }}
        />
      )}
      
      {/* Dark Overlay */}
      <div className={`absolute inset-0 z-0 ${imageSrc ? 'bg-slate-950/80' : 'bg-slate-950/90'}`}></div>

      {/* Scanning Laser Effect */}
      <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500 shadow-[0_0_20px_rgba(34,211,238,1)] animate-scan-screen z-10"></div>

      <div className="relative z-20 flex flex-col items-center">
        {/* Hexagon Loader */}
        <div className="relative w-24 h-24 mb-8">
           <svg className="w-full h-full text-cyan-500 animate-spin" style={{animationDuration: '3s'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
             <path d="M12 2l8.66 5v10L12 22l-8.66-5V7L12 2z" strokeLinecap="round" strokeLinejoin="round" />
           </svg>
           <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-cyan-400/20 rounded-full animate-ping"></div>
           </div>
        </div>

        {/* Text Terminal Effect */}
        <h3 className="text-xl text-cyan-400 font-bold tracking-widest uppercase text-shadow-glow">
          {isAr ? mainText : `>> ${mainText}`}
        </h3>
        
        <p className="mt-2 text-xs text-cyan-700 font-mono-tech">
          Processing{dots}
        </p>
        
        {/* Progress Bar */}
        <div className="mt-8 w-64 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-cyan-500 animate-progress shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
        </div>
      </div>

      <style>{`
        @keyframes scan-screen {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan-screen {
          animation: scan-screen 2.5s ease-in-out infinite;
        }
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        .animate-progress {
          animation: progress 2s infinite linear;
        }
        .text-shadow-glow {
          text-shadow: 0 0 8px rgba(34, 211, 238, 0.5);
        }
      `}</style>
    </div>
  );
};