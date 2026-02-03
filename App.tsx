import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AppState, OracleResponse, Language } from './types';
import { consultOracle, connectLive, createBlob, decode, decodeAudioData, generateYetiSound, readTextAloud, translateOracleResponse } from './services/geminiService';
import { windSound } from './services/audioService';
import Talisman from './components/Talisman';

const TRANSLATIONS: Record<Language, any> = {
  en: {
    title: "Windfu Oracle",
    subtitle: "Your Sleepy Snow Friend • Cozy Blessings",
    intro: "Windfu just woke up from a nap! Tell him what's on your mind and he'll give you a serious blessing.",
    placeholder: "Ask sleepy Windfu... (e.g. Will I have a lucky day?)",
    button: "ASK WINDFU!",
    loading: "Windfu is waking up... (yawn)",
    translating: "Translating... (yawn)",
    interpretationLabel: "Windfu's Message",
    adviceLabel: "A Warm Hug",
    another: "ASK AGAIN!",
    errorPrefix: "Brrr! Error: ",
    retry: "TRY AGAIN",
    voiceBtnIdle: "Voice Input",
    voiceBtnActive: "Listening...",
    voiceError: "Microphone error.",
    listenBtn: "Listen"
  },
  zh: {
    title: "雪怪風符",
    subtitle: "刚睡醒的毛茸茸好友 • 溫暖祝福",
    intro: "風符剛睡醒哦，揉揉眼睛正在聽呢！告訴他你的心事，他會给你一个认真的雪山祝福。",
    placeholder: "問問睡眼惺忪的風符吧...（例如：今天会有好运吗？）",
    button: "召喚風符！",
    loading: "風符清醒中... (打呵欠)",
    translating: "翻譯中... (打呵欠)",
    interpretationLabel: "風符的話",
    adviceLabel: "暖心建議",
    another: "再問一次！",
    errorPrefix: "哎呀！出錯了：",
    retry: "重試",
    voiceBtnIdle: "語音輸入",
    voiceBtnActive: "聆聽中...",
    voiceError: "麦克风不可用。",
    listenBtn: "聆聽"
  },
  sv: {
    title: "Windfu Orakel",
    subtitle: "Din Sömniga Snövän • Mysiga Välsignelser",
    intro: "Windfu har precis vaknat! Berätta vad du funderar på så ger han dig en snöig välsignelse.",
    placeholder: "Fråga den sömniga Windfu...",
    button: "FRÅGA WINDFU!",
    loading: "Windfu vaknar... (gäspar)",
    translating: "Översätter... (gäspar)",
    interpretationLabel: "Windfus Budskap",
    adviceLabel: "En Varm Kram",
    another: "FRÅGA IGEN!",
    errorPrefix: "Brrr! Fel: ",
    retry: "FÖRSÖK IGEN",
    voiceBtnIdle: "Röstinmatning",
    voiceBtnActive: "Lyssnar...",
    voiceError: "Mikrofonfel.",
    listenBtn: "Lyssna"
  }
};

