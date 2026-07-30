import React, { useState } from 'react';
import { CalendarLogItem, EmailLogItem, EmiItem, ComplianceItem, DebtorItem, AppSettings } from '../types';
import { GOOGLE_CALENDAR_SYNC_SCRIPT, AUTOMATED_EMAIL_REMINDER_SCRIPT } from '../data/scriptTemplates';
import {
  Code2,
  Calendar,
  Mail,
  Play,
  Copy,
  Check,
  RefreshCw,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface AppsScriptAutomationProps {
  calendarLogs: CalendarLogItem[];
  emailLogs: EmailLogItem[];
  emis: EmiItem[];
  compliance: ComplianceItem[];
  debtors: DebtorItem[];
  settings: AppSettings;
  onSyncCalendar: () => Promise<void>;
  onTriggerEmailAlerts: () => Promise<void>;
}

export const AppsScriptAutomation: React.FC<AppsScriptAutomationProps> = ({
  calendarLogs,
  emailLogs,
  emis,
  compliance,
  debtors,
  settings,
  onSyncCalendar,
  onTriggerEmailAlerts,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'calendarSync' | 'emailScript' | 'calendarLogs' | 'emailLogs'>('calendarSync');
  const [copiedScript, setCopiedScript] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(type);
    setTimeout(() => setCopiedScript(null), 2500);
  };

  const handleRunCalendarSync = async () => {
    setIsSyncing(true);
    await onSyncCalendar();
    setIsSyncing(false);
  };

  const handleRunEmailAlerts = async () => {
    setIsEmailing(true);
    await onTriggerEmailAlerts();
    setIsEmailing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Code2 className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900">
              Google Apps Script Automations & Operations Logs
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Production Google Apps Script code for Google Calendar Sync & Automated Email Reminders ({settings.notificationEmail}), plus real-time execution logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleRunCalendarSync}
            disabled={isSyncing}
            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs inline-flex items-center space-x-2 transition cursor-pointer shadow disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing Calendar...' : 'Run Calendar Sync Now'}</span>
          </button>

          <button
            onClick={handleRunEmailAlerts}
            disabled={isEmailing}
            className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs inline-flex items-center space-x-2 transition cursor-pointer shadow disabled:opacity-50"
          >
            <Mail className={`w-3.5 h-3.5 ${isEmailing ? 'animate-bounce' : ''}`} />
            <span>{isEmailing ? 'Sending Alerts...' : 'Trigger Email Alerts Now'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 space-x-2 bg-white px-4 pt-3 rounded-t-xl">
        <button
          onClick={() => setActiveSubTab('calendarSync')}
          className={`pb-3 text-xs font-bold transition flex items-center space-x-2 border-b-2 cursor-pointer ${
            activeSubTab === 'calendarSync'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Google Calendar Sync Script</span>
        </button>

        <button
          onClick={() => setActiveSubTab('emailScript')}
          className={`pb-3 text-xs font-bold transition flex items-center space-x-2 border-b-2 cursor-pointer ${
            activeSubTab === 'emailScript'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Automated Email Reminder Script</span>
        </button>

        <button
          onClick={() => setActiveSubTab('calendarLogs')}
          className={`pb-3 text-xs font-bold transition flex items-center space-x-2 border-b-2 cursor-pointer ${
            activeSubTab === 'calendarLogs'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Calendar Logs Tab ({calendarLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('emailLogs')}
          className={`pb-3 text-xs font-bold transition flex items-center space-x-2 border-b-2 cursor-pointer ${
            activeSubTab === 'emailLogs'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Email Logs Tab ({emailLogs.length})</span>
        </button>
      </div>

      {/* SUB-TAB 1: Google Calendar Sync Script Code */}
      {activeSubTab === 'calendarSync' && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden text-slate-100 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="font-bold text-sm text-white flex items-center space-x-2">
                <span>Google Apps Script: Calendar Sync Engine</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono border border-emerald-500/30">
                  Ready to Deploy
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Reads 'EMIs' & 'LLP_Compliance' tabs for due items in next 7 days and syncs to Google Calendar.
              </p>
            </div>

            <button
              onClick={() => handleCopy(GOOGLE_CALENDAR_SYNC_SCRIPT, 'cal')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center space-x-1.5 transition cursor-pointer border border-slate-700"
            >
              {copiedScript === 'cal' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedScript === 'cal' ? 'Copied to Clipboard!' : 'Copy Code'}</span>
            </button>
          </div>

          <pre className="text-[11px] font-mono bg-slate-950 p-4 rounded-lg border border-slate-800/80 overflow-x-auto text-emerald-300 max-h-96 leading-relaxed">
            <code>{GOOGLE_CALENDAR_SYNC_SCRIPT}</code>
          </pre>
        </div>
      )}

      {/* SUB-TAB 2: Automated Email Reminder Script Code */}
      {activeSubTab === 'emailScript' && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden text-slate-100 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="font-bold text-sm text-white flex items-center space-x-2">
                <span>Google Apps Script: Email Trigger Engine</span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-[10px] font-mono border border-indigo-500/30">
                  Recipient: {settings.notificationEmail}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Triggers alerts based on Settings reminder schedule: [-7, -5, -3, -2, -1, 0, 1, 2, 3, 7] days relative to due dates.
              </p>
            </div>

            <button
              onClick={() => handleCopy(AUTOMATED_EMAIL_REMINDER_SCRIPT, 'email')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center space-x-1.5 transition cursor-pointer border border-slate-700"
            >
              {copiedScript === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedScript === 'email' ? 'Copied to Clipboard!' : 'Copy Code'}</span>
            </button>
          </div>

          <pre className="text-[11px] font-mono bg-slate-950 p-4 rounded-lg border border-slate-800/80 overflow-x-auto text-blue-300 max-h-96 leading-relaxed">
            <code>{AUTOMATED_EMAIL_REMINDER_SCRIPT}</code>
          </pre>
        </div>
      )}

      {/* SUB-TAB 3: Calendar Logs Tab */}
      {activeSubTab === 'calendarLogs' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-bold text-sm text-slate-800">
              Calendar Logs Sheet Records
            </h2>
            <span className="text-xs font-mono text-slate-500">
              Total Logs: {calendarLogs.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Log ID</th>
                  <th className="p-3">Sync Timestamp</th>
                  <th className="p-3">Google Calendar Event Title</th>
                  <th className="p-3">Event Date</th>
                  <th className="p-3">Target Tab</th>
                  <th className="p-3">Item Ref ID</th>
                  <th className="p-3">Google Event ID</th>
                  <th className="p-3 text-center">Sync Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {calendarLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono text-slate-500 font-bold">{log.id}</td>
                    <td className="p-3 text-slate-600">{log.timestamp}</td>
                    <td className="p-3 font-semibold text-slate-900">{log.eventTitle}</td>
                    <td className="p-3 text-slate-700">{log.eventDate}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">
                        {log.targetTab}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-600">{log.itemRefId}</td>
                    <td className="p-3 font-mono text-indigo-600 text-[10px]">{log.googleEventId}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        {log.syncStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: Email Logs Tab */}
      {activeSubTab === 'emailLogs' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-bold text-sm text-slate-800">
              Email Logs Sheet Records
            </h2>
            <span className="text-xs font-mono text-slate-500">
              Total Email Dispatches: {emailLogs.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Log ID</th>
                  <th className="p-3">Execution Timestamp</th>
                  <th className="p-3">Recipient Email</th>
                  <th className="p-3">Subject Line</th>
                  <th className="p-3">Item Ref Summary</th>
                  <th className="p-3">Trigger Type</th>
                  <th className="p-3">Sync ID</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {emailLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono text-slate-500 font-bold">{log.id}</td>
                    <td className="p-3 text-slate-600">{log.timestamp}</td>
                    <td className="p-3 font-mono text-slate-800 font-medium">{log.recipient}</td>
                    <td className="p-3 font-semibold text-slate-900">{log.subject}</td>
                    <td className="p-3 text-slate-600">{log.itemRef}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold text-[10px]">
                        {log.triggerType}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-500 text-[10px]">{log.syncId}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
