import { jsPDF } from 'jspdf';
import { Tyre } from '../types';
import { encodeToCode128, getTyreBarcodeValue } from './barcodeGenerator';
import { LabelPaperFormat } from '../components/InventoryBarcodeCenterModal';

export interface LabelSheetItem {
  tyre: Tyre | null;
  slotIndex: number;
}

/**
 * Generates an exact 8.5" x 11" US Letter PDF with 2" x 4" labels
 * Calibrated specifically for Avery 5163 / 5263 / 8163 standard:
 * - 10 labels per sheet (2 columns x 5 rows)
 * - Label dimensions: 4.0in wide x 2.0in high
 * - Top margin: 0.5in, Bottom margin: 0.5in
 * - Left margin: 0.156in (5/32 in), Right margin: 0.156in
 * - Column gap: 0.188in (3/16 in), Row gap: 0.0in
 */
export function generateBarcodeLabelsPDF(
  sheets: LabelSheetItem[][],
  labelFormat: LabelPaperFormat = 'avery_5163',
  showBorders: boolean = true
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: 'letter'
  });

  const isAvery5163 = labelFormat === 'avery_5163';
  // Both Avery 5163 and Generic 2x4 Grid are calibrated to 10 labels per sheet (2 cols x 5 rows of 2"x4" labels)
  const cols = 2;
  const rows = 5;
  const labelWidth = 4.0;
  const labelHeight = 2.0;
  const leftMargin = 0.15625; // 5/32 in (3.97mm)
  const topMargin = 0.5; // 1/2 in (12.7mm)
  const colGap = 0.1875; // 3/16 in (4.76mm)

  sheets.forEach((sheet, pageIdx) => {
    if (pageIdx > 0) {
      doc.addPage('letter', 'portrait');
    }

    sheet.forEach((item, slotIdx) => {
      const col = slotIdx % cols;
      const row = Math.floor(slotIdx / cols);

      if (row >= rows) return;

      const x = leftMargin + col * (labelWidth + colGap);
      const y = topMargin + row * labelHeight;

      const { tyre, slotIndex } = item;

      if (!tyre) {
        // Draw empty slot cut guide if requested
        if (showBorders) {
          doc.setDrawColor(220, 226, 235);
          doc.setLineWidth(0.008);
          doc.roundedRect(x, y, labelWidth, labelHeight, 0.04, 0.04, 'S');

          doc.setFontSize(7.5);
          doc.setTextColor(160, 174, 192);
          doc.text(`Slot #${slotIndex} (Blank / Used)`, x + labelWidth / 2, y + labelHeight / 2, {
            align: 'center'
          });
        }
        return;
      }

      // Draw Outer Label Boundary / Cut Guide
      if (showBorders) {
        doc.setDrawColor(180, 195, 215);
        doc.setLineWidth(0.008);
        doc.roundedRect(x, y, labelWidth, labelHeight, 0.04, 0.04, 'S');
      }

      // Padding offset inside label
      const padX = x + 0.14;
      const contentW = labelWidth - 0.28;

      // 1. Header Banner
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text('MAX EXECUTIVE TIRES', padX, y + 0.20);

      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(' • PICHELIN, DOMINICA', padX + 1.25, y + 0.20);

      // Condition Tag Pill (Top Right)
      const conditionText = tyre.condition === 'new' ? 'BRAND NEW' : 'INSPECTED USED';
      if (tyre.condition === 'new') {
        doc.setFillColor(238, 246, 255); // blue-50
        doc.setDrawColor(186, 220, 255);
      } else {
        doc.setFillColor(254, 243, 199); // amber-100
        doc.setDrawColor(245, 158, 11);
      }
      doc.roundedRect(x + labelWidth - 1.15, y + 0.09, 1.02, 0.15, 0.03, 0.03, 'FD');

      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      if (tyre.condition === 'new') {
        doc.setTextColor(30, 64, 175);
      } else {
        doc.setTextColor(146, 64, 14);
      }
      doc.text(conditionText, x + labelWidth - 0.64, y + 0.19, { align: 'center' });

      // Thin Top Divider Line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.006);
      doc.line(padX, y + 0.27, padX + contentW, y + 0.27);

      // 2. Tyre Size & Price Row
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('SIZE:', padX, y + 0.42);

      // Prominent Tyre Size
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(tyre.size, padX + 0.36, y + 0.44);

      // Tyre Brand & Model
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      const brandModelStr = `${tyre.brand.toUpperCase()} ${tyre.modelName}`.slice(0, 28);
      doc.text(brandModelStr, padX, y + 0.58);

      // Price Box on Right
      const rightX = padX + contentW;
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('RETAIL PRICE', rightX, y + 0.38, { align: 'right' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(4, 120, 87); // emerald-700
      doc.text(`EC$ ${tyre.priceXCD}`, rightX, y + 0.52, { align: 'right' });

      const priceUS = (tyre.priceXCD / 2.70).toFixed(0);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`≈ US$ ${priceUS}`, rightX, y + 0.62, { align: 'right' });

      // 3. Code 128 Barcode Generation & Vector Rendering
      const barcodeValue = getTyreBarcodeValue(tyre);
      const binaryBars = encodeToCode128(barcodeValue);

      if (binaryBars) {
        const barcodeY = y + 0.68;
        const barcodeH = 0.38;
        const totalBits = binaryBars.length;
        // Total barcode width centered on label
        const barAreaW = 3.3;
        const barUnitW = barAreaW / totalBits;
        const barStartX = x + (labelWidth - barAreaW) / 2;

        doc.setFillColor(0, 0, 0);

        let curRunLength = 0;
        let curRunStart = 0;

        for (let b = 0; b < totalBits; b++) {
          if (binaryBars[b] === '1') {
            if (curRunLength === 0) {
              curRunStart = b;
            }
            curRunLength++;
          } else {
            if (curRunLength > 0) {
              doc.rect(
                barStartX + curRunStart * barUnitW,
                barcodeY,
                curRunLength * barUnitW,
                barcodeH,
                'F'
              );
              curRunLength = 0;
            }
          }
        }
        if (curRunLength > 0) {
          doc.rect(
            barStartX + curRunStart * barUnitW,
            barcodeY,
            curRunLength * barUnitW,
            barcodeH,
            'F'
          );
        }

        // 4. Barcode Text & Stock Metadata Footer below bars
        const metaY = barcodeY + barcodeH + 0.12;
        doc.setFontSize(7);
        doc.setFont('courier', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(barcodeValue, padX, metaY);

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text(`Stock: ${tyre.stockCount} | Cat: ${tyre.category}`, rightX, metaY, { align: 'right' });
      }
    });
  });

  return doc;
}

/**
 * Generates a dummy 2" x 4" calibration test page on standard 8.5" x 11" US Letter paper.
 * Allows administrators to verify printer alignment, measure physical margins with a ruler,
 * and test overlay on Avery 5163 or Generic 2x4 labels.
 */
export function generateCalibrationLabelPDF(template: 'avery_5163' | 'grid_2x4' = 'avery_5163'): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: 'letter'
  });

  const labelWidth = 4.0;
  const labelHeight = 2.0;
  const leftMargin = 0.15625; // 5/32"
  const topMargin = 0.5; // 1/2"
  const colGap = 0.1875; // 3/16"

  // Page Header Banner (top margin area)
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('MAX EXECUTIVE TIRES — PRINTER & MARGIN CALIBRATION TARGET SHEET', 4.25, 0.28, { align: 'center' });

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Template: ${template === 'avery_5163' ? 'Avery 5163 / 5263 Standard' : 'Generic 2x4 Grid'} (10 Labels, 2×5) • Standard 8.5" × 11" Letter`,
    4.25,
    0.38,
    { align: 'center' }
  );

  // Draw outlines for all 10 slots
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 2; col++) {
      const x = leftMargin + col * (labelWidth + colGap);
      const y = topMargin + row * labelHeight;
      const slotNum = row * 2 + col + 1;

      if (slotNum === 1) {
        // SLOT 1: Primary Calibration Test Label
        // Solid outer border with 4.0" x 2.0" rounded box
        doc.setDrawColor(15, 23, 42);
        doc.setLineWidth(0.015);
        doc.roundedRect(x, y, labelWidth, labelHeight, 0.05, 0.05, 'S');

        // Center crosshairs
        const cx = x + labelWidth / 2;
        const cy = y + labelHeight / 2;
        doc.setDrawColor(220, 38, 38); // red crosshairs
        doc.setLineWidth(0.006);
        doc.line(cx - 0.25, cy, cx + 0.25, cy);
        doc.line(cx, cy - 0.25, cx, cy + 0.25);

        // Corner tick marks
        doc.setDrawColor(2, 132, 199);
        doc.setLineWidth(0.008);
        const tick = 0.12;
        // Top-left
        doc.line(x, y, x + tick, y);
        doc.line(x, y, x, y + tick);
        // Top-right
        doc.line(x + labelWidth, y, x + labelWidth - tick, y);
        doc.line(x + labelWidth, y, x + labelWidth, y + tick);
        // Bottom-left
        doc.line(x, y + labelHeight, x + tick, y + labelHeight);
        doc.line(x, y + labelHeight, x, y + labelHeight - tick);
        // Bottom-right
        doc.line(x + labelWidth, y + labelHeight, x + labelWidth - tick, y + labelHeight);
        doc.line(x + labelWidth, y + labelHeight, x + labelWidth, y + labelHeight - tick);

        // Label Header
        const padX = x + 0.14;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('MAX EXECUTIVE TIRES', padX, y + 0.20);

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(2, 132, 199);
        doc.text('CALIBRATION DUMMY', padX + 1.25, y + 0.20);

        // Badge
        doc.setFillColor(220, 252, 231);
        doc.setDrawColor(34, 197, 94);
        doc.roundedRect(x + labelWidth - 1.15, y + 0.09, 1.02, 0.15, 0.03, 0.03, 'FD');
        doc.setFontSize(6);
        doc.setTextColor(22, 101, 52);
        doc.text('TEST SAMPLE OK', x + labelWidth - 0.64, y + 0.19, { align: 'center' });

        // Divider
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.006);
        doc.line(padX, y + 0.27, padX + labelWidth - 0.28, y + 0.27);

        // Tyre Size & Price Row
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text('SIZE:', padX, y + 0.42);

        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('205/55 R16 91V', padX + 0.36, y + 0.44);

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(71, 85, 105);
        doc.text('MICHELIN PRIMACY 4 • CALIBRATION SPEC', padX, y + 0.58);

        // Price
        const rightX = padX + labelWidth - 0.28;
        doc.setFontSize(5.5);
        doc.setTextColor(100, 116, 139);
        doc.text('SAMPLE PRICE', rightX, y + 0.38, { align: 'right' });
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(4, 120, 87);
        doc.text('EC$ 245.00', rightX, y + 0.52, { align: 'right' });
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('≈ US$ 90.00', rightX, y + 0.61, { align: 'right' });

        // Dummy Code 128 Barcode
        const barcodeValue = 'MET-CALIB-2055516';
        const binaryBars = encodeToCode128(barcodeValue);
        if (binaryBars) {
          const barcodeY = y + 0.68;
          const barcodeH = 0.38;
          const totalBits = binaryBars.length;
          const barAreaW = 3.3;
          const barUnitW = barAreaW / totalBits;
          const barStartX = x + (labelWidth - barAreaW) / 2;

          doc.setFillColor(0, 0, 0);
          for (let b = 0; b < totalBits; b++) {
            if (binaryBars[b] === '1') {
              doc.rect(barStartX + b * barUnitW, barcodeY, barUnitW, barcodeH, 'F');
            }
          }

          const metaY = barcodeY + barcodeH + 0.12;
          doc.setFontSize(7);
          doc.setFont('courier', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text(barcodeValue, padX, metaY);

          doc.setFontSize(6);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(100, 116, 139);
          doc.text('W: 4.00" | H: 2.00" | Margins: 0.156" / 0.50"', rightX, metaY, { align: 'right' });
        }

        // Diagnostic annotation underneath barcode
        doc.setFontSize(5.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 38, 38);
        doc.text('VERIFICATION: Border must measure exactly 4.00" × 2.00". Print at 100% (disable "Fit to Page").', x + labelWidth / 2, y + 1.88, {
          align: 'center'
        });
      } else {
        // SLOTS 2 to 10: Alignment reference outlines
        doc.setDrawColor(203, 213, 225); // slate-300
        doc.setLineWidth(0.006);
        doc.setLineDashPattern([0.05, 0.05], 0);
        doc.roundedRect(x, y, labelWidth, labelHeight, 0.04, 0.04, 'S');
        doc.setLineDashPattern([], 0); // reset

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(148, 163, 184);
        doc.text(`Slot #${slotNum} (${col === 0 ? 'Col 1' : 'Col 2'}, Row ${row + 1})`, x + labelWidth / 2, y + labelHeight / 2 - 0.1, {
          align: 'center'
        });
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.text('2.00" × 4.00" Die-Cut Alignment Area', x + labelWidth / 2, y + labelHeight / 2 + 0.08, {
          align: 'center'
        });
      }
    }
  }

  // Footer instructions (bottom margin area)
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    'ALIGNMENT CHECK: Place this printed sheet over your Avery 5163 / Generic 2x4 label sheet against a light source. All 10 slots must align.',
    4.25,
    10.75,
    { align: 'center' }
  );

  return doc;
}
