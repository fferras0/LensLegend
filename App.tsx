import React, { useState } from 'react';
import { CameraView } from './components/CameraView';
import { LoadingScreen } from './components/LoadingScreen';
import { ARResultView } from './components/ARResultView';
import { AppState, ErrorState, LandmarkData, Language } from './types';
import { identifyLandmark, getLandmarkDetails, generateNarration } from './services/geminiService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [error, setError] = useState<ErrorState | null>(null);
  const [landmarkData, setLandmarkData] = useState<LandmarkData | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  
  // Helper: Convert file to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove data:image/jpeg;base64, prefix if needed
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

      // 1. Prepare image
      const base64Image = await fileToBase64(file);
      const originalImageSrc = await fileToDataURL(file);

      // 2. Identify
      const landmarkName = await identifyLandmark(base64Image, language);
      
      setAppState(AppState.FETCHING_INFO);
      
      // 3. Search History
      const { description, sources } = await getLandmarkDetails(landmarkName, language);

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
      setError({ message: err.message || "Something went wrong. Please try again." });
      setAppState(AppState.ERROR);
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setLandmarkData(null);
    setError(null);
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  };

  const isAr = language === 'ar';

  return (
    <div className={`w-full h-full min-h-screen bg-black text-white ${isAr ? 'font-arabic' : 'font-sans'}`} dir={isAr ? 'rtl' : 'ltr'}>
      
      {appState === AppState.IDLE && (
        <CameraView 
          onImageCapture={handleImageCapture} 
          language={language}
          onToggleLanguage={toggleLanguage}
        />
      )}

      {(appState === AppState.ANALYZING_IMAGE || 
        appState === AppState.FETCHING_INFO || 
        appState === AppState.GENERATING_AUDIO) && (
        <LoadingScreen 
            language={language}
            status={
                appState === AppState.ANALYZING_IMAGE ? "Identifying landmark..." :
                appState === AppState.FETCHING_INFO ? "Searching history..." :
                "Generating audio guide..."
            } 
        />
      )}

      {appState === AppState.SHOWING_RESULT && landmarkData && (
        <ARResultView data={landmarkData} onReset={handleReset} />
      )}

      {appState === AppState.ERROR && (
        <div className="flex flex-col items-center justify-center h-screen px-6 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">{isAr ? "عفواً!" : "Oops!"}</h2>
            <p className="text-gray-400 mb-8">{error?.message}</p>
            <button 
                onClick={handleReset}
                className="px-6 py-3 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition"
            >
                {isAr ? "حاول مرة أخرى" : "Try Again"}
            </button>
        </div>
      )}
    </div>
  );
};

export default App;