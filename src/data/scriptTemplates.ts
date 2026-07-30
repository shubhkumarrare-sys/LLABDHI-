export const GOOGLE_CALENDAR_SYNC_SCRIPT = `/**
 * Google Apps Script for LLABDHI OPS NODE
 * Auto-Syncs EMI Due Dates & LLP Compliance Statutory Deadlines to Google Calendar
 * 
 * Target Sheet: LLABDHI OPS NODE
 * Sheets Read: 'EMIs', 'LLP_Compliance'
 * Sheet Written: 'Calendar Logs'
 */

function syncLlabdhiToGoogleCalendar() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var calendar = CalendarApp.getDefaultCalendar();
  var today = new Date();
  var sevenDaysLater = new Date();
  sevenDaysLater.setDate(today.getDate() + 7);
  
  var calendarLogsSheet = ss.getSheetByName('Calendar Logs');
  if (!calendarLogsSheet) {
    calendarLogsSheet = ss.insertSheet('Calendar Logs');
    calendarLogsSheet.appendRow(['Log ID', 'Timestamp', 'Event Title', 'Event Date', 'Target Tab', 'Item Ref ID', 'Google Event ID', 'Sync Status', 'Sync ID']);
  }
  
  var syncId = 'SYNC-' + Utilities.formatDate(new Date(), 'GMT+5:30', 'yyyyMMdd-HHmmss');
  
  // 1. Process EMIs
  var emiSheet = ss.getSheetByName('EMIs');
  if (emiSheet) {
    var emiData = emiSheet.getDataRange().getValues();
    for (var i = 1; i < emiData.length; i++) {
      var row = emiData[i];
      var itemId = row[0]; // ID
      var loanName = row[1]; // Loan Name
      var amount = row[6]; // Monthly EMI
      var dueDate = new Date(row[8]); // Next Due Date
      var status = row[9]; // Status
      var syncedEventId = row[10]; // Synced Calendar Event ID (if stored)
      
      if (dueDate >= today && dueDate <= sevenDaysLater && !syncedEventId && status !== 'Paid') {
        var title = '[LLABDHI EMI] ' + loanName + ' (₹' + Number(amount).toLocaleString('en-IN') + ')';
        var description = 'Loan EMI Due Date from LLABDHI OPS NODE\\nLoan: ' + loanName + '\\nAmount: ₹' + amount + '\\nStatus: ' + status;
        
        var event = calendar.createAllDayEvent(title, dueDate, { description: description });
        var eventId = event.getId();
        
        // Write to Calendar Logs
        var logId = 'CAL-' + Math.floor(1000 + Math.random() * 9000);
        var timestamp = Utilities.formatDate(new Date(), 'GMT+5:30', 'yyyy-MM-dd HH:mm:ss');
        var eventDateStr = Utilities.formatDate(dueDate, 'GMT+5:30', 'yyyy-MM-dd');
        calendarLogsSheet.appendRow([logId, timestamp, title, eventDateStr, 'EMIs', itemId, eventId, 'Synced', syncId]);
        
        // Update EMI sheet with event ID
        emiSheet.getRange(i + 1, 11).setValue(eventId);
      }
    }
  }
  
  // 2. Process LLP Compliance Deadlines
  var compSheet = ss.getSheetByName('LLP_Compliance');
  if (compSheet) {
    var compData = compSheet.getDataRange().getValues();
    for (var j = 1; j < compData.length; j++) {
      var cRow = compData[j];
      var cItemId = cRow[0];
      var cTitle = cRow[1];
      var cAuthority = cRow[3];
      var cDueDate = new Date(cRow[4]);
      var cStatus = cRow[5];
      var cSyncedEventId = cRow[8];
      
      if (cDueDate >= today && cDueDate <= sevenDaysLater && !cSyncedEventId && cStatus !== 'Filed' && cStatus !== 'Paid') {
        var compEventTitle = '[LLABDHI COMPLIANCE] ' + cTitle + ' Deadline (' + cAuthority + ')';
        var compDesc = 'Statutory Compliance Deadline from LLABDHI OPS NODE\\nItem: ' + cTitle + '\\nAuthority: ' + cAuthority + '\\nStatus: ' + cStatus;
        
        var compEvent = calendar.createAllDayEvent(compEventTitle, cDueDate, { description: compDesc });
        var compEventId = compEvent.getId();
        
        var cLogId = 'CAL-' + Math.floor(1000 + Math.random() * 9000);
        var cTimestamp = Utilities.formatDate(new Date(), 'GMT+5:30', 'yyyy-MM-dd HH:mm:ss');
        var cEventDateStr = Utilities.formatDate(cDueDate, 'GMT+5:30', 'yyyy-MM-dd');
        calendarLogsSheet.appendRow([cLogId, cTimestamp, compEventTitle, cEventDateStr, 'LLP_Compliance', cItemId, compEventId, 'Synced', syncId]);
        
        compSheet.getRange(j + 1, 9).setValue(compEventId);
      }
    }
  }
  
  Logger.log('Google Calendar Sync Completed. Sync ID: ' + syncId);
}
`;

