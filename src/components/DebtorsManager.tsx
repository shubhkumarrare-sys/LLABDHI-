import React, { useState } from 'react';
import { DebtorItem, ClientOverdueGroup } from '../types';
import { groupOverdueDebtorsByClient, formatINR, calculateDaysDiff } from '../utils/calculations';
import {
  Search,
  Filter,
  Plus,
  Mail,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Sparkles,
  X,
  Building2,
  Calendar,
  FileText,
} from 'lucide-react';

interface DebtorsManagerProps {
  debtors: DebtorItem[];
  onUpdateDebtor: (updatedItem: DebtorItem) => void;
  onAddDebtor: (newItem: DebtorItem) => void;
  onGenerateEmailDraft: (clientGroup: ClientOverdueGroup) => void;
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
  const [paymentDateInput, setPaymentDateInput] = useState('2026-07-30');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState<Partial<DebtorItem>>({
    clientEntity: '',
    invoiceRef: 'LL/2026-27/',
    invoiceDate: '2026-07-30',
    dueDate: '2026-08-29',
    amount: 100000,
    status: 'Pending',
    contactEmail: '',
    notes: '',
  });

  // Calculate Overdue Groups
  const overdueGroups: ClientOverdueGroup[] = groupOverdueDebtorsByClient(debtors);

