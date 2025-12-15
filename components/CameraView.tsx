import React, { useRef } from 'react';
import { Language } from '../types';

interface CameraViewProps {
  onImageCapture: (file: File) => void;
  language: Language;
  onToggleLanguage: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ onImageCapture, language, onToggleLanguage }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAr = language === 'ar';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImageCapture(e.target.files[0]);
    }
  };

  const triggerInput = () => {
    fileInputRef.current?.click();
  };

  // Translations
  const t = {
    titleEnd: isAr ? 'القصة وراء المنظر' : 'behind the view',
    subtitle: isAr ? 'اكتشف' : 'Discover the story',
    desc: isAr 
      ? 'التقط صورة لأي معلم سياحي. سيقوم الذكاء الاصطناعي بالتعرف عليه وسرد تاريخه.'
      : 'Take a photo of any landmark. AI will identify it and tell you its history.',
    ready: isAr ? 'جاهز للمسح' : 'Ready to Scan',
    tap: isAr ? 'اضغط لالتقاط الصورة' : 'TAP TO CAPTURE'
  };

  return (
    <div className={`relative h-screen w-full bg-black overflow-hidden flex flex-col items-center justify-between py-12 ${isAr ? 'font-arabic' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none" />
      
      {/* Language Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <button 
          onClick={onToggleLanguage}
          className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/20 hover:bg-white/20 transition"
        >
          {isAr ? 'English' : 'العربية'}
        </button>
      </div>

      {/* Header */}
      <div className="z-10 text-center px-6 mt-8">
        <div className="inline-flex items-center justify-center p-2 bg-white/10 backdrop-blur-lg rounded-2xl mb-4 border border-white/10">
           <span className="text-2xl mx-2">🏛️</span>
           <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">
             LensLegend
           </span>
        </div>
        <h1 className="text-4xl font-light text-white mb-2 leading-tight">
          {t.subtitle} <br />
          <span className="font-bold text-white">{t.titleEnd}</span>
        </h1>
        <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
          {t.desc}
        </p>
      </div>

      {/* Viewfinder Graphic (Visual Only) */}
      <div className="relative flex-1 w-full flex items-center justify-center my-8">
        <div className="w-64 h-64 border border-white/20 rounded-3xl relative flex items-center justify-center">
            {/* Corner Markers */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl -mt-1 -ml-1"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-xl -mt-1 -mr-1"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-xl -mb-1 -ml-1"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-xl -mb-1 -mr-1"></div>
            
            <p className="text-gray-600 text-xs uppercase tracking-widest font-semibold">{t.ready}</p>
        </div>
      </div>

      {/* Capture Button */}
      <div className="z-10 w-full flex justify-center pb-8">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        
        <button 
          onClick={triggerInput}
          className="group relative flex items-center justify-center"
        >
          {/* Outer Ring */}
          <div className="w-20 h-20 rounded-full border-4 border-white transition-all duration-300 group-active:scale-90 group-hover:border-indigo-400"></div>
          {/* Inner Circle */}
          <div className="absolute w-16 h-16 bg-white rounded-full transition-all duration-300 group-active:scale-90 group-active:bg-indigo-400"></div>
          
          <span className="absolute -bottom-8 text-xs font-medium text-gray-400 tracking-wider whitespace-nowrap">{t.tap}</span>
        </button>
      </div>
    </div>
  );
};