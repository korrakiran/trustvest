import React from 'react';
import Layout from '../components/Layout';
import { AlertTriangle, CheckCircle, Search, HelpCircle } from 'lucide-react';

const Education: React.FC = () => {
  return (
    <Layout>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Investment Academy</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Scam Checker Tool */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 md:col-span-2">
          <div className="flex items-center space-x-3 mb-4">
             <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="text-red-500" />
             </div>
             <h2 className="text-lg font-bold text-slate-800">Is it a Scam? Check the Signs</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <h3 className="font-bold text-slate-700 mb-2">1. Guaranteed Returns?</h3>
                <p className="text-sm text-slate-600">Real investments have risk. If someone promises 20% guaranteed profit per month, it's a Ponzi scheme.</p>
             </div>
             <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <h3 className="font-bold text-slate-700 mb-2">2. Urgency?</h3>
                <p className="text-sm text-slate-600">"Invest NOW or miss out!" is a classic pressure tactic. Real markets will be there tomorrow.</p>
             </div>
             <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <h3 className="font-bold text-slate-700 mb-2">3. Unverified App?</h3>
                <p className="text-sm text-slate-600">Always check if the app is registered with SEBI or relevant authorities. Don't trust WhatsApp groups.</p>
             </div>
          </div>
        </div>

        {/* Basic Concepts */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-xl shadow-lg text-white">
           <div className="flex items-center space-x-2 mb-4">
              <CheckCircle size={24} />
              <h2 className="text-xl font-bold">Safe Investing Checklist</h2>
           </div>
           <ul className="space-y-3">
              <li className="flex items-start gap-2">
                 <span className="mt-1">•</span>
                 <span>Start small. Don't invest money you need for rent or food.</span>
              </li>
              <li className="flex items-start gap-2">
                 <span className="mt-1">•</span>
                 <span>Diversify. Don't put all eggs in one basket.</span>
              </li>
              <li className="flex items-start gap-2">
                 <span className="mt-1">•</span>
                 <span>Understand the asset. If you don't know what it is, don't buy it.</span>
              </li>
           </ul>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <div className="flex items-center space-x-2 mb-4">
              <Search className="text-blue-500" />
              <h2 className="text-lg font-bold">How to Verify an App</h2>
           </div>
           <p className="text-slate-600 text-sm mb-4">
              Before depositing money, check the developer details on the Play Store/App Store. Look for a physical address and contact support.
           </p>
           <button className="text-blue-600 font-medium text-sm hover:underline">Read full guide &rarr;</button>
        </div>

      </div>
    </Layout>
  );
};

export default Education;