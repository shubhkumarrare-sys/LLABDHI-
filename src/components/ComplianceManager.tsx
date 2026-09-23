import React, { useState } from 'react';
import { ComplianceItem } from '../types';
import { formatINR, calculateDaysDiff, getTodayStr } from '../utils/calculations';
import {
  FileCheck2,
  ExternalLink,
  CheckCircle2,
  Clock,
  X,
  FileText,
  ShieldAlert,
  Plus,
  Trash2,
  ShieldCheck,
  Building,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

interface ComplianceManagerProps {
  complianceList: ComplianceItem[];
  onUpdateCompliance: (updatedItem: ComplianceItem) => void;
  onAddCompliance?: (newItem: ComplianceItem) => void;
  onDeleteCompliance?: (id: string) => void;
  onOpenSyncModal?: () => void;
  onRefreshSheet?: () => void;
}

export const ComplianceManager: React.FC<ComplianceManagerProps> = ({
  complianceList,
  onUpdateCompliance,
  onAddCompliance,
  onDeleteCompliance,
  onOpenSyncModal,
  onRefreshSheet,
}) => {
  const [selectedCompliance, setSelectedCompliance] = useState<ComplianceItem | null>(null);
  const [arnChallanRef, setArnChallanRef] = useState('');
  const [filingDate, setFilingDate] = useState(getTodayStr());

  // Add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPeriod, setNewPeriod] = useState('FY 2026-27');
  const [newDueDate, setNewDueDate] = useState('2026-08-31');
  const [newGoverningAuth, setNewGoverningAuth] = useState<'GSTN Portal' | 'Income Tax Dept' | 'MCA V3 Portal' | string>('MCA V3 Portal');
  const [newEstimatedAmt, setNewEstimatedAmt] = useState('');
  const [newResponsibility, setNewResponsibility] = useState('CA Mehta & Associates');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: ComplianceItem = {
      id: `CMP-${Date.now()}`,
      title: newTitle.trim(),
      period: newPeriod.trim() || 'FY 2026-27',
      dueDate: newDueDate || '2026-08-31',
      governingAuthority: newGoverningAuth,
      status: 'Pending',
      estimatedAmount: newEstimatedAmt ? Number(newEstimatedAmt) : undefined,
      responsibility: newResponsibility.trim() || 'In-house Finance Team',
    };

    if (onAddCompliance) {
      onAddCompliance(newItem);
    }

    setIsAddModalOpen(false);
    setNewTitle('');
    setNewEstimatedAmt('');
  };

  const handleFilingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompliance) return;

    onUpdateCompliance({
      ...selectedCompliance,
      status: 'Filed',
      filingDate: filingDate || new Date().toISOString().substring(0, 10),
      arnChallanRef: arnChallanRef || `ARN/MCA/2026-${Math.floor(100000 + Math.random() * 900000)}`,
    });

    setSelectedCompliance(null);
    setArnChallanRef('');
  };

  const getAuthorityBadgeClass = (auth: string) => {
    if (auth.includes('GST')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (auth.includes('Income Tax')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (auth.includes('MCA')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  // High-level summary metrics
  const totalCount = complianceList.length;
  const pendingCompliances = complianceList.filter((c) => c.status !== 'Filed');
  const filedCompliances = complianceList.filter((c) => c.status === 'Filed');
  const totalEstimatedLiability = pendingCompliances.reduce(
    (sum, c) => sum + (c.estimatedAmount || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* 1. TOP 4 MASTER METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Statutory Obligations */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8EBF2] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#7D8499]">
              Statutory Deadlines
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#EFF2FE] text-[#3045F5] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl lg:text-3xl font-extrabold text-[#171B3A] tracking-tight tabular-nums">
              {totalCount} Filings
            </h3>
            <p className="text-xs text-[#7D8499] mt-1 font-medium">
              GSTN, MCA V3 & Income Tax Dept
            </p>
          </div>
        </div>

        {/* Pending Deadlines */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8EBF2] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#7D8499]">
              Pending Filings
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl lg:text-3xl font-extrabold text-[#171B3A] tracking-tight tabular-nums">
              {pendingCompliances.length} Pending
            </h3>
            <p className="text-xs text-amber-700 mt-1 font-semibold">
              Returns due for deposit or submission
            </p>
          </div>
        </div>

        {/* Cleared / Filed Returns */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8EBF2] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#7D8499]">
              Completed Filings
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl lg:text-3xl font-extrabold text-[#10B981] tracking-tight tabular-nums">
              {filedCompliances.length} Filed
            </h3>
            <p className="text-xs text-[#10B981] mt-1 font-semibold">
              Verified with ARN / Challan receipts
            </p>
          </div>
        </div>

        {/* Estimated Tax Liability */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8EBF2] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#7D8499]">
              Pending Est. Liability
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl lg:text-3xl font-extrabold text-rose-600 tracking-tight tabular-nums">
              {formatINR(totalEstimatedLiability)}
            </h3>
            <p className="text-xs text-rose-600 mt-1 font-semibold">
              Estimated statutory tax deposits
            </p>
          </div>
        </div>
      </div>

      {/* 2. SECTION TOOLBAR & REGULATORY PORTALS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-[#171B3A]">
            LLP Statutory Compliance & Filings
          </h2>
          <p className="text-xs text-[#7D8499] mt-0.5">
            GSTR-1, GSTR-3B, TDS, Advance Tax, DIR-3 KYC, and MCA Form 8 & 11 tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <a
            href="https://www.mca.gov.in/"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-xl border border-[#E8EBF2] bg-white text-[#171B3A] hover:bg-slate-50 text-xs font-semibold inline-flex items-center space-x-1 shadow-2xs"
          >
            <span>MCA V3 Portal</span>
            <ExternalLink className="w-3 h-3 text-[#7D8499]" />
          </a>
          <a
            href="https://www.gst.gov.in/"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-xl border border-[#E8EBF2] bg-white text-[#171B3A] hover:bg-slate-50 text-xs font-semibold inline-flex items-center space-x-1 shadow-2xs"
          >
            <span>GSTN Portal</span>
            <ExternalLink className="w-3 h-3 text-[#7D8499]" />
          </a>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#3045F5] hover:bg-[#2537D6] text-white font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Compliance Item</span>
          </button>
        </div>
      </div>

      {/* 3. MAIN COMPLIANCE TRACKER TABLE */}
      <div className="bg-white rounded-2xl border border-[#E8EBF2] shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E8EBF2] flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-[#171B3A]">
            Regulatory Schedule & Obligation Ledger
          </h3>
          <span className="text-xs text-[#7D8499] font-medium">
            {complianceList.length} compliance entries recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F9FC] text-[#7D8499] border-b border-[#E8EBF2] uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="p-3.5">Title / Return</th>
                <th className="p-3.5">Period</th>
                <th className="p-3.5">Governing Authority</th>
                <th className="p-3.5">Statutory Due Date</th>
                <th className="p-3.5 text-right">Est. Tax / Fee (₹)</th>
                <th className="p-3.5">Responsibility</th>
                <th className="p-3.5 text-center">Filing Status</th>
                <th className="p-3.5">ARN / Challan Reference</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EBF2]">
              {complianceList.map((item) => {
                const daysLeft = calculateDaysDiff(item.dueDate);
                const isOverdue = daysLeft < 0 && item.status !== 'Filed';

                return (
                  <tr key={item.id} className="hover:bg-[#F7F9FC] transition group">
                    <td className="p-3.5 font-bold text-[#171B3A]">
                      <div>{item.title}</div>
                      <div className="text-[10px] text-[#7D8499] font-mono font-normal">{item.id}</div>
                    </td>

                    <td className="p-3.5 text-[#7D8499]">{item.period}</td>

                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getAuthorityBadgeClass(
                          item.governingAuthority
                        )}`}
                      >
                        {item.governingAuthority}
                      </span>
                    </td>

                    <td className="p-3.5 text-[#171B3A]">
                      <div>{item.dueDate}</div>
                      {isOverdue && (
                        <span className="text-[10px] text-rose-600 font-bold block">
                          Overdue by {Math.abs(daysLeft)} days
                        </span>
                      )}
                      {!isOverdue && item.status !== 'Filed' && daysLeft <= 7 && (
                        <span className="text-[10px] text-amber-700 font-semibold block">
                          Due in {daysLeft} day(s)
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 font-extrabold text-[#171B3A] text-right tabular-nums">
                      {item.estimatedAmount ? formatINR(item.estimatedAmount) : '—'}
                    </td>

                    <td className="p-3.5 text-[#7D8499]">{item.responsibility || 'In-House'}</td>

                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'Filed'
                            ? 'bg-emerald-50 text-[#10B981]'
                            : isOverdue
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="p-3.5 text-[#7D8499]">
                      {item.status === 'Filed' ? (
                        <div>
                          <div className="text-[11px] font-mono text-[#10B981] font-bold">
                            {item.arnChallanRef || 'ARN/MCA/10291'}
                          </div>
                          <div className="text-[10px] text-[#7D8499]">Filed on {item.filingDate}</div>
                        </div>
                      ) : (
                        <span className="text-amber-700 font-medium text-[11px] italic">
                          Awaiting ARN / Challan
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {item.status !== 'Filed' ? (
                          <button
                            onClick={() => setSelectedCompliance(item)}
                            className="px-3 py-1.5 rounded-lg bg-[#3045F5] hover:bg-[#2537D6] text-white font-bold text-xs transition cursor-pointer shadow-2xs"
                          >
                            Update Filing
                          </button>
                        ) : (
                          <span className="text-[#10B981] font-bold text-xs inline-flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Filed</span>
                          </span>
                        )}
                        {onDeleteCompliance && (
                          <button
                            onClick={() => onDeleteCompliance(item.id)}
                            title="Delete compliance record"
                            className="p-1.5 text-[#7D8499] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {complianceList.length === 0 && (
          <div className="p-12 text-center bg-[#F7F9FC]/50 border-t border-[#E8EBF2]">
            <div className="max-w-md mx-auto space-y-3">
              <FileCheck2 className="w-10 h-10 text-[#7D8499] mx-auto stroke-1" />
              <h3 className="text-sm font-bold text-[#171B3A]">No LLP Compliance Records</h3>
              <p className="text-xs text-[#7D8499]">
                All compliance obligations have been recorded. Add new requirements manually or refresh your live sheet data.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 4. UPDATE FILING & ARN MODAL */}
      {selectedCompliance && (
        <div className="fixed inset-0 bg-[#171B3A]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E8EBF2] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8EBF2] pb-3">
              <h3 className="text-base font-extrabold text-[#171B3A]">
                Record Filing & ARN Reference
              </h3>
              <button
                onClick={() => setSelectedCompliance(null)}
                className="text-[#7D8499] hover:text-[#171B3A] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#F7F9FC] p-3.5 rounded-xl border border-[#E8EBF2] text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#7D8499]">Obligation:</span>
                <span className="font-bold text-[#171B3A]">{selectedCompliance.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7D8499]">Governing Portal:</span>
                <span className="font-medium text-[#171B3A]">{selectedCompliance.governingAuthority}</span>
              </div>
            </div>

            <form onSubmit={handleFilingSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#171B3A] mb-1">
                  ARN / Challan Reference Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AA2707261120349 (GST) or MCA/2026/88210"
                  value={arnChallanRef}
                  onChange={(e) => setArnChallanRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E8EBF2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#171B3A] mb-1">
                  Filing / Deposit Date *
                </label>
                <input
                  type="date"
                  required
                  value={filingDate}
                  onChange={(e) => setFilingDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E8EBF2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#E8EBF2]">
                <button
                  type="button"
                  onClick={() => setSelectedCompliance(null)}
                  className="px-4 py-2 rounded-xl border border-[#E8EBF2] text-[#7D8499] text-xs font-semibold cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#10B981] hover:bg-emerald-600 text-white text-xs font-bold cursor-pointer shadow-xs"
                >
                  Confirm Compliance Filed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. ADD NEW COMPLIANCE ITEM MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-[#171B3A]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E8EBF2] shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E8EBF2] pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-[#EFF2FE] text-[#3045F5]">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#171B3A] text-base">Add LLP Compliance Obligation</h3>
                  <p className="text-xs text-[#7D8499]">Track GST, MCA, Income Tax, or LLP filing</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#7D8499] hover:text-[#171B3A] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#171B3A] mb-1">
                  Title / Return Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GSTR-1 / GSTR-3B / DIR-3 KYC / LLP Form 8 / Income Tax Audit"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E8EBF2] rounded-xl text-xs focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#171B3A] mb-1">
                    Governing Authority *
                  </label>
                  <select
                    value={newGoverningAuth}
                    onChange={(e) => setNewGoverningAuth(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E8EBF2] rounded-xl text-xs focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5] bg-white cursor-pointer"
                  >
                    <option value="GSTN Portal">GSTN Portal</option>
                    <option value="Income Tax Dept">Income Tax Dept</option>
                    <option value="MCA V3 Portal">MCA V3 Portal</option>
                    <option value="Other Regulatory Board">Other Regulatory Board</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#171B3A] mb-1">
                    Period / FY *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. July 2026 / FY 2025-26"
                    value={newPeriod}
                    onChange={(e) => setNewPeriod(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E8EBF2] rounded-xl text-xs focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#171B3A] mb-1">
                    Statutory Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E8EBF2] rounded-xl text-xs focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#171B3A] mb-1">
                    Estimated Tax / Fee (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 150000"
                    value={newEstimatedAmt}
                    onChange={(e) => setNewEstimatedAmt(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E8EBF2] rounded-xl text-xs focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#171B3A] mb-1">
                  Responsible Consultant / Team
                </label>
                <input
                  type="text"
                  placeholder="e.g. CA Mehta & Associates / Company Secretary Apex"
                  value={newResponsibility}
                  onChange={(e) => setNewResponsibility(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E8EBF2] rounded-xl text-xs focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E8EBF2]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8EBF2] text-[#7D8499] font-semibold cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#3045F5] hover:bg-[#2537D6] text-white font-bold cursor-pointer shadow-xs"
                >
                  Save Compliance Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
