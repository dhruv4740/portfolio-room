import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { Upload, File, AlertCircle, X } from 'lucide-react';

interface CsvUploaderProps {
    onUpload: (transactions: Transaction[]) => void;
}

interface Transaction {
    id: string;
    date: string;
    vendor: string;
    amount: number;
    riskLevel: 'low' | 'medium' | 'high';
}

interface TransactionCSV {
    'Transaction Date': string;
    Vendor: string;
    Amount: string;
}

export default function CsvUploader({ onUpload }: CsvUploaderProps) {
    const [error, setError] = useState<string | null>(null);
    const [currentFile, setCurrentFile] = useState<File | null>(null);

    const calculateRiskLevel = (vendor: string, amount: number): 'low' | 'medium' | 'high' => {
        const riskFactors = {
            highRiskVendors: ['Unknown', 'Temp', 'Test'],
            amountThreshold: 10000
        };

        if (riskFactors.highRiskVendors.some(kw => vendor.includes(kw)) || amount > riskFactors.amountThreshold) {
            return 'high';
        }
        if (amount > 5000) return 'medium';
        return 'low';
    };

    const parseCsvFile = (file: File) => {
        Papa.parse<TransactionCSV>(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0) {
                    setError('Invalid CSV format');
                    return;
                }

                const parsedTransactions = results.data.map((row, index) => ({
                    id: `uploaded-${index}-${Date.now()}`,
                    date: row['Transaction Date'],
                    vendor: row.Vendor,
                    amount: parseFloat(row.Amount.replace(/[^0-9.-]/g, '')),
                    riskLevel: calculateRiskLevel(row.Vendor, parseFloat(row.Amount))
                }));

                onUpload(parsedTransactions);
                setError(null);
            },
            error: () => setError('Error reading CSV file')
        });
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file?.type !== 'text/csv' && !file?.name.endsWith('.csv')) {
            setError('Only CSV files are allowed');
            return;
        }

        setError(null);
        setCurrentFile(file);
        parseCsvFile(file);
    }, [onUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv']
        },
        multiple: false
    });

    const removeFile = () => {
        setCurrentFile(null);
        setError(null);
    };

    return (
        <div className="space-y-4">
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all
                    ${
                        isDragActive 
                            ? 'border-cyber-primary bg-cyber-primary/10' 
                            : 'border-cyber-primary/20 hover:border-cyber-primary/40'
                    }
                    ${error ? 'border-cyber-alert bg-cyber-alert/10' : ''}`}
            >
                <input {...getInputProps()} />
                
                <div className="space-y-4">
                    <div className="flex justify-center">
                        <Upload className={`w-8 h-8 mx-auto ${
                            error ? 'text-cyber-alert' : 'text-cyber-primary'
                        }`} />
                    </div>

                    {currentFile ? (
                        <div className="flex items-center justify-center gap-2">
                            <File className="w-5 h-5 text-cyber-primary" />
                            <span className="text-cyber-primary">{currentFile.name}</span>
                            <button
                                onClick={removeFile}
                                className="text-cyber-alert hover:text-cyber-alert/80 ml-2"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <>
                            <p className={`text-sm ${
                                error ? 'text-cyber-alert' : 'text-cyber-primary'
                            }`}>
                                {error || 'Drag & drop financial records CSV or'}
                            </p>
                            <button
                                type="button"
                                className="px-4 py-2 bg-cyber-primary/20 text-cyber-primary rounded-lg
                                    hover:bg-cyber-primary/30 transition-colors"
                            >
                                Browse Files
                            </button>
                        </>
                    )}
                </div>
            </div>

            {error && !currentFile && (
                <div className="flex items-center gap-2 text-cyber-alert">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                </div>
            )}

            <div className="text-sm text-cyber-primary/80">
                Supported formats: .csv (Max 100MB)
            </div>
        </div>
    );
}