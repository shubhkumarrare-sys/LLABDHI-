import {
  DebtorItem,
  CreditorItem,
  EmiItem,
  ComplianceItem,
  CashFlowSummary,
  HorizonCashFlowDetails,
  ClientOverdueGroup,
} from '../types';

export function getTodayStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Baseline reference date: Today's Date
export const getBaseDate = (): Date => {
  return new Date();
};

export function calculateDaysDiff(targetDateStr: string, baseDateStr: string = getTodayStr()): number {
  if (!targetDateStr) return 0;
  const target = new Date(targetDateStr + 'T00:00:00');
  const base = new Date(baseDateStr + 'T00:00:00');
  const diffTime = target.getTime() - base.getTime();
  return Math.round(diffTime / (1000 * 3600 * 24));
}

export function formatDateRangeText(daysWindow: number, baseDateStr: string = getTodayStr()): string {
  const base = new Date(baseDateStr + 'T00:00:00');
  const endDate = new Date(base.getTime() + daysWindow * 24 * 60 * 60 * 1000);
  
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: '2-digit', year: 'numeric' };
  return `${base.toLocaleDateString('en-US', options)} – ${endDate.toLocaleDateString('en-US', options)}`;
}

export function calculateCashFlowForHorizonDetails(
  debtors: DebtorItem[],
  creditors: CreditorItem[],
  emis: EmiItem[],
  compliance: ComplianceItem[],
  daysWindow: number,
  horizonLabel: string,
  baseDateStr: string = getTodayStr()
): HorizonCashFlowDetails {
  const inflows = debtors.filter((d) => {
    if (d.status === 'Paid') return false;
    const diff = calculateDaysDiff(d.dueDate, baseDateStr);
    return diff >= 0 && diff <= daysWindow;
  });

  const nextCreditors = creditors.filter((c) => {
    if (c.status === 'Paid') return false;
    const diff = calculateDaysDiff(c.dueDate, baseDateStr);
    return diff >= 0 && diff <= daysWindow;
  });

  const nextEmis = emis.filter((e) => {
    if (e.status === 'Paid') return false;
    const diff = calculateDaysDiff(e.nextDueDate, baseDateStr);
    return diff >= 0 && diff <= daysWindow;
  });

  const nextCompliance = compliance.filter((comp) => {
    if (comp.status === 'Filed' || comp.status === 'Paid') return false;
    const diff = calculateDaysDiff(comp.dueDate, baseDateStr);
    return diff >= 0 && diff <= daysWindow;
  });

  const totalInflow = inflows.reduce((sum, item) => sum + item.amount, 0);

  const totalCreditorOutflow = nextCreditors.reduce((sum, item) => sum + item.amount, 0);
  const totalEmiOutflow = nextEmis.reduce((sum, item) => sum + item.monthlyEmi, 0);
  const totalCompOutflow = nextCompliance.reduce((sum, item) => sum + (item.estimatedAmount || 0), 0);

  const totalOutflow = totalCreditorOutflow + totalEmiOutflow + totalCompOutflow;
  const netCashPosition = totalInflow - totalOutflow;

  return {
    daysWindow,
    horizonLabel,
    dateRangeText: formatDateRangeText(daysWindow, baseDateStr),
    inflows,
    outflows: {
      creditors: nextCreditors,
      emis: nextEmis,
      compliance: nextCompliance,
    },
    totalInflow,
    totalOutflow,
    netCashPosition,
  };
}

export function calculate5DayCashFlow(
  debtors: DebtorItem[],
  creditors: CreditorItem[],
  emis: EmiItem[],
  compliance: ComplianceItem[],
  baseDateStr: string = getTodayStr()
): CashFlowSummary {
  const horizon5Day = calculateCashFlowForHorizonDetails(debtors, creditors, emis, compliance, 5, '5-Day', baseDateStr);
  const horizon15Day = calculateCashFlowForHorizonDetails(debtors, creditors, emis, compliance, 15, '15-Day', baseDateStr);
  const horizonMonthly = calculateCashFlowForHorizonDetails(debtors, creditors, emis, compliance, 30, 'Monthly (30-Day)', baseDateStr);

  // High risk overdue debtors: overdue by >= 14 days OR amount >= 1,50,000
  const highRiskOverdueDebtors = debtors.filter((d) => {
    if (d.status !== 'Overdue') return false;
    const daysOverdue = Math.abs(calculateDaysDiff(d.dueDate, baseDateStr));
    return daysOverdue >= 14 || d.amount >= 1500000;
  });

  return {
    ...horizon5Day,
    next5DaysInflows: horizon5Day.inflows,
    next5DaysOutflows: horizon5Day.outflows,
    totalInflow5Days: horizon5Day.totalInflow,
    totalOutflow5Days: horizon5Day.totalOutflow,
    net5DayCashPosition: horizon5Day.netCashPosition,
    highRiskOverdueDebtors,
    horizon5Day,
    horizon15Day,
    horizonMonthly,
  };
}

export function groupOverdueDebtorsByClient(
  debtors: DebtorItem[],
  baseDateStr: string = getTodayStr()
): ClientOverdueGroup[] {
  const overdueItems = debtors.filter((d) => d.status === 'Overdue');
  const groupMap = new Map<string, ClientOverdueGroup>();

  for (const item of overdueItems) {
    const daysOverdue = Math.abs(calculateDaysDiff(item.dueDate, baseDateStr));
    const existing = groupMap.get(item.clientEntity);

    if (existing) {
      existing.totalOutstanding += item.amount;
      existing.invoicesCount += 1;
      existing.maxDaysOverdue = Math.max(existing.maxDaysOverdue, daysOverdue);
      existing.invoices.push(item);
    } else {
      groupMap.set(item.clientEntity, {
        clientEntity: item.clientEntity,
        totalOutstanding: item.amount,
        invoicesCount: 1,
        maxDaysOverdue: daysOverdue,
        invoices: [item],
        contactEmail: item.contactEmail,
      });
    }
  }

  return Array.from(groupMap.values()).sort((a, b) => b.totalOutstanding - a.totalOutstanding);
}

export function formatINR(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN');
}
