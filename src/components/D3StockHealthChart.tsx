import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Tyre } from '../types';
import { AlertTriangle, CheckCircle2, TrendingDown, RefreshCw, BarChart2, ShieldAlert } from 'lucide-react';

interface D3StockHealthChartProps {
  tyres: Tyre[];
  onSelectTyre?: (tyre: Tyre) => void;
  onQuickAdjust?: (tyre: Tyre, delta: number) => void;
}

export const D3StockHealthChart: React.FC<D3StockHealthChartProps> = ({
  tyres,
  onSelectTyre,
  onQuickAdjust,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedBarTyre, setSelectedBarTyre] = useState<Tyre | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'critical' | 'low' | 'healthy'>('all');

  const processedData = React.useMemo(() => {
    return tyres
      .map((t) => {
        let status: 'out' | 'critical' | 'low' | 'healthy' = 'healthy';
        if (t.stockCount === 0) status = 'out';
        else if (t.stockCount <= 3) status = 'critical';
        else if (t.stockCount <= 6) status = 'low';

        return {
          id: t.id,
          tyre: t,
          label: `${t.brand} ${t.size}`,
          shortLabel: `${t.brand.slice(0, 4)} ${t.size.split(' ')[0]}`,
          stock: t.stockCount,
          status,
          price: t.priceXCD,
        };
      })
      .filter((d) => {
        if (filterMode === 'critical') return d.status === 'out' || d.status === 'critical';
        if (filterMode === 'low') return d.status === 'low';
        if (filterMode === 'healthy') return d.status === 'healthy';
        return true;
      })
      .sort((a, b) => a.stock - b.stock);
  }, [tyres, filterMode]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = Math.max(600, container.clientWidth);
    const height = 320;
    const margin = { top: 25, right: 30, bottom: 85, left: 55 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Clear previous elements
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('style', 'max-width: 100%; height: auto;');

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale
    const x = d3
      .scaleBand()
      .domain(processedData.map((d) => d.id))
      .range([0, innerWidth])
      .padding(0.28);

    // Y Scale (minimum max of 12 for headroom)
    const maxStock = Math.max(12, d3.max(processedData, (d) => d.stock) || 12);
    const y = d3.scaleLinear().domain([0, maxStock]).nice().range([innerHeight, 0]);

    // Grid lines (horizontal)
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(y)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      )
      .call((g) => g.select('.domain').remove())
      .call((g) =>
        g
          .selectAll('.tick line')
          .attr('stroke', '#334155')
          .attr('stroke-dasharray', '2,2')
          .attr('opacity', 0.5)
      );

    // Color gradient definitions
    const defs = svg.append('defs');

    // Threshold lines
    // Critical threshold line (stock = 3)
    const yCrit = y(3);
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', yCrit)
      .attr('y2', yCrit)
      .attr('stroke', '#ef4444')
      .attr('stroke-dasharray', '4,3')
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.8);

    g.append('text')
      .attr('x', innerWidth - 5)
      .attr('y', yCrit - 5)
      .attr('text-anchor', 'end')
      .attr('fill', '#ef4444')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .text('Critical Reorder Threshold (≤3)');

    // Tooltip
    const tooltip = d3
      .select(container)
      .selectAll('.d3-stock-tooltip')
      .data([0])
      .join('div')
      .attr('class', 'd3-stock-tooltip')
      .style('position', 'absolute')
      .style('display', 'none')
      .style('background', '#0f172a')
      .style('color', '#f8fafc')
      .style('padding', '8px 12px')
      .style('border-radius', '8px')
      .style('border', '1px solid #334155')
      .style('font-size', '11px')
      .style('pointer-events', 'none')
      .style('box-shadow', '0 10px 25px -5px rgba(0, 0, 0, 0.5)')
      .style('z-index', '50');

    // Bars
    g.selectAll('.bar')
      .data(processedData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => x(d.id) || 0)
      .attr('y', innerHeight)
      .attr('width', x.bandwidth())
      .attr('height', 0)
      .attr('rx', 4)
      .attr('fill', (d) => {
        if (d.status === 'out') return '#dc2626'; // Deep red
        if (d.status === 'critical') return '#f97316'; // Vivid orange
        if (d.status === 'low') return '#eab308'; // Amber yellow
        return '#0284c7'; // Sky / blue
      })
      .attr('stroke', (d) => (d.status === 'out' || d.status === 'critical' ? '#ef4444' : 'none'))
      .attr('stroke-width', (d) => (d.status === 'out' ? 2 : 0))
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('opacity', 0.8)
          .attr('stroke', '#38bdf8')
          .attr('stroke-width', 2);

        const [mx, my] = d3.pointer(event, container);
        tooltip
          .style('display', 'block')
          .style('left', `${mx + 15}px`)
          .style('top', `${Math.max(10, my - 60)}px`)
          .html(`
            <div class="font-black text-slate-100">${d.tyre.brand} ${d.tyre.modelName}</div>
            <div class="text-sky-300 font-mono text-[10px]">${d.tyre.size} (${d.tyre.condition.toUpperCase()})</div>
            <div class="mt-1 flex items-center justify-between gap-3 pt-1 border-t border-slate-700">
              <span class="text-slate-400">Stock Count:</span>
              <strong class="${d.stock <= 3 ? 'text-red-400 font-black' : 'text-emerald-400'}">${d.stock} units</strong>
            </div>
            <div class="flex items-center justify-between gap-3 text-slate-400">
              <span>Price:</span>
              <strong class="text-white font-mono">EC$ ${d.price}</strong>
            </div>
          `);
      })
      .on('mouseleave', function () {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('opacity', 1)
          .attr('stroke', (d: any) => (d.status === 'out' ? '#ef4444' : 'none'))
          .attr('stroke-width', (d: any) => (d.status === 'out' ? 2 : 0));

        tooltip.style('display', 'none');
      })
      .on('click', (_, d) => {
        setSelectedBarTyre(d.tyre);
        if (onSelectTyre) onSelectTyre(d.tyre);
      })
      .transition()
      .duration(700)
      .delay((_, i) => i * 25)
      .attr('y', (d) => y(d.stock))
      .attr('height', (d) => innerHeight - y(d.stock));

    // Value Labels on top of bars
    g.selectAll('.bar-label')
      .data(processedData)
      .enter()
      .append('text')
      .attr('class', 'bar-label')
      .attr('x', (d) => (x(d.id) || 0) + x.bandwidth() / 2)
      .attr('y', (d) => y(d.stock) - 6)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', '900')
      .attr('fill', (d) => (d.stock <= 3 ? '#ef4444' : '#94a3b8'))
      .text((d) => d.stock)
      .style('opacity', 0)
      .transition()
      .duration(800)
      .delay((_, i) => i * 25 + 200)
      .style('opacity', 1);

    // X Axis
    const xAxis = d3
      .axisBottom(x)
      .tickFormat((id) => {
        const item = processedData.find((d) => d.id === id);
        return item ? item.shortLabel : id;
      });

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .call((g) => g.select('.domain').attr('stroke', '#475569'))
      .selectAll('text')
      .attr('transform', 'rotate(-38)')
      .attr('text-anchor', 'end')
      .attr('dx', '-6px')
      .attr('dy', '8px')
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .attr('fill', (id) => {
        const item = processedData.find((d) => d.id === id);
        return item && item.stock <= 3 ? '#f87171' : '#cbd5e1';
      });

    // Y Axis
    const yAxis = d3.axisLeft(y).ticks(5).tickFormat(d3.format('d'));

    g.append('g')
      .call(yAxis)
      .call((g) => g.select('.domain').attr('stroke', '#475569'))
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px');

    // Y Axis Label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text('Units in Stock');
  }, [processedData]);

  const criticalCount = tyres.filter((t) => t.stockCount <= 3).length;
  const lowCount = tyres.filter((t) => t.stockCount > 3 && t.stockCount <= 6).length;
  const healthyCount = tyres.filter((t) => t.stockCount > 6).length;

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Stock Health & Inventory Replenishment (D3.js)</span>
              {criticalCount > 0 && (
                <span className="inline-flex items-center gap-1 bg-red-950/80 text-red-300 border border-red-700/80 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                  <AlertTriangle className="w-3 h-3 text-red-400" />
                  {criticalCount} Critical Models
                </span>
              )}
            </h4>
            <p className="text-xs text-slate-400">
              Interactive D3 bar chart mapping current stock distribution across tyre models with reorder warnings.
            </p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded-lg font-bold transition ${
              filterMode === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Models ({tyres.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('critical')}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
              filterMode === 'critical'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-red-400 hover:text-red-300'
            }`}
          >
            Critical (≤3)
            <span className="text-[10px] bg-red-900/60 px-1.5 py-0.2 rounded-full">{criticalCount}</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('low')}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
              filterMode === 'low'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            Low (4-6)
            <span className="text-[10px] bg-amber-900/60 px-1.5 py-0.2 rounded-full">{lowCount}</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('healthy')}
            className={`px-2.5 py-1 rounded-lg font-bold transition ${
              filterMode === 'healthy'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            Healthy (&gt;6)
          </button>
        </div>
      </div>

      {/* D3 SVG Container */}
      <div ref={containerRef} className="relative overflow-x-auto w-full">
        <svg ref={svgRef} className="w-full"></svg>
      </div>

      {/* Bottom selected tyre drawer or quick action */}
      {selectedBarTyre && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 animate-fade-in text-xs">
          <div className="flex items-center gap-3">
            <img
              src={selectedBarTyre.image}
              alt={selectedBarTyre.modelName}
              className="w-10 h-10 object-cover rounded-lg border border-slate-700"
            />
            <div>
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                {selectedBarTyre.brand}
              </span>
              <strong className="text-white text-sm block">
                {selectedBarTyre.modelName} ({selectedBarTyre.size})
              </strong>
              <span className="text-slate-400 text-[11px]">
                Current Stock: <strong className={selectedBarTyre.stockCount <= 3 ? 'text-red-400' : 'text-emerald-400'}>{selectedBarTyre.stockCount}</strong> units • Price: EC$ {selectedBarTyre.priceXCD}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onQuickAdjust && (
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 px-1 font-bold">Quick Stock Adjust:</span>
                <button
                  type="button"
                  onClick={() => onQuickAdjust(selectedBarTyre, -1)}
                  disabled={selectedBarTyre.stockCount <= 0}
                  className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 flex items-center justify-center font-bold"
                  title="Decrease stock by 1"
                >
                  -
                </button>
                <span className="px-2 font-mono font-bold text-white">{selectedBarTyre.stockCount}</span>
                <button
                  type="button"
                  onClick={() => onQuickAdjust(selectedBarTyre, 1)}
                  className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold"
                  title="Increase stock by 1"
                >
                  +
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => setSelectedBarTyre(null)}
              className="text-slate-400 hover:text-slate-200 px-2 py-1"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
