import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Target, Zap, RotateCcw, Globe, Trophy, Send } from 'lucide-react';
import GameCanvas from './components/GameCanvas';
import Leaderboard from './components/Leaderboard';
import { GameStatus, Language, Difficulty } from './types';
import { TRANSLATIONS, WIN_SCORE } from './constants';

export default function App() {
  const [status, setStatus] = useState<GameStatus>(GameStatus.START);
  const [score, setScore] = useState(0);
  const [ammo, setAmmo] = useState<number[]>([55, 55, 55, 55, 55]);
  const [lang, setLang] = useState<Language>('en');
  const [level, setLevel] = useState(1);
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.SIMPLE);

  const t = TRANSLATIONS[lang];

  const handleScoreChange = useCallback((newScore: number) => {
    setScore(newScore);
  }, []);

  const handleStatusChange = useCallback((newStatus: GameStatus) => {
    setStatus(newStatus);
    if (newStatus === GameStatus.START) {
      setLevel(1);
      setSubmitted(false);
      setPlayerName('');
    }
  }, []);

  const handleAmmoChange = useCallback((newAmmo: number[]) => {
    setAmmo(newAmmo);
  }, []);

  const handleLevelChange = useCallback((newLevel: number) => {
    setLevel(newLevel);
  }, []);

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'zh' : 'en');
  };

  const submitScore = async () => {
    if (!playerName.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName, score }),
      });
      
      if (response.ok) {
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Failed to submit score:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono selection:bg-emerald-500/30">
      {/* Header / HUD */}
      <header className="fixed top-0 left-0 w-full p-4 flex justify-between items-center z-50 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase opacity-50">{t.level} / 关卡</span>
            <span className="text-lg font-bold text-emerald-500">{level}</span>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase opacity-50">{t.score} / 得分</span>
            <span className="text-2xl font-bold text-white tabular-nums">
              {score.toString().padStart(4, '0')}
              <span className="text-sm opacity-30 ml-1">/ {WIN_SCORE}</span>
            </span>
          </div>
          
          <button 
            onClick={toggleLang}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            title="Toggle Language"
          >
            <Globe className="w-5 h-5 opacity-70" />
          </button>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="relative w-full h-screen flex items-center justify-center pt-16">
        <GameCanvas 
          status={status}
          difficulty={difficulty}
          onScoreChange={handleScoreChange}
          onStatusChange={handleStatusChange}
          onAmmoChange={handleAmmoChange}
          onLevelChange={handleLevelChange}
        />

        {/* Overlays */}
        <AnimatePresence>
          {status !== GameStatus.PLAYING && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-md overflow-y-auto py-20"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="max-w-xl w-full p-8 rounded-2xl border border-white/10 bg-zinc-900/50 text-center shadow-2xl mx-4"
              >
                {status === GameStatus.START && (
                  <>
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Target className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h2 className="text-5xl font-display mb-2 tracking-widest uppercase text-emerald-500">
                      {TRANSLATIONS.en.title}
                      <br />
                      <span className="text-3xl font-artistic font-bold tracking-normal">{TRANSLATIONS.zh.title}</span>
                    </h2>
                    <p className="text-zinc-400 mb-8 text-sm leading-relaxed">
                      {TRANSLATIONS.en.instructions}
                      <br />
                      {TRANSLATIONS.zh.instructions}
                    </p>

                    <div className="mb-8">
                      <div className="text-[10px] uppercase opacity-50 mb-3 tracking-widest">{t.difficulty} / 难度</div>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: Difficulty.SIMPLE, labelEn: TRANSLATIONS.en.simple, labelZh: TRANSLATIONS.zh.simple, activeClass: 'bg-emerald-500/20 border-emerald-500 text-emerald-400' },
                          { id: Difficulty.MEDIUM, labelEn: TRANSLATIONS.en.medium, labelZh: TRANSLATIONS.zh.medium, activeClass: 'bg-yellow-500/20 border-yellow-500 text-yellow-400' },
                          { id: Difficulty.HARD, labelEn: TRANSLATIONS.en.hard, labelZh: TRANSLATIONS.zh.hard, activeClass: 'bg-red-500/20 border-red-500 text-red-400' }
                        ].map((d) => (
                          <button
                            key={d.id}
                            onClick={() => setDifficulty(d.id)}
                            className={`py-2 px-4 rounded-xl border text-[10px] font-bold transition-all flex flex-col items-center ${
                              difficulty === d.id 
                                ? d.activeClass
                                : 'bg-white/5 border-white/10 text-zinc-500 hover:bg-white/10'
                            }`}
                          >
                            <span>{d.labelEn}</span>
                            <span className="opacity-70">{d.labelZh}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={() => setStatus(GameStatus.PLAYING)}
                      className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all active:scale-95 flex flex-col items-center justify-center mb-8"
                    >
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        {TRANSLATIONS.en.start}
                      </div>
                      <div className="text-xs opacity-70">{TRANSLATIONS.zh.start}</div>
                    </button>
                    
                    <Leaderboard lang={lang} />
                  </>
                )}

                {(status === GameStatus.WON || status === GameStatus.LOST) && (
                  <>
                    <div className={`w-16 h-16 ${status === GameStatus.WON ? 'bg-emerald-500/20' : 'bg-red-500/20'} rounded-full flex items-center justify-center mx-auto mb-6`}>
                      {status === GameStatus.WON ? <Shield className="w-8 h-8 text-emerald-500" /> : <Target className="w-8 h-8 text-red-500" />}
                    </div>
                    <h2 className={`text-3xl font-bold mb-2 tracking-tight ${status === GameStatus.WON ? 'text-emerald-500' : 'text-red-500'}`}>
                      {status === GameStatus.WON ? t.win : t.loss}
                    </h2>
                    <p className="text-zinc-400 mb-8 text-sm">
                      {status === GameStatus.WON ? t.winMsg : t.lossMsg}
                    </p>
                    
                    <div className="mb-8 p-6 bg-white/5 rounded-2xl border border-white/10">
                      <div className="text-xs opacity-50 uppercase mb-1">{t.score}</div>
                      <div className="text-5xl font-bold mb-6">{score}</div>
                      
                      {!submitted ? (
                        <div className="flex flex-col gap-3">
                          <input 
                            type="text" 
                            placeholder={t.enterName}
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-center focus:outline-none focus:border-emerald-500/50 transition-colors"
                            maxLength={15}
                          />
                          <button 
                            onClick={submitScore}
                            disabled={!playerName.trim() || isSubmitting}
                            className="w-full py-3 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-all flex items-center justify-center gap-2"
                          >
                            {isSubmitting ? t.loading : (
                              <>
                                <Send className="w-4 h-4" />
                                {t.submit}
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="text-emerald-500 flex items-center justify-center gap-2 font-bold py-3">
                          <Trophy className="w-5 h-5" />
                          Score Submitted!
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => setStatus(GameStatus.START)}
                      className="w-full py-4 bg-white text-black font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-5 h-5" />
                      {t.restart}
                    </button>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer / Controls Info */}
      <footer className="fixed bottom-0 left-0 w-full p-6 flex justify-center gap-12 z-10 pointer-events-none">
        <div className="flex gap-8 bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/5">
          {ammo.map((count, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="text-[10px] opacity-30 uppercase mb-1">
                {i === 0 ? 'L' : i === 1 ? 'ML' : i === 2 ? 'M' : i === 3 ? 'MR' : 'R'}
              </div>
              <div className={`text-xl font-bold ${count === 0 ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>
                {count.toString().padStart(2, '0')}
              </div>
              <div className="w-12 h-1 bg-white/10 mt-2 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-emerald-500"
                  initial={false}
                  animate={{ width: `${(count / 55) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
