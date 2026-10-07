import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { TYRES_DATA } from '../src/data/tyresData';

export interface Employee {
  id: string;
  name: string;
  role: string;
  phone: string;
  email?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  dssNumber: string; // Dominica Social Security ID
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
  date: string; // YYYY-MM-DD
  clockIn: string; // ISO
  clockOut?: string | null; // ISO
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
  dssEmployeeDeductionXCD: number; // 6% Dominica Social Security
  dssEmployerContributionXCD: number; // 7% DSS Employer share
  payeTaxDeductionXCD: number;
  netPayXCD: number;
  paymentMethod: 'Cash' | 'Direct Deposit' | 'Cheque';
  status: 'Draft' | 'Approved' | 'Paid';
  paidAt?: string;
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

export interface PayrollAuditEntry {
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

export interface AdminOrderItem {
  id: string;
  tyre: any;
  quantity: number;
  includeMounting: boolean;
  includeNewValves: boolean;
  includeShredding: boolean;
}

export interface AdminOrder {
  id: string;
  reservationCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  vehicleInfo: string;
  preferredDate?: string;
  items: AdminOrderItem[];
  totalXCD: number;
  paymentMethod: string;
  timestamp: string;
  paymentStatus: 'Pending' | 'Confirmed' | 'Refunded';
  dispatchStatus: 'Pending' | 'Ready for Fitting' | 'Completed' | 'Cancelled';
  assignedBay?: string;
  notes?: string;
}

export interface PriceUpdateRecord {
  id: string;
  tyreId: string;
  brand: string;
  modelName: string;
  size: string;
  oldPrice: number;
  newPrice: number;
  updatedAt: string;
  updatedBy: string;
}

export interface CashDrawerLog {
  id: string;
  timestamp: string;
  type: 'KICK_OPEN' | 'MANUAL_DROP' | 'PAYOUT' | 'START_FLOAT';
  amount?: number;
  reason: string;
  cashierName: string;
}

export interface WorkshopSettings {
  shopName: string;
  address: string;
  phonePrimary: string;
  phoneSecondary: string;
  email: string;
  whatsappTemplate: string;
  vatRatePercent: number; // 15% standard in Dominica
  servicePrices: Record<string, number>;
}

const DATA_FILE = path.join(process.cwd(), 'data', 'admin_store.json');
const LEGACY_PAYROLL_FILE = path.join(process.cwd(), 'data', 'admin_payroll.json');

// Initial seed employees
const SEED_EMPLOYEES: Employee[] = [
  {
    id: 'emp-01',
    name: 'Kervin Baptiste',
    role: 'Lead Tyre Technician & Bay Foreman',
    phone: '+1 (767) 276-8812',
    email: 'kervin.tyres@maxexecutive.dm',
    emergencyContactName: 'Maria Baptiste (Spouse)',
    emergencyContactPhone: '+1 (767) 277-3104',
    dssNumber: 'DSS-839210',
    hourlyRateXCD: 24.0,
    overtimeRateXCD: 36.0,
    status: 'active',
    hireDate: '2023-04-15',
    pinCode: '1001',
  },
  {
    id: 'emp-02',
    name: 'Daryl Peltier',
    role: 'Wheel Balancer & Mounting Specialist',
    phone: '+1 (767) 315-9921',
    email: 'daryl.p@maxexecutive.dm',
    emergencyContactName: 'Cynthia Peltier (Mother)',
    emergencyContactPhone: '+1 (767) 316-8802',
    dssNumber: 'DSS-749102',
    hourlyRateXCD: 20.0,
    overtimeRateXCD: 30.0,
    status: 'active',
    hireDate: '2023-09-01',
    pinCode: '1002',
  },
  {
    id: 'emp-03',
    name: 'Alana Charles',
    role: 'Customer Service & Inventory Clerk',
    phone: '+1 (767) 612-4409',
    email: 'alana.orders@maxexecutive.dm',
    emergencyContactName: 'Marcus Charles (Brother)',
    emergencyContactPhone: '+1 (767) 615-9943',
    dssNumber: 'DSS-910283',
    hourlyRateXCD: 18.5,
    overtimeRateXCD: 27.75,
    status: 'active',
    hireDate: '2024-01-10',
    pinCode: '1003',
  },
  {
    id: 'emp-04',
    name: 'Julian Henderson',
    role: 'Roadside SOS Emergency Rescue Driver',
    phone: '+1 (767) 285-3341',
    email: 'julian.sos@maxexecutive.dm',
    emergencyContactName: 'Grace Henderson (Spouse)',
    emergencyContactPhone: '+1 (767) 295-7718',
    dssNumber: 'DSS-650192',
    hourlyRateXCD: 22.0,
    overtimeRateXCD: 33.0,
    status: 'active',
    hireDate: '2024-05-20',
    pinCode: '1004',
  },
];

// Seed initial orders
function generateSeedOrders(): AdminOrder[] {
  const t0 = TYRES_DATA[0];
  const t1 = TYRES_DATA[1] || t0;
  const t2 = TYRES_DATA[2] || t0;

  return [
    {
      id: 'ord-pichelin-01',
      reservationCode: 'MTC-849201',
      customerName: 'Marcus Fontaine',
      customerPhone: '+1 (767) 245-8912',
      customerEmail: 'mfontaine.dom@gmail.com',
      vehicleInfo: 'Toyota Hilux 4x4 (Double Cab)',
      preferredDate: 'Today (Fast-Lane Fitting)',
      items: [
        {
          id: 'cart-1',
          tyre: t0,
          quantity: 2,
          includeMounting: true,
          includeNewValves: true,
          includeShredding: true,
        },
      ],
      totalXCD: (t0.priceXCD + 20 + 15 + 1) * 2,
      paymentMethod: 'Pay at Shop / WhatsApp',
      timestamp: new Date(Date.now() - 3 * 3600 * 1000).toLocaleString('en-US'),
      paymentStatus: 'Pending',
      dispatchStatus: 'Pending',
      assignedBay: 'Bay 1 (Fast-Lane)',
    },
    {
      id: 'ord-pichelin-02',
      reservationCode: 'MTC-913404',
      customerName: 'Kervin Charles',
      customerPhone: '+1 (767) 612-4432',
      customerEmail: 'kervin.c@dominica.dm',
      vehicleInfo: 'Nissan X-Trail T32',
      preferredDate: 'Today, 2:00 PM',
      items: [
        {
          id: 'cart-2',
          tyre: t1,
          quantity: 2,
          includeMounting: true,
          includeNewValves: true,
          includeShredding: false,
        },
      ],
      totalXCD: (t1.priceXCD + 20 + 15) * 2,
      paymentMethod: 'Stripe Online',
      timestamp: new Date(Date.now() - 18 * 3600 * 1000).toLocaleString('en-US'),
      paymentStatus: 'Confirmed',
      dispatchStatus: 'Ready for Fitting',
      assignedBay: 'Bay 2 (Precision Balancing)',
    },
    {
      id: 'ord-pichelin-03',
      reservationCode: 'MTC-391823',
      customerName: 'Sarah Peltier',
      customerPhone: '+1 (767) 317-5509',
      customerEmail: 'sarah.peltier@yahoo.com',
      vehicleInfo: 'Suzuki Grand Vitara 4WD',
      preferredDate: 'Yesterday Morning',
      items: [
        {
          id: 'cart-3',
          tyre: t2,
          quantity: 4,
          includeMounting: true,
          includeNewValves: true,
          includeShredding: true,
        },
      ],
      totalXCD: (t2.priceXCD + 20 + 15 + 1) * 4,
      paymentMethod: 'Cash at Workshop',
      timestamp: new Date(Date.now() - 28 * 3600 * 1000).toLocaleString('en-US'),
      paymentStatus: 'Confirmed',
      dispatchStatus: 'Completed',
      assignedBay: 'Bay 1 (Mounting Rack)',
    },
  ];
}

// Seed initial time entries
function generateSeedTimeEntries(): TimeEntry[] {
  const now = new Date();
  const d0 = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const d1 = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const d2 = now.toISOString().split('T')[0];

  return [
    {
      id: 'time-01',
      employeeId: 'emp-01',
      employeeName: 'Kervin Baptiste',
      date: d0,
      clockIn: `${d0}T07:45:00.000Z`,
      clockOut: `${d0}T16:30:00.000Z`,
      breakMinutes: 45,
      regularHours: 8.0,
      overtimeHours: 0.0,
      totalHours: 8.0,
      taskNotes: 'Pneumatic mounting 14 tyres & bead leak test on Hilux rims',
      status: 'completed',
    },
    {
      id: 'time-02',
      employeeId: 'emp-01',
      employeeName: 'Kervin Baptiste',
      date: d1,
      clockIn: `${d1}T07:30:00.000Z`,
      clockOut: `${d1}T17:30:00.000Z`,
      breakMinutes: 60,
      regularHours: 8.0,
      overtimeHours: 1.0,
      totalHours: 9.0,
      taskNotes: 'Computer balancing for 6 commercial SUV tyres + overtime backlog',
      status: 'completed',
    },
    {
      id: 'time-03',
      employeeId: 'emp-02',
      employeeName: 'Daryl Peltier',
      date: d1,
      clockIn: `${d1}T08:00:00.000Z`,
      clockOut: `${d1}T16:30:00.000Z`,
      breakMinutes: 30,
      regularHours: 8.0,
      overtimeHours: 0.0,
      totalHours: 8.0,
      taskNotes: 'Wheel balancing calibration and tyre inventory labeling',
      status: 'completed',
    },
    {
      id: 'time-04',
      employeeId: 'emp-04',
      employeeName: 'Julian Henderson',
      date: d2,
      clockIn: `${d2}T07:15:00.000Z`,
      clockOut: null,
      breakMinutes: 0,
      regularHours: 5.5,
      overtimeHours: 0.0,
      totalHours: 5.5,
      taskNotes: 'On-duty roadside SOS patrol Maranatha Square & Grand Bay highway',
      status: 'clocked_in',
    },
  ];
}

interface StoredData {
  employees: Employee[];
  timeEntries: TimeEntry[];
  payrollRuns: PayrollRun[];
  orders: AdminOrder[];
  inventory: any[];
  priceHistory: PriceUpdateRecord[];
  cashDrawerLogs: CashDrawerLog[];
  settings: WorkshopSettings;
  payrollAuditLogs?: PayrollAuditEntry[];
}

function generateSeedAuditLogs(): PayrollAuditEntry[] {
  return [
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
  ];
}

function loadData(): StoredData {
  // Check main unified store first
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed: StoredData = JSON.parse(raw);
      if (!parsed.payrollAuditLogs || parsed.payrollAuditLogs.length === 0) {
        parsed.payrollAuditLogs = generateSeedAuditLogs();
        saveData(parsed);
      }
      return parsed;
    }
  } catch (err) {
    console.warn('Error reading admin store file:', err);
  }

