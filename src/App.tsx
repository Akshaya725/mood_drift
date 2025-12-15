import React, { useState } from 'react';
import { generateGameForMood } from './services/geminiService';
import { AppState, GameConfig, MoodPreset } from './types';
import { ClickerGame, CatcherGame, MemoryGame } from './components/MiniGames';

const MOODS: MoodPreset[] = [
  { label: 'Angry', emoji: '😡', color: '#EF4444' }, // Red
  { label: 'Happy', emoji: '😊', color: '#F59E0B' }, // Amber
  { label: 'Sad', emoji: '😢', color: '#3B82F6' },   // Blue
  { label: 'Bored', emoji: '😐', color: '#8B5CF6' },  // Purple
  { label: 'Anxious', emoji: '😰', color: '#10B981' }, // Emerald
];

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('MOOD_SELECTION');
  const [currentMood, setCurrentMood] = useState<string>('');
  const [customMood, setCustomMood] = useState<string>('');
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [lastScore, setLastScore] = useState<number>(0);

  const handleMoodSelect = async (mood: string) => {
    setCurrentMood(mood);
    setAppState('GENERATING');
    
    // Simulate thinking delay if needed, but the API call is the real delay
    const config = await generateGameForMood(mood);
    setGameConfig(config);
    setAppState('PLAYING');
  };

  const handleGameOver = (score: number) => {
    setLastScore(score);
    setAppState('GAME_OVER');
  };

  const resetApp = () => {
    setAppState('MOOD_SELECTION');
    setGameConfig(null);
    setCustomMood('');
  };

  const renderContent = () => {
    switch (appState) {
      case 'MOOD_SELECTION':
        return (
          <div className="flex flex-col items-center justify-center min-h-screen p-6 animate-fade-in bg-slate-50">
            <header className="mb-12 text-center">
              <h1 className="text-5xl font-extrabold text-slate-800 mb-4 tracking-tight">
                Moodrift
              </h1>
              <p className="text-xl text-slate-500 max-w-md mx-auto">
                How are you feeling right now? We'll create a game to match your vibe.
              </p>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-2xl mb-8">
              {MOODS.map((mood) => (
                <button
                  key={mood.label}
                  onClick={() => handleMoodSelect(mood.label)}
                  className="group relative flex flex-col items-center justify-center p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-slate-100 overflow-hidden"
                >
                  <div className={`absolute top-0 left-0 w-full h-1 bg-[${mood.color}]`} style={{ backgroundColor: mood.color }} />
                  <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">{mood.emoji}</span>
                  <span className="font-semibold text-slate-700">{mood.label}</span>
                </button>
              ))}
            </div>

            <div className="w-full max-w-md bg-white p-2 rounded-full shadow-md border border-slate-200 flex">
              <input
                type="text"
                placeholder="Or type how you feel (e.g., 'Overwhelmed')..."
                value={customMood}
                onChange={(e) => setCustomMood(e.target.value)}
                className="flex-grow px-4 py-2 rounded-full outline-none text-slate-700 bg-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customMood.trim()) {
                    handleMoodSelect(customMood);
                  }
                }}
              />
              <button
                onClick={() => customMood.trim() && handleMoodSelect(customMood)}
                className="bg-slate-800 text-white px-6 py-2 rounded-full font-medium hover:bg-slate-900 transition-colors"
              >
                Go
              </button>
            </div>
          </div>
        );

      case 'GENERATING':
        return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
            <div className="relative w-24 h-24 mb-8">
               <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
               <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <h2 className="text-2xl font-bold text-slate-700 mb-2">Drifting into {currentMood}...</h2>
            <p className="text-slate-500 animate-pulse">Generating your personal game experience.</p>
          </div>
        );

      case 'PLAYING':
        if (!gameConfig) return null;
        return (
          <div 
            className="w-full h-screen flex flex-col relative overflow-hidden"
            style={{ backgroundColor: gameConfig.theme.background }}
          >
            {/* Game Header */}
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-50 pointer-events-none">
                <div className="bg-white/90 backdrop-blur px-6 py-3 rounded-2xl shadow-sm border border-black/5">
                    <h2 className="text-xl font-bold" style={{ color: gameConfig.theme.text }}>{gameConfig.title}</h2>
                    <p className="text-sm opacity-75" style={{ color: gameConfig.theme.text }}>{gameConfig.instructions}</p>
                </div>
                <button 
                  onClick={() => handleGameOver(0)} // Abort
                  className="pointer-events-auto bg-white/90 backdrop-blur p-2 rounded-full shadow-sm hover:bg-red-50 text-red-500 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>

            {/* Game Canvas/Container */}
            <div className="flex-grow w-full h-full">
              {gameConfig.gameType === 'clicker' && <ClickerGame config={gameConfig} onGameOver={handleGameOver} />}
              {gameConfig.gameType === 'catcher' && <CatcherGame config={gameConfig} onGameOver={handleGameOver} />}
              {gameConfig.gameType === 'memory' && <MemoryGame config={gameConfig} onGameOver={handleGameOver} />}
            </div>
          </div>
        );

      case 'GAME_OVER':
        return (
          <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 animate-fade-in">
             <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md w-full border border-slate-100">
                <h2 className="text-3xl font-bold text-slate-800 mb-2">Session Complete</h2>
                <p className="text-slate-500 mb-6">Hopefully you feel a bit better.</p>
                
                <div className="bg-indigo-50 p-6 rounded-2xl mb-8">
                    <p className="text-sm text-indigo-600 font-semibold uppercase tracking-wider mb-1">Final Score</p>
                    <p className="text-5xl font-black text-indigo-900">{lastScore}</p>
                </div>

                <div className="space-y-3">
                    <button 
                      onClick={() => handleMoodSelect(currentMood)} 
                      className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors"
                    >
                      Play Again
                    </button>
                    <button 
                      onClick={resetApp} 
                      className="w-full bg-white text-slate-700 border border-slate-200 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                    >
                      Choose New Mood
                    </button>
                </div>
             </div>
          </div>
        );
    }
  };

  return (
    <div className="font-sans text-slate-900">
      {renderContent()}
    </div>
  );
};

export default App;