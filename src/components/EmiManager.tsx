import React, { useState } from 'react';
import { EmiItem } from '../types';
import { formatINR, calculateDaysDiff, deduplicateEmis } from '../utils/calculations';
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
  Building,
  ShieldCheck,
  TrendingDown,
  Layers,
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
  const [lastPaymentDate, setLastPaymentDate] = useState('2026-04-01');

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
  const [newNextDueDate, setNewNextDueDate] = useState('2026-04-01');

  // Filter within the schedule modal: 'all' | 'next12' | 'upcoming' | 'paid'
  const [scheduleFilter, setScheduleFilter] = useState<'all' | 'next12' | 'upcoming' | 'paid'>('all');

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
      nextDueDate: newNextDueDate || '2026-04-01',
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

    // Deduct one installment from remainingBalance
    const updatedBalance = Math.max(0, activeScheduleEmi.remainingBalance - recordingMonth.amount);

    // Advance nextDueDate by 1 month
    const nextDate = new Date(activeScheduleEmi.nextDueDate);
    nextDate.setMonth(nextDate.getMonth() + 1);
    const updatedDueDateStr = nextDate.toISOString().substring(0, 10);

    const updatedItem: EmiItem = {
      ...activeScheduleEmi,
      remainingBalance: updatedBalance,
      nextDueDate: updatedDueDateStr,
      status: updatedBalance === 0 ? 'Paid' : 'Upcoming',
      lastPaymentRef: lastPaymentRef || `ACH/INP-${Math.floor(100000 + Math.random() * 900000)}`,
      lastPaymentDate: lastPaymentDate || new Date().toISOString().substring(0, 10),
    };

    onUpdateEmi(updatedItem);
    setActiveScheduleEmi(updatedItem);
    setRecordingMonth(null);
    setLastPaymentRef('');
  };

  // Deduplicate EMIs for unique vehicle loan facilities
  const cleanEmis = deduplicateEmis(emis);

  // Helper to generate full loan schedule
  const generateFullLoanSchedule = (item: EmiItem): MonthlyScheduleRow[] => {
    const totalLoan = item.totalLoanValue;
    const remaining = item.remainingBalance;
    const monthlyEmi = item.monthlyEmi;

    const totalTenureMonths = Math.max(1, Math.round(totalLoan / monthlyEmi));
    const remainingMonths = Math.max(1, Math.round(remaining / monthlyEmi));
    const paidMonthsCount = Math.max(0, totalTenureMonths - remainingMonths);

    const rows: MonthlyScheduleRow[] = [];
    const baseDueDate = new Date(item.nextDueDate);
    const day = item.dueDayOfMonth || baseDueDate.getDate() || 5;

    // 1. Paid installments in past
    for (let p = paidMonthsCount; p > 0; p--) {
      const pastDate = new Date(baseDueDate);
      pastDate.setMonth(pastDate.getMonth() - p);
      pastDate.setDate(day);

      const mName = pastDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      const dateStr = pastDate.toISOString().substring(0, 10);
      const instNo = paidMonthsCount - p + 1;

      rows.push({
        monthIndex: instNo,
        monthName: mName,
        dueDate: dateStr,
        amount: monthlyEmi,
        status: 'Paid',
        paymentRef: item.lastPaymentRef || `ACH/${(item.lenderBank || 'BANK').split(' ')[0].toUpperCase()}/PAID-${1000 + instNo}`,
        paymentDate: pastDate.toISOString().substring(0, 10),
      });
    }

    // 2. Upcoming / Current installments
    for (let u = 0; u < remainingMonths; u++) {
      const futureDate = new Date(baseDueDate);
      futureDate.setMonth(futureDate.getMonth() + u);
      futureDate.setDate(day);

      const mName = futureDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      const dateStr = futureDate.toISOString().substring(0, 10);
      const instNo = paidMonthsCount + u + 1;

      const isFirst = u === 0;
      const isPaid = isFirst && item.status === 'Paid';

      rows.push({
        monthIndex: instNo,
        monthName: mName,
        dueDate: dateStr,
        amount: monthlyEmi,
        status: isPaid ? 'Paid' : 'Upcoming',
        paymentRef: isPaid ? (item.lastPaymentRef || 'ACH/BANK-REF') : undefined,
        paymentDate: isPaid ? (item.lastPaymentDate || dateStr) : undefined,
      });
    }

    return rows;
  };

  const totalLoanValue = cleanEmis.reduce((sum, e) => sum + e.totalLoanValue, 0);
  const totalRemaining = cleanEmis.reduce((sum, e) => sum + e.remainingBalance, 0);
  const totalMonthlyEmi = cleanEmis.reduce((sum, e) => sum + e.monthlyEmi, 0);

  return (
    <div className="space-y-6">
      {/* 1. TOP 4 MASTER METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Monthly EMI Outflow */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8EBF2] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#7D8499]">
              Monthly EMI Outflow
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl lg:text-3xl font-extrabold text-rose-600 tracking-tight tabular-nums">
              {formatINR(totalMonthlyEmi)}
            </h3>
            <p className="text-xs text-rose-600 mt-1 font-semibold">
              Monthly ACH / ECS recurring debit
            </p>
          </div>
        </div>

        {/* Total Remaining Principal */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8EBF2] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#7D8499]">
              Remaining Debt Balance
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl lg:text-3xl font-extrabold text-[#171B3A] tracking-tight tabular-nums">
              {formatINR(totalRemaining)}
            </h3>
            <p className="text-xs text-amber-700 mt-1 font-semibold">
              Outstanding liability across banks
            </p>
          </div>
        </div>

        {/* Total Sanctioned Capital */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8EBF2] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#7D8499]">
              Sanctioned Loan Facility
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#EFF2FE] text-[#3045F5] flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl lg:text-3xl font-extrabold text-[#171B3A] tracking-tight tabular-nums">
              {formatINR(totalLoanValue)}
            </h3>
            <p className="text-xs text-[#7D8499] mt-1 font-medium">
              Total borrowed credit envelope
            </p>
          </div>
        </div>

        {/* Active Loan Count */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8EBF2] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#7D8499]">
              Active Facilities
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center">
              <Car className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl lg:text-3xl font-extrabold text-[#171B3A] tracking-tight tabular-nums">
              {cleanEmis.length} Active Loans
            </h3>
            <p className="text-xs text-[#10B981] mt-1 font-semibold">
              {Math.round(((totalLoanValue - totalRemaining) / (totalLoanValue || 1)) * 100)}% paid to date
            </p>
          </div>
        </div>
      </div>

      {/* 2. SECTION TOOLBAR & ADD LOAN */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-[#171B3A]">
            Vehicle & Equipment Loan Facilities
          </h2>
          <p className="text-xs text-[#7D8499] mt-0.5">
            Click on any loan facility card to view its complete 12-month amortization schedule and record payments.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-[#3045F5] hover:bg-[#2537D6] text-white font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Loan Facility</span>
        </button>
      </div>

      {/* 3. MAIN EMI LOANS CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {cleanEmis.map((item) => {
          const daysToDue = calculateDaysDiff(item.nextDueDate);
          const percentPaid = Math.round(
            ((item.totalLoanValue - item.remainingBalance) / (item.totalLoanValue || 1)) * 100
          );

          return (
            <div
              key={item.id}
              onClick={() => {
                setActiveScheduleEmi(item);
                setScheduleFilter('all');
              }}
              className="bg-white rounded-2xl border border-[#E8EBF2] hover:border-[#3045F5]/40 hover:shadow-md transition cursor-pointer flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-5 space-y-4">
                {/* Header Name & Lender */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#F7F9FC] text-[10px] font-bold text-[#171B3A] border border-[#E8EBF2]">
                      {item.lenderBank}
                    </span>
                    <h3 className="text-base font-extrabold text-[#171B3A] mt-2 group-hover:text-[#3045F5] transition">
                      {item.loanName}
                    </h3>
                    <p className="text-xs text-[#7D8499] font-medium">{item.vehicleModel}</p>
                  </div>
                  {onDeleteEmi && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteEmi(item.id);
                      }}
                      title="Delete Loan Facility"
                      className="p-1.5 rounded-lg text-[#7D8499] hover:text-rose-600 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Main Monthly EMI Amount Box */}
                <div className="p-3.5 rounded-xl bg-[#F7F9FC] border border-[#E8EBF2] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#7D8499] uppercase block tracking-wider">
                      Monthly EMI
                    </span>
                    <span className="text-lg font-extrabold text-rose-600 tabular-nums">
                      {formatINR(item.monthlyEmi)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-[#7D8499] uppercase block tracking-wider">
                      Next Due Date
                    </span>
                    <span className="text-xs font-extrabold text-[#171B3A]">{item.nextDueDate}</span>
                  </div>
                </div>

                {/* Progress bar summary */}
                <div>
                  <div className="flex justify-between text-[11px] text-[#7D8499] font-semibold mb-1.5">
                    <span>Remaining Principal</span>
                    <span className="text-amber-700 font-extrabold tabular-nums">
                      {formatINR(item.remainingBalance)}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#F7F9FC] border border-[#E8EBF2] overflow-hidden">
                    <div
                      className="h-full bg-[#10B981] rounded-full transition-all"
                      style={{ width: `${percentPaid}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-[#7D8499] mt-1 font-medium">
                    <span>{percentPaid}% Repaid</span>
                    <span>Sanction: {formatINR(item.totalLoanValue)}</span>
                  </div>
                </div>
              </div>

              {/* Click action footer */}
              <div className="px-5 py-3 bg-[#F7F9FC] border-t border-[#E8EBF2] flex items-center justify-between text-xs font-bold text-[#3045F5] group-hover:bg-[#3045F5] group-hover:text-white transition">
                <span className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>View Month-Wise Repayment Schedule</span>
                </span>
                <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. MONTH-WISE SCHEDULE MODAL */}
      {activeScheduleEmi && (() => {
        const fullSchedule = generateFullLoanSchedule(activeScheduleEmi);
        const paidCount = fullSchedule.filter((r) => r.status === 'Paid').length;
        const upcomingCount = fullSchedule.filter((r) => r.status === 'Upcoming').length;

        const filteredSchedule = fullSchedule.filter((r) => {
          if (scheduleFilter === 'paid') return r.status === 'Paid';
          if (scheduleFilter === 'upcoming') return r.status === 'Upcoming';
          if (scheduleFilter === 'next12') {
            const next12Start = fullSchedule.findIndex((x) => x.status === 'Upcoming');
            const startIdx = next12Start >= 0 ? Math.max(0, next12Start - 1) : 0;
            const itemIdx = fullSchedule.indexOf(r);
            return itemIdx >= startIdx && itemIdx < startIdx + 12;
          }
          return true; // 'all'
        });

        return (
          <div className="fixed inset-0 bg-[#171B3A]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl border border-[#E8EBF2] shadow-2xl max-w-4xl w-full p-6 space-y-5 my-8 max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-[#E8EBF2] pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-xl bg-[#EFF2FE] text-[#3045F5]">
                    <Car className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#EFF2FE] text-[#3045F5] text-[10px] font-extrabold uppercase">
                      {activeScheduleEmi.lenderBank}
                    </span>
                    <h3 className="text-lg font-extrabold text-[#171B3A] mt-1">
                      {activeScheduleEmi.loanName}
                    </h3>
                    <p className="text-xs text-[#7D8499]">
                      {activeScheduleEmi.vehicleModel} • Account: <span className="font-mono text-[#171B3A] font-bold">{activeScheduleEmi.accountNo}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveScheduleEmi(null);
                    setRecordingMonth(null);
                  }}
                  className="text-[#7D8499] hover:text-[#171B3A] p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Loan KPI Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-[#F7F9FC] p-3.5 rounded-xl border border-[#E8EBF2] text-xs">
                <div>
                  <span className="text-[10px] font-bold text-[#7D8499] uppercase block tracking-wider">Sanctioned</span>
                  <span className="text-sm font-extrabold text-[#171B3A] tabular-nums">{formatINR(activeScheduleEmi.totalLoanValue)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#7D8499] uppercase block tracking-wider">Remaining</span>
                  <span className="text-sm font-extrabold text-amber-700 tabular-nums">{formatINR(activeScheduleEmi.remainingBalance)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#7D8499] uppercase block tracking-wider">Monthly EMI</span>
                  <span className="text-sm font-extrabold text-rose-600 tabular-nums">{formatINR(activeScheduleEmi.monthlyEmi)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#7D8499] uppercase block tracking-wider">Total Tenure</span>
                  <span className="text-sm font-extrabold text-[#3045F5]">{fullSchedule.length} Months</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#7D8499] uppercase block tracking-wider">Progress</span>
                  <span className="text-xs font-bold text-[#10B981]">{paidCount} Paid • {upcomingCount} Left</span>
                </div>
              </div>

              {/* SCHEDULE FILTER TABS */}
              <div className="flex items-center justify-between gap-2 border-b border-[#E8EBF2] pb-2">
                <div className="flex items-center space-x-1.5 text-xs font-bold">
                  {(
                    [
                      { key: 'all', label: `Full Schedule (${fullSchedule.length})` },
                      { key: 'next12', label: 'Next 12 Months' },
                      { key: 'upcoming', label: `Upcoming (${upcomingCount})` },
                      { key: 'paid', label: `Paid (${paidCount})` },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setScheduleFilter(tab.key)}
                      className={`px-3 py-1.5 rounded-lg transition cursor-pointer font-bold ${
                        scheduleFilter === tab.key
                          ? 'bg-[#3045F5] text-white shadow-xs'
                          : 'bg-[#F7F9FC] text-[#7D8499] hover:text-[#171B3A]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="text-[11px] text-[#7D8499] font-medium">
                  Showing <span className="font-bold text-[#171B3A]">{filteredSchedule.length}</span> installments
                </div>
              </div>

              {/* RECORD PAYMENT SUB-FORM IF CLICKED ON A MONTH */}
              {recordingMonth && (
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4 text-amber-700" />
                      <span className="font-bold text-[#171B3A] text-xs">
                        Record Payment for Inst #{recordingMonth.monthIndex} ({recordingMonth.monthName} - {formatINR(recordingMonth.amount)})
                      </span>
                    </div>
                    <button
                      onClick={() => setRecordingMonth(null)}
                      className="text-[#7D8499] hover:text-[#171B3A] text-xs font-bold"
                    >
                      Cancel
                    </button>
                  </div>

                  <form onSubmit={handleRecordPaymentSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#171B3A] mb-1">
                        Bank UTR / ACH Reference *
                      </label>
                      <input
                        type="text"
                        required
                        value={lastPaymentRef}
                        onChange={(e) => setLastPaymentRef(e.target.value)}
                        className="w-full px-3 py-1.5 border border-[#E8EBF2] bg-white rounded-lg focus:ring-2 focus:ring-[#3045F5]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#171B3A] mb-1">
                        Payment Debit Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={lastPaymentDate}
                        onChange={(e) => setLastPaymentDate(e.target.value)}
                        className="w-full px-3 py-1.5 border border-[#E8EBF2] bg-white rounded-lg focus:ring-2 focus:ring-[#3045F5]"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full py-2 bg-[#10B981] hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-xs"
                      >
                        Confirm Payment Cleared
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* SCHEDULE TABLE */}
              <div className="overflow-y-auto flex-1 max-h-[380px] rounded-xl border border-[#E8EBF2]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F7F9FC] text-[#7D8499] font-bold uppercase text-[10px] tracking-wider sticky top-0 border-b border-[#E8EBF2] z-10">
                      <th className="p-3">Inst #</th>
                      <th className="p-3">Month</th>
                      <th className="p-3">Due Date</th>
                      <th className="p-3 text-right">EMI Outflow</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Payment Ref / Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8EBF2] font-medium">
                    {filteredSchedule.map((row) => (
                      <tr
                        key={row.monthIndex + row.dueDate}
                        className={row.status === 'Paid' ? 'bg-emerald-50/20' : 'hover:bg-[#F7F9FC]'}
                      >
                        <td className="p-3 font-mono font-bold text-[#7D8499]">#{row.monthIndex}</td>
                        <td className="p-3 font-extrabold text-[#171B3A]">{row.monthName}</td>
                        <td className="p-3 text-[#7D8499] font-mono">{row.dueDate}</td>
                        <td className="p-3 text-right font-extrabold text-rose-600 tabular-nums">
                          {formatINR(row.amount)}
                        </td>
                        <td className="p-3 text-center">
                          {row.status === 'Paid' ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#10B981] text-[10px] font-bold inline-flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                              <span>Paid</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold inline-flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Upcoming</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono text-[11px]">
                          {row.status === 'Paid' ? (
                            <span className="text-[#10B981] font-semibold bg-emerald-50 px-2 py-1 rounded-md">
                              {row.paymentRef || 'ACH/DIRECT-DEBIT'}
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setRecordingMonth(row);
                                setLastPaymentDate(row.dueDate);
                                setLastPaymentRef(`ACH/INP-${Math.floor(1000 + Math.random() * 9000)}`);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#3045F5] hover:bg-[#2537D6] text-white font-bold text-[11px] transition cursor-pointer shadow-2xs"
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
              <div className="flex justify-end pt-2 border-t border-[#E8EBF2]">
                <button
                  onClick={() => {
                    setActiveScheduleEmi(null);
                    setRecordingMonth(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-[#171B3A] hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-xs"
                >
                  Close Schedule
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 5. ADD NEW LOAN / PARTY MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-[#171B3A]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E8EBF2] shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E8EBF2] pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-[#EFF2FE] text-[#3045F5]">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#171B3A] text-base">Add New EMI Loan Facility</h3>
                  <p className="text-xs text-[#7D8499]">Add financing facility or vehicle/equipment loan</p>
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
                  Loan Party / Facility Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Commercial Vehicle Loan / Tata Motors Finance"
                  value={newLoanName}
                  onChange={(e) => setNewLoanName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E8EBF2] rounded-xl text-xs focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#171B3A] mb-1">
                    Lender Bank / Institution *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HDFC Bank Ltd"
                    value={newLenderBank}
                    onChange={(e) => setNewLenderBank(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E8EBF2] rounded-xl text-xs focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#171B3A] mb-1">
                    Vehicle / Asset Model *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mercedes-Benz / MG Cyberster"
                    value={newVehicleModel}
                    onChange={(e) => setNewVehicleModel(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E8EBF2] rounded-xl text-xs focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#171B3A] mb-1">
                    Loan Account Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC-CVL-88219"
                    value={newAccountNo}
                    onChange={(e) => setNewAccountNo(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E8EBF2] rounded-xl text-xs focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5] font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#171B3A] mb-1">
                    Next Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newNextDueDate}
                    onChange={(e) => setNewNextDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E8EBF2] rounded-xl text-xs focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[#171B3A] mb-1">
                    Sanctioned Loan (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={newTotalLoanValue}
                    onChange={(e) => setNewTotalLoanValue(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#E8EBF2] rounded-xl text-xs focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#171B3A] mb-1">
                    Remaining Balance (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={newRemainingBalance}
                    onChange={(e) => setNewRemainingBalance(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#E8EBF2] rounded-xl text-xs focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#171B3A] mb-1">
                    Monthly EMI (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={newMonthlyEmi}
                    onChange={(e) => setNewMonthlyEmi(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#E8EBF2] rounded-xl text-xs focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5] font-bold text-rose-600"
                  />
                </div>
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
                  Add Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
