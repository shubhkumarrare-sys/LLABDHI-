import React, { useState } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  Link2,
  FileText,
  Sparkles,
  Download,
  ArrowRight,
  Database,
  Table,
} from 'lucide-react';
import { DebtorItem, CreditorItem, EmiItem, ComplianceItem, AppSettings } from '../types';

interface GoogleSheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySheetData: (data: {
    debtors?: DebtorItem[];
    creditors?: CreditorItem[];
    emis?: EmiItem[];
    compliance?: ComplianceItem[];
    settings?: AppSettings;
  }) => void;
  currentData: {
    debtors: DebtorItem[];
    creditors: CreditorItem[];
    emis: EmiItem[];
    compliance: ComplianceItem[];
    settings: AppSettings;
  };
}

export const GoogleSheetSyncModal: React.FC<GoogleSheetSyncModalProps> = ({
  isOpen,
  onClose,
  onApplySheetData,
  currentData,
}) => {
  const [activeTab, setActiveTab] = useState<'urlSync' | 'pasteCsv' | 'pasteJson'>('urlSync');
  const [sheetUrl, setSheetUrl] = useState('');
  const [rawText, setRawText] = useState('');
  const [targetCategory, setTargetCategory] = useState<'all' | 'debtors' | 'creditors' | 'emis' | 'compliance'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [parsedPreview, setParsedPreview] = useState<{
    debtorsCount: number;
    creditorsCount: number;
    emisCount: number;
    complianceCount: number;
    data: any;
  } | null>(null);

  if (!isOpen) return null;

  // Extract Spreadsheet ID from Google Sheet URL
  const extractSpreadsheetId = (url: string) => {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  // Helper to extract values for dynamic key variations
  const getFieldVal = (r: any, keys: string[]): string => {
    if (!r) return '';
    for (const key of Object.keys(r)) {
      const normalizedKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const k of keys) {
        if (normalizedKey === k.toLowerCase().replace(/[^a-z0-9]/g, '')) {
          if (r[key] !== undefined && r[key] !== null && String(r[key]).trim() !== '') {
            return String(r[key]).trim();
          }
        }
      }
    }
    return '';
  };

  const extractDebtorName = (r: any): string => {
    const val = getFieldVal(r, [
      'clientEntity',
      'client entity',
      'client_entity',
      'client',
      'client name',
      'debtor',
      'debtors',
      'debtor name',
      'customer',
      'customer name',
      'party',
      'party name',
      'particulars',
      'company',
      'name',
    ]);
    return val || 'Client';
  };

  const extractCreditorName = (r: any): string => {
    const val = getFieldVal(r, [
      'vendorEntity',
      'vendor entity',
      'vendor_entity',
      'vendor',
      'vendor name',
      'creditor',
      'creditors',
      'creditor name',
      'supplier',
      'supplier name',
      'party',
      'party name',
      'particulars',
      'company',
      'name',
    ]);
    return val || 'Vendor';
  };

  // Helper to parse CSV rows
  const parseCsvText = (csvText: string) => {
    const lines = csvText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.replace(/^"|"$/g, '').trim().toLowerCase());
    
    return lines.slice(1).map((line) => {
      // Basic CSV split considering quotes
      const values: string[] = [];
      let currentVal = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentVal.trim());
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      values.push(currentVal.trim());

      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = values[idx] ? values[idx].replace(/^"|"$/g, '') : '';
      });
      return rowObj;
    });
  };

  // Process and parse incoming data
  const handleParseAndPreview = async () => {
    setStatusMessage(null);
    setIsLoading(true);

    try {
      if (activeTab === 'urlSync') {
        if (!sheetUrl.trim()) {
          throw new Error('Please enter a valid Google Sheet URL or published Google Apps Script URL.');
        }

        const spreadsheetId = extractSpreadsheetId(sheetUrl);

        if (spreadsheetId) {
          // Attempt to fetch public CSV exports for tabs
          const tabsToFetch = ['Debtors', 'Creditors', 'EMIs', 'EMI', 'Loans', 'LLP_Compliance', 'Compliance'];
          const fetchedResults: any = {};

          for (const tabName of tabsToFetch) {
            try {
              const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
              const res = await fetch(exportUrl);
              if (res.ok) {
                const text = await res.text();
                const parsedRows = parseCsvText(text);
                if (parsedRows.length > 0) {
                  fetchedResults[tabName] = parsedRows;
                }
              }
            } catch (e) {
              console.warn(`Could not fetch tab ${tabName} directly:`, e);
            }
          }

          if (Object.keys(fetchedResults).length === 0) {
            throw new Error(
              'Could not automatically fetch public CSV tabs. Ensure the Google Sheet is set to "Anyone with link can view" or use the "Paste CSV/JSON" option below.'
            );
          }

          // Transform fetched CSV rows to typed objects
          const newDebtors: DebtorItem[] = (fetchedResults['Debtors'] || []).map((r: any, idx: number) => ({
            id: getFieldVal(r, ['id', 'deb_id', 'debtor_id', 'invoice_id']) || `DEB-${200 + idx}`,
            clientEntity: extractDebtorName(r),
            invoiceRef: getFieldVal(r, ['invoiceRef', 'invoice ref', 'invoice_ref', 'invoice', 'inv no', 'bill ref']) || `INV-${100 + idx}`,
            invoiceDate: getFieldVal(r, ['invoiceDate', 'invoice date', 'invoice_date', 'date', 'inv date']) || '2026-07-01',
            dueDate: getFieldVal(r, ['dueDate', 'due date', 'due_date', 'due', 'pay date']) || '2026-08-01',
            amount: parseFloat(getFieldVal(r, ['amount', 'amt', 'value', 'total', 'total amount']).replace(/[^0-9.]/g, '')) || 100000,
            status: (getFieldVal(r, ['status', 'payment status', 'state']) as any) || 'Pending',
            contactEmail: getFieldVal(r, ['contactEmail', 'contact email', 'email', 'mail']),
            contactPerson: getFieldVal(r, ['contactPerson', 'contact person', 'contact', 'person']),
            notes: getFieldVal(r, ['notes', 'remarks', 'description', 'details']),
          }));

          const newCreditors: CreditorItem[] = (fetchedResults['Creditors'] || []).map((r: any, idx: number) => ({
            id: getFieldVal(r, ['id', 'cre_id', 'creditor_id', 'bill_id']) || `CRE-${300 + idx}`,
            vendorEntity: extractCreditorName(r),
            invoiceRef: getFieldVal(r, ['invoiceRef', 'invoice ref', 'invoice_ref', 'invoice', 'inv no', 'bill ref']) || `BILL-${100 + idx}`,
            dueDate: getFieldVal(r, ['dueDate', 'due date', 'due_date', 'due', 'pay date']) || '2026-08-05',
            amount: parseFloat(getFieldVal(r, ['amount', 'amt', 'value', 'total', 'total amount']).replace(/[^0-9.]/g, '')) || 50000,
            category: (getFieldVal(r, ['category', 'type', 'head', 'vendor category']) as any) || 'Raw Material',
            status: (getFieldVal(r, ['status', 'payment status', 'state']) as any) || 'Pending',
            notes: getFieldVal(r, ['notes', 'remarks', 'description', 'details']),
          }));

          const rawEmiRows = fetchedResults['EMIs'] || fetchedResults['EMI'] || fetchedResults['Loans'] || fetchedResults['Emi'] || [];
          const newEmis: EmiItem[] = rawEmiRows.map((r: any, idx: number) => ({
            id: getFieldVal(r, ['id', 'emi_id', 'loan_id']) || `EMI-${300 + idx}`,
            loanName: getFieldVal(r, ['loanName', 'loan name', 'loan_name', 'party', 'party name', 'bank name', 'loan', 'lender', 'particulars', 'name']) || 'Vehicle Loan',
            vehicleModel: getFieldVal(r, ['vehicleModel', 'vehicle model', 'vehicle_model', 'vehicle', 'model', 'details', 'description', 'particulars']) || 'Vehicle',
            lenderBank: getFieldVal(r, ['lenderBank', 'lender bank', 'lender_bank', 'bank', 'bank name', 'lender', 'institution']) || 'Lender Bank',
            accountNo: getFieldVal(r, ['accountNo', 'account no', 'account_no', 'loan account', 'account', 'acc no']) || `LOAN-${1000 + idx}`,
            totalLoanValue: parseFloat(getFieldVal(r, ['totalLoanValue', 'total loan value', 'total_loan_value', 'loan amount', 'sanctioned amount', 'amount']).replace(/[^0-9.]/g, '')) || 5000000,
            remainingBalance: parseFloat(getFieldVal(r, ['remainingBalance', 'remaining balance', 'remaining_balance', 'balance', 'principal remaining', 'outstanding']).replace(/[^0-9.]/g, '')) || 2500000,
            monthlyEmi: parseFloat(getFieldVal(r, ['monthlyEmi', 'monthly emi', 'monthly_emi', 'emi amount', 'emi', 'installment']).replace(/[^0-9.]/g, '')) || 50000,
            dueDayOfMonth: parseInt(getFieldVal(r, ['dueDayOfMonth', 'due day', 'due_day', 'day']).replace(/[^0-9]/g, '')) || 5,
            nextDueDate: getFieldVal(r, ['nextDueDate', 'next due date', 'next_due_date', 'due date', 'due_date', 'pay date']) || '2026-08-05',
            status: (getFieldVal(r, ['status', 'state', 'payment status']) as any) || 'Upcoming',
            lastPaymentDate: getFieldVal(r, ['lastPaymentDate', 'last payment date', 'last_payment_date', 'last paid date']),
            lastPaymentRef: getFieldVal(r, ['lastPaymentRef', 'last payment ref', 'last_payment_ref', 'payment ref', 'reference']),
          }));

          const previewData = {
            debtors: newDebtors.length > 0 ? newDebtors : currentData.debtors,
            creditors: newCreditors.length > 0 ? newCreditors : currentData.creditors,
            emis: newEmis.length > 0 ? newEmis : currentData.emis,
            compliance: currentData.compliance,
            settings: currentData.settings,
          };

          setParsedPreview({
            debtorsCount: newDebtors.length,
            creditorsCount: newCreditors.length,
            emisCount: newEmis.length,
            complianceCount: 0,
            data: previewData,
          });

          setStatusMessage({
            type: 'success',
            text: `Successfully connected to Google Sheet! Found ${newDebtors.length} Debtors, ${newCreditors.length} Creditors, and ${newEmis.length} EMI Loan Parties ready to update.`,
          });
        } else {
          // Check if it's a direct Apps Script JSON Web App endpoint
          const res = await fetch(sheetUrl);
          const json = await res.json();

          if (json && (json.debtors || json.creditors || json.emis || json.compliance)) {
            setParsedPreview({
              debtorsCount: json.debtors?.length || 0,
              creditorsCount: json.creditors?.length || 0,
              emisCount: json.emis?.length || 0,
              complianceCount: json.compliance?.length || 0,
              data: {
                debtors: json.debtors || currentData.debtors,
                creditors: json.creditors || currentData.creditors,
                emis: json.emis || currentData.emis,
                compliance: json.compliance || currentData.compliance,
                settings: json.settings || currentData.settings,
              },
            });
            setStatusMessage({
              type: 'success',
              text: 'Successfully fetched JSON payload from Google Apps Script Web App!',
            });
          } else {
            throw new Error('Invalid URL format. Please provide a valid Google Sheet URL or Apps Script endpoint.');
          }
        }
      } else if (activeTab === 'pasteJson') {
        const parsed = JSON.parse(rawText);
        setParsedPreview({
          debtorsCount: parsed.debtors?.length || 0,
          creditorsCount: parsed.creditors?.length || 0,
          emisCount: parsed.emis?.length || 0,
          complianceCount: parsed.compliance?.length || 0,
          data: {
            debtors: parsed.debtors || currentData.debtors,
            creditors: parsed.creditors || currentData.creditors,
            emis: parsed.emis || currentData.emis,
            compliance: parsed.compliance || currentData.compliance,
            settings: parsed.settings || currentData.settings,
          },
        });
        setStatusMessage({
          type: 'success',
          text: 'Parsed JSON dataset successfully! Review and click "Apply Update".',
        });
      } else if (activeTab === 'pasteCsv') {
        const rows = parseCsvText(rawText);
        if (rows.length === 0) {
          throw new Error('No valid CSV rows detected. Please check CSV format.');
        }

        if (targetCategory === 'debtors') {
          const newDebtors: DebtorItem[] = rows.map((r, idx) => ({
            id: getFieldVal(r, ['id', 'deb_id', 'debtor_id', 'invoice_id']) || `DEB-${500 + idx}`,
            clientEntity: extractDebtorName(r),
            invoiceRef: getFieldVal(r, ['invoiceRef', 'invoice ref', 'invoice_ref', 'invoice', 'inv no', 'bill ref']) || `INV-${100 + idx}`,
            invoiceDate: getFieldVal(r, ['invoiceDate', 'invoice date', 'invoice_date', 'date', 'inv date']) || '2026-07-01',
            dueDate: getFieldVal(r, ['dueDate', 'due date', 'due_date', 'due', 'pay date']) || '2026-08-01',
            amount: parseFloat(getFieldVal(r, ['amount', 'amt', 'value', 'total', 'total amount']).replace(/[^0-9.]/g, '')) || 100000,
            status: (getFieldVal(r, ['status', 'payment status', 'state']) as any) || 'Pending',
            contactEmail: getFieldVal(r, ['contactEmail', 'contact email', 'email', 'mail']),
            contactPerson: getFieldVal(r, ['contactPerson', 'contact person', 'contact', 'person']),
            notes: getFieldVal(r, ['notes', 'remarks', 'description', 'details']),
          }));

          setParsedPreview({
            debtorsCount: newDebtors.length,
            creditorsCount: 0,
            emisCount: 0,
            complianceCount: 0,
            data: { debtors: newDebtors },
          });
        } else if (targetCategory === 'creditors') {
          const newCreditors: CreditorItem[] = rows.map((r, idx) => ({
            id: getFieldVal(r, ['id', 'cre_id', 'creditor_id', 'bill_id']) || `CRE-${500 + idx}`,
            vendorEntity: extractCreditorName(r),
            invoiceRef: getFieldVal(r, ['invoiceRef', 'invoice ref', 'invoice_ref', 'invoice', 'inv no', 'bill ref']) || `BILL-${100 + idx}`,
            dueDate: getFieldVal(r, ['dueDate', 'due date', 'due_date', 'due', 'pay date']) || '2026-08-05',
            amount: parseFloat(getFieldVal(r, ['amount', 'amt', 'value', 'total', 'total amount']).replace(/[^0-9.]/g, '')) || 50000,
            category: (getFieldVal(r, ['category', 'type', 'head', 'vendor category']) as any) || 'Raw Material',
            status: (getFieldVal(r, ['status', 'payment status', 'state']) as any) || 'Pending',
            notes: getFieldVal(r, ['notes', 'remarks', 'description', 'details']),
          }));

          setParsedPreview({
            debtorsCount: 0,
            creditorsCount: newCreditors.length,
            emisCount: 0,
            complianceCount: 0,
            data: { creditors: newCreditors },
          });
        } else if (targetCategory === 'emis') {
          const newEmis: EmiItem[] = rows.map((r, idx) => ({
            id: getFieldVal(r, ['id', 'emi_id', 'loan_id']) || `EMI-${500 + idx}`,
            loanName: getFieldVal(r, ['loanName', 'loan name', 'loan_name', 'party', 'party name', 'bank name', 'loan', 'lender', 'particulars', 'name']) || 'Vehicle Loan',
            vehicleModel: getFieldVal(r, ['vehicleModel', 'vehicle model', 'vehicle_model', 'vehicle', 'model', 'details', 'description', 'particulars']) || 'Vehicle',
            lenderBank: getFieldVal(r, ['lenderBank', 'lender bank', 'lender_bank', 'bank', 'bank name', 'lender', 'institution']) || 'Lender Bank',
            accountNo: getFieldVal(r, ['accountNo', 'account no', 'account_no', 'loan account', 'account', 'acc no']) || `LOAN-${1000 + idx}`,
            totalLoanValue: parseFloat(getFieldVal(r, ['totalLoanValue', 'total loan value', 'total_loan_value', 'loan amount', 'sanctioned amount', 'amount']).replace(/[^0-9.]/g, '')) || 5000000,
            remainingBalance: parseFloat(getFieldVal(r, ['remainingBalance', 'remaining balance', 'remaining_balance', 'balance', 'principal remaining', 'outstanding']).replace(/[^0-9.]/g, '')) || 2500000,
            monthlyEmi: parseFloat(getFieldVal(r, ['monthlyEmi', 'monthly emi', 'monthly_emi', 'emi amount', 'emi', 'installment']).replace(/[^0-9.]/g, '')) || 50000,
            dueDayOfMonth: parseInt(getFieldVal(r, ['dueDayOfMonth', 'due day', 'due_day', 'day']).replace(/[^0-9]/g, '')) || 5,
            nextDueDate: getFieldVal(r, ['nextDueDate', 'next due date', 'next_due_date', 'due date', 'due_date', 'pay date']) || '2026-08-05',
            status: (getFieldVal(r, ['status', 'state', 'payment status']) as any) || 'Upcoming',
            lastPaymentDate: getFieldVal(r, ['lastPaymentDate', 'last payment date', 'last_payment_date', 'last paid date']),
            lastPaymentRef: getFieldVal(r, ['lastPaymentRef', 'last payment ref', 'last_payment_ref', 'payment ref', 'reference']),
          }));

          setParsedPreview({
            debtorsCount: 0,
            creditorsCount: 0,
            emisCount: newEmis.length,
            complianceCount: 0,
            data: { emis: newEmis },
          });
        }

        setStatusMessage({
          type: 'success',
          text: `Parsed ${rows.length} CSV rows successfully! Click "Apply Update to Website".`,
        });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to process Google Sheet data.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmApply = () => {
    if (parsedPreview?.data) {
      onApplySheetData(parsedPreview.data);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Google Sheet Live Sync & Data Updater</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] uppercase font-mono font-bold">
                  LLABDHI OPS NODE
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Update the website live with records from your Llabdhi Google Sheet.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 space-x-4">
          <button
            onClick={() => {
              setActiveTab('urlSync');
              setStatusMessage(null);
            }}
            className={`pb-3 text-xs font-bold border-b-2 flex items-center space-x-2 transition cursor-pointer ${
              activeTab === 'urlSync'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>Google Sheet URL / Web App Link</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('pasteCsv');
              setStatusMessage(null);
            }}
            className={`pb-3 text-xs font-bold border-b-2 flex items-center space-x-2 transition cursor-pointer ${
              activeTab === 'pasteCsv'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Paste Google Sheet CSV</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('pasteJson');
              setStatusMessage(null);
            }}
            className={`pb-3 text-xs font-bold border-b-2 flex items-center space-x-2 transition cursor-pointer ${
              activeTab === 'pasteJson'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Paste JSON Dataset</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl border flex items-start space-x-2.5 text-xs ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="font-medium leading-relaxed">{statusMessage.text}</span>
            </div>
          )}

          {/* TAB 1: Google Sheet URL */}
          {activeTab === 'urlSync' && (
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  Enter Google Sheet URL or Apps Script Endpoint URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-normal">
                  <strong>Tip:</strong> Ensure your Google Sheet permission is set to <em>"Anyone with the link can view"</em>. The system will auto-read tabs named <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">Debtors</code> and <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">Creditors</code>.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-[11px] text-amber-900 space-y-1">
                <div className="font-bold flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Auto-Detected Google Sheet Columns:</span>
                </div>
                <p>
                  Debtors columns: <code className="font-mono">Client Entity, Invoice Ref, Invoice Date, Due Date, Amount, Status</code>
                </p>
                <p>
                  Creditors columns: <code className="font-mono">Vendor Entity, Invoice Ref, Due Date, Amount, Category, Status</code>
                </p>
                <p>
                  EMIs / Loans columns: <code className="font-mono">Party Name / Loan Name, Lender Bank, Vehicle Model, Monthly EMI, Due Date, Remaining Balance</code>
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Paste CSV */}
          {activeTab === 'pasteCsv' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800">Target Table to Update:</label>
                <select
                  value={targetCategory}
                  onChange={(e) => setTargetCategory(e.target.value as any)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                >
                  <option value="debtors">Debtors (Receivables)</option>
                  <option value="creditors">Creditors (Payables)</option>
                  <option value="emis">EMIs & Loan Parties</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Copy & Paste CSV text from Google Sheet
                </label>
                <textarea
                  rows={8}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`Client Entity, Invoice Ref, Invoice Date, Due Date, Amount, Status\nIFB Industries Ltd, LL/2026-27/0412, 2026-06-15, 2026-07-15, 1485000, Overdue\nJohnson Lifts Pvt Ltd, LL/2026-27/0488, 2026-07-02, 2026-08-01, 2150000, Pending`}
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-emerald-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* TAB 3: Paste JSON */}
          {activeTab === 'pasteJson' && (
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Paste Full Website JSON Dataset
                </label>
                <textarea
                  rows={8}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`{\n  "debtors": [...],\n  "creditors": [...],\n  "emis": [...],\n  "compliance": [...]\n}`}
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-indigo-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Parsed Preview Section */}
          {parsedPreview && (
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-white space-y-3">
              <h3 className="font-bold text-xs text-emerald-400 flex items-center space-x-2">
                <Database className="w-4 h-4" />
                <span>Google Sheet Data Update Preview</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                  <div className="text-slate-400">Debtors</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">
                    {parsedPreview.debtorsCount} Items
                  </div>
                </div>

                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                  <div className="text-slate-400">Creditors</div>
                  <div className="text-sm font-bold text-indigo-400 mt-0.5">
                    {parsedPreview.creditorsCount} Items
                  </div>
                </div>

                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                  <div className="text-slate-400">EMIs</div>
                  <div className="text-sm font-bold text-amber-400 mt-0.5">
                    {parsedPreview.emisCount} Loans
                  </div>
                </div>

                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                  <div className="text-slate-400">Compliance</div>
                  <div className="text-sm font-bold text-rose-400 mt-0.5">
                    {parsedPreview.complianceCount} Items
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handleParseAndPreview}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs inline-flex items-center space-x-2 cursor-pointer transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Processing Sheet...' : 'Fetch & Preview Google Sheet'}</span>
          </button>

          <button
            onClick={handleConfirmApply}
            disabled={!parsedPreview}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-bold text-xs inline-flex items-center space-x-2 shadow cursor-pointer transition"
          >
            <span>Apply Update to Website Live</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
