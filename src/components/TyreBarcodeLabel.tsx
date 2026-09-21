import React, { useMemo, useState, useEffect } from 'react';
import { Tyre } from '../types';
import { encodeToCode128, getTyreBarcodeValue } from '../utils/barcodeGenerator';
import { generateTyreQrDataUrl } from '../utils/qrGenerator';

export interface LabelFieldConfig {
  showBrand: boolean;
  showModel: boolean;
  showSize: boolean;
  showPrice: boolean;
}

export const DEFAULT_LABEL_FIELDS: LabelFieldConfig = {
  showBrand: true,
  showModel: true,
  showSize: true,
  showPrice: true,
};

interface TyreBarcodeLabelProps {
  tyre: Tyre;
  variant?: 'shelf_tag' | 'compact_sticker' | 'avery_2x4' | 'large_2x4' | 'full_card' | 'thermal_receipt';
  showQr?: boolean;
  showBorder?: boolean;
  className?: string;
  fieldConfig?: LabelFieldConfig;
  onPrintSingle?: () => void;
}

export const TyreBarcodeLabel: React.FC<TyreBarcodeLabelProps> = ({
  tyre,
  variant = 'avery_2x4',
  showQr = true,
  showBorder = true,
  className = '',
  fieldConfig = DEFAULT_LABEL_FIELDS,
  onPrintSingle,
}) => {
  const barcodeValue = useMemo(() => getTyreBarcodeValue(tyre), [tyre]);
  const binaryBars = useMemo(() => encodeToCode128(barcodeValue), [barcodeValue]);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    if (showQr) {
      generateTyreQrDataUrl(tyre.id).then((url) => {
        if (isMounted) setQrCodeUrl(url);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [tyre.id, showQr]);

  // SVG Barcode Width & Height calculations
  const barWidth = 1.75;
  const barHeight =
    variant === 'compact_sticker'
      ? 28
      : variant === 'thermal_receipt'
      ? 36
      : variant === 'full_card'
      ? 44
      : 32;
  const totalSvgWidth = binaryBars.length * barWidth;

  const priceUS = (tyre.priceXCD / 2.7).toFixed(0);

  // Thermal Receipt Style (2.25in x 3.5in / 58mm roll standard)
  if (variant === 'thermal_receipt') {
    return (
      <div
        className={`tyre-barcode-label thermal-receipt-label bg-white text-slate-900 flex flex-col justify-between select-none box-border ${
          showBorder ? 'border-2 border-dashed border-slate-400' : 'border-0'
        } ${className}`}
        style={{
          pageBreakInside: 'avoid',
          breakInside: 'avoid',
          width: '2.25in',
          minHeight: '3.25in',
          padding: '0.12in',
          fontFamily: 'monospace',
          backgroundColor: '#ffffff',
        }}
      >
        {/* Header */}
        <div className="text-center border-b border-black pb-1 mb-1">
          <div className="font-black text-[11px] uppercase tracking-wider text-black">
            MAX EXECUTIVE TIRES
          </div>
          <div className="text-[8px] text-slate-700">PICHELIN, DOMINICA</div>
          <div className="text-[7.5px] text-slate-600 mt-0.5">*** INVENTORY TAG ***</div>
        </div>

        {/* Condition tag */}
        <div className="text-center my-0.5">
          <span className="text-[9px] font-black uppercase px-2 py-0.5 border border-black rounded inline-block">
            {tyre.condition === 'new' ? 'BRAND NEW TYRE' : 'INSPECTED USED'}
          </span>
        </div>

        {/* Size */}
        {fieldConfig.showSize && (
          <div className="text-center my-1">
            <span className="text-[8px] uppercase tracking-wider block font-bold">TYRE SIZE</span>
            <span className="text-lg font-black tracking-tight text-black block leading-none">
              {tyre.size}
            </span>
          </div>
        )}

        {/* Brand & Model */}
        {(fieldConfig.showBrand || fieldConfig.showModel) && (
          <div className="text-center border-t border-dotted border-slate-400 pt-1 my-0.5">
            {fieldConfig.showBrand && (
              <span className="text-[10px] font-black uppercase text-black block">
                {tyre.brand}
              </span>
            )}
            {fieldConfig.showModel && (
              <span className="text-[9px] font-bold text-slate-700 block truncate">
                {tyre.modelName}
              </span>
            )}
          </div>
        )}

        {/* Price */}
        {fieldConfig.showPrice && (
          <div className="text-center bg-slate-100 border border-slate-300 py-1 my-1 rounded">
            <span className="text-[7.5px] uppercase font-bold text-slate-500 block">PRICE</span>
            <div className="text-base font-black text-black leading-none">
              EC$ {tyre.priceXCD}
            </div>
            <span className="text-[8px] text-slate-600">≈ US$ {priceUS}</span>
          </div>
        )}

        {/* Barcode & QR */}
        <div className="flex flex-col items-center justify-center pt-1 border-t border-black">
          <svg
            className="w-full max-w-[180px]"
            height={barHeight}
            viewBox={`0 0 ${totalSvgWidth} ${barHeight}`}
            preserveAspectRatio="none"
            aria-label={`Barcode for ${tyre.size}`}
          >
            {binaryBars.split('').map((bit, idx) => {
              if (bit === '1') {
                return (
                  <rect
                    key={idx}
                    x={idx * barWidth}
                    y={0}
                    width={barWidth}
                    height={barHeight}
                    fill="#000000"
                  />
                );
              }
              return null;
            })}
          </svg>
          <span className="text-[8px] font-mono font-bold tracking-widest text-black mt-0.5">
            {barcodeValue}
          </span>
          <div className="flex items-center justify-between w-full text-[7.5px] text-slate-600 mt-0.5 px-1">
            <span>Stock: {tyre.stockCount}</span>
            <span>SKU: {tyre.id}</span>
          </div>
        </div>
      </div>
    );
  }

  // Avery 5163 Standard (4.0in x 2.0in)
  if (variant === 'avery_2x4') {
    return (
      <div
        className={`tyre-barcode-label avery-2x4-label bg-white text-slate-900 flex flex-col justify-between select-none box-border ${
          showBorder ? 'border border-slate-300 print:border-slate-400' : 'border-0'
        } ${className}`}
        style={{
          pageBreakInside: 'avoid',
          breakInside: 'avoid',
          width: '4.0in',
          height: '2.0in',
          maxWidth: '4.0in',
          maxHeight: '2.0in',
          padding: '0.12in 0.16in 0.1in 0.16in',
          borderRadius: '4px',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
        }}
      >
        {/* Top Header Row */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-0.5 leading-none">
          <div className="flex items-center gap-1">
            <span className="font-black text-[9px] uppercase tracking-wider text-slate-950">
              MAX EXECUTIVE TIRES
            </span>
            <span className="text-[7.5px] text-slate-600 font-bold">• PICHELIN, DOMINICA</span>
          </div>
          <span
            className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded leading-none ${
              tyre.condition === 'new'
                ? 'bg-blue-100 text-blue-900 border border-blue-300'
                : 'bg-amber-100 text-amber-900 border border-amber-300'
            }`}
          >
            {tyre.condition === 'new' ? 'BRAND NEW' : 'INSPECTED USED'}
          </span>
        </div>

        {/* Middle Details: Size & Price Row */}
        <div className="flex items-center justify-between py-0.5">
          <div className="flex-1 pr-2">
            {fieldConfig.showSize && (
              <div className="flex items-baseline gap-1.5">
                <span className="text-[7.5px] font-bold text-slate-500 uppercase tracking-wider">
                  SIZE:
                </span>
                <span className="text-[17px] font-black tracking-tight text-slate-950 font-mono leading-none">
                  {tyre.size}
                </span>
              </div>
            )}
            {(fieldConfig.showBrand || fieldConfig.showModel) && (
              <div className="text-[10px] font-extrabold uppercase text-slate-800 truncate mt-0.5 leading-tight">
                {fieldConfig.showBrand && <span>{tyre.brand} </span>}
                {fieldConfig.showModel && (
                  <span className="font-semibold text-slate-600">{tyre.modelName}</span>
                )}
              </div>
            )}
          </div>

          {fieldConfig.showPrice && (
            <div className="text-right pl-2 border-l border-slate-200">
              <span className="text-[7px] font-bold text-slate-500 uppercase tracking-wider block">
                RETAIL PRICE
              </span>
              <div className="text-[15px] font-black text-emerald-800 leading-none">
                EC$ {tyre.priceXCD}
              </div>
              <span className="text-[7.5px] text-slate-500 font-semibold leading-none">
                ≈ US$ {priceUS}
              </span>
            </div>
          )}
        </div>

        {/* Bottom Barcode Section & QR Code */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
            <div className="w-full flex justify-center overflow-hidden">
              <svg
                className="w-full max-w-[210px]"
                height={barHeight}
                viewBox={`0 0 ${totalSvgWidth} ${barHeight}`}
                preserveAspectRatio="none"
                aria-label={`Barcode for ${tyre.size}`}
              >
                {binaryBars.split('').map((bit, idx) => {
                  if (bit === '1') {
                    return (
                      <rect
                        key={idx}
                        x={idx * barWidth}
                        y={0}
                        width={barWidth}
                        height={barHeight}
                        fill="#000000"
                      />
                    );
                  }
                  return null;
                })}
              </svg>
            </div>

            <div className="w-full flex items-center justify-between text-[8px] font-mono font-bold text-slate-700 tracking-wider mt-0.5 px-0.5 leading-none">
              <span>{barcodeValue}</span>
              <span className="text-[7.5px] text-slate-500 font-sans font-semibold">
                Stock: {tyre.stockCount} | {tyre.category}
              </span>
            </div>
          </div>

          {showQr && qrCodeUrl && (
            <div className="flex flex-col items-center justify-center shrink-0 border-l border-slate-200 pl-1.5 py-0.5">
              <img
                src={qrCodeUrl}
                alt={`QR code for ${tyre.size}`}
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain block"
                referrerPolicy="no-referrer"
              />
              <span className="text-[6px] font-black uppercase text-slate-500 tracking-tight leading-none mt-0.5 text-center">
                Scan Details
              </span>
            </div>
          )}
        </div>

        {onPrintSingle && (
          <div className="no-print pt-0.5 flex justify-end">
            <button
              type="button"
              onClick={onPrintSingle}
              className="text-[8px] font-bold text-blue-600 hover:text-blue-800 transition cursor-pointer"
            >
              Print Single
            </button>
          </div>
        )}
      </div>
    );
  }

  // Large 2x4 Generic Grid (4.0in x 2.0in)
  if (variant === 'large_2x4') {
    return (
      <div
        className={`tyre-barcode-label large-2x4-label bg-white text-slate-900 flex flex-col justify-between select-none box-border ${
          showBorder ? 'border border-slate-300 print:border-slate-400' : 'border-0'
        } ${className}`}
        style={{
          pageBreakInside: 'avoid',
          breakInside: 'avoid',
          width: '4.0in',
          height: '2.0in',
          maxWidth: '4.0in',
          maxHeight: '2.0in',
          padding: '0.12in 0.16in 0.1in 0.16in',
          borderRadius: '4px',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
        }}
      >
        <div className="flex items-center justify-between border-b border-slate-200 pb-1">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-[10px] uppercase tracking-wider text-slate-950">
              MAX EXECUTIVE TIRES
            </span>
            <span className="text-[8px] text-slate-600 font-bold">• PICHELIN, DOMINICA</span>
          </div>
          <span
            className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded ${
              tyre.condition === 'new'
                ? 'bg-blue-100 text-blue-900 border border-blue-300'
                : 'bg-amber-100 text-amber-900 border border-amber-300'
            }`}
          >
            {tyre.condition === 'new' ? 'BRAND NEW' : 'INSPECTED USED'}
          </span>
        </div>

        <div className="flex items-center justify-between py-1 bg-slate-50 px-2 rounded-lg border border-slate-200 my-0.5">
          <div>
            {fieldConfig.showSize && (
              <>
                <span className="text-[7.5px] font-bold text-slate-500 uppercase tracking-wider block">
                  TYRE SIZE
                </span>
                <span className="text-[19px] font-black tracking-tight text-slate-950 font-mono leading-none">
                  {tyre.size}
                </span>
              </>
            )}
            {(fieldConfig.showBrand || fieldConfig.showModel) && (
              <div className="text-[10.5px] font-extrabold uppercase text-slate-800 truncate mt-0.5">
                {fieldConfig.showBrand && <span>{tyre.brand} </span>}
                {fieldConfig.showModel && (
                  <span className="font-semibold text-slate-600">{tyre.modelName}</span>
                )}
              </div>
            )}
          </div>

          {fieldConfig.showPrice && (
            <div className="text-right">
              <span className="text-[7.5px] font-bold text-slate-500 uppercase tracking-wider block">
                RETAIL PRICE
              </span>
              <div className="text-[17px] font-black text-emerald-800 leading-none">
                EC$ {tyre.priceXCD}
              </div>
              <span className="text-[8.5px] text-slate-500 font-semibold">
                ≈ US$ {priceUS}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
            <div className="w-full flex justify-center overflow-hidden">
              <svg
                className="w-full max-w-[220px]"
                height={barHeight}
                viewBox={`0 0 ${totalSvgWidth} ${barHeight}`}
                preserveAspectRatio="none"
                aria-label={`Barcode for ${tyre.size}`}
              >
                {binaryBars.split('').map((bit, idx) => {
                  if (bit === '1') {
                    return (
                      <rect
                        key={idx}
                        x={idx * barWidth}
                        y={0}
                        width={barWidth}
                        height={barHeight}
                        fill="#000000"
                      />
                    );
                  }
                  return null;
                })}
              </svg>
            </div>

            <div className="w-full flex items-center justify-between text-[9px] font-mono font-bold text-slate-700 tracking-wider mt-0.5 px-1">
              <span>{barcodeValue}</span>
              <span className="text-[8px] text-slate-500 font-sans font-semibold">
                Stock: {tyre.stockCount} | {tyre.category}
              </span>
            </div>
          </div>

          {showQr && qrCodeUrl && (
            <div className="flex flex-col items-center justify-center shrink-0 border-l border-slate-200 pl-2 py-0.5">
              <img
                src={qrCodeUrl}
                alt={`QR code for ${tyre.size}`}
                className="w-9 h-9 object-contain block"
                referrerPolicy="no-referrer"
              />
              <span className="text-[6.5px] font-black uppercase text-slate-500 tracking-tight leading-none mt-0.5 text-center">
                Scan Details
              </span>
            </div>
          )}
        </div>

        {onPrintSingle && (
          <div className="no-print pt-1 flex justify-end">
            <button
              type="button"
              onClick={onPrintSingle}
              className="text-[9px] font-bold text-blue-600 hover:text-blue-800 transition cursor-pointer"
            >
              Print Single
            </button>
          </div>
        )}
      </div>
    );
  }

  // Shelf Tag and Compact Sticker fallbacks
  return (
    <div
      className={`tyre-barcode-label bg-white text-slate-900 border-2 border-slate-900 rounded-xl p-3 flex flex-col justify-between select-none shadow-xs print:shadow-none print:border-black print:m-0 print:p-2.5 ${className}`}
      style={{
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
        width: variant === 'compact_sticker' ? '68mm' : '85mm',
        minHeight: variant === 'compact_sticker' ? '42mm' : '52mm',
        boxSizing: 'border-box',
      }}
    >
      <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="font-black text-[9px] uppercase tracking-wider text-slate-900">
            MAX EXECUTIVE TIRES
          </span>
          <span className="text-[7.5px] text-slate-500 font-bold">• PICHELIN</span>
        </div>
        <span
          className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded ${
            tyre.condition === 'new'
              ? 'bg-blue-100 text-blue-900 border border-blue-300'
              : 'bg-amber-100 text-amber-900 border border-amber-300'
          }`}
        >
          {tyre.condition === 'new' ? 'BRAND NEW' : 'INSPECTED USED'}
        </span>
      </div>

      {(fieldConfig.showBrand || fieldConfig.showModel) && (
        <div className="leading-tight mb-1">
          <div className="text-[11px] font-extrabold uppercase text-slate-900 truncate">
            {fieldConfig.showBrand && <span>{tyre.brand} </span>}
            {fieldConfig.showModel && (
              <span className="font-medium text-slate-700">{tyre.modelName}</span>
            )}
          </div>
        </div>
      )}

      {(fieldConfig.showSize || fieldConfig.showPrice) && (
        <div className="my-0.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 flex items-center justify-between">
          {fieldConfig.showSize && (
            <div>
              <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest block">
                TYRE SIZE
              </span>
              <span className="text-base sm:text-lg font-black tracking-tight text-slate-950 font-mono">
                {tyre.size}
              </span>
            </div>
          )}

          {fieldConfig.showPrice && (
            <div className="text-right">
              <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest block">
                RETAIL PRICE
              </span>
              <div className="text-sm sm:text-base font-black text-emerald-800 leading-none">
                EC$ {tyre.priceXCD}
              </div>
              <span className="text-[8px] text-slate-500 font-semibold">
                ≈ US$ {priceUS}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="mt-1 flex items-center justify-between gap-2 bg-white pt-1">
        <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
          <div className="w-full flex justify-center overflow-hidden">
            <svg
              className="w-full max-w-[200px]"
              height={barHeight}
              viewBox={`0 0 ${totalSvgWidth} ${barHeight}`}
              preserveAspectRatio="none"
              aria-label={`Barcode for ${tyre.size}`}
            >
              {binaryBars.split('').map((bit, idx) => {
                if (bit === '1') {
                  return (
                    <rect
                      key={idx}
                      x={idx * barWidth}
                      y={0}
                      width={barWidth}
                      height={barHeight}
                      fill="#000000"
                    />
                  );
                }
                return null;
              })}
            </svg>
          </div>

          <div className="w-full flex items-center justify-between text-[8px] font-mono font-bold text-slate-700 tracking-wider mt-0.5 px-1">
            <span>{barcodeValue}</span>
            <span className="text-[7px] text-slate-400 uppercase">Stock: {tyre.stockCount}</span>
          </div>
        </div>

        {showQr && qrCodeUrl && (
          <div className="flex flex-col items-center justify-center shrink-0 border-l border-slate-200 pl-1.5">
            <img
              src={qrCodeUrl}
              alt={`QR code for ${tyre.size}`}
              className="w-8 h-8 object-contain block"
              referrerPolicy="no-referrer"
            />
            <span className="text-[6px] font-black uppercase text-slate-500 tracking-tight leading-none mt-0.5 text-center">
              Scan
            </span>
          </div>
        )}
      </div>

      {onPrintSingle && (
        <div className="no-print mt-2 pt-1 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onPrintSingle}
            className="text-[9px] font-bold text-blue-600 hover:text-blue-800 transition cursor-pointer"
          >
            Print This Tag
          </button>
        </div>
      )}
    </div>
  );
};
