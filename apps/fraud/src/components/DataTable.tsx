import { Transaction } from '../types';

interface DataTableProps {
  transactions: Transaction[];
}

export default function DataTable({ transactions }: DataTableProps) {
  return (
    <div className="rounded-lg overflow-hidden border border-cyber-primary/20">
      <table className="w-full">
        <thead className="bg-gray-800">
          <tr>
            <th className="p-4 text-left">Date</th>
            <th className="p-4 text-left">Vendor</th>
            <th className="p-4 text-left">Amount</th>
            <th className="p-4 text-left">Risk</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id} className={`border-t border-cyber-primary/10 hover:bg-gray-800/50 
              ${tx.riskLevel === 'high' ? 'text-cyber-alert' : 
                 tx.riskLevel === 'medium' ? 'text-yellow-400' : 'text-green-400'}`}>
              <td className="p-4">{tx.date}</td>
              <td className="p-4">{tx.vendor}</td>
              <td className="p-4">${tx.amount}</td>
              <td className="p-4 uppercase">{tx.riskLevel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}