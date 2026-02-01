
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { AppState, OracleResponse, Language } from './types';
import { consultOracle } from './services/geminiService';
import Talisman from './components/Talisman';

const TRANSLATIONS: Record<Language, any> = {
  en: {
    title: "Windfu Oracle",
    subtitle: "Your Fluffy Snow Friend • Cozy Blessings",
    intro: "Windfu the Yeti is listening! Tell him what's on your mind and he'll give you a snowy blessing.",
    placeholder: "Ask Windfu anything... (e.g. Will I have a lucky day?)",
    button: "ASK WINDFU!",
    loading: "Windfu is thinking... (pats tummy)",
    interpretationLabel: "Windfu's Message",
    adviceLabel: "A Warm Hug",
    another: "ASK AGAIN!",
    errorPrefix: "Brrr! Something went wrong: ",
    retry: "TRY AGAIN"
  },
  zh: {
    title: "雪怪風符",
    subtitle: "你的毛茸茸雪山好友 • 溫暖祝福",
    intro: "雪怪風符正在聽哦！告訴他你的心事，他會給你一個暖暖的雪山祝福。",
    placeholder: "問問風符吧...（例如：今天會有好運嗎？）",
    button: "召喚風符！",
    loading: "風符正在思考中... (摸摸肚子)",
    interpretationLabel: "風符的話",
    adviceLabel: "暖心建議",
    another: "再問一次！",
    errorPrefix: "哎呀！出錯了：",
    retry: "重試"
  },
  sv: {
    title: "Windfu Orakel",
    subtitle: "Din Fluffiga Snövän • Mysiga Välsignelser",
    intro: "Snömonstret Windfu lyssnar! Berätta vad du funderar på så ger han dig en snöig välsignelse.",
    placeholder: "Fråga Windfu vad som helst... (t.ex. Kommer jag ha tur idag?)",
    button: "FRÅGA WINDFU!",
    loading: "Windfu tänker... (klappar magen)",
    interpretationLabel: "Windfus Budskap",
    adviceLabel: "En Varm Kram",
    another: "FRÅGA IGEN!",
    errorPrefix: "Brrr! Något gick fel: ",
    retry: "FÖRSÖK IGEN"
  }
};

