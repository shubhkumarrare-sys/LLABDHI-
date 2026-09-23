import React, { useState } from 'react';
import { CalendarLogItem, EmailLogItem, EmiItem, ComplianceItem, DebtorItem, AppSettings } from '../types';
import { GOOGLE_CALENDAR_SYNC_SCRIPT, AUTOMATED_EMAIL_REMINDER_SCRIPT } from '../data/scriptTemplates';
import { generateIcsCalendar, downloadIcsFile } from '../utils/icsExport';
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
  Download,
  CalendarCheck,
  FileDown,
  AlertCircle,
  Info,
  SlidersHorizontal,
  ChevronRight,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface AppsScriptAutomationProps {
  calendarLogs: CalendarLogItem[];
  emailLogs: EmailLogItem[];
  emis: EmiItem[];
  compliance: ComplianceItem[];
  debtors?: DebtorItem[];
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
  const [activeSubTab, setActiveSubTab] = useState<'calendarSync' | 'icsExport' | 'emailScript' | 'calendarLogs' | 'emailLogs'>('calendarSync');
  const [copiedScript, setCopiedScript] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);

  // ICS Export State
  const [icsIncludeEmis, setIcsIncludeEmis] = useState(true);
  const [icsIncludeCompliance, setIcsIncludeCompliance] = useState(true);
  const [icsOnlyUpcoming, setIcsOnlyUpcoming] = useState(true);
  const [icsAddReminders, setIcsAddReminders] = useState(true);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedIcs, setCopiedIcs] = useState(false);
  const [showIcsCode, setShowIcsCode] = useState(false);

  // Filtered lists for preview and counts
  const filteredEmis = emis.filter((e) => !icsOnlyUpcoming || e.status !== 'Paid');
  const filteredCompliance = compliance.filter((c) => !icsOnlyUpcoming || (c.status !== 'Filed' && c.status !== 'Paid'));
  
  const totalUpcomingEmiSum = filteredEmis.reduce((sum, e) => sum + (e.monthlyEmi || 0), 0);
  const totalExportCount = (icsIncludeEmis ? filteredEmis.length : 0) + (icsIncludeCompliance ? filteredCompliance.length : 0);

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

  const handleDownloadIcs = () => {
    const icsContent = generateIcsCalendar(emis, compliance, {
      includeEmis: icsIncludeEmis,
      includeCompliance: icsIncludeCompliance,
      onlyUpcomingAndPending: icsOnlyUpcoming,
      addReminders: icsAddReminders,
      calendarTitle: 'Llabdhi Upcoming EMIs & Compliance',
    });

    const dateStr = new Date().toISOString().slice(0, 10);
    downloadIcsFile(icsContent, `llabdhi-upcoming-emis-compliance-${dateStr}.ics`);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleCopyIcs = () => {
    const icsContent = generateIcsCalendar(emis, compliance, {
      includeEmis: icsIncludeEmis,
      includeCompliance: icsIncludeCompliance,
      onlyUpcomingAndPending: icsOnlyUpcoming,
      addReminders: icsAddReminders,
      calendarTitle: 'Llabdhi Upcoming EMIs & Compliance',
    });
    navigator.clipboard.writeText(icsContent);
    setCopiedIcs(true);
    setTimeout(() => setCopiedIcs(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-[#E8EBF2] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#EFF2FE] text-[#3045F5]">
              <Code2 className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-[#171B3A]">
              Google Apps Script Automations & Operations Logs
            </h1>
          </div>
          <p className="text-xs text-[#7D8499] mt-1 font-medium">
            Production Google Apps Script code for Google Calendar Sync & Automated Email Reminders ({settings.notificationEmail}), plus real-time execution logs and universal .ics calendar export.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Quick .ics Calendar Download */}
          <button
            onClick={handleDownloadIcs}
            className="px-3.5 py-2 rounded-xl bg-[#3045F5] hover:bg-[#2537D6] text-white font-bold text-xs inline-flex items-center space-x-2 transition cursor-pointer shadow-xs"
            title="Download .ics calendar file for Outlook, Apple Calendar, Google Calendar"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Downloaded .ics!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download .ics Calendar</span>
              </>
            )}
          </button>

          <button
            onClick={handleRunCalendarSync}
            disabled={isSyncing}
            className="px-3.5 py-2 rounded-xl bg-[#10B981] hover:bg-emerald-600 text-white font-bold text-xs inline-flex items-center space-x-2 transition cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing Calendar...' : 'Run Calendar Sync Now'}</span>
          </button>

          <button
            onClick={handleRunEmailAlerts}
            disabled={isEmailing}
            className="px-3.5 py-2 rounded-xl bg-[#171B3A] hover:bg-slate-800 text-white font-bold text-xs inline-flex items-center space-x-2 transition cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Mail className={`w-3.5 h-3.5 ${isEmailing ? 'animate-bounce' : ''}`} />
            <span>{isEmailing ? 'Sending Alerts...' : 'Trigger Email Alerts Now'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-[#E8EBF2] space-x-2 bg-white px-4 pt-3 rounded-2xl shadow-xs overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('calendarSync')}
          className={`pb-3 text-xs font-bold transition flex items-center space-x-2 border-b-2 cursor-pointer whitespace-nowrap ${
            activeSubTab === 'calendarSync'
              ? 'border-[#3045F5] text-[#3045F5]'
              : 'border-transparent text-[#7D8499] hover:text-[#171B3A]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Google Calendar Sync Script</span>
        </button>

        <button
          onClick={() => setActiveSubTab('icsExport')}
          className={`pb-3 text-xs font-bold transition flex items-center space-x-2 border-b-2 cursor-pointer whitespace-nowrap ${
            activeSubTab === 'icsExport'
              ? 'border-[#3045F5] text-[#3045F5]'
              : 'border-transparent text-[#7D8499] hover:text-[#171B3A]'
          }`}
        >
          <Download className="w-4 h-4 text-[#3045F5]" />
          <span>Download .ics Calendar</span>
          <span className="px-1.5 py-0.5 rounded-full bg-[#EFF2FE] text-[#3045F5] text-[10px] font-bold">
            {totalExportCount}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('emailScript')}
          className={`pb-3 text-xs font-bold transition flex items-center space-x-2 border-b-2 cursor-pointer whitespace-nowrap ${
            activeSubTab === 'emailScript'
              ? 'border-[#3045F5] text-[#3045F5]'
              : 'border-transparent text-[#7D8499] hover:text-[#171B3A]'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Automated Email Reminder Script</span>
        </button>

        <button
          onClick={() => setActiveSubTab('calendarLogs')}
          className={`pb-3 text-xs font-bold transition flex items-center space-x-2 border-b-2 cursor-pointer whitespace-nowrap ${
            activeSubTab === 'calendarLogs'
              ? 'border-[#3045F5] text-[#3045F5]'
              : 'border-transparent text-[#7D8499] hover:text-[#171B3A]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Calendar Logs Tab ({calendarLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('emailLogs')}
          className={`pb-3 text-xs font-bold transition flex items-center space-x-2 border-b-2 cursor-pointer whitespace-nowrap ${
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
        <div className="space-y-4">
          {/* Offline .ics Export Quick Tip Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-blue-600 text-white shrink-0 mt-0.5">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Universal Calendar Import (.ics File)
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Want to import all upcoming EMIs ({filteredEmis.length}) and compliance items ({filteredCompliance.length}) straight into Apple Calendar, Microsoft Outlook, or Google Calendar without script deployment?
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveSubTab('icsExport')}
              className="px-3.5 py-1.5 rounded-lg bg-white border border-blue-300 hover:bg-blue-50 text-blue-700 text-xs font-semibold inline-flex items-center space-x-1.5 transition shrink-0 cursor-pointer shadow-xs"
            >
              <span>Open .ics Calendar Exporter</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

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
                  Reads 'EMIs', 'Creditors', 'Debtors' & 'LLP_Compliance' tabs for upcoming due items and syncs to Google Calendar with invitation accept links & guest invites sent to (narendrabothra@llabdhigroup.in, ea@llabdhigroup.in).
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
        </div>
      )}

      {/* SUB-TAB 2: Universal .ics Calendar File Generator */}
      {activeSubTab === 'icsExport' && (
        <div className="space-y-6">
          {/* Main Exporter Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Generate & Download .ics Calendar File
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Export upcoming loan EMIs and statutory compliance deadlines into an RFC 5545 standard <code>.ics</code> file for direct import into Google Calendar, Apple Calendar, Outlook, or Thunderbird.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadIcs}
                  className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs inline-flex items-center space-x-2 transition cursor-pointer shadow-md"
                >
                  {downloadSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Downloaded .ics File!</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-4 h-4" />
                      <span>Download .ics Calendar ({totalExportCount} Events)</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleCopyIcs}
                  className="px-3.5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs inline-flex items-center space-x-1.5 transition cursor-pointer border border-slate-300"
                >
                  {copiedIcs ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                  <span>{copiedIcs ? 'Copied .ics!' : 'Copy .ics Text'}</span>
                </button>
              </div>
            </div>

            {/* Metrics Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4">
                <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide">
                  Total Calendar Events
                </span>
                <div className="text-2xl font-black text-blue-900 mt-1">
                  {totalExportCount}
                </div>
                <span className="text-[10px] text-blue-600 mt-1 block">
                  Ready for one-click import
                </span>
              </div>

              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4">
                <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">
                  Upcoming Loan EMIs
                </span>
                <div className="text-2xl font-black text-emerald-900 mt-1">
                  {filteredEmis.length}
                </div>
                <span className="text-[10px] text-emerald-600 mt-1 block font-mono">
                  Monthly Liability: ₹{totalUpcomingEmiSum.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4">
                <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide">
                  Statutory Compliance Items
                </span>
                <div className="text-2xl font-black text-amber-900 mt-1">
                  {filteredCompliance.length}
                </div>
                <span className="text-[10px] text-amber-600 mt-1 block">
                  GSTN, MCA V3 & Income Tax Deadlines
                </span>
              </div>

              <div className="bg-purple-50/60 border border-purple-200 rounded-xl p-4">
                <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wide">
                  Invitees & Alarms
                </span>
                <div className="text-xs font-mono text-purple-900 font-bold mt-1.5 truncate">
                  narendrabothra@llabdhigroup.in
                </div>
                <span className="text-[10px] text-purple-600 block truncate">
                  ea@llabdhigroup.in • -1d & -3d VALARM Popups
                </span>
              </div>
            </div>

            {/* Customization Options Bar */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                <span>Export Configuration & Filters</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-700">
                <label className="flex items-center space-x-2 cursor-pointer bg-white p-2.5 rounded-lg border border-slate-200 hover:border-slate-300">
                  <input
                    type="checkbox"
                    checked={icsIncludeEmis}
                    onChange={(e) => setIcsIncludeEmis(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="font-medium">Include Loan EMIs ({filteredEmis.length})</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer bg-white p-2.5 rounded-lg border border-slate-200 hover:border-slate-300">
                  <input
                    type="checkbox"
                    checked={icsIncludeCompliance}
                    onChange={(e) => setIcsIncludeCompliance(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="font-medium">Include Compliance ({filteredCompliance.length})</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer bg-white p-2.5 rounded-lg border border-slate-200 hover:border-slate-300">
                  <input
                    type="checkbox"
                    checked={icsOnlyUpcoming}
                    onChange={(e) => setIcsOnlyUpcoming(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="font-medium">Active & Upcoming Only (Exclude Paid/Filed)</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer bg-white p-2.5 rounded-lg border border-slate-200 hover:border-slate-300">
                  <input
                    type="checkbox"
                    checked={icsAddReminders}
                    onChange={(e) => setIcsAddReminders(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="font-medium">Include VALARM Reminder Popups</span>
                </label>
              </div>
            </div>

            {/* List of Events to be Included */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-slate-500" />
                  <span>Events Included in .ics File ({totalExportCount})</span>
                </h3>
                <button
                  onClick={() => setShowIcsCode(!showIcsCode)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline flex items-center space-x-1"
                >
                  <span>{showIcsCode ? 'Hide Raw .ics Syntax' : 'Preview Raw .ics Syntax'}</span>
                </button>
              </div>

              {/* Raw ICS Syntax View */}
              {showIcsCode && (
                <pre className="text-[11px] font-mono bg-slate-950 p-4 rounded-lg border border-slate-800 text-emerald-400 max-h-72 overflow-x-auto leading-relaxed">
                  <code>
                    {generateIcsCalendar(emis, compliance, {
                      includeEmis: icsIncludeEmis,
                      includeCompliance: icsIncludeCompliance,
                      onlyUpcomingAndPending: icsOnlyUpcoming,
                      addReminders: icsAddReminders,
                      calendarTitle: 'Llabdhi Upcoming EMIs & Compliance',
                    })}
                  </code>
                </pre>
              )}

              {/* Event Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                {/* EMI Items */}
                {icsIncludeEmis &&
                  filteredEmis.map((emi) => (
                    <div
                      key={`emi-${emi.id}`}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition flex items-start justify-between gap-3 shadow-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            EMI LOAN
                          </span>
                          <span className="font-mono text-xs text-slate-400">{emi.id}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">
                          {emi.loanName}
                        </h4>
                        <div className="text-[11px] text-slate-500">
                          {emi.lenderBank} • Asset: {emi.vehicleModel}
                        </div>
                        <div className="text-[11px] font-mono font-semibold text-emerald-700">
                          EMI: ₹{Number(emi.monthlyEmi).toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div className="text-right shrink-0 space-y-1">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">
                          Due: {emi.nextDueDate}
                        </span>
                        <div>
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            emi.status === 'Upcoming' ? 'bg-blue-100 text-blue-800' :
                            emi.status === 'Overdue' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {emi.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                {/* Compliance Items */}
                {icsIncludeCompliance &&
                  filteredCompliance.map((comp) => (
                    <div
                      key={`comp-${comp.id}`}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-amber-300 transition flex items-start justify-between gap-3 shadow-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                            STATUTORY COMPLIANCE
                          </span>
                          <span className="font-mono text-xs text-slate-400">{comp.id}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">
                          {comp.title}
                        </h4>
                        <div className="text-[11px] text-slate-500">
                          Authority: {comp.governingAuthority} • Period: {comp.period}
                        </div>
                        <div className="text-[11px] font-mono font-semibold text-amber-800">
                          {comp.estimatedAmount ? `Est. Liability: ₹${Number(comp.estimatedAmount).toLocaleString('en-IN')}` : 'Statutory Return'}
                        </div>
                      </div>

                      <div className="text-right shrink-0 space-y-1">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">
                          Due: {comp.dueDate}
                        </span>
                        <div>
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            comp.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                            comp.status === 'Overdue' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {comp.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Calendar Import Instructions */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  How to Import .ics into Your Calendar App
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
                <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>Google Calendar (Web / Mobile)</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-500 pl-1 text-[11px]">
                    <li>Open <strong>calendar.google.com</strong>.</li>
                    <li>Click <strong>Settings ⚙️</strong> &gt; <strong>Import &amp; export</strong>.</li>
                    <li>Upload the downloaded <code>.ics</code> file and select your target calendar.</li>
                  </ol>
                </div>

                <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-800"></span>
                    <span>Apple Calendar (Mac / iOS)</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-500 pl-1 text-[11px]">
                    <li>Double-click the downloaded <code>.ics</code> file.</li>
                    <li>Choose your calendar (e.g. <em>Work / Finance</em>).</li>
                    <li>Click <strong>OK</strong> or <strong>Add to Calendar</strong>.</li>
                  </ol>
                </div>

                <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-700"></span>
                    <span>Microsoft Outlook &amp; Others</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-500 pl-1 text-[11px]">
                    <li>Click <strong>File</strong> &gt; <strong>Open &amp; Export</strong> &gt; <strong>Open Calendar</strong>.</li>
                    <li>Select the downloaded <code>.ics</code> file.</li>
                    <li>Or drag and drop the file directly onto your Outlook calendar.</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Automated Email Reminder Script Code */}
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

      {/* SUB-TAB 4: Calendar Logs Tab */}
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

      {/* SUB-TAB 5: Email Logs Tab */}
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