  // Check legacy payroll file to migrate employees & payroll
  let legacyEmployees = SEED_EMPLOYEES;
  let legacyTime = generateSeedTimeEntries();
  let legacyRuns: PayrollRun[] = [];

  try {
    if (fs.existsSync(LEGACY_PAYROLL_FILE)) {
      const legacyRaw = fs.readFileSync(LEGACY_PAYROLL_FILE, 'utf-8');
      const parsed = JSON.parse(legacyRaw);
      if (parsed.employees?.length) legacyEmployees = parsed.employees;
      if (parsed.timeEntries?.length) legacyTime = parsed.timeEntries;
      if (parsed.payrollRuns?.length) legacyRuns = parsed.payrollRuns;
    }
  } catch (err) {}

  const initialData: StoredData = {
    employees: legacyEmployees,
    timeEntries: legacyTime,
    payrollRuns: legacyRuns,
    orders: generateSeedOrders(),
    inventory: TYRES_DATA,
    priceHistory: [
      {
        id: 'pr-01',
        tyreId: 'tyre-1',
        brand: 'Maxxis',
        modelName: 'Bravo AT-771',
        size: '265/65 R17',
        oldPrice: 380,
        newPrice: 410,
        updatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        updatedBy: 'Admin / Inventory Manager',
      },
    ],
    cashDrawerLogs: [
      {
        id: 'cd-01',
        timestamp: new Date().toISOString(),
        type: 'START_FLOAT',
        amount: 500,
        reason: 'Opening shift float at Maranatha Square counter',
        cashierName: 'Alana Charles',
      },
    ],
    payrollAuditLogs: generateSeedAuditLogs(),
    settings: {
      shopName: 'Max Executive Tires',
      address: 'Maranatha Square, Main Highway, Pichelin, Dominica',
      phonePrimary: '+1 (767) 616-0155',
      phoneSecondary: '+1 (767) 245-8912',
      email: 'maxblanc4577@gmail.com',
      whatsappTemplate:
        'Hello from Max Executive Tires (Maranatha Square, Pichelin)! Your tyre reservation is ready for fitment.',
      vatRatePercent: 15.0,
      servicePrices: {
        mounting: 20,
        valves: 15,
        shredding: 1,
        balancing: 25,
        roadsidePlug: 60,
      },
    },
  };

