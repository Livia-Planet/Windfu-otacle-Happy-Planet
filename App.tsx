import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AppState, OracleResponse, Language } from './types';
import { consultOracle, connectLive, createBlob, decode, decodeAudioData, generateYetiSound, readTextAloud, translateOracleResponse } from './services/geminiService';
import Talisman from './components/Talisman';

const TRANSLATIONS: Record<Language, any> = {
  en: {
    title: "Windfu Oracle",
    subtitle: "Your Sleepy Snow Friend • Cozy Blessings",
    intro: "Windfu just woke up from a nap! Tell him what's on your mind and he'll give you a serious blessing.",
    placeholder: "Ask sleepy Windfu... (e.g. Will I have a lucky day?)",
    button: "ASK WINDFU!",
    loading: "Windfu is waking up... (yawn)",
    translating: "Translating for you... (yawn)",
    interpretationLabel: "Windfu's Message",
    adviceLabel: "A Warm Hug",
    another: "ASK AGAIN!",
    errorPrefix: "Brrr! Something went wrong: ",
    retry: "TRY AGAIN",
    voiceBtnIdle: "Voice Input",
    voiceBtnActive: "Listening...",
    voiceError: "Microphone access denied or brrr-oken.",
    listenBtn: "Listen"
  },
  zh: {
    title: "雪怪風符",
    subtitle: "刚睡醒的毛茸茸好友 • 溫暖祝福",
    intro: "風符剛睡醒哦，揉揉眼睛正在聽呢！告訴他你的心事，他會給你一個認真的雪山祝福。",
    placeholder: "問問睡眼惺忪的風符吧...（例如：今天会有好运吗？）",
    button: "召喚風符！",
    loading: "風符正在努力清醒中... (打呵欠)",
    translating: "正在翻譯中... (打呵欠)",
    interpretationLabel: "風符的話",
    adviceLabel: "暖心建議",
    another: "再問一次！",
    errorPrefix: "哎呀！出錯了：",
    retry: "重試",
    voiceBtnIdle: "語音輸入",
    voiceBtnActive: "正在聆聽...",
    voiceError: "麥克風無法使用。",
    listenBtn: "聆聽"
  },
  sv: {
    title: "Windfu Orakel",
    subtitle: "Din Sömniga Snövän • Mysiga Välsignelser",
    intro: "Windfu har precis vaknat! Berätta vad du funderar på så ger han dig en snöig välsignelse.",
    placeholder: "Fråga den sömniga Windfu... (t.ex. Kommer jag ha tur idag?)",
    button: "FRÅGA WINDFU!",
    loading: "Windfu vaknar... (gäspar)",
    translating: "Översätter... (gäspar)",
    interpretationLabel: "Windfus Budskap",
    adviceLabel: "En Varm Kram",
    another: "FRÅGA IGEN!",
    errorPrefix: "Brrr! Något gick fel: ",
    retry: "FÖRSÖK IGEN",
    voiceBtnIdle: "Röstinmatning",
    voiceBtnActive: "Lyssnar...",
    voiceError: "Mikrofonåtkomst nekad.",
    listenBtn: "Lyssna"
  }
};

