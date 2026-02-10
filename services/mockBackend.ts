import { Asset, FraudSignal, Investment, RiskLevel, UserProfile } from '../types';

// --- MOCK DATABASE ---

const ASSETS: Asset[] = [
  {
    id: 'gov-bond-001',
    name: 'Government Bonds (Series A)',
    type: 'Bond',
    riskLevel: RiskLevel.LOW,
    description: 'Backed by the government. Very stable, lower returns.',
    expectedReturn: '6-7% p.a.',
    minInvestment: 100
  },
  {
    id: 'index-fund-500',
    name: 'Blue Chip Index Fund',
    type: 'Index Fund',
    riskLevel: RiskLevel.MEDIUM,
    description: 'Basket of top 50 companies. Balanced growth and stability.',
    expectedReturn: '10-12% p.a.',
    minInvestment: 50
  },
  {
    id: 'tech-startup-fund',
    name: 'Emerging Tech Crypto Fund',
    type: 'Crypto/Startup',
    riskLevel: RiskLevel.HIGH,
    description: 'High volatility assets. Potential for high loss or high gain.',
    expectedReturn: '-50% to +200% p.a.',
    minInvestment: 500
  }
];

// --- STATE MANAGEMENT (Simulating DB) ---
let currentUser: UserProfile | null = null;
let userInvestments: Investment[] = [];
let fraudSignals: FraudSignal[] = [];

// --- MOCK SERVICES ---

export const getAssets = async (): Promise<Asset[]> => {
  return new Promise((resolve) => setTimeout(() => resolve(ASSETS), 500));
};

export const getUser = (): UserProfile | null => {
  return currentUser;
};

export const updateEmotionalScore = (change: number) => {
    if (currentUser) {
        currentUser.emotionalScore = Math.max(0, Math.min(100, currentUser.emotionalScore + change));
        
        // Update tags based on score
        if (currentUser.emotionalScore < 40) {
            if (!currentUser.behaviorTags.includes("Panic Prone")) currentUser.behaviorTags.push("Panic Prone");
        } else {
             currentUser.behaviorTags = currentUser.behaviorTags.filter(t => t !== "Panic Prone");
        }
    }
};

const BACKEND_URL = "http://127.0.0.1:8000";

export const register = async (username: string, email: string, password: string): Promise<UserProfile> => {
  try {
    const response = await fetch(`${BACKEND_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    const data = await response.json();
    currentUser = data.user;
    
    // Store user ID in localStorage for session management
    if (currentUser.id) {
      localStorage.setItem('userId', currentUser.id);
    }
    
    return currentUser;
  } catch (err: any) {
    // If backend is unavailable, throw error (don't fallback to mock)
    throw new Error(err.message || 'Failed to connect to server. Please ensure the backend is running.');
  }
};

export const login = async (email: string, password: string): Promise<UserProfile> => {
  try {
    const response = await fetch(`${BACKEND_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();
    currentUser = data.user;
    
    // Store user ID in localStorage for session management
    if (currentUser.id) {
      localStorage.setItem('userId', currentUser.id);
    }
    
    // Simulate "Odd Hours" login detection (Mock logic: if minute is odd, flag it for demo)
    const date = new Date();
    if (date.getMinutes() % 2 !== 0) {
      recordFraudSignal({
        id: Date.now().toString(),
        type: 'ODD_HOURS',
        severity: 'LOW',
        timestamp: date.toISOString(),
        description: 'Login detected during unusual activity window (Simulated).'
      });
    }
    
    return currentUser;
  } catch (err: any) {
    // If backend is unavailable, throw error (don't fallback to mock)
    throw new Error(err.message || 'Failed to connect to server. Please ensure the backend is running.');
  }
};

export const submitKYC = async (data: {
  fullName: string;
  dob: string;
  pan: string;
  consent: boolean;
  photoFile?: File | null;
}): Promise<boolean> => {
  if (!currentUser?.id) {
    throw new Error("You must be logged in to submit KYC.");
  }

  let photoUrl: string | null = null;

  if (data.photoFile) {
    const formData = new FormData();
    formData.append("file", data.photoFile);
    formData.append("user_id", currentUser.id);

    const uploadRes = await fetch(`${BACKEND_URL}/kyc/upload-photo`, {
      method: "POST",
      body: formData,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to upload photo. Check AWS S3 config in .env");
    }

    const uploadData = await uploadRes.json();
    photoUrl = uploadData.url;
  }

  const submitRes = await fetch(`${BACKEND_URL}/kyc/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: currentUser.id,
      fullName: data.fullName,
      dob: data.dob,
      pan: data.pan,
      consent: data.consent,
      photoUrl,
    }),
  });

  if (!submitRes.ok) {
    const err = await submitRes.json().catch(() => ({}));
    throw new Error(err.detail || "KYC submit failed");
  }

  currentUser.kycVerified = true;
  currentUser.name = data.fullName;
  return true;
};

export const invest = async (assetId: string, amount: number, isRecurring: boolean): Promise<boolean> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  if (!currentUser) return false;

  // Fraud Rule: High Value Transfer without history
  if (amount > 5000 && userInvestments.length < 3) {
    recordFraudSignal({
      id: Date.now().toString(),
      type: 'HIGH_VALUE_TRANSFER',
      severity: 'MEDIUM',
      timestamp: new Date().toISOString(),
      description: 'Large investment attempt by new user.'
    });
    // Increase risk score
    currentUser.riskScore += 20;
    // In a real app, we might block this. For demo, we let it pass but warn.
  }

  if (currentUser.walletBalance >= amount) {
    currentUser.walletBalance -= amount;
    userInvestments.push({
      id: Date.now().toString(),
      assetId,
      amount,
      date: new Date().toISOString(),
      isRecurring
    });
    return true;
  }
  return false;
};

export const withdraw = async (amount: number): Promise<boolean> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  if (!currentUser) return false;

  // Fraud Rule: Rapid Withdrawal (Simulated)
  // If withdrawal happens within 1 minute of an investment
  const lastInvestment = userInvestments[userInvestments.length - 1];
  if (lastInvestment) {
    const timeDiff = Date.now() - new Date(lastInvestment.date).getTime();
    if (timeDiff < 60000) { // Less than 1 minute
      recordFraudSignal({
        id: Date.now().toString(),
        type: 'RAPID_WITHDRAWAL',
        severity: 'CRITICAL',
        timestamp: new Date().toISOString(),
        description: 'Withdrawal attempted immediately after deposit. Money Laundering Signal.'
      });
      currentUser.riskScore += 40;
      return false; // Block withdrawal
    }
  }

  currentUser.walletBalance += amount;
  return true;
};

export const getInvestments = (): Investment[] => {
  return userInvestments;
};

export const getFraudSignals = (): FraudSignal[] => {
  return fraudSignals;
};

const recordFraudSignal = (signal: FraudSignal) => {
  fraudSignals.push(signal);
  console.warn("FRAUD SIGNAL DETECTED:", signal);
};
