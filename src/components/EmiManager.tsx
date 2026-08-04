import React, { useState } from 'react';
import { EmiItem } from '../types';
import { formatINR, calculateDaysDiff } from '../utils/calculations';
import {
  Car,
  Calendar,
  CheckCircle2,
  Clock,
  X,
  CreditCard,
  Plus,
  Trash2,
  ChevronRight,
  FileText,
  Building,
} from 'lucide-react';

interface EmiManagerProps {
  emis: EmiItem[];
  onUpdateEmi: (updatedItem: EmiItem) => void;
  onAddEmi?: (newItem: EmiItem) => void;
  onDeleteEmi?: (id: string) => void;
}

interface MonthlyScheduleRow {
  monthIndex: number;
  monthName: string; // e.g. "Aug 2026"
  dueDate: string;   // YYYY-MM-DD
  amount: number;
  status: 'Paid' | 'Upcoming' | 'Overdue';
  paymentRef?: string;
  paymentDate?: string;
}

export const EmiManager: React.FC<EmiManagerProps> = ({
  emis,
  onUpdateEmi,
  onAddEmi,
  onDeleteEmi,
}) => {
  // Modal for showing full Month-Wise Schedule for a selected loan
  const [activeScheduleEmi, setActiveScheduleEmi] = useState<EmiItem | null>(null);

  // Payment Recording State inside Schedule Modal
  const [recordingMonth, setRecordingMonth] = useState<MonthlyScheduleRow | null>(null);
  const [lastPaymentRef, setLastPaymentRef] = useState('');
  const [lastPaymentDate, setLastPaymentDate] = useState('2026-08-05');

  // Add EMI state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newLoanName, setNewLoanName] = useState('');
  const [newVehicleModel, setNewVehicleModel] = useState('');
  const [newLenderBank, setNewLenderBank] = useState('');
  const [newAccountNo, setNewAccountNo] = useState('');
  const [newTotalLoanValue, setNewTotalLoanValue] = useState(5000000);
  const [newRemainingBalance, setNewRemainingBalance] = useState(3500000);
  const [newMonthlyEmi, setNewMonthlyEmi] = useState(75000);
  const [newDueDay, setNewDueDay] = useState(5);
  const [newNextDueDate, setNewNextDueDate] = useState('2026-08-05');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoanName.trim()) return;

    const newItem: EmiItem = {
      id: `EMI-${Date.now()}`,
      loanName: newLoanName.trim(),
      vehicleModel: newVehicleModel.trim() || 'Vehicle / Equipment',
      lenderBank: newLenderBank.trim() || 'Lender Bank',
      accountNo: newAccountNo.trim() || `LOAN-${Math.floor(1000 + Math.random() * 9000)}`,
      totalLoanValue: Number(newTotalLoanValue) || 1000000,
      remainingBalance: Number(newRemainingBalance) || 500000,
      monthlyEmi: Number(newMonthlyEmi) || 25000,
      dueDayOfMonth: Number(newDueDay) || 5,
      nextDueDate: newNextDueDate || '2026-08-05',
      status: 'Upcoming',
    };

    if (onAddEmi) {
      onAddEmi(newItem);
    }

    setIsAddModalOpen(false);
    setNewLoanName('');
    setNewVehicleModel('');
    setNewLenderBank('');
    setNewAccountNo('');
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeScheduleEmi || !recordingMonth) return;

    // Calculate updated due date (advance by 1 month)
    const currentDate = new Date(recordingMonth.dueDate);
    currentDate.setMonth(currentDate.getMonth() + 1);
    const newDueDateStr = currentDate.toISOString().substring(0, 10);

    const updatedBalance = Math.max(0, activeScheduleEmi.remainingBalance - activeScheduleEmi.monthlyEmi);

    const updatedItem: EmiItem = {
      ...activeScheduleEmi,
      remainingBalance: updatedBalance,
      nextDueDate: newDueDateStr,
      status: 'Paid',
      lastPaymentDate: lastPaymentDate || recordingMonth.dueDate,
      lastPaymentRef: lastPaymentRef || `ACH/ICICI/INP-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    onUpdateEmi(updatedItem);
    setActiveScheduleEmi(updatedItem);
    setRecordingMonth(null);
    setLastPaymentRef('');
  };

  // Helper function to generate 12-month schedule for a loan
  const generate12MonthSchedule = (item: EmiItem): MonthlyScheduleRow[] => {
    const rows: MonthlyScheduleRow[] = [];
    const baseDueDate = new Date(item.nextDueDate || '2026-08-05');
    const day = item.dueDayOfMonth || baseDueDate.getDate() || 5;

    // Past month (Jul 2026)
    if (item.lastPaymentDate || item.lastPaymentRef) {
      const pastDate = new Date(baseDueDate);
      pastDate.setMonth(pastDate.getMonth() - 1);
      pastDate.setDate(day);
      const mName = pastDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      rows.push({
        monthIndex: 1,
        monthName: mName,
        dueDate: pastDate.toISOString().substring(0, 10),
        amount: item.monthlyEmi,
        status: 'Paid',
        paymentRef: item.lastPaymentRef || 'ACH/ICICI/DIRECT-DEBIT',
        paymentDate: item.lastPaymentDate || pastDate.toISOString().substring(0, 10),
      });
    }

    const startIdx = rows.length > 0 ? 2 : 1;

    for (let i = 0; i < 12; i++) {
      const d = new Date(baseDueDate);
      d.setMonth(d.getMonth() + i);
      d.setDate(day);

      const mName = d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      const dateStr = d.toISOString().substring(0, 10);

      const isFirst = i === 0;
      const isPaid = isFirst && item.status === 'Paid';

      rows.push({
        monthIndex: startIdx + i,
        monthName: mName,
        dueDate: dateStr,
        amount: item.monthlyEmi,
        status: isPaid ? 'Paid' : 'Upcoming',
        paymentRef: isPaid ? (item.lastPaymentRef || 'ACH/BANK-REF') : undefined,
        paymentDate: isPaid ? (item.lastPaymentDate || dateStr) : undefined,
      });
    }

    return rows;
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
              Vehicle & Loan Repayment Facilities (EMIs)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Main EMI loan list. Click on any loan to view its month-wise repayment schedule and payment records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Add Loan / Party</span>
          </button>

          <div className="grid grid-cols-3 gap-3 text-right bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Total Sanctioned</span>
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
      </div>

      {/* MAIN EMI LOANS LIST - CLEAN & CONCISE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {emis.map((item) => {
          const daysToDue = calculateDaysDiff(item.nextDueDate);
          const isPaid = item.status === 'Paid';

          return (
            <div
              key={item.id}
              onClick={() => setActiveScheduleEmi(item)}
              className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-5 space-y-4">
                {/* Header Name & Lender */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 border border-slate-200">
                      {item.lenderBank}
                    </span>
                    <h2 className="text-base font-extrabold text-slate-900 mt-2 group-hover:text-indigo-600 transition">
                      {item.loanName}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">{item.vehicleModel}</p>
                  </div>
                  {onDeleteEmi && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteEmi(item.id);
                      }}
                      title="Delete Loan Facility"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Main Monthly EMI Amount */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Monthly EMI</span>
                    <span className="text-lg font-black text-rose-600">{formatINR(item.monthlyEmi)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Next Due Date</span>
                    <span className="text-xs font-extrabold text-slate-800">{item.nextDueDate}</span>
                  </div>
                </div>

                {/* Progress bar summary */}
                <div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-semibold mb-1">
                    <span>Remaining Principal</span>
                    <span className="text-amber-700 font-bold">{formatINR(item.remainingBalance)}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{
                        width: `${Math.round(
                          ((item.totalLoanValue - item.remainingBalance) / item.totalLoanValue) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Click action footer */}
              <div className="px-5 py-3 bg-gradient-to-r from-slate-50 to-indigo-50/50 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition">
                <span className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Click to view Month-Wise Schedule</span>
                </span>
                <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
              </div>
            </div>
          );
        })}
      </div>

      {/* MONTH-WISE SCHEDULE MODAL */}
      {activeScheduleEmi && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 space-y-5 my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <Car className="w-6 h-6" />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-extrabold uppercase">
                    {activeScheduleEmi.lenderBank}
                  </span>
                  <h2 className="text-lg font-extrabold text-slate-900 mt-1">
                    {activeScheduleEmi.loanName}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {activeScheduleEmi.vehicleModel} • Account: <span className="font-mono text-slate-700 font-bold">{activeScheduleEmi.accountNo}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveScheduleEmi(null);
                  setRecordingMonth(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Loan KPI Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Sanctioned Loan</span>
                <span className="text-sm font-extrabold text-slate-800">{formatINR(activeScheduleEmi.totalLoanValue)}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Remaining Principal</span>
                <span className="text-sm font-extrabold text-amber-700">{formatINR(activeScheduleEmi.remainingBalance)}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Monthly EMI</span>
                <span className="text-sm font-extrabold text-rose-600">{formatINR(activeScheduleEmi.monthlyEmi)}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Next Installment</span>
                <span className="text-sm font-extrabold text-slate-800">{activeScheduleEmi.nextDueDate}</span>
              </div>
            </div>

            {/* RECORD PAYMENT SUB-FORM IF CLICKED ON A MONTH */}
            {recordingMonth && (
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-amber-700" />
                    <span className="font-bold text-slate-900 text-xs">
                      Record Payment for {recordingMonth.monthName} ({formatINR(recordingMonth.amount)})
                    </span>
                  </div>
                  <button
                    onClick={() => setRecordingMonth(null)}
                    className="text-amber-800 hover:text-amber-950 text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleRecordPaymentSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Bank Ref / UTR No. *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ACH/ICICI/AUG01/8832"
                      value={lastPaymentRef}
                      onChange={(e) => setLastPaymentRef(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Payment Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={lastPaymentDate}
                      onChange={(e) => setLastPaymentDate(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-semibold"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow transition cursor-pointer text-xs flex items-center justify-center space-x-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm & Record</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* MONTH-WISE REPAYMENT SCHEDULE TABLE */}
            <div className="overflow-y-auto flex-1 rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider sticky top-0 border-b border-slate-200">
                    <th className="p-3">Inst #</th>
                    <th className="p-3">Month</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3 text-right">EMI Amount</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Payment Ref / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {generate12MonthSchedule(activeScheduleEmi).map((row) => (
                    <tr
                      key={row.monthIndex + row.dueDate}
                      className={row.status === 'Paid' ? 'bg-emerald-50/30' : 'hover:bg-slate-50'}
                    >
                      <td className="p-3 font-mono font-bold text-slate-500">#{row.monthIndex}</td>
                      <td className="p-3 font-extrabold text-slate-800">{row.monthName}</td>
                      <td className="p-3 text-slate-600 font-mono">{row.dueDate}</td>
                      <td className="p-3 text-right font-extrabold text-rose-600">
                        {formatINR(row.amount)}
                      </td>
                      <td className="p-3 text-center">
                        {row.status === 'Paid' ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-200 inline-flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Paid</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold border border-amber-200 inline-flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Upcoming</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono text-[11px]">
                        {row.status === 'Paid' ? (
                          <span className="text-emerald-800 font-semibold bg-emerald-100/60 px-2 py-1 rounded">
                            {row.paymentRef || 'ACH/DIRECT-DEBIT'}
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setRecordingMonth(row);
                              setLastPaymentDate(row.dueDate);
                              setLastPaymentRef(`ACH/ICICI/INP-${Math.floor(1000 + Math.random() * 9000)}`);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition cursor-pointer shadow-xs"
                          >
                            Record Payment
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setActiveScheduleEmi(null);
                  setRecordingMonth(null);
                }}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow"
              >
                Close Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW LOAN / PARTY MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Add New EMI Loan / Party</h3>
                  <p className="text-xs text-slate-500">Add a new financing facility or vehicle/equipment loan</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Loan Party / Facility Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Commercial Vehicle Loan / Tata Motors Finance"
                  value={newLoanName}
                  onChange={(e) => setNewLoanName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Lender Bank / Institution *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HDFC Bank Ltd"
                    value={newLenderBank}
                    onChange={(e) => setNewLenderBank(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Vehicle / Asset Model *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Volvo FH Truck (MH 12 LL 9009)"
                    value={newVehicleModel}
                    onChange={(e) => setNewVehicleModel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Loan Account Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC-CVL-88219"
                    value={newAccountNo}
                    onChange={(e) => setNewAccountNo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Next Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newNextDueDate}
                    onChange={(e) => setNewNextDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Sanctioned Loan (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={newTotalLoanValue}
                    onChange={(e) => setNewTotalLoanValue(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Remaining Balance (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={newRemainingBalance}
                    onChange={(e) => setNewRemainingBalance(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Monthly EMI (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={newMonthlyEmi}
                    onChange={(e) => setNewMonthlyEmi(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 font-bold text-rose-600"
                  />
                </div>
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
                  Add EMI Loan Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
