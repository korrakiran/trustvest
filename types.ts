export enum RiskLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  riskLevel: RiskLevel;
  description: string;
  expectedReturn: string; // e.g., "5-7%"
  minInvestment: number;
}

export interface Investment {
  id: string;
  assetId: string;
  amount: number;
  date: string;
  isRecurring: boolean;
}

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  kycVerified: boolean;
  riskScore: number; // 0-100, higher is riskier
  walletBalance: number;
  emotionalScore: number; // 0-100, 100 is perfectly calm, 0 is panic-prone
  behaviorTags: string[]; // e.g., "Panic Seller", "Steady Hand"
}

export interface FraudSignal {
  id: string;
  type: 'RAPID_WITHDRAWAL' | 'MULTIPLE_LOGINS' | 'ODD_HOURS' | 'DEVICE_CHANGE' | 'HIGH_VALUE_TRANSFER';
  severity: 'LOW' | 'MEDIUM' | 'CRITICAL';
  timestamp: string;
  description: string;
}

export interface EducationModule {
  id: string;
  title: string;
  content: string;
  category: 'SCAM_ALERT' | 'BASICS' | 'SECURITY';
}

export interface AgentDebateTurn {
  agent: 'Optimist' | 'Risk' | 'Data';
  message: string;
}

export interface AgentDebateResult {
  turns: AgentDebateTurn[];
  conclusion: string;
  verdict: 'PROCEED' | 'CAUTION' | 'WAIT';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
