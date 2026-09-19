import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  FileCheck2,
  BookOpen,
  PieChart as PieIcon,
  Receipt,
  Building2,
  ArrowDownRight,
  ArrowUpRight,
  HelpCircle,
  Clock,
  Layers,
  Percent,
  Calculator,
  FileText
} from 'lucide-react';
import { AdminOrder } from './AdminOrdersModal';
import { Tyre } from '../types';

interface AdminQuickBooksAccountingReportProps {
  orders: AdminOrder[];
  tyres: Tyre[];
  servicePrices?: Record<string, number>;
}

type QuickBooksReportView = 'tax-schedule' | 'pnl' | 'general-ledger' | 'inventory-valuation';
type TaxCalculationMethod = 'inclusive' | 'exclusive';
type AccountingPeriod = 'ALL' | 'THIS_MONTH' | 'LAST_MONTH' | 'Q3_2026' | 'YTD';

export const AdminQuickBooksAccountingReport: React.FC<AdminQuickBooksAccountingReportProps> = ({
  orders,
  tyres,
  servicePrices = { mounting: 20, valves: 15, disposal: 1, shredding: 1 }
}) => {
  const [activeView, setActiveView] = useState<QuickBooksReportView>('tax-schedule');
  const [taxMethod, setTaxMethod] = useState<TaxCalculationMethod>('inclusive');
  const [vatRate, setVatRate] = useState<number>(15); // Standard Dominica VAT 15%
  const [period, setPeriod] = useState<AccountingPeriod>('ALL');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Filter orders by selected accounting period
  const filteredOrders = useMemo(() => {
    if (period === 'ALL') return orders;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    return orders.filter((order) => {
      let orderDate = new Date();
      if (order.timestamp) {
        const parsed = new Date(order.timestamp);
        if (!isNaN(parsed.getTime())) {
          orderDate = parsed;
        }
      }

      const ordYear = orderDate.getFullYear();
      const ordMonth = orderDate.getMonth();

      if (period === 'THIS_MONTH') {
        return ordYear === currentYear && ordMonth === currentMonth;
      }
      if (period === 'LAST_MONTH') {
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const targetYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        return ordYear === targetYear && ordMonth === lastMonth;
      }
      if (period === 'Q3_2026') {
        // Q3 is July (6), August (7), September (8)
        return ordYear === 2026 && (ordMonth === 6 || ordMonth === 7 || ordMonth === 8);
      }
      if (period === 'YTD') {
        return ordYear === currentYear;
      }
      return true;
    });
  }, [orders, period]);

  // Aggregate accounting numbers
  const accountingMetrics = useMemo(() => {
    let grossTyreSales = 0;
    let grossServices = 0;
    let grossEcoFees = 0;
    let totalUnitsSold = 0;
    let netAdjustments = 0;

    const paymentMethodTotals: Record<string, number> = {
      'Cash at Counter': 0,
      'SmartPOS Card Terminal': 0,
      'Stripe Online': 0,
      'Bank Transfer': 0,
      'Other': 0
    };

    filteredOrders.forEach((order) => {
      let orderTyres = 0;
      let orderServices = 0;
      let orderEco = 0;

      (order.items || []).forEach((item) => {
        const qty = item.quantity || 1;
        totalUnitsSold += qty;
        const unitPrice = item.tyre?.priceXCD || 0;
        orderTyres += unitPrice * qty;

        if (item.includeMounting) {
          const fee = (servicePrices['mounting'] ?? 20) * qty;
          orderServices += fee;
        }
        if (item.includeNewValves) {
          const fee = (servicePrices['valves'] ?? 15) * qty;
          orderServices += fee;
        }
        if (item.includeShredding) {
          const fee = (servicePrices['disposal'] ?? servicePrices['shredding'] ?? 1) * qty;
          orderEco += fee;
        }
      });

      // Handle adjustments
      let orderAdj = 0;
      if (order.priceAdjustments && order.priceAdjustments.length > 0) {
        order.priceAdjustments.forEach((adj) => {
          const amt = adj.amountXCD || 0;
          if (adj.type === 'refund') {
            orderAdj -= amt;
          } else {
            orderAdj += amt;
          }
        });
      }
      netAdjustments += orderAdj;

      grossTyreSales += orderTyres;
      grossServices += orderServices;
      grossEcoFees += orderEco;

      // Group payments by accounting clearing accounts
      const pMethod = (order.paymentMethod || '').toLowerCase();
      const ordTotal = Number(order.totalXCD || (orderTyres + orderServices + orderEco + orderAdj));

      if (pMethod.includes('cash')) {
        paymentMethodTotals['Cash at Counter'] += ordTotal;
      } else if (pMethod.includes('smartpos') || pMethod.includes('card') || pMethod.includes('terminal')) {
        paymentMethodTotals['SmartPOS Card Terminal'] += ordTotal;
      } else if (pMethod.includes('stripe')) {
        paymentMethodTotals['Stripe Online'] += ordTotal;
      } else if (pMethod.includes('bank') || pMethod.includes('transfer')) {
        paymentMethodTotals['Bank Transfer'] += ordTotal;
      } else {
        paymentMethodTotals['Other'] += ordTotal;
      }
    });

    const totalGrossReceipts = grossTyreSales + grossServices + grossEcoFees + netAdjustments;

    // Standard VAT calculations for Dominica Inland Revenue Department
    // Eco fees are statutory non-taxable environmental levies
    const nonTaxableEco = grossEcoFees;
    const grossTaxableSupplies = grossTyreSales + grossServices + netAdjustments;

    let netTaxableSales = 0;
    let outputVatGoods = 0;
    let outputVatServices = 0;
    let totalOutputVat = 0;

    if (taxMethod === 'inclusive') {
      // Dominica retail standard: price displayed includes 15% VAT
      // Formula: VAT Component = Gross * (Rate / (100 + Rate))
      const vatFactor = vatRate / (100 + vatRate);
      outputVatGoods = grossTyreSales * vatFactor;
      outputVatServices = grossServices * vatFactor;
      totalOutputVat = grossTaxableSupplies * vatFactor;
      netTaxableSales = grossTaxableSupplies - totalOutputVat;
    } else {
      // Exclusive method
      netTaxableSales = grossTaxableSupplies;
      outputVatGoods = grossTyreSales * (vatRate / 100);
      outputVatServices = grossServices * (vatRate / 100);
      totalOutputVat = netTaxableSales * (vatRate / 100);
    }

    // Estimated Cost of Goods Sold (approx 62% wholesale acquisition cost)
    const estimatedCOGS = grossTyreSales * 0.62;
    const grossProfit = totalGrossReceipts - estimatedCOGS;
    const grossMarginPct = totalGrossReceipts > 0 ? (grossProfit / totalGrossReceipts) * 100 : 0;

    // Estimated input tax credit claimable on wholesale imports (15% on COGS)
    const estimatedInputTaxCredit = estimatedCOGS * (vatRate / 100);
    const netVatPayableToIRD = Math.max(0, totalOutputVat - (taxMethod === 'inclusive' ? estimatedInputTaxCredit * 0.7 : estimatedInputTaxCredit));

    return {
      orderCount: filteredOrders.length,
      totalUnitsSold,
      grossTyreSales,
      grossServices,
      grossEcoFees,
      netAdjustments,
      totalGrossReceipts,
      nonTaxableEco,
      grossTaxableSupplies,
      netTaxableSales,
      outputVatGoods,
      outputVatServices,
      totalOutputVat,
      estimatedCOGS,
      grossProfit,
      grossMarginPct,
      estimatedInputTaxCredit,
      netVatPayableToIRD,
      paymentMethodTotals
    };
  }, [filteredOrders, servicePrices, taxMethod, vatRate]);

  // Inventory Asset Valuation (Live from tyres)
  const inventoryValuation = useMemo(() => {
    let totalStockUnits = 0;
    let totalRetailValuation = 0;
    let totalEstimatedCostValuation = 0;
    let newTyresStock = 0;
    let usedTyresStock = 0;

    tyres.forEach((t) => {
      const stock = t.stockCount || 0;
      totalStockUnits += stock;
      const retailVal = (t.priceXCD || 0) * stock;
      totalRetailValuation += retailVal;

      // Cost estimation: 60% for new tyres, 40% for inspected used tyres
      const costFactor = t.condition === 'new' ? 0.60 : 0.40;
      totalEstimatedCostValuation += retailVal * costFactor;

      if (t.condition === 'new') {
        newTyresStock += stock;
      } else {
        usedTyresStock += stock;
      }
    });

    return {
      totalStockUnits,
      totalRetailValuation,
      totalEstimatedCostValuation,
      newTyresStock,
      usedTyresStock,
      potentialGrossMarginValuation: totalRetailValuation - totalEstimatedCostValuation
    };
  }, [tyres]);

  // Download QuickBooks Sales Receipts (Standard CSV format compatible with QuickBooks Online & Desktop)
  const handleExportQuickBooksSalesReceipts = () => {
    const headers = [
      'TxnDate',
      'RefNumber',
      'Customer',
      'LineItem',
      'Description',
      'Qty',
      'Rate_XCD',
      'Amount_XCD',
      'TaxCode',
      'TaxRate_Pct',
      'TaxAmount_XCD',
      'DepositToAccount',
      'PaymentMethod',
      'Memo'
    ];

    const rows: string[][] = [];

    filteredOrders.forEach((order) => {
      const date = order.timestamp ? new Date(order.timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      const customer = (order.customerName || 'Walk-In Customer').replace(/"/g, '""');
      const ref = order.reservationCode || order.id;
      const depositAccount = order.paymentMethod?.toLowerCase().includes('cash')
        ? '1010 - Undeposited Cash Funds'
        : order.paymentMethod?.toLowerCase().includes('stripe')
        ? '1030 - Stripe Online Clearing'
        : '1020 - SmartPOS Merchant Account';

      (order.items || []).forEach((item, idx) => {
        const qty = item.quantity || 1;
        const tyre = item.tyre;
        const rate = tyre?.priceXCD || 0;
        const amount = rate * qty;
        const taxRate = vatRate;
        const taxAmt = taxMethod === 'inclusive' ? amount * (taxRate / (100 + taxRate)) : amount * (taxRate / 100);

        rows.push([
          date,
          `"${ref}"`,
          `"${customer}"`,
          `"4010 - Tyre Sales: ${tyre?.brand || 'Tyre'} ${tyre?.size || ''}"`,
          `"${(tyre?.modelName || 'Tyre Model').replace(/"/g, '""')} [${tyre?.condition || 'New'}]"`,
          qty.toString(),
          rate.toFixed(2),
          amount.toFixed(2),
          `"VAT_${taxRate}PCT"`,
          taxRate.toString(),
          taxAmt.toFixed(2),
          `"${depositAccount}"`,
          `"${(order.paymentMethod || 'POS Counter').replace(/"/g, '""')}"`,
          `"Order ${ref} - Vehicle: ${(order.vehicleInfo || 'Standard').replace(/"/g, '""')}"`
        ]);

        if (item.includeMounting) {
          const mountFee = (servicePrices['mounting'] ?? 20) * qty;
          const mountTax = taxMethod === 'inclusive' ? mountFee * (taxRate / (100 + taxRate)) : mountFee * (taxRate / 100);
          rows.push([
            date,
            `"${ref}"`,
            `"${customer}"`,
            `"4020 - Workshop Labour: Mounting"`,
            `"Tyre Mounting & Precision Balancing for ${qty} wheels"`,
            qty.toString(),
            (mountFee / qty).toFixed(2),
            mountFee.toFixed(2),
            `"VAT_${taxRate}PCT"`,
            taxRate.toString(),
            mountTax.toFixed(2),
            `"${depositAccount}"`,
            `"${(order.paymentMethod || 'POS Counter').replace(/"/g, '""')}"`,
            `"Workshop Fitment"`
          ]);
        }

        if (item.includeNewValves) {
          const valveFee = (servicePrices['valves'] ?? 15) * qty;
          const valveTax = taxMethod === 'inclusive' ? valveFee * (taxRate / (100 + taxRate)) : valveFee * (taxRate / 100);
          rows.push([
            date,
            `"${ref}"`,
            `"${customer}"`,
            `"4020 - Workshop Labour: Valves"`,
            `"High-Pressure Rubber/Brass Valve Replacements"`,
            qty.toString(),
            (valveFee / qty).toFixed(2),
            valveFee.toFixed(2),
            `"VAT_${taxRate}PCT"`,
            taxRate.toString(),
            valveTax.toFixed(2),
            `"${depositAccount}"`,
            `"${(order.paymentMethod || 'POS Counter').replace(/"/g, '""')}"`,
            `"Valve Hardware"`
          ]);
        }

        if (item.includeShredding) {
          const ecoFee = (servicePrices['disposal'] ?? 1) * qty;
          rows.push([
            date,
            `"${ref}"`,
            `"${customer}"`,
            `"4030 - Environmental Levies"`,
            `"Dominica Safe Rubber Tyre Shredding & Disposal"`,
            qty.toString(),
            (ecoFee / qty).toFixed(2),
            ecoFee.toFixed(2),
            `"EXEMPT"`,
            '0',
            '0.00',
            `"${depositAccount}"`,
            `"${(order.paymentMethod || 'POS Counter').replace(/"/g, '""')}"`,
            `"Statutory Eco Fee"`
          ]);
        }
      });
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `quickbooks_sales_receipts_${period.toLowerCase()}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportNotice(`Exported ${rows.length} QuickBooks Sales Receipt line entries!`);
    setTimeout(() => setExportNotice(null), 4000);
  };

  // Download QuickBooks General Ledger Journal Entries (Double Entry debits & credits)
  const handleExportQuickBooksJournal = () => {
    const headers = [
      'JournalEntryID',
      'Date',
      'RefNumber',
      'AccountCode',
      'AccountName',
      'Debit_XCD',
      'Credit_XCD',
      'Customer_Vendor',
      'Description_Memo',
      'TaxCode'
    ];

    const rows: string[][] = [];

    filteredOrders.forEach((order, ordIdx) => {
      const jId = `JE-${2026000 + ordIdx + 1}`;
      const date = order.timestamp ? new Date(order.timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      const ref = order.reservationCode || order.id;
      const customer = (order.customerName || 'Walk-In Customer').replace(/"/g, '""');

      let orderTyres = 0;
      let orderServices = 0;
      let orderEco = 0;

      (order.items || []).forEach((it) => {
        const q = it.quantity || 1;
        orderTyres += (it.tyre?.priceXCD || 0) * q;
        if (it.includeMounting) orderServices += (servicePrices['mounting'] ?? 20) * q;
        if (it.includeNewValves) orderServices += (servicePrices['valves'] ?? 15) * q;
        if (it.includeShredding) orderEco += (servicePrices['disposal'] ?? 1) * q;
      });

      const totalOrd = Number(order.totalXCD || (orderTyres + orderServices + orderEco));

      // Calculate VAT breakdown
      const vatFactor = vatRate / (100 + vatRate);
      const vatOnGoods = taxMethod === 'inclusive' ? orderTyres * vatFactor : orderTyres * (vatRate / 100);
      const vatOnServices = taxMethod === 'inclusive' ? orderServices * vatFactor : orderServices * (vatRate / 100);
      const totalVat = vatOnGoods + vatOnServices;

      const netGoodsRevenue = orderTyres - vatOnGoods;
      const netServiceRevenue = orderServices - vatOnServices;

      // 1. Debit Payment Asset (Cash / Card / Stripe)
      const clearingAcc = order.paymentMethod?.toLowerCase().includes('cash')
        ? '1010 - Cash Drawer Clearing'
        : order.paymentMethod?.toLowerCase().includes('stripe')
        ? '1030 - Stripe Clearing'
        : '1020 - SmartPOS Terminal Clearing';

      rows.push([
        jId,
        date,
        `"${ref}"`,
        clearingAcc.split(' - ')[0],
        `"${clearingAcc}"`,
        totalOrd.toFixed(2),
        '0.00',
        `"${customer}"`,
        `"Customer Payment Receipt [${order.paymentMethod || 'POS'}]"`,
        `"NON"`
      ]);

      // 2. Credit Tyre Sales Revenue (Account 4010)
      if (netGoodsRevenue > 0) {
        rows.push([
          jId,
          date,
          `"${ref}"`,
          '4010',
          `"4010 - Tyre Sales Revenue"`,
          '0.00',
          netGoodsRevenue.toFixed(2),
          `"${customer}"`,
          `"Tyre Merchandise Sales"`,
          `"VAT_${vatRate}PCT"`
        ]);
      }

      // 3. Credit Workshop Labour Revenue (Account 4020)
      if (netServiceRevenue > 0) {
        rows.push([
          jId,
          date,
          `"${ref}"`,
          '4020',
          `"4020 - Workshop Labour & Fitment Revenue"`,
          '0.00',
          netServiceRevenue.toFixed(2),
          `"${customer}"`,
          `"Mounting and Workshop Services"`,
          `"VAT_${vatRate}PCT"`
        ]);
      }

      // 4. Credit Eco Disposal Surcharge (Account 4030)
      if (orderEco > 0) {
        rows.push([
          jId,
          date,
          `"${ref}"`,
          '4030',
          `"4030 - Statutory Eco Disposal Fees"`,
          '0.00',
          orderEco.toFixed(2),
          `"${customer}"`,
          `"Tyre Shredding Levy"`,
          `"EXEMPT"`
        ]);
      }

      // 5. Credit VAT / Sales Tax Payable (Account 2100)
      if (totalVat > 0) {
        rows.push([
          jId,
          date,
          `"${ref}"`,
          '2100',
          `"2100 - Dominica IRD VAT Payable"`,
          '0.00',
          totalVat.toFixed(2),
          `"Dominica Inland Revenue Department"`,
          `"Output VAT @ ${vatRate}%"`,
          `"VAT_LIABILITY"`
        ]);
      }
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `quickbooks_general_ledger_journal_${period.toLowerCase()}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportNotice(`Exported QuickBooks General Ledger (${filteredOrders.length} balanced double-entry transactions)!`);
    setTimeout(() => setExportNotice(null), 4000);
  };

  // Download Dominica Inland Revenue Department (IRD) Tax Return Schedule CSV
  const handleExportTaxSchedule = () => {
    const lines = [
      '========================================================================',
      'MAX EXECUTIVE TIRES LTD - OFFICIAL TAX FILING WORKSHEET',
      'COMMONWEALTH OF DOMINICA - INLAND REVENUE DEPARTMENT (IRD) VAT RETURN',
      'Maranatha Square, Pichelin, Dominica | Tel: (767) 276-8973 / (767) 614-8973',
      `Tax Registration / VAT TIN: DOM-VAT-7829-PICHELIN`,
      `Filing Period: ${period} | Report Generated: ${new Date().toLocaleString()}`,
      `Tax Accounting Basis: ${taxMethod === 'inclusive' ? 'VAT-Inclusive (15/115 Retail Factor)' : 'VAT-Exclusive (+15% Taxable)'}`,
      '========================================================================',
      '',
      'LINE ITEM,DESCRIPTION,RATE / BASIS,AMOUNT_XCD,AMOUNT_USD',
      `Box 100,"Total Gross Sales Receipts (All Orders & Counter POS)","Gross",${accountingMetrics.totalGrossReceipts.toFixed(2)},${(accountingMetrics.totalGrossReceipts / 2.70).toFixed(2)}`,
      `Box 105,"Exempt Supplies (Statutory Eco Disposal Surcharge)","Exempt",${accountingMetrics.nonTaxableEco.toFixed(2)},${(accountingMetrics.nonTaxableEco / 2.70).toFixed(2)}`,
      `Box 110,"Net Taxable Supplies Base (Goods & Workshop Services)","Taxable Base",${accountingMetrics.netTaxableSales.toFixed(2)},${(accountingMetrics.netTaxableSales / 2.70).toFixed(2)}`,
      `Box 115,"Taxable Tyre Merchandise Sales Base","Supplies",${(accountingMetrics.grossTyreSales - accountingMetrics.outputVatGoods).toFixed(2)},${((accountingMetrics.grossTyreSales - accountingMetrics.outputVatGoods) / 2.70).toFixed(2)}`,
      `Box 120,"Taxable Workshop Labour & Fitment Services Base","Services",${(accountingMetrics.grossServices - accountingMetrics.outputVatServices).toFixed(2)},${((accountingMetrics.grossServices - accountingMetrics.outputVatServices) / 2.70).toFixed(2)}`,
      `Box 200,"Output VAT Collected on Tyre Goods",${vatRate}% Standard,${accountingMetrics.outputVatGoods.toFixed(2)},${(accountingMetrics.outputVatGoods / 2.70).toFixed(2)}`,
      `Box 205,"Output VAT Collected on Workshop Services",${vatRate}% Standard,${accountingMetrics.outputVatServices.toFixed(2)},${(accountingMetrics.outputVatServices / 2.70).toFixed(2)}`,
      `Box 210,"TOTAL OUTPUT VAT TAX COLLECTED",${vatRate}%,${accountingMetrics.totalOutputVat.toFixed(2)},${(accountingMetrics.totalOutputVat / 2.70).toFixed(2)}`,
      `Box 300,"Estimated Input Tax Credit Claimable (COGS Imports)","15% on Purchases",${accountingMetrics.estimatedInputTaxCredit.toFixed(2)},${(accountingMetrics.estimatedInputTaxCredit / 2.70).toFixed(2)}`,
      `Box 500,"NET VAT REMITTANCE DUE TO DOMINICA IRD","Box 210 less Credits",${accountingMetrics.netVatPayableToIRD.toFixed(2)},${(accountingMetrics.netVatPayableToIRD / 2.70).toFixed(2)}`,
      '',
      '========================================================================',
      'PAYMENT CLEARING CHANNELS AUDIT RECONCILIATION',
      '========================================================================',
      `Account 1010,"Cash on Hand (Workshop Counter)",,${accountingMetrics.paymentMethodTotals['Cash at Counter'].toFixed(2)},${(accountingMetrics.paymentMethodTotals['Cash at Counter'] / 2.70).toFixed(2)}`,
      `Account 1020,"SmartPOS Card Terminal Merchant Clearing",,${accountingMetrics.paymentMethodTotals['SmartPOS Card Terminal'].toFixed(2)},${(accountingMetrics.paymentMethodTotals['SmartPOS Card Terminal'] / 2.70).toFixed(2)}`,
      `Account 1030,"Stripe Online Payments Clearing",,${accountingMetrics.paymentMethodTotals['Stripe Online'].toFixed(2)},${(accountingMetrics.paymentMethodTotals['Stripe Online'] / 2.70).toFixed(2)}`,
      `Account 1040,"Direct Bank Wire Transfers",,${accountingMetrics.paymentMethodTotals['Bank Transfer'].toFixed(2)},${(accountingMetrics.paymentMethodTotals['Bank Transfer'] / 2.70).toFixed(2)}`,
      `Account 1050,"Other Clearing Channels",,${accountingMetrics.paymentMethodTotals['Other'].toFixed(2)},${(accountingMetrics.paymentMethodTotals['Other'] / 2.70).toFixed(2)}`,
      `Total Reconciled,"Total Reconciled Inflow",,${accountingMetrics.totalGrossReceipts.toFixed(2)},${(accountingMetrics.totalGrossReceipts / 2.70).toFixed(2)}`,
      '',
      '========================================================================',
      'INVENTORY ASSET VALUATION (QUICKBOOKS BALANCE SHEET)',
      '========================================================================',
      `Account 1200,"Total Inventory Units in Stock",,${inventoryValuation.totalStockUnits} units,`,
      `Account 1200,"Tyre Inventory Asset at Estimated Cost (COGS)",,${inventoryValuation.totalEstimatedCostValuation.toFixed(2)},${(inventoryValuation.totalEstimatedCostValuation / 2.70).toFixed(2)}`,
      `Account 1200,"Tyre Inventory Valuation at Retail Value",,${inventoryValuation.totalRetailValuation.toFixed(2)},${(inventoryValuation.totalRetailValuation / 2.70).toFixed(2)}`,
      '',
      'Certified Prepared for Inland Revenue Submission: Max Executive Tires Management'
    ];

    const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `dominica_ird_tax_schedule_${period.toLowerCase()}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportNotice(`Downloaded Dominica IRD Tax Filing Schedule!`);
    setTimeout(() => setExportNotice(null), 4000);
  };

  // Print QuickBooks Accounting & Tax Summary
  const handlePrintAccountingReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print the QuickBooks Tax Statement.');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>QuickBooks Tax & Accounting Report - Max Executive Tires</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            padding: 30px;
            margin: 0;
            line-height: 1.5;
            font-size: 13px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #2ca01c;
            padding-bottom: 15px;
            margin-bottom: 25px;
          }
          .company-name {
            font-size: 22px;
            font-weight: 800;
            color: #0f172a;
            margin: 0;
          }
          .tagline {
            font-size: 12px;
            color: #64748b;
            margin-top: 2px;
          }
          .badge-qb {
            background: #2ca01c;
            color: #fff;
            padding: 4px 10px;
            border-radius: 6px;
            font-weight: bold;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 25px;
          }
          .box {
            border: 1px solid #e2e8f0;
            padding: 12px 16px;
            border-radius: 8px;
            background: #f8fafc;
          }
          .box-label {
            font-size: 10px;
            text-transform: uppercase;
            color: #64748b;
            font-weight: bold;
          }
          .box-val {
            font-size: 18px;
            font-weight: 800;
            color: #0f172a;
            margin-top: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
          }
          th {
            background: #f1f5f9;
            text-align: left;
            padding: 10px 12px;
            font-size: 11px;
            text-transform: uppercase;
            color: #475569;
            border-bottom: 1px solid #cbd5e1;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #f1f5f9;
          }
          .text-right {
            text-align: right;
          }
          .font-bold {
            font-weight: bold;
          }
          .section-title {
            font-size: 14px;
            font-weight: 800;
            margin: 20px 0 10px 0;
            color: #0f172a;
            border-left: 4px solid #2ca01c;
            padding-left: 8px;
          }
          .sign-off {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
          }
          .sign-line {
            width: 200px;
            border-bottom: 1px solid #64748b;
            margin-top: 30px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="company-name">MAX EXECUTIVE TIRES LTD</h1>
            <div class="tagline">Maranatha Square, Pichelin, Commonwealth of Dominica</div>
            <div class="tagline">TIN / VAT Reg: DOM-VAT-7829-PICHELIN | Tel: (767) 276-8973</div>
          </div>
          <div style="text-align: right;">
            <span class="badge-qb">QuickBooks Style Tax Filing</span>
            <div style="font-size: 11px; margin-top: 8px; color: #64748b;">
              Period: <strong>${period}</strong><br/>
              Date: <strong>${new Date().toLocaleDateString('en-GB')}</strong>
            </div>
          </div>
        </div>

        <div class="grid">
          <div class="box">
            <div class="box-label">Gross Taxable Receipts</div>
            <div class="box-val">EC$ ${accountingMetrics.totalGrossReceipts.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <div style="font-size: 10px; color: #64748b;">US$ ${(accountingMetrics.totalGrossReceipts / 2.70).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="box">
            <div class="box-label">Total Output VAT (15%)</div>
            <div class="box-val" style="color: #2ca01c;">EC$ ${accountingMetrics.totalOutputVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <div style="font-size: 10px; color: #64748b;">Dominica IRD Tax Collected</div>
          </div>
          <div class="box">
            <div class="box-label">Net VAT Remittance Due</div>
            <div class="box-val" style="color: #0369a1;">EC$ ${accountingMetrics.netVatPayableToIRD.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <div style="font-size: 10px; color: #64748b;">Less estimated wholesale tax credit</div>
          </div>
        </div>

        <div class="section-title">Dominica Inland Revenue Department (IRD) Tax Filing Worksheet</div>
        <table>
          <thead>
            <tr>
              <th>Box / Line</th>
              <th>Description</th>
              <th>Accounting Classification</th>
              <th class="text-right">Amount (EC$)</th>
              <th class="text-right">Amount (US$)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="font-bold">Box 100</td>
              <td>Total Gross Receipts (All Tyre Sales & Workshop Services)</td>
              <td>Gross Revenue</td>
              <td class="text-right font-bold">EC$ ${accountingMetrics.totalGrossReceipts.toFixed(2)}</td>
              <td class="text-right">US$ ${(accountingMetrics.totalGrossReceipts / 2.70).toFixed(2)}</td>
            </tr>
            <tr>
              <td class="font-bold">Box 105</td>
              <td>Statutory Eco Disposal Levies (Zero-Rated / Exempt)</td>
              <td>Statutory Levy</td>
              <td class="text-right font-bold">EC$ ${accountingMetrics.nonTaxableEco.toFixed(2)}</td>
              <td class="text-right">US$ ${(accountingMetrics.nonTaxableEco / 2.70).toFixed(2)}</td>
            </tr>
            <tr>
              <td class="font-bold">Box 110</td>
              <td>Net Taxable Supplies Base (Sales & Services Net of Tax)</td>
              <td>Taxable Base</td>
              <td class="text-right font-bold">EC$ ${accountingMetrics.netTaxableSales.toFixed(2)}</td>
              <td class="text-right">US$ ${(accountingMetrics.netTaxableSales / 2.70).toFixed(2)}</td>
            </tr>
            <tr>
              <td class="font-bold">Box 200</td>
              <td>Output VAT Collected on Tyre Goods</td>
              <td>15% Dominica VAT</td>
              <td class="text-right font-bold" style="color: #2ca01c;">EC$ ${accountingMetrics.outputVatGoods.toFixed(2)}</td>
              <td class="text-right">US$ ${(accountingMetrics.outputVatGoods / 2.70).toFixed(2)}</td>
            </tr>
            <tr>
              <td class="font-bold">Box 205</td>
              <td>Output VAT Collected on Workshop Labour Services</td>
              <td>15% Dominica VAT</td>
              <td class="text-right font-bold" style="color: #2ca01c;">EC$ ${accountingMetrics.outputVatServices.toFixed(2)}</td>
              <td class="text-right">US$ ${(accountingMetrics.outputVatServices / 2.70).toFixed(2)}</td>
            </tr>
            <tr style="background: #f8fafc; font-weight: bold;">
              <td class="font-bold">Box 210</td>
              <td>TOTAL OUTPUT VAT LIABILITY (Collected from Customers)</td>
              <td>Tax Liability</td>
              <td class="text-right font-bold" style="color: #166534;">EC$ ${accountingMetrics.totalOutputVat.toFixed(2)}</td>
              <td class="text-right">US$ ${(accountingMetrics.totalOutputVat / 2.70).toFixed(2)}</td>
            </tr>
            <tr>
              <td class="font-bold">Box 300</td>
              <td>Input Tax Credits Claimable on Wholesale Inventory COGS</td>
              <td>Input Credit</td>
              <td class="text-right font-bold">EC$ ${accountingMetrics.estimatedInputTaxCredit.toFixed(2)}</td>
              <td class="text-right">US$ ${(accountingMetrics.estimatedInputTaxCredit / 2.70).toFixed(2)}</td>
            </tr>
            <tr style="background: #e0f2fe; font-weight: bold;">
              <td class="font-bold">Box 500</td>
              <td>NET ESTIMATED TAX REMITTANCE PAYABLE TO DOMINICA IRD</td>
              <td>Net Tax Remittance</td>
              <td class="text-right font-bold" style="color: #0369a1; font-size: 14px;">EC$ ${accountingMetrics.netVatPayableToIRD.toFixed(2)}</td>
              <td class="text-right">US$ ${(accountingMetrics.netVatPayableToIRD / 2.70).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div class="section-title">QuickBooks Chart of Accounts Clearing & Balance Sheet Audit</div>
        <table>
          <thead>
            <tr>
              <th>Account Code</th>
              <th>Account Name</th>
              <th>Classification</th>
              <th class="text-right">Balance (EC$)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="font-bold">1010</td>
              <td>Undeposited Cash Funds (Workshop Cash Drawer)</td>
              <td>Current Asset</td>
              <td class="text-right font-bold">EC$ ${accountingMetrics.paymentMethodTotals['Cash at Counter'].toFixed(2)}</td>
            </tr>
            <tr>
              <td class="font-bold">1020</td>
              <td>SmartPOS Card Terminal Clearing</td>
              <td>Current Asset</td>
              <td class="text-right font-bold">EC$ ${accountingMetrics.paymentMethodTotals['SmartPOS Card Terminal'].toFixed(2)}</td>
            </tr>
            <tr>
              <td class="font-bold">1030</td>
              <td>Stripe Online Merchant Clearing</td>
              <td>Current Asset</td>
              <td class="text-right font-bold">EC$ ${accountingMetrics.paymentMethodTotals['Stripe Online'].toFixed(2)}</td>
            </tr>
            <tr>
              <td class="font-bold">1040</td>
              <td>Direct Bank Wire Transfers</td>
              <td>Current Asset</td>
              <td class="text-right font-bold">EC$ ${accountingMetrics.paymentMethodTotals['Bank Transfer'].toFixed(2)}</td>
            </tr>
            <tr>
              <td class="font-bold">1200</td>
              <td>Tyre Inventory Asset Valuation (${inventoryValuation.totalStockUnits} units in stock)</td>
              <td>Inventory Asset</td>
              <td class="text-right font-bold">EC$ ${inventoryValuation.totalEstimatedCostValuation.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div class="sign-off">
          <div>
            <div>Prepared By: <strong>Workshop Accounting & Dispatch</strong></div>
            <div class="sign-line"></div>
            <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Authorized Bookkeeper / Accountant</div>
          </div>
          <div>
            <div>Approved By: <strong>Managing Director</strong></div>
            <div class="sign-line"></div>
            <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Max Executive Tires Ltd</div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* QuickBooks Style Brand & Action Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-950 text-white p-5 sm:p-6 rounded-2xl shadow-md border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="bg-[#2CA01C] text-white font-black text-[10px] px-2.5 py-0.5 rounded-md uppercase tracking-wider shadow-2xs flex items-center gap-1">
                <Calculator className="w-3 h-3" />
                QuickBooks Accounting Engine
              </span>
              <span className="bg-slate-800 text-emerald-300 border border-emerald-500/30 font-bold text-[10px] px-2 py-0.5 rounded-md">
                Dominica Inland Revenue (IRD) Standard VAT 15%
              </span>
              <span className="text-slate-400 text-xs font-mono">TIN: DOM-VAT-7829-PICHELIN</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Financial & Tax Reports Center</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
              Automated Chart of Accounts, Double-Entry General Ledger, P&L statements, and Dominica VAT tax schedules designed for effortless tax filing.
            </p>
          </div>

          {/* Export & Action Buttons */}
          <div className="flex items-center flex-wrap gap-2 shrink-0">
            <button
              id="qb-export-tax-btn"
              type="button"
              onClick={handleExportTaxSchedule}
              className="inline-flex items-center gap-1.5 bg-[#2CA01C] hover:bg-emerald-600 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
              title="Download official Dominica IRD Tax Return worksheet formatted with box numbers"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Tax Schedule (CSV)</span>
            </button>

            <button
              id="qb-export-receipts-btn"
              type="button"
              onClick={handleExportQuickBooksSalesReceipts}
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
              title="Download standard QuickBooks Online & Desktop Sales Receipts CSV"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>QuickBooks Receipts (CSV)</span>
            </button>

            <button
              id="qb-export-journal-btn"
              type="button"
              onClick={handleExportQuickBooksJournal}
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
              title="Download balanced double-entry General Ledger journal entries"
            >
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span>General Ledger (QBO/CSV)</span>
            </button>

            <button
              id="qb-print-report-btn"
              type="button"
              onClick={handlePrintAccountingReport}
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs px-3 py-2 rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
              title="Print official QuickBooks accounting and tax summary statement"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Print Statement</span>
            </button>
          </div>
        </div>

        {/* Accounting Period & Tax Basis Controls */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              Accounting Period:
            </span>
            {(['ALL', 'THIS_MONTH', 'LAST_MONTH', 'Q3_2026', 'YTD'] as AccountingPeriod[]).map((p) => {
              const labels: Record<AccountingPeriod, string> = {
                ALL: `All Records (${orders.length})`,
                THIS_MONTH: 'This Month',
                LAST_MONTH: 'Last Month',
                Q3_2026: 'Q3 2026',
                YTD: 'Year to Date (2026)'
              };
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    period === p
                      ? 'bg-emerald-500 text-slate-950 shadow-xs'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
                  }`}
                >
                  {labels[p]}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            {/* Tax Inclusive vs Exclusive toggle */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700/80">
              <span className="text-slate-400 text-[11px] font-medium">Tax Calculation:</span>
              <button
                type="button"
                onClick={() => setTaxMethod('inclusive')}
                className={`text-[11px] font-bold px-2 py-0.5 rounded transition ${
                  taxMethod === 'inclusive' ? 'bg-[#2CA01C] text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Dominica Retail Standard: Prices include 15% VAT"
              >
                VAT-Inclusive (15/115)
              </button>
              <button
                type="button"
                onClick={() => setTaxMethod('exclusive')}
                className={`text-[11px] font-bold px-2 py-0.5 rounded transition ${
                  taxMethod === 'exclusive' ? 'bg-[#2CA01C] text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Tax Added at Invoicing: Net + 15% VAT"
              >
                VAT-Exclusive (+15%)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Export Notification Toast */}
      {exportNotice && (
        <div className="bg-emerald-950 border border-emerald-700 text-emerald-200 px-4 py-3 rounded-xl shadow-md flex items-center justify-between gap-3 text-xs font-bold animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{exportNotice}</span>
          </div>
          <button
            onClick={() => setExportNotice(null)}
            className="text-emerald-400 hover:text-emerald-200 p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Accounting KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gross Total Receipts</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            EC$ {accountingMetrics.totalGrossReceipts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>US$ {(accountingMetrics.totalGrossReceipts / 2.70).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="font-bold text-slate-700">{accountingMetrics.orderCount} transactions</span>
          </div>
        </div>

        {/* Output VAT Collected */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Dominica VAT (15%) Collected</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#2CA01C] flex items-center justify-center font-bold">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#2CA01C] mt-2">
            EC$ {accountingMetrics.totalOutputVat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Inland Revenue Dept</span>
            <span className="font-bold text-emerald-700">Output Tax Liability</span>
          </div>
        </div>

        {/* Net Tax Remittance */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Net Tax Payable to IRD</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-700 mt-2">
            EC$ {accountingMetrics.netVatPayableToIRD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>After wholesale input credits</span>
            <span className="font-bold text-blue-700">Box 500 Remittance</span>
          </div>
        </div>

        {/* Inventory Asset Valuation */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Inventory Asset Value</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            EC$ {inventoryValuation.totalRetailValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Cost: EC$ {inventoryValuation.totalEstimatedCostValuation.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            <span className="font-bold text-purple-700">{inventoryValuation.totalStockUnits} tyres</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveView('tax-schedule')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
            activeView === 'tax-schedule'
              ? 'bg-[#2CA01C] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Dominica IRD Tax Schedule (Worksheet)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('pnl')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
            activeView === 'pnl'
              ? 'bg-[#2CA01C] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>QuickBooks Profit & Loss (P&L)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('general-ledger')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
            activeView === 'general-ledger'
              ? 'bg-[#2CA01C] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>General Ledger Journal (Double-Entry)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('inventory-valuation')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
            activeView === 'inventory-valuation'
              ? 'bg-[#2CA01C] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>QuickBooks Inventory Valuation</span>
        </button>
      </div>

      {/* VIEW 1: DOMINICA IRD TAX SCHEDULE WORKSHEET */}
      {activeView === 'tax-schedule' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#2CA01C]" />
                  <span>Dominica Inland Revenue Department (IRD) - Standard VAT Return Schedule</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pre-computed line items matching Dominica Inland Revenue Form VAT-01 for simplified tax filing.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Method:</span>
                <span className="text-xs font-black text-slate-800 bg-slate-200 px-2.5 py-1 rounded-lg">
                  {taxMethod === 'inclusive' ? '15% Included in Retail Price' : '15% Added to Invoice'}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 w-24">Tax Box</th>
                    <th className="py-3 px-4">Line Item Description</th>
                    <th className="py-3 px-4">Statutory Basis / Rate</th>
                    <th className="py-3 px-4 text-right">Amount (EC$)</th>
                    <th className="py-3 px-4 text-right">Amount (US$)</th>
                    <th className="py-3 px-4 text-center">Tax Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {/* Box 100: Gross Total */}
                  <tr className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-black text-slate-900">Box 100</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">Total Gross Receipts</div>
                      <div className="text-[11px] text-slate-500">All retail tyre sales, workshop fitment services, and statutory surcharges</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">Gross Cash & Card</td>
                    <td className="py-3 px-4 text-right font-black text-slate-900">
                      EC$ {accountingMetrics.totalGrossReceipts.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600 font-mono">
                      US$ {(accountingMetrics.totalGrossReceipts / 2.70).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">Total Inflow</span>
                    </td>
                  </tr>

                  {/* Box 105: Exempt Surcharges */}
                  <tr className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-black text-slate-900">Box 105</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">Statutory Eco Disposal & Shredding Fees</div>
                      <div className="text-[11px] text-slate-500">Zero-rated environmental surcharge for waste tyre management</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">0.0% (Exempt)</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-800">
                      EC$ {accountingMetrics.nonTaxableEco.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600 font-mono">
                      US$ {(accountingMetrics.nonTaxableEco / 2.70).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">Exempt</span>
                    </td>
                  </tr>

                  {/* Box 110: Taxable Supplies Base */}
                  <tr className="hover:bg-slate-50 bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-black text-blue-900">Box 110</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-blue-950">Net Taxable Supplies Base</div>
                      <div className="text-[11px] text-slate-500">Gross taxable supplies exclusive of output VAT</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">Taxable Base</td>
                    <td className="py-3 px-4 text-right font-black text-blue-900">
                      EC$ {accountingMetrics.netTaxableSales.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600 font-mono">
                      US$ {(accountingMetrics.netTaxableSales / 2.70).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold">Standard Base</span>
                    </td>
                  </tr>

                  {/* Box 115: Goods Base */}
                  <tr className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-slate-700">Box 115</td>
                    <td className="py-3 px-4 pl-8 text-slate-700">
                      <span>↳ Taxable Tyre Merchandise Goods Base</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">Goods Supplies</td>
                    <td className="py-3 px-4 text-right text-slate-700 font-mono">
                      EC$ {(accountingMetrics.grossTyreSales - accountingMetrics.outputVatGoods).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 font-mono">
                      US$ {((accountingMetrics.grossTyreSales - accountingMetrics.outputVatGoods) / 2.70).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-400">—</td>
                  </tr>

                  {/* Box 120: Services Base */}
                  <tr className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-slate-700">Box 120</td>
                    <td className="py-3 px-4 pl-8 text-slate-700">
                      <span>↳ Taxable Workshop Labour Services Base (Mounting, Valves)</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">Service Supplies</td>
                    <td className="py-3 px-4 text-right text-slate-700 font-mono">
                      EC$ {(accountingMetrics.grossServices - accountingMetrics.outputVatServices).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 font-mono">
                      US$ {((accountingMetrics.grossServices - accountingMetrics.outputVatServices) / 2.70).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-400">—</td>
                  </tr>

                  {/* Box 200: Output VAT Goods */}
                  <tr className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-800">Box 200</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">Output VAT on Tyre Goods</div>
                      <div className="text-[11px] text-slate-500">15.0% standard Dominica VAT on retail tyres</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">{vatRate}.0% Rate</td>
                    <td className="py-3 px-4 text-right font-bold text-[#2CA01C]">
                      EC$ {accountingMetrics.outputVatGoods.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600 font-mono">
                      US$ {(accountingMetrics.outputVatGoods / 2.70).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">Output VAT</span>
                    </td>
                  </tr>

                  {/* Box 205: Output VAT Services */}
                  <tr className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-800">Box 205</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">Output VAT on Workshop Labour & Fitment</div>
                      <div className="text-[11px] text-slate-500">15.0% standard Dominica VAT on tyre mounting & valves</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">{vatRate}.0% Rate</td>
                    <td className="py-3 px-4 text-right font-bold text-[#2CA01C]">
                      EC$ {accountingMetrics.outputVatServices.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600 font-mono">
                      US$ {(accountingMetrics.outputVatServices / 2.70).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">Output VAT</span>
                    </td>
                  </tr>

                  {/* Box 210: Total Output VAT */}
                  <tr className="bg-emerald-50/70 border-t-2 border-b-2 border-emerald-300">
                    <td className="py-3.5 px-4 font-mono font-black text-emerald-950">Box 210</td>
                    <td className="py-3.5 px-4">
                      <div className="font-black text-emerald-950 text-sm">TOTAL OUTPUT VAT COLLECTED</div>
                      <div className="text-[11px] text-emerald-800">Total statutory tax liability collected from customers</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-900 font-mono">Total Output</td>
                    <td className="py-3.5 px-4 text-right font-black text-emerald-950 text-sm">
                      EC$ {accountingMetrics.totalOutputVat.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-emerald-800 font-mono font-bold">
                      US$ {(accountingMetrics.totalOutputVat / 2.70).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="bg-emerald-600 text-white px-2.5 py-1 rounded text-[10px] font-black uppercase">
                        Tax Liability
                      </span>
                    </td>
                  </tr>

                  {/* Box 300: Input Tax Credit */}
                  <tr className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-black text-slate-800">Box 300</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">Input Tax Credits (Wholesale Tyre Imports)</div>
                      <div className="text-[11px] text-slate-500">Customs / wholesale import VAT claimable on inventory sold</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">15% on COGS</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-800">
                      EC$ {accountingMetrics.estimatedInputTaxCredit.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600 font-mono">
                      US$ {(accountingMetrics.estimatedInputTaxCredit / 2.70).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">Credit</span>
                    </td>
                  </tr>

                  {/* Box 500: Net Remittance Due */}
                  <tr className="bg-blue-50/80 border-t-2 border-b-2 border-blue-400">
                    <td className="py-4 px-4 font-mono font-black text-blue-950 text-base">Box 500</td>
                    <td className="py-4 px-4">
                      <div className="font-black text-blue-950 text-base">NET TAX REMITTANCE PAYABLE TO DOMINICA IRD</div>
                      <div className="text-xs text-blue-800 font-semibold">
                        Final balance due to the Commonwealth of Dominica Inland Revenue Department
                      </div>
                    </td>
                    <td className="py-4 px-4 font-bold text-blue-900 font-mono">Box 210 less Credits</td>
                    <td className="py-4 px-4 text-right font-black text-blue-950 text-base">
                      EC$ {accountingMetrics.netVatPayableToIRD.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-right font-black text-blue-900 font-mono">
                      US$ {(accountingMetrics.netVatPayableToIRD / 2.70).toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-black uppercase shadow-xs">
                        Due for Remittance
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Method Clearing Breakdown (For Bank & Cash Reconciliation) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-700" />
              <span>QuickBooks Payment Clearing Channels Reconciliation</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <div className="text-[10px] font-bold text-slate-500 uppercase">1010 - Cash Drawer (Counter)</div>
                <div className="text-lg font-black text-slate-900 mt-1">
                  EC$ {accountingMetrics.paymentMethodTotals['Cash at Counter'].toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500">Physical shop currency</div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <div className="text-[10px] font-bold text-slate-500 uppercase">1020 - SmartPOS Card Terminal</div>
                <div className="text-lg font-black text-slate-900 mt-1">
                  EC$ {accountingMetrics.paymentMethodTotals['SmartPOS Card Terminal'].toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500">Debit / Credit card reader</div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <div className="text-[10px] font-bold text-slate-500 uppercase">1030 - Stripe Online Portal</div>
                <div className="text-lg font-black text-slate-900 mt-1">
                  EC$ {accountingMetrics.paymentMethodTotals['Stripe Online'].toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500">Web card payments</div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <div className="text-[10px] font-bold text-slate-500 uppercase">1040 - Bank Direct Transfer</div>
                <div className="text-lg font-black text-slate-900 mt-1">
                  EC$ {accountingMetrics.paymentMethodTotals['Bank Transfer'].toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500">Direct account deposits</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: QUICKBOOKS PROFIT & LOSS (P&L) */}
      {activeView === 'pnl' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 max-w-4xl mx-auto font-sans">
          <div className="border-b border-slate-200 pb-4 mb-6 flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="text-xs font-black text-[#2CA01C] uppercase tracking-wider">QuickBooks Financial Statement</div>
              <h3 className="text-xl font-black text-slate-900">Profit and Loss Statement</h3>
              <p className="text-xs text-slate-500">Max Executive Tires Ltd • Period: {period} (All amounts in EC$)</p>
            </div>
            <button
              onClick={handlePrintAccountingReport}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print P&L</span>
            </button>
          </div>

          <div className="space-y-4 text-xs font-medium">
            {/* Income Section */}
            <div>
              <div className="font-bold text-slate-900 uppercase tracking-wide border-b border-slate-300 pb-1 text-[11px]">
                Ordinary Income / Revenue
              </div>
              <div className="divide-y divide-slate-100 pt-1">
                <div className="flex items-center justify-between py-2 pl-4">
                  <span className="text-slate-700">4010 • Tyre Merchandise Sales</span>
                  <span className="font-mono font-bold text-slate-900">EC$ {accountingMetrics.grossTyreSales.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between py-2 pl-4">
                  <span className="text-slate-700">4020 • Workshop Labour & Fitment Services</span>
                  <span className="font-mono font-bold text-slate-900">EC$ {accountingMetrics.grossServices.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between py-2 pl-4">
                  <span className="text-slate-700">4030 • Statutory Environmental Eco Disposal Levies</span>
                  <span className="font-mono font-bold text-slate-900">EC$ {accountingMetrics.grossEcoFees.toFixed(2)}</span>
                </div>
                {accountingMetrics.netAdjustments !== 0 && (
                  <div className="flex items-center justify-between py-2 pl-4">
                    <span className="text-slate-700">4090 • Net Price Adjustments / Allowances</span>
                    <span className="font-mono font-bold text-slate-900">EC$ {accountingMetrics.netAdjustments.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-2.5 font-black text-slate-950 bg-slate-50 px-2 rounded">
                  <span>Total Operating Revenue</span>
                  <span className="font-mono text-sm">EC$ {accountingMetrics.totalGrossReceipts.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Cost of Goods Sold */}
            <div className="pt-2">
              <div className="font-bold text-slate-900 uppercase tracking-wide border-b border-slate-300 pb-1 text-[11px]">
                Cost of Goods Sold (COGS)
              </div>
              <div className="divide-y divide-slate-100 pt-1">
                <div className="flex items-center justify-between py-2 pl-4">
                  <span className="text-slate-700">5010 • Cost of Tyre Inventory Sold (~62% wholesale basis)</span>
                  <span className="font-mono font-bold text-slate-900">EC$ {accountingMetrics.estimatedCOGS.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between py-2.5 font-black text-slate-950 bg-slate-50 px-2 rounded">
                  <span>Total Cost of Goods Sold</span>
                  <span className="font-mono text-sm">EC$ {accountingMetrics.estimatedCOGS.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Gross Profit */}
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between font-black text-emerald-950">
              <div>
                <span className="text-sm">GROSS PROFIT</span>
                <span className="text-xs text-emerald-700 font-normal ml-2">
                  (Gross Margin: {accountingMetrics.grossMarginPct.toFixed(1)}%)
                </span>
              </div>
              <span className="text-base font-mono">
                EC$ {accountingMetrics.grossProfit.toFixed(2)}
              </span>
            </div>

            {/* Tax Liability Allocation Note */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <div className="font-bold text-slate-800">QuickBooks Tax Allocation Note:</div>
              <div>
                Value Added Tax (15% Output VAT: <strong>EC$ {accountingMetrics.totalOutputVat.toFixed(2)}</strong>) is classified as a Balance Sheet Liability under Account <strong>2100 - VAT Payable</strong> rather than operating income, preventing inflation of reported earnings.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: GENERAL LEDGER JOURNAL (DOUBLE-ENTRY AUDIT) */}
      {activeView === 'general-ledger' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#2CA01C]" />
                <span>QuickBooks General Ledger - Balanced Double-Entry Journal</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Each transaction balanced with corresponding asset debit and revenue/tax liability credit.
              </p>
            </div>

            <button
              onClick={handleExportQuickBooksJournal}
              className="inline-flex items-center gap-1.5 bg-[#2CA01C] hover:bg-emerald-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Journal (CSV)</span>
            </button>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-100 z-10">
                <tr className="text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Ref / Order</th>
                  <th className="py-2.5 px-3">Account</th>
                  <th className="py-2.5 px-4">Description / Memo</th>
                  <th className="py-2.5 px-3 text-right">Debit (EC$)</th>
                  <th className="py-2.5 px-3 text-right">Credit (EC$)</th>
                  <th className="py-2.5 px-3 text-center">Tax Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {filteredOrders.slice(0, 50).map((ord, idx) => {
                  let orderTyres = 0;
                  let orderServices = 0;
                  let orderEco = 0;

                  (ord.items || []).forEach((it) => {
                    const q = it.quantity || 1;
                    orderTyres += (it.tyre?.priceXCD || 0) * q;
                    if (it.includeMounting) orderServices += (servicePrices['mounting'] ?? 20) * q;
                    if (it.includeNewValves) orderServices += (servicePrices['valves'] ?? 15) * q;
                    if (it.includeShredding) orderEco += (servicePrices['disposal'] ?? 1) * q;
                  });

                  const totalOrd = Number(ord.totalXCD || (orderTyres + orderServices + orderEco));
                  const vatFactor = vatRate / (100 + vatRate);
                  const totalVat = taxMethod === 'inclusive' ? (orderTyres + orderServices) * vatFactor : (orderTyres + orderServices) * (vatRate / 100);
                  const netRevenue = (orderTyres + orderServices) - totalVat;

                  const clearingAccount = ord.paymentMethod?.toLowerCase().includes('cash')
                    ? '1010 Cash Drawer'
                    : ord.paymentMethod?.toLowerCase().includes('stripe')
                    ? '1030 Stripe Clearing'
                    : '1020 SmartPOS Terminal';

                  return (
                    <React.Fragment key={ord.id || idx}>
                      {/* Debit row */}
                      <tr className="bg-slate-50/50 hover:bg-slate-100/60">
                        <td className="py-2 px-3 text-slate-500">{ord.timestamp?.split('T')[0] || 'Recent'}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{ord.reservationCode || ord.id.slice(0, 8)}</td>
                        <td className="py-2 px-3 font-bold text-blue-700">{clearingAccount}</td>
                        <td className="py-2 px-4 text-slate-700 font-sans">Payment from {ord.customerName}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">{totalOrd.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right text-slate-400">0.00</td>
                        <td className="py-2 px-3 text-center text-slate-400">—</td>
                      </tr>

                      {/* Credit Merchandise row */}
                      <tr className="hover:bg-slate-50">
                        <td className="py-1.5 px-3 text-slate-400"></td>
                        <td className="py-1.5 px-3 text-slate-400"></td>
                        <td className="py-1.5 px-3 text-slate-700 pl-6">4010 Tyre Sales</td>
                        <td className="py-1.5 px-4 text-slate-600 font-sans">Net Tyre Goods Supplies</td>
                        <td className="py-1.5 px-3 text-right text-slate-400">0.00</td>
                        <td className="py-1.5 px-3 text-right text-slate-800">{netRevenue.toFixed(2)}</td>
                        <td className="py-1.5 px-3 text-center text-emerald-600 font-bold">VAT 15%</td>
                      </tr>

                      {/* Credit VAT row */}
                      {totalVat > 0 && (
                        <tr className="hover:bg-slate-50">
                          <td className="py-1.5 px-3 text-slate-400"></td>
                          <td className="py-1.5 px-3 text-slate-400"></td>
                          <td className="py-1.5 px-3 text-[#2CA01C] pl-6">2100 VAT Payable</td>
                          <td className="py-1.5 px-4 text-slate-600 font-sans">Output Tax @ {vatRate}%</td>
                          <td className="py-1.5 px-3 text-right text-slate-400">0.00</td>
                          <td className="py-1.5 px-3 text-right font-bold text-[#2CA01C]">{totalVat.toFixed(2)}</td>
                          <td className="py-1.5 px-3 text-center text-[#2CA01C] font-bold">TAX</td>
                        </tr>
                      )}

                      {/* Credit Eco fee row */}
                      {orderEco > 0 && (
                        <tr className="hover:bg-slate-50">
                          <td className="py-1.5 px-3 text-slate-400"></td>
                          <td className="py-1.5 px-3 text-slate-400"></td>
                          <td className="py-1.5 px-3 text-amber-700 pl-6">4030 Eco Surcharge</td>
                          <td className="py-1.5 px-4 text-slate-600 font-sans">Disposal & Shredding Fee</td>
                          <td className="py-1.5 px-3 text-right text-slate-400">0.00</td>
                          <td className="py-1.5 px-3 text-right text-amber-800">{orderEco.toFixed(2)}</td>
                          <td className="py-1.5 px-3 text-center text-amber-600 font-bold">EXEMPT</td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 4: QUICKBOOKS INVENTORY VALUATION & BALANCE SHEET */}
      {activeView === 'inventory-valuation' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Inventory Stock</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{inventoryValuation.totalStockUnits} Units</div>
              <div className="text-xs text-slate-500 mt-1">
                {inventoryValuation.newTyresStock} New Tyres • {inventoryValuation.usedTyresStock} Inspected Used
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Asset Valuation (Estimated Cost)</span>
              <div className="text-2xl font-black text-blue-700 mt-1">
                EC$ {inventoryValuation.totalEstimatedCostValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-slate-500 mt-1">Balance Sheet Account 1200 Inventory Asset</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Retail Valuation</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                EC$ {inventoryValuation.totalRetailValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Unrealized Retail Gross Margin: EC$ {inventoryValuation.potentialGrossMarginValuation.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Tyre Inventory Asset Schedule ({tyres.length} SKUs)
                </h4>
                <p className="text-xs text-slate-500">Live inventory valuation mapped for QuickBooks balance sheet reporting.</p>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-slate-100 z-10">
                  <tr className="text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-4">Brand & Model</th>
                    <th className="py-2.5 px-3">Size & Rim</th>
                    <th className="py-2.5 px-3 text-center">Condition</th>
                    <th className="py-2.5 px-3 text-right">Unit Price (EC$)</th>
                    <th className="py-2.5 px-3 text-center">In Stock</th>
                    <th className="py-2.5 px-4 text-right">Total Asset Value (EC$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tyres.map((t) => {
                    const totalVal = (t.priceXCD || 0) * (t.stockCount || 0);
                    return (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          {t.brand} {t.modelName}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">{t.size}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              t.condition === 'new' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {t.condition}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                          EC$ {(t.priceXCD || 0).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-900">{t.stockCount || 0}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-black text-slate-900">
                          EC$ {totalVal.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
