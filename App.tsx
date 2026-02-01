
import React, { useState, useCallback } from 'react';
import { AppState, OracleResponse } from './types';
import { consultOracle } from './services/geminiService';
import Talisman from './components/Talisman';

const App: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [status, setStatus] = useState<AppState>(AppState.IDLE);
  const [result, setResult] = useState<OracleResponse | null>(null);
  const [error, setError] = useState('');

  const handleConsult = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setStatus(AppState.CONSULTING);
    setError('');
    
    try {
      const data = await consultOracle(question);
      setResult(data);
      setStatus(AppState.REVEALED);
    } catch (err: any) {
      setError(err.message || 'The winds are too chaotic to read right now.');
      setStatus(AppState.ERROR);
    }
  }, [question]);

  const reset = () => {
    setStatus(AppState.IDLE);
    setQuestion('');
    setResult(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-zinc-950 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-900/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-900/10 rounded-full blur-[100px]"></div>
        {/* Animated Dust/Wind Particles (CSS Only) */}
        <div className="stars"></div>
      </div>

      <header className="mb-12 text-center relative z-10">
        <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tighter bg-gradient-to-b from-amber-200 to-amber-600 bg-clip-text text-transparent" style={{ fontFamily: 'Ma Shan Zheng, cursive' }}>
          Windfu Oracle
        </h1>
        <p className="text-zinc-500 uppercase tracking-[0.3em] text-xs">Digital Taoist Divination • Shifting Winds</p>
      </header>

      <main className="w-full max-w-4xl relative z-10">
        {status === AppState.IDLE && (
          <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <p className="text-zinc-400 text-center mb-8 max-w-md italic">
              "When the wind blows through the hollows, the truth is whispered. Clear your mind and ask your question."
            </p>
            <form onSubmit={handleConsult} className="w-full max-w-lg space-y-4">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What troubles your spirit? (e.g., Should I begin a new journey?)"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-red-900/50 min-h-[150px] text-lg resize-none placeholder-zinc-700"
              />
              <button
                type="submit"
                disabled={!question.trim()}
                className="w-full py-4 bg-red-950 text-red-200 rounded-xl font-bold tracking-widest hover:bg-red-900 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed border border-red-900/30"
              >
                CONSULT THE WINDS
              </button>
            </form>
          </div>
        )}

        {status === AppState.CONSULTING && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-pulse">
            <div className="w-16 h-16 border-4 border-red-900/30 border-t-red-600 rounded-full animate-spin"></div>
            <p className="text-zinc-500 font-medium tracking-widest text-sm">LISTENING TO THE SHIFTING WINDS...</p>
          </div>
        )}

        {status === AppState.REVEALED && result && (
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <Talisman data={result} />
            
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-1000">
              <section>
                <h3 className="text-red-600 text-xs font-bold tracking-[0.4em] uppercase mb-4">The Wind's Interpretation</h3>
                <p className="text-zinc-300 text-lg leading-relaxed font-light">
                  {result.interpretation}
                </p>
              </section>

              <section className="p-6 bg-zinc-900/50 border-l-4 border-red-900 rounded-r-xl">
                <h3 className="text-amber-500 text-xs font-bold tracking-[0.4em] uppercase mb-2">Ancestral Advice</h3>
                <p className="text-zinc-400 italic">
                  "{result.advice}"
                </p>
              </section>

              <button
                onClick={reset}
                className="px-8 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-full text-sm font-bold tracking-widest transition-all border border-zinc-800"
              >
                ASK ANOTHER QUESTION
              </button>
            </div>
          </div>
        )}

        {status === AppState.ERROR && (
          <div className="text-center py-20">
            <p className="text-red-500 mb-6 font-medium">The winds are too chaotic: {error}</p>
            <button
              onClick={reset}
              className="px-8 py-3 bg-red-950 text-red-200 rounded-xl font-bold tracking-widest hover:bg-red-900 transition-all"
            >
              TRY AGAIN
            </button>
          </div>
        )}
      </main>

      <footer className="mt-20 text-zinc-600 text-[10px] tracking-widest uppercase text-center relative z-10">
        © Windfu Oracle • Gemini 3 Divine Intelligence • No Strings Attached
      </footer>
    </div>
  );
};

export default App;
