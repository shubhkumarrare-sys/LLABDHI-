import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { CashFlowCommandCenter } from './components/CashFlowCommandCenter';
import { EmiManager } from './components/EmiManager';
import { ComplianceManager } from './components/ComplianceManager';
import { AppsScriptAutomation } from './components/AppsScriptAutomation';
import { SettingsManager } from './components/SettingsManager';
import { AiCfoDrawer } from './components/AiCfoDrawer';
import { LoginPage } from './components/LoginPage';
import { GoogleSheetSyncModal } from './components/GoogleSheetSyncModal';

import {
  EmiItem,
  ComplianceItem,
  CalendarLogItem,
  EmailLogItem,
  AppSettings,
  GstPayableState,
} from './types';

import {
  INITIAL_SETTINGS,
  INITIAL_EMIS,
  INITIAL_COMPLIANCE,
  INITIAL_CALENDAR_LOGS,
  INITIAL_EMAIL_LOGS,
  INITIAL_GST_PAYABLE,
} from './data/initialData';

import {
  syncAllSheetData,
  EmiScheduleRow,
} from './services/googleSheetService';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const val = sessionStorage.getItem('llabdhi_ops_auth');
    return val === null ? true : val === 'true';
  });

  const [activeTab, setActiveTab] = useState('dashboard');

  // Master Operational State strictly initialized from cached storage or seed
  const [emis, setEmis] = useState<EmiItem[]>(() => {
    const saved = localStorage.getItem('llabdhi_emis_v4') || localStorage.getItem('llabdhi_emis_v3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_EMIS;
      }
    }
    return INITIAL_EMIS;
  });

  const [emiSchedule, setEmiSchedule] = useState<EmiScheduleRow[]>(() => {
    const saved = localStorage.getItem('llabdhi_emi_schedule_v4');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [compliance, setCompliance] = useState<ComplianceItem[]>(() => {
    const saved = localStorage.getItem('llabdhi_compliance_v4') || localStorage.getItem('llabdhi_compliance_v3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_COMPLIANCE;
      }
    }
    return INITIAL_COMPLIANCE;
  });

  const [gstPayable, setGstPayable] = useState<GstPayableState>(() => {
    const saved = localStorage.getItem('llabdhi_gst_payable_v1');
    return saved ? JSON.parse(saved) : INITIAL_GST_PAYABLE;
  });

  const [calendarLogs, setCalendarLogs] = useState<CalendarLogItem[]>(() => {
    const saved = localStorage.getItem('llabdhi_cal_logs_v1');
    return saved ? JSON.parse(saved) : INITIAL_CALENDAR_LOGS;
  });

  const [emailLogs, setEmailLogs] = useState<EmailLogItem[]>(() => {
    const saved = localStorage.getItem('llabdhi_email_logs_v1');
    return saved ? JSON.parse(saved) : INITIAL_EMAIL_LOGS;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('llabdhi_settings_v1');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  // UI States
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSheetSyncOpen, setIsSheetSyncOpen] = useState(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [aiDrawerPrompt, setAiDrawerPrompt] = useState<string | undefined>(undefined);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // Live Sheet Polling States
  const [isRefreshingSheet, setIsRefreshingSheet] = useState(false);
  const [refreshStatusMessage, setRefreshStatusMessage] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return localStorage.getItem('llabdhi_last_sync_timestamp') || '';
  });
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(true);

  // Core background sync executor
  const executeSync = async (isManual = false) => {
    if (isManual) setIsRefreshingSheet(true);

    try {
      const result = await syncAllSheetData();

      if (result.success) {
        if (result.compliance.length > 0) {
          setCompliance(result.compliance);
        }
        if (result.emis.length > 0) {
          setEmis(result.emis);
        }
        if (result.emiSchedule.length > 0) {
          setEmiSchedule(result.emiSchedule);
        }

        setLastSyncTime(result.lastUpdated);
        setIsLiveConnected(true);

        if (isManual) {
          setRefreshStatusMessage(`Live Google Sheet synchronized at ${result.lastUpdated}`);
          setTimeout(() => setRefreshStatusMessage(null), 4000);
        }
      } else {
        setIsLiveConnected(false);
        if (isManual) {
          setRefreshStatusMessage(`Sync issue: ${result.error || 'Connection failed'}`);
          setTimeout(() => setRefreshStatusMessage(null), 5000);
        }
      }
    } catch (err: any) {
      console.warn('Sync cycle encountered error:', err);
      setIsLiveConnected(false);
    } finally {
      if (isManual) setIsRefreshingSheet(false);
    }
  };

  // 15-SECOND AUTOMATIC LIVE POLLING FROM GOOGLE SHEETS
  // Detects changes (e.g. Done or Status checkboxes ticked/unticked) within 15-30s
  useEffect(() => {
    // Immediate initial sync
    executeSync(false);

    // Setup 15-second polling interval
    const POLL_INTERVAL_MS = 15000;
    const intervalId = setInterval(() => {
      executeSync(false);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, []);

  const handleManualRefreshSheet = () => {
    executeSync(true);
  };

  // Operational Handlers
  const handleUpdateEmi = (updated: EmiItem) => {
    setEmis((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  };

  const handleAddEmi = (newItem: EmiItem) => {
    setEmis((prev) => [newItem, ...prev]);
  };

  const handleDeleteEmi = (id: string) => {
    setEmis((prev) => prev.filter((e) => e.id !== id));
  };

  const handleUpdateCompliance = (updated: ComplianceItem) => {
    setCompliance((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleAddCompliance = (newItem: ComplianceItem) => {
    setCompliance((prev) => [newItem, ...prev]);
  };

  const handleDeleteCompliance = (id: string) => {
    setCompliance((prev) => prev.filter((c) => c.id !== id));
  };

  const handleUpdateGstPayable = (updated: GstPayableState) => {
    setGstPayable(updated);
    localStorage.setItem('llabdhi_gst_payable_v1', JSON.stringify(updated));
  };

  // Apps Script sync & simulation
  const handleSyncCalendar = async () => {
    const timestamp = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newLogs: CalendarLogItem[] = [];

    // Log compliance
    compliance.slice(0, 3).forEach((c, idx) => {
      newLogs.push({
        id: `cal-${Date.now()}-${idx}`,
        eventTitle: `${c.governingAuthority}: ${c.title}`,
        eventDate: c.dueDate,
        targetTab: 'LLP_Compliance',
        itemRefId: c.id,
        googleEventId: `cal_event_cmp_${c.id}`,
        syncStatus: 'Synced',
        syncId: `SYNC-${Date.now()}-${idx}`,
        timestamp,
      });
    });

    // Log EMIs
    emis.slice(0, 3).forEach((e, idx) => {
      newLogs.push({
        id: `cal-emi-${Date.now()}-${idx}`,
        eventTitle: `Loan EMI: ${e.loanName}`,
        eventDate: e.nextDueDate,
        targetTab: 'EMIs',
        itemRefId: e.id,
        googleEventId: `cal_event_emi_${e.id}`,
        syncStatus: 'Synced',
        syncId: `SYNC-EMI-${Date.now()}-${idx}`,
        timestamp,
      });
    });

    setCalendarLogs((prev) => [...newLogs, ...prev].slice(0, 30));
    localStorage.setItem('llabdhi_cal_logs_v1', JSON.stringify(newLogs));
  };

  const handleTriggerEmailAlerts = async () => {
    const timestamp = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const pendingComp = compliance.filter((c) => c.status !== 'Filed');
    const newLogs: EmailLogItem[] = [];

    if (pendingComp.length > 0) {
      newLogs.push({
        id: `email-${Date.now()}-1`,
        recipient: settings.notificationEmail,
        subject: `[Executive Action] Upcoming Compliance Deadlines (${pendingComp.length} Pending)`,
        itemRef: pendingComp[0].id,
        triggerType: 'Upcoming (-3d)',
        syncId: `EMAIL-SYNC-${Date.now()}-1`,
        timestamp,
        status: 'Sent',
      });
    }

    const pendingEmisList = emis.filter((e) => e.status !== 'Paid');
    if (pendingEmisList.length > 0) {
      newLogs.push({
        id: `email-${Date.now()}-2`,
        recipient: settings.notificationEmail,
        subject: `[Bank ACH Alert] Upcoming Loan EMI Installments (${pendingEmisList.length} Facilities)`,
        itemRef: pendingEmisList[0].id,
        triggerType: 'Due Today',
        syncId: `EMAIL-SYNC-${Date.now()}-2`,
        timestamp,
        status: 'Sent',
      });
    }

    setEmailLogs((prev) => [...newLogs, ...prev].slice(0, 30));
    localStorage.setItem('llabdhi_email_logs_v1', JSON.stringify(newLogs));
  };

  // Export JSON backup
  const handleExportData = () => {
    const fullDataset = {
      exportedAt: new Date().toISOString(),
      emis,
      emiSchedule,
      compliance,
      settings,
      calendarLogs,
      emailLogs,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullDataset, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `llabdhi-ops-backup-${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleResetData = () => {
    if (window.confirm('Reset local cache to Google Sheet defaults?')) {
      localStorage.removeItem('llabdhi_compliance_v4');
      localStorage.removeItem('llabdhi_emis_v4');
      localStorage.removeItem('llabdhi_emi_schedule_v4');
      executeSync(true);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('llabdhi_ops_auth');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  // Count overdue or pending compliance for badge
  const pendingComplianceCount = compliance.filter((c) => c.status !== 'Filed').length;

  return (
    <div className="flex h-screen bg-[#F6F8FC] overflow-x-hidden font-sans text-[#171B3A] antialiased">
      {/* Persistent Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        overdueCount={pendingComplianceCount}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onRefreshSheet={handleManualRefreshSheet}
        isRefreshingSheet={isRefreshingSheet}
        refreshStatusMessage={refreshStatusMessage}
        openGoogleSheetSync={() => setIsSheetSyncOpen(true)}
        onLogout={handleLogout}
        lastUpdatedTime={lastSyncTime}
        isLiveConnected={isLiveConnected}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          activeTab={activeTab}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          openAiChat={() => {
            setAiDrawerPrompt(undefined);
            setIsAiDrawerOpen(true);
          }}
          onRefreshSheet={handleManualRefreshSheet}
          isRefreshingSheet={isRefreshingSheet}
          refreshStatusMessage={refreshStatusMessage}
          overdueCount={pendingComplianceCount}
          emis={emis}
          compliance={compliance}
          onNavigateTab={(tab) => setActiveTab(tab)}
          searchQuery={globalSearchQuery}
          onSearchChange={(q) => setGlobalSearchQuery(q)}
          lastUpdatedTime={lastSyncTime}
          isLiveConnected={isLiveConnected}
        />

        {/* Refresh Status Toast */}
        {refreshStatusMessage && (
          <div className="mx-4 sm:mx-8 mt-4 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between shadow-2xs">
            <span className="font-semibold">{refreshStatusMessage}</span>
            <button
              onClick={() => setRefreshStatusMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold ml-4 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Page Canvas */}
        <main className="flex-1 px-4 sm:px-8 py-6 w-full max-w-[1600px] overflow-y-auto">
          {activeTab === 'dashboard' && (
            <CashFlowCommandCenter
              emis={emis}
              compliance={compliance}
              gstPayable={gstPayable}
              onUpdateGstPayable={handleUpdateGstPayable}
              onNavigateTab={(tab) => setActiveTab(tab)}
              openAiChatWithPrompt={(prompt) => {
                setAiDrawerPrompt(prompt);
                setIsAiDrawerOpen(true);
              }}
              onRefreshSheet={handleManualRefreshSheet}
              isRefreshingSheet={isRefreshingSheet}
              lastUpdatedTime={lastSyncTime}
              isLiveConnected={isLiveConnected}
            />
          )}

          {activeTab === 'emis' && (
            <EmiManager
              emis={emis}
              emiSchedule={emiSchedule}
              onUpdateEmi={handleUpdateEmi}
              onAddEmi={handleAddEmi}
              onDeleteEmi={handleDeleteEmi}
              onRefreshSheet={handleManualRefreshSheet}
              isRefreshingSheet={isRefreshingSheet}
              lastUpdatedTime={lastSyncTime}
              isLiveConnected={isLiveConnected}
            />
          )}

          {activeTab === 'compliance' && (
            <ComplianceManager
              complianceList={compliance}
              onUpdateCompliance={handleUpdateCompliance}
              onAddCompliance={handleAddCompliance}
              onDeleteCompliance={handleDeleteCompliance}
              onRefreshSheet={handleManualRefreshSheet}
              isRefreshingSheet={isRefreshingSheet}
              lastUpdatedTime={lastSyncTime}
              isLiveConnected={isLiveConnected}
            />
          )}

          {activeTab === 'scripting' && (
            <AppsScriptAutomation
              calendarLogs={calendarLogs}
              emailLogs={emailLogs}
              emis={emis}
              compliance={compliance}
              settings={settings}
              onSyncCalendar={handleSyncCalendar}
              onTriggerEmailAlerts={handleTriggerEmailAlerts}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsManager
              settings={settings}
              onUpdateSettings={(newSet) => setSettings(newSet)}
              onExportData={handleExportData}
              onResetData={handleResetData}
            />
          )}
        </main>
      </div>

      {/* AI CFO Chat Drawer */}
      <AiCfoDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        dataContext={{
          emis,
          compliance,
          settings,
        }}
        initialPrompt={aiDrawerPrompt}
      />

      {/* Google Sheet Live Sync Connection Modal */}
      <GoogleSheetSyncModal
        isOpen={isSheetSyncOpen}
        onClose={() => setIsSheetSyncOpen(false)}
        onApplySheetData={(data) => {
          if (data.compliance && data.compliance.length > 0) setCompliance(data.compliance);
          if (data.emis && data.emis.length > 0) setEmis(data.emis);
          if (data.emiSchedule && data.emiSchedule.length > 0) setEmiSchedule(data.emiSchedule);
          if (data.settings) setSettings(data.settings);
          setRefreshStatusMessage('Applied Google Sheet updates to dashboard!');
        }}
        currentData={{
          emis,
          compliance,
          settings,
        }}
      />
    </div>
  );
}
