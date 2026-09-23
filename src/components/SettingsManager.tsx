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
      <div className="bg-white p-6 rounded-2xl border border-[#E8EBF2] shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#EFF2FE] text-[#3045F5]">
              <Settings className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-[#171B3A]">
              Operational Settings & Rules
            </h1>
          </div>
          <p className="text-xs text-[#7D8499] mt-1 font-medium">
            Configure credit terms, notification email schedules, and automated Google Apps Script triggers.
          </p>
        </div>

        {saveSuccess && (
          <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-[#10B981] font-bold text-xs inline-flex items-center space-x-1.5 shadow-2xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings Saved!</span>
          </span>
        )}
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-[#E8EBF2] shadow-xs space-y-6 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Notification Email */}
          <div>
            <label className="block font-bold text-[#171B3A] mb-1.5 flex items-center space-x-1.5">
              <Mail className="w-4 h-4 text-[#3045F5]" />
              <span>Notification Alert Email Address *</span>
            </label>
            <input
              type="email"
              required
              value={formData.notificationEmail}
              onChange={(e) => setFormData({ ...formData, notificationEmail: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E8EBF2] rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5] transition"
            />
            <p className="text-[11px] text-[#7D8499] mt-1">
              Automated Apps Script email alerts will be sent to this recipient.
            </p>
          </div>

          {/* Credit Terms */}
          <div>
            <label className="block font-bold text-[#171B3A] mb-1.5 flex items-center space-x-1.5">
              <CreditCard className="w-4 h-4 text-[#3045F5]" />
              <span>Default Credit Terms (Days) *</span>
            </label>
            <input
              type="number"
              required
              value={formData.creditTermsDays}
              onChange={(e) => setFormData({ ...formData, creditTermsDays: parseInt(e.target.value) || 30 })}
              className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E8EBF2] rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5] transition"
            />
            <p className="text-[11px] text-[#7D8499] mt-1">
              Standard credit terms (Default: Net 30 days for new debtor invoices).
            </p>
          </div>
        </div>

        {/* Reminder Interval Schedule */}
        <div>
          <label className="block font-bold text-[#171B3A] mb-1.5 flex items-center space-x-1.5">
            <Calendar className="w-4 h-4 text-[#3045F5]" />
            <span>Automated Reminder Interval Schedule (Days relative to Due Date) *</span>
          </label>
          <input
            type="text"
            required
            value={intervalsText}
            onChange={(e) => setIntervalsText(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E8EBF2] rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5] transition"
          />
          <p className="text-[11px] text-[#7D8499] mt-1">
            Comma-separated relative days. Negative numbers indicate days before due date; 0 indicates due date; positive numbers indicate overdue days. Configured rule: <code className="bg-[#EFF2FE] text-[#3045F5] px-1.5 py-0.5 rounded font-mono font-bold">[-7, -5, -3, -2, -1, 0, 1, 2, 3, 7]</code>
          </p>
        </div>

        {/* Company Title */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-[#E8EBF2]">
          <div>
            <label className="block font-bold text-[#171B3A] mb-1.5">Company Entity Name</label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E8EBF2] rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5] transition"
            />
          </div>

          <div>
            <label className="block font-bold text-[#171B3A] mb-1.5">Currency Symbol</label>
            <input
              type="text"
              value={formData.currencySymbol}
              onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E8EBF2] rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5] transition"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-[#E8EBF2]">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onExportData}
              className="px-3.5 py-2 rounded-xl border border-[#E8EBF2] bg-[#F7F9FC] hover:bg-white text-[#171B3A] font-semibold text-xs inline-flex items-center space-x-1.5 cursor-pointer shadow-2xs transition"
            >
              <Download className="w-4 h-4 text-[#7D8499]" />
              <span>Export JSON Backup</span>
            </button>

            <button
              type="button"
              onClick={onResetData}
              className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50/50 text-rose-700 hover:bg-rose-50 font-semibold text-xs inline-flex items-center space-x-1.5 cursor-pointer shadow-2xs transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Seed Data</span>
            </button>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#3045F5] hover:bg-[#2537D6] text-white font-bold text-xs inline-flex items-center justify-center space-x-2 cursor-pointer shadow-xs transition"
          >
            <Save className="w-4 h-4" />
            <span>Save Operational Rules</span>
          </button>
        </div>
      </form>
    </div>
  );
};
