import React, { useState } from 'react';
import { CreditorItem } from '../types';
import { formatINR, calculateDaysDiff, getTodayStr } from '../utils/calculations';
import {
  Building2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  X,
  CreditCard,
  FileCheck,
  RefreshCw,
  Clock,
  ExternalLink,
  Layers,
} from 'lucide-react';

interface CreditorsManagerProps {
  creditors: CreditorItem[];
  onUpdateCreditor: (updatedItem: CreditorItem) => void;
  onAddCreditor: (newItem: CreditorItem) => void;
  onOpenSyncModal?: () => void;
}

export const CreditorsManager: React.FC<CreditorsManagerProps> = ({
  creditors,
  onUpdateCreditor,
  onAddCreditor,
  onOpenSyncModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [narrationFilter, setNarrationFilter] = useState<string>('All');

  // Payment Modal State
  const [selectedCreditor, setSelectedCreditor] = useState<CreditorItem | null>(null);
  const [arnRef, setArnRef] = useState('');
  const [paymentDate, setPaymentDate] = useState(getTodayStr());

  // Add Creditor Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newVendor, setNewVendor] = useState<Partial<CreditorItem>>({
    vendorEntity: '',
    invoiceRef: '',
    dueDate: '2026-08-10',
    amount: 150000,
    narration: 'Raw Material Purchase',
    status: 'Pending',
    notes: '',
  });

  // Extract unique narrations for filter dropdown
  const uniqueNarrations = Array.from(new Set(creditors.map((c) => c.narration).filter(Boolean)));
  const narrationOptions = ['All', ...uniqueNarrations];

  const filteredCreditors = creditors.filter((item) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      item.vendorEntity.toLowerCase().includes(search) ||
      item.invoiceRef.toLowerCase().includes(search) ||
      (item.narration && item.narration.toLowerCase().includes(search)) ||
      (item.notes && item.notes.toLowerCase().includes(search));
    const matchesNarration = narrationFilter === 'All' || item.narration === narrationFilter;
    return matchesSearch && matchesNarration;
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
      narration: newVendor.narration || 'General Supplies',
      status: 'Pending',
      notes: newVendor.notes || '',
    };

    onAddCreditor(created);
    setIsAddOpen(false);
    setNewVendor({
      vendorEntity: '',
      invoiceRef: '',
      dueDate: '2026-08-10',
      amount: 150000,
      narration: 'Raw Material Purchase',
      status: 'Pending',
      notes: '',
    });
  };

  // High-level summary metrics
  const totalCreditorsAmount = creditors.reduce((sum, c) => sum + c.amount, 0);
  const pendingCreditors = creditors.filter((c) => c.status !== 'Paid');
  const totalPendingOutflow = pendingCreditors.reduce((sum, c) => sum + c.amount, 0);
  const paidCreditors = creditors.filter((c) => c.status === 'Paid');
  const totalPaid = paidCreditors.reduce((sum, c) => sum + c.amount, 0);
  const uniqueVendorsCount = new Set(creditors.map((c) => c.vendorEntity)).size;

  return (
    <div className="space-y-6">
      {/* 1. TOP 4 MASTER METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total AP Book */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8EBF2] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#7D8499]">
              Total AP Book
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#EFF2FE] text-[#3045F5] flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl lg:text-3xl font-extrabold text-[#171B3A] tracking-tight tabular-nums">
              {formatINR(totalCreditorsAmount)}
            </h3>
            <p className="text-xs text-[#7D8499] mt-1 font-medium">
              {creditors.length} total vendor bills recorded
            </p>
          </div>
        </div>

        {/* Pending Vendor Dues */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8EBF2] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#7D8499]">
              Pending Payable Dues
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl lg:text-3xl font-extrabold text-rose-600 tracking-tight tabular-nums">
              {formatINR(totalPendingOutflow)}
            </h3>
            <p className="text-xs text-rose-600 mt-1 font-semibold">
              {pendingCreditors.length} invoice(s) awaiting payment
            </p>
          </div>
        </div>

        {/* Realized Cleared Payouts */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8EBF2] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#7D8499]">
              Disbursed Payouts
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
              {paidCreditors.length} vendor bills cleared with UTR
            </p>
          </div>
        </div>

        {/* Active Vendor Base */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8EBF2] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#7D8499]">
              Active Suppliers
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl lg:text-3xl font-extrabold text-[#171B3A] tracking-tight tabular-nums">
              {uniqueVendorsCount} Vendors
            </h3>
            <p className="text-xs text-[#7D8499] mt-1 font-medium">
              Steel, machinery & utility partners
            </p>
          </div>
        </div>
      </div>

      {/* 2. MAIN TABLE CONTAINER */}
      <div className="bg-white rounded-2xl border border-[#E8EBF2] shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 sm:p-5 border-b border-[#E8EBF2] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#7D8499] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search vendor, invoice, narration..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#F7F9FC] border border-[#E8EBF2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3045F5]/15 focus:border-[#3045F5] transition"
            />
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 self-end sm:self-auto flex-wrap">
            {/* Narration Filter */}
            <div className="flex items-center space-x-1.5 bg-[#F7F9FC] border border-[#E8EBF2] px-3 py-1.5 rounded-xl">
              <Filter className="w-3.5 h-3.5 text-[#7D8499]" />
              <select
                value={narrationFilter}
                onChange={(e) => setNarrationFilter(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold text-[#171B3A] focus:outline-none cursor-pointer max-w-[170px] truncate"
              >
                {narrationOptions.map((narr) => (
                  <option key={narr} value={narr}>
                    {narr}
                  </option>
                ))}
              </select>
            </div>

            {/* Sync Sheet Button */}
            {onOpenSyncModal && (
              <button
                onClick={onOpenSyncModal}
                className="px-3.5 py-2 rounded-xl bg-[#F7F9FC] hover:bg-white text-[#171B3A] border border-[#E8EBF2] hover:border-[#3045F5]/30 font-semibold text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#3045F5]" />
                <span className="hidden sm:inline">Sync Sheet</span>
              </button>
            )}

            {/* New Creditor Invoice Button */}
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#3045F5] hover:bg-[#2537D6] text-white font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Creditor Invoice</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F9FC] text-[#7D8499] border-b border-[#E8EBF2] uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="p-3.5">Ref ID</th>
                <th className="p-3.5">Vendor Entity</th>
                <th className="p-3.5">Narration / Category</th>
                <th className="p-3.5">Invoice Ref</th>
                <th className="p-3.5">Due Date</th>
                <th className="p-3.5 text-right">Amount (₹)</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5">Payment / UTR Ref</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EBF2]">
              {filteredCreditors.map((item) => {
                const daysDiff = calculateDaysDiff(item.dueDate);
                return (
                  <tr key={item.id} className="hover:bg-[#F7F9FC] transition group">
                    <td className="p-3.5 font-mono text-[#7D8499] text-[11px]">{item.id}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-[#171B3A]">{item.vendorEntity}</div>
                      {item.notes && (
                        <div className="text-[10px] text-[#7D8499] font-normal">{item.notes}</div>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-1 rounded-md bg-[#F7F9FC] text-[#171B3A] text-[11px] font-semibold border border-[#E8EBF2] inline-block max-w-[200px] truncate" title={item.narration}>
                        {item.narration || '-'}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-[#171B3A] text-[11px]">{item.invoiceRef}</td>
                    <td className="p-3.5 text-[#7D8499]">
                      <div>{item.dueDate}</div>
                      {daysDiff < 0 && item.status !== 'Paid' && (
                        <span className="text-[10px] text-rose-600 font-bold block">
                          Overdue by {Math.abs(daysDiff)} days
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-extrabold text-rose-600 text-right tabular-nums">
                      {formatINR(item.amount)}
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'Paid'
                            ? 'bg-emerald-50 text-[#10B981]'
                            : item.status === 'Overdue'
                            ? 'bg-rose-50 text-rose-700'
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
                            {item.arnChallanRef || 'RTGS/HDFC-OUT'}
                          </div>
                          <div className="text-[10px] text-[#7D8499]">Paid on {item.paymentDate}</div>
                        </div>
                      ) : (
                        <span className="text-[#7D8499] text-[11px] italic">Pending Release</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      {item.status !== 'Paid' ? (
                        <button
                          onClick={() => setSelectedCreditor(item)}
                          className="px-3 py-1.5 rounded-lg bg-[#10B981] hover:bg-emerald-600 text-white font-bold text-xs transition cursor-pointer shadow-2xs"
                        >
                          Record Payout
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
              })}
            </tbody>
          </table>
        </div>

        {filteredCreditors.length === 0 && (
          <div className="p-12 text-center bg-[#F7F9FC]/50 border-t border-[#E8EBF2]">
            <div className="max-w-md mx-auto space-y-3">
              <Building2 className="w-10 h-10 text-[#7D8499] mx-auto stroke-1" />
              <h3 className="text-sm font-bold text-[#171B3A]">No Creditor Entries Matched</h3>
              <p className="text-xs text-[#7D8499]">
                Sync live accounts payable data directly from your Google Sheet <strong className="text-[#171B3A] font-semibold font-mono">"Creditors"</strong> tab.
              </p>
              {onOpenSyncModal && (
                <button
                  onClick={onOpenSyncModal}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#3045F5] hover:bg-[#2537D6] text-white font-bold text-xs transition cursor-pointer shadow-xs mt-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync "Creditors" Tab</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. RECORD PAYOUT MODAL */}
      {selectedCreditor && (
        <div className="fixed inset-0 bg-[#171B3A]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E8EBF2] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8EBF2] pb-3">
              <h3 className="text-base font-extrabold text-[#171B3A]">
                Record Vendor Payout
              </h3>
              <button
                onClick={() => setSelectedCreditor(null)}
                className="text-[#7D8499] hover:text-[#171B3A] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#F7F9FC] p-3.5 rounded-xl border border-[#E8EBF2] text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#7D8499]">Vendor:</span>
                <span className="font-bold text-[#171B3A]">{selectedCreditor.vendorEntity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7D8499]">Invoice:</span>
                <span className="font-mono text-[#171B3A]">{selectedCreditor.invoiceRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7D8499]">Payout Amount:</span>
                <span className="font-extrabold text-rose-600 tabular-nums">
                  {formatINR(selectedCreditor.amount)}
                </span>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#171B3A] mb-1">
                  Bank UTR / ARN / Challan Reference *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RTGS/HDFCR5202607280012 or UTR881023"
                  value={arnRef}
                  onChange={(e) => setArnRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E8EBF2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#171B3A] mb-1">
                  Payment Release Date *
                </label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E8EBF2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#E8EBF2]">
                <button
                  type="button"
                  onClick={() => setSelectedCreditor(null)}
                  className="px-4 py-2 rounded-xl border border-[#E8EBF2] text-[#7D8499] text-xs font-semibold cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#10B981] hover:bg-emerald-600 text-white text-xs font-bold cursor-pointer shadow-xs"
                >
                  Confirm Payout Released
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. ADD CREDITOR INVOICE MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-[#171B3A]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E8EBF2] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8EBF2] pb-3">
              <h3 className="text-base font-extrabold text-[#171B3A]">Add Creditor Invoice</h3>
              <button
                onClick={() => setIsAddOpen(false)}
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
                  placeholder="e.g. Tata Steel / Trumpf India / MSEDCL"
                  value={newVendor.vendorEntity}
                  onChange={(e) => setNewVendor({ ...newVendor, vendorEntity: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E8EBF2] rounded-xl focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#171B3A] mb-1">Narration / Category *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HR Steel Sheet Coils"
                    value={newVendor.narration || ''}
                    onChange={(e) => setNewVendor({ ...newVendor, narration: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E8EBF2] rounded-xl focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#171B3A] mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={newVendor.amount}
                    onChange={(e) => setNewVendor({ ...newVendor, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#E8EBF2] rounded-xl focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#171B3A] mb-1">Invoice Ref</label>
                  <input
                    type="text"
                    placeholder="e.g. TSDPL/IN/88341"
                    value={newVendor.invoiceRef}
                    onChange={(e) => setNewVendor({ ...newVendor, invoiceRef: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E8EBF2] rounded-xl focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#171B3A] mb-1">Payment Due Date</label>
                  <input
                    type="date"
                    value={newVendor.dueDate}
                    onChange={(e) => setNewVendor({ ...newVendor, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E8EBF2] rounded-xl focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#171B3A] mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. HR & CR Steel Coil supplies"
                  value={newVendor.notes}
                  onChange={(e) => setNewVendor({ ...newVendor, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E8EBF2] rounded-xl focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#E8EBF2]">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-[#E8EBF2] rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-50 text-[#7D8499]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#3045F5] hover:bg-[#2537D6] text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
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
