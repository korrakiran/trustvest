import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import Layout from '../components/Layout';
import { updateEmotionalScore, getUser } from '../services/mockBackend';
import { AlertTriangle, TrendingUp, TrendingDown, Play, RotateCcw, BrainCircuit, Newspaper, Radio, Megaphone } from 'lucide-react';
import { UserProfile } from '../types';

// Mock Data representing a crash (e.g. 2008 style)
const CRASH_DATA = Array.from({ length: 45 }, (_, i) => {
    // Simulated market curve: Rise -> Crash -> Volatility -> Slow Recovery
    const val = 100 + Math.sin(i * 0.5) * 10 - (i > 15 ? (i - 15) * 6 : 0) + (i > 30 ? (i - 30) * 9 : 0);
    return { day: i, value: Math.max(20, val + Math.random() * 5) };
});

const EVENTS: Record<number, string> = {
  5: "📈 BULL RUN: Tech stocks reach all-time highs. Optimism is everywhere.",
  14: "⚠️ RUMORS: Major investment bank reports severe liquidity issues.",
  16: "🚨 CRASH: Lehman-style collapse! Panic selling begins across global markets.",
  22: "📉 MARKET BLEEDING: Global sell-off continues. Circuit breakers triggered.",
  28: "🏛️ GOVT INTERVENTION: Emergency bailout package announced by Central Bank.",
  36: "🌱 RECOVERY: Early signs of stabilization detected. Smart money is buying."
};

const INITIAL_BALANCE = 10000;

