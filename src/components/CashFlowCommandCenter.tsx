import React, { useState } from 'react';
import {
  DebtorItem,
  CreditorItem,
  EmiItem,
  ComplianceItem,
  CashFlowSummary,
  CashFlowHorizon,
  HorizonCashFlowDetails,
  GstPayableState,
} from '../types';
import { calculate5DayCashFlow, formatINR, getTodayStr } from '../utils/calculations';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Sparkles,
  AlertTriangle,
  Building2,
  Factory,
  Landmark,
  Coins,
  MapPin,
  Edit3,
  ExternalLink,
  Clock,
  Layers,
  CheckCircle2,
  PieChart as PieIcon,
  BarChart3,
  X,
  CreditCard,
  Car,
  FileCheck2,
} from 'lucide-react';

interface CashFlowCommandCenterProps {
  debtors: DebtorItem[];
  creditors: CreditorItem[];
  emis: EmiItem[];
  compliance: ComplianceItem[];
  gstPayable?: GstPayableState;
  onUpdateGstPayable?: (updated: GstPayableState) => void;
  onNavigateTab: (tab: string) => void;
  onOpenAiDraftEmail: (clientEntity: string) => void;
  openAiChatWithPrompt: (prompt: string) => void;
}

export const CashFlowCommandCenter: React.FC<CashFlowCommandCenterProps> = ({
  debtors,
  creditors,
  emis,
  compliance,
  gstPayable,
  onUpdateGstPayable,
  onNavigateTab,
  onOpenAiDraftEmail,
  openAiChatWithPrompt,
}) => {
  const [selectedHorizon, setSelectedHorizon] = useState<CashFlowHorizon>('5-Day');
  const [startDateStr, setStartDateStr] = useState<string>('2026-04-01');
  const [todayDateStr, setTodayDateStr] = useState<string>(getTodayStr());

  // Today's GST Payable & Receivable State & Editing
  const currentGst: GstPayableState = gstPayable || {
    mumbai: { payable: 425000, receivable: 150000 },
    chennai: { payable: 280000, receivable: 95000 },
    goa: { payable: 145000, receivable: 40000 },
    lastUpdated: new Date().toISOString().split('T')[0],
  };

  const getLocGst = (loc: any) => {
    if (typeof loc === 'number') return { payable: loc, receivable: 0 };
    return { payable: loc?.payable || 0, receivable: loc?.receivable || 0 };
  };

  const mumbaiGst = getLocGst(currentGst.mumbai);
  const chennaiGst = getLocGst(currentGst.chennai);
  const goaGst = getLocGst(currentGst.goa);

  const [isEditingGst, setIsEditingGst] = useState(false);
  const [editMumbaiPayable, setEditMumbaiPayable] = useState<number>(mumbaiGst.payable);
  const [editMumbaiReceivable, setEditMumbaiReceivable] = useState<number>(mumbaiGst.receivable);

  const [editChennaiPayable, setEditChennaiPayable] = useState<number>(chennaiGst.payable);
  const [editChennaiReceivable, setEditChennaiReceivable] = useState<number>(chennaiGst.receivable);

  const [editGoaPayable, setEditGoaPayable] = useState<number>(goaGst.payable);
  const [editGoaReceivable, setEditGoaReceivable] = useState<number>(goaGst.receivable);

  const handleOpenEditGst = () => {
    setEditMumbaiPayable(mumbaiGst.payable);
    setEditMumbaiReceivable(mumbaiGst.receivable);
    setEditChennaiPayable(chennaiGst.payable);
    setEditChennaiReceivable(chennaiGst.receivable);
    setEditGoaPayable(goaGst.payable);
    setEditGoaReceivable(goaGst.receivable);
    setIsEditingGst(true);
  };

  const handleSaveGst = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: GstPayableState = {
      mumbai: { payable: Number(editMumbaiPayable) || 0, receivable: Number(editMumbaiReceivable) || 0 },
      chennai: { payable: Number(editChennaiPayable) || 0, receivable: Number(editChennaiReceivable) || 0 },
      goa: { payable: Number(editGoaPayable) || 0, receivable: Number(editGoaReceivable) || 0 },
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    if (onUpdateGstPayable) {
      onUpdateGstPayable(updated);
    }
    setIsEditingGst(false);
  };

  const totalGstPayable = mumbaiGst.payable + chennaiGst.payable + goaGst.payable;
  const totalGstReceivable = mumbaiGst.receivable + chennaiGst.receivable + goaGst.receivable;
  const netGstPosition = totalGstPayable - totalGstReceivable;

  const todayFormattedDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const summary: CashFlowSummary = calculate5DayCashFlow(debtors, creditors, emis, compliance, todayDateStr, startDateStr);

  // Determine active horizon details
  let activeDetails: HorizonCashFlowDetails;
  if (selectedHorizon === '10-Day') {
    activeDetails = summary.horizon10Day;
  } else if (selectedHorizon === '15-Day') {
    activeDetails = summary.horizon15Day;
  } else if (selectedHorizon === 'Monthly') {
    activeDetails = summary.horizonMonthly;
  } else {
    activeDetails = summary.horizon5Day;
  }

  const isPositiveNet = activeDetails.netCashPosition >= 0;

  // Breakdown metrics for the active horizon
  const creditorsTotal = activeDetails.outflows.creditors.reduce((sum, c) => sum + c.amount, 0);
  const emisTotal = activeDetails.outflows.emis.reduce((sum, e) => sum + e.monthlyEmi, 0);
  const complianceTotal = activeDetails.outflows.compliance.reduce((sum, c) => sum + (c.estimatedAmount || 0), 0);
  const totalOutflowsComputed = creditorsTotal + emisTotal + complianceTotal;

  // Percentages for outflow distribution chart
  const safeOutflows = totalOutflowsComputed > 0 ? totalOutflowsComputed : 1;
  const creditorsPct = Math.round((creditorsTotal / safeOutflows) * 100);
  const emisPct = Math.round((emisTotal / safeOutflows) * 100);
  const compliancePct = Math.round((complianceTotal / safeOutflows) * 100);

  // Horizon comparison bars data for the chart
  const horizonsData = [
    {
      id: '5-Day' as CashFlowHorizon,
      label: '5-Day',
      sublabel: summary.horizon5Day.dateRangeText,
      inflow: summary.horizon5Day.totalInflow,
      outflow: summary.horizon5Day.totalOutflow,
      net: summary.horizon5Day.netCashPosition,
    },
    {
      id: '10-Day' as CashFlowHorizon,
      label: '10-Day',
      sublabel: summary.horizon10Day.dateRangeText,
      inflow: summary.horizon10Day.totalInflow,
      outflow: summary.horizon10Day.totalOutflow,
      net: summary.horizon10Day.netCashPosition,
    },
    {
      id: '15-Day' as CashFlowHorizon,
      label: '15-Day',
      sublabel: summary.horizon15Day.dateRangeText,
      inflow: summary.horizon15Day.totalInflow,
      outflow: summary.horizon15Day.totalOutflow,
      net: summary.horizon15Day.netCashPosition,
    },
    {
      id: 'Monthly' as CashFlowHorizon,
      label: 'Monthly',
      sublabel: summary.horizonMonthly.dateRangeText,
      inflow: summary.horizonMonthly.totalInflow,
      outflow: summary.horizonMonthly.totalOutflow,
      net: summary.horizonMonthly.netCashPosition,
    },
  ];

  const maxChartValue = Math.max(
    ...horizonsData.map((d) => Math.max(d.inflow, d.outflow)),
    1000000
  );

  // Real enterprise metrics for 6 dynamic KPI cards
  const totalReceivables = debtors.reduce((sum, d) => sum + (d.status !== 'Paid' ? d.amount : 0), 0);
  const overdueDebtorsCount = debtors.filter((d) => d.status === 'Overdue').length;
  const totalOverdueAmount = debtors.filter((d) => d.status === 'Overdue').reduce((sum, d) => sum + d.amount, 0);

  const totalCreditorsUnpaid = creditors.reduce((sum, c) => sum + (c.status !== 'Paid' ? c.amount : 0), 0);
  const pendingCreditorsCount = creditors.filter((c) => c.status !== 'Paid').length;

  const totalMonthlyEmi = emis.reduce((sum, e) => sum + (e.monthlyEmi || 0), 0);
  const activeEmisCount = emis.filter((e) => e.status !== 'Paid').length;

  const pendingComplianceCount = compliance.filter((c) => c.status === 'Pending').length;
  const totalComplianceEstimated = compliance
    .filter((c) => c.status === 'Pending')
    .reduce((sum, c) => sum + (c.estimatedAmount || 0), 0);

  const uniqueClientsCount = new Set(debtors.map((d) => d.clientEntity.trim())).size;
  const uniqueVendorsCount = new Set(creditors.map((c) => c.vendorEntity.trim())).size;

  // Real recent activities from all modules
  const recentActivities = [
    ...debtors
      .filter((d) => d.status === 'Paid' || d.lastPaymentDate)
      .map((d) => ({
        id: `act-deb-${d.id}`,
        type: 'receipt' as const,
        title: d.clientEntity,
        subtitle: `Invoice ${d.invoiceRef || d.id} cleared`,
        amount: d.amount,
        date: d.lastPaymentDate || d.dueDate,
        ref: d.invoiceRef || d.id,
        status: 'Collected',
      })),
    ...creditors
      .filter((c) => c.status === 'Paid' || c.utrNumber)
      .map((c) => ({
        id: `act-crd-${c.id}`,
        type: 'payout' as const,
        title: c.vendorEntity,
        subtitle: c.utrNumber ? `UTR: ${c.utrNumber}` : 'Vendor bill cleared via RTGS/NEFT',
        amount: c.amount,
        date: c.paidDate || c.dueDate,
        ref: c.utrNumber || c.id,
        status: 'Disbursed',
      })),
    ...emis
      .filter((e) => e.lastPaymentDate || e.lastPaymentRef)
      .map((e) => ({
        id: `act-emi-${e.id}`,
        type: 'emi' as const,
        title: e.loanName,
        subtitle: `Bank ACH installment debited (${e.accountNo})`,
        amount: e.monthlyEmi,
        date: e.lastPaymentDate || e.nextDueDate,
        ref: e.lastPaymentRef || e.accountNo,
        status: 'Debited',
      })),
    ...compliance
      .filter((comp) => comp.status === 'Filed' || comp.arnNumber)
      .map((comp) => ({
        id: `act-cmp-${comp.id}`,
        type: 'compliance' as const,
        title: comp.title,
        subtitle: comp.arnNumber ? `ARN: ${comp.arnNumber}` : 'Portal statutory return submitted',
        amount: comp.estimatedAmount || 0,
        date: comp.filedDate || comp.dueDate,
        ref: comp.arnNumber || comp.id,
        status: 'Filed',
      })),
  ].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 7);

  return (
    <div className="space-y-6">
      {/* Overview Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#161A2F] tracking-tight">
            Overview
          </h1>
          <p className="text-xs sm:text-sm text-[#7C8499] mt-0.5 font-medium">
            Monitor your operations, financial activity and pending actions.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() =>
              openAiChatWithPrompt(
                'Generate an executive operations brief of Llabdhi Manufacturing LLP highlighting upcoming receivables, vendor commitments, and tax obligations.'
              )
            }
            className="px-3.5 py-2 rounded-xl bg-white border border-[#E6E9F0] text-[#161A2F] hover:border-[#3045F5]/30 text-xs font-bold inline-flex items-center space-x-1.5 shadow-2xs transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#3045F5]" />
            <span>AI Executive Brief</span>
          </button>
        </div>
      </div>

      {/* 1. HORIZON SELECTOR & CONTROL BAR */}
      <div className="bg-white rounded-2xl border border-[#E6E9F0] p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Date Filter Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#EFF2FE] text-[#3045F5] flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#161A2F] block">
                Cash Flow Horizon
              </span>
              <span className="text-[10px] text-[#7C8499]">
                Active Window: {activeDetails.dateRangeText}
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-[#E6E9F0] hidden sm:block" />

          {/* Date Pickers */}
          <div className="flex items-center space-x-2 bg-[#F6F8FC] border border-[#E6E9F0] px-3 py-1.5 rounded-xl">
            <Calendar className="w-3.5 h-3.5 text-[#3045F5]" />
            <span className="text-[11px] font-semibold text-[#7C8499]">Start:</span>
            <input
              type="date"
              value={startDateStr}
              onChange={(e) => setStartDateStr(e.target.value)}
              className="bg-transparent border-none text-[11px] font-bold text-[#161A2F] focus:outline-none cursor-pointer"
            />
          </div>

          <div className="flex items-center space-x-2 bg-[#F6F8FC] border border-[#E6E9F0] px-3 py-1.5 rounded-xl">
            <Clock className="w-3.5 h-3.5 text-[#3045F5]" />
            <span className="text-[11px] font-semibold text-[#7C8499]">Today:</span>
            <input
              type="date"
              value={todayDateStr}
              onChange={(e) => setTodayDateStr(e.target.value)}
              className="bg-transparent border-none text-[11px] font-bold text-[#161A2F] focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Horizon Segmented Control Buttons */}
        <div className="inline-flex p-1 bg-[#F6F8FC] rounded-xl border border-[#E6E9F0] self-start lg:self-auto">
          {(['5-Day', '10-Day', '15-Day', 'Monthly'] as CashFlowHorizon[]).map((hz) => {
            const isSelected = selectedHorizon === hz;
            return (
              <button
                key={hz}
                onClick={() => setSelectedHorizon(hz)}
                className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-white text-[#3045F5] shadow-xs'
                    : 'text-[#7C8499] hover:text-[#161A2F]'
                }`}
              >
                {hz === '5-Day' && '⚡ 5-Day'}
                {hz === '10-Day' && '⚡ 10-Day'}
                {hz === '15-Day' && '📅 15-Day'}
                {hz === 'Monthly' && '📆 Monthly (30D)'}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. DYNAMIC 6 KPI STAT CARDS (Strictly calculated from real existing data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Net Cash Position */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E6E9F0] shadow-xs hover:border-[#3045F5]/30 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#7C8499] uppercase tracking-wider">
              {activeDetails.horizonLabel} Net
            </span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isPositiveNet ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}
            >
              {isPositiveNet ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
            </div>
          </div>

          <div className="mt-3">
            <h3
              className={`text-xl lg:text-2xl font-extrabold tracking-tight tabular-nums ${
                isPositiveNet ? 'text-[#161A2F]' : 'text-rose-600'
              }`}
            >
              {formatINR(activeDetails.netCashPosition)}
            </h3>

            <div className="mt-2 flex items-center space-x-1.5">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isPositiveNet
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-rose-50 text-rose-700'
                }`}
              >
                {isPositiveNet ? 'Surplus' : 'Deficit'}
              </span>
              <span className="text-[10px] text-[#7C8499]">
                in {activeDetails.daysWindow} days
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Outstanding Receivables (AR) */}
        <div
          onClick={() => onNavigateTab('debtors')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E6E9F0] shadow-xs hover:border-[#3045F5]/30 transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#7C8499] uppercase tracking-wider">
              Receivables (AR)
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <h3 className="text-xl lg:text-2xl font-extrabold text-[#161A2F] tracking-tight tabular-nums">
              {formatINR(totalReceivables)}
            </h3>

            <div className="mt-2 flex items-center space-x-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                {debtors.filter((d) => d.status !== 'Paid').length} invoices
              </span>
              {overdueDebtorsCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700">
                  {overdueDebtorsCount} overdue
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Pending Vendor Payables (AP) */}
        <div
          onClick={() => onNavigateTab('creditors')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E6E9F0] shadow-xs hover:border-[#3045F5]/30 transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#7C8499] uppercase tracking-wider">
              Payables (AP)
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <h3 className="text-xl lg:text-2xl font-extrabold text-[#161A2F] tracking-tight tabular-nums">
              {formatINR(totalCreditorsUnpaid)}
            </h3>

            <div className="mt-2 flex items-center space-x-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">
                {pendingCreditorsCount} pending bills
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Monthly Recurring Debt (EMIs) */}
        <div
          onClick={() => onNavigateTab('emis')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E6E9F0] shadow-xs hover:border-[#3045F5]/30 transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#7C8499] uppercase tracking-wider">
              Monthly Debt (EMI)
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#EFF2FE] text-[#3045F5] flex items-center justify-center group-hover:scale-105 transition">
              <Car className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <h3 className="text-xl lg:text-2xl font-extrabold text-[#161A2F] tracking-tight tabular-nums">
              {formatINR(totalMonthlyEmi)}
            </h3>

            <div className="mt-2 flex items-center space-x-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EFF2FE] text-[#3045F5]">
                {activeEmisCount} active loans
              </span>
              <span className="text-[10px] text-[#7C8499]">ACH debits</span>
            </div>
          </div>
        </div>

        {/* Card 5: Statutory Filings & GST */}
        <div
          onClick={() => onNavigateTab('compliance')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E6E9F0] shadow-xs hover:border-[#3045F5]/30 transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#7C8499] uppercase tracking-wider">
              Statutory Dues
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <h3 className="text-xl lg:text-2xl font-extrabold text-[#161A2F] tracking-tight tabular-nums">
              {formatINR(totalGstPayable)}
            </h3>

            <div className="mt-2 flex items-center space-x-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                {pendingComplianceCount} filings pending
              </span>
              <span className="text-[10px] text-[#7C8499]">3 Units</span>
            </div>
          </div>
        </div>

        {/* Card 6: Enterprise Counterparties */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E6E9F0] shadow-xs hover:border-[#3045F5]/30 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#7C8499] uppercase tracking-wider">
              Partners
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <h3 className="text-xl lg:text-2xl font-extrabold text-[#161A2F] tracking-tight tabular-nums">
              {uniqueClientsCount + uniqueVendorsCount}
            </h3>

            <div className="mt-2 flex items-center space-x-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                {uniqueClientsCount} Clients
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                {uniqueVendorsCount} Vendors
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. ANALYTICS & VISUAL BREAKDOWN SECTION (Inspired by Reference Benchmark) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Liquidity Horizon Comparison Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E8EBF2] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8EBF2]">
            <div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-[#3045F5]" />
                <h3 className="font-extrabold text-sm sm:text-base text-[#171B3A]">
                  Cash Flow Activity Across Horizons
                </h3>
              </div>
              <p className="text-xs text-[#7D8499] mt-0.5">
                Comparison of Expected Inflows vs Committed Outflows
              </p>
            </div>

            {/* Chart Legend */}
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#10B981]" />
                <span className="text-[#171B3A] font-semibold text-xs">Inflow (AR)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#3045F5]" />
                <span className="text-[#171B3A] font-semibold text-xs">Outflow (AP)</span>
              </div>
            </div>
          </div>

          {/* Comparative Bars Grid */}
          <div className="py-6">
            <div className="grid grid-cols-4 gap-3 sm:gap-6 h-52 sm:h-60 items-end">
              {horizonsData.map((item) => {
                const inflowHeight = Math.max(12, Math.round((item.inflow / maxChartValue) * 100));
                const outflowHeight = Math.max(12, Math.round((item.outflow / maxChartValue) * 100));
                const isCurrent = selectedHorizon === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedHorizon(item.id)}
                    className={`flex flex-col items-center justify-end h-full p-2 rounded-xl transition cursor-pointer group ${
                      isCurrent ? 'bg-[#EFF2FE]/60 border border-[#3045F5]/20' : 'hover:bg-[#F7F9FC]'
                    }`}
                  >
                    {/* Bar pair */}
                    <div className="w-full flex items-end justify-center space-x-2 sm:space-x-3 h-40">
                      {/* Inflow Bar */}
                      <div className="w-3 sm:w-6 flex flex-col items-center justify-end h-full">
                        <div
                          style={{ height: `${inflowHeight}%` }}
                          className="w-full bg-[#10B981] rounded-t-md transition-all duration-300 group-hover:opacity-90 shadow-2xs"
                          title={`Inflow: ${formatINR(item.inflow)}`}
                        />
                      </div>

                      {/* Outflow Bar */}
                      <div className="w-3 sm:w-6 flex flex-col items-center justify-end h-full">
                        <div
                          style={{ height: `${outflowHeight}%` }}
                          className="w-full bg-[#3045F5] rounded-t-md transition-all duration-300 group-hover:opacity-90 shadow-2xs"
                          title={`Outflow: ${formatINR(item.outflow)}`}
                        />
                      </div>
                    </div>

                    {/* Bottom Label */}
                    <div className="mt-3 text-center">
                      <span
                        className={`text-xs font-bold block ${
                          isCurrent ? 'text-[#3045F5]' : 'text-[#171B3A]'
                        }`}
                      >
                        {item.label}
                      </span>
                      <span className="text-[10px] text-[#7D8499] block font-mono">
                        {item.net >= 0 ? '+' : ''}{formatINR(item.net)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-[#E8EBF2] flex items-center justify-between text-xs text-[#7D8499]">
            <span>Click any horizon column to inspect obligations</span>
            <button
              onClick={() =>
                openAiChatWithPrompt(
                  `Analyze the 5-Day vs 15-Day vs Monthly cash flow projections for Llabdhi Manufacturing LLP and highlight high-risk liquidity dates.`
                )
              }
              className="text-[#3045F5] font-semibold hover:underline inline-flex items-center space-x-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>AI Liquidity Projection</span>
            </button>
          </div>
        </div>

        {/* Right 1 Col: Outflow Allocation Breakdown ("Expense Statistics") */}
        <div className="bg-white rounded-2xl border border-[#E8EBF2] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#E8EBF2]">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-[#171B3A]">
                  Outflow Allocation
                </h3>
                <p className="text-xs text-[#7D8499] mt-0.5">
                  {activeDetails.horizonLabel} window distribution
                </p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-[#EFF2FE] text-[#3045F5] flex items-center justify-center">
                <PieIcon className="w-4 h-4" />
              </div>
            </div>

            {/* Total Metric */}
            <div className="my-5 text-center p-4 bg-[#F7F9FC] rounded-xl border border-[#E8EBF2]">
              <span className="text-[11px] font-semibold text-[#7D8499] uppercase tracking-wider block">
                Total Committed Outflows
              </span>
              <span className="text-2xl font-black text-[#171B3A] tabular-nums mt-1 block">
                {formatINR(totalOutflowsComputed)}
              </span>
            </div>

            {/* Visual Proportional Bar */}
            <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100">
              <div
                style={{ width: `${creditorsPct}%` }}
                className="bg-[#3045F5]"
                title={`Creditors: ${creditorsPct}%`}
              />
              <div
                style={{ width: `${emisPct}%` }}
                className="bg-[#6366F1]"
                title={`EMIs: ${emisPct}%`}
              />
              <div
                style={{ width: `${compliancePct}%` }}
                className="bg-[#F59E0B]"
                title={`Compliance: ${compliancePct}%`}
              />
            </div>

            {/* Breakdown List */}
            <div className="mt-5 space-y-3">
              {/* Creditors AP */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3045F5]" />
                  <span className="font-medium text-[#171B3A]">Creditors (Raw Materials)</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-[#171B3A] tabular-nums block">
                    {formatINR(creditorsTotal)}
                  </span>
                  <span className="text-[10px] text-[#7D8499]">{creditorsPct}%</span>
                </div>
              </div>

              {/* Vehicle EMIs */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#6366F1]" />
                  <span className="font-medium text-[#171B3A]">Vehicle Loan EMIs</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-[#171B3A] tabular-nums block">
                    {formatINR(emisTotal)}
                  </span>
                  <span className="text-[10px] text-[#7D8499]">{emisPct}%</span>
                </div>
              </div>

              {/* Compliance & Taxes */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                  <span className="font-medium text-[#171B3A]">LLP Statutory & Tax</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-[#171B3A] tabular-nums block">
                    {formatINR(complianceTotal)}
                  </span>
                  <span className="text-[10px] text-[#7D8499]">{compliancePct}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E8EBF2] mt-4 flex items-center justify-between">
            <span className="text-[11px] text-[#7D8499]">
              {activeDetails.outflows.creditors.length + activeDetails.outflows.emis.length + activeDetails.outflows.compliance.length} total obligations
            </span>
            <button
              onClick={() => onNavigateTab('creditors')}
              className="text-xs font-semibold text-[#3045F5] hover:underline cursor-pointer"
            >
              Review Creditors
            </button>
          </div>
        </div>
      </div>

      {/* 4. TODAY'S GST SUMMARY: 3 MANUFACTURING UNITS */}
      <div className="bg-white rounded-2xl border border-[#E8EBF2] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8EBF2] pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-sm sm:text-base text-[#171B3A]">
                  Daily GST Statutory Tracker
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                  {todayFormattedDate}
                </span>
              </div>
              <p className="text-xs text-[#7D8499] mt-0.5">
                GST Payable vs Available Input Tax Credit across active registrations
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-4 text-right">
              <div>
                <span className="text-[10px] font-bold text-[#7D8499] uppercase block">
                  Total Payable
                </span>
                <span className="text-sm font-extrabold text-rose-600 tabular-nums">
                  {formatINR(totalGstPayable)}
                </span>
              </div>
              <div className="h-6 w-px bg-[#E8EBF2]" />
              <div>
                <span className="text-[10px] font-bold text-[#7D8499] uppercase block">
                  Total Available
                </span>
                <span className="text-sm font-extrabold text-[#10B981] tabular-nums">
                  {formatINR(totalGstReceivable)}
                </span>
              </div>
            </div>

            <button
              onClick={handleOpenEditGst}
              className="px-3.5 py-2 rounded-xl bg-[#171B3A] hover:bg-[#252A4A] text-white font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>Update GST</span>
            </button>
          </div>
        </div>

        {/* 3 DISTINCT LOCATION BOXES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Mumbai */}
          <div className="p-4 rounded-xl border border-[#E8EBF2] bg-[#F7F9FC]/70 hover:border-[#3045F5]/30 transition space-y-3">
            <div className="flex items-center justify-between border-b border-[#E8EBF2] pb-2.5">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-[#EFF2FE] text-[#3045F5]">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-[#171B3A] uppercase tracking-wide">
                    GST - Mumbai
                  </h4>
                  <span className="text-[10px] text-[#7D8499] font-mono">27AAAAL1234F1Z0 (MH)</span>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>

            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-white border border-[#E8EBF2] flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-600">Payable</span>
                <span className="text-base font-extrabold text-rose-600 tabular-nums">
                  {formatINR(mumbaiGst.payable)}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-[#E8EBF2] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#10B981]">Available</span>
                <span className="text-base font-extrabold text-[#10B981] tabular-nums">
                  {formatINR(mumbaiGst.receivable)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#7D8499] pt-1">
              <span className="flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-[#3045F5]" />
                <span>Maharashtra Unit</span>
              </span>
              <span className="font-mono text-[10px]">
                Net: {formatINR(mumbaiGst.payable - mumbaiGst.receivable)}
              </span>
            </div>
          </div>

          {/* Chennai */}
          <div className="p-4 rounded-xl border border-[#E8EBF2] bg-[#F7F9FC]/70 hover:border-[#3045F5]/30 transition space-y-3">
            <div className="flex items-center justify-between border-b border-[#E8EBF2] pb-2.5">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <Factory className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-[#171B3A] uppercase tracking-wide">
                    GST - Chennai
                  </h4>
                  <span className="text-[10px] text-[#7D8499] font-mono">33AAAAL1234F1Z5 (TN)</span>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>

            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-white border border-[#E8EBF2] flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-600">Payable</span>
                <span className="text-base font-extrabold text-rose-600 tabular-nums">
                  {formatINR(chennaiGst.payable)}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-[#E8EBF2] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#10B981]">Available</span>
                <span className="text-base font-extrabold text-[#10B981] tabular-nums">
                  {formatINR(chennaiGst.receivable)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#7D8499] pt-1">
              <span className="flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-blue-600" />
                <span>Tamil Nadu Unit</span>
              </span>
              <span className="font-mono text-[10px]">
                Net: {formatINR(chennaiGst.payable - chennaiGst.receivable)}
              </span>
            </div>
          </div>

          {/* Goa */}
          <div className="p-4 rounded-xl border border-[#E8EBF2] bg-[#F7F9FC]/70 hover:border-[#3045F5]/30 transition space-y-3">
            <div className="flex items-center justify-between border-b border-[#E8EBF2] pb-2.5">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-[#171B3A] uppercase tracking-wide">
                    GST - Goa
                  </h4>
                  <span className="text-[10px] text-[#7D8499] font-mono">30AAAAL1234F1Z8 (GA)</span>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>

            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-white border border-[#E8EBF2] flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-600">Payable</span>
                <span className="text-base font-extrabold text-rose-600 tabular-nums">
                  {formatINR(goaGst.payable)}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-[#E8EBF2] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#10B981]">Available</span>
                <span className="text-base font-extrabold text-[#10B981] tabular-nums">
                  {formatINR(goaGst.receivable)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#7D8499] pt-1">
              <span className="flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-teal-600" />
                <span>Goa State Unit</span>
              </span>
              <span className="font-mono text-[10px]">
                Net: {formatINR(goaGst.payable - goaGst.receivable)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. URGENT OVERDUE ACTION CALLOUT BANNER (if any overdue) */}
      {summary.highRiskOverdueDebtors.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/80 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
                Action Required: {summary.highRiskOverdueDebtors.length} Overdue Client Accounts
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Critical receivables have passed their payment terms. Generate instant AI payment reminder templates to accelerate cash inflows.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('debtors')}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 transition cursor-pointer shadow-xs"
          >
            Review Debtors & Send Reminders
          </button>
        </div>
      )}

      {/* 6. TWO-COLUMN SPLIT: INFLOWS VS OUTFLOWS TABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Expected Inflows */}
        <div className="bg-white rounded-2xl border border-[#E8EBF2] shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 border-b border-[#E8EBF2] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ArrowDownRight className="w-4 h-4 text-[#10B981]" />
                <h4 className="font-extrabold text-sm text-[#171B3A]">
                  Scheduled Inflows ({activeDetails.daysWindow} Days)
                </h4>
              </div>
              <span className="text-xs font-bold text-[#10B981] tabular-nums bg-emerald-50 px-2.5 py-0.5 rounded-full">
                {formatINR(activeDetails.totalInflow)}
              </span>
            </div>

            <div className="overflow-x-auto">
              {activeDetails.inflows.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#7D8499]">
                  No debtor invoices scheduled in this {activeDetails.daysWindow}-day window.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F9FC] text-[#7D8499] border-b border-[#E8EBF2] text-[10px] uppercase font-bold tracking-wider">
                    <tr>
                      <th className="p-3">Client Entity</th>
                      <th className="p-3">Invoice Ref</th>
                      <th className="p-3">Due Date</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8EBF2]">
                    {activeDetails.inflows.map((item) => (
                      <tr key={item.id} className="hover:bg-[#F7F9FC] transition group">
                        <td className="p-3 font-semibold text-[#171B3A]">{item.clientEntity}</td>
                        <td className="p-3 font-mono text-[11px] text-[#7D8499]">{item.invoiceRef}</td>
                        <td className="p-3 text-[#7D8499]">{item.dueDate}</td>
                        <td className="p-3 font-bold text-[#10B981] text-right tabular-nums">
                          {formatINR(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="px-5 py-3 border-t border-[#E8EBF2] bg-[#F7F9FC]/60 text-right">
            <button
              onClick={() => onNavigateTab('debtors')}
              className="text-xs font-semibold text-[#3045F5] hover:underline inline-flex items-center space-x-1 cursor-pointer"
            >
              <span>View all Debtors & Aging</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Right: Required Outflows */}
        <div className="bg-white rounded-2xl border border-[#E8EBF2] shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 border-b border-[#E8EBF2] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ArrowUpRight className="w-4 h-4 text-rose-600" />
                <h4 className="font-extrabold text-sm text-[#171B3A]">
                  Committed Outflows ({activeDetails.daysWindow} Days)
                </h4>
              </div>
              <span className="text-xs font-bold text-rose-600 tabular-nums bg-rose-50 px-2.5 py-0.5 rounded-full">
                {formatINR(activeDetails.totalOutflow)}
              </span>
            </div>

            <div className="p-4 space-y-4">
              {/* Creditors */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D8499] block mb-2">
                  Vendor Bills (Creditors AP)
                </span>
                {activeDetails.outflows.creditors.length === 0 ? (
                  <p className="text-xs text-[#7D8499] italic">No vendor payouts due in {activeDetails.daysWindow} days.</p>
                ) : (
                  <div className="space-y-1.5">
                    {activeDetails.outflows.creditors.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-[#F7F9FC] text-xs"
                      >
                        <span className="font-semibold text-[#171B3A] truncate">{c.vendorEntity}</span>
                        <div className="flex items-center space-x-3 shrink-0">
                          <span className="text-[11px] text-[#7D8499]">{c.dueDate}</span>
                          <span className="font-bold text-rose-600 tabular-nums">
                            {formatINR(c.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* EMIs */}
              <div className="border-t border-[#E8EBF2] pt-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D8499] block mb-2">
                  Vehicle Loan Installments (EMIs)
                </span>
                {activeDetails.outflows.emis.length === 0 ? (
                  <p className="text-xs text-[#7D8499] italic">No EMIs due in {activeDetails.daysWindow} days.</p>
                ) : (
                  <div className="space-y-1.5">
                    {activeDetails.outflows.emis.map((e) => (
                      <div
                        key={e.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-[#F7F9FC] text-xs"
                      >
                        <div className="flex items-center space-x-1.5 truncate">
                          <Car className="w-3.5 h-3.5 text-[#3045F5] shrink-0" />
                          <span className="font-semibold text-[#171B3A] truncate">{e.loanName}</span>
                        </div>
                        <div className="flex items-center space-x-3 shrink-0">
                          <span className="text-[11px] text-[#7D8499]">{e.nextDueDate}</span>
                          <span className="font-bold text-rose-600 tabular-nums">
                            {formatINR(e.monthlyEmi)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Compliance */}
              <div className="border-t border-[#E8EBF2] pt-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D8499] block mb-2">
                  Statutory LLP Compliance Deadlines
                </span>
                {activeDetails.outflows.compliance.length === 0 ? (
                  <p className="text-xs text-[#7D8499] italic">No statutory tax/MCA items due in {activeDetails.daysWindow} days.</p>
                ) : (
                  <div className="space-y-1.5">
                    {activeDetails.outflows.compliance.map((comp) => (
                      <div
                        key={comp.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-[#F7F9FC] text-xs"
                      >
                        <div className="flex items-center space-x-1.5 truncate">
                          <FileCheck2 className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                          <span className="font-semibold text-[#171B3A] truncate">
                            {comp.title} ({comp.governingAuthority})
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 shrink-0">
                          <span className="text-[11px] text-[#7D8499]">{comp.dueDate}</span>
                          <span className="font-bold text-rose-600 tabular-nums">
                            {formatINR(comp.estimatedAmount || 0)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="px-5 py-3 border-t border-[#E6E9F0] bg-[#F6F8FC]/60 text-right">
            <button
              onClick={() => onNavigateTab('creditors')}
              className="text-xs font-semibold text-[#3045F5] hover:underline inline-flex items-center space-x-1 cursor-pointer"
            >
              <span>Manage Creditors & Vehicle EMIs</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 7. RECENT OPERATIONAL ACTIVITY (Populated strictly with real data) */}
      <div className="bg-white rounded-2xl border border-[#E6E9F0] shadow-xs overflow-hidden">
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-[#E6E9F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[#3045F5]" />
              <h3 className="font-extrabold text-sm sm:text-base text-[#161A2F]">
                Recent Activity & Operations Ledger
              </h3>
            </div>
            <p className="text-xs text-[#7C8499] mt-0.5">
              Live audit trail of cleared payments, vendor disbursements, EMI debits, and statutory filings
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-[#F6F8FC] border border-[#E6E9F0] text-[#161A2F] font-semibold text-[11px]">
              {recentActivities.length} recent operations
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {recentActivities.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#7C8499]">
              No recorded recent activity.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F6F8FC] text-[#7C8499] border-b border-[#E6E9F0] text-[10px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="p-3.5 sm:px-6">Transaction / Party</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Reference / Audit Note</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 sm:px-6 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E9F0]">
                {recentActivities.map((act) => {
                  const isPositive = act.type === 'receipt';
                  return (
                    <tr key={act.id} className="hover:bg-[#F6F8FC] transition group">
                      <td className="p-3.5 sm:px-6">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              act.type === 'receipt'
                                ? 'bg-emerald-50 text-emerald-600'
                                : act.type === 'payout'
                                ? 'bg-rose-50 text-rose-600'
                                : act.type === 'emi'
                                ? 'bg-[#EFF2FE] text-[#3045F5]'
                                : 'bg-amber-50 text-amber-600'
                            }`}
                          >
                            {act.type === 'receipt' && <ArrowDownRight className="w-4 h-4" />}
                            {act.type === 'payout' && <ArrowUpRight className="w-4 h-4" />}
                            {act.type === 'emi' && <Car className="w-4 h-4" />}
                            {act.type === 'compliance' && <FileCheck2 className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="font-bold text-[#161A2F] block">
                              {act.title}
                            </span>
                            <span className="text-[11px] text-[#7C8499]">
                              {act.subtitle}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="text-xs font-semibold text-[#161A2F] capitalize">
                          {act.type === 'receipt'
                            ? 'Client Receivable'
                            : act.type === 'payout'
                            ? 'Vendor Payable'
                            : act.type === 'emi'
                            ? 'Bank Installment'
                            : 'Statutory Filing'}
                        </span>
                      </td>

                      <td className="p-3.5 font-mono text-[11px] text-[#7C8499]">
                        {act.ref}
                      </td>

                      <td className="p-3.5 text-[#7C8499] whitespace-nowrap">
                        {act.date}
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            act.type === 'receipt'
                              ? 'bg-emerald-50 text-emerald-700'
                              : act.type === 'payout'
                              ? 'bg-rose-50 text-rose-700'
                              : act.type === 'emi'
                              ? 'bg-[#EFF2FE] text-[#3045F5]'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {act.status}
                        </span>
                      </td>

                      <td className="p-3.5 sm:px-6 text-right font-extrabold tabular-nums whitespace-nowrap">
                        <span
                          className={
                            isPositive
                              ? 'text-[#10B981]'
                              : act.type === 'payout'
                              ? 'text-rose-600'
                              : 'text-[#161A2F]'
                          }
                        >
                          {isPositive ? '+' : '-'} {formatINR(act.amount)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 8. UPDATE TODAY'S GST PAYABLE & AVAILABLE MODAL */}
      {isEditingGst && (
        <div className="fixed inset-0 bg-[#171B3A]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#E8EBF2] shadow-2xl max-w-lg w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-[#E8EBF2] pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#171B3A] text-base">Update Daily GST Summary</h3>
                  <p className="text-xs text-[#7D8499]">{todayFormattedDate}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditingGst(false)}
                className="text-[#7D8499] hover:text-[#171B3A] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGst} className="space-y-4 text-xs">
              {/* MUMBAI */}
              <div className="p-3.5 rounded-xl border border-[#E8EBF2] bg-[#F7F9FC] space-y-2.5">
                <div className="flex items-center space-x-2 font-bold text-[#171B3A] text-xs uppercase tracking-wide">
                  <Building2 className="w-3.5 h-3.5 text-[#3045F5]" />
                  <span>GST - Mumbai (Maharashtra)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-rose-700 mb-1">
                      GST Payable (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1000"
                      value={editMumbaiPayable}
                      onChange={(e) => setEditMumbaiPayable(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-rose-200 rounded-lg text-xs font-bold text-rose-700 focus:ring-2 focus:ring-rose-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#10B981] mb-1">
                      GST Available (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1000"
                      value={editMumbaiReceivable}
                      onChange={(e) => setEditMumbaiReceivable(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* CHENNAI */}
              <div className="p-3.5 rounded-xl border border-[#E8EBF2] bg-[#F7F9FC] space-y-2.5">
                <div className="flex items-center space-x-2 font-bold text-[#171B3A] text-xs uppercase tracking-wide">
                  <Factory className="w-3.5 h-3.5 text-blue-600" />
                  <span>GST - Chennai (Tamil Nadu)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-rose-700 mb-1">
                      GST Payable (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1000"
                      value={editChennaiPayable}
                      onChange={(e) => setEditChennaiPayable(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-rose-200 rounded-lg text-xs font-bold text-rose-700 focus:ring-2 focus:ring-rose-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#10B981] mb-1">
                      GST Available (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1000"
                      value={editChennaiReceivable}
                      onChange={(e) => setEditChennaiReceivable(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* GOA */}
              <div className="p-3.5 rounded-xl border border-[#E8EBF2] bg-[#F7F9FC] space-y-2.5">
                <div className="flex items-center space-x-2 font-bold text-[#171B3A] text-xs uppercase tracking-wide">
                  <Landmark className="w-3.5 h-3.5 text-teal-600" />
                  <span>GST - Goa</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-rose-700 mb-1">
                      GST Payable (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1000"
                      value={editGoaPayable}
                      onChange={(e) => setEditGoaPayable(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-rose-200 rounded-lg text-xs font-bold text-rose-700 focus:ring-2 focus:ring-rose-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#10B981] mb-1">
                      GST Available (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1000"
                      value={editGoaReceivable}
                      onChange={(e) => setEditGoaReceivable(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#E8EBF2]">
                <button
                  type="button"
                  onClick={() => setIsEditingGst(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8EBF2] hover:bg-slate-50 text-xs font-semibold text-[#7D8499] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#3045F5] hover:bg-[#2537D6] text-white text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  Save Daily Figures
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
