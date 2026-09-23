import { EmiItem, ComplianceItem } from '../types';

export interface IcsExportOptions {
  includeEmis?: boolean;
  includeCompliance?: boolean;
  onlyUpcomingAndPending?: boolean; // if true, exclude Paid and Filed
  addReminders?: boolean; // add VALARM reminders (e.g., 1 day and 3 days before)
  calendarTitle?: string;
}

/**
 * Escape text for iCalendar (RFC 5545)
 */
export function escapeIcsText(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Format YYYY-MM-DD into RFC 5545 DATE value for all-day events:
 * DTSTART;VALUE=DATE:YYYYMMDD
 * DTEND;VALUE=DATE:YYYYMMDD (start + 1 day)
 */
export function formatDateToIcsRange(dateStr: string): { start: string; end: string } | null {
  if (!dateStr) return null;
  const clean = dateStr.trim().split('T')[0];
  const parts = clean.split('-');
  if (parts.length !== 3) return null;

  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);

  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;

  const startDate = new Date(y, m, d);
  const nextDate = new Date(y, m, d + 1);

  const toYmd = (dt: Date) => {
    const year = dt.getFullYear();
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };

  return {
    start: toYmd(startDate),
    end: toYmd(nextDate),
  };
}

/**
 * Fold lines longer than 75 bytes as per RFC 5545 section 3.1
 */
function foldIcsLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let remaining = line;
  let first = true;

  while (remaining.length > 0) {
    const chunkSize = first ? 75 : 74;
    first = false;
    chunks.push(remaining.substring(0, chunkSize));
    remaining = remaining.substring(chunkSize);
  }

  return chunks.join('\r\n ');
}

/**
 * Generate a complete .ics calendar string for upcoming EMIs and Compliance items
 */
