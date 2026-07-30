import React, { useState } from 'react';
import { EmiItem } from '../types';
import { formatINR, calculateDaysDiff } from '../utils/calculations';
import {
  Car,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Clock,
  X,
  CreditCard,
  Building,
} from 'lucide-react';

interface EmiManagerProps {
  emis: EmiItem[];
  onUpdateEmi: (updatedItem: EmiItem) => void;
}

export const EmiManager: React.FC<EmiManagerProps> = ({ emis, onUpdateEmi }) => {
  const [selectedEmi, setSelectedEmi] = useState<EmiItem | null>(null);
  const [lastPaymentRef, setLastPaymentRef] = useState('');
  const [lastPaymentDate, setLastPaymentDate] = useState('2026-07-30');

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmi) return;

    // Advance next due date by 1 month
    const currentDate = new Date(selectedEmi.nextDueDate);
    currentDate.setMonth(currentDate.getMonth() + 1);
    const newDueDateStr = currentDate.toISOString().substring(0, 10);

    const newRemainingBalance = Math.max(0, selectedEmi.remainingBalance - selectedEmi.monthlyEmi);

    onUpdateEmi({
      ...selectedEmi,
      remainingBalance: newRemainingBalance,
      nextDueDate: newDueDateStr,
      status: 'Paid',
      lastPaymentDate: lastPaymentDate || new Date().toISOString().substring(0, 10),
      lastPaymentRef: lastPaymentRef || `ACH/ICICI/INP-${Math.floor(1000 + Math.random() * 9000)}`,
    });

    setSelectedEmi(null);
    setLastPaymentRef('');
  };

  const totalLoanValue = emis.reduce((sum, e) => sum + e.totalLoanValue, 0);
  const totalRemaining = emis.reduce((sum, e) => sum + e.remainingBalance, 0);
  const totalMonthlyEmi = emis.reduce((sum, e) => sum + e.monthlyEmi, 0);

  return (
    <div className="space-y-6">
      {/* Header Title */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Car className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900">
              Vehicle Loan Repayment Schedules (EMIs)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tracking loan amortization schedules for MG Cyberster EV Convertible & Saraswat Bank Mercedes-Benz GLE 450d.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-right bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">Total Loan Value</span>
            <span className="text-xs font-bold text-slate-800">{formatINR(totalLoanValue)}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">Total Remaining</span>
            <span className="text-xs font-bold text-amber-700">{formatINR(totalRemaining)}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">Monthly EMI Outflow</span>
            <span className="text-xs font-bold text-rose-600">{formatINR(totalMonthlyEmi)}</span>
          </div>
        </div>
      </div>

      {/* LOAN CARDS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {emis.map((item) => {
          const daysToDue = calculateDaysDiff(item.nextDueDate);
          const isMg = item.loanName.includes('MG Cyberster');

          return (
            <div
              key={item.id}
              className={`bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col justify-between ${
                isMg ? 'border-indigo-200 hover:border-indigo-300' : 'border-blue-200 hover:border-blue-300'
              }`}
            >
              <div>
                {/* Header Badge */}
                <div
                  className={`p-5 ${
                    isMg
                      ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white'
                      : 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded bg-white/10 text-xs font-semibold text-slate-200 backdrop-blur-sm border border-white/10">
                      {item.lenderBank}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                        item.status === 'Paid'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {item.status === 'Paid' ? 'Paid for Month' : `Due in ${daysToDue} day(s)`}
                    </span>
                  </div>

                  <h2 className="text-lg font-extrabold mt-3 text-white">{item.loanName}</h2>
                  <p className="text-xs text-slate-300 font-mono mt-0.5">{item.vehicleModel}</p>
                </div>

                {/* Content Details */}
                <div className="p-5 space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold block">
                        Monthly EMI Amount
                      </span>
                      <span className="text-base font-extrabold text-rose-600">
                        {formatINR(item.monthlyEmi)}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold block">
                        Next Due Date
                      </span>
                      <span className="text-sm font-bold text-slate-800">{item.nextDueDate}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Total Sanctioned Loan:</span>
                      <span className="font-semibold text-slate-800">
                        {formatINR(item.totalLoanValue)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Remaining Principal Balance:</span>
                      <span className="font-bold text-amber-700">
                        {formatINR(item.remainingBalance)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Loan Account No:</span>
                      <span className="font-mono text-slate-700">{item.accountNo}</span>
                    </div>
                  </div>

                  {/* Principal Paid Progress Bar */}
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>Loan Repayment Progress</span>
                      <span>
                        {Math.round(
                          ((item.totalLoanValue - item.remainingBalance) / item.totalLoanValue) * 100
                        )}
                        % Paid
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{
                          width: `${
                            ((item.totalLoanValue - item.remainingBalance) / item.totalLoanValue) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Recent Payment Timestamps Recorded */}
                  <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-200 text-xs">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                      Last Recorded Payment Timestamp & Reference
                    </span>
                    <div className="flex items-center justify-between font-mono text-[11px] text-emerald-900 font-semibold">
                      <span>{item.lastPaymentRef || 'ACH/BANK-DIRECT-DEBIT'}</span>
                      <span className="text-[10px] text-emerald-700">{item.lastPaymentDate || '2026-07-01'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200">
                <button
                  onClick={() => setSelectedEmi(item)}
                  className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer shadow"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Update EMI Payment & Bank Reference</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* UPDATE EMI PAYMENT MODAL */}
      {selectedEmi && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Update EMI Payment & Reference
              </h3>
              <button
                onClick={() => setSelectedEmi(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Loan Facility:</span>
                <span className="font-bold text-slate-900">{selectedEmi.loanName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Monthly EMI:</span>
                <span className="font-extrabold text-rose-600">{formatINR(selectedEmi.monthlyEmi)}</span>
              </div>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ACH / Bank Reference / UTR Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ACH/ICICI/AUG01/8832"
                  value={lastPaymentRef}
                  onChange={(e) => setLastPaymentRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Credit Date / Timestamp *
                </label>
                <input
                  type="date"
                  required
                  value={lastPaymentDate}
                  onChange={(e) => setLastPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedEmi(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium cursor-pointer hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer shadow"
                >
                  Confirm EMI Paid & Advance Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
