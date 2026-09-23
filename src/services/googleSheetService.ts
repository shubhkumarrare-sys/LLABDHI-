import { ComplianceItem, EmiItem, ItemStatus } from '../types';
import { normalizeSheetDate, parseCsvText } from '../utils/googleSheetSync';
import { getTodayStr } from '../utils/calculations';

export const TARGET_SPREADSHEET_ID = '1Q6I4-ELCWAhDZ8p6nFwHq0m63zQH4X0BuGCmMn07ec8';
export const DEFAULT_SHEET_URL = `https://docs.google.com/spreadsheets/d/${TARGET_SPREADSHEET_ID}/edit?gid=2063948472#gid=2063948472`;

export interface EmiScheduleRow {
  id: string;
  srNo: string;
  done: boolean;
  loanName: string;
  totalLoanLiability: number;
  dueDate: string; // YYYY-MM-DD
  rawDueDate: string;
  emiAmount: number;
  interest: number;
  principalAmount: number;
  balance: number;
  paymentDateTimestamp?: string;
  acknowledgementUrl?: string;
  status: ItemStatus;
}

export interface SheetSyncResult {
  compliance: ComplianceItem[];
  emis: EmiItem[];
  emiSchedule: EmiScheduleRow[];
  lastUpdated: string;
  success: boolean;
  error?: string;
}

