export type ItemStatus = 'Pending' | 'Overdue' | 'Paid' | 'Filed' | 'Upcoming';

export interface DebtorItem {
  id: string;
  clientEntity: string;
  invoiceRef: string;
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  amount: number; // in INR
  status: ItemStatus;
  paymentDate?: string;
  arnChallanRef?: string;
  contactEmail?: string;
  contactPerson?: string;
  notes?: string;
}

export interface CreditorItem {
  id: string;
  vendorEntity: string;
  invoiceRef: string;
  dueDate: string; // YYYY-MM-DD
  amount: number;
  category: 'Raw Material' | 'Machinery & Spares' | 'Logistics' | 'Utilities' | 'Services' | 'Packaging';
  status: ItemStatus;
  paymentDate?: string;
  arnChallanRef?: string;
  notes?: string;
}

export interface EmiItem {
  id: string;
  loanName: string;
  vehicleModel: string;
  lenderBank: string;
  accountNo: string;
  totalLoanValue: number;
  remainingBalance: number;
  monthlyEmi: number;
  dueDayOfMonth: number;
  nextDueDate: string; // YYYY-MM-DD
  status: ItemStatus;
  lastPaymentDate?: string;
  lastPaymentRef?: string;
}

export interface ComplianceItem {
  id: string;
  title: 'GST GSTR-1' | 'GST GSTR-3B' | 'TDS Deposit' | 'Advance Tax' | 'DIR-3 KYC' | 'LLP Form 8' | 'LLP Form 11';
  period: string;
  dueDate: string; // YYYY-MM-DD
  governingAuthority: 'GSTN Portal' | 'Income Tax Dept' | 'MCA V3 Portal';
  status: ItemStatus;
  filingDate?: string;
  arnChallanRef?: string;
  estimatedAmount?: number;
  responsibility?: string;
}

export interface CalendarLogItem {
  id: string;
  timestamp: string;
  eventTitle: string;
  eventDate: string;
  targetTab: 'EMIs' | 'LLP_Compliance' | 'Debtors' | 'Creditors';
  itemRefId: string;
  googleEventId: string;
  syncStatus: 'Synced' | 'Error' | 'Pending';
  syncId: string;
}

export interface EmailLogItem {
  id: string;
  timestamp: string;
  recipient: string;
  subject: string;
  itemRef: string;
  triggerType: 'Due Today' | 'Upcoming (-3d)' | 'Overdue' | 'Custom Interval';
  syncId: string;
  status: 'Sent' | 'Failed';
}

export interface AppSettings {
  creditTermsDays: number;
  reminderIntervals: number[];
  notificationEmail: string;
  autoSyncCalendar: boolean;
  autoEmailReminders: boolean;
  companyName: string;
  currencySymbol: string;
}

export type CashFlowHorizon = '5-Day' | '15-Day' | 'Monthly';

export interface HorizonCashFlowDetails {
  daysWindow: number;
  horizonLabel: string;
  dateRangeText: string;
  inflows: DebtorItem[];
  outflows: {
    creditors: CreditorItem[];
    emis: EmiItem[];
    compliance: ComplianceItem[];
  };
  totalInflow: number;
  totalOutflow: number;
  netCashPosition: number;
}

export interface CashFlowSummary extends HorizonCashFlowDetails {
  // Legacy compatibility fields
  next5DaysInflows: DebtorItem[];
  next5DaysOutflows: {
    creditors: CreditorItem[];
    emis: EmiItem[];
    compliance: ComplianceItem[];
  };
  totalInflow5Days: number;
  totalOutflow5Days: number;
  net5DayCashPosition: number;
  highRiskOverdueDebtors: DebtorItem[];

  // Multi-horizon comparisons
  horizon5Day: HorizonCashFlowDetails;
  horizon15Day: HorizonCashFlowDetails;
  horizonMonthly: HorizonCashFlowDetails;
}

export interface ClientOverdueGroup {
  clientEntity: string;
  totalOutstanding: number;
  invoicesCount: number;
  maxDaysOverdue: number;
  invoices: DebtorItem[];
  contactEmail?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: string;
  suggestions?: string[];
}
