import { DebtorItem, CreditorItem, EmiItem, ComplianceItem, ItemStatus } from '../types';
import { deduplicateEmis } from './calculations';

export const DEFAULT_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1Q6I4-ELCWAhDZ8p6nFwHq0m63zQH4X0BuGCmMn07ec8/edit?gid=2063948472#gid=2063948472';

// Extract Spreadsheet ID from Google Sheet URL
export const extractSpreadsheetId = (url: string) => {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
};

// Helper to extract values for dynamic key variations
export const getFieldVal = (r: any, keys: string[]): string => {
  if (!r) return '';
  for (const key of Object.keys(r)) {
    const normalizedKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const k of keys) {
      if (normalizedKey === k.toLowerCase().replace(/[^a-z0-9]/g, '')) {
        if (r[key] !== undefined && r[key] !== null && String(r[key]).trim() !== '') {
          return String(r[key]).trim();
        }
      }
    }
  }
  return '';
};

// Date normalizer for M/D/YYYY (e.g. 7/11/2024 -> 2024-07-11)
export const normalizeSheetDate = (raw: string): string => {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const parts = trimmed.split(/[/.-]/);
  if (parts.length === 3) {
    const p1 = parseInt(parts[0], 10);
    const p2 = parseInt(parts[1], 10);
    const p3 = parseInt(parts[2], 10);

    if (p3 > 1000) {
      // MM/DD/YYYY format from Google Sheets
      const year = p3;
      const month = String(p1).padStart(2, '0');
      const day = String(p2).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } else if (p1 > 1000) {
      // YYYY/MM/DD
      const year = p1;
      const month = String(p2).padStart(2, '0');
      const day = String(p3).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
  return trimmed;
};

export const extractDebtorName = (r: any): string => {
  let val = getFieldVal(r, [
    'clientEntity',
    'client entity',
    'client_entity',
    'client',
    'client name',
    'entity / name',
    'entity/name',
    'entity',
    'entity name',
    'debtor',
    'debtors',
    'debtor name',
    'customer',
    'customer name',
    'party',
    'party name',
    'particulars',
    'company',
    'name',
  ]);
  if (val) {
    val = val.replace(/^(client|vendor|supplier|creditor|debtor)\s*[:|-]?\s*/i, '').trim();
  }
  return val || 'Debtor Entity';
};

export const extractCreditorName = (r: any): string => {
  let val = getFieldVal(r, [
    'vendorEntity',
    'vendor entity',
    'vendor_entity',
    'vendor',
    'vendor name',
    'creditor',
    'creditors',
    'creditor name',
    'supplier',
    'supplier name',
    'party',
    'party name',
    'particulars',
    'company',
    'name',
    'entity',
    'entity name',
  ]);
  if (val) {
    val = val.replace(/^(client|vendor|supplier|creditor|debtor)\s*[:|-]?\s*/i, '').trim();
    const lower = val.toLowerCase();
    if (
      lower === 'creditor entity' ||
      lower === 'vendor entity' ||
      lower === 'vendor' ||
      lower === 'supplier' ||
      lower === 'particulars' ||
      lower === 'entity name' ||
      lower === 'name' ||
      lower === 'vendor name' ||
      lower === 'creditor name'
    ) {
      return '';
    }
  }
  return val || '';
};

export const extractComplianceTitle = (r: any): string => {
  let val = getFieldVal(r, [
    'title',
    'compliance title',
    'compliance_title',
    'complianceName',
    'compliance_name',
    'statutory compliance',
    'statutory_compliance',
    'statutory compliance title',
    'compliance',
    'compliance head',
    'statutory head',
    'tax head',
    'particulars',
    'title / return',
    'compliance / return',
    'compliance return',
    'name',
    'head',
    'task',
    'nature of payment',
    'compliance requirement',
    'description',
    'details',
  ]);
  if (val) {
    const lower = val.trim().toLowerCase();
    if (
      lower === 'title' ||
      lower === 'compliance title' ||
      lower === 'statutory compliance' ||
      lower === 'compliance' ||
      lower === 'particulars' ||
      lower === 'name' ||
      lower === 'task' ||
      lower === 'head' ||
      lower === 'compliance head' ||
      lower === 'title / return'
    ) {
      return '';
    }
    return val.trim();
  }
  return '';
};

// Helper to parse CSV rows with full quote-awareness
export const parseCsvText = (csvText: string) => {
  const lines = csvText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length < 2) return [];

  const parseCsvRow = (line: string): string[] => {
    const values: string[] = [];
    let currentVal = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentVal.trim().replace(/^["']|["']$/g, ''));
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    values.push(currentVal.trim().replace(/^["']|["']$/g, ''));
    return values;
  };

  const headers = parseCsvRow(lines[0]).map((h) => h.toLowerCase().trim());

  return lines.slice(1).map((line) => {
    const values = parseCsvRow(line);
    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] !== undefined ? values[idx] : '';
    });
    return rowObj;
  });
};

export const fetchLiveSheetData = async (url?: string) => {
  const targetUrl = url || localStorage.getItem('llabdhi_sheet_url') || DEFAULT_SHEET_URL;
  const spreadsheetId = extractSpreadsheetId(targetUrl);

  if (!spreadsheetId) {
    throw new Error('Invalid Google Sheet URL.');
  }

  const tabsToFetch = ['Debtors', 'Creditors', 'EMIs', 'EMI', 'Loans', 'LLP_Compliance', 'Compliance'];
  const fetchedResults: Record<string, any[]> = {};

  for (const tabName of tabsToFetch) {
    try {
      const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
      const res = await fetch(exportUrl);
      if (res.ok) {
        const text = await res.text();
        const parsedRows = parseCsvText(text);
        if (parsedRows.length > 0) {
          fetchedResults[tabName] = parsedRows;
        }
      }
    } catch (e) {
      console.warn(`Could not fetch tab ${tabName} directly:`, e);
    }
  }

  if (Object.keys(fetchedResults).length === 0) {
    throw new Error(
      'Could not fetch public CSV tabs from the Google Sheet. Please check Internet connectivity or share permissions.'
    );
  }

  // Parse Debtors
  const debtors: DebtorItem[] = (fetchedResults['Debtors'] || [])
    .map((r: any, idx: number) => {
      const rawDueDate = getFieldVal(r, ['dueDate', 'due date', 'due_date', 'due', 'pay date']);
      const normalizedDueDate = normalizeSheetDate(rawDueDate) || '2026-08-01';
      const rawInvDate = getFieldVal(r, ['invoiceDate', 'invoice date', 'invoice_date', 'date', 'inv date']);
      const normalizedInvDate = normalizeSheetDate(rawInvDate) || '2026-07-01';

      const rawStatus = getFieldVal(r, ['status', 'payment status', 'state']).toLowerCase();
      const paymentDateVal = getFieldVal(r, ['filing / payment date', 'filing/payment date', 'payment date', 'filing date', 'payment_date']);

      let computedStatus: 'Pending' | 'Overdue' | 'Paid' = 'Pending';
      if (rawStatus === 'paid' || rawStatus === 'true' || rawStatus === 'checked' || paymentDateVal.trim() !== '') {
        computedStatus = 'Paid';
      } else if (normalizedDueDate < '2026-08-05') {
        computedStatus = 'Overdue';
      }

      const rawAmount = getFieldVal(r, ['amount', 'amt', 'value', 'total', 'total amount', 'total amount (₹)', 'total amount (\u20b9)']);
      const parsedAmt = parseFloat(rawAmount.replace(/[^0-9.]/g, '')) || 0;

      return {
        id: getFieldVal(r, ['id', 'deb_id', 'debtor_id', 'invoice_id', 'sr. no', 'sr no']) || `DEB-${200 + idx}`,
        clientEntity: extractDebtorName(r),
        invoiceRef: getFieldVal(r, ['invoiceRef', 'invoice ref', 'invoice_ref', 'invoice / reference no', 'invoice/reference no', 'reference no', 'invoice', 'inv no', 'bill ref']) || `INV-${100 + idx}`,
        invoiceDate: normalizedInvDate,
        dueDate: normalizedDueDate,
        amount: parsedAmt,
        status: computedStatus,
        paymentDate: paymentDateVal || undefined,
        contactEmail: getFieldVal(r, ['contactEmail', 'contact email', 'email', 'mail']),
        contactPerson: getFieldVal(r, ['contactPerson', 'contact person', 'contact', 'person']),
        notes: getFieldVal(r, ['notes', 'remarks', 'description', 'details']),
      };
    })
    .filter((d: DebtorItem) => {
      if (!d || !d.clientEntity || d.clientEntity.trim() === '') return false;
      const match = String(d.id).trim().toUpperCase().match(/^DEB-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num >= 284 && num <= 296) return false;
      }
      return true;
    });

  // Parse Creditors
  const creditors: CreditorItem[] = (fetchedResults['Creditors'] || [])
    .map((r: any, idx: number) => ({
      id: getFieldVal(r, ['id', 'cre_id', 'creditor_id', 'bill_id']) || `CRE-${300 + idx}`,
      vendorEntity: extractCreditorName(r),
      invoiceRef: getFieldVal(r, ['invoiceRef', 'invoice ref', 'invoice_ref', 'invoice', 'inv no', 'bill ref']) || `BILL-${100 + idx}`,
      dueDate: normalizeSheetDate(getFieldVal(r, ['dueDate', 'due date', 'due_date', 'due', 'pay date'])) || '2026-04-01',
      amount: parseFloat((getFieldVal(r, ['amount', 'amt', 'value', 'total', 'total amount']) || '0').replace(/[^0-9.]/g, '')) || 0,
      narration: getFieldVal(r, ['narration', 'narration/details', 'narration / details', 'narration/description', 'category', 'type', 'head', 'vendor category', 'particulars', 'description', 'notes', 'remarks', 'purpose']) || 'Raw Material Supply',
      status: (getFieldVal(r, ['status', 'payment status', 'state']) as any) || 'Pending',
      notes: getFieldVal(r, ['notes', 'remarks', 'description', 'details']),
    }))
    .filter(
      (c: CreditorItem) =>
        c.id !== 'CRE-301' &&
        c.id !== 'CRE-302' &&
        Boolean(c.vendorEntity && c.vendorEntity.trim() !== '')
    );

  // Parse EMIs
  const rawEmiRows = fetchedResults['EMIs'] || fetchedResults['EMI'] || fetchedResults['Loans'] || fetchedResults['Emi'] || [];
  const emis: EmiItem[] = deduplicateEmis(
    rawEmiRows.map((r: any, idx: number) => {
      const rawStatus = getFieldVal(r, [
        'status',
        'state',
        'payment status',
        'status/paid',
        'paid',
        'is paid',
        'is_paid',
        'check',
        'checkbox',
        'select',
        'sr. no',
        'sr no',
        'status (paid)',
        'paid?',
        'done',
      ]).toLowerCase();

      const lastPayDateVal = getFieldVal(r, [
        'lastPaymentDate',
        'last payment date',
        'last_payment_date',
        'last paid date',
        'filing / payment date',
        'filing/payment date',
        'payment date',
        'payment_date',
        'paid date',
      ]);

      let computedStatus: ItemStatus = 'Upcoming';
      if (
        rawStatus === 'paid' ||
        rawStatus === 'true' ||
        rawStatus === 'checked' ||
        rawStatus === 'yes' ||
        rawStatus === '1' ||
        rawStatus === 'x' ||
        rawStatus === 'v' ||
        lastPayDateVal.trim() !== ''
      ) {
        computedStatus = 'Paid';
      } else if (rawStatus === 'overdue') {
        computedStatus = 'Overdue';
      } else if (rawStatus === 'pending') {
        computedStatus = 'Pending';
      } else if (rawStatus === 'upcoming') {
        computedStatus = 'Upcoming';
      }

      const rawNextDueDate = getFieldVal(r, [
        'nextDueDate',
        'next due date',
        'next_due_date',
        'due date',
        'due_date',
        'pay date',
      ]);
      const normalizedNextDueDate = normalizeSheetDate(rawNextDueDate) || '2026-04-01';

      return {
        id: getFieldVal(r, ['id', 'emi_id', 'loan_id', 'sr. no', 'sr no']) || `EMI-${300 + idx}`,
        loanName: getFieldVal(r, ['loanName', 'loan name', 'loan_name', 'party', 'party name', 'bank name', 'loan', 'lender', 'particulars', 'name', 'entity / name', 'entity/name']) || 'Vehicle Loan',
        vehicleModel: getFieldVal(r, ['vehicleModel', 'vehicle model', 'vehicle_model', 'vehicle', 'model', 'details', 'description', 'particulars']) || 'Vehicle',
        lenderBank: getFieldVal(r, ['lenderBank', 'lender bank', 'lender_bank', 'bank', 'bank name', 'lender', 'institution']) || 'Lender Bank',
        accountNo: getFieldVal(r, ['accountNo', 'account no', 'account_no', 'loan account', 'account', 'acc no']) || `LOAN-${1000 + idx}`,
        totalLoanValue: parseFloat((getFieldVal(r, ['totalLoanValue', 'total loan value', 'total_loan_value', 'loan amount', 'sanctioned amount', 'amount']) || '0').replace(/[^0-9.]/g, '')) || 5000000,
        remainingBalance: parseFloat((getFieldVal(r, ['remainingBalance', 'remaining balance', 'remaining_balance', 'balance', 'principal remaining', 'outstanding']) || '0').replace(/[^0-9.]/g, '')) || 2500000,
        monthlyEmi: parseFloat((getFieldVal(r, ['monthlyEmi', 'monthly emi', 'monthly_emi', 'emi amount', 'emi', 'installment']) || '0').replace(/[^0-9.]/g, '')) || 50000,
        dueDayOfMonth: parseInt((getFieldVal(r, ['dueDayOfMonth', 'due day', 'due_day', 'day']) || '5').replace(/[^0-9]/g, '')) || 5,
        nextDueDate: normalizedNextDueDate,
        status: computedStatus,
        lastPaymentDate: lastPayDateVal || undefined,
        lastPaymentRef: getFieldVal(r, ['lastPaymentRef', 'last payment ref', 'last_payment_ref', 'payment ref', 'reference']),
      };
    })
  );

  // Parse Compliance
  const rawComplianceRows =
    fetchedResults['LLP_Compliance'] ||
    fetchedResults['Compliance'] ||
    fetchedResults['Statutory_Compliance'] ||
    fetchedResults['Compliance_Calendar'] ||
    fetchedResults['LLP Compliance'] ||
    [];
  const compliance: ComplianceItem[] = rawComplianceRows
    .map((r: any, idx: number) => {
      const exactTitle = extractComplianceTitle(r);
      return {
        id: getFieldVal(r, ['id', 'cmp_id', 'compliance_id']) || `CMP-${400 + idx}`,
        title: exactTitle || 'Statutory Compliance',
        period: getFieldVal(r, ['period', 'financial_period', 'fy', 'month', 'year']) || 'FY 2026-27',
        dueDate: normalizeSheetDate(getFieldVal(r, ['dueDate', 'due date', 'due_date', 'due', 'pay date'])) || '2026-08-20',
        governingAuthority: (getFieldVal(r, ['governingAuthority', 'governing authority', 'authority', 'portal', 'dept', 'department']) as any) || 'GSTN Portal',
        status: (getFieldVal(r, ['status', 'state', 'filing status']) as any) || 'Pending',
        filingDate: getFieldVal(r, ['filingDate', 'filing date', 'filing_date', 'filed on']),
        arnChallanRef: getFieldVal(r, ['arnChallanRef', 'arn challan ref', 'arn_challan_ref', 'arn', 'challan ref', 'ref']),
        estimatedAmount: parseFloat((getFieldVal(r, ['estimatedAmount', 'estimated amount', 'estimated_amount', 'amount', 'tax liability', 'fees']) || '0').replace(/[^0-9.]/g, '')) || undefined,
        responsibility: getFieldVal(r, ['responsibility', 'responsible', 'assigned to', 'person', 'consultant']),
      };
    })
    .filter((c: ComplianceItem) => c.title && c.title.trim() !== '' && c.title !== 'Statutory Compliance');

  return {
    debtors,
    creditors,
    emis,
    compliance,
  };
};
