export const GOOGLE_CALENDAR_SYNC_SCRIPT = `/**
 * Google Apps Script for LLABDHI OPS NODE
 * Auto-Syncs EMI Due Dates, Creditors, Debtors & LLP Compliance Statutory Deadlines to Google Calendar
 * Invitees & Recipients: narendrabothra@llabdhigroup.in, ea@llabdhigroup.in
 * 
 * Target Sheet: LLABDHI OPS NODE
 * Sheets Read: 'EMIs', 'Creditors', 'Debtors', 'LLP_Compliance'
 * Sheet Written: 'Calendar Logs'
 */

function syncLlabdhiToGoogleCalendar() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var calendar = CalendarApp.getDefaultCalendar();
  var today = new Date();
  var sevenDaysLater = new Date();
  sevenDaysLater.setDate(today.getDate() + 7);
  var invitees = ['narendrabothra@llabdhigroup.in', 'ea@llabdhigroup.in'];
  
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
        
        var event = calendar.createAllDayEvent(title, dueDate, { 
          description: description, 
          guests: invitees.join(','),
          sendInvites: true 
        });
        var eventId = event.getId();
        
        var logId = 'CAL-' + Math.floor(1000 + Math.random() * 9000);
        var timestamp = Utilities.formatDate(new Date(), 'GMT+5:30', 'yyyy-MM-dd HH:mm:ss');
        var eventDateStr = Utilities.formatDate(dueDate, 'GMT+5:30', 'yyyy-MM-dd');
        calendarLogsSheet.appendRow([logId, timestamp, title, eventDateStr, 'EMIs', itemId, eventId, 'Synced', syncId]);
        
        emiSheet.getRange(i + 1, 11).setValue(eventId);
      }
    }
  }
  
  // 2. Process Creditors (Payables)
  var credSheet = ss.getSheetByName('Creditors');
  if (credSheet) {
    var credData = credSheet.getDataRange().getValues();
    for (var k = 1; k < credData.length; k++) {
      var crRow = credData[k];
      var crId = crRow[0];
      var vendor = crRow[1];
      var invRef = crRow[2];
      var crDueDate = new Date(crRow[3]);
      var crAmount = crRow[4];
      var crStatus = crRow[6];
      
      if (crDueDate >= today && crDueDate <= sevenDaysLater && crStatus !== 'Paid') {
        var crTitle = '[LLABDHI CREDITOR] ' + vendor + ' (₹' + Number(crAmount).toLocaleString('en-IN') + ')';
        var crDesc = 'Creditor Account Payable from LLABDHI OPS NODE\\nVendor: ' + vendor + '\\nInv #' + invRef + '\\nAmount: ₹' + crAmount + '\\nStatus: ' + crStatus;
        
        var crEvent = calendar.createAllDayEvent(crTitle, crDueDate, { 
          description: crDesc, 
          guests: invitees.join(','),
          sendInvites: true 
        });
        var crEventId = crEvent.getId();
        
        var crLogId = 'CAL-' + Math.floor(1000 + Math.random() * 9000);
        var crTimestamp = Utilities.formatDate(new Date(), 'GMT+5:30', 'yyyy-MM-dd HH:mm:ss');
        var crEventDateStr = Utilities.formatDate(crDueDate, 'GMT+5:30', 'yyyy-MM-dd');
        calendarLogsSheet.appendRow([crLogId, crTimestamp, crTitle, crEventDateStr, 'Creditors', crId, crEventId, 'Synced', syncId]);
      }
    }
  }

  // 3. Process Debtors (Inflows expected)
  var debSheet = ss.getSheetByName('Debtors');
  if (debSheet) {
    var debData = debSheet.getDataRange().getValues();
    for (var d = 1; d < debData.length; d++) {
      var dRow = debData[d];
      var dId = dRow[0];
      var client = dRow[1];
      var dInvRef = dRow[2];
      var dDueDate = new Date(dRow[4]);
      var dAmount = dRow[5];
      var dStatus = dRow[6];
      
      if (dDueDate >= today && dDueDate <= sevenDaysLater && dStatus !== 'Paid') {
        var debTitle = '[LLABDHI DEBTOR] ' + client + ' (₹' + Number(dAmount).toLocaleString('en-IN') + ')';
        var debDesc = 'Debtor Expected Inflow from LLABDHI OPS NODE\\nClient: ' + client + '\\nInv #' + dInvRef + '\\nAmount: ₹' + dAmount + '\\nStatus: ' + dStatus;
        
        var debEvent = calendar.createAllDayEvent(debTitle, dDueDate, { 
          description: debDesc, 
          guests: invitees.join(','),
          sendInvites: true 
        });
        var debEventId = debEvent.getId();
        
        var debLogId = 'CAL-' + Math.floor(1000 + Math.random() * 9000);
        var debTimestamp = Utilities.formatDate(new Date(), 'GMT+5:30', 'yyyy-MM-dd HH:mm:ss');
        var debEventDateStr = Utilities.formatDate(dDueDate, 'GMT+5:30', 'yyyy-MM-dd');
        calendarLogsSheet.appendRow([debLogId, debTimestamp, debTitle, debEventDateStr, 'Debtors', dId, debEventId, 'Synced', syncId]);
      }
    }
  }
  
  // 4. Process LLP Compliance Deadlines
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
        
        var compEvent = calendar.createAllDayEvent(compEventTitle, cDueDate, { 
          description: compDesc, 
          guests: invitees.join(','),
          sendInvites: true 
        });
        var compEventId = compEvent.getId();
        
        var cLogId = 'CAL-' + Math.floor(1000 + Math.random() * 9000);
        var cTimestamp = Utilities.formatDate(new Date(), 'GMT+5:30', 'yyyy-MM-dd HH:mm:ss');
        var cEventDateStr = Utilities.formatDate(cDueDate, 'GMT+5:30', 'yyyy-MM-dd');
        calendarLogsSheet.appendRow([cLogId, cTimestamp, compEventTitle, cEventDateStr, 'LLP_Compliance', cItemId, compEventId, 'Synced', syncId]);
        
        compSheet.getRange(j + 1, 9).setValue(compEventId);
      }
    }
  }
  
  Logger.log('Google Calendar Sync Completed with Invitation Accept Emails sent. Sync ID: ' + syncId);
}
`;

