import { AlertTriangle } from 'lucide-react';

interface AlertCardProps {
  title: string;
  vendor: string;
  amount: string;
  reason: string;
}

export default function AlertCard({ title, vendor, amount, reason }: AlertCardProps) {
  return (
    <div className="p-4 mb-4 bg-gray-900 rounded-lg border border-cyber-alert/30 hover:glow transition-all">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 mt-1 text-cyber-alert flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-cyber-alert">{title}</h3>
          <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Vendor</p>
              <p className="text-cyber-primary">{vendor}</p>
            </div>
            <div>
              <p className="text-gray-400">Amount</p>
              <p className="text-cyber-primary">{amount}</p>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-gray-400">Reason Flagged</p>
            <p className="text-cyber-primary">{reason}</p>
          </div>
        </div>
      </div>
    </div>
  );
}