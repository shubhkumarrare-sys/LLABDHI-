import React from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  Car,
  FileCheck2,
  Code2,
  Settings,
  Bot,
  LogOut,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openAiChat: () => void;
  overdueCount: number;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openAiChat,
  overdueCount,
  onLogout,
}) => {
  const navItems = [
    { id: 'dashboard', label: '5-Day Command Center', icon: LayoutDashboard },
    { id: 'debtors', label: 'Debtors (AR)', icon: Users, badge: overdueCount > 0 ? overdueCount : undefined },
    { id: 'creditors', label: 'Creditors (AP)', icon: Building2 },
    { id: 'emis', label: 'EMIs (Car Loans)', icon: Car },
    { id: 'compliance', label: 'LLP Compliance', icon: FileCheck2 },
    { id: 'scripting', label: 'Apps Script & Logs', icon: Code2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="bg-white p-1 rounded-lg flex items-center justify-center shadow-sm">
              <img
                src="https://llabdhi.com/assets/img/llabdhi_img/Llabdhi_Mfgr_LLP3223.png"
                alt="Llabdhi Manufacturing LLP Logo"
                referrerPolicy="no-referrer"
                className="h-9 w-auto object-contain max-w-[140px]"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">LLABDHI OPS NODE</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
                  Google Sheet Connected
                </span>
              </div>
              <p className="text-xs text-slate-400">Llabdhi Manufacturing LLP • AI Chief Financial Manager</p>
            </div>
          </div>

          {/* AI Manager & Logout Action Buttons */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={openAiChat}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm transition-all shadow-sm hover:shadow group cursor-pointer"
            >
              <Bot className="w-4 h-4 text-indigo-200 group-hover:scale-110 transition-transform" />
              <span>Ask AI CFO</span>
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                title="Log Out"
                className="inline-flex items-center space-x-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 text-xs font-semibold transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto pb-2 scrollbar-none border-t border-slate-800/80 pt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
