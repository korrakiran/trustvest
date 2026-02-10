import React, { useEffect, useState } from 'react';
import { Asset, UserProfile, AgentDebateResult } from '../types';
import { generateAgentDebate } from '../services/ai';
import { TrendingUp, ShieldAlert, BarChart3, CheckCircle, XCircle } from 'lucide-react';

interface Props {
  asset: Asset;
  amount: number;
  user: UserProfile;
  onProceed: () => void;
  onCancel: () => void;
}

const AgentDebate: React.FC<Props> = ({ asset, amount, user, onProceed, onCancel }) => {
  const [result, setResult] = useState<AgentDebateResult | null>(null);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(-1);

  useEffect(() => {
    const fetchDebate = async () => {
      const debate = await generateAgentDebate(asset, amount, user);
      setResult(debate);
    };
    fetchDebate();
  }, [asset, amount, user]);

  useEffect(() => {
    if (result && currentTurnIndex < result.turns.length) {
      const timer = setTimeout(() => {
        setCurrentTurnIndex(prev => prev + 1);
      }, 1500); // Delay between agents speaking
      return () => clearTimeout(timer);
    }
  }, [result, currentTurnIndex]);

  if (!result) {
    return (
      <div className="p-8 text-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h3 className="text-lg font-bold text-slate-800">Summoning AI Agents...</h3>
        <p className="text-slate-500 text-sm">The Council is reviewing your decision.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-xl font-bold text-center mb-6 text-slate-800">The Council's Debate</h2>
      
      <div className="space-y-4 mb-8">
        {result.turns.map((turn, idx) => {
          if (idx > currentTurnIndex) return null;
          
          let icon, bg, name;
          switch (turn.agent) {
            case 'Optimist':
              icon = <TrendingUp size={20} className="text-emerald-600" />;
              bg = 'bg-emerald-50 border-emerald-100';
              name = 'The Optimist';
              break;
            case 'Risk':
              icon = <ShieldAlert size={20} className="text-red-600" />;
              bg = 'bg-red-50 border-red-100';
              name = 'Risk Guardian';
              break;
            case 'Data':
              icon = <BarChart3 size={20} className="text-blue-600" />;
              bg = 'bg-blue-50 border-blue-100';
              name = 'Data Analyst';
              break;
          }

          return (
            <div key={idx} className={`flex items-start gap-3 animate-fade-in`}>
              <div className={`p-2 rounded-full bg-white shadow-sm border border-slate-100 shrink-0 z-10`}>
                {icon}
              </div>
              <div className={`p-3 rounded-2xl rounded-tl-none border ${bg} flex-1`}>
                <div className="text-xs font-bold mb-1 opacity-70 uppercase tracking-wider">{name}</div>
                <p className="text-sm text-slate-800 leading-relaxed">{turn.message}</p>
              </div>
            </div>
          );
        })}
      </div>

      {currentTurnIndex >= result.turns.length && (
        <div className="animate-fade-in border-t border-slate-100 pt-6">
          <div className="bg-slate-900 text-white p-4 rounded-xl mb-6">
            <h3 className="font-bold text-yellow-400 text-xs uppercase mb-2 tracking-widest">Final Verdict</h3>
            <p className="font-medium text-lg leading-snug">"{result.conclusion}"</p>
          </div>
          
          <div className="flex gap-3">
             <button 
                onClick={onCancel}
                className="flex-1 py-3 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
             >
                <XCircle size={20} />
                <span>Reconsider</span>
             </button>
             <button 
                onClick={onProceed}
                className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2 ${
                    result.verdict === 'WAIT' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
             >
                <CheckCircle size={20} />
                <span>{result.verdict === 'WAIT' ? 'Proceed Anyway' : 'Confirm Investment'}</span>
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentDebate;
