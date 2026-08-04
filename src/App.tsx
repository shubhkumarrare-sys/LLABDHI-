import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { CashFlowCommandCenter } from './components/CashFlowCommandCenter';
import { DebtorsManager } from './components/DebtorsManager';
import { CreditorsManager } from './components/CreditorsManager';
import { EmiManager } from './components/EmiManager';
import { ComplianceManager } from './components/ComplianceManager';
import { AppsScriptAutomation } from './components/AppsScriptAutomation';
import { SettingsManager } from './components/SettingsManager';
import { AiCfoDrawer } from './components/AiCfoDrawer';
import { LoginPage } from './components/LoginPage';
import { GoogleSheetSyncModal } from './components/GoogleSheetSyncModal';

import {
  DebtorItem,
  CreditorItem,
  EmiItem,
  ComplianceItem,
  CalendarLogItem,
  EmailLogItem,
  AppSettings,
  ClientOverdueGroup,
  GstPayableState,
} from './types';

import {
  INITIAL_SETTINGS,
  INITIAL_DEBTORS,
  INITIAL_CREDITORS,
  INITIAL_EMIS,
  INITIAL_COMPLIANCE,
  INITIAL_CALENDAR_LOGS,
  INITIAL_EMAIL_LOGS,
  INITIAL_GST_PAYABLE,
} from './data/initialData';

