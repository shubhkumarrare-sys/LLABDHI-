import React, { useState } from 'react';
import { CreditorItem } from '../types';
import { formatINR, calculateDaysDiff } from '../utils/calculations';
import {
  Building2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  X,
  CreditCard,
  FileCheck,
} from 'lucide-react';

interface CreditorsManagerProps {
  creditors: CreditorItem[];
  onUpdateCreditor: (updatedItem: CreditorItem) => void;
  onAddCreditor: (newItem: CreditorItem) => void;
}

export const CreditorsManager: React.FC<CreditorsManagerProps> = ({
  creditors,
  onUpdateCreditor,
  onAddCreditor,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Payment Modal State
  const [selectedCreditor, setSelectedCreditor] = useState<CreditorItem | null>(null);
  const [arnRef, setArnRef] = useState('');
  const [paymentDate, setPaymentDate] = useState('2026-07-30');

  // Add Creditor Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newVendor, setNewVendor] = useState<Partial<CreditorItem>>({
    vendorEntity: '',
    invoiceRef: '',
    dueDate: '2026-08-10',
    amount: 150000,
    category: 'Raw Material',
    status: 'Pending',
    notes: '',
  });

  const categories = ['All', 'Raw Material', 'Machinery & Spares', 'Logistics', 'Utilities', 'Services'];

  const filteredCreditors = creditors.filter((item) => {
    const matchesSearch =
      item.vendorEntity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.invoiceRef.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCreditor) return;

    onUpdateCreditor({
      ...selectedCreditor,
      status: 'Paid',
      paymentDate: paymentDate || new Date().toISOString().substring(0, 10),
      arnChallanRef: arnRef || `RTGS/HDFC-${Math.floor(100000 + Math.random() * 900000)}`,
    });

    setSelectedCreditor(null);
    setArnRef('');
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendor.vendorEntity || !newVendor.amount) return;

    const created: CreditorItem = {
      id: `CRE-${Math.floor(200 + Math.random() * 800)}`,
      vendorEntity: newVendor.vendorEntity,
      invoiceRef: newVendor.invoiceRef || `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      dueDate: newVendor.dueDate || '2026-08-15',
      amount: Number(newVendor.amount),
      category: (newVendor.category as any) || 'Raw Material',
      status: 'Pending',
      notes: newVendor.notes || '',
    };

    onAddCreditor(created);
    setIsAddOpen(false);
  };

  const totalPendingOutflow = creditors
    .filter((c) => c.status !== 'Paid')
    .reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Creditors & Accounts Payable (AP) Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track supplier payments, raw material supplies (Tata Steel), machine maintenance (Trumpf), MSEDCL electricity bills, and logistics liabilities.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">Total Payable Balance</span>
            <span className="text-lg font-extrabold text-rose-600">{formatINR(totalPendingOutflow)}</span>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition cursor-pointer shadow shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Creditor Invoice</span>
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search entity or invoice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="py-1.5 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Ref ID</th>
                <th className="p-3">Entity Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Invoice Ref</th>
                <th className="p-3">Due Date</th>
                <th className="p-3 text-right">Amount (₹)</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3">Payment / ARN Ref</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCreditors.map((item) => {
                const daysDiff = calculateDaysDiff(item.dueDate);
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono text-slate-500 text-[11px]">{item.id}</td>
                    <td className="p-3 font-bold text-slate-900">
                      <div>{item.vendorEntity}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{item.notes}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-700">{item.invoiceRef}</td>
                    <td className="p-3 text-slate-600">
                      {item.dueDate}
                      {daysDiff < 0 && item.status !== 'Paid' && (
                        <span className="block text-[10px] text-rose-600 font-bold">
                          Overdue by {Math.abs(daysDiff)} days
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
                            ? 'bg-rose-100 text-rose-800'
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
                            {item.arnChallanRef || 'RTGS/HDFC-OUT'}
                          </div>
                          <div className="text-[10px] text-slate-400">Paid on {item.paymentDate}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Pending Release</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {item.status !== 'Paid' ? (
                        <button
                          onClick={() => setSelectedCreditor(item)}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] transition cursor-pointer shadow-sm"
                        >
                          Record Payment
                        </button>
                      ) : (
                        <span className="text-emerald-600 font-bold text-xs inline-flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Paid</span>
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

      {/* RECORD PAYMENT MODAL */}
      {selectedCreditor && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Record Payout & Challan/UTR
              </h3>
              <button
                onClick={() => setSelectedCreditor(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Entity:</span>
                <span className="font-bold text-slate-900">{selectedCreditor.vendorEntity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice Ref:</span>
                <span className="font-mono text-slate-700">{selectedCreditor.invoiceRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payout Amount:</span>
                <span className="font-extrabold text-rose-600">{formatINR(selectedCreditor.amount)}</span>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bank UTR / ARN / Challan Reference *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RTGS/HDFCR5202607280012 or UTR881023"
                  value={arnRef}
                  onChange={(e) => setArnRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Release Date *
                </label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCreditor(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium cursor-pointer hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer shadow"
                >
                  Confirm Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CREDITOR MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Creditor Invoice</h3>
              <button
                onClick={() => setIsAddOpen(false)}
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
                  placeholder="e.g. Tata Steel / Trumpf India / MSEDCL"
                  value={newVendor.vendorEntity}
                  onChange={(e) => setNewVendor({ ...newVendor, vendorEntity: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newVendor.category}
                    onChange={(e) => setNewVendor({ ...newVendor, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {categories.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={newVendor.amount}
                    onChange={(e) => setNewVendor({ ...newVendor, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Invoice Ref</label>
                  <input
                    type="text"
                    placeholder="e.g. TSDPL/IN/88341"
                    value={newVendor.invoiceRef}
                    onChange={(e) => setNewVendor({ ...newVendor, invoiceRef: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Due Date</label>
                  <input
                    type="date"
                    value={newVendor.dueDate}
                    onChange={(e) => setNewVendor({ ...newVendor, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. HR & CR Steel Coil supplies"
                  value={newVendor.notes}
                  onChange={(e) => setNewVendor({ ...newVendor, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-medium cursor-pointer hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg cursor-pointer shadow"
                >
                  Save Creditor Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
