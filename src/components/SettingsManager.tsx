import React, { useState } from 'react';
import { AppSettings } from '../types';
import {
  Settings,
  Mail,
  Calendar,
  CreditCard,
  Save,
  Download,
  RotateCcw,
  CheckCircle2,
  Building,
} from 'lucide-react';

interface SettingsManagerProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onExportData: () => void;
  onResetData: () => void;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({
  settings,
  onUpdateSettings,
  onExportData,
  onResetData,
}) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [intervalsText, setIntervalsText] = useState(settings.reminderIntervals.join(', '));
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const intervalsParsed = intervalsText
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));

    const updated = {
      ...formData,
      reminderIntervals: intervalsParsed.length > 0 ? intervalsParsed : settings.reminderIntervals,
    };

    onUpdateSettings(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900">
              LLABDHI OPS NODE Operational Settings & Rules
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure credit terms, notification email schedules, and automated Google Apps Script triggers.
          </p>
        </div>

        {saveSuccess && (
          <span className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs inline-flex items-center space-x-1 shadow-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings Saved!</span>
          </span>
        )}
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Notification Email */}
          <div>
            <label className="block font-bold text-slate-800 mb-1 flex items-center space-x-1.5">
              <Mail className="w-4 h-4 text-indigo-600" />
              <span>Notification Alert Email Address *</span>
            </label>
            <input
              type="email"
              required
              value={formData.notificationEmail}
              onChange={(e) => setFormData({ ...formData, notificationEmail: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Automated Apps Script email alerts will be sent to this recipient.
            </p>
          </div>

          {/* Credit Terms */}
          <div>
            <label className="block font-bold text-slate-800 mb-1 flex items-center space-x-1.5">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>Default Credit Terms (Days) *</span>
            </label>
            <input
              type="number"
              required
              value={formData.creditTermsDays}
              onChange={(e) => setFormData({ ...formData, creditTermsDays: parseInt(e.target.value) || 30 })}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Standard credit terms (Default: Net 30 days for new debtor invoices).
            </p>
          </div>
        </div>

        {/* Reminder Interval Schedule */}
        <div>
          <label className="block font-bold text-slate-800 mb-1 flex items-center space-x-1.5">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Automated Reminder Interval Schedule (Days relative to Due Date) *</span>
          </label>
          <input
            type="text"
            required
            value={intervalsText}
            onChange={(e) => setIntervalsText(e.target.value)}
            className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Comma-separated relative days. Negative numbers indicate days before due date; 0 indicates due date; positive numbers indicate overdue days. Configured rule: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">[-7, -5, -3, -2, -1, 0, 1, 2, 3, 7]</code>
          </p>
        </div>

        {/* Company Title */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
          <div>
            <label className="block font-bold text-slate-800 mb-1">Company Entity Name</label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Currency Symbol</label>
            <input
              type="text"
              value={formData.currencySymbol}
              onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onExportData}
              className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium text-xs inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export LLABDHI OPS NODE JSON</span>
            </button>

            <button
              type="button"
              onClick={onResetData}
              className="px-3.5 py-2 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 font-medium text-xs inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Seed Data</span>
            </button>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center space-x-2 cursor-pointer shadow"
          >
            <Save className="w-4 h-4" />
            <span>Save Operational Rules</span>
          </button>
        </div>
      </form>
    </div>
  );
};
