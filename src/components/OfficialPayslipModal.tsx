import React, { useState } from 'react';
import { 
  Printer, 
  Download, 
  X, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  DollarSign, 
  Building,
  User,
  Copy
} from 'lucide-react';
import { PayrollPayStub } from './AdminPayrollView';
import { printPayslipViaIframe, downloadPayslipHtml, generatePayslipHtml } from '../utils/printHelper';

interface OfficialPayslipModalProps {
  isOpen: boolean;
  onClose: () => void;
  payStub: PayrollPayStub | null;
}

export const OfficialPayslipModal: React.FC<OfficialPayslipModalProps> = ({
  isOpen,
  onClose,
  payStub
}) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [copyNotification, setCopyNotification] = useState<string | null>(null);

  if (!isOpen || !payStub) return null;

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      // 1. Resilient hidden iframe print (avoids modal container clipping and backdrop artifacts)
      const res = await printPayslipViaIframe(payStub);
      if (!res.success) {
        // 2. Fallback to native window.print with print styling class applied to body
        document.body.classList.add('is-printing-payslip');
        window.print();
        setTimeout(() => {
          document.body.classList.remove('is-printing-payslip');
        }, 500);
      }
    } catch (err) {
      console.warn('Payslip print triggered fallback:', err);
      document.body.classList.add('is-printing-payslip');
      window.print();
      setTimeout(() => {
        document.body.classList.remove('is-printing-payslip');
      }, 500);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownload = () => {
    downloadPayslipHtml(payStub);
  };

  const handleCopySummary = () => {
    const summary = `MAX EXECUTIVE TIRES - OFFICIAL PAYSLIP #${payStub.id}
Employee: ${payStub.employeeName} (${payStub.role})
Period: ${payStub.periodStart} to ${payStub.periodEnd} | Pay Date: ${payStub.payDate}
Hours Logged: ${payStub.regularHours}h Reg @ EC$ ${payStub.hourlyRateXCD.toFixed(2)}/h + ${payStub.overtimeHours}h OT
Gross Earnings: EC$ ${payStub.grossPayXCD.toFixed(2)}
Deductions: DSS (6%): -EC$ ${payStub.dssEmployeeDeductionXCD.toFixed(2)} | PAYE: -EC$ ${payStub.payeTaxDeductionXCD.toFixed(2)}
NET TAKE-HOME: EC$ ${payStub.netPayXCD.toFixed(2)} (${payStub.paymentMethod})`;

    navigator.clipboard?.writeText(summary);
    setCopyNotification('Payslip summary copied to clipboard!');
    setTimeout(() => setCopyNotification(null), 3000);
  };

  const regPay = payStub.regularPayXCD ?? (payStub.regularHours * payStub.hourlyRateXCD);
  const otPay = payStub.overtimePayXCD ?? (payStub.overtimeHours * payStub.hourlyRateXCD * 1.5);
  const grossPay = payStub.grossPayXCD ?? (regPay + otPay);
  const dssDeduction = payStub.dssEmployeeDeductionXCD ?? (grossPay * 0.06);
  const payeDeduction = payStub.payeTaxDeductionXCD ?? 0;
  const totalDeductions = dssDeduction + payeDeduction;
  const netPay = payStub.netPayXCD ?? (grossPay - totalDeductions);

  return (
    <div 
      id="official-payslip-modal-backdrop" 
      className="fixed inset-0 z-[130] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in"
    >
      <div 
        id="official-payslip-dialog" 
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]"
      >
        {/* Modal Toolbar (hidden during print) */}
        <div className="no-print bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-blue-500/20 text-[#0984E3] rounded-lg">
              <FileText className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>Official Employee Payslip</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold uppercase px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Print-Ready Document
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Pichelin Workshop • Dominica Social Security (DSS) Compliant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-copy-payslip-summary"
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition cursor-pointer active:scale-95"
              title="Copy text summary"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Copy Text</span>
            </button>

            <button
              type="button"
              id="btn-download-payslip-html"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold rounded-xl border border-slate-700 transition cursor-pointer active:scale-95"
              title="Download standalone printable HTML payslip"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>

            <button
              type="button"
              id="btn-print-payslip-primary"
              onClick={handlePrint}
              disabled={isPrinting}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition cursor-pointer active:scale-95"
              title="Print official payslip"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isPrinting ? 'Preparing...' : 'Print Payslip'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer ml-1"
              aria-label="Close payslip modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {copyNotification && (
          <div className="no-print bg-emerald-50 border-b border-emerald-200 text-emerald-800 px-4 py-2 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{copyNotification}</span>
          </div>
        )}

        {/* Printable Payslip Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50">
          <div 
            id="official-payslip-print-sheet"
            className="official-payslip-print-sheet bg-white border-2 border-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 text-slate-900 mx-auto max-w-xl"
          >
            {/* Payslip Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-slate-900 pb-5">
              <div>
                <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#0984E3] block">
                  Official Salary & Wage Statement
                </span>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                  Max Executive Tires
                </h2>
                <p className="text-xs font-bold text-slate-700">
                  Fitment, Computer Balancing & Workshop Services
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Maranatha Square, Main Highway, Pichelin, Dominica<br />
                  DSS Reg: DOM-767-MAX • TIN: 104-892-TIRE • Tel: +1 767 616 0155
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="inline-block bg-slate-900 text-white text-[11px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider">
                  Official Payslip
                </span>
                <div className="mt-2 text-xs font-mono font-bold text-slate-700">
                  Ref #{payStub.id}
                </div>
                <div className="text-[11px] text-slate-500">
                  Issued: <strong>{payStub.payDate}</strong>
                </div>
                <div className="text-[11px] text-emerald-700 font-bold">
                  Status: {payStub.status}
                </div>
              </div>
            </div>

            {/* Employee & Period Details Grid */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Employee Name:</span>
                  <span className="font-black text-slate-900 text-sm">{payStub.employeeName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Role / Designation:</span>
                  <span className="font-semibold text-slate-700">{payStub.role}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Dominica DSS ID:</span>
                  <span className="font-mono font-bold text-slate-800">{payStub.dssNumber || 'DSS-ACTIVE'}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Pay Period:</span>
                  <span className="font-bold text-slate-800">{payStub.periodStart} to {payStub.periodEnd}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Payment Method:</span>
                  <span className="font-bold text-slate-800">{payStub.paymentMethod}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Staff ID Reference:</span>
                  <span className="font-mono text-slate-600">{payStub.employeeId}</span>
                </div>
              </div>
            </div>

            {/* Hours & Earnings Table */}
            <div>
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-900 pb-1.5 border-b border-slate-300 flex justify-between">
                <span>1. Hours & Earnings Breakdown</span>
                <span>Amount (EC$)</span>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800">Regular Bay Hours</span>
                    <span className="text-slate-500 text-[11px] block">
                      {payStub.regularHours} hrs @ EC$ {payStub.hourlyRateXCD.toFixed(2)}/hr
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    EC$ {regPay.toFixed(2)}
                  </span>
                </div>

                <div className="py-2 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-purple-900">Overtime Hours (1.5x Premium)</span>
                    <span className="text-purple-600 text-[11px] block">
                      {payStub.overtimeHours} hrs @ EC$ {(payStub.hourlyRateXCD * 1.5).toFixed(2)}/hr
                    </span>
                  </div>
                  <span className="font-mono font-bold text-purple-900">
                    EC$ {otPay.toFixed(2)}
                  </span>
                </div>

                <div className="py-2.5 bg-slate-100 px-2 rounded-lg flex items-center justify-between font-black text-slate-900">
                  <span>TOTAL GROSS EARNINGS ({payStub.regularHours + payStub.overtimeHours} hrs total)</span>
                  <span className="font-mono text-sm">EC$ {grossPay.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Statutory Deductions Table */}
            <div>
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-900 pb-1.5 border-b border-slate-300 flex justify-between">
                <span>2. Statutory Deductions (Dominica Social Security & PAYE)</span>
                <span>Amount (EC$)</span>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800">Dominica Social Security (DSS Employee)</span>
                    <span className="text-slate-500 text-[11px] block">
                      Statutory 6.0% deduction under DSS Act
                    </span>
                  </div>
                  <span className="font-mono font-bold text-rose-600">
                    -EC$ {dssDeduction.toFixed(2)}
                  </span>
                </div>

                <div className="py-2 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800">Dominica PAYE Withholding Tax</span>
                    <span className="text-slate-500 text-[11px] block">
                      Inland Revenue Division withholding schedule
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-600">
                    -EC$ {payeDeduction.toFixed(2)}
                  </span>
                </div>

                <div className="py-2 bg-rose-50/80 px-2 rounded-lg flex items-center justify-between font-black text-rose-900">
                  <span>TOTAL STATUTORY DEDUCTIONS</span>
                  <span className="font-mono">-EC$ {totalDeductions.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Net Take-Home Disbursement */}
            <div className="bg-slate-950 text-white rounded-2xl p-5 flex items-center justify-between shadow-md">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">
                  Net Take-Home Salary Disbursement
                </span>
                <span className="text-2xl sm:text-3xl font-black font-mono">
                  EC$ {netPay.toFixed(2)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full text-slate-200">
                  {payStub.paymentMethod}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Wages disbursed in Eastern Caribbean Dollars
                </span>
              </div>
            </div>

            {/* Signature Acknowledgment Blocks */}
            <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200 text-xs">
              <div className="space-y-6">
                <div className="border-b border-slate-400 pb-1 h-8 flex items-end">
                  <span className="text-[10px] text-slate-400 italic">Signed electronically / on-file</span>
                </div>
                <div className="text-[11px] text-slate-600 font-bold text-center">
                  Workshop Manager / Authorized Signatory
                </div>
              </div>

              <div className="space-y-6">
                <div className="border-b border-slate-400 pb-1 h-8"></div>
                <div className="text-[11px] text-slate-600 font-bold text-center">
                  Employee Signature & Acknowledgment
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 text-center pt-2 border-t border-dashed border-slate-200">
              Max Executive Tires, Maranatha Square, Pichelin, Dominica • Retain this official payslip for DSS and tax filings.
            </div>
          </div>
        </div>

        {/* Modal Footer (hidden during print) */}
        <div className="no-print bg-slate-100 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            Ready for standard 8.5&quot; x 11&quot; or A4 printing
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-5 py-2 bg-[#0984E3] hover:bg-[#0772c5] text-white font-extrabold rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? 'Opening Print Dialog...' : 'Print Payslip'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