const YetiMascot = ({ isListening, isSpeaking }: { isListening?: boolean, isSpeaking?: boolean }) => (
  <div className={`relative w-32 h-32 mb-6 transition-all duration-500 ${isListening || isSpeaking ? 'scale-110' : ''}`}>
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

const BlossomCluster = ({ x, y, size = 1, petals = 5, color = "#f472b6" }: { x: number, y: number, size?: number, petals?: number, color?: string }) => {
  const pCount = Math.max(1, Math.min(5, petals));
  return (
    <g transform={`translate(${x},${y}) scale(${size})`}>
      {pCount === 5 && (
        <g>
          <circle cx="0" cy="-3.5" r="3" fill={color} />
          <circle cx="3.5" cy="-1" r="3" fill={color} />
          <circle cx="2" cy="3" r="3" fill={color} />
          <circle cx="-2" cy="3" r="3" fill={color} />
          <circle cx="-3.5" cy="-1" r="3" fill={color} />
        </g>
      )}
      {pCount === 3 && (
        <g>
          <circle cx="0" cy="-2.5" r="3" fill={color} />
          <circle cx="2.5" cy="2" r="3" fill={color} />
          <circle cx="-2.5" cy="2" r="3" fill={color} />
        </g>
      )}
      {pCount === 1 && <circle cx="0" cy="0" r="3.2" fill={color} />}
      <circle cx="0" cy="0" r="1.2" fill="#fef08a" opacity="0.6" />
      <circle cx="0" cy="-2" r="1.8" fill="white" opacity="0.8" />
    </g>
  );
};

const PlumBlossoms = () => (
  <div className="fixed inset-0 pointer-events-none z-[100]">
    <div className="absolute left-[-20px] top-[14%] w-[340px] h-[260px] opacity-95">
      <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl">
        <path d="M0 100 Q25 90 55 105 T95 90 T135 98" stroke="#2D1B0F" strokeWidth="7.5" strokeLinecap="round" />
        <path d="M55 105 Q75 82 92 78" stroke="#2D1B0F" strokeWidth="3.8" strokeLinecap="round" />
        <circle cx="30" cy="95" r="2.2" fill="white" opacity="0.7" />
        <circle cx="85" cy="98" r="1.8" fill="white" opacity="0.7" />
        <circle cx="120" cy="92" r="1.4" fill="white" opacity="0.7" />
        <BlossomCluster x={92} y={78} petals={5} size={1.2} />
        <BlossomCluster x={135} y={98} petals={3} size={1.05} />
        <BlossomCluster x={110} y={92} petals={1} size={0.85} />
        <BlossomCluster x={55} y={105} petals={3} size={1.1} />
        <BlossomCluster x={25} y={96} petals={5} size={0.95} color="#ec4899" />
      </svg>
    </div>
    <div className="absolute right-[-10px] bottom-[20%] w-[280px] h-[220px] opacity-90 scale-x-[-1]">
      <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl">
        <path d="M0 80 Q30 95 60 70 T120 85" stroke="#2D1B0F" strokeWidth="6" strokeLinecap="round" />
        <path d="M60 70 Q80 40 95 30" stroke="#2D1B0F" strokeWidth="3" strokeLinecap="round" />
        <circle cx="25" cy="85" r="2" fill="white" opacity="0.6" />
        <circle cx="70" cy="72" r="1.5" fill="white" opacity="0.6" />
        <BlossomCluster x={95} y={30} petals={5} size={1} />
        <BlossomCluster x={120} y={85} petals={3} size={0.9} />
        <BlossomCluster x={50} y={78} petals={1} size={0.8} color="#ec4899" />
        <BlossomCluster x={75} y={50} petals={3} size={0.85} />
      </svg>
    </div>
  </div>
);

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('zh');
  const [question, setQuestion] = useState('');
  const [status, setStatus] = useState<AppState>(AppState.IDLE);
  const [result, setResult] = useState<OracleResponse | null>(null);
  const [bgVolume, setBgVolume] = useState(0.4);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isYetiSpeaking, setIsYetiSpeaking] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const t = useMemo(() => TRANSLATIONS[lang], [lang]);

  const sessionRef = useRef<any>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: (e.clientX / window.innerWidth - 0.5) * 2, y: (e.clientY / window.innerHeight - 0.5) * 2 });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Sync background wind volume
  useEffect(() => {
    windSound.setVolume(bgVolume);
  }, [bgVolume]);

  const initAudioSystems = useCallback(async () => {
    if (!outputAudioContextRef.current) {
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (outputAudioContextRef.current.state === 'suspended') {
      await outputAudioContextRef.current.resume();
    }
    await windSound.start();
    await windSound.setVolume(bgVolume);
  }, [bgVolume]);

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
      setIsYetiSpeaking(false);
    }
  };

  const handleReadAloud = async (text: string, id: string) => {
    if (isYetiSpeaking || isAudioLoading) return;
    setIsAudioLoading(id);
    try {
      await initAudioSystems();
      const audioData = await readTextAloud(text);
      if (audioData && outputAudioContextRef.current) {
        playBase64Audio(audioData, outputAudioContextRef.current);
      }
    } finally {
      setIsAudioLoading(null);
    }
  };

  useEffect(() => {
    if (status === AppState.REVEALED && result && !isTranslating) {
      const performTranslation = async () => {
        setIsTranslating(true);
        try {
          const translated = await translateOracleResponse(result, lang);
          setResult(translated);
        } finally {
          setIsTranslating(false);
        }
      };
      performTranslation();
    }
  }, [lang]);

  const stopVoiceMode = useCallback(() => {
    if (sessionRef.current) { sessionRef.current.close(); sessionRef.current = null; }
    setIsVoiceActive(false);
    setIsYetiSpeaking(false);
  }, []);

  const toggleVoiceMode = async () => {
    if (isVoiceActive) { stopVoiceMode(); return; }
    try {
      await initAudioSystems();
      setIsVoiceActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const sessionPromise = connectLive(lang, {
        onTranscription: (text) => setQuestion(prev => (text.trim() ? prev + ' ' + text.trim() : prev)),
        onMessage: async (m) => {
          const b = m.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (b && outputAudioContextRef.current) playBase64Audio(b, outputAudioContextRef.current);
        },
        onError: () => stopVoiceMode(),
        onClose: () => stopVoiceMode(),
      });
      sessionRef.current = await sessionPromise;
      const source = inputCtx.createMediaStreamSource(stream);
      const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessor.onaudioprocess = (e) => {
        if (sessionRef.current) sessionRef.current.sendRealtimeInput({ media: createBlob(e.inputBuffer.getChannelData(0)) });
      };
      source.connect(scriptProcessor);
      scriptProcessor.connect(inputCtx.destination);
    } catch (err) {
      setIsVoiceActive(false);
    }
  };

  const handleConsult = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!question.trim()) return;
    if (isVoiceActive) stopVoiceMode();
    setStatus(AppState.CONSULTING);
    try {
      await initAudioSystems();
      const [soundData, oracleData] = await Promise.all([generateYetiSound(), consultOracle(question, lang)]);
      if (soundData && outputAudioContextRef.current) playBase64Audio(soundData, outputAudioContextRef.current);
      setResult(oracleData);
      setStatus(AppState.REVEALED);
    } catch (err) {
      setStatus(AppState.ERROR);
    }
  }, [question, lang, isVoiceActive, stopVoiceMode, initAudioSystems]);

  const reset = useCallback(() => {
    setStatus(AppState.IDLE);
    setQuestion('');
    setResult(null);
    stopVoiceMode();
  }, [stopVoiceMode]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative bg-[#010409] overflow-hidden" onClick={() => { initAudioSystems(); if(isControlsOpen) setIsControlsOpen(false); }}>
      <div className="aurora-container">
        <div className="aurora-layer aurora-1"></div>
        <div className="aurora-layer aurora-2"></div>
        <div className="aurora-layer aurora-3"></div>
        <div className="aurora-layer aurora-4"></div>
      </div>

      <div className="fixed bottom-0 left-0 w-full h-[60vh] z-[2] opacity-35 pointer-events-none transition-transform duration-500 ease-out"
           style={{ transform: `translate(${mousePos.x * -12}px, ${mousePos.y * -6}px)` }}>
        <svg className="w-full h-full" viewBox="0 0 1000 400" preserveAspectRatio="none">
          <path d="M0 400 L180 140 L350 320 L550 90 L800 340 L1000 400 Z" fill="#1e293b" />
          <path d="M220 400 L480 220 L680 370 L920 130 L1000 400 Z" fill="#0f172a" opacity="0.85" />
          <path d="M180 140 L210 185 L150 185 Z" fill="white" opacity="0.1" />
          <path d="M550 90 L590 155 L510 155 Z" fill="white" opacity="0.1" />
        </svg>
      </div>

      <div className="absolute inset-0 pointer-events-none z-50">
        {[...Array(70)].map((_, i) => (
          <div key={i} className={`snowflake ${i % 3 === 0 ? 'blur' : i % 6 === 0 ? 'small' : ''}`}
               style={{
                 left: `${Math.random() * 100}%`,
                 width: `${Math.random() * (i % 3 === 0 ? 12 : 5) + 2}px`,
                 height: `${Math.random() * (i % 3 === 0 ? 12 : 5) + 2}px`,
                 animationDuration: `${Math.random() * 9 + 7}s`,
                 animationDelay: `${Math.random() * 20}s`,
                 top: '-30px'
               }} />
        ))}
      </div>

      <PlumBlossoms />

      <div className="fixed top-6 right-6 z-[120] flex flex-col items-end">
        {/* The Collapsible Control Panel */}
        <div 
          className={`flex items-center bg-white/10 backdrop-blur-3xl rounded-[2.5rem] border border-white/20 shadow-2xl transition-all duration-500 ease-in-out overflow-hidden ${isControlsOpen ? 'max-w-[500px] p-3' : 'max-w-[64px] p-2'}`} 
          onClick={e => { e.stopPropagation(); setIsControlsOpen(!isControlsOpen); }}
        >
          {/* Settings Trigger Icon (Always Visible) */}
          <div className={`p-3 rounded-full transition-all duration-500 ${!isControlsOpen ? 'bg-cyan-500/10 text-cyan-400 cursor-pointer' : 'text-white/40 rotate-90'}`}>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>

          {/* Hidden Content (Revealed on Open) */}
          <div 
            className={`flex items-center gap-4 transition-all duration-500 ${isControlsOpen ? 'opacity-100 translate-x-0 ml-1' : 'opacity-0 translate-x-10 pointer-events-none'}`}
            onClick={e => e.stopPropagation()} // Prevent closing panel when interacting with sliders/buttons
          >
            {/* Volume Control */}
            <div className="flex items-center gap-3 px-3 border-r border-white/10 group">
              <button onClick={() => setBgVolume(bgVolume > 0 ? 0 : 0.4)} className="text-cyan-400/70 hover:text-cyan-400 transition-colors">
                {bgVolume === 0 ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                )}
              </button>
              <input 
                type="range" min="0" max="1" step="0.01" value={bgVolume} 
                onChange={(e) => setBgVolume(parseFloat(e.target.value))}
                className="w-16 md:w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Lang Selector */}
            <div className="flex gap-1 pr-2">
              {(['en', 'zh', 'sv'] as Language[]).map((l) => (
                <button key={l} 
                  onClick={() => { setLang(l); setIsControlsOpen(false); }} 
                  disabled={isTranslating}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${lang === l ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'text-cyan-200/50 hover:text-cyan-200'} ${isTranslating ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <header className="mb-12 text-center relative z-[10] flex flex-col items-center">
        <YetiMascot isListening={isVoiceActive} isSpeaking={isYetiSpeaking} />
        <h1 className="text-5xl md:text-7xl font-extrabold mb-3 tracking-tighter text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]">
          {t.title}
        </h1>
        <p className="text-cyan-400 font-bold tracking-[0.3em] text-xs uppercase opacity-90">{t.subtitle}</p>
      </header>

      <main className="w-full max-w-4xl relative z-[10]">
        {status === AppState.IDLE && (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-1000">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-[40px] mb-12 max-w-lg text-center shadow-2xl">
              <p className="text-cyan-50 text-xl font-medium leading-relaxed drop-shadow-sm">{t.intro}</p>
            </div>
            <form onSubmit={handleConsult} className="w-full max-w-lg space-y-6">
              <div className="relative group">
                <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={t.placeholder}
                  className="w-full bg-slate-900/40 backdrop-blur-xl border-2 border-white/5 rounded-[40px] p-10 pb-20 text-white focus:outline-none focus:border-cyan-400/50 min-h-[250px] text-2xl resize-none placeholder-white/20 shadow-2xl transition-all group-hover:bg-slate-900/60" />
                <button type="button" onClick={toggleVoiceMode}
                  className={`absolute bottom-8 right-8 p-6 rounded-full transition-all flex items-center gap-3 ${isVoiceActive ? 'bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.6)] animate-pulse' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-400/20 hover:bg-cyan-500/30'}`}>
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m8 0h-4m-4-8a3 3 0 013-3h2a3 3 0 013 3v5a3 3 0 01-3 3h-2a3 3 0 01-3-3V7z" /></svg>
                  {isVoiceActive && <span className="text-xs font-black uppercase tracking-widest">{t.voiceBtnActive}</span>}
                </button>
              </div>
              <button type="submit" disabled={!question.trim()}
                className="w-full py-6 bg-cyan-500 text-white rounded-full text-2xl font-black tracking-tight hover:bg-cyan-400 hover:scale-[1.03] active:scale-[0.97] transition-all disabled:opacity-10 shadow-[0_20px_40px_rgba(6,182,212,0.5)]">
                {t.button}
              </button>
            </form>
          </div>
        )}

        {status === AppState.CONSULTING && (
          <div className="flex flex-col items-center justify-center py-32 space-y-10">
             <div className="relative">
                <div className="w-36 h-36 border-[12px] border-cyan-400/10 border-t-cyan-400 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-6xl drop-shadow-xl">💤</div>
             </div>
            <p className="text-cyan-300 font-black tracking-[0.3em] text-xl uppercase animate-pulse">{t.loading}</p>
          </div>
        )}

        {status === AppState.REVEALED && result && (
          <div className="grid md:grid-cols-2 gap-16 items-center relative animate-in fade-in slide-in-from-bottom-12 duration-1000">
            {isTranslating && (
              <div className="absolute inset-0 z-[120] bg-slate-950/70 backdrop-blur-md flex flex-col items-center justify-center rounded-[60px]">
                <div className="w-16 h-16 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin mb-6"></div>
                <p className="text-cyan-300 font-black tracking-widest uppercase">{t.translating}</p>
              </div>
            )}
            <Talisman data={result} />
            <div className="space-y-8">
              <div className="bg-white/5 backdrop-blur-3xl border border-white/10 p-10 rounded-[50px] shadow-2xl">
                <section className="mb-10">
                    <div className="flex items-center gap-4 mb-4">
                      <h3 className="text-cyan-400 text-xs font-black uppercase tracking-[0.4em]">{t.interpretationLabel}</h3>
                      <button onClick={() => handleReadAloud(result.interpretation, 'int')} disabled={isYetiSpeaking || !!isAudioLoading || isTranslating}
                        className={`p-3 rounded-full transition-all ${isAudioLoading === 'int' ? 'animate-spin' : 'hover:bg-white/10 text-cyan-400'}`}>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                      </button>
                    </div>
                    <p className="text-white text-3xl leading-snug font-bold drop-shadow-md">{result.interpretation}</p>
                </section>
                <section className="p-8 bg-cyan-400/5 rounded-[40px] border border-cyan-400/10 shadow-inner">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-cyan-300 text-xs font-black uppercase tracking-[0.4em]">{t.adviceLabel}</h3>
                      <button onClick={() => handleReadAloud(result.advice, 'adv')} disabled={isYetiSpeaking || !!isAudioLoading || isTranslating}
                        className={`p-2.5 rounded-full transition-all ${isAudioLoading === 'adv' ? 'animate-spin' : 'hover:bg-white/10 text-cyan-300'}`}>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                      </button>
                    </div>
                    <p className="text-cyan-50 italic text-xl font-medium leading-relaxed opacity-90">"{result.advice}"</p>
                </section>
              </div>
              <button onClick={reset} className="w-full py-5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full font-black tracking-[0.2em] text-xs transition-all uppercase">
                {t.another}
              </button>
            </div>
          </div>
        )}

        {status === AppState.ERROR && (
          <div className="text-center py-24 bg-red-500/10 rounded-[60px] border border-red-500/20 p-12 shadow-2xl">
            <p className="text-red-400 mb-10 font-black text-2xl uppercase tracking-[0.2em]">{t.errorPrefix}</p>
            <button onClick={reset} className="px-12 py-5 bg-red-500 text-white rounded-full font-black uppercase tracking-widest hover:bg-red-400 shadow-xl transition-all">{t.retry}</button>
          </div>
        )}
      </main>

      <footer className="mt-24 text-cyan-200/10 text-[9px] font-black tracking-[0.8em] uppercase text-center relative z-[10]">
        © Windfu Oracle • Pure Snow Intelligence • {lang === 'zh' ? '睡午觉中' : 'DREAMING...'}
      </footer>
    </div>
  );
};

export default App;