  // Filtered Debtors list
  const filteredDebtors = debtors.filter((item) => {
    const matchesSearch =
      item.clientEntity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.invoiceRef.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
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
      invoiceDate: newInvoice.invoiceDate || '2026-07-30',
      dueDate: newInvoice.dueDate || '2026-08-30',
      amount: Number(newInvoice.amount),
      status: (newInvoice.status as any) || 'Pending',
      contactEmail: newInvoice.contactEmail || 'ap@company.com',
      notes: newInvoice.notes || '',
    };

    onAddDebtor(created);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Debtors & Accounts Receivable (AR) Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track invoices by entity reference, manage payment updates with ARN/Challan references, and run AI overdue follow-ups.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition cursor-pointer shadow shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Invoice</span>
        </button>
      </div>

      {/* SECTION 1: Overdue Receivables Grouped Analysis */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <AlertOctagon className="w-5 h-5 text-rose-600" />
            <h2 className="text-base font-bold text-slate-900">
              Overdue Receivables Analysis (Grouped by Entity)
            </h2>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200">
            Total Overdue: {formatINR(overdueGroups.reduce((acc, g) => acc + g.totalOutstanding, 0))}
          </span>
        </div>

        {overdueGroups.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs">
            🎉 Great news! There are currently no overdue receivables. All accounts are up to date.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overdueGroups.map((group) => (
              <div
                key={group.clientEntity}
                className="bg-slate-50 p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{group.clientEntity}</h3>
                      <p className="text-[11px] text-slate-500">{group.contactEmail}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                      {group.maxDaysOverdue} days overdue
                    </span>
                  </div>

                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Outstanding Balance:</span>
                      <span className="font-extrabold text-rose-600">
                        {formatINR(group.totalOutstanding)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Overdue Invoices:</span>
                      <span className="font-medium text-slate-700">
                        {group.invoicesCount} invoice(s)
                      </span>
                    </div>
                  </div>

                  {/* List of invoices */}
                  <div className="mt-3 pt-2 border-t border-slate-200 space-y-1">
                    {group.invoices.map((inv) => (
                      <div key={inv.id} className="flex justify-between text-[11px] text-slate-600">
                        <span className="font-mono">{inv.invoiceRef}</span>
                        <span>{formatINR(inv.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200">
                  <button
                    onClick={() => onGenerateEmailDraft(group)}
                    className="w-full py-2 px-3 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                    <span>AI Draft Reminder Email</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: Complete Debtors Master Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search entity or invoice ref..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500">Status:</span>
            <div className="flex bg-slate-200 p-0.5 rounded-lg text-xs">
              {(['All', 'Overdue', 'Pending', 'Paid'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-md transition font-medium cursor-pointer ${
                    statusFilter === st ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Ref ID</th>
                <th className="p-3">Entity Name</th>
                <th className="p-3">Invoice Ref</th>
                <th className="p-3">Invoice Date</th>
                <th className="p-3">Due Date</th>
                <th className="p-3 text-right">Amount (₹)</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3">Payment / ARN Details</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDebtors.map((item) => {
                const daysOver = calculateDaysDiff(item.dueDate);
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono text-slate-500 text-[11px]">{item.id}</td>
                    <td className="p-3 font-bold text-slate-900">
                      <div>{item.clientEntity}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{item.notes}</div>
                    </td>
                    <td className="p-3 font-mono text-slate-700">{item.invoiceRef}</td>
                    <td className="p-3 text-slate-600">{item.invoiceDate}</td>
                    <td className="p-3 text-slate-600">
                      {item.dueDate}
                      {item.status === 'Overdue' && (
                        <span className="block text-[10px] text-rose-600 font-bold">
                          {Math.abs(daysOver)} days overdue
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-extrabold text-slate-900 text-right">
                      {formatINR(item.amount)}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'Overdue'
                            ? 'bg-rose-100 text-rose-800 animate-pulse'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">
                      {item.status === 'Paid' ? (
                        <div>
                          <div className="text-[11px] font-mono text-emerald-700 font-bold">
                            {item.arnChallanRef || 'NEFT/CITI-REC'}
                          </div>
                          <div className="text-[10px] text-slate-400">Paid on {item.paymentDate}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Awaiting Payment</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {item.status !== 'Paid' ? (
                        <button
                          onClick={() => setSelectedItemForPayment(item)}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] transition cursor-pointer shadow-sm"
                        >
                          Mark as Paid
                        </button>
                      ) : (
                        <span className="text-emerald-600 font-bold text-xs inline-flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Cleared</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MARK AS PAID MODAL (UPDATE ARN/CHALLAN / PAYMENT TIMESTAMP) */}
      {selectedItemForPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Update Payment & ARN/Challan Reference
              </h3>
              <button
                onClick={() => setSelectedItemForPayment(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Entity:</span>
                <span className="font-bold text-slate-900">{selectedItemForPayment.clientEntity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice:</span>
                <span className="font-mono text-slate-700">{selectedItemForPayment.invoiceRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount:</span>
                <span className="font-extrabold text-emerald-600">{formatINR(selectedItemForPayment.amount)}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bank Reference / UTR / ARN / Challan Ref No. *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NEFT/CITIN2607298812 or UTR998212"
                  value={arnChallanInput}
                  onChange={(e) => setArnChallanInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Credit Timestamp / Date *
                </label>
                <input
                  type="date"
                  required
                  value={paymentDateInput}
                  onChange={(e) => setPaymentDateInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedItemForPayment(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium cursor-pointer hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer shadow"
                >
                  Record Payment Cleared
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE DEBTOR MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add New Debtor Invoice</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Entity Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IFB Industries Ltd / Siemens"
                  value={newInvoice.clientEntity}
                  onChange={(e) => setNewInvoice({ ...newInvoice, clientEntity: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Invoice Reference *</label>
                  <input
                    type="text"
                    required
                    value={newInvoice.invoiceRef}
                    onChange={(e) => setNewInvoice({ ...newInvoice, invoiceRef: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={newInvoice.amount}
                    onChange={(e) => setNewInvoice({ ...newInvoice, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Invoice Date</label>
                  <input
                    type="date"
                    value={newInvoice.invoiceDate}
                    onChange={(e) => setNewInvoice({ ...newInvoice, invoiceDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newInvoice.dueDate}
                    onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Email</label>
                <input
                  type="email"
                  placeholder="ap@client.com"
                  value={newInvoice.contactEmail}
                  onChange={(e) => setNewInvoice({ ...newInvoice, contactEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Item Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Motor brackets batch #3"
                  value={newInvoice.notes}
                  onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-medium cursor-pointer hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg cursor-pointer shadow"
                >
                  Save Debtor Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
