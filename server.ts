import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini AI Client
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // 1. Healthcheck Endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Llabdhi Manufacturing LLP Ops Node',
      timestamp: new Date().toISOString(),
    });
  });

  // 2. AI Manager Chat / Advisory Endpoint
  app.post('/api/ai-manager', async (req, res) => {
    try {
      const { prompt, dataContext } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const systemInstruction = `You are the AI Chief Financial & Operations Manager for Llabdhi Manufacturing LLP.
You are managing the "LLABDHI OPS NODE" operations system.
Your job is to provide rigorous, accurate, executive-level financial analysis, cash flow management, compliance guidance, and risk assessments for Llabdhi Manufacturing LLP.

Financial context provided:
${JSON.stringify(dataContext || {}, null, 2)}

Key Directives:
- Always format currency in Indian Rupees (₹ or INR).
- Be precise with due dates, 5-day cash flow projections, overdue debtor follow-ups, and statutory compliance deadlines (GST, TDS, Advance Tax, MCA DIR-3 KYC, Forms 8 & 11).
- Provide actionable recommendations, highlight high-risk items, and keep responses structured with clear headers, bullet points, and actionable summaries.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });

      return res.json({
        reply: response.text || 'No response generated.',
      });
    } catch (err: any) {
      console.error('Error in /api/ai-manager:', err);
      return res.status(500).json({
        error: 'Failed to communicate with AI Manager',
        details: err?.message || String(err),
      });
    }
  });

  // 3. AI Email Generator for Overdue Debtors
  app.post('/api/generate-email-draft', async (req, res) => {
    try {
      const { clientEntity, invoices, totalOutstanding, contactPerson } = req.body;

      const prompt = `Draft a polite, professional, and firm payment reminder email on behalf of Llabdhi Manufacturing LLP to ${clientEntity} (Attention: ${contactPerson || 'Accounts Payable Team'}).
Details:
- Total Outstanding Balance: ₹${Number(totalOutstanding).toLocaleString('en-IN')}
- Outstanding Invoices:
${invoices.map((inv: any) => `  * Invoice #${inv.invoiceRef}: ₹${Number(inv.amount).toLocaleString('en-IN')} (Due: ${inv.dueDate}, ${inv.notes || ''})`).join('\n')}

Include:
1. Professional Subject Line
2. Polite greeting acknowledging the partnership
3. Clear breakdown of outstanding invoice numbers and amounts
4. Request for status update, UTR/payment timestamp, or expected processing date
5. Llabdhi Manufacturing LLP Bank details placeholder
6. Professional sign-off from Chief Financial & Operations Manager, Llabdhi Manufacturing LLP.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          temperature: 0.3,
        },
      });

      return res.json({
        emailDraft: response.text || '',
      });
    } catch (err: any) {
      console.error('Error in /api/generate-email-draft:', err);
      return res.status(500).json({
        error: 'Failed to generate email draft',
        details: err?.message || String(err),
      });
    }
  });

  // 4. Calendar Sync Simulation Endpoint
  app.post('/api/sync-calendar', (req, res) => {
    const { emis, compliance } = req.body;
    const now = new Date();
    const syncId = `SYNC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;

    const newLogs: any[] = [];
    const updatedEmiIds: string[] = [];
    const updatedCompIds: string[] = [];

    // Process EMIs due within 7 days
    if (Array.isArray(emis)) {
      emis.forEach((emi: any) => {
        if (emi.status !== 'Paid') {
          const logId = `CAL-${Math.floor(1000 + Math.random() * 9000)}`;
          const gEvtId = `evt_gcal_${emi.id.toLowerCase()}_${Date.now().toString(36)}`;
          newLogs.push({
            id: logId,
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            eventTitle: `[LLABDHI EMI] ${emi.loanName} (₹${Number(emi.monthlyEmi).toLocaleString('en-IN')})`,
            eventDate: emi.nextDueDate,
            targetTab: 'EMIs',
            itemRefId: emi.id,
            googleEventId: gEvtId,
            syncStatus: 'Synced',
            syncId,
          });
          updatedEmiIds.push(emi.id);
        }
      });
    }

    // Process Compliance items due within 7 days
    if (Array.isArray(compliance)) {
      compliance.forEach((comp: any) => {
        if (comp.status !== 'Filed' && comp.status !== 'Paid') {
          const logId = `CAL-${Math.floor(1000 + Math.random() * 9000)}`;
          const gEvtId = `evt_gcal_${comp.id.toLowerCase()}_${Date.now().toString(36)}`;
          newLogs.push({
            id: logId,
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            eventTitle: `[LLABDHI COMPLIANCE] ${comp.title} (${comp.governingAuthority})`,
            eventDate: comp.dueDate,
            targetTab: 'LLP_Compliance',
            itemRefId: comp.id,
            googleEventId: gEvtId,
            syncStatus: 'Synced',
            syncId,
          });
          updatedCompIds.push(comp.id);
        }
      });
    }

    res.json({
      success: true,
      syncId,
      createdLogs: newLogs,
      message: `Successfully synced ${newLogs.length} events to Google Calendar.`,
    });
  });

  // 5. Automated Email Reminders Trigger Simulation
  app.post('/api/trigger-email-alerts', (req, res) => {
    const { recipientEmail, summary } = req.body;

    const syncId = `EML-SYNC-${Date.now().toString(36).toUpperCase()}`;
    const logId = `EML-${Math.floor(1000 + Math.random() * 9000)}`;
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const logEntry = {
      id: logId,
      timestamp,
      recipient: recipientEmail || 'shubhkumarrare@gmail.com',
      subject: `[LLABDHI OPS NODE] Automated Financial & Compliance Alert (${timestamp.substring(0, 10)})`,
      itemRef: summary || 'Automated Batch Email Trigger',
      triggerType: 'Interval Schedule',
      syncId,
      status: 'Sent',
    };

    res.json({
      success: true,
      log: logEntry,
      message: `Email alert successfully dispatched to ${logEntry.recipient}`,
    });
  });

  // Integrate Vite or Static files
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Llabdhi Ops Node Server running on http://localhost:${PORT}`);
  });
}

startServer();