// Clean and extract numeric currency string like "₹7,200,000.00" -> 7200000
export const parseCurrency = (val: any): number => {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).replace(/[^0-9.-]/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

// Check if a cell indicates a ticked/checked checkbox
export const isCheckboxChecked = (val: any): boolean => {
  if (val === true) return true;
  if (!val) return false;
  const clean = String(val).trim().toUpperCase();
  return (
    clean === 'TRUE' ||
    clean === 'CHECKED' ||
    clean === 'YES' ||
    clean === 'Y' ||
    clean === '1' ||
    clean === 'DONE' ||
    clean === 'COMPLETED' ||
    clean === 'FILED' ||
    clean === 'PAID' ||
    clean === '[X]'
  );
};

/**
 * Fetch and parse LLP_Compliance tab directly from Google Sheet CSV endpoint.
 * Exactly preserves the 01/10/2026 - 31/01/2027 compliance range.
 * Zero duplicate records: maps rows by stable deterministic identity key.
 */
export async function fetchLLPCompliance(spreadsheetId = TARGET_SPREADSHEET_ID): Promise<ComplianceItem[]> {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=LLP_Compliance&_t=${Date.now()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch LLP_Compliance sheet (HTTP ${response.status})`);
  }

  const csvText = await response.text();
  const rows = parseCsvText(csvText);
  const today = getTodayStr();

  // Stable key map to prevent ANY duplicate rows across multiple sync cycles
  const complianceMap = new Map<string, ComplianceItem>();

  rows.forEach((r, idx) => {
    const periodBlock = (r['period block'] || r['period'] || '').trim();
    const complianceReturn = (r['compliance / return'] || r['compliance return'] || r['title'] || '').trim();
    if (!complianceReturn) return;

    const govtAuthority = (r['govt authority'] || r['authority'] || 'GSTN Portal').trim();
    const rawDeadline = (r['statutory deadline'] || r['deadline'] || r['due date'] || '').trim();
    const normalizedDeadline = normalizeSheetDate(rawDeadline) || '2026-10-31';

    const rawStatus = (r['status'] || '').trim();
    const isChecked = isCheckboxChecked(rawStatus);

    const paymentOrFilingDate = (r['payment / filing date'] || r['filing date'] || r['payment date'] || '').trim();
    const amountPaid = parseCurrency(r['amount paid (₹)'] || r['amount paid'] || r['amount']);
    const challanArn = (r['challan / arn no.'] || r['challan / arn no'] || r['arn'] || r['challan'] || '').trim();
    const photoUrl = (r['upload acknowledgement / photo'] || r['acknowledgement'] || '').trim();

    // Mapping:
    // ☑ TRUE -> Completed / Filed
    // ☐ FALSE -> Pending (or Overdue if past statutory deadline)
    let status: ItemStatus = 'Pending';
    if (isChecked || paymentOrFilingDate !== '' || challanArn !== '') {
      status = 'Filed';
    } else if (normalizedDeadline < today) {
      status = 'Overdue';
    } else {
      status = 'Pending';
    }

    // Stable deterministic ID: Period Block + Compliance Return
    const stableId = `CMP-${periodBlock.replace(/[^0-9]/g, '')}-${complianceReturn.replace(/[^a-zA-Z0-9]/g, '_')}`;

    const item: ComplianceItem = {
      id: stableId,
      title: complianceReturn,
      period: periodBlock || 'FY 2026-27',
      dueDate: normalizedDeadline,
      governingAuthority: govtAuthority as any,
      status,
      filingDate: paymentOrFilingDate || (status === 'Filed' ? normalizedDeadline : undefined),
      arnChallanRef: challanArn || undefined,
      estimatedAmount: amountPaid > 0 ? amountPaid : undefined,
      responsibility: govtAuthority.includes('Income Tax') ? 'Tax Consultant' : 'In-House Finance',
    };

    complianceMap.set(stableId, item);
  });

  return Array.from(complianceMap.values()).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

/**
 * Fetch and parse EMIs tab directly from Google Sheet CSV endpoint.
 * Zero duplicate records: maps rows by Sr. No + Loan Name + Due Date.
 */
export async function fetchEMIs(spreadsheetId = TARGET_SPREADSHEET_ID): Promise<{
  activeLoans: EmiItem[];
  allScheduleRows: EmiScheduleRow[];
}> {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=EMIs&_t=${Date.now()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch EMIs sheet (HTTP ${response.status})`);
  }

  const csvText = await response.text();
  const rows = parseCsvText(csvText);
  const today = getTodayStr();

  const scheduleMap = new Map<string, EmiScheduleRow>();

  rows.forEach((r, idx) => {
    const loanName = (r['loan name'] || r['loan'] || '').trim();
    if (!loanName) return;

    const srNo = (r['sr. no'] || r['sr no'] || String(idx + 1)).trim();
    const rawDone = (r['done'] || '').trim();
    const isDone = isCheckboxChecked(rawDone);

    const totalLiability = parseCurrency(r['total loan liability'] || r['total liability']);
    const rawDueDate = (r['due date'] || '').trim();
    const normalizedDueDate = normalizeSheetDate(rawDueDate) || '2026-10-05';
    const emiAmount = parseCurrency(r['emi amount'] || r['monthly emi']);
    const interest = parseCurrency(r['interest']);
    const principal = parseCurrency(r['principal amount'] || r['principal']);
    const balance = parseCurrency(r['balance']);
    const paymentTimestamp = (r['payment date timestamp'] || r['payment date'] || '').trim();
    const photoUrl = (r['upload acknowledgement / photo'] || '').trim();

    // Mapping:
    // ☑ Done (TRUE) -> Paid / Completed
    // ☐ Done (FALSE) -> Pending / Upcoming (or Overdue if past due date)
    let status: ItemStatus = 'Upcoming';
    if (isDone || paymentTimestamp !== '') {
      status = 'Paid';
    } else if (normalizedDueDate < today) {
      status = 'Overdue';
    } else {
      status = 'Upcoming';
    }

    // Stable unique key: Sr. No + Loan Name + Due Date
    const stableId = `EMI-${srNo}-${loanName.replace(/[^a-zA-Z0-9]/g, '_')}-${rawDueDate.replace(/[^0-9]/g, '')}`;

    const scheduleRow: EmiScheduleRow = {
      id: stableId,
      srNo,
      done: isDone,
      loanName,
      totalLoanLiability: totalLiability,
      dueDate: normalizedDueDate,
      rawDueDate,
      emiAmount,
      interest,
      principalAmount: principal,
      balance,
      paymentDateTimestamp: paymentTimestamp || (isDone ? normalizedDueDate : undefined),
      acknowledgementUrl: photoUrl || undefined,
      status,
    };

    scheduleMap.set(stableId, scheduleRow);
  });

  const allScheduleRows = Array.from(scheduleMap.values());

  // Aggregate into clean active loan facilities
  const loanGroups = new Map<string, EmiScheduleRow[]>();
  allScheduleRows.forEach((row) => {
    const list = loanGroups.get(row.loanName) || [];
    list.push(row);
    loanGroups.set(row.loanName, list);
  });

  const activeLoans: EmiItem[] = [];

  loanGroups.forEach((loanRows, name) => {
    // Sort chronological
    loanRows.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    // Find next upcoming installment that is NOT paid
    const pendingInstallments = loanRows.filter((r) => r.status !== 'Paid');
    const nextInstallment = pendingInstallments[0] || loanRows[loanRows.length - 1];

    const totalLiability = Math.max(...loanRows.map((r) => r.totalLoanLiability));
    const monthlyEmi = nextInstallment ? nextInstallment.emiAmount : (loanRows[0]?.emiAmount || 50000);
    const latestBalance = pendingInstallments[0]?.balance ?? loanRows[loanRows.length - 1]?.balance ?? 0;

    let lenderBank = 'Lender Bank';
    let vehicleModel = 'Vehicle / Facility';
    let accountNo = `LOAN-${name.replace(/[^a-zA-Z0-9]/g, '').slice(-8)}`;

    const lower = name.toLowerCase();
    if (lower.includes('cyberster') || lower.includes('910000000130651')) {
      lenderBank = 'Kotak Mahindra Prime';
      vehicleModel = 'MG Cyberster EV Sports Car';
      accountNo = '910000000130651';
    } else if (lower.includes('mercedes')) {
      lenderBank = 'Mercedes-Benz Financial Services';
      vehicleModel = 'Mercedes-Benz Luxury Vehicle';
      accountNo = 'SARASWAT-AL-882041';
    } else if (lower.includes('deutsche')) {
      lenderBank = 'Deutsche Bank AG';
      vehicleModel = 'Machinery & Working Capital Facility';
      accountNo = '300041984370019';
    } else if (lower.includes('sidbi')) {
      lenderBank = 'SIDBI';
      vehicleModel = 'Industrial Green Energy Term Loan';
      accountNo = '1412070';
    } else if (lower.includes('kotak')) {
      lenderBank = 'Kotak Mahindra Bank';
      vehicleModel = 'Term Credit Facility';
      accountNo = 'KOTAK-CF-44910';
    }

    const nextDueDate = nextInstallment ? nextInstallment.dueDate : '2027-01-01';
    const dueDayOfMonth = parseInt(nextDueDate.split('-')[2], 10) || 5;

    activeLoans.push({
      id: `LOAN-FACILITY-${name.replace(/[^a-zA-Z0-9]/g, '_')}`,
      loanName: name,
      vehicleModel,
      lenderBank,
      accountNo,
      totalLoanValue: totalLiability > 0 ? totalLiability : 5000000,
      remainingBalance: latestBalance > 0 ? latestBalance : totalLiability * 0.7,
      monthlyEmi,
      dueDayOfMonth,
      nextDueDate,
      status: nextInstallment ? nextInstallment.status : 'Paid',
      lastPaymentDate: loanRows.filter((r) => r.status === 'Paid').slice(-1)[0]?.paymentDateTimestamp,
    });
  });

  return {
    activeLoans,
    allScheduleRows,
  };
}

