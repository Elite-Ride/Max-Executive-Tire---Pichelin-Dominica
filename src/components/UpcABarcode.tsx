import React, { useMemo } from 'react';
import { generateTyreUpcA, encodeToUpcA, formatUpcA, UpcAModule } from '../utils/barcodeGenerator';
import { Tyre } from '../types';

interface UpcABarcodeProps {
  value?: string;
  tyre?: Tyre;
  width?: number; // total width in px
  height?: number; // bar height in px
  showText?: boolean;
  className?: string;
}

export const UpcABarcode: React.FC<UpcABarcodeProps> = ({
  value,
  tyre,
  width = 200,
  height = 56,
  showText = true,
  className = '',
}) => {
  const upcString = useMemo(() => {
    if (value && value.replace(/\D/g, '').length === 12) {
      return value.replace(/\D/g, '');
    }
    if (tyre) {
      return generateTyreUpcA(tyre);
    }
    return value ? value.replace(/\D/g, '').padStart(12, '0').slice(0, 12) : '084920205167';
  }, [value, tyre]);

  const { modules } = useMemo(() => encodeToUpcA(upcString), [upcString]);

  // Dimensions
  // 95 modules in barcode + side margins for the outer numbers
  const moduleCount = 95;
  const quietZoneModules = 9;
  const totalVirtualUnits = moduleCount + quietZoneModules * 2; // 113 units
  const unitWidth = width / totalVirtualUnits;
  const startX = quietZoneModules * unitWidth;

  const dataBarHeight = height;
  const guardBarHeight = height + 7; // Extended guard bars
  const totalSvgHeight = showText ? height + 24 : height;

  const formatted = formatUpcA(upcString);
  const parts = formatted.split(' '); // [numSystem, mfg, prod, check]

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        width={width}
        height={totalSvgHeight}
        viewBox={`0 0 ${width} ${totalSvgHeight}`}
        className="bg-white"
        style={{ shapeRendering: 'crispEdges' }}
      >
        <rect x="0" y="0" width={width} height={totalSvgHeight} fill="#ffffff" />

        {/* Render 95 modules */}
        {modules.map((m: UpcAModule, idx: number) => {
          if (!m.isBar) return null;
          const x = startX + idx * unitWidth;
          const barH = m.isGuard ? guardBarHeight : dataBarHeight;
          return (
            <rect
              key={idx}
              x={x}
              y={2}
              width={unitWidth + 0.15} // slight overlap to prevent antialiasing subpixel gaps
              height={barH}
              fill="#000000"
            />
          );
        })}

        {/* Human-Readable Text in Standard UPC-A Typography */}
        {showText && parts.length === 4 && (
          <g
            fill="#000000"
            fontFamily="monospace, 'Courier New', sans-serif"
            fontWeight="bold"
            fontSize={Math.max(10, Math.round(width * 0.055))}
          >
            {/* System Digit (Left outer) */}
            <text
              x={startX - unitWidth * 5}
              y={dataBarHeight + 9}
              textAnchor="middle"
            >
              {parts[0]}
            </text>

            {/* Manufacturer 5 Digits (Left center group) */}
            <text
              x={startX + 24 * unitWidth}
              y={dataBarHeight + 15}
              textAnchor="middle"
              letterSpacing="1px"
            >
              {parts[1]}
            </text>

            {/* Product 5 Digits (Right center group) */}
            <text
              x={startX + 71 * unitWidth}
              y={dataBarHeight + 15}
              textAnchor="middle"
              letterSpacing="1px"
            >
              {parts[2]}
            </text>

            {/* Check Digit (Right outer) */}
            <text
              x={startX + 95 * unitWidth + unitWidth * 5}
              y={dataBarHeight + 9}
              textAnchor="middle"
            >
              {parts[3]}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
