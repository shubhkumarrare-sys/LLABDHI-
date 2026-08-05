import {
  DebtorItem,
  CreditorItem,
  EmiItem,
  ComplianceItem,
  CalendarLogItem,
  EmailLogItem,
  AppSettings,
  GstPayableState,
} from '../types';

// Baseline date reference: Current local date in context is 2026-07-30
export const INITIAL_SETTINGS: AppSettings = {
  companyName: 'Llabdhi Manufacturing LLP',
  currencySymbol: '₹',
  creditTermsDays: 30,
  reminderIntervals: [-7, -5, -3, -2, -1, 0, 1, 2, 3, 7],
  notificationEmail: 'shubhkumarrare@gmail.com',
  autoSyncCalendar: true,
  autoEmailReminders: true,
};

export const INITIAL_DEBTORS: DebtorItem[] = [
  {
    id: 'DEB-101',
    clientEntity: 'LABDHI IMPEX',
    invoiceRef: 'LL/2026-27/0412',
    invoiceDate: '2026-03-15',
    dueDate: '2026-04-15', // Overdue
    amount: 1485000,
    status: 'Overdue',
    contactEmail: 'accounts@labdhiimpex.com',
    contactPerson: 'Bhavin Shah',
    notes: 'Imported steel sheet coils & structural fittings.',
  },
  {
    id: 'DEB-102',
    clientEntity: 'NG INDUSTRIES',
    invoiceRef: 'LL/2026-27/0428',
    invoiceDate: '2026-04-10',
    dueDate: '2026-05-20', // Overdue
    amount: 860000,
    status: 'Overdue',
    contactEmail: 'purchase@ngindustries.co.in',
    contactPerson: 'Nitin Gupta',
    notes: 'Industrial enclosure brackets & metal stampings.',
  },
  {
    id: 'DEB-103',
    clientEntity: 'SAWARIYA INDUSTRIES',
    invoiceRef: 'LL/2026-27/0450',
    invoiceDate: '2026-05-15',
    dueDate: '2026-06-28', // Overdue
    amount: 1120000,
    status: 'Overdue',
    contactEmail: 'billing@sawariyaind.com',
    contactPerson: 'Sawariya Agarwal',
    notes: 'Heavy machinery base plates & mounting frames.',
  },
  {
    id: 'DEB-104',
    clientEntity: 'EROS ELEVATORS & ESCALATORS PVT. LTD.',
    invoiceRef: 'LL/2026-27/0475',
    invoiceDate: '2026-07-05',
    dueDate: '2026-08-08', // Due in 5-Day window (up to 10 Aug)
    amount: 2350000,
    status: 'Pending',
    contactEmail: 'accounts@eroselevators.com',
    contactPerson: 'Ramanathan Iyer',
    notes: 'Stainless steel elevator car frame assemblies.',
  },
  {
    id: 'DEB-105',
    clientEntity: 'JOHNSON LIFTS PRIVATE LIMITED (NAGPUR)',
    invoiceRef: 'LL/2026-27/0488',
    invoiceDate: '2026-07-10',
    dueDate: '2026-08-10', // Due in 5-Day window (up to 10 Aug)
    amount: 3150000,
    status: 'Pending',
    contactEmail: 'nagpur.ap@johnsonlifts.com',
    contactPerson: 'K. Ramanathan',
    notes: 'Elevator guide rail brackets & cab fabrications.',
  },
  {
    id: 'DEB-106',
    clientEntity: 'IFB INDUSTRIES LTD.',
    invoiceRef: 'LL/2026-27/0492',
    invoiceDate: '2026-06-15',
    dueDate: '2026-07-18', // Overdue
    amount: 1920000,
    status: 'Overdue',
    contactEmail: 'ap@ifbindustries.com',
    contactPerson: 'Sandeep Varma',
    notes: 'Appliance outer cabinet pressings & motor brackets.',
  },
  {
    id: 'DEB-107',
    clientEntity: 'SHREE MAHADEV STEEL',
    invoiceRef: 'LL/2026-27/0504',
    invoiceDate: '2026-07-12',
    dueDate: '2026-08-14', // Due in 10-Day window (up to 15 Aug)
    amount: 1650000,
    status: 'Pending',
    contactEmail: 'sales@shreemahadevsteel.in',
    contactPerson: 'Mahadev Patel',
    notes: 'Structural steel angles & custom sheared plates.',
  },
  {
    id: 'DEB-108',
    clientEntity: 'FABTECH TECHNOLOGIES CLEANROOMS LIMITED',
    invoiceRef: 'LL/2026-27/0515',
    invoiceDate: '2026-07-18',
    dueDate: '2026-08-18', // Due in 15-Day window (up to 20 Aug)
    amount: 2780000,
    status: 'Pending',
    contactEmail: 'finance@fabtech.in',
    contactPerson: 'Sameer Joshi',
    notes: 'Pharma cleanroom modular wall panels & ceiling grids.',
  },
  {
    id: 'DEB-109',
    clientEntity: 'AGI GREENPAC LIMITED',
    invoiceRef: 'LL/2026-27/0522',
    invoiceDate: '2026-07-20',
    dueDate: '2026-08-20', // Due in 15-Day window (up to 20 Aug)
    amount: 2100000,
    status: 'Pending',
    contactEmail: 'ap@agigreenpac.com',
    contactPerson: 'Vikram Solanki',
    notes: 'Glass bottle conveyor frame supports.',
  },
  {
    id: 'DEB-110',
    clientEntity: 'SAVERA PRECISION ENGINEERING PRIVATE LIMITED',
    invoiceRef: 'LL/2026-27/0530',
    invoiceDate: '2026-07-25',
    dueDate: '2026-08-28', // Due in Monthly window (up to 04 Sep)
    amount: 1750000,
    status: 'Pending',
    contactEmail: 'accounts@saveraprecision.com',
    contactPerson: 'Rajesh Savera',
    notes: 'High precision CNC machined flanges & shafts.',
  },
  {
    id: 'DEB-111',
    clientEntity: 'WESTERN REFRIGERATION PVT. LTD',
    invoiceRef: 'LL/2026-27/0419',
    invoiceDate: '2026-04-05',
    dueDate: '2026-05-10', // Overdue
    amount: 1840000,
    status: 'Overdue',
    contactEmail: 'vendorpay@westernref.com',
    contactPerson: 'Anil Mehta',
    notes: 'Commercial condenser coil mounting frames.',
  },
  {
    id: 'DEB-112',
    clientEntity: 'FABSAFE TECHNOLOGIES PRIVATE LIMITED',
    invoiceRef: 'LL/2026-27/0460',
    invoiceDate: '2026-04-20',
    dueDate: '2026-05-25',
    amount: 980000,
    status: 'Paid',
    paymentDate: '2026-05-29',
    arnChallanRef: 'NEFT/AXISN2605299011',
    contactEmail: 'finance@fabsafetech.com',
    contactPerson: 'Deepak Chawla',
    notes: 'Fire safety equipment enclosure boxes.',
  },
];

