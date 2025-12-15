import React from 'react';
import { Language } from '../types';

interface LoadingScreenProps {
  status: string;
  language: Language;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ status, language }) => {
  const isAr = language === 'ar';
  
  // Mapping internal status codes/text to display text
  let displayText = status;
  if (status.includes("Identifying")) {
    displayText = isAr ? "جاري التعرف على المعلم..." : "Identifying landmark...";
  } else if (status.includes("Searching")) {
    displayText = isAr ? "جاري البحث عن التاريخ..." : "Searching history...";
  } else if (status.includes("Generating")) {
    displayText = isAr ? "جاري إنشاء الدليل الصوتي..." : "Generating audio guide...";
  }

  return (
    <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md ${isAr ? 'font-arabic' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
      <div className="relative">
        {/* Animated Rings */}
        <div className="absolute inset-0 animate-ping rounded-full ring-2 ring-indigo-500 opacity-75"></div>
        <div className="relative inline-flex items-center justify-center w-24 h-24 bg-gray-900 rounded-full border border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.5)]">
           <svg className="w-10 h-10 text-indigo-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
           </svg>
        </div>
      </div>
      
      <h3 className="mt-8 text-xl font-medium text-white tracking-wide">{displayText}</h3>
      <p className="mt-2 text-sm text-gray-400 animate-pulse">Powered by Gemini AI</p>
      
      {/* Progress indicators */}
      <div className="mt-6 flex gap-2">
        <div className={`h-1 w-8 rounded-full ${status.includes('Identify') || status.includes('Fetch') || status.includes('Generat') ? 'bg-indigo-500' : 'bg-gray-700'}`}></div>
        <div className={`h-1 w-8 rounded-full ${status.includes('Fetch') || status.includes('Generat') ? 'bg-indigo-500' : 'bg-gray-700'}`}></div>
        <div className={`h-1 w-8 rounded-full ${status.includes('Generat') ? 'bg-indigo-500' : 'bg-gray-700'}`}></div>
      </div>
    </div>
  );
};