export function generateIcsCalendar(
  emis: EmiItem[],
  compliance: ComplianceItem[],
  options: IcsExportOptions = {}
): string {
  const {
    includeEmis = true,
    includeCompliance = true,
    onlyUpcomingAndPending = true,
    addReminders = true,
    calendarTitle = 'Llabdhi EMI & Compliance Calendar',
  } = options;

  const now = new Date();
  const dtstamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Llabdhi Manufacturing LLP//LLABDHI OPS NODE//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calendarTitle}`,
    'X-WR-CALDESC:Automated schedule of upcoming loan EMIs and statutory compliance deadlines from Llabdhi Ops Node',
    'X-WR-TIMEZONE:Asia/Kolkata',
  ];

  // 1. Process EMIs
  if (includeEmis && Array.isArray(emis)) {
    emis.forEach((emi) => {
      if (onlyUpcomingAndPending && emi.status === 'Paid') {
        return;
      }

      const dateRange = formatDateToIcsRange(emi.nextDueDate);
      if (!dateRange) return;

      const uid = `llabdhi-emi-${emi.id}-${dateRange.start}@llabdhigroup.in`;
      const amountStr = emi.monthlyEmi ? `₹${Number(emi.monthlyEmi).toLocaleString('en-IN')}` : '₹0';
      const totalStr = emi.totalLoanValue ? `₹${Number(emi.totalLoanValue).toLocaleString('en-IN')}` : '₹0';
      const balanceStr = emi.remainingBalance ? `₹${Number(emi.remainingBalance).toLocaleString('en-IN')}` : '₹0';

      const summary = `[LLABDHI EMI] ${emi.loanName} (${amountStr})`;
      const descLines = [
        `Loan: ${emi.loanName}`,
        `Monthly EMI: ${amountStr}`,
        `Next Due Date: ${emi.nextDueDate}`,
        `Lender / Bank: ${emi.lenderBank || 'N/A'}`,
        `Asset / Model: ${emi.vehicleModel || 'N/A'}`,
        `Account No: ${emi.accountNo || 'N/A'}`,
        `Remaining Balance: ${balanceStr} of ${totalStr}`,
        `Status: ${emi.status}`,
        `Responsible / Invitees: narendrabothra@llabdhigroup.in, ea@llabdhigroup.in`,
        `System: LLABDHI OPS NODE`,
      ];

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${dtstamp}`);
      lines.push(`DTSTART;VALUE=DATE:${dateRange.start}`);
      lines.push(`DTEND;VALUE=DATE:${dateRange.end}`);
      lines.push(`SUMMARY:${escapeIcsText(summary)}`);
      lines.push(`DESCRIPTION:${escapeIcsText(descLines.join('\n'))}`);
      lines.push('CATEGORIES:EMI,FINANCE,LOANS,LLABDHI');
      lines.push('STATUS:CONFIRMED');
      lines.push('TRANSP:TRANSPARENT');

      if (addReminders) {
        // 1 day before reminder
        lines.push('BEGIN:VALARM');
        lines.push('ACTION:DISPLAY');
        lines.push(`DESCRIPTION:${escapeIcsText(`EMI Due Tomorrow: ${emi.loanName} (${amountStr})`)}`);
        lines.push('TRIGGER:-P1D');
        lines.push('END:VALARM');

        // 3 days before reminder
        lines.push('BEGIN:VALARM');
        lines.push('ACTION:DISPLAY');
        lines.push(`DESCRIPTION:${escapeIcsText(`Upcoming EMI in 3 Days: ${emi.loanName} (${amountStr})`)}`);
        lines.push('TRIGGER:-P3D');
        lines.push('END:VALARM');
      }

      lines.push('END:VEVENT');
    });
  }

  // 2. Process Compliance
  if (includeCompliance && Array.isArray(compliance)) {
    compliance.forEach((comp) => {
      if (onlyUpcomingAndPending && (comp.status === 'Filed' || comp.status === 'Paid')) {
        return;
      }

      const dateRange = formatDateToIcsRange(comp.dueDate);
      if (!dateRange) return;

      const uid = `llabdhi-comp-${comp.id}-${dateRange.start}@llabdhigroup.in`;
      const estStr = comp.estimatedAmount ? `₹${Number(comp.estimatedAmount).toLocaleString('en-IN')}` : 'Statutory';

      const summary = `[LLABDHI COMPLIANCE] ${comp.title} (${comp.governingAuthority})`;
      const descLines = [
        `Statutory Compliance: ${comp.title}`,
        `Governing Authority: ${comp.governingAuthority}`,
        `Filing Period: ${comp.period || 'Current Cycle'}`,
        `Statutory Due Date: ${comp.dueDate}`,
        `Estimated Liability: ${estStr}`,
        `Responsibility: ${comp.responsibility || 'Finance & Compliance Dept'}`,
        `Status: ${comp.status}`,
        comp.arnChallanRef ? `Challan / ARN Ref: ${comp.arnChallanRef}` : '',
        `Responsible / Invitees: narendrabothra@llabdhigroup.in, ea@llabdhigroup.in`,
        `System: LLABDHI OPS NODE`,
      ].filter(Boolean);

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${dtstamp}`);
      lines.push(`DTSTART;VALUE=DATE:${dateRange.start}`);
      lines.push(`DTEND;VALUE=DATE:${dateRange.end}`);
      lines.push(`SUMMARY:${escapeIcsText(summary)}`);
      lines.push(`DESCRIPTION:${escapeIcsText(descLines.join('\n'))}`);
      lines.push('CATEGORIES:COMPLIANCE,TAX,LEGAL,LLP,LLABDHI');
      lines.push('STATUS:CONFIRMED');
      lines.push('TRANSP:TRANSPARENT');

      if (addReminders) {
        // 2 days before reminder
        lines.push('BEGIN:VALARM');
        lines.push('ACTION:DISPLAY');
        lines.push(`DESCRIPTION:${escapeIcsText(`Statutory Deadline in 2 Days: ${comp.title}`)}`);
        lines.push('TRIGGER:-P2D');
        lines.push('END:VALARM');

        // 5 days before reminder
        lines.push('BEGIN:VALARM');
        lines.push('ACTION:DISPLAY');
        lines.push(`DESCRIPTION:${escapeIcsText(`Upcoming Statutory Compliance in 5 Days: ${comp.title}`)}`);
        lines.push('TRIGGER:-P5D');
        lines.push('END:VALARM');
      }

      lines.push('END:VEVENT');
    });
  }

  lines.push('END:VCALENDAR');

  return lines.map(foldIcsLine).join('\r\n') + '\r\n';
}

/**
 * Trigger direct file download in user's browser
 */
export function downloadIcsFile(
  icsContent: string,
  filename: string = 'llabdhi-upcoming-emis-and-compliance.ics'
): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
