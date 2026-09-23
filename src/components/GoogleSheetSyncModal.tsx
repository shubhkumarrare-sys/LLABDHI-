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
import { EmiItem, ComplianceItem, AppSettings } from '../types';
import { DEFAULT_SHEET_URL, TARGET_SPREADSHEET_ID, fetchLLPCompliance, fetchEMIs, EmiScheduleRow } from '../services/googleSheetService';

interface GoogleSheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySheetData: (data: {
    emis?: EmiItem[];
    compliance?: ComplianceItem[];
    emiSchedule?: EmiScheduleRow[];
    settings?: AppSettings;
  }) => void;
  currentData: {
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
  const [sheetUrl, setSheetUrl] = useState(() => localStorage.getItem('llabdhi_sheet_url') || DEFAULT_SHEET_URL);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [parsedPreview, setParsedPreview] = useState<{
    emisCount: number;
    complianceCount: number;
    scheduleCount: number;
    data: any;
  } | null>(null);

  if (!isOpen) return null;

  // Extract Spreadsheet ID from Google Sheet URL
  const extractSpreadsheetId = (url: string) => {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : TARGET_SPREADSHEET_ID;
  };

  const handleFetchLive = async () => {
    setStatusMessage(null);
    setIsLoading(true);

    try {
      const spreadsheetId = extractSpreadsheetId(sheetUrl);
      const [compData, emiData] = await Promise.all([
        fetchLLPCompliance(spreadsheetId),
        fetchEMIs(spreadsheetId),
      ]);

      setParsedPreview({
        emisCount: emiData.activeLoans.length,
        complianceCount: compData.length,
        scheduleCount: emiData.allScheduleRows.length,
        data: {
          compliance: compData,
          emis: emiData.activeLoans,
          emiSchedule: emiData.allScheduleRows,
        },
      });

      setStatusMessage({
        type: 'success',
        text: `Successfully connected to Google Sheet! Found ${compData.length} compliance returns and ${emiData.activeLoans.length} loan facilities (${emiData.allScheduleRows.length} installments).`,
      });
      localStorage.setItem('llabdhi_sheet_url', sheetUrl);
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to fetch Google Sheet tabs. Please verify permissions.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!parsedPreview) return;
    onApplySheetData(parsedPreview.data);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#171B3A]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#E8EBF2] shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8EBF2] pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#171B3A]">
                Google Sheet Live Sync Node
              </h3>
              <p className="text-xs text-[#7D8499]">
                Continuous live synchronization with LLP_Compliance & EMIs tabs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7D8499] hover:text-[#171B3A] hover:bg-[#F7F9FC] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status notice */}
        <div className="p-3.5 bg-[#EFF2FE] border border-[#3045F5]/20 rounded-xl text-xs text-[#171B3A] space-y-1">
          <div className="flex items-center space-x-2 font-bold text-[#3045F5]">
            <Sparkles className="w-4 h-4" />
            <span>Google Sheet is the Single Source of Truth</span>
          </div>
          <p className="text-[#7D8499] text-[11px] leading-relaxed">
            The website automatically polls the Google Sheet every 15–30 seconds. Ticking or unticking checkboxes in the <span className="font-semibold text-[#171B3A]">LLP_Compliance</span> (Status) and <span className="font-semibold text-[#171B3A]">EMIs</span> (Done) tabs updates the website automatically with zero duplicate records.
          </p>
        </div>

        {/* Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#171B3A]">
            Google Sheet URL
          </label>
          <div className="relative">
            <input
              type="text"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="w-full text-xs font-mono bg-[#F7F9FC] px-3.5 py-2.5 rounded-xl border border-[#E8EBF2] focus:outline-none focus:border-[#3045F5]"
            />
          </div>
        </div>

        {/* Status message */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-start space-x-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span className="font-medium">{statusMessage.text}</span>
          </div>
        )}

        {/* Preview Summary */}
        {parsedPreview && (
          <div className="p-4 bg-[#F7F9FC] rounded-xl border border-[#E8EBF2] space-y-2">
            <span className="text-[11px] font-bold text-[#7D8499] uppercase tracking-wider block">
              Parsed Sheet Data
            </span>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white p-3 rounded-lg border border-[#E8EBF2]">
                <span className="text-xs text-[#7D8499] block font-medium">Compliance</span>
                <span className="text-lg font-black text-[#171B3A]">{parsedPreview.complianceCount}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-[#E8EBF2]">
                <span className="text-xs text-[#7D8499] block font-medium">Loan Facilities</span>
                <span className="text-lg font-black text-[#171B3A]">{parsedPreview.emisCount}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-[#E8EBF2]">
                <span className="text-xs text-[#7D8499] block font-medium">Installments</span>
                <span className="text-lg font-black text-[#171B3A]">{parsedPreview.scheduleCount}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E8EBF2]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#7D8499] hover:bg-[#F7F9FC] transition cursor-pointer"
          >
            Close
          </button>

          <button
            onClick={handleFetchLive}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-[#F7F9FC] hover:bg-slate-100 text-[#171B3A] border border-[#E8EBF2] text-xs font-bold flex items-center space-x-2 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Testing...' : 'Test Connection'}</span>
          </button>

          {parsedPreview && (
            <button
              onClick={handleApply}
              className="px-5 py-2 rounded-xl bg-[#3045F5] hover:bg-[#2537D6] text-white text-xs font-bold transition cursor-pointer shadow-sm shadow-[#3045F5]/30"
            >
              Apply to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
