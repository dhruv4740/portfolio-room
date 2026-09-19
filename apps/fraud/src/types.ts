export interface Transaction {
    id: string;
    date: string;
    vendor: string;
    amount: number;
    riskLevel: 'low' | 'medium' | 'high';
  }
  
  export interface Alert {
    id: string;
    title: string;
    vendor: string;
    amount: string;
    reason: string;
  }