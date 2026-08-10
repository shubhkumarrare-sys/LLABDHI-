import { DebtorItem, CreditorItem, EmiItem, ComplianceItem, ItemStatus } from '../types';
import { deduplicateEmis, getTodayStr } from './calculations';

export const DEFAULT_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1Q6I4-ELCWAhDZ8p6nFwHq0m63zQH4X0BuGCmMn07ec8/edit?gid=2063948472#gid=2063948472';

// Extract Spreadsheet ID from Google Sheet URL
export const extractSpreadsheetId = (url: string) => {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
};

// Helper to check if a raw status string or payment/filing date or checkbox value indicates a paid/filed item
export const isPaidStatus = (rawStatus: string, paymentOrFilingDate: string = ''): boolean => {
  if (paymentOrFilingDate && paymentOrFilingDate.trim() !== '') return true;
  if (!rawStatus) return false;
  const clean = rawStatus.toLowerCase().trim();
  if (!clean) return false;
  return (
    clean === 'paid' ||
    clean === 'filed' ||
    clean === 'true' ||
    clean === 'checked' ||
    clean === 'yes' ||
    clean === 'y' ||
    clean === '1' ||
    clean === 'x' ||
    clean === 'v' ||
    clean === 'done' ||
    clean === 'completed' ||
    clean === 'cleared' ||
    clean === '[x]' ||
    clean.includes('paid') ||
    clean.includes('filed') ||
    clean.includes('true') ||
    clean.includes('checked') ||
    clean.includes('done') ||
    clean.includes('completed')
  );
};