export const AUTOMATED_EMAIL_REMINDER_SCRIPT = `/**
 * Google Apps Script for LLABDHI OPS NODE
 * Automated Email Reminder System based on Settings Schedule [-7, -5, -3, -2, -1, 0, 1, 2, 3, 7]
 * 
 * Target Email: shubhkumarrare@gmail.com
 * Sheets Read: 'Settings', 'Debtors', 'Creditors', 'EMIs', 'LLP_Compliance'
 * Sheet Written: 'Email Logs'
 */

function runAutomatedEmailReminders() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Read Settings
  var settingsSheet = ss.getSheetByName('Settings');
  var recipient = 'shubhkumarrare@gmail.com';
  var reminderIntervals = [-7, -5, -3, -2, -1, 0, 1, 2, 3, 7];
  
  if (settingsSheet) {
    var emailVal = settingsSheet.getRange('B4').getValue();
    if (emailVal) recipient = emailVal;
  }
  
  var emailLogsSheet = ss.getSheetByName('Email Logs');
  if (!emailLogsSheet) {
    emailLogsSheet = ss.insertSheet('Email Logs');
    emailLogsSheet.appendRow(['Log ID', 'Timestamp', 'Recipient', 'Subject', 'Item Ref', 'Trigger Type', 'Sync ID', 'Status']);
  }
  
  var today = new Date();
  today.setHours(0,0,0,0);
  
  var dueTodayItems = [];
  var upcomingItems = [];
  var overdueItems = [];
  
  // Helper to calculate days diff
  function getDaysDiff(targetDate) {
    var t = new Date(targetDate);
    t.setHours(0,0,0,0);
    return Math.round((t.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  // 1. Scan Debtors
  var debtorsSheet = ss.getSheetByName('Debtors');
  if (debtorsSheet) {
    var dData = debtorsSheet.getDataRange().getValues();
    for (var i = 1; i < dData.length; i++) {
      var status = dData[i][6];
      if (status !== 'Paid') {
        var diff = getDaysDiff(dData[i][4]);
        var itemDesc = 'Debtor: ' + dData[i][1] + ' (Inv #' + dData[i][2] + ' - ₹' + Number(dData[i][5]).toLocaleString('en-IN') + ')';
        
        if (diff === 0) dueTodayItems.push(itemDesc);
        else if (diff > 0 && reminderIntervals.indexOf(-diff) !== -1) upcomingItems.push(itemDesc + ' [Due in ' + diff + ' days]');
        else if (diff < 0 && reminderIntervals.indexOf(-diff) !== -1) overdueItems.push(itemDesc + ' [OVERDUE by ' + Math.abs(diff) + ' days]');
      }
    }
  }
  
  // 2. Scan Creditors & EMIs & Compliance
  var emiSheet = ss.getSheetByName('EMIs');
  if (emiSheet) {
    var eData = emiSheet.getDataRange().getValues();
    for (var k = 1; k < eData.length; k++) {
      if (eData[k][9] !== 'Paid') {
        var eDiff = getDaysDiff(eData[k][8]);
        var eDesc = 'EMI: ' + eData[k][1] + ' (₹' + Number(eData[k][6]).toLocaleString('en-IN') + ')';
        if (eDiff === 0) dueTodayItems.push(eDesc);
        else if (eDiff > 0 && reminderIntervals.indexOf(-eDiff) !== -1) upcomingItems.push(eDesc + ' [Due in ' + eDiff + ' days]');
        else if (eDiff < 0) overdueItems.push(eDesc + ' [OVERDUE by ' + Math.abs(eDiff) + ' days]');
      }
    }
  }
  
  var compSheet = ss.getSheetByName('LLP_Compliance');
  if (compSheet) {
    var cData = compSheet.getDataRange().getValues();
    for (var m = 1; m < cData.length; m++) {
      if (cData[m][5] !== 'Filed' && cData[m][5] !== 'Paid') {
        var cDiff = getDaysDiff(cData[m][4]);
        var cDesc = 'Compliance: ' + cData[m][1] + ' (' + cData[m][3] + ')';
        if (cDiff === 0) dueTodayItems.push(cDesc);
        else if (cDiff > 0 && reminderIntervals.indexOf(-cDiff) !== -1) upcomingItems.push(cDesc + ' [Due in ' + cDiff + ' days]');
        else if (cDiff < 0) overdueItems.push(cDesc + ' [OVERDUE by ' + Math.abs(cDiff) + ' days]');
      }
    }
  }
  
  // Send email if items match trigger rules
  if (dueTodayItems.length > 0 || upcomingItems.length > 0 || overdueItems.length > 0) {
    var subject = '[LLABDHI OPS NODE] Financial & Compliance Alert (' + Utilities.formatDate(new Date(), 'GMT+5:30', 'dd-MMM-yyyy') + ')';
    var body = 'Dear Llabdhi Management,\\n\\n' +
               'Here is your automated daily financial and compliance operational report:\\n\\n';
               
    if (dueTodayItems.length > 0) {
      body += '🔴 DUE TODAY (' + dueTodayItems.length + '):\\n- ' + dueTodayItems.join('\\n- ') + '\\n\\n';
    }
    if (upcomingItems.length > 0) {
      body += '🟡 UPCOMING LIABILITIES / INFLOWS (' + upcomingItems.length + '):\\n- ' + upcomingItems.join('\\n- ') + '\\n\\n';
    }
    if (overdueItems.length > 0) {
      body += '⚠️ HIGH-RISK OVERDUE ITEMS (' + overdueItems.length + '):\\n- ' + overdueItems.join('\\n- ') + '\\n\\n';
    }
    
    body += 'Please log into LLABDHI OPS NODE to verify payments, update ARN/Challan references, or execute follow-ups.\\n\\n' +
            'Best regards,\\nAI Chief Financial & Operations Manager\\nLlabdhi Manufacturing LLP';
            
    MailApp.sendEmail(recipient, subject, body);
    
    var syncId = 'EML-SYNC-' + Utilities.formatDate(new Date(), 'GMT+5:30', 'yyyyMMddHHmmss');
    var logId = 'EML-' + Math.floor(1000 + Math.random() * 9000);
    var timestamp = Utilities.formatDate(new Date(), 'GMT+5:30', 'yyyy-MM-dd HH:mm:ss');
    
    emailLogsSheet.appendRow([logId, timestamp, recipient, subject, 'Batch Report (' + (dueTodayItems.length + upcomingItems.length + overdueItems.length) + ' items)', 'Interval Schedule', syncId, 'Sent']);
    Logger.log('Email alert successfully dispatched to ' + recipient);
  } else {
    Logger.log('No matching trigger rule for today.');
  }
}
`;
