import React, { useState } from 'react';
import { EmiItem, ComplianceItem, GstPayableState } from '../types';
import { formatINR, calculateDaysDiff, getTodayStr } from '../utils/calculations';
import {
  Car,
  FileCheck2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  Building,
  CreditCard,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export type CashFlowHorizon = '5-Day' | '10-Day' | '15-Day' | 'Monthly';

interface CashFlowCommandCenterProps {
  emis: EmiItem[];
  compliance: ComplianceItem[];
  gstPayable?: GstPayableState;
  onUpdateGstPayable?: (updated: GstPayableState) => void;
  onNavigateTab: (tab: string) => void;
  openAiChatWithPrompt?: (prompt: string) => void;
  onRefreshSheet?: () => void;
  isRefreshingSheet?: boolean;
  lastUpdatedTime?: string;
  isLiveConnected?: boolean;
}

export const CashFlowCommandCenter: React.FC<CashFlowCommandCenterProps> = ({
  emis,
  compliance,
  onNavigateTab,
  openAiChatWithPrompt,
  onRefreshSheet,
  isRefreshingSheet,
  lastUpdatedTime,
  isLiveConnected = true,
}) => {
  const [activeHorizon, setActiveHorizon] = useState<CashFlowHorizon>('15-Day');

  const today = getTodayStr();

  // 1. DYNAMIC EMIs AGGREGATIONS (Strictly live from Google Sheets)
  const totalLoanLiability = emis.reduce((sum, e) => sum + (e.totalLoanValue || 0), 0);
  const totalRemainingDebt = emis.reduce((sum, e) => sum + (e.remainingBalance || 0), 0);
  const totalMonthlyEmi = emis.reduce((sum, e) => sum + (e.monthlyEmi || 0), 0);

  const pendingEmis = emis.filter((e) => e.status !== 'Paid');
  const paidEmis = emis.filter((e) => e.status === 'Paid');

  // 2. DYNAMIC COMPLIANCE AGGREGATIONS (Strictly live from Google Sheets)
  const pendingCompliance = compliance.filter((c) => c.status !== 'Filed');
  const completedCompliance = compliance.filter((c) => c.status === 'Filed');
  const overdueCompliance = compliance.filter(
    (c) => c.status !== 'Filed' && c.dueDate < today
  );
  const totalEstimatedLiability = pendingCompliance.reduce(
    (sum, c) => sum + (c.estimatedAmount || 0),
    0
  );

  // 3. HORIZON COMMITMENT CALCULATIONS
  const getHorizonDays = (h: CashFlowHorizon): number => {
    switch (h) {
      case '5-Day':
        return 5;
      case '10-Day':
        return 10;
      case '15-Day':
        return 15;
      case 'Monthly':
        return 30;
      default:
        return 15;
    }
  };

  const getHorizonEndDate = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().substring(0, 10);
  };

  const horizonDays = getHorizonDays(activeHorizon);
  const horizonEndDate = getHorizonEndDate(horizonDays);

  // EMIs falling into the active horizon
  const horizonEmis = emis.filter((e) => {
    if (e.status === 'Paid') return false;
    return e.nextDueDate >= today && e.nextDueDate <= horizonEndDate;
  });
  const horizonEmiTotal = horizonEmis.reduce((sum, e) => sum + e.monthlyEmi, 0);

  // Compliance falling into the active horizon
  const horizonCompliance = compliance.filter((c) => {
    if (c.status === 'Filed') return false;
    return c.dueDate >= today && c.dueDate <= horizonEndDate;
  });
  const horizonComplianceTotal = horizonCompliance.reduce(
    (sum, c) => sum + (c.estimatedAmount || 0),
    0
  );

  const totalCommittedOutflow = horizonEmiTotal + horizonComplianceTotal;

  // Chart data across the 4 horizons
  const horizonsData = (['5-Day', '10-Day', '15-Day', 'Monthly'] as CashFlowHorizon[]).map((h) => {
    const days = getHorizonDays(h);
    const end = getHorizonEndDate(days);

    const dueEmis = emis
      .filter((e) => e.status !== 'Paid' && e.nextDueDate >= today && e.nextDueDate <= end)
      .reduce((s, e) => s + e.monthlyEmi, 0);

    const dueComp = compliance
      .filter((c) => c.status !== 'Filed' && c.dueDate >= today && c.dueDate <= end)
      .reduce((s, c) => s + (c.estimatedAmount || 0), 0);

    return {
      id: h,
      label: h,
      emiOutflow: dueEmis,
      complianceOutflow: dueComp,
      totalOutflow: dueEmis + dueComp,
    };
  });

  const maxChartValue = Math.max(...horizonsData.map((d) => d.totalOutflow), 1000000);

  // 4. RECENT ACTIVITY & AUDIT TRAIL FROM LIVE GOOGLE SHEETS
  const recentActivities = [
    // Paid EMIs from sheet
    ...emis
      .filter((e) => e.status === 'Paid' || e.lastPaymentDate)
      .map((e) => ({
        id: `act-emi-${e.id}`,
        type: 'emi' as const,
        title: e.loanName,
        subtitle: `ACH Monthly Installment Cleared (${e.accountNo || e.lenderBank})`,
        amount: e.monthlyEmi,
        date: e.lastPaymentDate || e.nextDueDate,
        ref: e.accountNo || 'ACH-DEBIT',
        status: 'Paid',
      })),
    // Filed statutory compliance from sheet
    ...compliance
      .filter((c) => c.status === 'Filed' || c.filingDate)
      .map((c) => ({
        id: `act-comp-${c.id}`,
        type: 'compliance' as const,
        title: c.title,
        subtitle: `Filed via ${c.governingAuthority} • Period ${c.period}`,
        amount: c.estimatedAmount || 0,
        date: c.filingDate || c.dueDate,
        ref: c.arnChallanRef || 'ARN-VERIFIED',
        status: 'Filed',
      })),
  ].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & AI EXECUTIVE BRIEF TRIGGER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-5 border border-[#E8EBF2] shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-extrabold text-[#171B3A] tracking-tight">
              Executive Command & Operations
            </h2>
            <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              isLiveConnected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLiveConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span>{isLiveConnected ? 'Google Sheet Live' : 'Connection Error'}</span>
            </span>
          </div>
          <p className="text-xs text-[#7D8499] mt-1 font-medium">
            Live synchronization active • Auto-updates when checkboxes are toggled in Google Sheets • {lastUpdatedTime ? `Last sync: ${lastUpdatedTime}` : 'Polling every 15s'}
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          {onRefreshSheet && (
            <button
              onClick={onRefreshSheet}
              disabled={isRefreshingSheet}
              title="Force Sync with Google Sheets"
              className="px-3 py-2 rounded-xl bg-[#F7F9FC] hover:bg-white text-[#171B3A] border border-[#E8EBF2] font-semibold text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-2xs group"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#3045F5] ${isRefreshingSheet ? 'animate-spin' : 'group-hover:rotate-180 transition-transform'}`} />
              <span>{isRefreshingSheet ? 'Syncing...' : 'Sync Sheet'}</span>
            </button>
          )}

          {openAiChatWithPrompt && (
            <button
              onClick={() =>
                openAiChatWithPrompt(
                  `Provide an executive liquidity & compliance brief. Total loan liability is ${formatINR(totalLoanLiability)}, remaining balance is ${formatINR(totalRemainingDebt)}, monthly EMI outflow is ${formatINR(totalMonthlyEmi)}, with ${pendingEmis.length} pending EMIs and ${pendingCompliance.length} pending compliance filings.`
                )
              }
              className="px-4 py-2 rounded-xl bg-[#3045F5] hover:bg-[#2537D6] text-white font-bold text-xs flex items-center space-x-2 transition shadow-sm shadow-[#3045F5]/25 cursor-pointer active:scale-98"
            >
              <Sparkles className="w-4 h-4 text-blue-200" />
              <span>AI Executive Brief</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. 6 DYNAMIC KPI METRIC CARDS (Strictly Real Google Sheet Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Total Loan Liability */}
        <div className="bg-white rounded-2xl p-4.5 border border-[#E8EBF2] shadow-xs flex flex-col justify-between hover:border-[#3045F5]/30 transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#7D8499] uppercase tracking-wider">
              Total Loan Liability
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#3045F5] flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl sm:text-2xl font-black text-[#171B3A] tracking-tight tabular-nums">
              {formatINR(totalLoanLiability)}
            </h3>
            <p className="text-[11px] text-[#7D8499] mt-0.5 font-medium">
              {emis.length} Active loan facilities
            </p>
          </div>
        </div>

        {/* Card 2: Remaining Debt Balance */}
        <div className="bg-white rounded-2xl p-4.5 border border-[#E8EBF2] shadow-xs flex flex-col justify-between hover:border-[#3045F5]/30 transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#7D8499] uppercase tracking-wider">
              Remaining Principal
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl sm:text-2xl font-black text-indigo-700 tracking-tight tabular-nums">
              {formatINR(totalRemainingDebt)}
            </h3>
            <p className="text-[11px] text-indigo-600 mt-0.5 font-semibold">
              Principal debt outstanding
            </p>
          </div>
        </div>

        {/* Card 3: Monthly EMI Outflow */}
        <div className="bg-white rounded-2xl p-4.5 border border-[#E8EBF2] shadow-xs flex flex-col justify-between hover:border-[#3045F5]/30 transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#7D8499] uppercase tracking-wider">
              Monthly EMI Outflow
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl sm:text-2xl font-black text-rose-600 tracking-tight tabular-nums">
              {formatINR(totalMonthlyEmi)}
            </h3>
            <p className="text-[11px] text-rose-600 mt-0.5 font-semibold">
              Monthly recurring bank ACH
            </p>
          </div>
        </div>

        {/* Card 4: Pending EMIs Count */}
        <div className="bg-white rounded-2xl p-4.5 border border-[#E8EBF2] shadow-xs flex flex-col justify-between hover:border-[#3045F5]/30 transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#7D8499] uppercase tracking-wider">
              Pending EMIs
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl sm:text-2xl font-black text-amber-800 tracking-tight tabular-nums">
              {pendingEmis.length} Installments
            </h3>
            <p className="text-[11px] text-amber-700 mt-0.5 font-semibold">
              {paidEmis.length} Paid & Cleared
            </p>
          </div>
        </div>

        {/* Card 5: Pending Compliance Count */}
        <div className="bg-white rounded-2xl p-4.5 border border-[#E8EBF2] shadow-xs flex flex-col justify-between hover:border-[#3045F5]/30 transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#7D8499] uppercase tracking-wider">
              Pending Compliance
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl sm:text-2xl font-black text-purple-700 tracking-tight tabular-nums">
              {pendingCompliance.length} Filings
            </h3>
            <p className="text-[11px] text-purple-600 mt-0.5 font-semibold">
              {completedCompliance.length} Filed with ARN
            </p>
          </div>
        </div>

        {/* Card 6: Estimated Statutory Tax / Fee */}
        <div className="bg-white rounded-2xl p-4.5 border border-[#E8EBF2] shadow-xs flex flex-col justify-between hover:border-[#3045F5]/30 transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#7D8499] uppercase tracking-wider">
              Pending Tax / Fees
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl sm:text-2xl font-black text-[#171B3A] tracking-tight tabular-nums">
              {totalEstimatedLiability > 0 ? formatINR(totalEstimatedLiability) : 'Scheduled'}
            </h3>
            <p className="text-[11px] text-[#10B981] mt-0.5 font-semibold">
              Oct 2026 - Jan 2027 Schedule
            </p>
          </div>
        </div>
      </div>

      {/* 3. CASH FLOW HORIZON & COMMITTED OUTFLOW COMPARATIVE CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Horizon Comparative Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#E8EBF2] shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-[#171B3A] tracking-tight">
                Committed Debt & Statutory Outflows
              </h3>
              <p className="text-xs text-[#7D8499] mt-0.5">
                Upcoming bank EMI installments & regulatory tax payments across horizons.
              </p>
            </div>

            {/* Horizon Pill Selector */}
            <div className="inline-flex p-1 bg-[#F7F9FC] rounded-xl border border-[#E8EBF2] shrink-0 self-start sm:self-auto">
              {(['5-Day', '10-Day', '15-Day', 'Monthly'] as CashFlowHorizon[]).map((horizon) => (
                <button
                  key={horizon}
                  onClick={() => setActiveHorizon(horizon)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeHorizon === horizon
                      ? 'bg-white text-[#3045F5] shadow-xs border border-[#E8EBF2]'
                      : 'text-[#7D8499] hover:text-[#171B3A]'
                  }`}
                >
                  {horizon}
                </button>
              ))}
            </div>
          </div>

          {/* Comparative Horizon Outflow Bars */}
          <div className="space-y-4 pt-2">
            {horizonsData.map((d) => {
              const isCurrent = d.id === activeHorizon;
              const emiWidth = Math.min(100, Math.round((d.emiOutflow / maxChartValue) * 100));
              const compWidth = Math.min(100, Math.round((d.complianceOutflow / maxChartValue) * 100));

              return (
                <div
                  key={d.id}
                  onClick={() => setActiveHorizon(d.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-[#EFF2FE]/40 border-[#3045F5]/30 shadow-2xs'
                      : 'bg-white border-[#E8EBF2] hover:bg-[#F7F9FC]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-extrabold ${isCurrent ? 'text-[#3045F5]' : 'text-[#171B3A]'}`}>
                        {d.label} Window
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] bg-[#3045F5] text-white px-2 py-0.2 rounded-full font-bold">
                          Active
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-extrabold text-[#171B3A] tabular-nums">
                      {formatINR(d.totalOutflow)}
                    </span>
                  </div>

                  {/* Stacked Progress Bar */}
                  <div className="w-full h-3 bg-[#E8EBF2] rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${emiWidth}%` }}
                      className="bg-rose-500 h-full transition-all duration-500"
                      title={`EMIs: ${formatINR(d.emiOutflow)}`}
                    />
                    <div
                      style={{ width: `${compWidth}%` }}
                      className="bg-purple-500 h-full transition-all duration-500"
                      title={`Compliance: ${formatINR(d.complianceOutflow)}`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#7D8499] mt-2">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                      <span>EMIs: {formatINR(d.emiOutflow)}</span>
                    </span>
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                      <span>Tax & Compliance: {formatINR(d.complianceOutflow)}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Active Horizon Summary Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#E8EBF2] shadow-xs flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#7D8499] uppercase tracking-wider">
                {activeHorizon} Obligation
              </span>
              <span className="text-[11px] text-[#3045F5] font-semibold">
                Thru {horizonEndDate}
              </span>
            </div>

            <div className="mt-4">
              <span className="text-xs text-[#7D8499] block font-medium">Total Liquidity Required</span>
              <h4 className="text-3xl font-black text-rose-600 tracking-tight tabular-nums mt-0.5">
                {formatINR(totalCommittedOutflow)}
              </h4>
            </div>

            <div className="mt-6 space-y-3">
              <div className="p-3 rounded-xl bg-[#F7F9FC] border border-[#E8EBF2] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#171B3A] block">Due EMIs</span>
                  <span className="text-[11px] text-[#7D8499]">{horizonEmis.length} Loan installments</span>
                </div>
                <span className="text-xs font-extrabold text-rose-600 tabular-nums">
                  {formatINR(horizonEmiTotal)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#F7F9FC] border border-[#E8EBF2] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#171B3A] block">Due Statutory Filings</span>
                  <span className="text-[11px] text-[#7D8499]">{horizonCompliance.length} Returns</span>
                </div>
                <span className="text-xs font-extrabold text-purple-700 tabular-nums">
                  {formatINR(horizonComplianceTotal)}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E8EBF2] space-y-2">
            <button
              onClick={() => onNavigateTab('emis')}
              className="w-full py-2.5 px-3 rounded-xl bg-[#F7F9FC] hover:bg-[#EFF2FE] text-[#3045F5] font-bold text-xs flex items-center justify-between transition cursor-pointer border border-[#E8EBF2] hover:border-[#3045F5]/30"
            >
              <span>Manage Loan Facilities</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigateTab('compliance')}
              className="w-full py-2.5 px-3 rounded-xl bg-[#F7F9FC] hover:bg-[#EFF2FE] text-[#3045F5] font-bold text-xs flex items-center justify-between transition cursor-pointer border border-[#E8EBF2] hover:border-[#3045F5]/30"
            >
              <span>View Compliance Schedule</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. ACTIVE LOAN FACILITIES AT A GLANCE */}
      <div className="bg-white rounded-2xl p-6 border border-[#E8EBF2] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-[#171B3A] tracking-tight">
              Active Loan Facilities & Amortization
            </h3>
            <p className="text-xs text-[#7D8499] mt-0.5">
              Live status from the EMIs Google Sheet • {emis.length} verified credit facilities
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('emis')}
            className="text-xs font-bold text-[#3045F5] hover:underline flex items-center space-x-1 cursor-pointer"
          >
            <span>View Full Schedule</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 pt-1">
          {emis.map((loan) => {
            const isSettled = loan.status === 'Paid';
            const daysLeft = calculateDaysDiff(loan.nextDueDate);

            return (
              <div
                key={loan.id}
                className="p-4 rounded-xl border border-[#E8EBF2] bg-[#F7F9FC]/60 hover:bg-white hover:border-[#3045F5]/30 transition flex flex-col justify-between space-y-3"
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

      {/* 5. TWO-COLUMN SPLIT: UPCOMING EMIs & STATUTORY FILINGS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Scheduled EMIs in Horizon */}
        <div className="bg-white rounded-2xl border border-[#E8EBF2] shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E8EBF2] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Car className="w-4 h-4 text-[#3045F5]" />
              <h4 className="font-extrabold text-sm text-[#171B3A]">
                Upcoming Bank EMI Debits ({horizonEmis.length})
              </h4>
            </div>
            <span className="text-[11px] text-[#7D8499] font-medium">
              Within {activeHorizon}
            </span>
          </div>

          <div className="divide-y divide-[#E8EBF2]">
            {horizonEmis.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#7D8499]">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                No EMI installments due in the current {activeHorizon} window.
              </div>
            ) : (
              horizonEmis.map((e) => (
                <div key={e.id} className="p-4 hover:bg-[#F7F9FC] transition flex items-center justify-between">
                  <div className="min-w-0 pr-3">
                    <span className="font-bold text-xs text-[#171B3A] block truncate">
                      {e.loanName}
                    </span>
                    <div className="flex items-center space-x-2 text-[10px] text-[#7D8499] mt-0.5">
                      <span>{e.lenderBank}</span>
                      <span>•</span>
                      <span className="text-rose-600 font-semibold">Due {e.nextDueDate}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-extrabold text-xs text-[#171B3A] block tabular-nums">
                      {formatINR(e.monthlyEmi)}
                    </span>
                    <span className="text-[10px] text-amber-700 font-medium">
                      ACH Debit
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Upcoming Statutory Compliance */}
        <div className="bg-white rounded-2xl border border-[#E8EBF2] shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E8EBF2] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileCheck2 className="w-4 h-4 text-purple-600" />
              <h4 className="font-extrabold text-sm text-[#171B3A]">
                Upcoming Statutory Filings ({horizonCompliance.length})
              </h4>
            </div>
            <span className="text-[11px] text-[#7D8499] font-medium">
              Within {activeHorizon}
            </span>
          </div>

          <div className="divide-y divide-[#E8EBF2]">
            {horizonCompliance.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#7D8499]">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                No statutory compliance filings due in the current {activeHorizon} window.
              </div>
            ) : (
              horizonCompliance.map((c) => (
                <div key={c.id} className="p-4 hover:bg-[#F7F9FC] transition flex items-center justify-between">
                  <div className="min-w-0 pr-3">
                    <span className="font-bold text-xs text-[#171B3A] block truncate">
                      {c.title}
                    </span>
                    <div className="flex items-center space-x-2 text-[10px] text-[#7D8499] mt-0.5">
                      <span>{c.governingAuthority}</span>
                      <span>•</span>
                      <span className="text-rose-600 font-semibold">Deadline: {c.dueDate}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-extrabold text-xs text-purple-700 block tabular-nums">
                      {c.estimatedAmount ? formatINR(c.estimatedAmount) : 'Statutory Return'}
                    </span>
                    <span className="text-[10px] text-purple-600 font-medium">
                      {c.period}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 6. RECENT ACTIVITY & OPERATIONS LEDGER (Live audit trail from Google Sheets) */}
      <div className="bg-white rounded-2xl border border-[#E8EBF2] shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E8EBF2] flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-[#171B3A]">
              Recent Activity & Operations Ledger
            </h3>
            <p className="text-xs text-[#7D8499] mt-0.5">
              Live audit trail of completed EMI payments and filed statutory returns from Google Sheets.
            </p>
          </div>
          <span className="text-xs font-semibold text-[#7D8499]">
            {recentActivities.length} cleared events recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F9FC] text-[#7D8499] border-b border-[#E8EBF2] uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Description</th>
                <th className="p-3.5">Reference / ARN</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5 text-right">Amount (₹)</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EBF2]">
              {recentActivities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#7D8499]">
                    No cleared activities recorded yet in the Google Sheet.
                  </td>
                </tr>
              ) : (
                recentActivities.slice(0, 10).map((act) => (
                  <tr key={act.id} className="hover:bg-[#F7F9FC] transition">
                    <td className="p-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        act.type === 'emi'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}>
                        {act.type === 'emi' ? 'Loan EMI' : 'Compliance'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-[#171B3A] block">{act.title}</span>
                      <span className="text-[10px] text-[#7D8499] block">{act.subtitle}</span>
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-[#7D8499]">
                      {act.ref}
                    </td>
                    <td className="p-3.5 text-[#171B3A] tabular-nums">
                      {act.date || '—'}
                    </td>
                    <td className="p-3.5 text-right font-extrabold text-[#171B3A] tabular-nums">
                      {act.amount > 0 ? formatINR(act.amount) : '—'}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {act.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
