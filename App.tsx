import React, { useState, useEffect } from 'react';
import { CameraView } from './components/CameraView';
import { LoadingScreen } from './components/LoadingScreen';
import { ARResultView } from './components/ARResultView';
import { AppState, ErrorState, LandmarkData, Language } from './types';
import { identifyLandmark, getLandmarkDetails, generateNarration } from './services/geminiService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [error, setError] = useState<ErrorState | null>(null);
  const [landmarkData, setLandmarkData] = useState<LandmarkData | null>(null);
  const [language, setLanguage] = useState<Language>('ar');
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [hasSavedData, setHasSavedData] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('lensLegend_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name) {
          setLandmarkData(parsed);
          setHasSavedData(true);
          if (parsed.language) setLanguage(parsed.language);
          setAppState(AppState.SHOWING_RESULT);
        }
      } catch (e) {
        console.error("Failed to restore data", e);
        setHasSavedData(false);
      }
    }
  }, []);

  // Save to local storage when data changes
  useEffect(() => {
    if (landmarkData) {
      // Exclude audioBuffer as it is not serializable
      const { audioBuffer, ...rest } = landmarkData;
      try {
        localStorage.setItem('lensLegend_data', JSON.stringify(rest));
        setHasSavedData(true);
      } catch (e) {
        console.warn("Quota exceeded, cannot save data", e);
      }
    }
  }, [landmarkData]);
  
  // Helper: Convert file to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove data:<mime>;base64, prefix
          const base64 = reader.result.split(',')[1]; 
          resolve(base64);
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  // Helper: Get full Data URL for background image
  const fileToDataURL = (file: File): Promise<string> => {
      return new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
      });
  };

  const handleImageCapture = async (file: File) => {
    try {
      setAppState(AppState.ANALYZING_IMAGE);
      setError(null);

      // 1. Prepare data
      const base64Data = await fileToBase64(file);
      const mimeType = file.type || 'image/jpeg';
      let originalImageSrc = await fileToDataURL(file);
      
      // If PDF, we can't display it as a background image. Use a placeholder.
      if (mimeType === 'application/pdf') {
         originalImageSrc = ''; 
      }
      
      // Set temp image for loading screen
      setTempImage(originalImageSrc);

      // 2. Identify
      const landmarkName = await identifyLandmark(base64Data, mimeType, language);
      
      setAppState(AppState.FETCHING_INFO);
      
      // 3. Search History (Pass image for better grounding)
      const { description, sources } = await getLandmarkDetails(landmarkName, base64Data, mimeType, language);

      setAppState(AppState.GENERATING_AUDIO);

      // 4. Generate Audio
      const audioBuffer = await generateNarration(description);

      // 5. Done
      setLandmarkData({
        name: landmarkName,
        description,
        sources,
        audioBuffer,
        originalImage: originalImageSrc,
        language
      });
      setAppState(AppState.SHOWING_RESULT);

    } catch (err: any) {
      console.error(err);
      setError({ message: err.message || "System Error. Please recalibrate." });
      setAppState(AppState.ERROR);
    }
  };

  const handleRegenerateAudio = async () => {
    if (!landmarkData) return;
    setAppState(AppState.GENERATING_AUDIO);
    // Keep temp image for background if available
    if (landmarkData.originalImage) setTempImage(landmarkData.originalImage);
    
    try {
      const audioBuffer = await generateNarration(landmarkData.description);
      setLandmarkData(prev => prev ? { ...prev, audioBuffer } : null);
      setAppState(AppState.SHOWING_RESULT);
    } catch (e) {
      console.error(e);
      setAppState(AppState.SHOWING_RESULT);
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setLandmarkData(null);
    setTempImage(null);
    setError(null);
    // Do NOT clear localStorage here to allow persistence
    setHasSavedData(!!localStorage.getItem('lensLegend_data'));
  };
  
  const handleRestoreSession = () => {
      const saved = localStorage.getItem('lensLegend_data');
      if (saved) {
        try {
            const parsed = JSON.parse(saved);
            setLandmarkData(parsed);
            if (parsed.language) setLanguage(parsed.language);
            setAppState(AppState.SHOWING_RESULT);
        } catch(e) {
            console.error("Restore failed", e);
        }
      }
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  };

  const isAr = language === 'ar';

  return (
    <div className="w-full h-full min-h-screen bg-slate-950 text-white overflow-hidden select-none">
      
      {appState === AppState.IDLE && (
        <CameraView 
          onImageCapture={handleImageCapture} 
          language={language}
          onToggleLanguage={toggleLanguage}
          hasSavedData={hasSavedData}
          onRestore={handleRestoreSession}
        />
      )}

      {(appState === AppState.ANALYZING_IMAGE || 
        appState === AppState.FETCHING_INFO || 
        appState === AppState.GENERATING_AUDIO) && (
        <LoadingScreen 
            language={language}
            imageSrc={tempImage || undefined}
            status={
                appState === AppState.ANALYZING_IMAGE ? "Identifying..." :
                appState === AppState.FETCHING_INFO ? "Searching..." :
                "Generating..."
            } 
        />
      )}

      {appState === AppState.SHOWING_RESULT && landmarkData && (
        <ARResultView 
          data={landmarkData} 
          onReset={handleReset} 
          onRegenerateAudio={handleRegenerateAudio}
        />
      )}

      {appState === AppState.ERROR && (
        <div className={`flex flex-col items-center justify-center h-screen px-6 text-center bg-slate-950 ${isAr ? 'font-arabic' : 'font-mono-tech'}`} dir={isAr ? 'rtl' : 'ltr'}>
            <div className="w-20 h-20 border-2 border-red-500/50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </div>
            <h2 className="text-xl font-bold text-red-500 mb-2 tracking-widest">{isAr ? "خطأ في النظام" : "SYSTEM ERROR"}</h2>
            <p className="text-gray-400 mb-8 max-w-xs font-light text-sm">{error?.message}</p>
            <button 
                onClick={handleReset}
                className="px-8 py-3 bg-red-500/10 border border-red-500/50 text-red-400 font-bold text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all rounded"
            >
                {isAr ? "إعادة التشغيل" : "REBOOT SYSTEM"}
            </button>
        </div>
      )}
    </div>
  );
};

export default App;