import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAssets, invest, getUser } from '../services/mockBackend';
import { Asset, UserProfile, RiskLevel } from '../types';
import Layout from '../components/Layout';
import RiskLabel from '../components/RiskLabel';
import AgentDebate from '../components/AgentDebate';
import { CheckCircle, AlertTriangle, Lock } from 'lucide-react';

const Invest: React.FC = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [amount, setAmount] = useState<number>(100);
  const [isRecurring, setIsRecurring] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showDebate, setShowDebate] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      navigate('/');
      return;
    }
    setUser(u);
    getAssets().then(setAssets);
  }, [navigate]);

  const handleInvestClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setAmount(asset.minInvestment);
    setMessage(null);
    setShowDebate(false);
  };

  const handleInitialConfirm = () => {
    // Instead of investing immediately, trigger the Agent Debate
    setShowDebate(true);
  };

  const executeInvestment = async () => {
    if (!selectedAsset) return;
    setLoading(true);
    setShowDebate(false); // Hide modal content, show loading
    
    // Simulate API call
    const success = await invest(selectedAsset.id, amount, isRecurring);
    
    setLoading(false);
    if (success) {
      setMessage({ type: 'success', text: `Successfully invested ₹${amount} in ${selectedAsset.name}` });
      setTimeout(() => {
        setSelectedAsset(null);
        navigate('/dashboard');
      }, 2000);
    } else {
      setMessage({ type: 'error', text: 'Investment failed. Check balance or fraud limits.' });
    }
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Explore Assets</h1>

      <div className="grid grid-cols-1 gap-4 mb-8">
        {assets.map((asset) => (
          <div key={asset.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center hover:border-emerald-300 transition-colors cursor-pointer" onClick={() => handleInvestClick(asset)}>
            <div className="mb-4 md:mb-0">
               <div className="flex items-center space-x-3 mb-1">
                  <h3 className="font-bold text-lg text-slate-800">{asset.name}</h3>
                  <RiskLabel level={asset.riskLevel} />
               </div>
               <p className="text-slate-500 text-sm mb-2">{asset.description}</p>
               <div className="text-xs font-mono bg-slate-100 inline-block px-2 py-1 rounded text-slate-600">
                  Est. Return: {asset.expectedReturn}
               </div>
            </div>
            <div className="flex flex-col items-end min-w-[120px]">
               <span className="text-sm text-slate-400 mb-1">Min. Invest</span>
               <span className="text-xl font-bold text-slate-800">₹{asset.minInvestment}</span>
               <button className="mt-2 text-emerald-600 font-medium text-sm hover:underline">Select &rarr;</button>
            </div>
          </div>
        ))}
      </div>

      {/* Investment Modal/Drawer */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-0 shadow-2xl animate-fade-in overflow-hidden">
             
             <div className="flex justify-between items-center p-6 border-b border-slate-100">
                <h3 className="text-xl font-bold">Invest in {selectedAsset.name}</h3>
                <button onClick={() => setSelectedAsset(null)} className="text-slate-400 hover:text-slate-600">✕</button>
             </div>

             {showDebate && user ? (
                <AgentDebate 
                    asset={selectedAsset} 
                    amount={amount} 
                    user={user} 
                    onProceed={executeInvestment} 
                    onCancel={() => setShowDebate(false)} 
                />
             ) : (
                <div className="p-6">
                    {/* Normal Investment Form */}
                    <div className="space-y-4 mb-6">
                        <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label>
                        <input 
                            type="number" 
                            min={selectedAsset.minInvestment}
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-lg font-bold"
                        />
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center space-x-2">
                            <div className="bg-blue-100 p-1 rounded">
                                <Lock size={16} className="text-blue-600" />
                            </div>
                            <span className="text-sm font-medium text-slate-700">Set Recurring?</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                        </div>
                    </div>

                    {message && (
                        <div className={`p-3 rounded-lg mb-4 text-center text-sm font-medium ${message.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {message.text}
                        </div>
                    )}

                    <button 
                        onClick={handleInitialConfirm}
                        disabled={loading}
                        className={`w-full py-3 px-4 rounded-lg text-white font-bold text-lg flex items-center justify-center space-x-2 transition-all bg-slate-900 hover:bg-slate-800 shadow-lg hover:shadow-xl`}
                    >
                        {loading ? (
                        <span>Processing...</span>
                        ) : (
                        <>
                            <CheckCircle size={20} />
                            <span>Run AI Analysis & Confirm</span>
                        </>
                        )}
                    </button>
                    <p className="text-xs text-center text-slate-400 mt-4">
                        Next Step: Our AI Agents will debate this investment for you.
                    </p>
                </div>
             )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Invest;
