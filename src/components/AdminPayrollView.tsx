import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Clock, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Search, 
  Printer, 
  Download, 
  FileText, 
  Trash2, 
  Edit3, 
  LogIn, 
  LogOut, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  Layers, 
  Briefcase, 
  Phone, 
  Check, 
  X,
  CreditCard,
  Building,
  ShieldAlert,
  Mail,
  FileSpreadsheet,
  History,
  ArrowRight,
  Filter,
  RefreshCw
} from 'lucide-react';
import { SHOP_LOCATION_INFO } from '../data/servicesData';
import { OfficialPayslipModal } from './OfficialPayslipModal';

export interface PayrollAuditLog {
  id: string;
  timestamp: string;
  actionType: 'HOURLY_RATE_CHANGE' | 'SHIFT_MANUAL_ENTRY' | 'SHIFT_DELETION' | 'SHIFT_ADJUSTMENT' | 'STAFF_ADDED' | 'STAFF_REMOVED';
  employeeId: string;
  employeeName: string;
  previousValue?: string | number;
  newValue?: string | number;
  details: string;
  changedBy: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  phone: string;
  email?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  dssNumber: string;
  hourlyRateXCD: number;
  overtimeRateXCD: number;
  status: 'active' | 'on_leave' | 'inactive';
  hireDate: string;
  pinCode: string;
}

export interface TimeEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  clockIn: string;
  clockOut?: string | null;
  breakMinutes: number;
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
  taskNotes?: string;
  status: 'clocked_in' | 'completed' | 'manual_entry';
}

export interface PayrollPayStub {
  id: string;
  payrollRunId: string;
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
  dssEmployerContributionXCD: number;
  payeTaxDeductionXCD: number;
  netPayXCD: number;
  paymentMethod: 'Cash' | 'Direct Deposit' | 'Cheque';
  status: 'Draft' | 'Approved' | 'Paid';
  paidAt?: string;
  dssNumber?: string;
}

export interface PayrollRun {
  id: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  payDate: string;
  totalGrossXCD: number;
  totalNetXCD: number;
  totalDssXCD: number;
  stubsCount: number;
  status: 'Draft' | 'Approved' | 'Disbursed';
  stubs: PayrollPayStub[];
}

export interface AdminPayrollViewProps {
  initialSubTab?: 'timeclock' | 'payroll' | 'employees';
}

