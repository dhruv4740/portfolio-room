// src/types/csv.ts
export interface TransactionCSV {
    'Transaction Date': string;
    Vendor: string;
    Amount: string;
    Category?: string;
    Description?: string;
  }
  
  export interface ParsedTransaction {
    id: string;
    date: string;
    vendor: string;
    amount: number;
    riskLevel: 'low' | 'medium' | 'high';
  }