export const AUTOMATED_EMAIL_REMINDER_SCRIPT = `/**
 * Google Apps Script for LLABDHI OPS NODE
 * Automated Email Reminder System based on Settings Schedule [-7, -5, -3, -2, -1, 0, 1, 2, 3, 7]
 * 
 * Target Emails: narendrabothra@llabdhigroup.in, ea@llabdhigroup.in
 * Sheets Read: 'Settings', 'Debtors', 'Creditors', 'EMIs', 'LLP_Compliance'
 * Sheet Written: 'Email Logs'
 */

function runAutomatedEmailReminders() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Read Settings
  var settingsSheet = ss.getSheetByName('Settings');
  var recipient = 'narendrabothra@llabdhigroup.in, ea@llabdhigroup.in';
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
  
  // 2. Scan Creditors (Accounts Payable)
  var creditorsSheet = ss.getSheetByName('Creditors');
  if (creditorsSheet) {
    var crData = creditorsSheet.getDataRange().getValues();
    for (var cr = 1; cr < crData.length; cr++) {
      var crStatus = crData[cr][6];
      if (crStatus !== 'Paid') {
        var crDiff = getDaysDiff(crData[cr][3]);
        var crDesc = 'Creditor Payable: ' + crData[cr][1] + ' (Inv #' + crData[cr][2] + ' - ₹' + Number(crData[cr][4]).toLocaleString('en-IN') + ')';
        if (crDiff === 0) dueTodayItems.push(crDesc);
        else if (crDiff > 0 && reminderIntervals.indexOf(-crDiff) !== -1) upcomingItems.push(crDesc + ' [Due in ' + crDiff + ' days]');
        else if (crDiff < 0) overdueItems.push(crDesc + ' [OVERDUE by ' + Math.abs(crDiff) + ' days]');
      }
    }
  }

  // 3. Scan EMIs
  var emiSheet = ss.getSheetByName('EMIs');
  if (emiSheet) {
    var eData = emiSheet.getDataRange().getValues();
    for (var k = 1; k < eData.length; k++) {
      if (eData[k][9] !== 'Paid') {
        var eDiff = getDaysDiff(eData[k][8]);
        var eDesc = 'EMI Loan: ' + eData[k][1] + ' (₹' + Number(eData[k][6]).toLocaleString('en-IN') + ')';
        if (eDiff === 0) dueTodayItems.push(eDesc);
        else if (eDiff > 0 && reminderIntervals.indexOf(-eDiff) !== -1) upcomingItems.push(eDesc + ' [Due in ' + eDiff + ' days]');
        else if (eDiff < 0) overdueItems.push(eDesc + ' [OVERDUE by ' + Math.abs(eDiff) + ' days]');
      }
    }
  }
  
  // 4. Scan LLP Compliance
  var compSheet = ss.getSheetByName('LLP_Compliance');
  if (compSheet) {
    var cData = compSheet.getDataRange().getValues();
    for (var m = 1; m < cData.length; m++) {
      if (cData[m][5] !== 'Filed' && cData[m][5] !== 'Paid') {
        var cDiff = getDaysDiff(cData[m][4]);
        var cDesc = 'Statutory Compliance: ' + cData[m][1] + ' (' + cData[m][3] + ')';
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
               'Here is your automated daily financial, EMI loan, creditor, and statutory compliance operational report:\\n\\n';
               
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
            
    var htmlBody = '<div style="font-family: Arial, sans-serif; max-width: 650px; color: #1e293b; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">' +
      '<div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px;">' +
        '<h2 style="color: #0f172a; margin: 0; font-size: 20px;">LLABDHI OPS NODE — Financial & Compliance Event Alert</h2>' +
        '<p style="color: #64748b; margin: 4px 0 0 0; font-size: 13px;">Auto-generated for <strong>narendrabothra@llabdhigroup.in</strong> & <strong>ea@llabdhigroup.in</strong></p>' +
      '</div>' +
      '<p>Dear Llabdhi Management,</p>' +
      '<p>Here is your daily financial operational report. Click the buttons below to <strong>ACCEPT & SYNC</strong> events directly to your Google Calendar.</p>';
      
    if (dueTodayItems.length > 0) {
      htmlBody += '<div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; margin-bottom: 16px; border-radius: 4px;">' +
        '<h4 style="color: #991b1b; margin: 0 0 8px 0;">🔴 DUE TODAY (' + dueTodayItems.length + ')</h4>' +
        '<ul style="margin: 0; padding-left: 20px; color: #7f1d1d;">';
      for (var dt = 0; dt < dueTodayItems.length; dt++) {
        var gCalUrlDT = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(dueTodayItems[dt]) + '&add=narendrabothra@llabdhigroup.in,ea@llabdhigroup.in';
        htmlBody += '<li style="margin-bottom: 8px;">' + dueTodayItems[dt] + ' &nbsp; ' +
          '<a href="' + gCalUrlDT + '" target="_blank" style="background-color: #ef4444; color: #ffffff; padding: 4px 10px; text-decoration: none; border-radius: 4px; font-size: 11px; font-weight: bold; display: inline-block;">✓ ACCEPT EVENT</a>' +
          '</li>';
      }
      htmlBody += '</ul></div>';
    }
    
    if (upcomingItems.length > 0) {
      htmlBody += '<div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; margin-bottom: 16px; border-radius: 4px;">' +
        '<h4 style="color: #1e40af; margin: 0 0 8px 0;">🟡 UPCOMING LIABILITIES & INFLOWS (' + upcomingItems.length + ')</h4>' +
        '<ul style="margin: 0; padding-left: 20px; color: #1e3a8a;">';
      for (var up = 0; up < upcomingItems.length; up++) {
        var gCalUrlUP = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(upcomingItems[up]) + '&add=narendrabothra@llabdhigroup.in,ea@llabdhigroup.in';
        htmlBody += '<li style="margin-bottom: 8px;">' + upcomingItems[up] + ' &nbsp; ' +
          '<a href="' + gCalUrlUP + '" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 4px 10px; text-decoration: none; border-radius: 4px; font-size: 11px; font-weight: bold; display: inline-block;">✓ ACCEPT & ADD TO CALENDAR</a>' +
          '</li>';
      }
      htmlBody += '</ul></div>';
    }

    if (overdueItems.length > 0) {
      htmlBody += '<div style="background-color: #fffbeeb; border-left: 4px solid #f59e0b; padding: 12px 16px; margin-bottom: 16px; border-radius: 4px;">' +
        '<h4 style="color: #92400e; margin: 0 0 8px 0;">⚠️ HIGH-RISK OVERDUE ITEMS (' + overdueItems.length + ')</h4>' +
        '<ul style="margin: 0; padding-left: 20px; color: #78350f;">';
      for (var ov = 0; ov < overdueItems.length; ov++) {
        var gCalUrlOV = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(overdueItems[ov]) + '&add=narendrabothra@llabdhigroup.in,ea@llabdhigroup.in';
        htmlBody += '<li style="margin-bottom: 8px;">' + overdueItems[ov] + ' &nbsp; ' +
          '<a href="' + gCalUrlOV + '" target="_blank" style="background-color: #d97706; color: #ffffff; padding: 4px 10px; text-decoration: none; border-radius: 4px; font-size: 11px; font-weight: bold; display: inline-block;">✓ ACCEPT EVENT & AUDIT</a>' +
          '</li>';
      }
      htmlBody += '</ul></div>';
    }

    htmlBody += '<div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">' +
      '<p style="margin: 0 0 4px 0;"><strong>Llabdhi Manufacturing LLP</strong> — Automated Ops Engine</p>' +
      '<p style="margin: 0;">Invitees: narendrabothra@llabdhigroup.in | ea@llabdhigroup.in</p>' +
      '</div></div>';

    MailApp.sendEmail(recipient, subject, body, { name: 'Llabdhi', htmlBody: htmlBody });
    
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
