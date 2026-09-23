import React, { useState } from 'react';
import { ComplianceItem } from '../types';
import { formatINR, calculateDaysDiff, getTodayStr } from '../utils/calculations';
import {
  FileCheck2,
  ExternalLink,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Building,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';

interface ComplianceManagerProps {
  complianceList: ComplianceItem[];
  onUpdateCompliance?: (updatedItem: ComplianceItem) => void;
  onAddCompliance?: (newItem: ComplianceItem) => void;
  onDeleteCompliance?: (id: string) => void;
  onRefreshSheet?: () => void;
  isRefreshingSheet?: boolean;
  lastUpdatedTime?: string;
  isLiveConnected?: boolean;
}

export const ComplianceManager: React.FC<ComplianceManagerProps> = ({
  complianceList,
  onRefreshSheet,
  isRefreshingSheet,
  lastUpdatedTime,
  isLiveConnected = true,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'filed'>('all');
  const [authorityFilter, setAuthorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const today = getTodayStr();

  // Metrics
  const pendingCompliances = complianceList.filter((c) => c.status !== 'Filed');
  const filedCompliances = complianceList.filter((c) => c.status === 'Filed');
  const overdueCompliances = complianceList.filter(
    (c) => c.status !== 'Filed' && c.dueDate < today
  );
  const totalEstimatedLiability = pendingCompliances.reduce(
    (sum, c) => sum + (c.estimatedAmount || 0),
    0
  );

  // Authority badge classes
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

  // Filtered rows
  const filteredList = complianceList.filter((item) => {
    // Status
    const isFiled = item.status === 'Filed';
    if (statusFilter === 'pending' && isFiled) return false;
    if (statusFilter === 'filed' && !isFiled) return false;

    // Authority
    if (authorityFilter !== 'all' && item.governingAuthority !== authorityFilter) {
      return false;
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchPeriod = item.period.toLowerCase().includes(q);
      const matchAuth = item.governingAuthority.toLowerCase().includes(q);
      const matchArn = (item.arnChallanRef || '').toLowerCase().includes(q);
      if (!matchTitle && !matchPeriod && !matchAuth && !matchArn) return false;
    }

    return true;
  });

  const uniqueAuthorities = Array.from(new Set(complianceList.map((c) => c.governingAuthority)));

  return (
    <div className="space-y-6">
      {/* 1. TOP METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Scheduled Obligations */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8EBF2] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#7D8499]">
              Total Schedule (Oct 26 - Jan 27)
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#3045F5] flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl lg:text-3xl font-extrabold text-[#171B3A] tracking-tight tabular-nums">
              {complianceList.length} Obligations
            </h3>
            <p className="text-xs text-[#3045F5] mt-1 font-semibold">
              GST, MCA V3 & Income Tax Schedule
            </p>
          </div>
        </div>

        {/* Pending Statutory Returns */}
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
            <h3 className="text-2xl lg:text-3xl font-extrabold text-amber-700 tracking-tight tabular-nums">
              {pendingCompliances.length} Pending
            </h3>
            <p className="text-xs text-amber-700 mt-1 font-semibold">
              {overdueCompliances.length > 0 ? `${overdueCompliances.length} Overdue statutory deadline` : 'All deadlines current'}
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
            <p className="text-xs text-emerald-700 mt-1 font-semibold">
              Ticked in Google Sheets / Verified with ARN
            </p>
          </div>
        </div>

        {/* Estimated Tax Liability */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8EBF2] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#7D8499]">
              Est. Tax / Statutory Dues
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl lg:text-3xl font-extrabold text-purple-700 tracking-tight tabular-nums">
              {totalEstimatedLiability > 0 ? formatINR(totalEstimatedLiability) : 'Statutory'}
            </h3>
            <p className="text-xs text-purple-600 mt-1 font-semibold">
              Direct and indirect tax deposits
            </p>
          </div>
        </div>
      </div>

      {/* 2. SECTION TOOLBAR & REGULATORY PORTALS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-[#171B3A]">
            LLP Statutory Compliance & Filing Schedule (01/10/2026 - 31/01/2027)
          </h2>
          <p className="text-xs text-[#7D8499] mt-0.5">
            GSTR-1, GSTR-3B, TDS Deposit, Advance Tax, and MCA Form 8 filings automatically live-synced from Google Sheets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            isLiveConnected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span>{isLiveConnected ? 'Status Checkbox Live (15s)' : 'Connection Issue'}</span>
          </span>

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
          {onRefreshSheet && (
            <button
              onClick={onRefreshSheet}
              disabled={isRefreshingSheet}
              title="Force Sync with Google Sheets"
              className="p-2 rounded-xl bg-white border border-[#E8EBF2] hover:bg-slate-50 text-[#3045F5] transition cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshingSheet ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* 3. MAIN COMPLIANCE TRACKER TABLE */}
      <div className="bg-white rounded-2xl border border-[#E8EBF2] shadow-xs overflow-hidden">
        {/* Table Filters & Search */}
        <div className="p-5 border-b border-[#E8EBF2] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-sm text-[#171B3A]">
                  Statutory Obligation & Status Checkbox Ledger
                </h3>
                <span className="text-xs bg-[#EFF2FE] text-[#3045F5] font-bold px-2 py-0.5 rounded-full">
                  {filteredList.length} Entries
                </span>
              </div>
              <p className="text-xs text-[#7D8499] mt-0.5">
                Tick the <span className="font-semibold text-[#171B3A]">Status</span> checkbox in Google Sheets to mark as Filed/Completed. Unticking returns it to Pending.
              </p>
            </div>

            {/* Status Pills */}
            <div className="inline-flex p-1 bg-[#F7F9FC] rounded-xl border border-[#E8EBF2] shrink-0">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white text-[#3045F5] shadow-xs border border-[#E8EBF2]'
                    : 'text-[#7D8499] hover:text-[#171B3A]'
                }`}
              >
                All ({complianceList.length})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  statusFilter === 'pending'
                    ? 'bg-white text-amber-700 shadow-xs border border-[#E8EBF2]'
                    : 'text-[#7D8499] hover:text-[#171B3A]'
                }`}
              >
                Pending ({pendingCompliances.length})
              </button>
              <button
                onClick={() => setStatusFilter('filed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  statusFilter === 'filed'
                    ? 'bg-white text-[#10B981] shadow-xs border border-[#E8EBF2]'
                    : 'text-[#7D8499] hover:text-[#171B3A]'
                }`}
              >
                Filed ({filedCompliances.length})
              </button>
            </div>
          </div>

          {/* Search & Authority Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-[#7D8499] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search compliance by return title, period, authority..."
                className="w-full pl-9 pr-4 py-2 bg-[#F7F9FC] hover:bg-white focus:bg-white text-xs text-[#171B3A] rounded-xl border border-[#E8EBF2] focus:border-[#3045F5] focus:outline-none focus:ring-2 focus:ring-[#3045F5]/15 transition"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-[#7D8499] font-medium hidden sm:inline">Authority:</span>
              <select
                value={authorityFilter}
                onChange={(e) => setAuthorityFilter(e.target.value)}
                className="bg-[#F7F9FC] hover:bg-white text-xs font-semibold text-[#171B3A] px-3 py-2 rounded-xl border border-[#E8EBF2] focus:outline-none focus:border-[#3045F5] cursor-pointer"
              >
                <option value="all">All Authorities</option>
                {uniqueAuthorities.map((auth) => (
                  <option key={auth} value={auth}>
                    {auth}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F9FC] text-[#7D8499] border-b border-[#E8EBF2] uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="p-3.5 text-center">Status (Checkbox)</th>
                <th className="p-3.5">Period Block</th>
                <th className="p-3.5">Compliance / Return</th>
                <th className="p-3.5">Govt Authority</th>
                <th className="p-3.5">Statutory Deadline</th>
                <th className="p-3.5 text-right">Amount Paid (₹)</th>
                <th className="p-3.5">Payment / Filing Date</th>
                <th className="p-3.5">Challan / ARN No.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EBF2]">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#7D8499]">
                    No compliance records matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const isFiled = item.status === 'Filed';
                  const daysLeft = calculateDaysDiff(item.dueDate);
                  const isOverdue = daysLeft < 0 && !isFiled;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-[#F7F9FC] transition ${isFiled ? 'bg-white' : isOverdue ? 'bg-rose-50/20' : 'bg-white'}`}
                    >
                      {/* Checkbox Status Column */}
                      <td className="p-3.5 text-center">
                        <div className="inline-flex items-center space-x-1.5">
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center border font-bold text-xs ${
                              isFiled
                                ? 'bg-[#10B981] border-[#10B981] text-white'
                                : 'bg-white border-[#CBD5E1] text-transparent'
                            }`}
                            title={isFiled ? 'Completed / Filed (Ticked in Google Sheets)' : 'Pending (Tick in Google Sheets to complete)'}
                          >
                            ✓
                          </span>
                          <span className={`text-[11px] font-bold ${isFiled ? 'text-[#10B981]' : isOverdue ? 'text-rose-600' : 'text-amber-700'}`}>
                            {isFiled ? 'Filed' : isOverdue ? 'Overdue' : 'Pending'}
                          </span>
                        </div>
                      </td>

                      {/* Period Block */}
                      <td className="p-3.5 font-medium text-[#7D8499] whitespace-nowrap">
                        {item.period}
                      </td>

                      {/* Compliance / Return */}
                      <td className="p-3.5 font-bold text-[#171B3A]">
                        <div>{item.title}</div>
                      </td>

                      {/* Govt Authority */}
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getAuthorityBadgeClass(
                            item.governingAuthority
                          )}`}
                        >
                          {item.governingAuthority}
                        </span>
                      </td>

                      {/* Statutory Deadline */}
                      <td className="p-3.5 text-[#171B3A]">
                        <div className="tabular-nums font-medium">{item.dueDate}</div>
                        {isOverdue && (
                          <span className="text-[10px] text-rose-600 font-bold block">
                            Overdue by {Math.abs(daysLeft)}d
                          </span>
                        )}
                        {!isOverdue && !isFiled && daysLeft <= 15 && daysLeft >= 0 && (
                          <span className="text-[10px] text-amber-700 font-semibold block">
                            Due in {daysLeft}d
                          </span>
                        )}
                      </td>

                      {/* Amount Paid */}
                      <td className="p-3.5 font-extrabold text-[#171B3A] text-right tabular-nums">
                        {item.estimatedAmount ? formatINR(item.estimatedAmount) : '—'}
                      </td>

                      {/* Payment / Filing Date */}
                      <td className="p-3.5 text-[#7D8499] tabular-nums">
                        {item.filingDate || (isFiled ? 'Filed' : '—')}
                      </td>

                      {/* Challan / ARN No */}
                      <td className="p-3.5 text-[#7D8499]">
                        {item.arnChallanRef ? (
                          <span className="text-[11px] font-mono text-[#10B981] font-bold">
                            {item.arnChallanRef}
                          </span>
                        ) : isFiled ? (
                          <span className="text-[11px] font-mono text-[#10B981] font-semibold">
                            Filed / Verified
                          </span>
                        ) : (
                          <span className="text-[#CBD5E1] text-[11px] italic">
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
