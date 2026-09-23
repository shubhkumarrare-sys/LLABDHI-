import React from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  Car,
  FileCheck2,
  Code2,
  Settings,
  RefreshCw,
  FileSpreadsheet,
  LogOut,
  X,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  overdueCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onRefreshSheet?: () => void;
  isRefreshingSheet?: boolean;
  refreshStatusMessage?: string | null;
  openGoogleSheetSync?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  overdueCount,
  isOpenMobile,
  onCloseMobile,
  onRefreshSheet,
  isRefreshingSheet,
  openGoogleSheetSync,
  onLogout,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Command Center',
      sublabel: '5, 10, 15 & 30-Day Liquidity',
      icon: LayoutDashboard,
    },
    {
      id: 'debtors',
      label: 'Debtors (AR)',
      sublabel: 'Receivables & Aging',
      icon: Users,
      badge: overdueCount > 0 ? overdueCount : undefined,
      badgeVariant: 'danger' as const,
    },
    {
      id: 'creditors',
      label: 'Creditors (AP)',
      sublabel: 'Payables & Raw Materials',
      icon: Building2,
    },
    {
      id: 'emis',
      label: 'Loans & EMIs',
      sublabel: 'Car Loans & Vehicles',
      icon: Car,
    },
    {
      id: 'compliance',
      label: 'LLP Compliance',
      sublabel: 'GST, MCA V3 & TDS',
      icon: FileCheck2,
    },
    {
      id: 'scripting',
      label: 'Apps Script & Logs',
      sublabel: 'Google Calendar & .ics Export',
      icon: Code2,
    },
    {
      id: 'settings',
      label: 'Settings & Backup',
      sublabel: 'Thresholds & JSON Export',
      icon: Settings,
    },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#E8EBF2] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-white p-1 rounded-xl border border-[#E8EBF2] shadow-xs flex items-center justify-center shrink-0">
            <img
              src="https://llabdhi.com/assets/img/llabdhi_img/Llabdhi_Mfgr_LLP3223.png"
              alt="Llabdhi Manufacturing LLP Logo"
              referrerPolicy="no-referrer"
              className="h-8 w-auto object-contain max-w-[125px]"
            />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-sm tracking-tight text-[#171B3A]">
                LLABDHI OPS
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            </div>
            <p className="text-[10px] text-[#7D8499] font-medium leading-tight">
              Executive Node • Manufacturing LLP
            </p>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 text-[#7D8499] hover:text-[#171B3A] hover:bg-[#F7F9FC] rounded-lg transition"
          aria-label="Close Sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Live Google Sheet Status Banner */}
      <div className="px-5 py-3 border-b border-[#E8EBF2] bg-[#F7F9FC]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
            <span className="text-[11px] font-semibold text-[#171B3A]">Live Sheet Sync</span>
          </div>

          <div className="flex items-center space-x-1">
            {onRefreshSheet && (
              <button
                onClick={onRefreshSheet}
                disabled={isRefreshingSheet}
                title="Refresh Live Google Sheet"
                className="p-1 rounded-md text-[#7D8499] hover:text-[#3045F5] hover:bg-white border border-transparent hover:border-[#E8EBF2] transition cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isRefreshingSheet ? 'animate-spin text-[#3045F5]' : ''}`}
                />
              </button>
            )}

            {openGoogleSheetSync && (
              <button
                onClick={openGoogleSheetSync}
                title="Google Sheet Link Settings"
                className="p-1 rounded-md text-[#7D8499] hover:text-[#3045F5] hover:bg-white border border-transparent hover:border-[#E8EBF2] transition cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#7D8499]">
          Menu
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all relative group cursor-pointer ${
                isActive
                  ? 'bg-[#EFF2FE] text-[#3045F5] font-semibold'
                  : 'text-[#7D8499] hover:bg-[#F7F9FC] hover:text-[#171B3A] font-medium'
              }`}
            >
              {/* Left active indicator pill */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#3045F5] rounded-r-full" />
              )}

              <div className="flex items-center space-x-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-[#3045F5]' : 'text-[#7D8499] group-hover:text-[#171B3A]'
                  }`}
                />
                <div className="truncate">
                  <span className="text-xs block leading-tight">{item.label}</span>
                  <span
                    className={`text-[10px] block leading-tight truncate ${
                      isActive ? 'text-[#3045F5]/70' : 'text-[#7D8499]/70'
                    }`}
                  >
                    {item.sublabel}
                  </span>
                </div>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums shrink-0 ${
                    item.badgeVariant === 'danger'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-indigo-100 text-[#3045F5]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom User Profile Section */}
      <div className="p-3 border-t border-[#E8EBF2] bg-[#F7F9FC]/60">
        <div className="p-2.5 rounded-xl bg-white border border-[#E8EBF2] shadow-xs flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#3045F5] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              NB
            </div>
            <div className="truncate">
              <span className="text-xs font-bold text-[#171B3A] block leading-tight truncate">
                Narendra Bothra
              </span>
              <span className="text-[10px] text-[#7D8499] block leading-tight truncate">
                Managing Partner
              </span>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-[#7D8499] hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="mt-2 px-1 flex items-center justify-between text-[10px] text-[#7D8499]">
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-3 h-3 text-[#10B981]" />
            <span>Secure 256-bit</span>
          </span>
          <span>v3.4.0</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-[250px] shrink-0 border-r border-[#E8EBF2] h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="lg:hidden fixed inset-0 bg-[#171B3A]/40 backdrop-blur-xs z-50 transition-opacity"
        />
      )}

      {/* Mobile Drawer Content */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 w-[270px] z-50 shadow-2xl transform transition-transform duration-250 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
};