const Simulator: React.FC = () => {
  const [day, setDay] = useState(0);
  const [data, setData] = useState<{day: number, value: number}[]>([]);
  const [balance, setBalance] = useState(INITIAL_BALANCE); // Virtual Money
  const [holdings, setHoldings] = useState(0); // Units held
  const [isPlaying, setIsPlaying] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [currentEvent, setCurrentEvent] = useState<string>("Ready to start simulation...");
  const [newsLog, setNewsLog] = useState<{day: number, text: string}[]>([]);
  
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    setUser(getUser());
    resetSim();
  }, []);

  const resetSim = () => {
    setDay(0);
    setData([CRASH_DATA[0]]);
    setBalance(INITIAL_BALANCE);
    setHoldings(0);
    setIsPlaying(false);
    setAiMessage(null);
    setCurrentEvent("Waiting for market open...");
    setNewsLog([]);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleNextDay = () => {
    if (day >= CRASH_DATA.length - 1) {
      setIsPlaying(false);
      return;
    }
    const nextDay = day + 1;
    setDay(nextDay);
    setData(prev => [...prev, CRASH_DATA[nextDay]]);
    
    // Check for events
    if (EVENTS[nextDay]) {
        setCurrentEvent(EVENTS[nextDay]);
        setNewsLog(prev => [{ day: nextDay, text: EVENTS[nextDay] }, ...prev]);
    }

    // AI Intervention Logic
    const currentPrice = CRASH_DATA[nextDay].value;
    const prevPrice = CRASH_DATA[nextDay - 1].value;
    const drop = ((prevPrice - currentPrice) / prevPrice) * 100;
    
    if (drop > 12 && holdings > 0) {
        setIsPlaying(false);
        setAiMessage("🛑 Market Crash Detected! Fear is at peak levels. Many investors panic sell here. If you sell now, you lock in losses forever. Historically, markets recover. What will you do?");
    }
  };

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = window.setInterval(handleNextDay, 1000); 
    } else {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) window.clearInterval(intervalRef.current); };
  }, [isPlaying, day]);

  const buy = () => {
    const price = CRASH_DATA[day].value;
    if (balance >= price) {
        setHoldings(prev => prev + 10); // Buy in batches of 10 for larger balance
        setBalance(prev => prev - (price * 10));
    }
  };

  const sell = () => {
    if (holdings > 0) {
       const price = CRASH_DATA[day].value;
       const sellAmount = Math.min(holdings, 10);
       
       // Check if selling at bottom (simplified logic: price < 60% of start)
       if (price < 60) {
           updateEmotionalScore(-10); // Penalty for panic selling
           setAiMessage("📉 You sold at the bottom! This is a classic emotional mistake. Your Emotional Score has dropped.");
       } else {
           updateEmotionalScore(2);
       }
       setHoldings(prev => prev - sellAmount);
       setBalance(prev => prev + (price * sellAmount));
    }
  };

  const currentPrice = CRASH_DATA[day]?.value || 0;
  const portfolioValue = balance + (holdings * currentPrice);
  const pnl = portfolioValue - INITIAL_BALANCE;
  const pnlPercent = (pnl / INITIAL_BALANCE) * 100;

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">Crash Simulator 🎮</h1>
           <p className="text-slate-500">Train your nerves with virtual money.</p>
        </div>
        <button onClick={resetSim} className="p-2 bg-slate-200 hover:bg-slate-300 rounded-full">
            <RotateCcw size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Simulator Area */}
          <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden flex flex-col shadow-2xl border border-slate-700">
                  
                  {/* Highlighted Breaking News Ticker */}
                  <div className={`p-4 rounded-xl mb-6 flex items-center gap-4 border transition-all duration-300 ${isPlaying ? 'bg-red-900/40 border-red-500/50 animate-pulse' : 'bg-slate-800 border-slate-700'}`}>
                        <div className="flex flex-col items-center justify-center bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest leading-none">
                            <span>Live</span>
                            <span className="text-[8px] opacity-80">News</span>
                        </div>
                        <div className="flex-1">
                            <span className="font-mono text-sm md:text-base text-white font-bold tracking-tight">{currentEvent}</span>
                        </div>
                        <Radio className={`text-red-500 ${isPlaying ? 'animate-ping' : ''}`} size={16} />
                  </div>

                  {/* Stats Header */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 z-10 relative bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                      <div>
                          <div className="text-slate-400 text-xs uppercase font-bold">Market Price</div>
                          <div className="text-xl md:text-2xl font-mono">₹{currentPrice.toFixed(2)}</div>
                      </div>
                      <div>
                          <div className="text-slate-400 text-xs uppercase font-bold">Your Balance</div>
                          <div className="text-xl md:text-2xl font-mono">₹{balance.toLocaleString()}</div>
                      </div>
                      <div>
                          <div className="text-slate-400 text-xs uppercase font-bold">Holdings</div>
                          <div className="text-xl md:text-2xl font-mono">{holdings}</div>
                      </div>
                      <div>
                          <div className="text-slate-400 text-xs uppercase font-bold">Total P&L</div>
                          <div className={`text-xl md:text-2xl font-mono ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                          </div>
                      </div>
                  </div>

                  {/* Chart */}
                  <div className="h-[350px] w-full bg-slate-800/30 rounded-xl mb-6 border border-slate-700 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <YAxis domain={[0, 150]} hide />
                            <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} isAnimationActive={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                  </div>

                  {/* Controls */}
                  <div className="flex gap-4 justify-center">
                      <button 
                          onClick={buy} disabled={balance < currentPrice * 10 || day === CRASH_DATA.length -1}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-900/20"
                      >
                          <TrendingUp size={20} /> BUY (10x)
                      </button>
                      <button 
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="bg-slate-700 hover:bg-slate-600 text-white w-14 h-12 rounded-xl flex items-center justify-center transition-all hover:scale-105 border border-slate-600"
                      >
                          <Play size={24} fill="currentColor" className={isPlaying ? "hidden" : ""} />
                          <span className={!isPlaying ? "hidden" : "font-black text-xs"}>PAUSE</span>
                      </button>
                      <button 
                          onClick={sell} disabled={holdings === 0 || day === CRASH_DATA.length -1}
                          className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-900/20"
                      >
                          <TrendingDown size={20} /> SELL (10x)
                      </button>
                  </div>

                  {/* AI Overlay */}
                  {aiMessage && (
                      <div className="absolute inset-0 bg-slate-900/95 flex items-center justify-center p-6 z-20 animate-fade-in backdrop-blur-sm">
                          <div className="bg-slate-800 border border-slate-600 p-8 rounded-2xl max-w-md text-center shadow-2xl">
                              <div className="inline-block p-3 bg-amber-500/20 rounded-full mb-4">
                                  <BrainCircuit size={48} className="text-amber-400" />
                              </div>
                              <h3 className="text-2xl font-bold text-white mb-2">Financial Twin Intervention</h3>
                              <p className="text-slate-300 mb-8 text-lg leading-relaxed">{aiMessage}</p>
                              <button 
                                  onClick={() => { setAiMessage(null); setIsPlaying(true); }}
                                  className="w-full bg-white text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                              >
                                  I Understand, Resume
                              </button>
                          </div>
                      </div>
                  )}
              </div>
          </div>

          {/* Market News Feed Sidebar */}
          <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col overflow-hidden max-h-[700px]">
                  <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <Newspaper size={18} className="text-slate-500"/> Market Feed
                      </h3>
                      <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Live</span>
                  </div>
                  
                  <div className="p-4 overflow-y-auto flex-1 space-y-4 bg-slate-50/50">
                      {newsLog.length === 0 ? (
                          <div className="text-center py-10 text-slate-400">
                              <Megaphone size={32} className="mx-auto mb-2 opacity-20" />
                              <p className="text-sm">Market is quiet.<br/>Waiting for news...</p>
                          </div>
                      ) : (
                          newsLog.map((log, idx) => (
                              <div key={idx} className="relative pl-6 pb-2 animate-fade-in-up">
                                  {/* Timeline dot */}
                                  <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-white border-2 border-slate-300 z-10"></div>
                                  {/* Connector line */}
                                  {idx !== newsLog.length - 1 && (
                                      <div className="absolute left-[5px] top-4 bottom-[-16px] w-[2px] bg-slate-200"></div>
                                  )}
                                  
                                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
                                      <div className="flex justify-between items-center mb-1">
                                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Day {log.day}</span>
                                          {idx === 0 && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 rounded font-bold">NEW</span>}
                                      </div>
                                      <p className="text-sm text-slate-700 font-medium leading-snug">{log.text}</p>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
                  
                  <div className="p-4 border-t border-slate-100 bg-white">
                      <div className="text-xs text-slate-400">
                          <p><strong>Tip:</strong> Markets react to news. Watch the feed to anticipate drops.</p>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <div className="mt-6 bg-white p-6 rounded-xl border border-slate-200">
         <h3 className="font-bold text-lg mb-2">Why this matters?</h3>
         <p className="text-slate-600 text-sm">
            Most investors lose money not because of the asset, but because they panic when the line goes down. 
            This simulator trains your <strong>Emotional Score</strong>. Can you hold through the dip?
         </p>
      </div>
    </Layout>
  );
};

export default Simulator;
