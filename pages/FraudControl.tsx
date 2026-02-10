import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getFraudSignals, getUser, withdraw } from '../services/mockBackend';
import { FraudSignal, UserProfile } from '../types';
import { AlertOctagon, RefreshCw, Smartphone, Clock, DollarSign } from 'lucide-react';

const FraudControl: React.FC = () => {
  const [signals, setSignals] = useState<FraudSignal[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [withdrawMsg, setWithdrawMsg] = useState('');

  const refreshData = () => {
    setSignals([...getFraudSignals()]);
    setUser(getUser());
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateWithdrawal = async () => {
    // This attempts a withdrawal to trigger "Rapid Withdrawal" fraud rule if done quickly after investment
    const success = await withdraw(withdrawAmount || 100);
    if (!success) {
      setWithdrawMsg("Blocked by Fraud Engine! Check signals below.");
    } else {
      setWithdrawMsg("Withdrawal processed (Safe).");
    }
    refreshData();
  };

  if (!user) return <div className="p-8">Loading...</div>;

  return (
    <Layout>
       <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Fraud Detection Engine (Demo)</h1>
          <button onClick={refreshData} className="p-2 bg-slate-200 rounded-full hover:bg-slate-300">
             <RefreshCw size={20} />
          </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg">
             <h2 className="text-lg font-semibold mb-2 text-slate-400">Current Risk Score</h2>
             <div className="flex items-baseline space-x-2">
                <span className={`text-5xl font-bold ${user.riskScore > 50 ? 'text-red-500' : 'text-emerald-400'}`}>
                   {user.riskScore}
                </span>
                <span className="text-slate-500">/ 100</span>
             </div>
             <p className="text-sm mt-4 text-slate-400">
                Score increases based on suspicious patterns (e.g., rapid withdrawals, odd login times).
             </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <h2 className="text-lg font-bold mb-4">Simulate Suspicious Actions</h2>
             <div className="space-y-4">
                <div className="flex items-center gap-4">
                   <button 
                     onClick={handleSimulateWithdrawal}
                     className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-semibold flex items-center gap-2"
                   >
                      <DollarSign size={16} />
                      Rapid Withdrawal
                   </button>
                   <span className="text-xs text-slate-500">Try immediately after investing.</span>
                </div>
                {withdrawMsg && <p className="text-xs font-bold text-red-600">{withdrawMsg}</p>}
                
                <div className="p-3 bg-slate-50 rounded text-xs text-slate-500">
                   Note: Other signals like "Odd Hours" are checked automatically during login.
                </div>
             </div>
          </div>
       </div>

       <h3 className="font-bold text-lg mb-4 text-slate-800">Detected Signals Log</h3>
       <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {signals.length === 0 ? (
             <div className="p-8 text-center text-slate-400">
                <AlertOctagon size={48} className="mx-auto mb-2 opacity-20" />
                <p>No suspicious activity detected yet.</p>
             </div>
          ) : (
             <div className="divide-y divide-slate-100">
                {signals.map((signal) => (
                   <div key={signal.id} className="p-4 flex items-start space-x-4">
                      <div className={`mt-1 p-2 rounded-lg ${signal.severity === 'CRITICAL' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                         {signal.type === 'DEVICE_CHANGE' && <Smartphone size={18} />}
                         {signal.type === 'ODD_HOURS' && <Clock size={18} />}
                         {signal.type === 'RAPID_WITHDRAWAL' && <DollarSign size={18} />}
                         {signal.type === 'HIGH_VALUE_TRANSFER' && <AlertOctagon size={18} />}
                      </div>
                      <div>
                         <div className="flex items-center space-x-2">
                            <h4 className="font-bold text-sm text-slate-800">{signal.type.replace('_', ' ')}</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-mono">
                               {new Date(signal.timestamp).toLocaleTimeString()}
                            </span>
                         </div>
                         <p className="text-sm text-slate-600 mt-1">{signal.description}</p>
                      </div>
                   </div>
                ))}
             </div>
          )}
       </div>
    </Layout>
  );
};

export default FraudControl;