/**
 * Dedicated Printer Helper for Max Executive Tires
 * Provides multiple resilient printing pathways:
 * 1. Isolated Hidden Iframe Print (bypasses modal overflow, fixed positioning, and dark theme issues)
 * 2. Fallback to Window.print() with clean body class
 * 3. Safe fallback detection if browser iframe sandbox blocks direct modal print dialogs
 */

export function printHtmlViaIframe(
  contentHtml: string,
  docTitle: string = 'Max Executive Tires - Barcode Labels'
): Promise<{ success: boolean; reason?: string }> {
  return new Promise((resolve) => {
    try {
      let printFrame = document.getElementById('barcode-label-print-frame') as HTMLIFrameElement;
      if (printFrame) {
        printFrame.remove();
      }

      printFrame = document.createElement('iframe');
      printFrame.id = 'barcode-label-print-frame';
      printFrame.style.position = 'fixed';
      printFrame.style.right = '-9999px';
      printFrame.style.bottom = '-9999px';
      printFrame.style.width = '1000px';
      printFrame.style.height = '1200px';
      printFrame.style.border = '0';
      printFrame.style.opacity = '0';
      printFrame.style.pointerEvents = 'none';
      document.body.appendChild(printFrame);

      const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
      if (!frameDoc) {
        resolve({ success: false, reason: 'No iframe document' });
        return;
      }

      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${docTitle}</title>
            <style>
              @page {
                size: 8.5in 11in portrait;
                margin: 0 !important;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #000000 !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              * {
                box-sizing: border-box !important;
              }
              .avery-5163-sheet {
                width: 8.5in !important;
                height: 11.0in !important;
                min-height: 11.0in !important;
                max-width: 8.5in !important;
                max-height: 11.0in !important;
                padding: 0.5in 0.156in !important;
                display: grid !important;
                grid-template-columns: 4.0in 4.0in !important;
                grid-template-rows: repeat(5, 2.0in) !important;
                column-gap: 0.188in !important;
                row-gap: 0in !important;
                background: #ffffff !important;
                box-sizing: border-box !important;
                page-break-after: always !important;
                break-after: page !important;
                margin: 0 auto !important;
              }
              .avery-5163-sheet:last-of-type {
                page-break-after: auto !important;
                break-after: auto !important;
              }
              .grid-2x4-sheet {
                width: 8.5in !important;
                height: 11.0in !important;
                min-height: 11.0in !important;
                max-width: 8.5in !important;
                max-height: 11.0in !important;
                padding: 0.5in 0.156in !important;
                display: grid !important;
                grid-template-columns: 4.0in 4.0in !important;
                grid-template-rows: repeat(4, 2.5in) !important;
                column-gap: 0.188in !important;
                row-gap: 0in !important;
                background: #ffffff !important;
                box-sizing: border-box !important;
                page-break-after: always !important;
                break-after: page !important;
                margin: 0 auto !important;
              }
              .grid-2x4-sheet:last-of-type {
                page-break-after: auto !important;
                break-after: auto !important;
              }
              .avery-2x4-label,
              .large-2x4-label {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                background: #ffffff !important;
                overflow: hidden !important;
              }
              .no-print {
                display: none !important;
              }
            </style>
          </head>
          <body>
            ${contentHtml}
          </body>
        </html>
      `);
      frameDoc.close();

      setTimeout(() => {
        try {
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();
          resolve({ success: true });
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.warn('Iframe printing triggered exception (e.g. sandbox restriction):', errMsg);
          resolve({ success: false, reason: errMsg });
        }
      }, 350);
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      resolve({ success: false, reason: errMsg });
    }
  });
}

export interface PayslipData {
  id: string;
  payrollRunId?: string;
  employeeId: string;
  employeeName: string;
  role: string;
  periodStart: string;
  periodEnd: string;
  payDate: string;
  regularHours: number;
  overtimeHours: number;
  hourlyRateXCD: number;
  regularPayXCD: number;
  overtimePayXCD: number;
  grossPayXCD: number;
  dssEmployeeDeductionXCD: number;
  dssEmployerContributionXCD?: number;
  payeTaxDeductionXCD: number;
  netPayXCD: number;
  paymentMethod: string;
  status: string;
  dssNumber?: string;
}

export function generatePayslipHtml(stub: PayslipData): string {
  const regHours = Number(stub.regularHours || 0).toFixed(1);
  const otHours = Number(stub.overtimeHours || 0).toFixed(1);
  const totalHours = (Number(stub.regularHours || 0) + Number(stub.overtimeHours || 0)).toFixed(1);
  const hourlyRate = Number(stub.hourlyRateXCD || 0).toFixed(2);
  const otRate = (Number(stub.hourlyRateXCD || 0) * 1.5).toFixed(2);
  const regPay = Number(stub.regularPayXCD || 0).toFixed(2);
  const otPay = Number(stub.overtimePayXCD || 0).toFixed(2);
  const grossPay = Number(stub.grossPayXCD || 0).toFixed(2);
  const dssDeduction = Number(stub.dssEmployeeDeductionXCD || 0).toFixed(2);
  const payeDeduction = Number(stub.payeTaxDeductionXCD || 0).toFixed(2);
  const totalDeductions = (Number(stub.dssEmployeeDeductionXCD || 0) + Number(stub.payeTaxDeductionXCD || 0)).toFixed(2);
  const netPay = Number(stub.netPayXCD || 0).toFixed(2);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Official Payslip - ${stub.employeeName} (#${stub.id})</title>
  <style>
    @page {
      size: letter portrait;
      margin: 15mm 15mm 15mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      padding: 24px;
      line-height: 1.4;
      font-size: 13px;
    }
    .payslip-container {
      max-width: 750px;
      margin: 0 auto;
      border: 2px solid #0f172a;
      padding: 28px;
      border-radius: 8px;
      background: #ffffff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 18px;
    }
    .header-left h1 {
      font-size: 18px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #0f172a;
      text-transform: uppercase;
    }
    .header-left p {
      font-size: 11px;
      color: #475569;
      margin-top: 3px;
    }
    .header-right {
      text-align: right;
    }
    .doc-badge {
      display: inline-block;
      background: #0f172a;
      color: #ffffff;
      font-size: 11px;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .slip-id {
      font-size: 11px;
      color: #475569;
      margin-top: 4px;
      font-family: monospace;
      font-weight: bold;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 20px;
    }
    .meta-col p {
      margin-bottom: 4px;
      font-size: 12px;
    }
    .meta-col p strong {
      color: #1e293b;
    }
    .section-title {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #1e293b;
      margin-bottom: 6px;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 18px;
      font-size: 12px;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      text-align: left;
      padding: 8px 10px;
      font-weight: 700;
      border-bottom: 1px solid #cbd5e1;
      text-transform: uppercase;
      font-size: 10px;
    }
    td {
      padding: 7px 10px;
      border-bottom: 1px solid #e2e8f0;
    }
    .text-right {
      text-align: right;
    }
    .num {
      font-family: monospace;
      font-size: 12px;
      font-weight: 600;
    }
    .total-row td {
      font-weight: 800;
      background: #f8fafc;
      border-top: 2px solid #0f172a;
      border-bottom: 2px solid #0f172a;
    }
    .net-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0f172a;
      color: #ffffff;
      padding: 14px 18px;
      border-radius: 6px;
      margin-bottom: 22px;
    }
    .net-label {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .net-sub {
      font-size: 10px;
      color: #94a3b8;
    }
    .net-amount {
      font-size: 22px;
      font-weight: 900;
      font-family: monospace;
      letter-spacing: -0.5px;
    }
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #cbd5e1;
    }
    .sig-line {
      border-top: 1px solid #475569;
      padding-top: 6px;
      font-size: 11px;
      color: #475569;
      text-align: center;
    }
    .footer-note {
      text-align: center;
      margin-top: 22px;
      font-size: 10px;
      color: #64748b;
      border-top: 1px dashed #cbd5e1;
      padding-top: 12px;
    }
    @media print {
      body {
        padding: 0;
        background: transparent;
      }
      .payslip-container {
        border: 1px solid #000;
        padding: 20px;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="payslip-container">
    <div class="header">
      <div class="header-left">
        <h1>Max Executive Tires & Fitment Services</h1>
        <p>Maranatha Square, Main Highway, Pichelin, Commonwealth of Dominica</p>
        <p>DSS Reg: DOM-767-MAX &bull; TIN/VAT: 104-892-TIRE &bull; Tel: +1 (767) 616-0155</p>
      </div>
      <div class="header-right">
        <span class="doc-badge">Official Payslip</span>
        <div class="slip-id">#${stub.id}</div>
        <div style="font-size: 10px; color: #64748b; margin-top: 3px;">Date: ${stub.payDate}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-col">
        <p><strong>Employee Name:</strong> ${stub.employeeName}</p>
        <p><strong>Designation:</strong> ${stub.role}</p>
        <p><strong>Staff ID:</strong> ${stub.employeeId}</p>
        <p><strong>Dominica DSS No:</strong> ${stub.dssNumber || 'DSS-ACTIVE'}</p>
      </div>
      <div class="meta-col">
        <p><strong>Pay Period:</strong> ${stub.periodStart} &ndash; ${stub.periodEnd}</p>
        <p><strong>Disbursement Date:</strong> ${stub.payDate}</p>
        <p><strong>Disbursement Method:</strong> ${stub.paymentMethod}</p>
        <p><strong>Status:</strong> ${stub.status}</p>
      </div>
    </div>

    <div class="section-title">1. Hours & Earnings Breakdown</div>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-right">Hours Logged</th>
          <th class="text-right">Rate (EC$)</th>
          <th class="text-right">Total Amount (EC$)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Regular Bay Hours</td>
          <td class="text-right num">${regHours} hrs</td>
          <td class="text-right num">$${hourlyRate}/hr</td>
          <td class="text-right num">$${regPay}</td>
        </tr>
        <tr>
          <td>Overtime Hours (1.5x Premium)</td>
          <td class="text-right num">${otHours} hrs</td>
          <td class="text-right num">$${otRate}/hr</td>
          <td class="text-right num">$${otPay}</td>
        </tr>
        <tr class="total-row">
          <td><strong>TOTAL GROSS EARNINGS</strong></td>
          <td class="text-right num"><strong>${totalHours} hrs</strong></td>
          <td class="text-right">&mdash;</td>
          <td class="text-right num"><strong>EC$ ${grossPay}</strong></td>
        </tr>
      </tbody>
    </table>

    <div class="section-title">2. Statutory Deductions (Dominica Social Security & PAYE)</div>
    <table>
      <thead>
        <tr>
          <th>Deduction Item</th>
          <th>Statutory Authority</th>
          <th class="text-right">Rate / Basis</th>
          <th class="text-right">Amount Deducted (EC$)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Dominica Social Security (DSS Employee)</td>
          <td>Dominica Social Security Act</td>
          <td class="text-right num">6.0%</td>
          <td class="text-right num">-EC$ ${dssDeduction}</td>
        </tr>
        <tr>
          <td>Dominica PAYE Withholding Tax</td>
          <td>Inland Revenue Division</td>
          <td class="text-right num">Standard Exempt / Graduated</td>
          <td class="text-right num">-EC$ ${payeDeduction}</td>
        </tr>
        <tr class="total-row">
          <td colspan="3"><strong>TOTAL DEDUCTIONS</strong></td>
          <td class="text-right num"><strong>-EC$ ${totalDeductions}</strong></td>
        </tr>
      </tbody>
    </table>

    <div class="net-banner">
      <div>
        <div class="net-label">Net Take-Home Salary Disbursement</div>
        <div class="net-sub">Authorized payment via ${stub.paymentMethod}</div>
      </div>
      <div class="net-amount">EC$ ${netPay}</div>
    </div>

    <div class="signatures">
      <div>
        <div style="height: 38px;"></div>
        <div class="sig-line">Workshop Manager / Authorizing Officer</div>
      </div>
      <div>
        <div style="height: 38px;"></div>
        <div class="sig-line">Employee Signature & Acknowledgment</div>
      </div>
    </div>

    <div class="footer-note">
      This is an official payroll documentation generated by Max Executive Tires, Maranatha Square, Pichelin, Dominica.<br />
      Preserve this payslip for your income tax and Dominica Social Security (DSS) benefit records.
    </div>
  </div>
</body>
</html>`;
}

export function printPayslipViaIframe(stub: PayslipData): Promise<{ success: boolean; reason?: string }> {
  return new Promise((resolve) => {
    try {
      const contentHtml = generatePayslipHtml(stub);
      let printFrame = document.getElementById('official-payslip-print-frame') as HTMLIFrameElement;
      if (printFrame) {
        printFrame.remove();
      }

      printFrame = document.createElement('iframe');
      printFrame.id = 'official-payslip-print-frame';
      printFrame.style.position = 'fixed';
      printFrame.style.right = '-9999px';
      printFrame.style.bottom = '-9999px';
      printFrame.style.width = '1000px';
      printFrame.style.height = '1200px';
      printFrame.style.border = '0';
      printFrame.style.opacity = '0';
      printFrame.style.pointerEvents = 'none';
      document.body.appendChild(printFrame);

      const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
      if (!frameDoc) {
        resolve({ success: false, reason: 'No iframe document available' });
        return;
      }

      frameDoc.open();
      frameDoc.write(contentHtml);
      frameDoc.close();

      setTimeout(() => {
        try {
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();
          resolve({ success: true });
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.warn('Payslip iframe printing failed, using fallback:', errMsg);
          resolve({ success: false, reason: errMsg });
        }
      }, 400);
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      resolve({ success: false, reason: errMsg });
    }
  });
}

export function downloadPayslipHtml(stub: PayslipData): void {
  const html = generatePayslipHtml(stub);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanName = (stub.employeeName || 'Staff').replace(/[^a-zA-Z0-9]/g, '_');
  a.download = `Official_Payslip_${cleanName}_${stub.periodEnd || stub.payDate}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