import { Sparkles, X, Copy, Check, Send, Mail } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('llabdhi_ops_auth') === 'true';
  });

  const [activeTab, setActiveTab] = useState('dashboard');

  // Master Operational State (LLABDHI OPS NODE) with localStorage persistence
  const [debtors, setDebtors] = useState<DebtorItem[]>(() => {
    const saved = localStorage.getItem('llabdhi_debtors');
    return saved ? JSON.parse(saved) : INITIAL_DEBTORS;
  });
  const [creditors, setCreditors] = useState<CreditorItem[]>(() => {
    const saved = localStorage.getItem('llabdhi_creditors');
    return saved ? JSON.parse(saved) : INITIAL_CREDITORS;
  });
  const [emis, setEmis] = useState<EmiItem[]>(() => {
    const saved = localStorage.getItem('llabdhi_emis');
    return saved ? JSON.parse(saved) : INITIAL_EMIS;
  });
  const [compliance, setCompliance] = useState<ComplianceItem[]>(() => {
    const saved = localStorage.getItem('llabdhi_compliance');
    return saved ? JSON.parse(saved) : INITIAL_COMPLIANCE;
  });
  const [gstPayable, setGstPayable] = useState<GstPayableState>(() => {
    const saved = localStorage.getItem('llabdhi_gst_payable');
    if (!saved) return INITIAL_GST_PAYABLE;
    try {
      const parsed = JSON.parse(saved);
      // Migrate old primitive number format if present
      const mumbai = typeof parsed.mumbai === 'number' ? { payable: parsed.mumbai, receivable: 0 } : (parsed.mumbai || INITIAL_GST_PAYABLE.mumbai);
      const chennai = typeof parsed.chennai === 'number' ? { payable: parsed.chennai, receivable: 0 } : (parsed.chennai || INITIAL_GST_PAYABLE.chennai);
      const goa = typeof parsed.goa === 'number' ? { payable: parsed.goa, receivable: 0 } : (parsed.goa || INITIAL_GST_PAYABLE.goa);
      return {
        mumbai,
        chennai,
        goa,
        lastUpdated: parsed.lastUpdated || new Date().toISOString().split('T')[0],
      };
    } catch {
      return INITIAL_GST_PAYABLE;
    }
  });

  const handleUpdateGstPayable = (updated: GstPayableState) => {
    setGstPayable(updated);
    localStorage.setItem('llabdhi_gst_payable', JSON.stringify(updated));
  };
  const [calendarLogs, setCalendarLogs] = useState<CalendarLogItem[]>(INITIAL_CALENDAR_LOGS);
  const [emailLogs, setEmailLogs] = useState<EmailLogItem[]>(INITIAL_EMAIL_LOGS);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);

  // Google Sheet Sync Modal State
  const [isSheetSyncOpen, setIsSheetSyncOpen] = useState(false);

  // AI Drawer State
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [aiDrawerPrompt, setAiDrawerPrompt] = useState<string | undefined>(undefined);

  // Apply Data Updated from Google Sheet
  const handleApplySheetData = (newData: {
    debtors?: DebtorItem[];
    creditors?: CreditorItem[];
    emis?: EmiItem[];
    compliance?: ComplianceItem[];
    settings?: AppSettings;
  }) => {
    if (newData.debtors) {
      setDebtors(newData.debtors);
      localStorage.setItem('llabdhi_debtors', JSON.stringify(newData.debtors));
    }
    if (newData.creditors) {
      setCreditors(newData.creditors);
      localStorage.setItem('llabdhi_creditors', JSON.stringify(newData.creditors));
    }
    if (newData.emis) {
      setEmis(newData.emis);
      localStorage.setItem('llabdhi_emis', JSON.stringify(newData.emis));
    }
    if (newData.compliance) {
      setCompliance(newData.compliance);
      localStorage.setItem('llabdhi_compliance', JSON.stringify(newData.compliance));
    }
    if (newData.settings) setSettings(newData.settings);
  };

  // Email Draft Modal State
  const [emailDraftModal, setEmailDraftModal] = useState<{
    isOpen: boolean;
    clientEntity: string;
    draft: string;
    isLoading: boolean;
  }>({
    isOpen: false,
    clientEntity: '',
    draft: '',
    isLoading: false,
  });

  const [copiedDraft, setCopiedDraft] = useState(false);
  const [sendDraftSuccess, setSendDraftSuccess] = useState(false);

  // Handlers for Debtors
  const handleUpdateDebtor = (updated: DebtorItem) => {
    setDebtors((prev) => {
      const next = prev.map((d) => (d.id === updated.id ? updated : d));
      localStorage.setItem('llabdhi_debtors', JSON.stringify(next));
      return next;
    });
  };

  const handleAddDebtor = (newItem: DebtorItem) => {
    setDebtors((prev) => {
      const next = [newItem, ...prev];
      localStorage.setItem('llabdhi_debtors', JSON.stringify(next));
      return next;
    });
  };

  // Handlers for Creditors
  const handleUpdateCreditor = (updated: CreditorItem) => {
    setCreditors((prev) => {
      const next = prev.map((c) => (c.id === updated.id ? updated : c));
      localStorage.setItem('llabdhi_creditors', JSON.stringify(next));
      return next;
    });
  };

  const handleAddCreditor = (newItem: CreditorItem) => {
    setCreditors((prev) => {
      const next = [newItem, ...prev];
      localStorage.setItem('llabdhi_creditors', JSON.stringify(next));
      return next;
    });
  };

  // Handlers for EMIs
  const handleUpdateEmi = (updated: EmiItem) => {
    setEmis((prev) => {
      const next = prev.map((e) => (e.id === updated.id ? updated : e));
      localStorage.setItem('llabdhi_emis', JSON.stringify(next));
      return next;
    });
  };

  const handleAddEmi = (newItem: EmiItem) => {
    setEmis((prev) => {
      const next = [newItem, ...prev];
      localStorage.setItem('llabdhi_emis', JSON.stringify(next));
      return next;
    });
  };

  const handleDeleteEmi = (id: string) => {
    setEmis((prev) => {
      const next = prev.filter((e) => e.id !== id);
      localStorage.setItem('llabdhi_emis', JSON.stringify(next));
      return next;
    });
  };

  // Handlers for Compliance
  const handleUpdateCompliance = (updated: ComplianceItem) => {
    setCompliance((prev) => {
      const next = prev.map((c) => (c.id === updated.id ? updated : c));
      localStorage.setItem('llabdhi_compliance', JSON.stringify(next));
      return next;
    });
  };

  const handleAddCompliance = (newItem: ComplianceItem) => {
    setCompliance((prev) => {
      const next = [newItem, ...prev];
      localStorage.setItem('llabdhi_compliance', JSON.stringify(next));
      return next;
    });
  };

  const handleDeleteCompliance = (id: string) => {
    setCompliance((prev) => {
      const next = prev.filter((c) => c.id !== id);
      localStorage.setItem('llabdhi_compliance', JSON.stringify(next));
      return next;
    });
  };

  // Trigger AI Draft Payment Reminder Email for Client Group
  const handleGenerateEmailDraftForGroup = async (group: ClientOverdueGroup) => {
    setEmailDraftModal({
      isOpen: true,
      clientEntity: group.clientEntity,
      draft: '',
      isLoading: true,
    });

    try {
      const res = await fetch('/api/generate-email-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientEntity: group.clientEntity,
          invoices: group.invoices,
          totalOutstanding: group.totalOutstanding,
          contactPerson: group.invoices[0]?.contactPerson,
        }),
      });

      const data = await res.json();
      setEmailDraftModal({
        isOpen: true,
        clientEntity: group.clientEntity,
        draft: data.emailDraft || 'Draft could not be generated.',
        isLoading: false,
      });
    } catch (err: any) {
      setEmailDraftModal({
        isOpen: true,
        clientEntity: group.clientEntity,
        draft: `Failed to generate email draft: ${err?.message || 'Server error'}`,
        isLoading: false,
      });
    }
  };

  // Sync Google Calendar Simulation Handler
  const handleSyncCalendar = async () => {
    try {
      const res = await fetch('/api/sync-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emis,
          compliance,
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.createdLogs)) {
        setCalendarLogs((prev) => [...data.createdLogs, ...prev]);
      }
    } catch (err) {
      console.error('Calendar sync error:', err);
    }
  };

  // Trigger Email Alerts Simulation Handler
  const handleTriggerEmailAlerts = async () => {
    try {
      const res = await fetch('/api/trigger-email-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: settings.notificationEmail,
          summary: `5-Day Cash Flow Alert (${new Date().toLocaleDateString()})`,
        }),
      });

      const data = await res.json();
      if (data.success && data.log) {
        setEmailLogs((prev) => [data.log, ...prev]);
      }
    } catch (err) {
      console.error('Email alert error:', err);
    }
  };

  // Export Data JSON
  const handleExportData = () => {
    const fullDataset = {
      app: 'LLABDHI OPS NODE',
      company: 'Llabdhi Manufacturing LLP',
      exportedAt: new Date().toISOString(),
      settings,
      debtors,
      creditors,
      emis,
      compliance,
      calendarLogs,
      emailLogs,
    };

    const blob = new Blob([JSON.stringify(fullDataset, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LLABDHI_OPS_NODE_${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
  };

  // Reset Data to Initial
  const handleResetData = () => {
    if (window.confirm('Reset all LLABDHI OPS NODE data back to initial seed data?')) {
      setDebtors(INITIAL_DEBTORS);
      setCreditors(INITIAL_CREDITORS);
      setEmis(INITIAL_EMIS);
      setCompliance(INITIAL_COMPLIANCE);
      setCalendarLogs(INITIAL_CALENDAR_LOGS);
      setEmailLogs(INITIAL_EMAIL_LOGS);
      setSettings(INITIAL_SETTINGS);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('llabdhi_ops_auth');
    setIsAuthenticated(false);
  };

  const overdueCount = debtors.filter((d) => d.status === 'Overdue').length;

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openAiChat={() => {
          setAiDrawerPrompt(undefined);
          setIsAiDrawerOpen(true);
        }}
        openGoogleSheetSync={() => setIsSheetSyncOpen(true)}
        overdueCount={overdueCount}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <CashFlowCommandCenter
            debtors={debtors}
            creditors={creditors}
            emis={emis}
            compliance={compliance}
            gstPayable={gstPayable}
            onUpdateGstPayable={handleUpdateGstPayable}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenAiDraftEmail={(clientEntity) => {
              const grp = {
                clientEntity,
                totalOutstanding: 0,
                invoicesCount: 0,
                maxDaysOverdue: 0,
                invoices: debtors.filter((d) => d.clientEntity === clientEntity),
              };
              handleGenerateEmailDraftForGroup(grp);
            }}
            openAiChatWithPrompt={(prompt) => {
              setAiDrawerPrompt(prompt);
              setIsAiDrawerOpen(true);
            }}
          />
        )}

        {activeTab === 'debtors' && (
          <DebtorsManager
            debtors={debtors}
            onUpdateDebtor={handleUpdateDebtor}
            onAddDebtor={handleAddDebtor}
            onGenerateEmailDraft={handleGenerateEmailDraftForGroup}
          />
        )}

        {activeTab === 'creditors' && (
          <CreditorsManager
            creditors={creditors}
            onUpdateCreditor={handleUpdateCreditor}
            onAddCreditor={handleAddCreditor}
          />
        )}

        {activeTab === 'emis' && (
          <EmiManager
            emis={emis}
            onUpdateEmi={handleUpdateEmi}
            onAddEmi={handleAddEmi}
            onDeleteEmi={handleDeleteEmi}
          />
        )}

        {activeTab === 'compliance' && (
          <ComplianceManager
            complianceList={compliance}
            onUpdateCompliance={handleUpdateCompliance}
            onAddCompliance={handleAddCompliance}
            onDeleteCompliance={handleDeleteCompliance}
          />
        )}

        {activeTab === 'scripting' && (
          <AppsScriptAutomation
            calendarLogs={calendarLogs}
            emailLogs={emailLogs}
            emis={emis}
            compliance={compliance}
            debtors={debtors}
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

      {/* AI CFO Chat Drawer */}
      <AiCfoDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        dataContext={{
          debtors,
          creditors,
          emis,
          compliance,
          settings,
        }}
        initialPrompt={aiDrawerPrompt}
      />

      {/* EMAIL DRAFT GENERATION MODAL */}
      {emailDraftModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  AI Payment Reminder Email: {emailDraftModal.clientEntity}
                </h3>
              </div>
              <button
                onClick={() => setEmailDraftModal({ ...emailDraftModal, isOpen: false })}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {emailDraftModal.isLoading ? (
              <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Generating polite payment reminder template for {emailDraftModal.clientEntity} via Gemini 3.6 Flash...</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Generated Email Body (Editable)
                  </label>
                  <textarea
                    rows={12}
                    value={emailDraftModal.draft}
                    onChange={(e) =>
                      setEmailDraftModal({ ...emailDraftModal, draft: e.target.value })
                    }
                    className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-800 leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="text-[11px] text-slate-400">
                    Recipient: AP Contact ({emailDraftModal.clientEntity})
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(emailDraftModal.draft);
                        setCopiedDraft(true);
                        setTimeout(() => setCopiedDraft(false), 2000);
                      }}
                      className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 font-medium text-xs inline-flex items-center space-x-1.5 cursor-pointer text-slate-700"
                    >
                      {copiedDraft ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                      <span>{copiedDraft ? 'Copied!' : 'Copy Text'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setSendDraftSuccess(true);
                        setTimeout(() => {
                          setSendDraftSuccess(false);
                          setEmailDraftModal({ ...emailDraftModal, isOpen: false });
                        }, 1800);
                      }}
                      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center space-x-1.5 cursor-pointer shadow"
                    >
                      {sendDraftSuccess ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                      <span>{sendDraftSuccess ? 'Reminder Dispatched!' : 'Simulate Send Email'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* GOOGLE SHEET SYNC MODAL */}
      <GoogleSheetSyncModal
        isOpen={isSheetSyncOpen}
        onClose={() => setIsSheetSyncOpen(false)}
        onApplySheetData={handleApplySheetData}
        currentData={{
          debtors,
          creditors,
          emis,
          compliance,
          settings,
        }}
      />
    </div>
  );
}
