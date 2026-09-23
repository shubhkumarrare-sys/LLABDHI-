import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { DebtorItem } from '../types';
import { formatINR } from '../utils/calculations';

interface HeaderProps {
  activeTab: string;
  onOpenMobileMenu: () => void;
  openAiChat: () => void;
  onRefreshSheet?: () => void;
  isRefreshingSheet?: boolean;
  refreshStatusMessage?: string | null;
  overdueCount: number;
  debtors: DebtorItem[];
  onNavigateTab: (tab: string) => void;
  onOpenEmailDraftForGroup?: (clientEntity: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenMobileMenu,
  openAiChat,
  onRefreshSheet,
  isRefreshingSheet,
  refreshStatusMessage,
  overdueCount,
  debtors,
  onNavigateTab,
  onOpenEmailDraftForGroup,
  searchQuery = '',
  onSearchChange,
}) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close notifications popover on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const overdueList = debtors.filter((d) => d.status === 'Overdue');
  const overdueTotal = overdueList.reduce((acc, curr) => acc + curr.amount, 0);

  // Tab Title Mapping
  const tabTitles: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Operational Command Center',
      subtitle: '5, 10, 15 & 30-Day Liquidity Analysis',
    },
    debtors: {
      title: 'Debtors Management (AR)',
      subtitle: 'Client Invoices, Aging & Payment Follow-ups',
    },
    creditors: {
      title: 'Creditors Management (AP)',
      subtitle: 'Vendor Dues, Invoices & Payment Schedule',
    },
    emis: {
      title: 'Vehicle Loans & EMIs',
      subtitle: 'Monthly Bank Installments & Repayment Records',
    },
    compliance: {
      title: 'Statutory LLP Compliance',
      subtitle: 'GST, MCA V3 Annual Filings & Direct Taxes',
    },
    scripting: {
      title: 'Apps Script & Automation',
      subtitle: 'Google Calendar Sync & .ics Schedule Export',
    },
    settings: {
      title: 'Executive Settings & Export',
      subtitle: 'Financial Thresholds & Dataset Backup',
    },
  };

  const currentTabInfo = tabTitles[activeTab] || {
    title: 'Operations Dashboard',
    subtitle: 'Llabdhi Manufacturing LLP',
  };

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#E8EBF2] h-18 px-4 sm:px-8 flex items-center justify-between transition-all">
      {/* Left zone: Mobile toggle & Breadcrumb/Title */}
      <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-[#7D8499] hover:text-[#171B3A] hover:bg-[#F7F9FC] border border-[#E8EBF2] transition"
          aria-label="Open Sidebar Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="truncate">
          <div className="flex items-center space-x-2 text-[11px] text-[#7D8499] font-medium hidden sm:flex">
            <span>LLABDHI OPS</span>
            <span>/</span>
            <span className="text-[#3045F5] font-semibold">Executive Portal</span>
          </div>
          <h1 className="text-base sm:text-lg font-extrabold text-[#171B3A] tracking-tight leading-tight truncate">
            {currentTabInfo.title}
          </h1>
        </div>
      </div>

      {/* Right zone: Global Search, Live Sheet Refresh, Notifications, Ask AI CFO */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        {/* Global Search Bar */}
        {onSearchChange && (
          <div className="relative hidden md:block">
            <Search className="w-3.5 h-3.5 text-[#7D8499] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search invoices, clients, loans..."
              className="bg-[#F7F9FC] hover:bg-white focus:bg-white text-xs text-[#171B3A] pl-9 pr-12 py-2 rounded-xl border border-[#E8EBF2] focus:border-[#3045F5] focus:outline-none focus:ring-2 focus:ring-[#3045F5]/15 transition w-56 lg:w-64"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#7D8499] bg-white border border-[#E8EBF2] px-1.5 py-0.5 rounded shadow-2xs pointer-events-none">
              ⌘K
            </kbd>
          </div>
        )}

        {/* Quick Refresh Google Sheet Button */}
        {onRefreshSheet && (
          <button
            onClick={onRefreshSheet}
            disabled={isRefreshingSheet}
            title="Refresh Live Google Sheet Data"
            className="p-2 sm:px-3 sm:py-2 rounded-xl text-[#171B3A] bg-[#F7F9FC] hover:bg-white border border-[#E8EBF2] hover:border-[#3045F5]/30 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-60 shadow-2xs group"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#3045F5] ${
                isRefreshingSheet ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'
              }`}
            />
            <span className="hidden xl:inline text-xs">
              {isRefreshingSheet ? 'Syncing...' : 'Sync Sheet'}
            </span>
          </button>
        )}

        {/* Notifications Popover */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-2 rounded-xl text-[#7D8499] hover:text-[#171B3A] bg-[#F7F9FC] hover:bg-white border border-[#E8EBF2] transition cursor-pointer relative"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {overdueCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center border-2 border-white animate-pulse">
                {overdueCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-[#E8EBF2] shadow-xl p-4 z-50 text-[#171B3A] animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between border-b border-[#E8EBF2] pb-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Executive Alerts ({overdueCount})
                  </span>
                </div>
                <span className="text-[10px] text-[#7D8499] font-medium">
                  Total Overdue: {formatINR(overdueTotal)}
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-[#E8EBF2] my-2">
                {overdueList.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[#7D8499]">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                    No overdue receivables! All client accounts are current.
                  </div>
                ) : (
                  overdueList.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="py-2.5 px-2 hover:bg-[#F7F9FC] rounded-lg transition flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-xs font-bold text-[#171B3A] block truncate">
                          {item.clientEntity}
                        </span>
                        <div className="flex items-center space-x-2 text-[10px] text-[#7D8499]">
                          <span className="font-mono">{item.invoiceRef}</span>
                          <span>•</span>
                          <span className="text-rose-600 font-semibold">Due {item.dueDate}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-extrabold text-rose-600 block tabular-nums">
                          {formatINR(item.amount)}
                        </span>
                        {onOpenEmailDraftForGroup && (
                          <button
                            onClick={() => {
                              setIsNotificationsOpen(false);
                              onOpenEmailDraftForGroup(item.clientEntity);
                            }}
                            className="text-[10px] text-[#3045F5] font-semibold hover:underline inline-flex items-center space-x-0.5 cursor-pointer mt-0.5"
                          >
                            <span>Draft Reminder</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-[#E8EBF2] flex items-center justify-between">
                <button
                  onClick={() => {
                    setIsNotificationsOpen(false);
                    onNavigateTab('debtors');
                  }}
                  className="text-xs font-semibold text-[#3045F5] hover:text-[#2537D6] inline-flex items-center space-x-1 cursor-pointer"
                >
                  <span>View All Overdue Debtors</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setIsNotificationsOpen(false)}
                  className="text-xs text-[#7D8499] hover:text-[#171B3A]"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Primary Action Button: Ask AI CFO */}
        <button
          onClick={openAiChat}
          className="px-3.5 sm:px-4 py-2 rounded-xl bg-[#3045F5] hover:bg-[#2537D6] text-white font-bold text-xs sm:text-xs flex items-center space-x-2 transition shadow-sm shadow-[#3045F5]/30 cursor-pointer active:scale-98"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-200" />
          <span className="hidden sm:inline">Ask AI CFO</span>
          <span className="sm:hidden">AI CFO</span>
        </button>
      </div>
    </header>
  );
};
