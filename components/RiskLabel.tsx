import React from 'react';
import { RiskLevel } from '../types';

const RiskLabel: React.FC<{ level: RiskLevel }> = ({ level }) => {
  const colors = {
    [RiskLevel.LOW]: 'bg-green-100 text-green-800 border-green-200',
    [RiskLevel.MEDIUM]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    [RiskLevel.HIGH]: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${colors[level]}`}>
      {level} Risk
    </span>
  );
};

export default RiskLabel;