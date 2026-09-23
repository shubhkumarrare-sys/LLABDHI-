import React, { useState } from 'react';
import { EmiItem } from '../types';
import { EmiScheduleRow } from '../services/googleSheetService';
import { formatINR, calculateDaysDiff, getTodayStr } from '../utils/calculations';
import {
  Car,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  Building,
  TrendingDown,
  ShieldCheck,
  CreditCard,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

interface EmiManagerProps {
  emis: EmiItem[];
  emiSchedule?: EmiScheduleRow[];
  onUpdateEmi?: (updatedItem: EmiItem) => void;
  onAddEmi?: (newItem: EmiItem) => void;
  onDeleteEmi?: (id: string) => void;
  onRefreshSheet?: () => void;
  isRefreshingSheet?: boolean;
  lastUpdatedTime?: string;
  isLiveConnected?: boolean;
}

export const EmiManager: React.FC<EmiManagerProps> = ({
  emis,
  emiSchedule = [],
  onRefreshSheet,
  isRefreshingSheet,
  lastUpdatedTime,
  isLiveConnected = true,
}) => {
  const [selectedLoanFilter, setSelectedLoanFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const today = getTodayStr();

  // Metrics across all facilities
  const totalLoanLiability = emis.reduce((sum, e) => sum + (e.totalLoanValue || 0), 0);
  const totalRemainingDebt = emis.reduce((sum, e) => sum + (e.remainingBalance || 0), 0);
  const totalMonthlyEmi = emis.reduce((sum, e) => sum + (e.monthlyEmi || 0), 0);

  // If emiSchedule is provided, use it; otherwise fallback to loan facilities
  const scheduleRows = emiSchedule.length > 0
    ? emiSchedule
    : emis.map((e, idx) => ({
        id: e.id,
        srNo: String(idx + 1),
        done: e.status === 'Paid',
        loanName: e.loanName,
        totalLoanLiability: e.totalLoanValue,
        dueDate: e.nextDueDate,
        rawDueDate: e.nextDueDate,
        emiAmount: e.monthlyEmi,
        interest: 0,
        principalAmount: 0,
        balance: e.remainingBalance,
        paymentDateTimestamp: e.lastPaymentDate,
        status: e.status,
      }));

  const totalInstallmentsCount = scheduleRows.length;
  const paidInstallmentsCount = scheduleRows.filter((r) => r.done || r.status === 'Paid').length;
  const pendingInstallmentsCount = totalInstallmentsCount - paidInstallmentsCount;

  // Filtered rows
  const filteredRows = scheduleRows.filter((row) => {
    // 1. Loan Filter
    if (selectedLoanFilter !== 'all' && row.loanName !== selectedLoanFilter) {
      return false;
    }

    // 2. Status Filter
    const isPaid = row.done || row.status === 'Paid';
    if (statusFilter === 'pending' && isPaid) return false;
    if (statusFilter === 'paid' && !isPaid) return false;

    // 3. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = row.loanName.toLowerCase().includes(q);
      const matchSr = String(row.srNo).includes(q);
      const matchDate = row.dueDate.includes(q) || (row.rawDueDate || '').includes(q);
      if (!matchName && !matchSr && !matchDate) return false;
    }

    return true;
  });

  const uniqueLoanNames = Array.from(new Set(scheduleRows.map((r) => r.loanName)));

  return (
    <div className="space-y-6">
      {/* 1. TOP METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Loan Liability */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8EBF2] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#7D8499]">
              Total Loan Liability
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#3045F5] flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl lg:text-3xl font-extrabold text-[#171B3A] tracking-tight tabular-nums">
              {formatINR(totalLoanLiability)}
            </h3>
            <p className="text-xs text-[#3045F5] mt-1 font-semibold">
              {emis.length} Active Credit Facilities
            </p>
          </div>
        </div>

        {/* Remaining Principal */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8EBF2] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#7D8499]">
              Remaining Debt Balance
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl lg:text-3xl font-extrabold text-indigo-700 tracking-tight tabular-nums">
              {formatINR(totalRemainingDebt)}
            </h3>
            <p className="text-xs text-indigo-600 mt-1 font-semibold">
              Principal balance outstanding
            </p>
          </div>
        </div>

        {/* Monthly EMI Outflow */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8EBF2] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#7D8499]">
              Monthly Recurring EMI
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
              Monthly bank ACH/ECS debit
            </p>
          </div>
        </div>

        {/* Schedule Progress: Paid vs Pending */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8EBF2] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#7D8499]">
              Amortization Progress
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl lg:text-3xl font-extrabold text-[#10B981] tracking-tight tabular-nums">
              {paidInstallmentsCount} / {totalInstallmentsCount}
            </h3>
            <p className="text-xs text-emerald-700 mt-1 font-semibold">
              {pendingInstallmentsCount} Installments Pending
            </p>
          </div>
        </div>
      </div>

      {/* 2. ACTIVE LOAN FACILITIES CARDS */}
      <div className="bg-white rounded-2xl p-6 border border-[#E8EBF2] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-[#171B3A] tracking-tight">
              Verified Loan Facilities Overview
            </h3>
            <p className="text-xs text-[#7D8499] mt-0.5">
              Live status from the EMIs Google Sheet • {emis.length} credit facilities
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              isLiveConnected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span>{isLiveConnected ? 'Google Sheet Source of Truth' : 'Connection Issue'}</span>
            </span>

            {onRefreshSheet && (
              <button
                onClick={onRefreshSheet}
                disabled={isRefreshingSheet}
                title="Force refresh from Google Sheet"
                className="p-1.5 rounded-lg border border-[#E8EBF2] hover:bg-slate-50 text-[#7D8499] hover:text-[#3045F5] transition cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshingSheet ? 'animate-spin text-[#3045F5]' : ''}`} />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 pt-1">
          {emis.map((loan) => {
            const isSettled = loan.status === 'Paid';
            const daysLeft = calculateDaysDiff(loan.nextDueDate);

            return (
              <div
                key={loan.id}
                onClick={() => setSelectedLoanFilter(loan.loanName === selectedLoanFilter ? 'all' : loan.loanName)}
                className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-3 ${
                  selectedLoanFilter === loan.loanName
                    ? 'bg-[#EFF2FE]/60 border-[#3045F5] ring-2 ring-[#3045F5]/20 shadow-xs'
                    : 'bg-[#F7F9FC]/60 border-[#E8EBF2] hover:bg-white hover:border-[#3045F5]/30'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-[#7D8499] uppercase truncate max-w-[120px]">
                      {loan.accountNo || loan.lenderBank}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      isSettled ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {loan.status}
                    </span>
                  </div>

                  <h5 className="font-extrabold text-xs text-[#171B3A] mt-2 line-clamp-1" title={loan.loanName}>
                    {loan.loanName}
                  </h5>
                  <p className="text-[11px] text-[#7D8499] mt-0.5">
                    {loan.vehicleModel}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#E8EBF2]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#7D8499] text-[10px] font-medium">Monthly EMI</span>
                    <span className="font-black text-[#171B3A] tabular-nums">
                      {formatINR(loan.monthlyEmi)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-[#7D8499] text-[10px] font-medium">Next Due</span>
                    <span className="font-semibold text-rose-600 text-[11px] tabular-nums">
                      {loan.nextDueDate} {daysLeft >= 0 && daysLeft <= 15 ? `(${daysLeft}d)` : ''}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. MAIN LIVE INSTALLMENT SCHEDULE TABLE */}
      <div className="bg-white rounded-2xl border border-[#E8EBF2] shadow-xs overflow-hidden">
        {/* Table Header & Controls */}
        <div className="p-5 border-b border-[#E8EBF2] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-extrabold text-base text-[#171B3A]">
                  Live Installment Schedule & Done Checkbox Ledger
                </h4>
                <span className="text-xs bg-[#EFF2FE] text-[#3045F5] font-bold px-2.5 py-0.5 rounded-full">
                  {filteredRows.length} Installments
                </span>
              </div>
              <p className="text-xs text-[#7D8499] mt-0.5">
                The <span className="font-semibold text-[#171B3A]">Done</span> checkbox in Google Sheets is the source of truth. Ticking it marks the installment as Paid; unticking reverts to Pending.
              </p>
            </div>

            {/* Status Pills Filter */}
            <div className="inline-flex p-1 bg-[#F7F9FC] rounded-xl border border-[#E8EBF2] shrink-0">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white text-[#3045F5] shadow-xs border border-[#E8EBF2]'
                    : 'text-[#7D8499] hover:text-[#171B3A]'
                }`}
              >
                All ({scheduleRows.length})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  statusFilter === 'pending'
                    ? 'bg-white text-amber-700 shadow-xs border border-[#E8EBF2]'
                    : 'text-[#7D8499] hover:text-[#171B3A]'
                }`}
              >
                Pending ({pendingInstallmentsCount})
              </button>
              <button
                onClick={() => setStatusFilter('paid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  statusFilter === 'paid'
                    ? 'bg-white text-[#10B981] shadow-xs border border-[#E8EBF2]'
                    : 'text-[#7D8499] hover:text-[#171B3A]'
                }`}
              >
                Paid ({paidInstallmentsCount})
              </button>
            </div>
          </div>

          {/* Search & Loan Facility Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-[#7D8499] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search installment by loan name, Sr No, or date..."
                className="w-full pl-9 pr-4 py-2 bg-[#F7F9FC] hover:bg-white focus:bg-white text-xs text-[#171B3A] rounded-xl border border-[#E8EBF2] focus:border-[#3045F5] focus:outline-none focus:ring-2 focus:ring-[#3045F5]/15 transition"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-[#7D8499] font-medium hidden sm:inline">Facility:</span>
              <select
                value={selectedLoanFilter}
                onChange={(e) => setSelectedLoanFilter(e.target.value)}
                className="bg-[#F7F9FC] hover:bg-white text-xs font-semibold text-[#171B3A] px-3 py-2 rounded-xl border border-[#E8EBF2] focus:outline-none focus:border-[#3045F5] cursor-pointer"
              >
                <option value="all">All Loan Facilities</option>
                {uniqueLoanNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Schedule Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F9FC] text-[#7D8499] border-b border-[#E8EBF2] uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="p-3.5 text-center">Done (Status)</th>
                <th className="p-3.5">Sr. No</th>
                <th className="p-3.5">Loan Facility</th>
                <th className="p-3.5">Due Date</th>
                <th className="p-3.5 text-right">EMI Amount (₹)</th>
                <th className="p-3.5 text-right">Principal</th>
                <th className="p-3.5 text-right">Interest</th>
                <th className="p-3.5 text-right">Balance (₹)</th>
                <th className="p-3.5">Payment Date</th>
                <th className="p-3.5 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EBF2]">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-[#7D8499]">
                    No installment records matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredRows.slice(0, 100).map((row) => {
                  const isDone = row.done || row.status === 'Paid';
                  const daysLeft = calculateDaysDiff(row.dueDate);
                  const isOverdue = daysLeft < 0 && !isDone;

                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-[#F7F9FC] transition ${isDone ? 'bg-white' : isOverdue ? 'bg-rose-50/20' : 'bg-white'}`}
                    >
                      {/* Done Checkbox Column */}
                      <td className="p-3.5 text-center">
                        <div className="inline-flex items-center space-x-1.5">
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center border font-bold text-xs ${
                              isDone
                                ? 'bg-[#10B981] border-[#10B981] text-white'
                                : 'bg-white border-[#CBD5E1] text-transparent'
                            }`}
                            title={isDone ? 'Paid (Tick in Google Sheets)' : 'Pending (Tick in Google Sheets to mark paid)'}
                          >
                            ✓
                          </span>
                          <span className={`text-[11px] font-bold ${isDone ? 'text-[#10B981]' : isOverdue ? 'text-rose-600' : 'text-amber-700'}`}>
                            {isDone ? 'Paid' : isOverdue ? 'Overdue' : 'Pending'}
                          </span>
                        </div>
                      </td>

                      {/* Sr No */}
                      <td className="p-3.5 font-mono text-[#7D8499] text-xs">
                        #{row.srNo}
                      </td>

                      {/* Loan Name */}
                      <td className="p-3.5 font-bold text-[#171B3A]">
                        <div className="truncate max-w-[220px]" title={row.loanName}>
                          {row.loanName}
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="p-3.5 text-[#171B3A] tabular-nums">
                        <div>{row.dueDate}</div>
                        {!isDone && daysLeft >= 0 && daysLeft <= 15 && (
                          <span className="text-[10px] text-amber-700 font-semibold block">
                            Due in {daysLeft}d
                          </span>
                        )}
                        {isOverdue && (
                          <span className="text-[10px] text-rose-600 font-bold block">
                            Overdue by {Math.abs(daysLeft)}d
                          </span>
                        )}
                      </td>

                      {/* EMI Amount */}
                      <td className="p-3.5 text-right font-extrabold text-[#171B3A] tabular-nums">
                        {formatINR(row.emiAmount)}
                      </td>

                      {/* Principal */}
                      <td className="p-3.5 text-right font-medium text-[#7D8499] tabular-nums">
                        {row.principalAmount > 0 ? formatINR(row.principalAmount) : '—'}
                      </td>

                      {/* Interest */}
                      <td className="p-3.5 text-right font-medium text-[#7D8499] tabular-nums">
                        {row.interest > 0 ? formatINR(row.interest) : '—'}
                      </td>

                      {/* Balance */}
                      <td className="p-3.5 text-right font-bold text-[#171B3A] tabular-nums">
                        {row.balance > 0 ? formatINR(row.balance) : '—'}
                      </td>

                      {/* Payment Date */}
                      <td className="p-3.5 text-[#7D8499] tabular-nums">
                        {row.paymentDateTimestamp || (isDone ? 'Cleared' : '—')}
                      </td>

                      {/* Acknowledgement / Photo */}
                      <td className="p-3.5 text-center">
                        {row.acknowledgementUrl ? (
                          <a
                            href={row.acknowledgementUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded-lg text-[#3045F5] hover:bg-blue-50 inline-flex items-center space-x-1 font-semibold text-[11px]"
                          >
                            <span>Receipt</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[#CBD5E1] text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredRows.length > 100 && (
          <div className="p-3.5 bg-[#F7F9FC] text-center text-xs text-[#7D8499] border-t border-[#E8EBF2]">
            Showing first 100 of {filteredRows.length} installments. Filter by facility to view specific loan schedules.
          </div>
        )}
      </div>
    </div>
  );
};