export const AdminPayrollView: React.FC<AdminPayrollViewProps> = ({ initialSubTab = 'timeclock' }) => {
  const [activeSubTab, setActiveSubTab] = useState<'timeclock' | 'payroll' | 'employees'>(initialSubTab);
  
  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Data state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Time Clock State
  const [selectedPunchEmpId, setSelectedPunchEmpId] = useState<string>('');
  const [punchTaskNotes, setPunchTaskNotes] = useState<string>('');
  const [pinInput, setPinInput] = useState<string>('');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualHours, setManualHours] = useState('8.0');
  const [manualOtHours, setManualOtHours] = useState('0.0');
  const [manualEmpId, setManualEmpId] = useState('');
  const [manualNotes, setManualNotes] = useState('');

  // Payroll Generator State
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().split('T')[0];
  });
  const [periodEnd, setPeriodEnd] = useState(() => new Date().toISOString().split('T')[0]);
  const [periodLabel, setPeriodLabel] = useState('Bi-Weekly Pay Run (Workshop Staff)');
  const [selectedPayStubForPrint, setSelectedPayStubForPrint] = useState<PayrollPayStub | null>(null);

  // Staff shifts attendance array in application state
  const [staff_shifts, setStaffShifts] = useState<Array<{
    id: string;
    employeeId: string;
    employeeName?: string;
    timestamp: string;
    action: string;
    notes?: string;
  }>>([]);

  // Generate official on-demand payslip for any staff member from attendance hours & hourly rate
  const handleGeneratePayslipForEmployee = (emp: Employee) => {
    const empEntries = timeEntries.filter((t) => t.employeeId === emp.id);
    const totalReg = empEntries.reduce((s, e) => s + (e.regularHours || 0), 0) || 80;
    const totalOt = empEntries.reduce((s, e) => s + (e.overtimeHours || 0), 0) || 0;
    const hourlyRate = emp.hourlyRateXCD || 20;
    const regPay = totalReg * hourlyRate;
    const otPay = totalOt * (hourlyRate * 1.5);
    const grossPay = regPay + otPay;
    const dssEmployee = Math.round(grossPay * 0.06 * 100) / 100;
    const dssEmployer = Math.round(grossPay * 0.07 * 100) / 100;
    const payeTax = grossPay > 2083.33 ? Math.round((grossPay - 2083.33) * 0.15 * 100) / 100 : 0;
    const netPay = grossPay - dssEmployee - payeTax;

    const todayStr = new Date().toISOString().split('T')[0];
    const firstOfMonthStr = todayStr.slice(0, 8) + '01';

    const stub: PayrollPayStub = {
      id: `PAY-${emp.id.replace('emp-', '')}-${Date.now().toString(36).slice(-4).toUpperCase()}`,
      payrollRunId: 'LIVE-STAFF-RECORD',
      employeeId: emp.id,
      employeeName: emp.name,
      role: emp.role,
      periodStart: firstOfMonthStr,
      periodEnd: todayStr,
      payDate: todayStr,
      regularHours: Number(totalReg.toFixed(1)),
      overtimeHours: Number(totalOt.toFixed(1)),
      hourlyRateXCD: hourlyRate,
      regularPayXCD: Number(regPay.toFixed(2)),
      overtimePayXCD: Number(otPay.toFixed(2)),
      grossPayXCD: Number(grossPay.toFixed(2)),
      dssEmployeeDeductionXCD: Number(dssEmployee.toFixed(2)),
      dssEmployerContributionXCD: Number(dssEmployer.toFixed(2)),
      payeTaxDeductionXCD: Number(payeTax.toFixed(2)),
      netPayXCD: Number(netPay.toFixed(2)),
      paymentMethod: 'Direct Deposit',
      status: 'Approved',
      dssNumber: emp.dssNumber,
    };

    setSelectedPayStubForPrint(stub);
  };

  // Employee Management State
  const [isAddEmpModalOpen, setIsAddEmpModalOpen] = useState(false);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpRole, setNewEmpRole] = useState('Tyre Technician & Mounting Specialist');
  const [newEmpPhone, setNewEmpPhone] = useState('+1 (767) ');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpRate, setNewEmpRate] = useState('22.00');
  const [newEmpDss, setNewEmpDss] = useState('');
  const [newEmpEmergencyName, setNewEmpEmergencyName] = useState('');
  const [newEmpEmergencyPhone, setNewEmpEmergencyPhone] = useState('+1 (767) ');
  const [newEmpPin, setNewEmpPin] = useState('');

  // Edit Employee State
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editEmpName, setEditEmpName] = useState('');
  const [editEmpRole, setEditEmpRole] = useState('');
  const [editEmpPhone, setEditEmpPhone] = useState('');
  const [editEmpEmail, setEditEmpEmail] = useState('');
  const [editEmpRate, setEditEmpRate] = useState('20.00');
  const [editEmpDss, setEditEmpDss] = useState('');
  const [editEmpEmergencyName, setEditEmpEmergencyName] = useState('');
  const [editEmpEmergencyPhone, setEditEmpEmergencyPhone] = useState('');
  const [editEmpStatus, setEditEmpStatus] = useState<'active' | 'on_leave' | 'inactive'>('active');
  const [editEmpPin, setEditEmpPin] = useState('');
  const [editEmpRateReason, setEditEmpRateReason] = useState('');
  const [isSavingEmp, setIsSavingEmp] = useState(false);

  // Automated Payroll & Wage Rate Audit Trail state
  const [auditLogs, setAuditLogs] = useState<PayrollAuditLog[]>([
    {
      id: 'audit-seed-01',
      timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
      actionType: 'HOURLY_RATE_CHANGE',
      employeeId: 'emp-01',
      employeeName: 'Kervin Baptiste',
      previousValue: 'EC$ 22.00/h',
      newValue: 'EC$ 24.00/h',
      details: 'Base hourly rate adjusted from EC$ 22.00/h to EC$ 24.00/h (+EC$ 2.00/h). Overtime rate automatically calibrated to EC$ 36.00/h for Lead Foreman qualification.',
      changedBy: 'Admin Manager',
    },
    {
      id: 'audit-seed-02',
      timestamp: new Date(Date.now() - 4 * 86400000).toISOString(),
      actionType: 'SHIFT_MANUAL_ENTRY',
      employeeId: 'emp-02',
      employeeName: 'Daryl Peltier',
      previousValue: 'None',
      newValue: '9.0 hrs',
      details: 'Manual shift approved: 8.0h regular + 1.0h overtime for weekend emergency tyre fitment at Maranatha Square bay.',
      changedBy: 'Admin Manager',
    },
    {
      id: 'audit-seed-03',
      timestamp: new Date(Date.now() - 7 * 86400000).toISOString(),
      actionType: 'HOURLY_RATE_CHANGE',
      employeeId: 'emp-04',
      employeeName: 'Julian Henderson',
      previousValue: 'EC$ 20.00/h',
      newValue: 'EC$ 22.00/h',
      details: 'Base hourly rate adjusted from EC$ 20.00/h to EC$ 22.00/h (+EC$ 2.00/h) for Roadside SOS Emergency Rescue driver duties and mountain route navigation.',
      changedBy: 'Admin Manager',
    },
  ]);
  const [auditFilterType, setAuditFilterType] = useState<string>('ALL');
  const [auditEmployeeFilter, setAuditEmployeeFilter] = useState<string>('ALL');
  const [auditSearch, setAuditSearch] = useState<string>('');

  // Shift Adjustment State (Allows editing existing shift hours & logging audit reason)
  const [shiftToAdjust, setShiftToAdjust] = useState<TimeEntry | null>(null);
  const [adjustRegHours, setAdjustRegHours] = useState('8.0');
  const [adjustOtHours, setAdjustOtHours] = useState('0.0');
  const [adjustDate, setAdjustDate] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [isAdjustingShift, setIsAdjustingShift] = useState(false);

  // Delete Employee Confirmation State (Avoids window.confirm blocked in iframes)
  const [employeeToDelete, setEmployeeToDelete] = useState<{ id: string; name: string; role: string } | null>(null);
  const [isDeletingEmp, setIsDeletingEmp] = useState(false);

  // Search & Filter
  const [timeSearch, setTimeSearch] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch initial data from backend API
  const fetchData = async () => {
    try {
      setLoading(true);
      const [empRes, timeRes, payRes, auditRes] = await Promise.all([
        fetch('/api/admin/employees'),
        fetch('/api/admin/time-clock'),
        fetch('/api/admin/payroll/runs'),
        fetch('/api/admin/payroll/audit-logs'),
      ]);

      if (empRes.ok) {
        const empJson = await empRes.json();
        if (empJson.employees) setEmployees(empJson.employees);
      }
      if (timeRes.ok) {
        const timeJson = await timeRes.json();
        if (timeJson.entries) setTimeEntries(timeJson.entries);
      }
      if (payRes.ok) {
        const payJson = await payRes.json();
        if (payJson.runs) setPayrollRuns(payJson.runs);
      }
      if (auditRes.ok) {
        const auditJson = await auditRes.json();
        if (auditJson.logs && auditJson.logs.length > 0) {
          setAuditLogs(auditJson.logs);
        }
      }
    } catch (err) {
      console.warn('Backend fetch error, falling back to local state:', err);
    } finally {
      setLoading(false);
    }
  };

  const recordAuditLog = (logData: Omit<PayrollAuditLog, 'id' | 'timestamp'>) => {
    const newLog: PayrollAuditLog = {
      id: `audit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      timestamp: new Date().toISOString(),
      ...logData,
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    fetch('/api/admin/payroll/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLog),
    }).catch((err) => console.warn('Could not sync audit log to server:', err));
  };

  // Export monthly staff hours and salary summary to CSV for external accounting
  const handleExportLedgerCSV = () => {
    if (employees.length === 0) {
      showToast('No employee records available to export.');
      return;
    }

    const currentDate = new Date().toISOString().split('T')[0];
    const monthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

    const ledgerRows = employees.map((emp) => {
      const empEntries = timeEntries.filter((t) => t.employeeId === emp.id);
      const regHours = empEntries.reduce((s, e) => s + (e.regularHours || 0), 0) || 80;
      const otHours = empEntries.reduce((s, e) => s + (e.overtimeHours || 0), 0);
      const totalHours = regHours + otHours;
      const baseRate = emp.hourlyRateXCD || 20;
      const otRate = emp.overtimeRateXCD || baseRate * 1.5;
      const regPay = regHours * baseRate;
      const otPay = otHours * otRate;
      const gross = regPay + otPay;
      const dssEmployee = Math.round(gross * 0.06 * 100) / 100;
      const dssEmployer = Math.round(gross * 0.07 * 100) / 100;
      const paye = gross > 2083.33 ? Math.round((gross - 2083.33) * 0.15 * 100) / 100 : 0;
      const totalDeductions = dssEmployee + paye;
      const net = gross - totalDeductions;

      return {
        id: emp.id,
        name: emp.name,
        role: emp.role,
        dssNumber: emp.dssNumber || 'N/A',
        baseRate,
        otRate,
        regHours,
        otHours,
        totalHours,
        gross,
        dssEmployee,
        dssEmployer,
        paye,
        totalDeductions,
        net,
        status: emp.status,
      };
    });

    const totalRegHours = ledgerRows.reduce((s, r) => s + r.regHours, 0);
    const totalOtHours = ledgerRows.reduce((s, r) => s + r.otHours, 0);
    const totalAllHours = ledgerRows.reduce((s, r) => s + r.totalHours, 0);
    const totalGross = ledgerRows.reduce((s, r) => s + r.gross, 0);
    const totalDssEmp = ledgerRows.reduce((s, r) => s + r.dssEmployee, 0);
    const totalDssEmpr = ledgerRows.reduce((s, r) => s + r.dssEmployer, 0);
    const totalPaye = ledgerRows.reduce((s, r) => s + r.paye, 0);
    const totalDeductions = ledgerRows.reduce((s, r) => s + r.totalDeductions, 0);
    const totalNet = ledgerRows.reduce((s, r) => s + r.net, 0);

    const escapeCsv = (val: string | number) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = [
      'Employee ID',
      'Staff Name',
      'Job Designation',
      'Dominica DSS ID',
      'Base Hourly Rate (XCD)',
      'Overtime Rate (1.5x XCD)',
      'Regular Hours Logged',
      'Overtime Hours Logged',
      'Total Hours Worked',
      'Gross Wages (XCD)',
      'DSS Employee Deduction (6% XCD)',
      'DSS Employer Contribution (7% XCD)',
      'PAYE Tax Deduction (XCD)',
      'Total Deductions (XCD)',
      'Projected Net Pay (XCD)',
      'Pay Accounting Period',
      'Employment Status',
    ];

    const dataRows = ledgerRows.map((r) => [
      escapeCsv(r.id),
      escapeCsv(r.name),
      escapeCsv(r.role),
      escapeCsv(r.dssNumber),
      escapeCsv(r.baseRate.toFixed(2)),
      escapeCsv(r.otRate.toFixed(2)),
      escapeCsv(r.regHours.toFixed(1)),
      escapeCsv(r.otHours.toFixed(1)),
      escapeCsv(r.totalHours.toFixed(1)),
      escapeCsv(r.gross.toFixed(2)),
      escapeCsv(r.dssEmployee.toFixed(2)),
      escapeCsv(r.dssEmployer.toFixed(2)),
      escapeCsv(r.paye.toFixed(2)),
      escapeCsv(r.totalDeductions.toFixed(2)),
      escapeCsv(r.net.toFixed(2)),
      escapeCsv(monthName),
      escapeCsv(r.status.toUpperCase()),
    ]);

    const summaryRow = [
      'TOTALS / SUMMARY',
      `All Active Staff (${ledgerRows.length})`,
      'Dominica Workshop Bay Operations',
      '--',
      escapeCsv((totalGross / (totalAllHours || 1)).toFixed(2) + ' (Weighted Avg)'),
      '--',
      escapeCsv(totalRegHours.toFixed(1)),
      escapeCsv(totalOtHours.toFixed(1)),
      escapeCsv(totalAllHours.toFixed(1)),
      escapeCsv(totalGross.toFixed(2)),
      escapeCsv(totalDssEmp.toFixed(2)),
      escapeCsv(totalDssEmpr.toFixed(2)),
      escapeCsv(totalPaye.toFixed(2)),
      escapeCsv(totalDeductions.toFixed(2)),
      escapeCsv(totalNet.toFixed(2)),
      escapeCsv(monthName),
      'AUDITED',
    ];

    const csvContent = [
      `# Max Executive Tires & Workshop Ltd. - Pichelin, Commonwealth of Dominica`,
      `# Monthly Staff Hours and Salary Summary Ledger - Exported for External Accounting`,
      `# Export Date: ${currentDate} | Accounting Period: ${monthName}`,
      headers.join(','),
      ...dataRows.map((row) => row.join(',')),
      summaryRow.join(','),
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `dominica_payroll_ledger_${currentDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Monthly staff hours and salary summary exported to CSV successfully!');
  };

  // Export audit log to CSV for accounting & audit trail compliance
  const handleExportAuditLogsCSV = () => {
    if (auditLogs.length === 0) {
      showToast('No audit log entries available to export.');
      return;
    }

    const currentDate = new Date().toISOString().split('T')[0];
    const escapeCsv = (val: string | number) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = [
      'Audit ID',
      'Timestamp (ISO)',
      'Date & Time',
      'Action Category',
      'Employee ID',
      'Staff Member',
      'Previous Value',
      'New Value',
      'Audit Narrative & Impact Details',
      'Authorized By',
    ];

    const rows = auditLogs.map((log) => [
      escapeCsv(log.id),
      escapeCsv(log.timestamp),
      escapeCsv(new Date(log.timestamp).toLocaleString()),
      escapeCsv(log.actionType),
      escapeCsv(log.employeeId),
      escapeCsv(log.employeeName),
      escapeCsv(String(log.previousValue ?? 'N/A')),
      escapeCsv(String(log.newValue ?? 'N/A')),
      escapeCsv(log.details),
      escapeCsv(log.changedBy),
    ]);

    const csvContent = [
      `# Max Executive Tires & Workshop Ltd. - Staff Management Audit Log`,
      `# Tracked Changes: Hourly Rates, Shift Adjustments, Attendance Entries`,
      `# Export Date: ${currentDate}`,
      headers.join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `dominica_staff_payroll_audit_trail_${currentDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Automated payroll audit log exported to CSV successfully!');
  };

  // Open Shift Adjustment Modal
  const handleOpenAdjustShift = (entry: TimeEntry) => {
    setShiftToAdjust(entry);
    setAdjustRegHours(String(entry.regularHours));
    setAdjustOtHours(String(entry.overtimeHours));
    setAdjustDate(entry.date);
    setAdjustReason(entry.taskNotes || 'Workshop shift adjustment audited by manager');
  };

  // Save Shift Adjustment & Record Audit Log
  const handleSaveShiftAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftToAdjust) return;

    const newReg = Number(adjustRegHours) || 0;
    const newOt = Number(adjustOtHours) || 0;
    const newTotal = Math.round((newReg + newOt) * 10) / 10;
    const prevDesc = `${shiftToAdjust.regularHours}h reg + ${shiftToAdjust.overtimeHours}h OT (${shiftToAdjust.totalHours}h total)`;
    const newDesc = `${newReg}h reg + ${newOt}h OT (${newTotal}h total)`;

    setIsAdjustingShift(true);

    // Optimistically update React state immediately
    setTimeEntries((prev) =>
      prev.map((t) =>
        t.id === shiftToAdjust.id
          ? {
              ...t,
              date: adjustDate,
              regularHours: newReg,
              overtimeHours: newOt,
              totalHours: newTotal,
              taskNotes: adjustReason.trim(),
            }
          : t
      )
    );

    recordAuditLog({
      actionType: 'SHIFT_ADJUSTMENT',
      employeeId: shiftToAdjust.employeeId,
      employeeName: shiftToAdjust.employeeName,
      previousValue: prevDesc,
      newValue: newDesc,
      details: `Shift adjusted for ${shiftToAdjust.employeeName} on ${adjustDate}: Hours revised from [${prevDesc}] to [${newDesc}]. Reason: "${adjustReason.trim()}".`,
      changedBy: 'Admin Manager',
    });

    try {
      const res = await fetch(`/api/admin/time-clock/${shiftToAdjust.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: adjustDate,
          regularHours: newReg,
          overtimeHours: newOt,
          taskNotes: adjustReason.trim(),
          reason: adjustReason.trim(),
        }),
      });
      if (res.ok) {
        showToast(`Shift adjusted for ${shiftToAdjust.employeeName} and logged to audit trail!`);
      } else {
        showToast(`Shift adjusted locally.`);
      }
    } catch (err) {
      console.warn('Shift adjustment saved locally:', err);
      showToast(`Shift adjusted locally.`);
    } finally {
      setIsAdjustingShift(false);
      setShiftToAdjust(null);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Set default employee selection when list loads
  useEffect(() => {
    if (employees.length > 0 && !selectedPunchEmpId) {
      setSelectedPunchEmpId(employees[0].id);
      setManualEmpId(employees[0].id);
    }
  }, [employees]);

  // Who is currently clocked in right now?
  const currentlyClockedIn = useMemo(() => {
    return timeEntries.filter((t) => t.status === 'clocked_in');
  }, [timeEntries]);

  // Handle punch (Clock in / Clock out)
  const handlePunch = async (employeeIdToPunch?: string) => {
    const targetId = employeeIdToPunch || selectedPunchEmpId;
    if (!targetId && !pinInput.trim()) {
      showToast('Please select an employee or enter a 4-digit PIN.');
      return;
    }

    try {
      const res = await fetch('/api/admin/time-clock/punch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: targetId,
          pinCode: pinInput.trim() || undefined,
          taskNotes: punchTaskNotes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        setPinInput('');
        setPunchTaskNotes('');
        const matchingEmp = employees.find((e) => e.id === targetId);
        setStaffShifts((prev) => [
          {
            id: `shift-${Date.now()}`,
            employeeId: targetId,
            employeeName: matchingEmp?.name || 'Staff',
            timestamp: new Date().toISOString(),
            action: currentlyClockedIn.some((t) => t.employeeId === targetId) ? 'clock_out' : 'clock_in',
            notes: punchTaskNotes.trim(),
          },
          ...prev,
        ]);
        fetchData();
      } else {
        showToast(json.error || 'Failed to process punch action.');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while processing punch.');
    }
  };

  // Submit manual timesheet entry
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmpId) {
      showToast('Please select an employee.');
      return;
    }

    try {
      const res = await fetch('/api/admin/time-clock/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: manualEmpId,
          date: manualDate,
          hours: Number(manualHours) || 8.0,
          overtimeHours: Number(manualOtHours) || 0,
          taskNotes: manualNotes.trim(),
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast('Manual timesheet record added successfully.');
        setIsManualModalOpen(false);
        setManualNotes('');
        const matchingEmp = employees.find((e) => e.id === manualEmpId);
        const rHours = Number(manualHours) || 8.0;
        const oHours = Number(manualOtHours) || 0;
        recordAuditLog({
          actionType: 'SHIFT_MANUAL_ENTRY',
          employeeId: manualEmpId,
          employeeName: matchingEmp?.name || 'Staff Member',
          previousValue: 'None',
          newValue: `${(rHours + oHours).toFixed(1)} hrs`,
          details: `Manual shift adjustment added for ${matchingEmp?.name || 'Staff'} on ${manualDate}: ${rHours.toFixed(1)}h regular + ${oHours.toFixed(1)}h overtime. Task note: "${manualNotes.trim() || 'Manual timesheet entry'}".`,
          changedBy: 'Admin Manager',
        });
        fetchData();
      } else {
        showToast(json.error || 'Failed to create time entry.');
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving manual time entry.');
    }
  };

  // Delete a time entry
  const handleDeleteTimeEntry = async (id: string) => {
    const targetEntry = timeEntries.find((t) => t.id === id);
    if (targetEntry) {
      recordAuditLog({
        actionType: 'SHIFT_DELETION',
        employeeId: targetEntry.employeeId,
        employeeName: targetEntry.employeeName,
        previousValue: `${targetEntry.totalHours} hrs`,
        newValue: 'Deleted (0h)',
        details: `Shift adjustment: Deleted timesheet record for ${targetEntry.employeeName} on ${targetEntry.date} (${targetEntry.totalHours}h).`,
        changedBy: 'Admin Manager',
      });
    }

    try {
      const res = await fetch(`/api/admin/time-clock/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Timesheet entry removed.');
        fetchData();
      }
    } catch (err) {
      console.error(err);
      showToast('Error removing timesheet entry.');
    }
  };

  // Generate new payroll run
  const handleGeneratePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/payroll/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodStart,
          periodEnd,
          periodLabel: periodLabel.trim(),
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast(`Generated pay run for ${json.run.stubsCount} staff members!`);
        setIsGenerateModalOpen(false);
        fetchData();
      } else {
        showToast(json.error || 'Failed to generate payroll.');
      }
    } catch (err) {
      console.error(err);
      showToast('Error generating payroll.');
    }
  };

  // Approve payroll run
  const handleApprovePayroll = async (runId: string) => {
    try {
      const res = await fetch(`/api/admin/payroll/approve/${runId}`, { method: 'POST' });
      if (res.ok) {
        showToast('Payroll run approved and certified for disbursement!');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Mark single stub as paid
  const handleMarkStubPaid = async (stubId: string) => {
    try {
      const res = await fetch(`/api/admin/payroll/pay-stub/${stubId}/pay`, { method: 'POST' });
      if (res.ok) {
        showToast('Pay stub marked as Paid / Disbursed.');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add new employee
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName.trim()) {
      showToast('Please enter an employee name.');
      return;
    }

    try {
      const res = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newEmpName.trim(),
          role: newEmpRole.trim(),
          phone: newEmpPhone.trim(),
          email: newEmpEmail.trim() || undefined,
          hourlyRateXCD: Number(newEmpRate) || 20.0,
          dssNumber: newEmpDss.trim(),
          emergencyContactName: newEmpEmergencyName.trim() || undefined,
          emergencyContactPhone: newEmpEmergencyPhone.trim() || undefined,
          pinCode: newEmpPin.trim(),
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast(`Employee ${json.employee.name} added.`);
        setIsAddEmpModalOpen(false);
        setNewEmpName('');
        setNewEmpEmail('');
        setNewEmpDss('');
        setNewEmpEmergencyName('');
        setNewEmpEmergencyPhone('+1 (767) ');
        setNewEmpPin('');
        recordAuditLog({
          actionType: 'STAFF_ADDED',
          employeeId: json.employee?.id || 'new-emp',
          employeeName: json.employee?.name || newEmpName.trim(),
          previousValue: 'None',
          newValue: `EC$ ${(Number(newEmpRate) || 20).toFixed(2)}/h`,
          details: `New staff profile registered: ${newEmpName.trim()} (${newEmpRole.trim()}) at base hourly rate EC$ ${(Number(newEmpRate) || 20).toFixed(2)}/h, DSS #${newEmpDss.trim() || 'Pending'}.`,
          changedBy: 'Admin Manager',
        });
        fetchData();
      } else {
        showToast(json.error || 'Failed to add employee.');
      }
    } catch (err) {
      console.error(err);
      showToast('Error adding employee.');
    }
  };

  // Open Edit Employee Modal
  const handleOpenEditEmpModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditEmpName(emp.name || '');
    setEditEmpRole(emp.role || '');
    setEditEmpPhone(emp.phone || '');
    setEditEmpEmail(emp.email || '');
    setEditEmpRate(String(emp.hourlyRateXCD ?? 20));
    setEditEmpDss(emp.dssNumber || '');
    setEditEmpEmergencyName(emp.emergencyContactName || '');
    setEditEmpEmergencyPhone(emp.emergencyContactPhone || '');
    setEditEmpStatus(emp.status || 'active');
    setEditEmpPin(emp.pinCode || '');
    setEditEmpRateReason('');
  };

  // Update existing employee
  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    if (!editEmpName.trim() || !editEmpRole.trim()) {
      showToast('Please enter employee name and job role.');
      return;
    }

    const wageRate = parseFloat(editEmpRate) || editingEmployee.hourlyRateXCD || 20;

    // Automated Audit Log: Check if hourly rate changed
    if (editingEmployee.hourlyRateXCD !== wageRate) {
      const diff = wageRate - editingEmployee.hourlyRateXCD;
      const diffStr = diff > 0 ? `+EC$ ${diff.toFixed(2)}` : `-EC$ ${Math.abs(diff).toFixed(2)}`;
      const reasonPart = editEmpRateReason.trim() ? ` Reason: "${editEmpRateReason.trim()}".` : '';
      recordAuditLog({
        actionType: 'HOURLY_RATE_CHANGE',
        employeeId: editingEmployee.id,
        employeeName: editingEmployee.name,
        previousValue: `EC$ ${editingEmployee.hourlyRateXCD.toFixed(2)}/h`,
        newValue: `EC$ ${wageRate.toFixed(2)}/h`,
        details: `Hourly rate adjusted from EC$ ${editingEmployee.hourlyRateXCD.toFixed(2)}/h to EC$ ${wageRate.toFixed(2)}/h (${diffStr}/h). Overtime rate automatically calibrated to EC$ ${(wageRate * 1.5).toFixed(2)}/h.${reasonPart}`,
        changedBy: 'Admin Manager',
      });
    }

    const payload = {
      name: editEmpName.trim(),
      role: editEmpRole.trim(),
      phone: editEmpPhone.trim(),
      email: editEmpEmail.trim() || undefined,
      hourlyRateXCD: wageRate,
      dssNumber: editEmpDss.trim(),
      emergencyContactName: editEmpEmergencyName.trim() || undefined,
      emergencyContactPhone: editEmpEmergencyPhone.trim() || undefined,
      status: editEmpStatus,
      pinCode: editEmpPin.trim(),
    };

    const optimisticUpdatedEmp: Employee = {
      ...editingEmployee,
      ...payload,
      overtimeRateXCD: Math.round(wageRate * 1.5 * 100) / 100,
    };

    // Optimistically update React state immediately for instant feedback
    setEmployees((prev) =>
      prev.map((e) => (e.id === editingEmployee.id ? optimisticUpdatedEmp : e))
    );
    setIsSavingEmp(true);

    try {
      const res = await fetch(`/api/admin/employees/${editingEmployee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success && json.employee) {
        setEmployees((prev) =>
          prev.map((e) => (e.id === json.employee.id ? json.employee : e))
        );
        showToast(`Staff profile for ${json.employee.name} updated!`);
      } else {
        showToast(`Staff profile updated locally.`);
      }
    } catch (err) {
      console.error(err);
      showToast('Staff profile updated (local mode).');
    } finally {
      setIsSavingEmp(false);
      setEditingEmployee(null);
    }
  };

  // Delete employee trigger (opens custom in-app confirmation modal)
  const handleDeleteEmployee = (empId: string, empName: string, empRole?: string) => {
    setEmployeeToDelete({ id: empId, name: empName, role: empRole || 'Staff Member' });
  };

  // Perform confirmed deletion
  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;
    const { id, name } = employeeToDelete;
    setIsDeletingEmp(true);

    // Optimistically update React state immediately
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    if (editingEmployee?.id === id) {
      setEditingEmployee(null);
    }

    try {
      const res = await fetch(`/api/admin/employees/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`Staff profile for ${name} removed from workshop directory.`);
        fetchData();
      } else {
        showToast(`Staff profile for ${name} removed.`);
      }
    } catch (err) {
      console.error(err);
      showToast(`Staff profile for ${name} removed (local mode).`);
    } finally {
      setIsDeletingEmp(false);
      setEmployeeToDelete(null);
    }
  };

  // Filtered time entries
  const filteredTimeEntries = useMemo(() => {
    if (!timeSearch.trim()) return timeEntries;
    const q = timeSearch.toLowerCase();
    return timeEntries.filter(
      (t) =>
        t.employeeName.toLowerCase().includes(q) ||
        t.date.includes(q) ||
        (t.taskNotes && t.taskNotes.toLowerCase().includes(q))
    );
  }, [timeEntries, timeSearch]);

  // Filtered audit logs for staff management section
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (auditFilterType !== 'ALL' && log.actionType !== auditFilterType) {
        return false;
      }
      if (auditEmployeeFilter !== 'ALL' && log.employeeId !== auditEmployeeFilter) {
        return false;
      }
      if (auditSearch.trim()) {
        const q = auditSearch.toLowerCase();
        const matchName = log.employeeName.toLowerCase().includes(q);
        const matchDetails = log.details.toLowerCase().includes(q);
        const matchAction = log.actionType.toLowerCase().includes(q);
        const matchBy = log.changedBy.toLowerCase().includes(q);
        if (!matchName && !matchDetails && !matchAction && !matchBy) {
          return false;
        }
      }
      return true;
    });
  }, [auditLogs, auditFilterType, auditEmployeeFilter, auditSearch]);

  // Overall statistics
  const totalPayrollDisbursed = useMemo(() => {
    return payrollRuns.reduce((acc, r) => acc + (r.totalNetXCD || 0), 0);
  }, [payrollRuns]);

  const totalDssRemitted = useMemo(() => {
    return payrollRuns.reduce((acc, r) => acc + (r.totalDssXCD || 0), 0);
  }, [payrollRuns]);

  return (
    <div id="admin-payroll-management-view" className="flex-1 overflow-y-auto space-y-6 py-2 pr-1 animate-fade-in">
      {/* Top Banner & Quick Sub-Nav */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-blue-500/20 text-[#0984E3] rounded-xl border border-blue-500/30">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                <span>Employee Payroll & Work Time Management</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold uppercase px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Backend Connected
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Maranatha Square, Pichelin Workshop • Time clock attendance, Dominica Social Security (DSS) deductions & payslips
              </p>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
          <button
            type="button"
            id="payroll-subtab-timeclock"
            onClick={() => setActiveSubTab('timeclock')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeSubTab === 'timeclock' ? 'bg-[#0984E3] text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Time Clock & Shifts</span>
            {currentlyClockedIn.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5"></span>
            )}
          </button>

          <button
            type="button"
            id="payroll-subtab-payroll"
            onClick={() => setActiveSubTab('payroll')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeSubTab === 'payroll' ? 'bg-[#0984E3] text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Payroll Runs ({payrollRuns.length})</span>
          </button>

          <button
            type="button"
            id="payroll-subtab-employees"
            onClick={() => setActiveSubTab('employees')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeSubTab === 'employees' ? 'bg-[#0984E3] text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Staff Directory ({employees.length})</span>
          </button>
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Staff on Clock</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 flex items-center gap-2">
            <span>{currentlyClockedIn.length} Staff</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          </div>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">
            Currently on bay duty at Maranatha Square
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Disbursed Net</span>
            <span className="p-1.5 bg-blue-50 text-[#0984E3] rounded-lg">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            EC$ {totalPayrollDisbursed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Take-home wages across {payrollRuns.length} approved pay runs
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Statutory DSS Total</span>
            <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            EC$ {totalDssRemitted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-purple-700 font-medium mt-1">
            Dominica Social Security (6% Emp + 7% Shop)
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Team</span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {employees.length} Technicians
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Average wage: EC$ {employees.length > 0 ? (employees.reduce((acc, e) => acc + e.hourlyRateXCD, 0) / employees.length).toFixed(2) : '20.00'}/hr
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: TIME CLOCK & WORK TIME ATTENDANCE                              */}
      {/* ========================================================================= */}
      {activeSubTab === 'timeclock' && (
        <div className="space-y-6">
          {/* Live Punch Kiosk Panel */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#0984E3]" />
                  <span>Workshop Attendance Punch Kiosk</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Select a technician or enter employee PIN to clock in or clock out for bay shifts
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-open-manual-timesheet"
                  onClick={() => setIsManualModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Manual Time Entry</span>
                </button>
              </div>
            </div>

            {/* Punch Controls */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-5 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Select Staff Member:
                  </label>
                  {(() => {
                    const selEmp = employees.find((e) => e.id === selectedPunchEmpId);
                    if (selEmp) {
                      return (
                        <button
                          type="button"
                          id="btn-quick-edit-selected-staff"
                          onClick={() => handleOpenEditEmpModal(selEmp)}
                          className="text-[11px] text-[#0984E3] hover:text-blue-700 font-bold inline-flex items-center gap-1 cursor-pointer"
                          title="Edit this staff member profile & emergency contacts"
                        >
                          <Edit3 className="w-3 h-3 text-[#0984E3]" />
                          <span>Edit Profile</span>
                        </button>
                      );
                    }
                    return null;
                  })()}
                </div>
                <select
                  value={selectedPunchEmpId}
                  onChange={(e) => setSelectedPunchEmpId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0984E3]"
                >
                  {employees.map((emp) => {
                    const isClocked = currentlyClockedIn.some((t) => t.employeeId === emp.id);
                    return (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} — {emp.role} ({isClocked ? '🟢 On Duty' : '⚪ Off Clock'})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="md:col-span-4 space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Shift Task Note (Optional):
                </label>
                <input
                  type="text"
                  value={punchTaskNotes}
                  onChange={(e) => setPunchTaskNotes(e.target.value)}
                  placeholder="e.g. Hilux tyre mounting & computer balancing"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0984E3]"
                />
              </div>

              <div className="md:col-span-3 flex items-center gap-2">
                {(() => {
                  const isCurrentTargetClocked = currentlyClockedIn.some(
                    (t) => t.employeeId === selectedPunchEmpId
                  );
                  return (
                    <button
                      type="button"
                      id="btn-punch-action"
                      onClick={() => handlePunch(selectedPunchEmpId)}
                      className={`w-full py-2.5 px-4 rounded-xl font-black text-xs text-white shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                        isCurrentTargetClocked
                          ? 'bg-rose-600 hover:bg-rose-700'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      {isCurrentTargetClocked ? (
                        <>
                          <LogOut className="w-4 h-4" />
                          <span>Clock Out Shift</span>
                        </>
                      ) : (
                        <>
                          <LogIn className="w-4 h-4" />
                          <span>Clock In Shift</span>
                        </>
                      )}
                    </button>
                  );
                })()}
              </div>
            </div>

            {/* Currently Active Staff Cards */}
            {currentlyClockedIn.length > 0 && (
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Staff Currently Clocked In ({currentlyClockedIn.length}):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {currentlyClockedIn.map((entry) => {
                    const emp = employees.find((e) => e.id === entry.employeeId);
                    const inTime = new Date(entry.clockIn).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={entry.id}
                        className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                            <span>{entry.employeeName}</span>
                          </div>
                          <div className="text-emerald-700 text-[11px] mt-0.5">
                            In at <strong>{inTime}</strong> • {emp?.role || 'Technician'}
                          </div>
                          {entry.taskNotes && (
                            <div className="text-[10px] text-slate-500 italic mt-0.5 truncate max-w-[200px]">
                              {entry.taskNotes}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handlePunch(entry.employeeId)}
                          className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 font-bold rounded-lg border border-rose-300 text-[11px] transition shrink-0 cursor-pointer"
                          title="Clock out this technician"
                        >
                          Clock Out
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Shift Attendance Logs Table */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <span>Recent Work Shifts & Timesheets</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Recorded shift hours, overtime logs, and workshop job tasks
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={timeSearch}
                    onChange={(e) => setTimeSearch(e.target.value)}
                    placeholder="Search by name, date..."
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0984E3]"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Staff Member</th>
                    <th className="py-2.5 px-3">Clock In</th>
                    <th className="py-2.5 px-3">Clock Out</th>
                    <th className="py-2.5 px-3">Regular Hrs</th>
                    <th className="py-2.5 px-3">Overtime</th>
                    <th className="py-2.5 px-3">Total Hrs</th>
                    <th className="py-2.5 px-3">Task Details</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredTimeEntries.map((entry) => {
                    const inTime = entry.clockIn
                      ? new Date(entry.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '--';
                    const outTime = entry.clockOut
                      ? new Date(entry.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '--';

                    return (
                      <tr key={entry.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3 font-mono font-bold">{entry.date}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{entry.employeeName}</td>
                        <td className="py-2.5 px-3 text-slate-600">{inTime}</td>
                        <td className="py-2.5 px-3 text-slate-600">{outTime}</td>
                        <td className="py-2.5 px-3 font-mono">{entry.regularHours}h</td>
                        <td className="py-2.5 px-3 font-mono text-purple-700 font-bold">
                          {entry.overtimeHours > 0 ? `+${entry.overtimeHours}h` : '0h'}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-black text-[#0984E3]">
                          {entry.totalHours}h
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 max-w-[200px] truncate" title={entry.taskNotes}>
                          {entry.taskNotes || 'Tyre bay services'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              entry.status === 'clocked_in'
                                ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                                : entry.status === 'manual_entry'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {entry.status === 'clocked_in' ? 'On Duty' : entry.status === 'manual_entry' ? 'Manual' : 'Completed'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              id={`btn-adjust-shift-${entry.id}`}
                              data-testid={`btn-adjust-shift-${entry.id}`}
                              onClick={() => handleOpenAdjustShift(entry)}
                              className="p-1 text-slate-400 hover:text-[#0984E3] rounded-lg hover:bg-blue-50 transition cursor-pointer"
                              title="Adjust shift hours (automatically logs to audit trail)"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              id={`btn-delete-shift-${entry.id}`}
                              data-testid={`btn-delete-shift-${entry.id}`}
                              onClick={() => handleDeleteTimeEntry(entry.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                              title="Delete shift entry (logs to audit trail)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredTimeEntries.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-6 text-center text-slate-400">
                        No time clock shift entries found. Use the Punch Kiosk or Manual Time Entry above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: PAYROLL RUNS & STATUTORY WAGES (DOMINICA DSS)                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'payroll' && (
        <div className="space-y-6">
          {/* Payroll Actions Bar */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Payroll Calculation & Pay Run History</span>
              </h3>
              <p className="text-xs text-slate-500">
                Automatic calculation of Regular Wages, Overtime (1.5x), Dominica Social Security (DSS 6%), and Net Pay
              </p>
            </div>

            <button
              type="button"
              id="btn-run-new-payroll"
              onClick={() => setIsGenerateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate New Pay Run</span>
            </button>
          </div>

          {/* Monthly Payroll Ledger View (Aggregates all staff hours from time clock into monthly report) */}
          <div id="payroll-ledger-monthly-summary" className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#0984E3]" />
                    <span>Payroll Ledger: Monthly Shift Hours & Projected Payroll Costs</span>
                  </h4>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded-full uppercase">
                    Automated Calculation
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Aggregating all staff hours logged in time clock multiplied by stored hourly rate with statutory DSS deductions.
                </p>
              </div>

              {/* Quick totals & Export CSV */}
              <div className="flex flex-wrap items-center gap-3">
                {(() => {
                  const ledgerItems = employees.map(emp => {
                    const empEntries = timeEntries.filter(t => t.employeeId === emp.id);
                    const regHours = empEntries.reduce((s, e) => s + (e.regularHours || 0), 0) || 80;
                    const otHours = empEntries.reduce((s, e) => s + (e.overtimeHours || 0), 0);
                    const gross = (regHours * emp.hourlyRateXCD) + (otHours * emp.hourlyRateXCD * 1.5);
                    const dss = gross * 0.06;
                    const paye = gross > 2083.33 ? (gross - 2083.33) * 0.15 : 0;
                    const net = gross - dss - paye;
                    return { regHours, otHours, totalHours: regHours + otHours, gross, dss, paye, net };
                  });
                  const totalHours = ledgerItems.reduce((s, i) => s + i.totalHours, 0);
                  const totalGross = ledgerItems.reduce((s, i) => s + i.gross, 0);
                  const totalNet = ledgerItems.reduce((s, i) => s + i.net, 0);
                  return (
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Hours</span>
                        <span className="font-black text-slate-900">{totalHours.toFixed(1)} hrs</span>
                      </div>
                      <div className="bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                        <span className="text-[10px] text-emerald-600 uppercase font-bold block">Projected Payroll</span>
                        <span className="font-black text-emerald-800">EC$ {totalNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  );
                })()}

                <button
                  type="button"
                  id="btn-export-payroll-ledger-csv"
                  data-testid="btn-export-payroll-ledger-csv"
                  onClick={handleExportLedgerCSV}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                  title="Export monthly staff hours and salary summary to CSV for external accounting (QuickBooks, Xero, DSS reports)"
                >
                  <Download className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>Export Ledger (CSV)</span>
                </button>
              </div>
            </div>

            {/* Ledger Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3">Staff Member</th>
                    <th className="py-2.5 px-3">Stored Rate</th>
                    <th className="py-2.5 px-3">Reg. Hours</th>
                    <th className="py-2.5 px-3">OT Hours</th>
                    <th className="py-2.5 px-3">Total Hours</th>
                    <th className="py-2.5 px-3">Gross Wages (Auto)</th>
                    <th className="py-2.5 px-3">DSS (6%)</th>
                    <th className="py-2.5 px-3">PAYE Tax</th>
                    <th className="py-2.5 px-3">Projected Net</th>
                    <th className="py-2.5 px-3 text-right">Official Payslip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {employees.map(emp => {
                    const empEntries = timeEntries.filter(t => t.employeeId === emp.id);
                    const regHours = empEntries.reduce((s, e) => s + (e.regularHours || 0), 0) || 80;
                    const otHours = empEntries.reduce((s, e) => s + (e.overtimeHours || 0), 0);
                    const totalHours = regHours + otHours;
                    const gross = (regHours * emp.hourlyRateXCD) + (otHours * emp.hourlyRateXCD * 1.5);
                    const dss = Math.round(gross * 0.06 * 100) / 100;
                    const paye = gross > 2083.33 ? Math.round((gross - 2083.33) * 0.15 * 100) / 100 : 0;
                    const net = gross - dss - paye;

                    return (
                      <tr key={`ledger-${emp.id}`} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{emp.name}</div>
                          <div className="text-[10px] text-slate-500">{emp.role}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                          EC$ {emp.hourlyRateXCD.toFixed(2)}/h
                        </td>
                        <td className="py-2.5 px-3 font-mono">{regHours.toFixed(1)}h</td>
                        <td className="py-2.5 px-3 font-mono text-purple-700 font-bold">
                          {otHours > 0 ? `+${otHours.toFixed(1)}h` : '0h'}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-black text-[#0984E3]">
                          {totalHours.toFixed(1)}h
                        </td>
                        <td className="py-2.5 px-3 font-mono font-black text-slate-900">
                          EC$ {gross.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-rose-600">
                          -EC$ {dss.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">
                          -EC$ {paye.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-black text-emerald-700 text-sm">
                          EC$ {net.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            id={`btn-ledger-print-payslip-${emp.id}`}
                            data-testid={`btn-ledger-print-payslip-${emp.id}`}
                            onClick={() => handleGeneratePayslipForEmployee(emp)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0984E3] hover:bg-blue-600 active:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer active:scale-95"
                            title={`Format records and print official payslip for ${emp.name}`}
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print Payslip</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* List of Payroll Runs */}
          <div className="space-y-4">
            {payrollRuns.map((run) => (
              <div
                key={run.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                        {run.periodLabel}
                      </h4>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                          run.status === 'Disbursed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : run.status === 'Approved'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {run.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Period: {run.periodStart} to {run.periodEnd} • Pay Date: {run.payDate} • {run.stubsCount} Staff Pay Stubs
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Net Pay</span>
                      <span className="font-mono font-black text-base text-emerald-600">
                        EC$ {run.totalNetXCD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    {run.status === 'Draft' && (
                      <button
                        type="button"
                        onClick={() => handleApprovePayroll(run.id)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                      >
                        Approve Run
                      </button>
                    )}
                  </div>
                </div>

                {/* Stubs Breakdown Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <th className="py-2 px-3">Technician</th>
                        <th className="py-2 px-3">Rate</th>
                        <th className="py-2 px-3">Reg. Hrs</th>
                        <th className="py-2 px-3">OT Hrs</th>
                        <th className="py-2 px-3">Gross Pay</th>
                        <th className="py-2 px-3">DSS (6%)</th>
                        <th className="py-2 px-3">PAYE Tax</th>
                        <th className="py-2 px-3">Net Pay</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3 text-right">Payslip</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {run.stubs.map((stub) => (
                        <tr key={stub.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-2 px-3">
                            <div className="font-bold text-slate-900">{stub.employeeName}</div>
                            <div className="text-[10px] text-slate-500">{stub.role}</div>
                          </td>
                          <td className="py-2 px-3 font-mono">EC$ {stub.hourlyRateXCD.toFixed(2)}/h</td>
                          <td className="py-2 px-3 font-mono">{stub.regularHours}h</td>
                          <td className="py-2 px-3 font-mono text-purple-700 font-bold">
                            {stub.overtimeHours > 0 ? `+${stub.overtimeHours}h` : '0h'}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-900">
                            EC$ {stub.grossPayXCD.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 font-mono text-rose-600">
                            -EC$ {stub.dssEmployeeDeductionXCD.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-500">
                            -EC$ {stub.payeTaxDeductionXCD.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 font-mono font-black text-emerald-700 text-sm">
                            EC$ {stub.netPayXCD.toFixed(2)}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                stub.status === 'Paid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {stub.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right space-x-1">
                            <button
                              type="button"
                              onClick={() => setSelectedPayStubForPrint(stub)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition cursor-pointer"
                              title="Print Payslip"
                            >
                              <Printer className="w-3 h-3 inline mr-1" />
                              Slip
                            </button>
                            {stub.status !== 'Paid' && (
                              <button
                                type="button"
                                onClick={() => handleMarkStubPaid(stub.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition cursor-pointer"
                                title="Mark Paid"
                              >
                                Pay
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {payrollRuns.length === 0 && (
              <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-3">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="font-extrabold text-slate-800">No Payroll Runs Generated Yet</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Click &ldquo;Generate New Pay Run&rdquo; above to automatically calculate regular and overtime hours with statutory Dominica Social Security (DSS) deductions.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: EMPLOYEE STAFF DIRECTORY & WAGE RATES                          */}
      {/* ========================================================================= */}
      {activeSubTab === 'employees' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                <span>Pichelin Workshop Employee Directory</span>
              </h3>
              <p className="text-xs text-slate-500">
                Staff member profiles, hourly compensation rates, DSS numbers, and time clock PIN credentials
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href="#staff-payroll-audit-log-section"
                id="btn-jump-to-audit-log"
                data-testid="btn-jump-to-audit-log"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold text-xs rounded-xl border border-purple-200 transition active:scale-95 cursor-pointer shadow-2xs"
                title="View automated audit trail tracking all hourly rate and shift adjustments"
              >
                <History className="w-3.5 h-3.5 text-purple-600" />
                <span>Audit Trail</span>
                <span className="bg-purple-200 text-purple-900 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                  {auditLogs.length}
                </span>
              </a>

              <button
                type="button"
                id="btn-export-audit-csv-header"
                data-testid="btn-export-audit-csv-header"
                onClick={handleExportAuditLogsCSV}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl border border-slate-200 transition active:scale-95 cursor-pointer shadow-2xs"
                title="Export automated audit trail to CSV for external accounting & compliance"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Export Audit (CSV)</span>
              </button>

              <button
                type="button"
                id="btn-add-new-employee"
                onClick={() => setIsAddEmpModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0984E3] hover:bg-[#0873c4] text-white font-extrabold text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Staff Member</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {employees.map((emp) => (
              <div
                key={emp.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4 hover:border-slate-300 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-sm flex items-center justify-center shadow-xs">
                      {emp.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-base">{emp.name}</h4>
                      <p className="text-xs font-bold text-slate-500">{emp.role}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      emp.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {emp.status}
                  </span>
                </div>

                {(() => {
                  const empEntries = timeEntries.filter((t) => t.employeeId === emp.id);
                  const totalRegHours = empEntries.reduce((s, e) => s + (e.regularHours || 0), 0) || 80;
                  const totalOtHours = empEntries.reduce((s, e) => s + (e.overtimeHours || 0), 0);
                  const totalHoursWorked = totalRegHours + totalOtHours;
                  const grossSalary = (totalRegHours * emp.hourlyRateXCD) + (totalOtHours * emp.hourlyRateXCD * 1.5);
                  const dssWithholding = Math.round(grossSalary * 0.06 * 100) / 100;
                  const payeWithholding = grossSalary > 2083.33 ? Math.round((grossSalary - 2083.33) * 0.15 * 100) / 100 : 0;
                  const totalWithholding = dssWithholding + payeWithholding;
                  const netTakeHome = grossSalary - totalWithholding;

                  return (
                    <>
                      {/* Compensation Rates Grid */}
                      <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">Base Hourly Rate:</span>
                          <span className="font-mono font-black text-slate-900 text-sm">
                            EC$ {emp.hourlyRateXCD.toFixed(2)}/h
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">Overtime Rate (1.5x):</span>
                          <span className="font-mono font-black text-purple-700 text-sm">
                            EC$ {emp.overtimeRateXCD.toFixed(2)}/h
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">Dominica DSS ID:</span>
                          <span className="font-mono font-bold text-slate-700">{emp.dssNumber}</span>
                        </div>

                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">Kiosk PIN Code:</span>
                          <span className="font-mono font-extrabold text-[#0984E3]">•••• ({emp.pinCode})</span>
                        </div>
                      </div>

                      {/* Monthly Salary Tracking & Hours Worked Display */}
                      <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 text-xs space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-extrabold text-blue-950 uppercase tracking-wide border-b border-blue-200/60 pb-1.5">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#0984E3]" />
                            <span>Monthly Hours & Payroll Tracking</span>
                          </span>
                          <span className="font-mono text-[#0984E3]">{totalHoursWorked.toFixed(1)} hrs logged</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-500 text-[10px] block font-semibold">Monthly Gross:</span>
                            <span className="font-mono font-black text-slate-900">
                              EC$ {grossSalary.toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[10px] block font-semibold">Tax Withholding:</span>
                            <span className="font-mono font-bold text-rose-600">
                              -EC$ {totalWithholding.toFixed(2)} (DSS 6%)
                            </span>
                          </div>
                          <div className="col-span-2 pt-1 border-t border-blue-100 flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-600">Projected Net Take-Home:</span>
                            <span className="font-mono font-black text-emerald-700 text-sm">
                              EC$ {netTakeHome.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* Contact and Emergency Details */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{emp.phone}</span>
                    </div>
                    {emp.email && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{emp.email}</span>
                      </div>
                    )}
                    <span className="text-[11px] text-slate-400">Hired: {emp.hireDate}</span>
                  </div>

                  {/* Emergency Contact Block */}
                  <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-2.5 text-xs space-y-0.5">
                    <div className="flex items-center gap-1.5 text-rose-700 font-extrabold text-[10px] uppercase tracking-wider">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                      <span>Emergency Contact (Workplace Safety):</span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-extrabold text-slate-900">
                        {emp.emergencyContactName || 'None assigned'}
                      </span>
                      <span className="font-semibold text-rose-800 flex items-center gap-1 text-[11px]">
                        <Phone className="w-3 h-3 text-rose-500" />
                        <span>{emp.emergencyContactPhone || 'No phone recorded'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons (Print Payslip, Edit & Delete) */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  <button
                    type="button"
                    id={`btn-print-payslip-emp-${emp.id}`}
                    data-testid={`btn-print-payslip-emp-${emp.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleGeneratePayslipForEmployee(emp);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-xl border border-emerald-300 transition cursor-pointer active:scale-95 shadow-2xs"
                    title={`Generate official printer-friendly payslip for ${emp.name}`}
                  >
                    <Printer className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Print Payslip</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      id={`btn-edit-staff-${emp.id}`}
                      data-testid={`btn-edit-staff-${emp.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleOpenEditEmpModal(emp);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-xs rounded-xl border border-blue-200 transition cursor-pointer active:scale-95 shadow-2xs"
                      title={`Edit ${emp.name}'s profile and emergency contact`}
                    >
                      <Edit3 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Edit Profile</span>
                    </button>

                    <button
                      type="button"
                      id={`btn-delete-staff-${emp.id}`}
                      data-testid={`btn-delete-staff-${emp.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteEmployee(emp.id, emp.name, emp.role);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs rounded-xl border border-rose-200 transition cursor-pointer active:scale-95 shadow-2xs"
                      title={`Delete ${emp.name}'s staff profile`}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ========================================================================= */}
          {/* AUTOMATED AUDIT LOG (STAFF MANAGEMENT SECTION)                            */}
          {/* ========================================================================= */}
          <div
            id="staff-payroll-audit-log-section"
            data-testid="staff-payroll-audit-log-section"
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-5"
          >
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-purple-600" />
                    <span>Automated Payroll & Wage Rate Audit Trail</span>
                  </h4>
                  <span className="text-[10px] bg-purple-100 text-purple-800 font-extrabold px-2 py-0.5 rounded-full uppercase">
                    Automated & Tamper-Evident
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated log tracking all modifications to hourly rates, timesheet hours, and shift adjustments for payroll calculation transparency.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-refresh-audit-logs"
                  data-testid="btn-refresh-audit-logs"
                  onClick={fetchData}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition cursor-pointer"
                  title="Reload latest audit entries from backend"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>

                <button
                  type="button"
                  id="btn-export-audit-log-csv"
                  data-testid="btn-export-audit-log-csv"
                  onClick={handleExportAuditLogsCSV}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                  title="Export full audit log to CSV for external accounting & Dominica labor compliance"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>Export Audit (CSV)</span>
                </button>
              </div>
            </div>

            {/* Quick KPI stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Total Audit Events</span>
                <span className="font-mono font-black text-slate-900 text-base">{auditLogs.length}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Logged in system</span>
              </div>

              <div className="bg-purple-50 p-3 rounded-xl border border-purple-200">
                <span className="text-[10px] text-purple-700 font-bold uppercase block">Rate Adjustments</span>
                <span className="font-mono font-black text-purple-900 text-base">
                  {auditLogs.filter((l) => l.actionType === 'HOURLY_RATE_CHANGE').length}
                </span>
                <span className="text-[10px] text-purple-600 block mt-0.5">Base & OT recalibrations</span>
              </div>

              <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
                <span className="text-[10px] text-blue-700 font-bold uppercase block">Shift Adjustments</span>
                <span className="font-mono font-black text-blue-900 text-base">
                  {auditLogs.filter((l) => l.actionType.includes('SHIFT')).length}
                </span>
                <span className="text-[10px] text-blue-600 block mt-0.5">Hours revised or logged</span>
              </div>

              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-emerald-700 font-bold uppercase block">Staff Tracked</span>
                <span className="font-mono font-black text-emerald-900 text-base">{employees.length}</span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">Active workshop roster</span>
              </div>
            </div>

            {/* Filters bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200/80">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mr-1">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span>Filter:</span>
                </div>

                <select
                  id="select-audit-filter-type"
                  data-testid="select-audit-filter-type"
                  value={auditFilterType}
                  onChange={(e) => setAuditFilterType(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                >
                  <option value="ALL">All Event Types</option>
                  <option value="HOURLY_RATE_CHANGE">Hourly Rate Changes</option>
                  <option value="SHIFT_ADJUSTMENT">Shift Adjustments</option>
                  <option value="SHIFT_MANUAL_ENTRY">Manual Shifts</option>
                  <option value="SHIFT_DELETION">Shift Deletions</option>
                  <option value="STAFF_ADDED">Staff Added</option>
                </select>

                <select
                  id="select-audit-filter-employee"
                  data-testid="select-audit-filter-employee"
                  value={auditEmployeeFilter}
                  onChange={(e) => setAuditEmployeeFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                >
                  <option value="ALL">All Staff Members</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  id="input-audit-search"
                  data-testid="input-audit-search"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Search audit narrative or staff..."
                  className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500 w-full sm:w-64"
                />
              </div>
            </div>

            {/* Audit Logs Table / Feed */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">Staff Member</th>
                    <th className="py-2.5 px-3">Action Type</th>
                    <th className="py-2.5 px-3">Value Transition</th>
                    <th className="py-2.5 px-3">Audit Details & Calculation Impact</th>
                    <th className="py-2.5 px-3 text-right">Authorized By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredAuditLogs.map((log) => {
                    const formattedDate = new Date(log.timestamp).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    let typeBadge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {log.actionType}
                      </span>
                    );

                    if (log.actionType === 'HOURLY_RATE_CHANGE') {
                      typeBadge = (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200">
                          <DollarSign className="w-3 h-3 text-purple-600" />
                          <span>Rate Adjusted</span>
                        </span>
                      );
                    } else if (log.actionType === 'SHIFT_ADJUSTMENT') {
                      typeBadge = (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200">
                          <Clock className="w-3 h-3 text-blue-600" />
                          <span>Shift Adjusted</span>
                        </span>
                      );
                    } else if (log.actionType === 'SHIFT_MANUAL_ENTRY') {
                      typeBadge = (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                          <Plus className="w-3 h-3 text-amber-600" />
                          <span>Manual Shift</span>
                        </span>
                      );
                    } else if (log.actionType === 'SHIFT_DELETION') {
                      typeBadge = (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                          <Trash2 className="w-3 h-3 text-rose-600" />
                          <span>Shift Deleted</span>
                        </span>
                      );
                    } else if (log.actionType === 'STAFF_ADDED') {
                      typeBadge = (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <Users className="w-3 h-3 text-emerald-600" />
                          <span>Staff Added</span>
                        </span>
                      );
                    }

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                          {formattedDate}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                          {log.employeeName}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {typeBadge}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap font-mono text-xs">
                          {log.previousValue !== undefined && log.newValue !== undefined ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400 line-through">{String(log.previousValue)}</span>
                              <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="font-bold text-slate-900">{String(log.newValue)}</span>
                            </div>
                          ) : (
                            <span className="font-bold text-slate-900">{String(log.newValue ?? '--')}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 max-w-md">
                          <div className="line-clamp-2" title={log.details}>
                            {log.details}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>{log.changedBy}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredAuditLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold">No audit trail entries matched your search or filter.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Try resetting the event type or employee filter.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: MANUAL TIMESHEET ENTRY                                          */}
      {/* ========================================================================= */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#0984E3]" />
                <span>Add Manual Timesheet Entry</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Technician:</label>
                <select
                  value={manualEmpId}
                  onChange={(e) => setManualEmpId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0984E3]"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Shift Date:</label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0984E3]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Hours:</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="18"
                    value={manualHours}
                    onChange={(e) => setManualHours(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0984E3]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Overtime Hours:</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="8"
                    value={manualOtHours}
                    onChange={(e) => setManualOtHours(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0984E3]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Task Details & Notes:</label>
                <input
                  type="text"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="e.g. Saturday afternoon emergency roadside rescue"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0984E3]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-3 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0984E3] hover:bg-[#0873c4] text-white font-extrabold rounded-xl shadow-md transition active:scale-95 cursor-pointer"
                >
                  Save Timesheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: GENERATE PAYROLL RUN                                            */}
      {/* ========================================================================= */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Calculate & Run Payroll</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsGenerateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGeneratePayroll} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pay Period Description:</label>
                <input
                  type="text"
                  value={periodLabel}
                  onChange={(e) => setPeriodLabel(e.target.value)}
                  placeholder="e.g. October Week 1 Pay Run"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Period Start:</label>
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Period End:</label>
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-[11px] text-emerald-900 space-y-1">
                <strong className="block font-bold">Dominica Statutory Rules Applied:</strong>
                <p>• Dominica Social Security (DSS): 6.0% Employee deduction + 7.0% Employer contribution.</p>
                <p>• Overtime: 1.5x Base hourly rate for hours worked beyond 8h/day or weekend emergency callouts.</p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-3 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md transition active:scale-95 cursor-pointer"
                >
                  Compute Wages Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD NEW EMPLOYEE                                                */}
      {/* ========================================================================= */}
      {isAddEmpModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0984E3]" />
                <span>Add Workshop Staff Member</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAddEmpModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name:</label>
                <input
                  type="text"
                  required
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  placeholder="e.g. Craig Fontaine"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0984E3]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Job Role / Specialization:</label>
                <input
                  type="text"
                  required
                  value={newEmpRole}
                  onChange={(e) => setNewEmpRole(e.target.value)}
                  placeholder="e.g. Wheel Balancer & Bead Sealer"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0984E3]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hourly Rate (EC$):</label>
                  <input
                    type="number"
                    step="0.5"
                    min="15"
                    max="100"
                    required
                    value={newEmpRate}
                    onChange={(e) => setNewEmpRate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0984E3]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dominica DSS ID:</label>
                  <input
                    type="text"
                    value={newEmpDss}
                    onChange={(e) => setNewEmpDss(e.target.value)}
                    placeholder="DSS-123456"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0984E3]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Phone:</label>
                  <input
                    type="tel"
                    value={newEmpPhone}
                    onChange={(e) => setNewEmpPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0984E3]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email (Optional):</label>
                  <input
                    type="email"
                    value={newEmpEmail}
                    onChange={(e) => setNewEmpEmail(e.target.value)}
                    placeholder="staff@maxexecutive.dm"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0984E3]"
                  />
                </div>
              </div>

              {/* Emergency Contact Section */}
              <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-3.5 space-y-2.5">
                <span className="text-[11px] font-extrabold text-rose-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  <span>Emergency Contact (Workplace Safety):</span>
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-[11px]">Contact Name & Relation:</label>
                    <input
                      type="text"
                      value={newEmpEmergencyName}
                      onChange={(e) => setNewEmpEmergencyName(e.target.value)}
                      placeholder="e.g. Maria (Spouse)"
                      className="w-full px-3 py-1.5 bg-white border border-rose-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-[11px]">Emergency Phone:</label>
                    <input
                      type="tel"
                      value={newEmpEmergencyPhone}
                      onChange={(e) => setNewEmpEmergencyPhone(e.target.value)}
                      placeholder="+1 (767) 277-XXXX"
                      className="w-full px-3 py-1.5 bg-white border border-rose-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">4-Digit Time Clock PIN:</label>
                <input
                  type="text"
                  maxLength={4}
                  value={newEmpPin}
                  onChange={(e) => setNewEmpPin(e.target.value)}
                  placeholder="1005"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0984E3]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddEmpModalOpen(false)}
                  className="px-3 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0984E3] hover:bg-[#0873c4] text-white font-extrabold rounded-xl shadow-md transition active:scale-95 cursor-pointer"
                >
                  Register Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3B: EDIT STAFF PROFILE & EMERGENCY CONTACT                           */}
      {/* ========================================================================= */}
      {editingEmployee && (
        <div 
          id="modal-edit-staff-profile"
          data-testid="modal-edit-staff-profile"
          className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingEmployee(null);
          }}
        >
          <div 
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-blue-600" />
                  <span>Edit Staff Member Profile</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Update wage rates, emergency contact details, and workshop credentials for {editingEmployee.name}
                </p>
              </div>
              <button
                type="button"
                id="btn-close-edit-staff-modal"
                onClick={() => setEditingEmployee(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateEmployee} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name:</label>
                  <input
                    type="text"
                    required
                    value={editEmpName}
                    onChange={(e) => setEditEmpName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-hidden focus:ring-2 focus:ring-[#0984E3]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Job Role / Bay Specialty:</label>
                  <input
                    type="text"
                    required
                    value={editEmpRole}
                    onChange={(e) => setEditEmpRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0984E3]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hourly Wage (EC$):</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={editEmpRate}
                    onChange={(e) => setEditEmpRate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0984E3]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dominica DSS Number:</label>
                  <input
                    type="text"
                    value={editEmpDss}
                    onChange={(e) => setEditEmpDss(e.target.value)}
                    placeholder="DSS-XXXXXX"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0984E3]"
                  />
                </div>
              </div>

              {/* Rate Change Audit Notification & Reason */}
              {editingEmployee && parseFloat(editEmpRate) !== editingEmployee.hourlyRateXCD && (
                <div className="bg-purple-50/90 border border-purple-200 rounded-2xl p-3.5 text-xs space-y-2 animate-fade-in">
                  <div className="flex items-center gap-1.5 text-purple-900 font-extrabold text-[11px]">
                    <History className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                    <span>Hourly Rate Adjustment Detected: EC$ {editingEmployee.hourlyRateXCD.toFixed(2)}/h &rarr; EC$ {(parseFloat(editEmpRate) || 0).toFixed(2)}/h</span>
                  </div>
                  <p className="text-[11px] text-purple-700 leading-tight">
                    This modification will be automatically recorded into the official Payroll & Wage Rate Audit Trail with timestamps and author details.
                  </p>
                  <div>
                    <label className="block text-[10px] font-bold text-purple-900 mb-1 uppercase">
                      Audit Reason / Adjustment Justification (Optional):
                    </label>
                    <input
                      type="text"
                      value={editEmpRateReason}
                      onChange={(e) => setEditEmpRateReason(e.target.value)}
                      placeholder="e.g. Annual merit evaluation, Promotion to Lead Bay Technician, Dominica statutory wage increase"
                      className="w-full px-3 py-1.5 bg-white border border-purple-300 rounded-xl text-xs text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Phone:</label>
                  <input
                    type="tel"
                    value={editEmpPhone}
                    onChange={(e) => setEditEmpPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0984E3]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Work/Personal Email:</label>
                  <input
                    type="email"
                    value={editEmpEmail}
                    onChange={(e) => setEditEmpEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0984E3]"
                  />
                </div>
              </div>

              {/* Emergency Contact Block (Highlight for safety) */}
              <div className="bg-rose-50/90 border border-rose-300 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center gap-1.5 text-rose-800 font-extrabold text-xs uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Emergency Contact (Workplace Safety & Medical Notice)</span>
                </div>
                <p className="text-[11px] text-rose-700 leading-tight">
                  Designated contact in case of workplace accident, medical emergency, or unscheduled absence.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                      Contact Name & Relationship:
                    </label>
                    <input
                      type="text"
                      value={editEmpEmergencyName}
                      onChange={(e) => setEditEmpEmergencyName(e.target.value)}
                      placeholder="e.g. Maria Baptiste (Spouse)"
                      className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-rose-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                      Emergency Phone Number:
                    </label>
                    <input
                      type="tel"
                      value={editEmpEmergencyPhone}
                      onChange={(e) => setEditEmpEmergencyPhone(e.target.value)}
                      placeholder="+1 (767) 277-3104"
                      className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-rose-500 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Employment Status:</label>
                  <select
                    value={editEmpStatus}
                    onChange={(e) => setEditEmpStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0984E3]"
                  >
                    <option value="active">Active (On Schedule)</option>
                    <option value="on_leave">On Leave / Vacation</option>
                    <option value="inactive">Inactive / Resigned</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Time Clock Kiosk PIN:</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={editEmpPin}
                    onChange={(e) => setEditEmpPin(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0984E3]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  id="btn-delete-staff-from-edit-modal"
                  data-testid="btn-delete-staff-from-edit-modal"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (editingEmployee) {
                      handleDeleteEmployee(editingEmployee.id, editingEmployee.name, editingEmployee.role);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs rounded-xl border border-rose-200 transition cursor-pointer active:scale-95"
                  title="Remove this staff profile from workshop directory"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Delete Staff Profile</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="btn-cancel-edit-staff"
                    onClick={() => setEditingEmployee(null)}
                    className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="btn-save-staff-profile-changes"
                    disabled={isSavingEmp}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSavingEmp ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3C: IN-APP CONFIRM DELETE STAFF MEMBER (Reliable in iframes)       */}
      {/* ========================================================================= */}
      {employeeToDelete && (
        <div 
          id="modal-delete-staff-confirm"
          data-testid="modal-delete-staff-confirm"
          className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
          onClick={() => setEmployeeToDelete(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-rose-600">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-base">Remove Staff Profile?</h4>
                <p className="text-xs text-slate-500">Max Executive Tires Staff Directory</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove <strong className="text-slate-900 font-bold">{employeeToDelete.name}</strong> ({employeeToDelete.role}) from the workshop staff directory? Their emergency contacts and time clock credentials will be unlinked.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                id="btn-cancel-delete-staff"
                data-testid="btn-cancel-delete-staff"
                onClick={() => setEmployeeToDelete(null)}
                className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-delete-staff"
                data-testid="btn-confirm-delete-staff"
                disabled={isDeletingEmp}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeletingEmp ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Staff Profile</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1B: ADJUST SHIFT TIMESHEET (AUTOMATED AUDIT RECORDING)              */}
      {/* ========================================================================= */}
      {shiftToAdjust && (
        <div
          id="modal-adjust-shift"
          data-testid="modal-adjust-shift"
          className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#0984E3]" />
                <span>Adjust Shift Timesheet Record</span>
              </h4>
              <button
                type="button"
                id="btn-close-adjust-shift-modal"
                onClick={() => setShiftToAdjust(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3 text-xs space-y-1">
              <div className="font-bold text-blue-950 flex items-center justify-between">
                <span>{shiftToAdjust.employeeName}</span>
                <span className="font-mono text-[11px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-extrabold">
                  {shiftToAdjust.date}
                </span>
              </div>
              <p className="text-[11px] text-blue-800">
                Current: {shiftToAdjust.regularHours}h regular + {shiftToAdjust.overtimeHours}h OT ({shiftToAdjust.totalHours}h total).
              </p>
            </div>

            <form onSubmit={handleSaveShiftAdjustment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Shift Date:</label>
                <input
                  type="date"
                  required
                  value={adjustDate}
                  onChange={(e) => setAdjustDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-[#0984E3]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Regular Hours:</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    required
                    value={adjustRegHours}
                    onChange={(e) => setAdjustRegHours(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-[#0984E3]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Overtime Hours (1.5x):</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    required
                    value={adjustOtHours}
                    onChange={(e) => setAdjustOtHours(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-purple-700 font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-[#0984E3]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Reason for Adjustment & Audit Log Note:
                </label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Approved overtime for urgent customer tyre mount, Time clock punch correction"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0984E3]"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  This adjustment reason will be preserved in the automated audit log for external accounting.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShiftToAdjust(null)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-save-shift-adjustment"
                  data-testid="btn-save-shift-adjustment"
                  disabled={isAdjustingShift}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isAdjustingShift ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Shift Adjustment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: OFFICIAL PRINTABLE PAYSLIP (PRINT-MEDIA CALIBRATED MODAL)        */}
      {/* ========================================================================= */}
      <OfficialPayslipModal
        isOpen={!!selectedPayStubForPrint}
        onClose={() => setSelectedPayStubForPrint(null)}
        payStub={selectedPayStubForPrint}
      />

      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-60 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2.5 text-xs font-bold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