export const INITIAL_CREDITORS: CreditorItem[] = [
  {
    id: 'CRE-201',
    vendorEntity: 'TATA STEEL PROCESSING AND DISTRIBUTION LIMITED',
    invoiceRef: 'TSPDL/2026-27/0881',
    dueDate: '2026-08-08', // Due in 5-Day window (up to 10 Aug)
    amount: 3450000,
    narration: 'HR Steel Sheet Coils 2.5mm & CR Strips Supply',
    status: 'Pending',
    notes: 'Primary raw material supply for chassis stamping.',
  },
  {
    id: 'CRE-202',
    vendorEntity: 'TRUMPF INDIA PRIVATE LIMITED',
    invoiceRef: 'TRUMPF/IN/9924',
    dueDate: '2026-08-12', // Due in 10-Day window (up to 15 Aug)
    amount: 680000,
    narration: 'Fiber Laser Cutting Optics & Maintenance Spares',
    status: 'Pending',
    notes: 'Annual maintenance and high precision nozzle spares.',
  },
  {
    id: 'CRE-203',
    vendorEntity: 'MAHARASHTRA STATE ELECTRICITY DISTRIBUTION CO LTD',
    invoiceRef: 'MSEDCL/PUNE/0726',
    dueDate: '2026-08-10', // Due in 5-Day window (up to 10 Aug)
    amount: 520000,
    narration: 'HT Industrial Power Electricity Bill (Factory Unit 1)',
    status: 'Pending',
    notes: 'Monthly power consumption for heavy press machinery.',
  },
  {
    id: 'CRE-204',
    vendorEntity: 'VRL LOGISTICS LIMITED',
    invoiceRef: 'VRL/LR/2026/4410',
    dueDate: '2026-08-18', // Due in 15-Day window (up to 20 Aug)
    amount: 310000,
    narration: 'Interstate Heavy Freight & Machinery Logistics',
    status: 'Pending',
    notes: 'Transport charges for dispatched elevator components.',
  },
  {
    id: 'CRE-205',
    vendorEntity: 'SCHUMACHER PACKAGING INDIA PVT LTD',
    invoiceRef: 'SPI/INV/2026/1102',
    dueDate: '2026-05-28', // Overdue
    amount: 240000,
    narration: 'Heavy Duty Corrugated Wooden & Paper Packaging',
    status: 'Overdue',
    notes: 'Custom export-grade packaging crates.',
  },
];

