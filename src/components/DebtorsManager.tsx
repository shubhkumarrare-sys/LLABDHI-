import React, { useState } from 'react';
import { DebtorItem, ClientOverdueGroup } from '../types';
import { formatINR, calculateDaysDiff, getTodayStr } from '../utils/calculations';
import {
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Clock,
  X,
  Building2,
  Calendar,
  FileText,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  TrendingDown,
  Check,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';

interface DebtorsManagerProps {
  debtors: DebtorItem[];
  onUpdateDebtor: (updatedItem: DebtorItem) => void;
  onAddDebtor: (newItem: DebtorItem) => void;
  onGenerateEmailDraft?: (clientGroup: ClientOverdueGroup) => void;
}

export const DebtorsManager: React.FC<DebtorsManagerProps> = ({
  debtors,
  onUpdateDebtor,
  onAddDebtor,
  onGenerateEmailDraft,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Overdue' | 'Pending' | 'Paid'>('All');

  // Modal States
  const [selectedItemForPayment, setSelectedItemForPayment] = useState<DebtorItem | null>(null);
  const [arnChallanInput, setArnChallanInput] = useState('');
  const [paymentDateInput, setPaymentDateInput] = useState(getTodayStr());

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState<Partial<DebtorItem>>({
    clientEntity: '',
    invoiceRef: 'LL/2026-27/',
    invoiceDate: getTodayStr(),
    dueDate: '2026-08-29',
    amount: 100000,
    status: 'Pending',
    contactEmail: '',
    notes: '',
  });

  // Calculate high-level summary KPIs
  const totalAr = debtors.reduce((sum, d) => sum + d.amount, 0);
  const overdueDebtors = debtors.filter((d) => d.status === 'Overdue');
  const totalOverdue = overdueDebtors.reduce((sum, d) => sum + d.amount, 0);
  const pendingDebtors = debtors.filter((d) => d.status === 'Pending');
  const totalPending = pendingDebtors.reduce((sum, d) => sum + d.amount, 0);
  const paidDebtors = debtors.filter((d) => d.status === 'Paid');
  const totalPaid = paidDebtors.reduce((sum, d) => sum + d.amount, 0);

  // Group overdue by client entity
  const overdueByClient: Record<string, DebtorItem[]> = {};
  overdueDebtors.forEach((item) => {
    if (!overdueByClient[item.clientEntity]) {
      overdueByClient[item.clientEntity] = [];
    }
    overdueByClient[item.clientEntity].push(item);
  });

  const overdueGroups: ClientOverdueGroup[] = Object.keys(overdueByClient).map((entity) => {
    const invoices = overdueByClient[entity];
    const totalOutstanding = invoices.reduce((sum, i) => sum + i.amount, 0);
    const maxDaysOverdue = Math.max(...invoices.map((i) => Math.abs(calculateDaysDiff(i.dueDate))));
    return {
      clientEntity: entity,
      totalOutstanding,
      invoicesCount: invoices.length,
      maxDaysOverdue,
      invoices,
    };
  });

  // Filtered & Chronologically Sorted Debtors list
  const filteredDebtors = debtors
    .filter((item) => {
      const matchesSearch =
        item.clientEntity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.invoiceRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const statusPriority: Record<string, number> = { Overdue: 1, Pending: 2, Paid: 3 };
      const prioA = statusPriority[a.status] || 4;
      const prioB = statusPriority[b.status] || 4;

      if (prioA !== prioB) {
        return prioA - prioB;
      }
      return a.dueDate.localeCompare(b.dueDate);
    });

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForPayment) return;

    onUpdateDebtor({
      ...selectedItemForPayment,
      status: 'Paid',
      paymentDate: paymentDateInput || new Date().toISOString().substring(0, 10),
      arnChallanRef: arnChallanInput || `NEFT/INP-${Math.floor(100000 + Math.random() * 900000)}`,
    });

    setSelectedItemForPayment(null);
    setArnChallanInput('');
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoice.clientEntity || !newInvoice.amount) return;

    const created: DebtorItem = {
      id: `DEB-${Math.floor(100 + Math.random() * 900)}`,
      clientEntity: newInvoice.clientEntity || 'Entity Name',
      invoiceRef: newInvoice.invoiceRef || `LL/2026-27/${Math.floor(500 + Math.random() * 500)}`,
      invoiceDate: newInvoice.invoiceDate || getTodayStr(),
      dueDate: newInvoice.dueDate || '2026-08-30',
      amount: Number(newInvoice.amount),
      status: (newInvoice.status as any) || 'Pending',
      contactEmail: newInvoice.contactEmail || 'ap@company.com',
      notes: newInvoice.notes || '',
    };

    onAddDebtor(created);
    setIsAddModalOpen(false);
    setNewInvoice({
      clientEntity: '',
      invoiceRef: 'LL/2026-27/',
      invoiceDate: getTodayStr(),
      dueDate: '2026-08-29',
      amount: 100000,
      status: 'Pending',
      contactEmail: '',
      notes: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP 4 MASTER METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Receivables */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8EBF2] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#7D8499]">
              Total AR Book
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#EFF2FE] text-[#3045F5] flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl lg:text-3xl font-extrabold text-[#171B3A] tracking-tight tabular-nums">
              {formatINR(totalAr)}
            </h3>
            <p className="text-xs text-[#7D8499] mt-1 font-medium">
              {debtors.length} total customer invoices
            </p>
          </div>
        </div>

        {/* Overdue Debtors */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8EBF2] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#7D8499]">
              Overdue Receivables
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl lg:text-3xl font-extrabold text-rose-600 tracking-tight tabular-nums">
              {formatINR(totalOverdue)}
            </h3>
            <p className="text-xs text-rose-600 mt-1 font-semibold">
              {overdueDebtors.length} invoice(s) overdue
            </p>
          </div>
        </div>

        {/* Pending Current */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8EBF2] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#7D8499]">
              Pending (Current Terms)
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl lg:text-3xl font-extrabold text-[#171B3A] tracking-tight tabular-nums">
              {formatINR(totalPending)}
            </h3>
            <p className="text-xs text-[#7D8499] mt-1 font-medium">
              {pendingDebtors.length} invoice(s) maturing soon
            </p>
          </div>
        </div>

        {/* Paid / Realized Collections */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8EBF2] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#7D8499]">
              Cleared Collections
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl lg:text-3xl font-extrabold text-[#10B981] tracking-tight tabular-nums">
              {formatINR(totalPaid)}
            </h3>
            <p className="text-xs text-[#10B981] mt-1 font-semibold">
              {paidDebtors.length} invoice(s) settled with ARN
            </p>
          </div>
        </div>
      </div>

      {/* 2. OVERDUE CLIENT FOLLOW-UP ACTION CARDS (IF ANY) */}
      {overdueGroups.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E8EBF2] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8EBF2] pb-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="font-extrabold text-sm text-[#171B3A]">
                High-Priority Overdue Accounts ({overdueGroups.length})
              </h3>
            </div>
            <span className="text-xs text-[#7D8499]">
              Draft AI Reminders for immediate collection
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {overdueGroups.map((group) => (
              <div
                key={group.clientEntity}
                className="p-4 rounded-xl border border-rose-200 bg-rose-50/30 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <h4 className="font-bold text-xs text-[#171B3A] truncate">
                      {group.clientEntity}
                    </h4>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full shrink-0">
                      {group.maxDaysOverdue}d overdue
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-base font-extrabold text-rose-600 tabular-nums">
                      {formatINR(group.totalOutstanding)}
                    </span>
                    <span className="text-[11px] text-[#7D8499]">
                      {group.invoicesCount} invoice(s)
                    </span>
                  </div>
                </div>

                {onGenerateEmailDraft && (
                  <button
                    onClick={() => onGenerateEmailDraft(group)}
                    className="w-full py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-rose-200" />
                    <span>Draft AI Payment Reminder</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. COMPLETE DEBTORS MASTER TABLE */}
      <div className="bg-white rounded-2xl border border-[#E8EBF2] shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 sm:p-5 border-b border-[#E8EBF2] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#7D8499] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search client entity, invoice ref, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#F7F9FC] border border-[#E8EBF2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3045F5]/15 focus:border-[#3045F5] transition"
            />
          </div>

          <div className="flex items-center space-x-3 self-end sm:self-auto">
            {/* Filter Segmented Control */}
            <div className="inline-flex p-1 bg-[#F7F9FC] rounded-xl border border-[#E8EBF2] text-xs">
              {(['All', 'Overdue', 'Pending', 'Paid'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                    statusFilter === st
                      ? 'bg-white text-[#3045F5] shadow-xs'
                      : 'text-[#7D8499] hover:text-[#171B3A]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* New Invoice Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#3045F5] hover:bg-[#2537D6] text-white font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Invoice</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F9FC] text-[#7D8499] border-b border-[#E8EBF2] uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="p-3.5">Ref ID</th>
                <th className="p-3.5">Client Entity</th>
                <th className="p-3.5">Invoice Ref</th>
                <th className="p-3.5">Invoice Date</th>
                <th className="p-3.5">Due Date</th>
                <th className="p-3.5 text-right">Amount (₹)</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5">Payment / ARN Clearance</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EBF2]">
              {filteredDebtors.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#7D8499] text-xs">
                    No debtor invoices matched the active filters.
                  </td>
                </tr>
              ) : (
                filteredDebtors.map((item) => {
                  const daysOver = calculateDaysDiff(item.dueDate);
                  return (
                    <tr key={item.id} className="hover:bg-[#F7F9FC] transition group">
                      <td className="p-3.5 font-mono text-[#7D8499] text-[11px]">{item.id}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-[#171B3A]">{item.clientEntity}</div>
                        {item.notes && (
                          <div className="text-[10px] text-[#7D8499] font-normal">{item.notes}</div>
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-[#171B3A] text-[11px]">{item.invoiceRef}</td>
                      <td className="p-3.5 text-[#7D8499]">{item.invoiceDate}</td>
                      <td className="p-3.5 text-[#7D8499]">
                        <div>{item.dueDate}</div>
                        {item.status === 'Overdue' && (
                          <span className="text-[10px] text-rose-600 font-bold block">
                            {Math.abs(daysOver)} days overdue
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-extrabold text-[#171B3A] text-right tabular-nums">
                        {formatINR(item.amount)}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'Paid'
                              ? 'bg-emerald-50 text-[#10B981]'
                              : item.status === 'Overdue'
                              ? 'bg-rose-50 text-rose-700 animate-pulse'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-[#7D8499]">
                        {item.status === 'Paid' ? (
                          <div>
                            <div className="text-[11px] font-mono text-[#10B981] font-bold">
                              {item.arnChallanRef || 'NEFT/CLEAR-REC'}
                            </div>
                            <div className="text-[10px] text-[#7D8499]">Paid on {item.paymentDate}</div>
                          </div>
                        ) : (
                          <span className="text-[#7D8499] text-[11px] italic">Awaiting Payment</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        {item.status !== 'Paid' ? (
                          <button
                            onClick={() => setSelectedItemForPayment(item)}
                            className="px-3 py-1.5 rounded-lg bg-[#10B981] hover:bg-emerald-600 text-white font-bold text-xs transition cursor-pointer shadow-2xs"
                          >
                            Mark Paid
                          </button>
                        ) : (
                          <span className="text-[#10B981] font-bold text-xs inline-flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Cleared</span>
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

      {/* 4. RECORD PAYMENT CLEARED MODAL */}
      {selectedItemForPayment && (
        <div className="fixed inset-0 bg-[#171B3A]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E8EBF2] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8EBF2] pb-3">
              <h3 className="text-base font-extrabold text-[#171B3A]">
                Record Payment Clearance
              </h3>
              <button
                onClick={() => setSelectedItemForPayment(null)}
                className="text-[#7D8499] hover:text-[#171B3A] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#F7F9FC] p-3.5 rounded-xl border border-[#E8EBF2] text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#7D8499]">Entity:</span>
                <span className="font-bold text-[#171B3A]">{selectedItemForPayment.clientEntity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7D8499]">Invoice:</span>
                <span className="font-mono text-[#171B3A]">{selectedItemForPayment.invoiceRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7D8499]">Amount:</span>
                <span className="font-extrabold text-[#10B981] tabular-nums">
                  {formatINR(selectedItemForPayment.amount)}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#171B3A] mb-1">
                  Bank Reference / UTR / ARN / Challan Ref No. *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NEFT/CITIN2607298812 or UTR998212"
                  value={arnChallanInput}
                  onChange={(e) => setArnChallanInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E8EBF2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#171B3A] mb-1">
                  Payment Credit Timestamp / Date *
                </label>
                <input
                  type="date"
                  required
                  value={paymentDateInput}
                  onChange={(e) => setPaymentDateInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E8EBF2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#E8EBF2]">
                <button
                  type="button"
                  onClick={() => setSelectedItemForPayment(null)}
                  className="px-4 py-2 rounded-xl border border-[#E8EBF2] text-[#7D8499] text-xs font-semibold cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#10B981] hover:bg-emerald-600 text-white text-xs font-bold cursor-pointer shadow-xs"
                >
                  Confirm Payment Cleared
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. ADD DEBTOR INVOICE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-[#171B3A]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E8EBF2] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8EBF2] pb-3">
              <h3 className="text-base font-extrabold text-[#171B3A]">Add New Debtor Invoice</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#7D8499] hover:text-[#171B3A] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#171B3A] mb-1">Entity Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IFB Industries Ltd / Siemens"
                  value={newInvoice.clientEntity}
                  onChange={(e) => setNewInvoice({ ...newInvoice, clientEntity: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E8EBF2] rounded-xl focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#171B3A] mb-1">Invoice Reference *</label>
                  <input
                    type="text"
                    required
                    value={newInvoice.invoiceRef}
                    onChange={(e) => setNewInvoice({ ...newInvoice, invoiceRef: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E8EBF2] rounded-xl focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#171B3A] mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={newInvoice.amount}
                    onChange={(e) => setNewInvoice({ ...newInvoice, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#E8EBF2] rounded-xl focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#171B3A] mb-1">Invoice Date</label>
                  <input
                    type="date"
                    value={newInvoice.invoiceDate}
                    onChange={(e) => setNewInvoice({ ...newInvoice, invoiceDate: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E8EBF2] rounded-xl focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#171B3A] mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newInvoice.dueDate}
                    onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E8EBF2] rounded-xl focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#171B3A] mb-1">Contact Email</label>
                <input
                  type="email"
                  placeholder="ap@client.com"
                  value={newInvoice.contactEmail}
                  onChange={(e) => setNewInvoice({ ...newInvoice, contactEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E8EBF2] rounded-xl focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#171B3A] mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Copper windings batch #4"
                  value={newInvoice.notes}
                  onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E8EBF2] rounded-xl focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#E8EBF2]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-[#E8EBF2] rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-50 text-[#7D8499]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#3045F5] hover:bg-[#2537D6] text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                >
                  Save Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
