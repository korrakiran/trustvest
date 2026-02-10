import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import KYC from './pages/KYC';
import Invest from './pages/Invest';
import Education from './pages/Education';
import FraudControl from './pages/FraudControl';
import Simulator from './pages/Simulator';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/kyc" element={<KYC />} />
        <Route path="/invest" element={<Invest />} />
        <Route path="/simulator" element={<Simulator />} />
        <Route path="/education" element={<Education />} />
        <Route path="/fraud-control" element={<FraudControl />} />
      </Routes>
    </Router>
  );
};

export default App;