export const INITIAL_EMIS: EmiItem[] = [
  {
    id: 'EMI-301',
    loanName: 'MG Cyberster EV - 910000000130651',
    vehicleModel: 'MG Cyberster EV Convertible (MH 12 LL 7007)',
    lenderBank: 'ICICI Bank Auto Loan Div',
    accountNo: '910000000130651',
    totalLoanValue: 7200000,
    remainingBalance: 5120000,
    monthlyEmi: 145000,
    dueDayOfMonth: 1,
    nextDueDate: '2026-08-01',
    status: 'Upcoming',
    lastPaymentDate: '2026-07-01',
    lastPaymentRef: 'ACH/ICICI/JUL01/9921',
  },
  {
    id: 'EMI-302',
    loanName: 'Mercedes-Benz Car Loan',
    vehicleModel: 'Mercedes-Benz GLE 450 d 4MATIC (MH 12 LL 1001)',
    lenderBank: 'Saraswat Co-operative Bank Ltd',
    accountNo: 'SARASWAT-AL-882041',
    totalLoanValue: 12500000,
    remainingBalance: 8750000,
    monthlyEmi: 225000,
    dueDayOfMonth: 5,
    nextDueDate: '2026-08-05',
    status: 'Upcoming',
    lastPaymentDate: '2026-07-05',
    lastPaymentRef: 'RTGS/SARASWAT/JUL05/3301',
  },
  {
    id: 'EMI-300',
    loanName: 'DEUTSCHE BANK LOAN - 300041984370019',
    vehicleModel: 'Machinery & Working Capital Facility',
    lenderBank: 'Deutsche Bank AG',
    accountNo: '300041984370019',
    totalLoanValue: 18000000,
    remainingBalance: 12500000,
    monthlyEmi: 310000,
    dueDayOfMonth: 10,
    nextDueDate: '2026-08-10',
    status: 'Upcoming',
    lastPaymentDate: '2026-07-10',
    lastPaymentRef: 'NEFT/DBAG/JUL10/4482',
  },
  {
    id: 'EMI-303',
    loanName: 'SIDBI LOAN - 1412070',
    vehicleModel: 'Industrial Equipment & Infrastructure Facility',
    lenderBank: 'SIDBI Bank',
    accountNo: '1412070',
    totalLoanValue: 25000000,
    remainingBalance: 18200000,
    monthlyEmi: 420000,
    dueDayOfMonth: 15,
    nextDueDate: '2026-08-15',
    status: 'Upcoming',
    lastPaymentDate: '2026-07-15',
    lastPaymentRef: 'NEFT/SIDBI/JUL15/1092',
  },
];

export const INITIAL_COMPLIANCE: ComplianceItem[] = [];

export const INITIAL_CALENDAR_LOGS: CalendarLogItem[] = [];

export const INITIAL_EMAIL_LOGS: EmailLogItem[] = [];

export const INITIAL_GST_PAYABLE: GstPayableState = {
  mumbai: { payable: 425000, receivable: 150000 },
  chennai: { payable: 280000, receivable: 95000 },
  goa: { payable: 145000, receivable: 40000 },
  lastUpdated: new Date().toISOString().split('T')[0],
};
