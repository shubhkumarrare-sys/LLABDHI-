import React, { useState } from 'react';
import { ComplianceItem } from '../types';
import { formatINR, calculateDaysDiff } from '../utils/calculations';
import {
  FileCheck2,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  Clock,
  X,
  FileText,
  ShieldAlert,
  Plus,
  Trash2,
} from 'lucide-react';

interface ComplianceManagerProps {
  complianceList: ComplianceItem[];
  onUpdateCompliance: (updatedItem: ComplianceItem) => void;
  onAddCompliance?: (newItem: ComplianceItem) => void;
  onDeleteCompliance?: (id: string) => void;
}

export const ComplianceManager: React.FC<ComplianceManagerProps> = ({
  complianceList,
  onUpdateCompliance,
  onAddCompliance,
  onDeleteCompliance,
}) => {
  const [selectedCompliance, setSelectedCompliance] = useState<ComplianceItem | null>(null);
  const [arnChallanRef, setArnChallanRef] = useState('');
  const [filingDate, setFilingDate] = useState('2026-07-30');

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

  const getAuthorityBadgeClass = (authority: string) => {
    switch (authority) {
      case 'GSTN Portal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Income Tax Dept':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'MCA V3 Portal':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const missingArnItems = complianceList.filter(
    (c) => c.status !== 'Filed' && (!c.arnChallanRef || !c.filingDate)
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <FileCheck2 className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900">
              Statutory Compliance & Tax Deadline Tracker
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            LLP Statutory obligations across GSTN, Income Tax Dept, and MCA V3 (GSTR-1, GSTR-3B, TDS, Advance Tax, DIR-3 KYC, Form 8 & 11).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Add Compliance Item</span>
          </button>
          <a
            href="https://www.mca.gov.in/"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 text-xs font-semibold inline-flex items-center space-x-1"
          >
            <span>MCA V3</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="https://www.gst.gov.in/"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 text-xs font-semibold inline-flex items-center space-x-1"
          >
            <span>GSTN Portal</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Missing ARN Alert Callout */}
      {missingArnItems.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-sm">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold text-amber-900">
                {missingArnItems.length} Pending Compliance Action Item(s) Missing ARN/Challan Numbers
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                The following filings/deposits require updated ARN / Challan numbers and filing dates upon completion:
                {' ' + missingArnItems.map((m) => m.title).join(', ')}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Compliance Tracker Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-800">
            LLP Statutory Compliance Schedule & Governing Authorities
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            {complianceList.length} Statutory Tracking Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Title / Return</th>
                <th className="p-3">Period</th>
                <th className="p-3">Governing Authority</th>
                <th className="p-3">Statutory Due Date</th>
                <th className="p-3 text-right">Est. Tax / Fee (₹)</th>
                <th className="p-3">Responsibility</th>
                <th className="p-3 text-center">Filing Status</th>
                <th className="p-3">ARN / Challan Reference</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {complianceList.map((item) => {
                const daysLeft = calculateDaysDiff(item.dueDate);
                const isOverdue = daysLeft < 0 && item.status !== 'Filed';

                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-slate-900">
                      <div>{item.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono font-normal">{item.id}</div>
                    </td>

                    <td className="p-3 text-slate-600">{item.period}</td>

                    <td className="p-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${getAuthorityBadgeClass(
                          item.governingAuthority
                        )}`}
                      >
                        {item.governingAuthority}
                      </span>
                    </td>

                    <td className="p-3 text-slate-700">
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

                    <td className="p-3 font-extrabold text-slate-900 text-right">
                      {item.estimatedAmount ? formatINR(item.estimatedAmount) : '—'}
                    </td>

                    <td className="p-3 text-slate-600">{item.responsibility || 'In-House'}</td>

                    <td className="p-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status === 'Filed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : isOverdue
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="p-3 text-slate-600">
                      {item.status === 'Filed' ? (
                        <div>
                          <div className="text-[11px] font-mono text-emerald-700 font-bold">
                            {item.arnChallanRef || 'ARN/MCA/10291'}
                          </div>
                          <div className="text-[10px] text-slate-400">Filed on {item.filingDate}</div>
                        </div>
                      ) : (
                        <span className="text-amber-700 font-medium text-[11px] italic">
                          Missing ARN/Challan
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {item.status !== 'Filed' ? (
                          <button
                            onClick={() => setSelectedCompliance(item)}
                            className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] transition cursor-pointer shadow-sm"
                          >
                            Update Filing & ARN
                          </button>
                        ) : (
                          <span className="text-emerald-600 font-bold text-xs inline-flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Filed</span>
                          </span>
                        )}
                        {onDeleteCompliance && (
                          <button
                            onClick={() => onDeleteCompliance(item.id)}
                            title="Delete compliance record"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      </div>

      {/* UPDATE FILING & ARN MODAL */}
      {selectedCompliance && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Update Statutory Filing & ARN/Challan Reference
              </h3>
              <button
                onClick={() => setSelectedCompliance(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Compliance Item:</span>
                <span className="font-bold text-slate-900">{selectedCompliance.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Governing Authority:</span>
                <span className="font-medium text-slate-700">{selectedCompliance.governingAuthority}</span>
              </div>
            </div>

            <form onSubmit={handleFilingSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ARN / Challan Reference Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AA2707261120349 (GST) or MCA/2026/88210"
                  value={arnChallanRef}
                  onChange={(e) => setArnChallanRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Filing / Deposit Completion Date *
                </label>
                <input
                  type="date"
                  required
                  value={filingDate}
                  onChange={(e) => setFilingDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCompliance(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium cursor-pointer hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer shadow"
                >
                  Confirm Compliance Filed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD NEW COMPLIANCE ITEM MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Add Statutory Compliance Item</h3>
                  <p className="text-xs text-slate-500">Track a new GST, MCA, Income Tax, or LLP filing requirement</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Title / Return Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GSTR-1 / GSTR-3B / DIR-3 KYC / LLP Form 8 / Income Tax Audit"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Governing Authority *
                  </label>
                  <select
                    value={newGoverningAuth}
                    onChange={(e) => setNewGoverningAuth(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="GSTN Portal">GSTN Portal</option>
                    <option value="Income Tax Dept">Income Tax Dept</option>
                    <option value="MCA V3 Portal">MCA V3 Portal</option>
                    <option value="Other Regulatory Board">Other Regulatory Board</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Period / FY *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. July 2026 / FY 2025-26"
                    value={newPeriod}
                    onChange={(e) => setNewPeriod(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Statutory Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Estimated Tax / Fee (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 150000"
                    value={newEstimatedAmt}
                    onChange={(e) => setNewEstimatedAmt(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Responsible Consultant / Team
                </label>
                <input
                  type="text"
                  placeholder="e.g. CA Mehta & Associates / Company Secretary Apex"
                  value={newResponsibility}
                  onChange={(e) => setNewResponsibility(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold cursor-pointer hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer shadow"
                >
                  Add Statutory Compliance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
