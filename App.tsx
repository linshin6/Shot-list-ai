import React, { useState, useCallback } from 'react';
import { generateShotDescriptions, generateImageForShotDescription, generateNextShotDescription } from './services/geminiService';
import { GeneratedShot, ScriptAnalysisResult, ShotDescription } from './types';
import ScriptInput from './components/ScriptInput';
import Timeline from './components/Timeline';
import Loader from './components/Loader';
import { FilmIcon, PlusCircleIcon } from './components/icons';

const App: React.FC = () => {
  const [script, setScript] = useState<string>('');
  const [ideaImage, setIdeaImage] = useState<string | null>(null);
  const [style, setStyle] = useState<string>('Cinematic (Default)');
  const [framing, setFraming] = useState<string>('Default');
  const [shotList, setShotList] = useState<GeneratedShot[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAddingScene, setIsAddingScene] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [totalShots, setTotalShots] = useState<number>(0);
  const [analysisResult, setAnalysisResult] = useState<ScriptAnalysisResult | null>(null);


  const handleGenerate = useCallback(async () => {
    if (!script.trim()) {
      setError('Please enter a script.');
      return;
    }

    setIsLoading(true);
    setShotList([]);
    setError(null);
    setAnalysisResult(null);
    setTotalShots(0);
    setLoadingMessage('Analyzing script and setting up scenes...');

    try {
        const analysis = await generateShotDescriptions(script, ideaImage, style, framing);
        setAnalysisResult(analysis);
        setTotalShots(analysis.shot_list.length);

        if (analysis.shot_list.length === 0) {
            setIsLoading(false);
            return;
        }

        const newShotList: GeneratedShot[] = [];
        for (let i = 0; i < analysis.shot_list.length; i++) {
            const shotDesc = analysis.shot_list[i];
            setLoadingMessage(`Generating shot ${i + 1} of ${analysis.shot_list.length}...`);
            const newShot = await generateImageForShotDescription(shotDesc, analysis, style, framing);
            newShotList.push(newShot);
            setShotList([...newShotList]);
        }
      
    } catch (err: any) {
      console.error(err);
      setError(`An error occurred: ${err.message}. Please check the console for details.`);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [script, ideaImage, style, framing]);

  const handleAddScene = useCallback(async () => {
    if (!analysisResult || shotList.length === 0) return;

    setIsAddingScene(true);
    setError(null);
    try {
        const newShotDescription = await generateNextShotDescription(
            script,
            ideaImage,
            analysisResult,
            shotList,
            style,
            framing
        );

        const newGeneratedShot = await generateImageForShotDescription(
            newShotDescription,
            analysisResult,
            style,
            framing
        );
        
        // Add new shot to the UI list
        setShotList(prev => [...prev, newGeneratedShot]);
        
        // Update the main analysis result to include the new shot for future context
        setAnalysisResult(prev => {
            if (!prev) return null;
            return {
                ...prev,
                shot_list: [...prev.shot_list, newShotDescription],
            };
        });

    } catch (err: any) {
        console.error(err);
        setError(`Failed to add a new scene: ${err.message}`);
    } finally {
        setIsAddingScene(false);
    }
  }, [analysisResult, shotList, script, ideaImage, style, framing]);


  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans">
      <header className="bg-brand-surface/80 backdrop-blur-sm sticky top-0 z-10 border-b border-white/10 shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FilmIcon className="w-8 h-8 text-brand-primary" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              Cinematic Shot List Generator
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
            <ScriptInput
              script={script}
              setScript={setScript}
              ideaImage={ideaImage}
              setIdeaImage={setIdeaImage}
              style={style}
              setStyle={setStyle}
              framing={framing}
              setFraming={setFraming}
              onGenerate={handleGenerate}
              isLoading={isLoading || isAddingScene}
            />
          </div>

          <div className="lg:col-span-8">
            <div className="bg-brand-surface rounded-lg shadow-2xl p-6 min-h-[calc(100vh-200px)]">
              {isLoading && shotList.length === 0 && (
                 <div className="flex flex-col items-center justify-center h-full">
                    <Loader />
                    <p className="mt-4 text-brand-text-muted animate-pulse">{loadingMessage}</p>
                 </div>
              )}

              {error && (
                <div className="flex items-center justify-center h-full text-red-400 text-center">
                  <p>{error}</p>
                </div>
              )}

              {!isLoading && shotList.length === 0 && !error && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <FilmIcon className="w-24 h-24 text-gray-700" />
                  <h2 className="mt-4 text-xl font-semibold text-gray-400">Your Shot List Appears Here</h2>
                  <p className="mt-2 text-gray-500">
                    Paste your script, upload an optional idea image, and click "Generate" to create your cinematic timeline.
                  </p>
                </div>
              )}
              
              {shotList.length > 0 && <Timeline shots={shotList} />}
              
              {isLoading && shotList.length > 0 && (
                <div className="flex flex-col items-center justify-center mt-8">
                  <Loader />
                  <p className="mt-4 text-brand-text-muted animate-pulse">{loadingMessage}</p>
                </div>
              )}
              
              {shotList.length > 0 && !isLoading && (
                  <div className="flex justify-center mt-12">
                      <button 
                        onClick={handleAddScene}
                        disabled={isAddingScene}
                        className="flex items-center justify-center bg-brand-secondary hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-bg focus:ring-brand-secondary"
                      >
                         {isAddingScene ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Adding Scene...
                            </>
                         ) : (
                            <>
                                <PlusCircleIcon className="w-5 h-5 mr-2" />
                                Thêm cảnh
                            </>
                         )}
                      </button>
                  </div>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;