const YetiMascot = ({ isListening, isSpeaking }: { isListening?: boolean, isSpeaking?: boolean }) => (
  <div className={`relative w-32 h-32 mb-6 group transition-all duration-500 ${isListening || isSpeaking ? 'scale-110' : ''}`}>
    <div className={`absolute inset-0 bg-white rounded-full border-4 shadow-lg transition-colors duration-500 ${(isListening || isSpeaking) ? 'border-sky-300 bg-sky-50' : 'border-sky-100'}`}></div>
    <div className={`absolute inset-4 rounded-3xl flex flex-col items-center justify-center shadow-inner overflow-hidden transition-colors duration-500 ${isListening ? 'bg-sky-300' : isSpeaking ? 'bg-sky-200' : 'bg-sky-400'}`}>
        <div className="flex gap-4 mb-2">
            <div className={`w-2 h-2 bg-slate-900 rounded-full ${isListening ? 'animate-ping' : isSpeaking ? 'animate-pulse' : 'animate-bounce opacity-40'}`}></div>
            <div className={`w-2 h-2 bg-slate-900 rounded-full ${isListening ? 'animate-ping' : isSpeaking ? 'animate-pulse' : 'animate-bounce opacity-40'}`}></div>
        </div>
        <div className={`w-4 h-1 bg-slate-900 rounded-full relative transition-all ${isListening || isSpeaking ? 'h-4' : 'h-1 opacity-50'}`}>
            <div className="absolute -bottom-1 left-0 w-1 h-1 bg-white"></div>
            <div className="absolute -bottom-1 right-0 w-1 h-1 bg-white"></div>
        </div>
    </div>
    <div className="absolute -top-2 left-4 w-4 h-6 bg-slate-300 rounded-t-full -rotate-12"></div>
    <div className="absolute -top-2 right-4 w-4 h-6 bg-slate-300 rounded-t-full rotate-12"></div>
    {(isListening || isSpeaking) && <div className="absolute inset-0 rounded-full animate-ping border-2 border-sky-400/50"></div>}
  </div>
);

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const [question, setQuestion] = useState('');
  const [status, setStatus] = useState<AppState>(AppState.IDLE);
  const [result, setResult] = useState<OracleResponse | null>(null);
  const [error, setError] = useState('');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isYetiSpeaking, setIsYetiSpeaking] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const t = useMemo(() => TRANSLATIONS[lang], [lang]);

  const sessionRef = useRef<any>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const initAudioContext = useCallback(() => {
    if (!outputAudioContextRef.current) {
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (outputAudioContextRef.current.state === 'suspended') {
      outputAudioContextRef.current.resume();
    }
    return outputAudioContextRef.current;
  }, []);

  const playBase64Audio = async (base64: string, ctx: AudioContext) => {
    try {
      setIsYetiSpeaking(true);
      if (ctx.state === 'suspended') await ctx.resume();
      
      const audioBuffer = await decodeAudioData(decode(base64), ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      
      source.addEventListener('ended', () => {
        sourcesRef.current.delete(source);
        if (sourcesRef.current.size === 0) setIsYetiSpeaking(false);
      });

      nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;
      sourcesRef.current.add(source);
    } catch (e) {
      console.error("Audio playback failed", e);
      setIsYetiSpeaking(false);
    }
  };

  const handleReadAloud = async (text: string, id: string) => {
    if (isYetiSpeaking || isAudioLoading) return;
    setIsAudioLoading(id);
    try {
      const audioData = await readTextAloud(text);
      if (audioData) {
        const ctx = initAudioContext();
        await playBase64Audio(audioData, ctx);
      }
    } catch (e) {
      console.error("Read aloud failed", e);
    } finally {
      setIsAudioLoading(null);
    }
  };

  // Automatic translation when lang changes while in REVEALED state
  useEffect(() => {
    if (status === AppState.REVEALED && result && !isTranslating) {
      const performTranslation = async () => {
        setIsTranslating(true);
        try {
          const translated = await translateOracleResponse(result, lang);
          setResult(translated);
        } catch (err) {
          console.error("Translation failed", err);
        } finally {
          setIsTranslating(false);
        }
      };
      performTranslation();
    }
  }, [lang]); // Trigger whenever language changes

  const stopVoiceMode = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    setIsVoiceActive(false);
    setIsYetiSpeaking(false);
  }, []);

  const toggleVoiceMode = async () => {
    if (isVoiceActive) {
      stopVoiceMode();
      return;
    }

    try {
      setIsVoiceActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = initAudioContext();
      inputAudioContextRef.current = inputCtx;

      const sessionPromise = connectLive(lang, {
        onTranscription: (text) => {
          setQuestion(prev => {
            const trimmed = text.trim();
            if (!trimmed) return prev;
            return prev.toLowerCase().includes(trimmed.toLowerCase()) ? prev : prev + ' ' + trimmed;
          });
        },
        onMessage: async (message) => {
          const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (base64Audio) {
            await playBase64Audio(base64Audio, outputCtx);
          }
          if (message.serverContent?.interrupted) {
            sourcesRef.current.forEach(s => s.stop());
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
            setIsYetiSpeaking(false);
          }
        },
        onError: (e) => {
          console.error(e);
          setError(t.voiceError);
          stopVoiceMode();
        },
        onClose: () => stopVoiceMode(),
      });

      sessionRef.current = await sessionPromise;
      
      const source = inputCtx.createMediaStreamSource(stream);
      const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBlob = createBlob(inputData);
        if (sessionRef.current) {
          sessionRef.current.sendRealtimeInput({ media: pcmBlob });
        }
      };
      source.connect(scriptProcessor);
      scriptProcessor.connect(inputCtx.destination);
    } catch (err) {
      console.error(err);
      setError(t.voiceError);
      setIsVoiceActive(false);
    }
  };

  const handleConsult = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!question.trim()) return;

    if (isVoiceActive) stopVoiceMode();
    
    setStatus(AppState.CONSULTING);
    setError('');

    const soundPromise = generateYetiSound();
    const oraclePromise = consultOracle(question, lang);

    try {
      const [soundData, oracleData] = await Promise.all([soundPromise, oraclePromise]);
      
      if (soundData) {
          const ctx = initAudioContext();
          playBase64Audio(soundData, ctx);
      }

      setResult(oracleData);
      setStatus(AppState.REVEALED);
    } catch (err: any) {
      setError(err.message || 'Windfu is currently busy building a snowman.');
      setStatus(AppState.ERROR);
    }
  }, [question, lang, isVoiceActive, stopVoiceMode, initAudioContext]);

  const reset = () => {
    setStatus(AppState.IDLE);
    setQuestion('');
    setResult(null);
  };

  useEffect(() => {
    return () => stopVoiceMode();
  }, [stopVoiceMode]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative bg-[#050b14] overflow-hidden">
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

      <div className="fixed top-6 right-6 z-50 flex gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/10">
        {(['en', 'zh', 'sv'] as Language[]).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            disabled={isTranslating}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold tracking-tight transition-all ${
              lang === l ? 'bg-sky-400 text-white shadow-lg shadow-sky-400/30' : 'text-sky-200/50 hover:text-sky-200 hover:bg-white/5'
            } ${isTranslating ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <header className="mb-8 text-center relative z-10 flex flex-col items-center">
        <YetiMascot isListening={isVoiceActive} isSpeaking={isYetiSpeaking} />
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
              <div className="relative">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={t.placeholder}
                  className="w-full bg-white/10 border border-white/20 rounded-[30px] p-8 pb-16 text-white focus:outline-none focus:ring-4 focus:ring-sky-400/20 min-h-[180px] text-xl resize-none placeholder-white/20 transition-all"
                />
                <button
                  type="button"
                  onClick={toggleVoiceMode}
                  className={`absolute bottom-6 right-6 p-4 rounded-full transition-all flex items-center gap-2 ${
                    isVoiceActive ? 'bg-red-500 text-white shadow-lg shadow-red-500/50 animate-pulse' : 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30'
                  }`}
                  title={isVoiceActive ? t.voiceBtnActive : t.voiceBtnIdle}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m8 0h-4m-4-8a3 3 0 013-3h2a3 3 0 013 3v5a3 3 0 01-3 3h-2a3 3 0 01-3-3V7z" />
                  </svg>
                  {isVoiceActive && <span className="text-xs font-bold uppercase tracking-widest">{t.voiceBtnActive}</span>}
                </button>
              </div>

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
                <div className="absolute inset-0 flex items-center justify-center text-3xl">💤</div>
             </div>
            <p className="text-sky-300 font-bold tracking-tight text-lg">{t.loading}</p>
          </div>
        )}

        {status === AppState.REVEALED && result && (
          <div className="grid md:grid-cols-2 gap-12 items-center relative">
            {isTranslating && (
              <div className="absolute inset-0 z-50 bg-[#050b14]/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-[40px] animate-in fade-in duration-300">
                <div className="w-12 h-12 border-4 border-sky-400/20 border-t-sky-400 rounded-full animate-spin mb-4"></div>
                <p className="text-sky-300 font-bold text-sm tracking-widest uppercase">{t.translating}</p>
              </div>
            )}
            
            <Talisman data={result} />
            
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-[40px] shadow-2xl">
                <section className="mb-8 relative group">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-sky-400 text-sm font-black uppercase tracking-widest">{t.interpretationLabel}</h3>
                      <button 
                        onClick={() => handleReadAloud(result.interpretation, 'interpretation')}
                        disabled={isYetiSpeaking || !!isAudioLoading || isTranslating}
                        className={`p-2 rounded-full transition-all ${isAudioLoading === 'interpretation' ? 'bg-sky-400/20 animate-spin' : 'hover:bg-white/10 text-sky-400'}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-white text-xl leading-relaxed font-medium">
                    {result.interpretation}
                    </p>
                </section>

                <section className="p-5 bg-sky-400/10 rounded-3xl border border-sky-400/20">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-sky-300 text-xs font-black uppercase tracking-widest">{t.adviceLabel}</h3>
                      <button 
                        onClick={() => handleReadAloud(result.advice, 'advice')}
                        disabled={isYetiSpeaking || !!isAudioLoading || isTranslating}
                        className={`p-1.5 rounded-full transition-all ${isAudioLoading === 'advice' ? 'bg-sky-300/20 animate-spin' : 'hover:bg-white/10 text-sky-300'}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                      </button>
                    </div>
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
        © Windfu Oracle • Pure Snow Intelligence • {lang === 'zh' ? '睡午觉中' : 'Napping...'}
      </footer>
    </div>
  );
};

export default App;