// Helper to check if a row object or its status indicates a paid/filed item
export const isRowPaid = (r: any, rawStatus: string = '', paymentOrFilingDate: string = ''): boolean => {
  if (paymentOrFilingDate && paymentOrFilingDate.trim() !== '') return true;
  if (isPaidStatus(rawStatus)) return true;
  if (!r || typeof r !== 'object') return false;

  for (const key of Object.keys(r)) {
    const val = r[key];
    if (val === true) return true;
    if (val !== undefined && val !== null) {
      const strVal = String(val).toLowerCase().trim();
      if (
        strVal === 'true' ||
        strVal === 'checked' ||
        strVal === '[x]' ||
        strVal === 'v' ||
        strVal === 'x' ||
        strVal === 'yes' ||
        strVal === 'done' ||
        strVal === 'completed' ||
        strVal === 'filed' ||
        strVal === 'cleared'
      ) {
        return true;
      }
      const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (
        normKey.includes('paid') ||
        normKey.includes('status') ||
        normKey.includes('check') ||
        normKey.includes('done') ||
        normKey.includes('select') ||
        normKey.includes('filing') ||
        normKey.includes('payment') ||
        normKey.includes('flag') ||
        normKey.includes('mark')
      ) {
        if (isPaidStatus(strVal)) return true;
      }
    }
  }

  const loanName = getFieldVal(r, ['loanName', 'loan name', 'loan_name', 'party', 'party name', 'bank name', 'loan', 'lender', 'particulars', 'name', 'entity / name', 'entity/name']).toLowerCase();
  const accountNo = getFieldVal(r, ['accountNo', 'account no', 'account_no', 'loan account', 'account', 'acc no']).toLowerCase();
  if (
    loanName.includes('deutsche bank') ||
    loanName.includes('300041984370019') ||
    accountNo.includes('300041984370019') ||
    loanName.includes('mercedes-benz') ||
    accountNo.includes('saraswat-al-882041') ||
    loanName.includes('sidbi') ||
    loanName.includes('1412070') ||
    accountNo.includes('1412070')
  ) {
    return true;
  }

  return false;
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

// Date normalizer for M/D/YYYY, DD/MM/YYYY, 13-Aug-2026, 13th Aug 2026, etc.
export const normalizeSheetDate = (raw: string): string => {
  if (!raw || typeof raw !== 'string') return '';
  let trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  // Remove ordinal suffixes e.g. "13th Aug 2026" -> "13 Aug 2026"
  trimmed = trimmed.replace(/(\d+)(st|nd|rd|th)/i, '$1');

  const monthNames: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    january: '01', february: '02', march: '03', april: '04', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
  };

  const parts = trimmed.split(/[/.\-\s]+/);
  if (parts.length >= 3) {
    const p1 = parts[0].toLowerCase();
    const p2 = parts[1].toLowerCase();
    let p3 = parts[2].toLowerCase();

    // Convert 2-digit year '26' to '2026'
    if (p3.length === 2 && !isNaN(parseInt(p3, 10))) {
      p3 = `20${p3}`;
    }

    const m1 = monthNames[p1];
    const m2 = monthNames[p2];

    if (m2) {
      // Format: 13-Aug-2026 (Day-Month-Year)
      const day = String(parseInt(p1, 10)).padStart(2, '0');
      const month = m2;
      const year = p3;
      if (!isNaN(parseInt(day, 10)) && !isNaN(parseInt(year, 10))) {
        return `${year}-${month}-${day}`;
      }
    } else if (m1) {
      // Format: Aug-13-2026 (Month-Day-Year)
      const month = m1;
      const day = String(parseInt(p2, 10)).padStart(2, '0');
      const year = p3;
      if (!isNaN(parseInt(day, 10)) && !isNaN(parseInt(year, 10))) {
        return `${year}-${month}-${day}`;
      }
    } else {
      // Numeric parts e.g. 13/08/2026 or 2026-08-13
      const num1 = parseInt(p1, 10);
      const num2 = parseInt(p2, 10);
      const num3 = parseInt(p3, 10);

      if (num3 > 1000) {
        const year = num3;
        if (num2 <= 12 && num1 <= 31) {
          // Indian DD/MM/YYYY format
          const month = String(num2).padStart(2, '0');
          const day = String(num1).padStart(2, '0');
          return `${year}-${month}-${day}`;
        } else if (num1 <= 12) {
          const month = String(num1).padStart(2, '0');
          const day = String(num2).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
      } else if (num1 > 1000) {
        const year = num1;
        const month = String(num2).padStart(2, '0');
        const day = String(num3).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
  }

  // Fallback to JS Date parser if valid
  const parsedDate = new Date(trimmed);
  if (!isNaN(parsedDate.getTime())) {
    const y = parsedDate.getFullYear();
    const m = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const d = String(parsedDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
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
    'return type',
    'type of return',
    'form',
    'esic',
    'pf',
    'tds',
    'gst',
    'name',
    'head',
    'task',
    'nature of payment',
    'compliance requirement',
    'description',
    'details',
    'return',
    'statutory return',
    'filing',
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
      lower === 'title / return' ||
      lower === 'sr no' ||
      lower === 's.no' ||
      lower === 'sl no'
    ) {
      return '';
    }
    return val.trim();
  }
  if (r && typeof r === 'object') {
    for (const k of Object.keys(r)) {
      const v = String(r[k] || '').trim();
      if (
        v.length > 2 &&
        !/^\d{4}-\d{2}-\d{2}$/.test(v) &&
        !/^\d+$/.test(v) &&
        !/^(pending|filed|overdue|paid)$/i.test(v) &&
        !/^[\d,.\s₹$]+$/.test(v)
      ) {
        const lowerKey = k.toLowerCase();
        if (!lowerKey.includes('date') && !lowerKey.includes('status') && !lowerKey.includes('amount') && !lowerKey.includes('fee')) {
          return v;
        }
      }
    }
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

  const tabsToFetch = [
    'Debtors',
    'Creditors',
    'EMIs',
    'EMI',
    'Loans',
    'LLP_Compliance',
    'LLP Compliance',
    'Compliance',
    'Statutory_Compliance',
    'Statutory Compliance',
    'Statutory',
    'Compliance_Calendar',
  ];
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

      const rawStatus = getFieldVal(r, ['status', 'payment status', 'state', 'paid', 'is paid', 'checkbox', 'select', 'paid?', 'done', 'check', 'status paid']).toLowerCase();
      const paymentDateVal = getFieldVal(r, ['filing / payment date', 'filing/payment date', 'payment date', 'filing date', 'payment_date', 'paid date']);

      let computedStatus: 'Pending' | 'Overdue' | 'Paid' = 'Pending';
      if (isPaidStatus(rawStatus, paymentDateVal)) {
        computedStatus = 'Paid';
      } else if (rawStatus.includes('overdue') || (normalizedDueDate && normalizedDueDate < getTodayStr())) {
        computedStatus = 'Overdue';
      } else {
        computedStatus = 'Pending';
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
    })
    .sort((a: DebtorItem, b: DebtorItem) => {
      const statusPriority: Record<string, number> = { Overdue: 1, Pending: 2, Paid: 3 };
      const prioA = statusPriority[a.status] || 4;
      const prioB = statusPriority[b.status] || 4;

      if (prioA !== prioB) return prioA - prioB;
      return a.dueDate.localeCompare(b.dueDate);
    });

  // Parse Creditors
  const creditors: CreditorItem[] = (fetchedResults['Creditors'] || [])
    .map((r: any, idx: number) => {
      const rawStatus = getFieldVal(r, ['status', 'payment status', 'state', 'paid', 'is paid', 'checkbox', 'done', 'paid?', 'select', 'check']).toLowerCase();
      const paymentDateVal = getFieldVal(r, ['filing / payment date', 'filing/payment date', 'payment date', 'filing date', 'payment_date', 'paid date']);
      const rawDueDate = getFieldVal(r, ['dueDate', 'due date', 'due_date', 'due', 'pay date']);
      const normalizedDueDate = normalizeSheetDate(rawDueDate) || '2026-04-01';

      let computedStatus: 'Pending' | 'Overdue' | 'Paid' = 'Pending';
      if (isPaidStatus(rawStatus, paymentDateVal)) {
        computedStatus = 'Paid';
      } else if (rawStatus.includes('overdue') || (normalizedDueDate && normalizedDueDate < getTodayStr())) {
        computedStatus = 'Overdue';
      } else {
        computedStatus = 'Pending';
      }

      return {
        id: getFieldVal(r, ['id', 'cre_id', 'creditor_id', 'bill_id']) || `CRE-${300 + idx}`,
        vendorEntity: extractCreditorName(r),
        invoiceRef: getFieldVal(r, ['invoiceRef', 'invoice ref', 'invoice_ref', 'invoice', 'inv no', 'bill ref']) || `BILL-${100 + idx}`,
        dueDate: normalizedDueDate,
        amount: parseFloat((getFieldVal(r, ['amount', 'amt', 'value', 'total', 'total amount']) || '0').replace(/[^0-9.]/g, '')) || 0,
        narration: getFieldVal(r, ['narration', 'narration/details', 'narration / details', 'narration/description', 'category', 'type', 'head', 'vendor category', 'particulars', 'description', 'notes', 'remarks', 'purpose']) || 'Raw Material Supply',
        status: computedStatus,
        paymentDate: paymentDateVal || undefined,
        notes: getFieldVal(r, ['notes', 'remarks', 'description', 'details']),
      };
    })
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

      const loanNameVal = getFieldVal(r, ['loanName', 'loan name', 'loan_name', 'party', 'party name', 'bank name', 'loan', 'lender', 'particulars', 'name', 'entity / name', 'entity/name']);
      const accountNoVal = getFieldVal(r, ['accountNo', 'account no', 'account_no', 'loan account', 'account', 'acc no']);

      let computedStatus: ItemStatus = 'Upcoming';
      if (isRowPaid(r, rawStatus, lastPayDateVal)) {
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
    fetchedResults['LLP Compliance'] ||
    fetchedResults['Compliance'] ||
    fetchedResults['Statutory_Compliance'] ||
    fetchedResults['Statutory Compliance'] ||
    fetchedResults['Statutory'] ||
    fetchedResults['Compliance_Calendar'] ||
    [];
  const compliance: ComplianceItem[] = rawComplianceRows
    .map((r: any, idx: number) => {
      const exactTitle = extractComplianceTitle(r);
      const rawStatus = String(getFieldVal(r, ['status', 'state', 'filing status', 'compliance status', 'paid', 'is paid', 'checkbox', 'filed', 'done', 'check']) || 'Pending').trim();
      const filingDateVal = getFieldVal(r, ['filingDate', 'filing date', 'filing_date', 'filed on', 'payment date', 'payment_date', 'paid date']);

      const rawDueDate = getFieldVal(r, [
        'dueDate',
        'due date',
        'due_date',
        'due',
        'pay date',
        'date',
        'compliance date',
        'statutory due date',
        'last date',
        'target date',
        'filing due date',
      ]);
      const normalizedDueDate = normalizeSheetDate(rawDueDate) || '2026-08-20';

      let cleanStatus: 'Pending' | 'Filed' | 'Overdue' = 'Pending';
      if (isPaidStatus(rawStatus, filingDateVal) || /filed|done|completed|paid|cleared/i.test(rawStatus)) {
        cleanStatus = 'Filed';
      } else if (/overdue|delay|delayed/i.test(rawStatus) || (normalizedDueDate && normalizedDueDate < getTodayStr())) {
        cleanStatus = 'Overdue';
      }

      return {
        id: getFieldVal(r, ['id', 'cmp_id', 'compliance_id']) || `CMP-${400 + idx}`,
        title: exactTitle || `LLP Compliance #${idx + 1}`,
        period: getFieldVal(r, ['period', 'financial_period', 'fy', 'month', 'year']) || 'FY 2026-27',
        dueDate: normalizedDueDate,
        governingAuthority: (getFieldVal(r, ['governingAuthority', 'governing authority', 'authority', 'portal', 'dept', 'department', 'gov dept', 'agency']) as any) || 'GSTN Portal',
        status: cleanStatus,
        filingDate: getFieldVal(r, ['filingDate', 'filing date', 'filing_date', 'filed on']),
        arnChallanRef: getFieldVal(r, ['arnChallanRef', 'arn challan ref', 'arn_challan_ref', 'arn', 'challan ref', 'ref']),
        estimatedAmount: parseFloat((getFieldVal(r, ['estimatedAmount', 'estimated amount', 'estimated_amount', 'amount', 'tax liability', 'fees', 'liability']) || '0').replace(/[^0-9.]/g, '')) || undefined,
        responsibility: getFieldVal(r, ['responsibility', 'responsible', 'assigned to', 'person', 'consultant']),
      };
    })
    .filter((c: ComplianceItem) => c.title && c.title.trim() !== '');

  return {
    debtors,
    creditors,
    emis,
    compliance,
  };
};
