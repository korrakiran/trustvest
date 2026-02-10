import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { getUser, getInvestments, getAssets } from '../services/mockBackend';
import { UserProfile, Investment, Asset } from '../types';
import Layout from '../components/Layout';
import FinancialTwin from '../components/FinancialTwin';
import { PlusCircle, ArrowUpRight, ShieldAlert, BadgeCheck, BrainCircuit, Activity, PieChart as PieChartIcon } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      navigate('/');
      return;
    }
    setUser(u);
    setInvestments(getInvestments());
    getAssets().then(setAssets);
  }, [navigate]);

  if (!user) return null;

  // Calculate totals
  const totalInvested = investments.reduce((acc, curr) => acc + curr.amount, 0);
  const portfolioData = investments.map(inv => {
    const asset = assets.find(a => a.id === inv.assetId);
    return {
      name: asset?.name || 'Unknown',
      value: inv.amount
    };
  });

  const chartData: { name: string; value: number }[] = Object.values(portfolioData.reduce((acc, curr) => {
    if (!acc[curr.name]) acc[curr.name] = { name: curr.name, value: 0 };
    acc[curr.name].value += curr.value;
    return acc;
  }, {} as Record<string, {name: string, value: number}>));

  return (
    <Layout>
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold text-slate-900">Welcome, {user.name}</h1>
            <p className="text-slate-500 mt-1">Your AI-secured financial center.</p>
        </div>
        <div className="flex gap-2">
            {!user.kycVerified && (
                <button 
                onClick={() => navigate('/kyc')}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                <ShieldAlert size={16} /> Verify Account
                </button>
            )}
        </div>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Wallet Balance</h3>
          <p className="text-3xl font-bold text-slate-900">₹{user.walletBalance.toLocaleString()}</p>
          <div className="mt-4 text-xs text-slate-400">Mock funds</div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
           <div className="flex justify-between items-start">
               <div>
                    <h3 className="text-indigo-100 font-medium mb-1 flex items-center gap-2">
                        <BrainCircuit size={16} /> Emotional Score
                    </h3>
                    <p className="text-3xl font-bold">{user.emotionalScore}/100</p>
               </div>
               <div className="bg-white/20 px-2 py-1 rounded text-xs font-semibold">
                   {user.emotionalScore > 80 ? "Steady Hand" : user.emotionalScore > 50 ? "Neutral" : "Panic Prone"}
               </div>
           </div>
           <p className="text-xs text-indigo-200 mt-4">
               Based on your simulator performance and activity.
           </p>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl shadow-sm text-white flex flex-col justify-center">
          <button 
            onClick={() => navigate('/invest')}
            className="flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-lg font-bold transition-all w-full mb-3"
          >
            <PlusCircle size={20} />
            <span>New Investment</span>
          </button>
           <button 
            onClick={() => navigate('/simulator')}
            className="flex items-center justify-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg text-sm transition-all w-full"
          >
            <Activity size={16} />
            <span>Train in Simulator</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Portfolio Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-lg text-slate-800 mb-4">Asset Allocation</h3>
          {chartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-4 justify-center mt-4">
                 {chartData.map((entry, index) => (
                    <div key={index} className="flex items-center text-xs">
                      <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      {entry.name}
                    </div>
                 ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
              <PieChartIcon size={48} className="mb-2 opacity-50" />
              <p>No investments yet.</p>
            </div>
          )}
        </div>

        {/* Security Status */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <h3 className="font-bold text-lg text-slate-800 mb-4">Account Health</h3>
           <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                 <div className="flex items-center space-x-3">
                    <BadgeCheck className={`h-5 w-5 ${user.kycVerified ? 'text-emerald-500' : 'text-slate-300'}`} />
                    <span className="text-sm font-medium">KYC Verification</span>
                 </div>
                 <span className={`text-xs px-2 py-1 rounded ${user.kycVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                    {user.kycVerified ? 'Verified' : 'Pending'}
                 </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                 <div className="flex items-center space-x-3">
                    <div className={`h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${user.riskScore < 30 ? 'bg-emerald-500' : 'bg-red-500'}`}>
                       {user.riskScore}
                    </div>
                    <span className="text-sm font-medium">Account Fraud Risk</span>
                 </div>
                 <span className="text-xs text-slate-500">
                    Low is good (0-100)
                 </span>
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100">
                 <p className="font-semibold mb-1">🤖 AI Twin Note:</p>
                 <p>{user.emotionalScore > 80 ? "You are investing calmly. Great job!" : "You seem anxious. Try the simulator to build confidence."}</p>
              </div>
           </div>
        </div>
      </div>
      
      <FinancialTwin user={user} />
    </Layout>
  );
};

export default Dashboard;