// Simple Yeti CSS Mascot Component
const YetiMascot = () => (
  <div className="relative w-32 h-32 mb-6 group">
    {/* Body Fur (White) */}
    <div className="absolute inset-0 bg-white rounded-full border-4 border-sky-100 shadow-lg"></div>
    {/* Face Area (Blue) */}
    <div className="absolute inset-4 bg-sky-400 rounded-3xl flex flex-col items-center justify-center shadow-inner overflow-hidden">
        {/* Eyes */}
        <div className="flex gap-4 mb-2">
            <div className="w-2 h-2 bg-slate-900 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-slate-900 rounded-full animate-bounce"></div>
        </div>
        {/* Mouth/Teeth */}
        <div className="w-4 h-1 bg-slate-900 rounded-full relative">
            <div className="absolute -bottom-1 left-0 w-1 h-1 bg-white"></div>
            <div className="absolute -bottom-1 right-0 w-1 h-1 bg-white"></div>
        </div>
    </div>
    {/* Tiny Horns */}
    <div className="absolute -top-2 left-4 w-4 h-6 bg-slate-300 rounded-t-full -rotate-12"></div>
    <div className="absolute -top-2 right-4 w-4 h-6 bg-slate-300 rounded-t-full rotate-12"></div>
  </div>
);

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const [question, setQuestion] = useState('');
  const [status, setStatus] = useState<AppState>(AppState.IDLE);
  const [result, setResult] = useState<OracleResponse | null>(null);
  const [error, setError] = useState('');

  const t = useMemo(() => TRANSLATIONS[lang], [lang]);

  const handleConsult = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setStatus(AppState.CONSULTING);
    setError('');
    
    try {
      const data = await consultOracle(question, lang);
      setResult(data);
      setStatus(AppState.REVEALED);
    } catch (err: any) {
      setError(err.message || 'Windfu is currently busy building a snowman.');
      setStatus(AppState.ERROR);
    }
  }, [question, lang]);

  const reset = () => {
    setStatus(AppState.IDLE);
    setQuestion('');
    setResult(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative bg-[#050b14] overflow-hidden">
      {/* Falling Snow Background */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i} 
            className="snowflake"
            style={{
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 8 + 2}px`,
              height: `${Math.random() * 8 + 2}px`,
              animationDuration: `${Math.random() * 5 + 5}s`,
              animationDelay: `${Math.random() * 5}s`,
              top: '-10px'
            }}
          />
        ))}
      </div>

      {/* Language Switcher */}
      <div className="fixed top-6 right-6 z-50 flex gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/10">
        {(['en', 'zh', 'sv'] as Language[]).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold tracking-tight transition-all ${
              lang === l ? 'bg-sky-400 text-white shadow-lg shadow-sky-400/30' : 'text-sky-200/50 hover:text-sky-200 hover:bg-white/5'
            }`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <header className="mb-8 text-center relative z-10 flex flex-col items-center">
        <YetiMascot />
        <h1 className="text-4xl md:text-6xl font-extrabold mb-2 tracking-tight text-white drop-shadow-lg">
          {t.title}
        </h1>
        <p className="text-sky-400/80 font-medium tracking-wide text-sm">{t.subtitle}</p>
      </header>

      <main className="w-full max-w-4xl relative z-10">
        {status === AppState.IDLE && (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-700">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-3xl mb-8 max-w-md text-center">
              <p className="text-sky-100 text-lg leading-relaxed">
                {t.intro}
              </p>
            </div>
            <form onSubmit={handleConsult} className="w-full max-w-lg space-y-4">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={t.placeholder}
                className="w-full bg-white/10 border border-white/20 rounded-[30px] p-8 text-white focus:outline-none focus:ring-4 focus:ring-sky-400/20 min-h-[160px] text-xl resize-none placeholder-white/20 transition-all"
              />
              <button
                type="submit"
                disabled={!question.trim()}
                className="w-full py-5 bg-sky-400 text-white rounded-[30px] text-xl font-bold tracking-tight hover:bg-sky-300 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-xl shadow-sky-900/40"
              >
                {t.button}
              </button>
            </form>
          </div>
        )}

        {status === AppState.CONSULTING && (
          <div className="flex flex-col items-center justify-center py-20 space-y-8 animate-pulse">
             <div className="relative">
                <div className="w-24 h-24 border-8 border-sky-400/20 border-t-sky-400 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-3xl">❄️</div>
             </div>
            <p className="text-sky-300 font-bold tracking-tight text-lg">{t.loading}</p>
          </div>
        )}

        {status === AppState.REVEALED && result && (
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <Talisman data={result} />
            
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-[40px] shadow-2xl">
                <section className="mb-8">
                    <h3 className="text-sky-400 text-sm font-black uppercase tracking-widest mb-3">{t.interpretationLabel}</h3>
                    <p className="text-white text-xl leading-relaxed font-medium">
                    {result.interpretation}
                    </p>
                </section>

                <section className="p-5 bg-sky-400/10 rounded-3xl border border-sky-400/20">
                    <h3 className="text-sky-300 text-xs font-black uppercase tracking-widest mb-2">{t.adviceLabel}</h3>
                    <p className="text-sky-100 italic text-lg leading-snug">
                    "{result.advice}"
                    </p>
                </section>
              </div>

              <button
                onClick={reset}
                className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-[30px] text-sm font-black tracking-widest transition-all border border-white/10"
              >
                {t.another}
              </button>
            </div>
          </div>
        )}

        {status === AppState.ERROR && (
          <div className="text-center py-20 bg-red-500/10 rounded-[40px] border border-red-500/20 p-10">
            <p className="text-red-400 mb-8 font-bold text-xl">{t.errorPrefix} {error}</p>
            <button
              onClick={reset}
              className="px-10 py-4 bg-red-500 text-white rounded-[30px] font-black tracking-widest hover:bg-red-400 transition-all"
            >
              {t.retry}
            </button>
          </div>
        )}
      </main>

      <footer className="mt-16 text-sky-200/20 text-[10px] font-bold tracking-[0.3em] uppercase text-center relative z-10">
        © Windfu Oracle • Pure Snow Intelligence • {lang === 'zh' ? '暖暖的' : 'Stay Cozy'}
      </footer>
    </div>
  );
};

export default App;