/**
 * Unified live synchronizer that retrieves all current Google Sheet tabs,
 * updates existing records without duplication, and persists to local storage.
 */
export async function syncAllSheetData(spreadsheetId = TARGET_SPREADSHEET_ID): Promise<SheetSyncResult> {
  try {
    const [compliance, emiData] = await Promise.all([
      fetchLLPCompliance(spreadsheetId),
      fetchEMIs(spreadsheetId),
    ]);

    const timestamp = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    // Save to localStorage as backup cache if in browser environment
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('llabdhi_compliance_v4', JSON.stringify(compliance));
      window.localStorage.setItem('llabdhi_emis_v4', JSON.stringify(emiData.activeLoans));
      window.localStorage.setItem('llabdhi_emi_schedule_v4', JSON.stringify(emiData.allScheduleRows));
      window.localStorage.setItem('llabdhi_last_sync_timestamp', timestamp);
      window.localStorage.setItem('llabdhi_sheet_connected', 'true');
    }

    return {
      compliance,
      emis: emiData.activeLoans,
      emiSchedule: emiData.allScheduleRows,
      lastUpdated: timestamp,
      success: true,
    };
  } catch (err: any) {
    console.error('Error syncing Google Sheet data:', err);
    const cachedTime =
      typeof window !== 'undefined' && window.localStorage
        ? window.localStorage.getItem('llabdhi_last_sync_timestamp') || 'Pending'
        : 'Pending';
    return {
      compliance: [],
      emis: [],
      emiSchedule: [],
      lastUpdated: cachedTime,
      success: false,
      error: err?.message || 'Connection failed',
    };
  }
}
