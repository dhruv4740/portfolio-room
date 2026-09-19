import { useState } from 'react';
import { Activity, AlertTriangle, Search, Filter } from 'lucide-react';
import RiskMeter from '../components/RiskMeter';
import DataTable from '../components/DataTable';
import CsvUploader from '../components/CsvUploader';

interface Transaction {
  id: string;
  date: string;
  vendor: string;
  amount: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export default function Dashboard() {
  const [timeFilter, setTimeFilter] = useState('30d');
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: '1', date: '2024-03-01', vendor: 'CloudSecure Inc', amount: 2500, riskLevel: 'low' },
    { id: '2', date: '2024-03-05', vendor: 'Unknown Vendor', amount: 15000, riskLevel: 'high' },
    { id: '3', date: '2024-03-06', vendor: 'OfficeSupply Co', amount: 450, riskLevel: 'medium' },
  ]);

  const alerts = [
    { id: 'A1', title: 'Unverified Vendor Payment', amount: '$15,000', status: 'Critical' },
    { id: 'A2', title: 'Duplicate Transaction', amount: '$2,500', status: 'Warning' },
  ];

  const handleFileUpload = (newTransactions: Transaction[]) => {
    setTransactions([...transactions, ...newTransactions]);
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.amount.toString().includes(searchQuery);
    const matchesRisk = riskFilter === 'all' || tx.riskLevel === riskFilter;
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="min-h-screen bg-cyber-dark text-gray-100">

      <main className="container mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start">
          <h1 className="text-3xl font-bold text-cyber-primary mb-4 md:mb-0">
            Financial Dashboard
            <AlertTriangle className="inline ml-2 w-6 h-6" />
          </h1>
          <CsvUploader onUpload={handleFileUpload} />
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Total Transactions" 
            value={transactions.length.toString()} 
            trend="↑ 12%" 
            status="positive"
          />
          <StatCard 
            title="High Risk Alerts" 
            value={alerts.length.toString()} 
            status="critical"
          />
          <StatCard 
            title="Risk Score" 
            value={`${calculateAverageRisk(transactions)}%`} 
            status="neutral"
          />
        </div>

        {/* Filters Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-cyber-dark-secondary p-4 rounded-lg">
            <label className="block text-sm text-cyber-primary mb-2">
              <Filter className="inline mr-2" />
              Time Range
            </label>
            <select 
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="w-full bg-cyber-dark border border-cyber-primary/20 rounded-lg p-2"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>

          <div className="bg-cyber-dark-secondary p-4 rounded-lg">
            <label className="block text-sm text-cyber-primary mb-2">
              <Search className="inline mr-2" />
              Search
            </label>
            <input
              type="text"
              placeholder="Search transactions..."
              className="w-full bg-cyber-dark border border-cyber-primary/20 rounded-lg p-2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="bg-cyber-dark-secondary p-4 rounded-lg">
            <label className="block text-sm text-cyber-primary mb-2">
              Risk Level
            </label>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full bg-cyber-dark border border-cyber-primary/20 rounded-lg p-2"
            >
              <option value="all">All Risks</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          
        </div>

        {/* Combined Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Risk & Alerts Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-cyber-dark/80 backdrop-blur-lg p-6 rounded-xl border border-cyber-primary/20">
              <SectionHeader
                icon={<Activity className="w-5 h-5" />}
                title="Risk Overview"
                subtitle="Last scan: 2 minutes ago"
              />
              <div className="flex justify-center">
                <RiskMeter score={calculateAverageRisk(transactions)} />
              </div>
            </div>

            <div className="bg-cyber-dark/80 backdrop-blur-lg p-6 rounded-xl border border-cyber-primary/20">
              <SectionHeader
                icon={<AlertTriangle className="w-5 h-5" />}
                title="Active Alerts"
                subtitle={`${alerts.length} new alerts`}
                status="critical"
              />
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <AlertCard key={alert.id} {...alert} />
                ))}
              </div>
            </div>
          </div>

          {/* Transaction Analysis Section */}
          <div className="lg:col-span-2 bg-cyber-dark/80 backdrop-blur-lg p-6 rounded-xl border border-cyber-primary/20">
            <SectionHeader
              icon={<Search className="w-5 h-5" />}
              title="Transaction Analysis"
              subtitle={`Showing ${filteredTransactions.length} transactions`}
            />
            <DataTable transactions={filteredTransactions} />
          </div>
        </div>
      </main>
    </div>
  );
}

// Helper functions
const calculateAverageRisk = (transactions: Transaction[]) => {
  const riskValues = {
    low: 20,
    medium: 50,
    high: 80
  };
  const total = transactions.reduce((acc, tx) => acc + riskValues[tx.riskLevel], 0);
  return Math.round(total / transactions.length) || 0;
};

// Reusable Components
const StatCard = ({ title, value, trend, status }: {
  title: string;
  value: string;
  trend?: string;
  status?: 'positive' | 'critical' | 'neutral';
}) => (
  <div className="bg-gray-900/50 p-6 rounded-xl border border-cyber-primary/20 hover:border-cyber-primary/40 transition-colors">
    <h3 className="text-gray-400 text-sm mb-2">{title}</h3>
    <div className="flex items-center justify-between">
      <div className="text-3xl font-bold text-cyber-primary">{value}</div>
      {status === 'critical' ? (
        <span className="text-cyber-alert text-sm">Requires Action</span>
      ) : status === 'positive' ? (
        <span className="text-green-400 text-sm">{trend}</span>
      ) : (
        <span className="text-gray-400 text-sm">{trend}</span>
      )}
    </div>
  </div>
);

const SectionHeader = ({ icon, title, subtitle, status }: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  status?: 'critical';
}) => (
  <div className={`mb-6 ${status === 'critical' ? 'text-cyber-alert' : 'text-cyber-primary'}`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      {subtitle && <span className="text-sm text-gray-400">{subtitle}</span>}
    </div>
  </div>
);

const AlertCard = ({ title, amount, status }: {
  title: string;
  amount: string;
  status: string;
}) => (
  <div className="p-4 bg-gray-900/50 rounded-lg border border-cyber-alert/20 hover:border-cyber-alert/40 transition-colors">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-cyber-alert font-medium">{title}</h3>
        <p className="text-sm text-gray-400 mt-1">{amount}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="px-3 py-1 bg-cyber-alert/10 text-cyber-alert text-sm rounded-full">
          {status}
        </span>
        <button className="px-4 py-2 bg-cyber-alert/20 text-cyber-alert rounded-lg hover:bg-cyber-alert/30 transition-colors">
          Investigate
        </button>
      </div>
    </div>
  </div>
);