  saveData(initialData);
  return initialData;
}

function saveData(data: StoredData): void {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save admin store data:', err);
  }
}

export function createAdminRouter(): Router {
  const router = Router();

  // ==========================================
  // SYSTEM HEALTH & STATUS OVERVIEW
  // ==========================================
  router.get('/status', (_req: Request, res: Response) => {
    const data = loadData();
    const activeStaff = data.timeEntries.filter((t) => t.status === 'clocked_in').length;
    const totalRev = data.orders.reduce((acc, o) => acc + (o.totalXCD || 0), 0);
    const lowStock = data.inventory.filter((t) => (t.stockCount || 0) < 5).length;

    res.json({
      success: true,
      status: 'online',
      serverTime: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      shop: data.settings.shopName,
      location: data.settings.address,
      stats: {
        totalOrders: data.orders.length,
        totalRevenueXCD: Math.round(totalRev * 100) / 100,
        totalInventoryCount: data.inventory.length,
        lowStockAlerts: lowStock,
        totalStaff: data.employees.length,
        staffOnDuty: activeStaff,
        payrollRunsCount: data.payrollRuns.length,
      },
    });
  });

  // ==========================================
  // ORDERS MANAGEMENT ENDPOINTS
  // ==========================================
  router.get('/orders', (req: Request, res: Response) => {
    const data = loadData();
    const { status, search } = req.query;

    let result = [...data.orders];

    if (status && typeof status === 'string' && status !== 'ALL') {
      result = result.filter(
        (o) => o.dispatchStatus?.toLowerCase() === status.toLowerCase()
      );
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.customerName?.toLowerCase().includes(q) ||
          o.reservationCode?.toLowerCase().includes(q) ||
          o.customerPhone?.includes(q) ||
          o.vehicleInfo?.toLowerCase().includes(q)
      );
    }

    res.json({
      success: true,
      count: result.length,
      totalCount: data.orders.length,
      orders: result,
    });
  });

  router.post('/orders', (req: Request, res: Response) => {
    const data = loadData();
    const body = req.body;

    const code =
      body.reservationCode ||
      'MTC-' + Math.floor(100000 + Math.random() * 900000);

    const newOrder: AdminOrder = {
      id: body.id || 'ord-' + Date.now().toString(36),
      reservationCode: code,
      customerName: body.customerName || 'Walk-In Customer',
      customerPhone: body.customerPhone || '+1 (767) 616-0155',
      customerEmail: body.customerEmail,
      vehicleInfo: body.vehicleInfo || 'General Passenger Vehicle',
      preferredDate: body.preferredDate || 'Immediate Fitment',
      items: body.items || [],
      totalXCD: Number(body.totalXCD) || 0,
      paymentMethod: body.paymentMethod || 'Cash at Workshop',
      timestamp: body.timestamp || new Date().toLocaleString('en-US'),
      paymentStatus: body.paymentStatus || 'Pending',
      dispatchStatus: body.dispatchStatus || 'Pending',
      assignedBay: body.assignedBay || 'Bay 1 (Fast-Lane)',
      notes: body.notes,
    };

    data.orders.unshift(newOrder);
    saveData(data);

    res.status(201).json({ success: true, order: newOrder });
  });

  router.put('/orders/:id/status', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const data = loadData();

    const order = data.orders.find((o) => o.id === id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.dispatchStatus = status;
    if (status === 'Completed') {
      order.paymentStatus = 'Confirmed';
    }

    saveData(data);
    res.json({ success: true, order });
  });

  router.put('/orders/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const data = loadData();
    const idx = data.orders.findIndex((o) => o.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    data.orders[idx] = {
      ...data.orders[idx],
      ...req.body,
      id, // Preserve id
    };

    saveData(data);
    res.json({ success: true, order: data.orders[idx] });
  });

  router.delete('/orders/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const data = loadData();
    data.orders = data.orders.filter((o) => o.id !== id);
    saveData(data);
    res.json({ success: true, message: 'Order removed' });
  });

  router.post('/orders/bulk-status', (req: Request, res: Response) => {
    const { orderIds, status } = req.body;
    if (!Array.isArray(orderIds) || !status) {
      return res.status(400).json({ error: 'orderIds array and status are required' });
    }

    const data = loadData();
    data.orders.forEach((o) => {
      if (orderIds.includes(o.id)) {
        o.dispatchStatus = status;
      }
    });

    saveData(data);
    res.json({ success: true, count: orderIds.length });
  });

  router.post('/orders/bulk-delete', (req: Request, res: Response) => {
    const { orderIds } = req.body;
    if (!Array.isArray(orderIds)) {
      return res.status(400).json({ error: 'orderIds array is required' });
    }

    const data = loadData();
    data.orders = data.orders.filter((o) => !orderIds.includes(o.id));
    saveData(data);
    res.json({ success: true, message: `Deleted ${orderIds.length} orders` });
  });

  router.post('/orders/clear', (_req: Request, res: Response) => {
    const data = loadData();
    data.orders = [];
    saveData(data);
    res.json({ success: true, message: 'All orders cleared' });
  });

  // ==========================================
  // INVENTORY & TYRES MANAGEMENT ENDPOINTS
  // ==========================================
  router.get('/inventory', (_req: Request, res: Response) => {
    const data = loadData();
    res.json({
      success: true,
      count: data.inventory.length,
      tyres: data.inventory,
      priceHistory: data.priceHistory,
    });
  });

  router.post('/inventory', (req: Request, res: Response) => {
    const data = loadData();
    const tyre = req.body;

    const newTyre = {
      ...tyre,
      id: tyre.id || 'tyre-' + Date.now().toString(36),
      stockCount: Number(tyre.stockCount) || 4,
      priceXCD: Number(tyre.priceXCD) || 200,
    };

    data.inventory.unshift(newTyre);
    saveData(data);
    res.status(201).json({ success: true, tyre: newTyre });
  });

  router.put('/inventory/:id/stock', (req: Request, res: Response) => {
    const { id } = req.params;
    const { stockCount } = req.body;
    const data = loadData();

    const tyre = data.inventory.find((t) => t.id === id);
    if (!tyre) {
      return res.status(404).json({ error: 'Tyre SKU not found' });
    }

    tyre.stockCount = Math.max(0, Number(stockCount) || 0);
    saveData(data);
    res.json({ success: true, tyre });
  });

  router.put('/inventory/:id/price', (req: Request, res: Response) => {
    const { id } = req.params;
    const { newPrice, updatedBy } = req.body;
    const data = loadData();

    const tyre = data.inventory.find((t) => t.id === id);
    if (!tyre) {
      return res.status(404).json({ error: 'Tyre SKU not found' });
    }

    const oldPrice = tyre.priceXCD;
    const nextPrice = Number(newPrice);
    tyre.priceXCD = nextPrice;

    // Log price update
    const record: PriceUpdateRecord = {
      id: 'pr-' + Date.now().toString(36),
      tyreId: tyre.id,
      brand: tyre.brand,
      modelName: tyre.modelName,
      size: tyre.size,
      oldPrice,
      newPrice: nextPrice,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || 'Admin Portal User',
    };
    data.priceHistory.unshift(record);

    saveData(data);
    res.json({ success: true, tyre, record });
  });

  router.post('/inventory/import', (req: Request, res: Response) => {
    const { tyres } = req.body;
    if (!Array.isArray(tyres)) {
      return res.status(400).json({ error: 'tyres array is required' });
    }

    const data = loadData();
    data.inventory = tyres;
    saveData(data);
    res.json({ success: true, count: tyres.length });
  });

  // ==========================================
  // CUSTOMER DIRECTORY ENDPOINTS
  // ==========================================
  router.get('/customers', (_req: Request, res: Response) => {
    const data = loadData();
    const map = new Map<string, any>();

    data.orders.forEach((o) => {
      const key = o.customerPhone || o.customerName;
      if (!map.has(key)) {
        map.set(key, {
          id: 'cust-' + key.replace(/[^a-zA-Z0-9]/g, ''),
          name: o.customerName,
          phone: o.customerPhone,
          email: o.customerEmail || '',
          vehicles: [o.vehicleInfo].filter(Boolean),
          orderCount: 1,
          totalSpendXCD: o.totalXCD || 0,
          lastOrderDate: o.timestamp,
        });
      } else {
        const c = map.get(key);
        c.orderCount += 1;
        c.totalSpendXCD += o.totalXCD || 0;
        if (o.vehicleInfo && !c.vehicles.includes(o.vehicleInfo)) {
          c.vehicles.push(o.vehicleInfo);
        }
      }
    });

    const customers = Array.from(map.values());
    res.json({ success: true, count: customers.length, customers });
  });

  // ==========================================
  // CASH DRAWER & POS HARDWARE LOGS
  // ==========================================
  router.get('/cash-drawer/logs', (_req: Request, res: Response) => {
    const data = loadData();
    res.json({ success: true, count: data.cashDrawerLogs.length, logs: data.cashDrawerLogs });
  });

  router.post('/cash-drawer/event', (req: Request, res: Response) => {
    const { type, amount, reason, cashierName } = req.body;
    const data = loadData();

    const log: CashDrawerLog = {
      id: 'cd-' + Date.now().toString(36),
      timestamp: new Date().toISOString(),
      type: type || 'KICK_OPEN',
      amount: amount !== undefined ? Number(amount) : undefined,
      reason: reason || 'Receipt print / drawer kick via Volcora USB interface',
      cashierName: cashierName || 'Cashier',
    };

    data.cashDrawerLogs.unshift(log);
    saveData(data);
    res.status(201).json({ success: true, log });
  });

  // ==========================================
  // WORKSHOP SETTINGS & WHATSAPP CONFIG
  // ==========================================
  router.get('/settings', (_req: Request, res: Response) => {
    const data = loadData();
    res.json({ success: true, settings: data.settings });
  });

  router.put('/settings', (req: Request, res: Response) => {
    const data = loadData();
    data.settings = { ...data.settings, ...req.body };
    saveData(data);
    res.json({ success: true, settings: data.settings });
  });

  // ==========================================
  // EMPLOYEES ENDPOINTS
  // ==========================================
  router.get('/employees', (_req: Request, res: Response) => {
    const data = loadData();
    res.json({
      success: true,
      count: data.employees.length,
      employees: data.employees,
    });
  });

  router.post('/employees', (req: Request, res: Response) => {
    const { name, role, phone, email, dssNumber, hourlyRateXCD, pinCode, emergencyContactName, emergencyContactPhone } = req.body;
    if (!name || !role) {
      return res.status(400).json({ error: 'Name and role are required' });
    }

    const data = loadData();
    const rate = Number(hourlyRateXCD) || 20.0;
    const newEmp: Employee = {
      id: 'emp-' + Date.now().toString(36),
      name: name.trim(),
      role: role.trim(),
      phone: phone?.trim() || '+1 (767) 616-0155',
      email: email?.trim(),
      emergencyContactName: emergencyContactName?.trim() || undefined,
      emergencyContactPhone: emergencyContactPhone?.trim() || undefined,
      dssNumber: dssNumber?.trim() || `DSS-${Math.floor(100000 + Math.random() * 900000)}`,
      hourlyRateXCD: rate,
      overtimeRateXCD: Math.round(rate * 1.5 * 100) / 100,
      status: 'active',
      hireDate: new Date().toISOString().split('T')[0],
      pinCode: pinCode?.trim() || String(Math.floor(1000 + Math.random() * 9000)),
    };

    data.employees.push(newEmp);

    if (!data.payrollAuditLogs) data.payrollAuditLogs = [];
    data.payrollAuditLogs.unshift({
      id: 'audit-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 5),
      timestamp: new Date().toISOString(),
      actionType: 'STAFF_ADDED',
      employeeId: newEmp.id,
      employeeName: newEmp.name,
      previousValue: 'None',
      newValue: `EC$ ${newEmp.hourlyRateXCD.toFixed(2)}/h`,
      details: `New staff profile registered: ${newEmp.name} (${newEmp.role}) starting at EC$ ${newEmp.hourlyRateXCD.toFixed(2)}/h, DSS #${newEmp.dssNumber}.`,
      changedBy: 'Admin Manager',
    });

    saveData(data);
    res.status(201).json({ success: true, employee: newEmp });
  });

  router.put('/employees/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const data = loadData();
    const idx = data.employees.findIndex((e) => e.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const existing = data.employees[idx];
    const rate = req.body.hourlyRateXCD !== undefined ? Number(req.body.hourlyRateXCD) : existing.hourlyRateXCD;

    if (!data.payrollAuditLogs) data.payrollAuditLogs = [];
    if (rate !== existing.hourlyRateXCD) {
      const diff = rate - existing.hourlyRateXCD;
      const diffStr = diff > 0 ? `+EC$ ${diff.toFixed(2)}` : `-EC$ ${Math.abs(diff).toFixed(2)}`;
      data.payrollAuditLogs.unshift({
        id: 'audit-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 5),
        timestamp: new Date().toISOString(),
        actionType: 'HOURLY_RATE_CHANGE',
        employeeId: existing.id,
        employeeName: existing.name,
        previousValue: `EC$ ${existing.hourlyRateXCD.toFixed(2)}/h`,
        newValue: `EC$ ${rate.toFixed(2)}/h`,
        details: `Hourly rate adjusted from EC$ ${existing.hourlyRateXCD.toFixed(2)}/h to EC$ ${rate.toFixed(2)}/h (${diffStr}/h). Overtime rate automatically recalibrated to EC$ ${(rate * 1.5).toFixed(2)}/h.`,
        changedBy: req.body.changedBy || 'Admin Manager',
      });
    } else if (req.body.role && req.body.role !== existing.role) {
      data.payrollAuditLogs.unshift({
        id: 'audit-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 5),
        timestamp: new Date().toISOString(),
        actionType: 'SHIFT_ADJUSTMENT',
        employeeId: existing.id,
        employeeName: existing.name,
        previousValue: existing.role,
        newValue: req.body.role,
        details: `Designation / Role updated from "${existing.role}" to "${req.body.role}".`,
        changedBy: req.body.changedBy || 'Admin Manager',
      });
    }

    data.employees[idx] = {
      ...existing,
      name: req.body.name ?? existing.name,
      role: req.body.role ?? existing.role,
      phone: req.body.phone ?? existing.phone,
      email: req.body.email ?? existing.email,
      emergencyContactName: req.body.emergencyContactName !== undefined ? req.body.emergencyContactName : existing.emergencyContactName,
      emergencyContactPhone: req.body.emergencyContactPhone !== undefined ? req.body.emergencyContactPhone : existing.emergencyContactPhone,
      dssNumber: req.body.dssNumber ?? existing.dssNumber,
      hourlyRateXCD: rate,
      overtimeRateXCD: Math.round(rate * 1.5 * 100) / 100,
      status: req.body.status ?? existing.status,
      pinCode: req.body.pinCode ?? existing.pinCode,
    };

    saveData(data);
    res.json({ success: true, employee: data.employees[idx] });
  });

  router.delete('/employees/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const data = loadData();
    const empToDelete = data.employees.find((e) => e.id === id);
    if (!empToDelete) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    data.employees = data.employees.filter((e) => e.id !== id);

    if (!data.payrollAuditLogs) data.payrollAuditLogs = [];
    data.payrollAuditLogs.unshift({
      id: 'audit-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 5),
      timestamp: new Date().toISOString(),
      actionType: 'STAFF_REMOVED',
      employeeId: empToDelete.id,
      employeeName: empToDelete.name,
      previousValue: `EC$ ${empToDelete.hourlyRateXCD.toFixed(2)}/h`,
      newValue: 'Deactivated / Removed',
      details: `Staff member ${empToDelete.name} (${empToDelete.role}) removed from active directory.`,
      changedBy: 'Admin Manager',
    });

    saveData(data);
    res.json({ success: true, message: 'Employee deleted' });
  });

  // ==========================================
  // TIME CLOCK & WORK TIME ATTENDANCE
  // ==========================================
  router.get('/time-clock', (_req: Request, res: Response) => {
    const data = loadData();
    const sorted = [...data.timeEntries].sort(
      (a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime()
    );
    res.json({
      success: true,
      count: sorted.length,
      entries: sorted,
    });
  });

  router.post('/time-clock/punch', (req: Request, res: Response) => {
    const { employeeId, pinCode, taskNotes } = req.body;
    const data = loadData();

    const emp = data.employees.find(
      (e) => e.id === employeeId || (pinCode && e.pinCode === pinCode)
    );
    if (!emp) {
      return res.status(404).json({ error: 'Employee not found or invalid PIN' });
    }

    const activeEntry = data.timeEntries.find(
      (t) => t.employeeId === emp.id && t.status === 'clocked_in'
    );

    const now = new Date();

    if (activeEntry) {
      // Clock out
      activeEntry.clockOut = now.toISOString();
      activeEntry.status = 'completed';
      if (taskNotes) {
        activeEntry.taskNotes = (activeEntry.taskNotes ? `${activeEntry.taskNotes} | ` : '') + taskNotes;
      }

      const diffMs = now.getTime() - new Date(activeEntry.clockIn).getTime();
      const rawHours = Math.max(0, diffMs / (1000 * 60 * 60) - (activeEntry.breakMinutes || 0) / 60);
      const roundedTotal = Math.round(rawHours * 10) / 10;
      activeEntry.totalHours = roundedTotal;
      activeEntry.regularHours = Math.min(8.0, roundedTotal);
      activeEntry.overtimeHours = Math.max(0, Math.round((roundedTotal - 8.0) * 10) / 10);

      saveData(data);
      return res.json({
        success: true,
        action: 'clock_out',
        message: `${emp.name} clocked out. Total shift: ${roundedTotal} hrs.`,
        entry: activeEntry,
      });
    } else {
      // Clock in
      const newEntry: TimeEntry = {
        id: 'time-' + Date.now().toString(36),
        employeeId: emp.id,
        employeeName: emp.name,
        date: now.toISOString().split('T')[0],
        clockIn: now.toISOString(),
        clockOut: null,
        breakMinutes: 0,
        regularHours: 0,
        overtimeHours: 0,
        totalHours: 0,
        taskNotes: taskNotes || 'Workshop tyre services & customer assistance',
        status: 'clocked_in',
      };

      data.timeEntries.push(newEntry);
      saveData(data);
      return res.json({
        success: true,
        action: 'clock_in',
        message: `${emp.name} clocked in successfully at ${now.toLocaleTimeString()}.`,
        entry: newEntry,
      });
    }
  });

  router.post('/time-clock/manual', (req: Request, res: Response) => {
    const { employeeId, date, hours, taskNotes, overtimeHours } = req.body;
    const data = loadData();
    const emp = data.employees.find((e) => e.id === employeeId);
    if (!emp) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const total = Number(hours) || 8.0;
    const ot = Number(overtimeHours) || (total > 8 ? total - 8 : 0);
    const reg = total - ot;

    const entryDate = date || new Date().toISOString().split('T')[0];
    const newEntry: TimeEntry = {
      id: 'time-man-' + Date.now().toString(36),
      employeeId: emp.id,
      employeeName: emp.name,
      date: entryDate,
      clockIn: `${entryDate}T08:00:00.000Z`,
      clockOut: `${entryDate}T16:30:00.000Z`,
      breakMinutes: 30,
      regularHours: Math.round(reg * 10) / 10,
      overtimeHours: Math.round(ot * 10) / 10,
      totalHours: Math.round(total * 10) / 10,
      taskNotes: taskNotes || 'Manual shift entry approved by Admin',
      status: 'manual_entry',
    };

    data.timeEntries.push(newEntry);

    if (!data.payrollAuditLogs) data.payrollAuditLogs = [];
    data.payrollAuditLogs.unshift({
      id: 'audit-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 5),
      timestamp: new Date().toISOString(),
      actionType: 'SHIFT_MANUAL_ENTRY',
      employeeId: emp.id,
      employeeName: emp.name,
      previousValue: 'None',
      newValue: `${total} hrs`,
      details: `Manual shift adjustment added for ${emp.name} on ${entryDate}: ${reg.toFixed(1)}h regular + ${ot.toFixed(1)}h overtime. Task note: "${taskNotes || 'Manual shift entry'}".`,
      changedBy: 'Admin Manager',
    });

    saveData(data);
    res.status(201).json({ success: true, entry: newEntry });
  });

  router.delete('/time-clock/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const data = loadData();
    const targetEntry = data.timeEntries.find((t) => t.id === id);

    if (targetEntry) {
      if (!data.payrollAuditLogs) data.payrollAuditLogs = [];
      data.payrollAuditLogs.unshift({
        id: 'audit-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 5),
        timestamp: new Date().toISOString(),
        actionType: 'SHIFT_DELETION',
        employeeId: targetEntry.employeeId,
        employeeName: targetEntry.employeeName,
        previousValue: `${targetEntry.totalHours} hrs`,
        newValue: 'Deleted',
        details: `Shift adjustment: Deleted time entry #${id} (${targetEntry.date}, ${targetEntry.totalHours} hrs) for ${targetEntry.employeeName}.`,
        changedBy: 'Admin Manager',
      });
    }

    data.timeEntries = data.timeEntries.filter((t) => t.id !== id);
    saveData(data);
    res.json({ success: true, message: 'Time entry removed' });
  });

  router.put('/time-clock/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const data = loadData();
    const idx = data.timeEntries.findIndex((t) => t.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Time entry not found' });
    }

    const existing = data.timeEntries[idx];
    const newReg = req.body.regularHours !== undefined ? Number(req.body.regularHours) : existing.regularHours;
    const newOt = req.body.overtimeHours !== undefined ? Number(req.body.overtimeHours) : existing.overtimeHours;
    const newDate = req.body.date || existing.date;
    const newNotes = req.body.taskNotes !== undefined ? req.body.taskNotes : existing.taskNotes;
    const newTotal = Math.round((newReg + newOt) * 10) / 10;
    const reason = req.body.reason || 'Timesheet record adjusted by manager';

    if (!data.payrollAuditLogs) data.payrollAuditLogs = [];
    const prevDesc = `${existing.regularHours}h reg + ${existing.overtimeHours}h OT (${existing.totalHours}h total)`;
    const newDesc = `${newReg}h reg + ${newOt}h OT (${newTotal}h total)`;

    data.payrollAuditLogs.unshift({
      id: 'audit-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 5),
      timestamp: new Date().toISOString(),
      actionType: 'SHIFT_ADJUSTMENT',
      employeeId: existing.employeeId,
      employeeName: existing.employeeName,
      previousValue: prevDesc,
      newValue: newDesc,
      details: `Shift adjusted for ${existing.employeeName} on ${newDate}: Changed from [${prevDesc}] to [${newDesc}]. Reason: "${reason}".`,
      changedBy: req.body.changedBy || 'Admin Manager',
    });

    data.timeEntries[idx] = {
      ...existing,
      date: newDate,
      regularHours: newReg,
      overtimeHours: newOt,
      totalHours: newTotal,
      taskNotes: newNotes,
    };

    saveData(data);
    res.json({ success: true, entry: data.timeEntries[idx] });
  });

  // ==========================================
  // PAYROLL AUDIT LOG ENDPOINTS
  // ==========================================
  router.get('/payroll/audit-logs', (_req: Request, res: Response) => {
    const data = loadData();
    res.json({
      success: true,
      count: (data.payrollAuditLogs || []).length,
      logs: data.payrollAuditLogs || [],
    });
  });

  router.post('/payroll/audit-logs', (req: Request, res: Response) => {
    const data = loadData();
    if (!data.payrollAuditLogs) data.payrollAuditLogs = [];
    const newLog: PayrollAuditEntry = {
      id: 'audit-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 5),
      timestamp: new Date().toISOString(),
      actionType: req.body.actionType || 'SHIFT_ADJUSTMENT',
      employeeId: req.body.employeeId || 'sys',
      employeeName: req.body.employeeName || 'Staff Member',
      previousValue: req.body.previousValue,
      newValue: req.body.newValue,
      details: req.body.details || 'Audit entry recorded',
      changedBy: req.body.changedBy || 'Admin Manager',
    };
    data.payrollAuditLogs.unshift(newLog);
    saveData(data);
    res.status(201).json({ success: true, log: newLog });
  });

  // ==========================================
  // PAYROLL GENERATION & MANAGEMENT
  // ==========================================
  router.get('/payroll/runs', (_req: Request, res: Response) => {
    const data = loadData();
    res.json({
      success: true,
      count: data.payrollRuns.length,
      runs: data.payrollRuns,
    });
  });

  router.post('/payroll/generate', (req: Request, res: Response) => {
    const { periodStart, periodEnd, periodLabel } = req.body;
    const data = loadData();

    if (!periodStart || !periodEnd) {
      return res.status(400).json({ error: 'periodStart and periodEnd are required' });
    }

    const runId = 'pr-' + Date.now().toString(36);
    const payDate = new Date().toISOString().split('T')[0];

    const stubs: PayrollPayStub[] = [];

    data.employees
      .filter((e) => e.status === 'active')
      .forEach((emp) => {
        const matched = data.timeEntries.filter((t) => {
          if (t.employeeId !== emp.id) return false;
          return t.date >= periodStart && t.date <= periodEnd;
        });

        let totalReg = matched.reduce((sum, t) => sum + (t.regularHours || 0), 0);
        let totalOt = matched.reduce((sum, t) => sum + (t.overtimeHours || 0), 0);

        if (totalReg === 0 && matched.length === 0) {
          totalReg = 40.0;
          totalOt = 2.0;
        }

        const hourlyRate = emp.hourlyRateXCD;
        const otRate = emp.overtimeRateXCD;

        const regularPay = Math.round(totalReg * hourlyRate * 100) / 100;
        const overtimePay = Math.round(totalOt * otRate * 100) / 100;
        const grossPay = Math.round((regularPay + overtimePay) * 100) / 100;

        const dssEmployee = Math.round(grossPay * 0.06 * 100) / 100;
        const dssEmployer = Math.round(grossPay * 0.07 * 100) / 100;

        const taxableThresholdBiWeekly = 1150;
        const taxableAmount = Math.max(0, grossPay - taxableThresholdBiWeekly);
        const payeTax = Math.round(taxableAmount * 0.15 * 100) / 100;

        const netPay = Math.round((grossPay - dssEmployee - payeTax) * 100) / 100;

        stubs.push({
          id: 'stub-' + Math.random().toString(36).substring(2, 9),
          payrollRunId: runId,
          employeeId: emp.id,
          employeeName: emp.name,
          role: emp.role,
          periodStart,
          periodEnd,
          payDate,
          regularHours: totalReg,
          overtimeHours: totalOt,
          hourlyRateXCD: hourlyRate,
          regularPayXCD: regularPay,
          overtimePayXCD: overtimePay,
          grossPayXCD: grossPay,
          dssEmployeeDeductionXCD: dssEmployee,
          dssEmployerContributionXCD: dssEmployer,
          payeTaxDeductionXCD: payeTax,
          netPayXCD: netPay,
          paymentMethod: 'Direct Deposit',
          status: 'Draft',
        });
      });

    const totalGross = Math.round(stubs.reduce((acc, s) => acc + s.grossPayXCD, 0) * 100) / 100;
    const totalNet = Math.round(stubs.reduce((acc, s) => acc + s.netPayXCD, 0) * 100) / 100;
    const totalDss = Math.round(stubs.reduce((acc, s) => acc + (s.dssEmployeeDeductionXCD + s.dssEmployerContributionXCD), 0) * 100) / 100;

    const newRun: PayrollRun = {
      id: runId,
      periodLabel: periodLabel || `Pay Run: ${periodStart} to ${periodEnd}`,
      periodStart,
      periodEnd,
      payDate,
      totalGrossXCD: totalGross,
      totalNetXCD: totalNet,
      totalDssXCD: totalDss,
      stubsCount: stubs.length,
      status: 'Draft',
      stubs,
    };

    data.payrollRuns.unshift(newRun);
    saveData(data);

    res.status(201).json({ success: true, run: newRun });
  });

  router.post('/payroll/approve/:runId', (req: Request, res: Response) => {
    const { runId } = req.params;
    const data = loadData();
    const run = data.payrollRuns.find((r) => r.id === runId);
    if (!run) {
      return res.status(404).json({ error: 'Payroll run not found' });
    }

    run.status = 'Approved';
    run.stubs.forEach((s) => {
      s.status = 'Approved';
    });

    saveData(data);
    res.json({ success: true, run });
  });

  router.post('/payroll/pay-stub/:stubId/pay', (req: Request, res: Response) => {
    const { stubId } = req.params;
    const data = loadData();

    let targetStub: PayrollPayStub | null = null;
    for (const run of data.payrollRuns) {
      const s = run.stubs.find((stub) => stub.id === stubId);
      if (s) {
        s.status = 'Paid';
        s.paidAt = new Date().toISOString();
        targetStub = s;
        if (run.stubs.every((stub) => stub.status === 'Paid')) {
          run.status = 'Disbursed';
        }
        break;
      }
    }

    if (!targetStub) {
      return res.status(404).json({ error: 'Pay stub not found' });
    }

    saveData(data);
    res.json({ success: true, stub: targetStub });
  });

  return router;
}
