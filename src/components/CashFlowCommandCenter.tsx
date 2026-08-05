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
import { calculate5DayCashFlow, formatINR } from '../utils/calculations';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Layers,
  Clock,
  ChevronRight,
  Building2,
  Factory,
  Landmark,
  Coins,
  MapPin,
  Edit3,
  Save,
  X,
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

  const totalPayable = mumbaiGst.payable + chennaiGst.payable + goaGst.payable;
  const totalReceivable = mumbaiGst.receivable + chennaiGst.receivable + goaGst.receivable;

  const todayFormattedDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const summary: CashFlowSummary = calculate5DayCashFlow(debtors, creditors, emis, compliance);

  // Determine active horizon details
  let activeDetails: HorizonCashFlowDetails;
  if (selectedHorizon === '15-Day') {
    activeDetails = summary.horizon15Day;
  } else if (selectedHorizon === 'Monthly') {
    activeDetails = summary.horizonMonthly;
  } else {
    activeDetails = summary.horizon5Day;
  }

  const isPositiveNet = activeDetails.netCashPosition >= 0;

  return (
    <div className="space-y-6">
      {/* Horizon Selector Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          <span className="text-sm font-bold text-slate-800">Select Cash Flow Horizon:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedHorizon('5-Day')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition cursor-pointer ${
              selectedHorizon === '5-Day'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>⚡ 5-Day Command Center</span>
          </button>

          <button
            onClick={() => setSelectedHorizon('15-Day')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition cursor-pointer ${
              selectedHorizon === '15-Day'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>📅 15-Day Command Center</span>
          </button>

          <button
            onClick={() => setSelectedHorizon('Monthly')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition cursor-pointer ${
              selectedHorizon === 'Monthly'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>📆 Monthly Command Center</span>
          </button>
        </div>
      </div>

      {/* 3-Horizon Side-by-Side Comparison Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 5-Day Card */}
        <div
          onClick={() => setSelectedHorizon('5-Day')}
          className={`p-4 rounded-xl border cursor-pointer transition shadow-sm ${
            selectedHorizon === '5-Day'
              ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20'
              : 'bg-white border-slate-200 hover:border-indigo-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
              5-Day Horizon
            </span>
            <span className="text-[11px] text-slate-500">{summary.horizon5Day.dateRangeText}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Expected Inflow</span>
              <span className="font-bold text-emerald-600">{formatINR(summary.horizon5Day.totalInflow)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Required Outflow</span>
              <span className="font-bold text-rose-600">{formatINR(summary.horizon5Day.totalOutflow)}</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Net Position</span>
            <span
              className={`text-xs font-extrabold ${
                summary.horizon5Day.netCashPosition >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {formatINR(summary.horizon5Day.netCashPosition)}
            </span>
          </div>
        </div>

        {/* 15-Day Card */}
        <div
          onClick={() => setSelectedHorizon('15-Day')}
          className={`p-4 rounded-xl border cursor-pointer transition shadow-sm ${
            selectedHorizon === '15-Day'
              ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20'
              : 'bg-white border-slate-200 hover:border-indigo-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
              15-Day Horizon
            </span>
            <span className="text-[11px] text-slate-500">{summary.horizon15Day.dateRangeText}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Expected Inflow</span>
              <span className="font-bold text-emerald-600">{formatINR(summary.horizon15Day.totalInflow)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Required Outflow</span>
              <span className="font-bold text-rose-600">{formatINR(summary.horizon15Day.totalOutflow)}</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Net Position</span>
            <span
              className={`text-xs font-extrabold ${
                summary.horizon15Day.netCashPosition >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {formatINR(summary.horizon15Day.netCashPosition)}
            </span>
          </div>
        </div>

        {/* Monthly Card */}
        <div
          onClick={() => setSelectedHorizon('Monthly')}
          className={`p-4 rounded-xl border cursor-pointer transition shadow-sm ${
            selectedHorizon === 'Monthly'
              ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20'
              : 'bg-white border-slate-200 hover:border-indigo-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
              Monthly (30-Day) Horizon
            </span>
            <span className="text-[11px] text-slate-500">{summary.horizonMonthly.dateRangeText}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Expected Inflow</span>
              <span className="font-bold text-emerald-600">{formatINR(summary.horizonMonthly.totalInflow)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Required Outflow</span>
              <span className="font-bold text-rose-600">{formatINR(summary.horizonMonthly.totalOutflow)}</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Net Position</span>
            <span
              className={`text-xs font-extrabold ${
                summary.horizonMonthly.netCashPosition >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {formatINR(summary.horizonMonthly.netCashPosition)}
            </span>
          </div>
        </div>
      </div>

      {/* TODAY'S GST PAYABLE & GST AVAILABLE SECTION (BELOW 5-DAY, 15-DAY, AND 30-DAY HORIZONS) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60 shadow-xs">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-extrabold text-slate-900 text-base tracking-tight uppercase">
                  Today's GST Summary
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold border border-amber-200">
                  {todayFormattedDate}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Live daily statutory GST liability tracker
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-4 text-right">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total GST Payable
                </span>
                <span className="text-base font-black text-rose-600">
                  {formatINR(totalPayable)}
                </span>
              </div>
              <div className="h-7 w-px bg-slate-200" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total GST Available
                </span>
                <span className="text-base font-black text-emerald-600">
                  {formatINR(totalReceivable)}
                </span>
              </div>
            </div>

            <button
              onClick={handleOpenEditGst}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center space-x-2 transition cursor-pointer shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>Update GST Daily Amounts</span>
            </button>
          </div>
        </div>

        {/* 3 DISTINCT LOCATION BOXES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* BOX 1: MUMBAI */}
          <div className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-indigo-50/20 hover:border-indigo-200 transition shadow-xs relative overflow-hidden group space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
                    GST - Mumbai
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">GSTIN: 27AAAAL1234F1Z0 (MH)</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-rose-50/60 border border-rose-100 flex items-center justify-between">
                <span className="text-xs font-bold text-rose-700 uppercase tracking-wide">GST Payable</span>
                <span className="text-lg font-black text-rose-600">
                  {formatINR(mumbaiGst.payable)}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">GST Available</span>
                <span className="text-lg font-black text-emerald-600">
                  {formatINR(mumbaiGst.receivable)}
                </span>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center space-x-1 text-slate-400">
                <MapPin className="w-3 h-3 text-indigo-400" />
                <span>Maharashtra Unit</span>
              </span>
              <span className="text-emerald-600 font-medium">Live Tracker</span>
            </div>
          </div>

          {/* BOX 2: CHENNAI */}
          <div className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50/20 hover:border-blue-200 transition shadow-xs relative overflow-hidden group space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                  <Factory className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
                    GST - Chennai
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">GSTIN: 33AAAAL1234F1Z5 (TN)</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-rose-50/60 border border-rose-100 flex items-center justify-between">
                <span className="text-xs font-bold text-rose-700 uppercase tracking-wide">GST Payable</span>
                <span className="text-lg font-black text-rose-600">
                  {formatINR(chennaiGst.payable)}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">GST Available</span>
                <span className="text-lg font-black text-emerald-600">
                  {formatINR(chennaiGst.receivable)}
                </span>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center space-x-1 text-slate-400">
                <MapPin className="w-3 h-3 text-blue-400" />
                <span>Tamil Nadu Unit</span>
              </span>
              <span className="text-emerald-600 font-medium">Live Tracker</span>
            </div>
          </div>

          {/* BOX 3: GOA */}
          <div className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-teal-50/20 hover:border-teal-200 transition shadow-xs relative overflow-hidden group space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-teal-50 text-teal-600 border border-teal-100">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
                    GST - Goa
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">GSTIN: 30AAAAL1234F1Z8 (GA)</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-rose-50/60 border border-rose-100 flex items-center justify-between">
                <span className="text-xs font-bold text-rose-700 uppercase tracking-wide">GST Payable</span>
                <span className="text-lg font-black text-rose-600">
                  {formatINR(goaGst.payable)}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">GST Available</span>
                <span className="text-lg font-black text-emerald-600">
                  {formatINR(goaGst.receivable)}
                </span>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center space-x-1 text-slate-400">
                <MapPin className="w-3 h-3 text-teal-400" />
                <span>Goa State Unit</span>
              </span>
              <span className="text-emerald-600 font-medium">Live Tracker</span>
            </div>
          </div>
        </div>
      </div>

      {/* Executive Command Banner for Active Horizon */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-xl border border-slate-700/60 shadow-lg text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="bg-white p-2 rounded-xl shadow-md border border-slate-200 hidden sm:flex items-center justify-center shrink-0">
              <img
                src="https://llabdhi.com/assets/img/llabdhi_img/Llabdhi_Mfgr_LLP3223.png"
                alt="Llabdhi Manufacturing LLP Logo"
                referrerPolicy="no-referrer"
                className="h-10 w-auto object-contain max-w-[140px]"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider border border-indigo-500/30">
                  {activeDetails.horizonLabel} Command Center
                </span>
                <span className="text-xs text-slate-400">Baseline Window: {activeDetails.dateRangeText}</span>
              </div>
              <h1 className="text-2xl font-bold mt-2 text-white">
                {activeDetails.horizonLabel} Cash Flow Liquidity Report
              </h1>
              <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                Monitors operational liquidity, vendor payments, car loan EMIs, and statutory tax liabilities for Llabdhi Manufacturing LLP over the next {activeDetails.daysWindow} days.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() =>
                openAiChatWithPrompt(
                  `Generate a comprehensive ${activeDetails.horizonLabel} Cash Flow Analysis Report for Llabdhi Manufacturing LLP with liquidity forecasts and receivables strategy.`
                )
              }
              className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center space-x-2 transition cursor-pointer shadow"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              <span>AI {activeDetails.horizonLabel} Analysis</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metrics for Active Horizon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inflow */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Expected Inflows ({activeDetails.horizonLabel})
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-3">
            {formatINR(activeDetails.totalInflow)}
          </p>
          <p className="text-xs text-emerald-600 font-medium mt-1">
            {activeDetails.inflows.length} debtor invoice(s) scheduled
          </p>
        </div>

        {/* Total Outflow */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Required Outflows ({activeDetails.horizonLabel})
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-3">
            {formatINR(activeDetails.totalOutflow)}
          </p>
          <p className="text-xs text-rose-600 font-medium mt-1">
            Creditors + EMIs + Statutory Compliance
          </p>
        </div>

        {/* Net Cash Position */}
        <div
          className={`p-5 rounded-xl border shadow-sm relative overflow-hidden ${
            isPositiveNet
              ? 'bg-emerald-900/10 border-emerald-300/40 text-emerald-950'
              : 'bg-rose-900/10 border-rose-300/40 text-rose-950'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Net {activeDetails.horizonLabel} Cash Position
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isPositiveNet ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}
            >
              {isPositiveNet ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
          </div>
          <p
            className={`text-2xl font-extrabold mt-3 ${
              isPositiveNet ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {formatINR(activeDetails.netCashPosition)}
          </p>
          <p className="text-xs font-medium text-slate-600 mt-1">
            {isPositiveNet ? 'Surplus liquidity available' : 'Shortfall expected - Follow up on AR'}
          </p>
        </div>

        {/* High Risk Overdue Alert */}
        <div className="bg-amber-500/10 p-5 rounded-xl border border-amber-300/50 text-amber-950 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
              High-Risk Overdue AR
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-900 mt-3">
            {summary.highRiskOverdueDebtors.length} Client(s)
          </p>
          <p className="text-xs text-amber-800 font-medium mt-1">
            Requires immediate executive follow-up
          </p>
        </div>
      </div>

      {/* High-Risk Overdue Receivables Callout Banner */}
      {summary.highRiskOverdueDebtors.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-amber-900">
                  Urgent Receivables Action Needed
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  Overdue clients (Western Refrigeration, IFB Industries) have unpaid invoices. Direct AI to draft reminder emails to clear overdue debt.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => onNavigateTab('debtors')}
                className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs transition cursor-pointer"
              >
                View Debtors Breakdown
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2-Column Split: Inflows vs Outflows for Active Horizon */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Expected Inflows (Debtor Invoices) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ArrowDownRight className="w-4 h-4 text-emerald-600" />
              <h2 className="font-bold text-sm text-slate-800">
                1. Debtor Invoices Due in Next {activeDetails.daysWindow} Days (Inflows)
              </h2>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              {formatINR(activeDetails.totalInflow)}
            </span>
          </div>

          <div className="p-4 flex-1 overflow-x-auto">
            {activeDetails.inflows.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No debtor invoices scheduled for collection in the next {activeDetails.daysWindow} days.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-100">
                    <th className="pb-2 font-medium">Client Entity</th>
                    <th className="pb-2 font-medium">Invoice Ref</th>
                    <th className="pb-2 font-medium">Due Date</th>
                    <th className="pb-2 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeDetails.inflows.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 font-semibold text-slate-900">
                        {item.clientEntity}
                      </td>
                      <td className="py-2.5 text-slate-600 font-mono text-[11px]">
                        {item.invoiceRef}
                      </td>
                      <td className="py-2.5 text-slate-600">{item.dueDate}</td>
                      <td className="py-2.5 font-bold text-emerald-600 text-right">
                        {formatINR(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-right">
            <button
              onClick={() => onNavigateTab('debtors')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 inline-flex items-center space-x-1 cursor-pointer"
            >
              <span>Manage all Debtors</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Right Column: Required Outflows (Creditors + EMIs + Compliance) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ArrowUpRight className="w-4 h-4 text-rose-600" />
              <h2 className="font-bold text-sm text-slate-800">
                2. Outflows ({activeDetails.daysWindow}-Day Window)
              </h2>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
              {formatINR(activeDetails.totalOutflow)}
            </span>
          </div>

          <div className="p-4 flex-1 overflow-x-auto space-y-4">
            {/* Creditor Payments */}
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Accounts Payable (Creditors)
              </span>
              {activeDetails.outflows.creditors.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No creditor payouts due in {activeDetails.daysWindow} days.</p>
              ) : (
                <table className="w-full text-left text-xs">
                  <tbody className="divide-y divide-slate-100">
                    {activeDetails.outflows.creditors.map((c) => (
                      <tr key={c.id}>
                        <td className="py-1.5 font-medium text-slate-800">{c.vendorEntity}</td>
                        <td className="py-1.5 text-slate-500">{c.dueDate}</td>
                        <td className="py-1.5 font-bold text-rose-600 text-right">
                          {formatINR(c.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Loan EMIs */}
            <div className="border-t border-slate-100 pt-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Vehicle Loan EMIs
              </span>
              {activeDetails.outflows.emis.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No vehicle loan EMIs due in {activeDetails.daysWindow} days.</p>
              ) : (
                <table className="w-full text-left text-xs">
                  <tbody className="divide-y divide-slate-100">
                    {activeDetails.outflows.emis.map((e) => (
                      <tr key={e.id}>
                        <td className="py-1.5 font-medium text-slate-800">{e.loanName}</td>
                        <td className="py-1.5 text-slate-500">{e.nextDueDate}</td>
                        <td className="py-1.5 font-bold text-rose-600 text-right">
                          {formatINR(e.monthlyEmi)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Compliance Liabilities */}
            <div className="border-t border-slate-100 pt-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Statutory Compliance
              </span>
              {activeDetails.outflows.compliance.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No statutory tax/MCA items due in {activeDetails.daysWindow} days.</p>
              ) : (
                <table className="w-full text-left text-xs">
                  <tbody className="divide-y divide-slate-100">
                    {activeDetails.outflows.compliance.map((comp) => (
                      <tr key={comp.id}>
                        <td className="py-1.5 font-medium text-slate-800">
                          {comp.title} ({comp.governingAuthority})
                        </td>
                        <td className="py-1.5 text-slate-500">{comp.dueDate}</td>
                        <td className="py-1.5 font-bold text-rose-600 text-right">
                          {formatINR(comp.estimatedAmount || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-right">
            <button
              onClick={() => onNavigateTab('creditors')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 inline-flex items-center space-x-1 cursor-pointer"
            >
              <span>Manage Creditors & EMIs</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* UPDATE TODAY'S GST PAYABLE & GST AVAILABLE MODAL */}
      {isEditingGst && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Update Daily GST Summary</h3>
                  <p className="text-xs text-slate-500">{todayFormattedDate}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditingGst(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGst} className="space-y-5 text-xs">
              {/* MUMBAI */}
              <div className="p-3.5 rounded-xl border border-indigo-100 bg-slate-50/50 space-y-2.5">
                <div className="flex items-center space-x-2 font-bold text-slate-800 text-xs uppercase tracking-wide">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>GST - Mumbai (MH)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-rose-700 mb-1">
                      GST Payable <span className="text-[10px] text-rose-500 font-normal">(Red)</span>
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
                    <label className="block font-semibold text-emerald-700 mb-1">
                      GST Available <span className="text-[10px] text-emerald-500 font-normal">(Green)</span>
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
              <div className="p-3.5 rounded-xl border border-blue-100 bg-slate-50/50 space-y-2.5">
                <div className="flex items-center space-x-2 font-bold text-slate-800 text-xs uppercase tracking-wide">
                  <Factory className="w-3.5 h-3.5 text-blue-600" />
                  <span>GST - Chennai (TN)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-rose-700 mb-1">
                      GST Payable <span className="text-[10px] text-rose-500 font-normal">(Red)</span>
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
                    <label className="block font-semibold text-emerald-700 mb-1">
                      GST Available <span className="text-[10px] text-emerald-500 font-normal">(Green)</span>
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
              <div className="p-3.5 rounded-xl border border-teal-100 bg-slate-50/50 space-y-2.5">
                <div className="flex items-center space-x-2 font-bold text-slate-800 text-xs uppercase tracking-wide">
                  <Landmark className="w-3.5 h-3.5 text-teal-600" />
                  <span>GST - Goa (GA)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-rose-700 mb-1">
                      GST Payable <span className="text-[10px] text-rose-500 font-normal">(Red)</span>
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
                    <label className="block font-semibold text-emerald-700 mb-1">
                      GST Available <span className="text-[10px] text-emerald-500 font-normal">(Green)</span>
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

              {/* SUMMARY PREVIEW */}
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-700 block">Combined Total Payable:</span>
                  <span className="font-black text-rose-600 text-sm">
                    {formatINR((Number(editMumbaiPayable) || 0) + (Number(editChennaiPayable) || 0) + (Number(editGoaPayable) || 0))}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-700 block">Combined Total GST Available:</span>
                  <span className="font-black text-emerald-600 text-sm">
                    {formatINR((Number(editMumbaiReceivable) || 0) + (Number(editChennaiReceivable) || 0) + (Number(editGoaReceivable) || 0))}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingGst(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold cursor-pointer hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold cursor-pointer shadow flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save GST Amounts</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

