import React, { useState } from 'react';
import {
  Printer,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  X,
  FileCheck,
  Maximize2,
  ExternalLink
} from 'lucide-react';

interface PrinterGuideProps {
  isOpen?: boolean;
  onClose?: () => void;
  inline?: boolean;
  className?: string;
}

export const PrinterGuide: React.FC<PrinterGuideProps> = ({
  isOpen = true,
  onClose,
  inline = false,
  className = ''
}) => {
  const [selectedBrowser, setSelectedBrowser] = useState<'chrome' | 'safari' | 'edge'>('chrome');
  const [isExpanded, setIsExpanded] = useState<boolean>(!inline);

  if (!isOpen) return null;

  const content = (
    <div
      id="printer-alignment-guide"
      className={`bg-slate-900 text-white rounded-2xl border border-slate-700 shadow-xl overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-400 text-slate-950 rounded-xl shadow-xs">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-2">
              <span>Avery 5163 / 2&quot;×4&quot; Label Printer Alignment Guide</span>
              <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30 font-bold uppercase tracking-wider">
                Critical Setup
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Follow these two system print dialog settings to prevent vertical label drift.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {inline && (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title={isExpanded ? 'Collapse Guide' : 'Expand Guide'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Close Guide"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {(!inline || isExpanded) && (
        <div className="p-4 sm:p-6 space-y-5">
          {/* THE TWO GOLDEN MANDATORY RULES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Rule 1: Margin: None */}
            <div className="bg-slate-800/90 rounded-xl p-4 border-2 border-amber-400/70 shadow-sm relative overflow-hidden">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center shrink-0">
                  1
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm text-white">
                      Margins: Set to <span className="text-amber-300 underline font-mono font-black">&quot;None&quot;</span>
                    </h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Browsers add default 0.4&quot; - 0.5&quot; page margins by default. This causes subsequent label rows to drift downward and print across die-cut boundaries. Set <strong>Margins</strong> to <strong>&quot;None&quot;</strong> (or &quot;Custom: 0&quot;).
                  </p>
                  <div className="mt-2 text-[11px] font-mono bg-slate-950/80 text-amber-300 px-2.5 py-1 rounded-md border border-slate-700 flex items-center justify-between">
                    <span>Print Dialog &gt; Margins &gt; None</span>
                    <span className="text-emerald-400 font-bold">✓ Required</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rule 2: Scale: 100% */}
            <div className="bg-slate-800/90 rounded-xl p-4 border-2 border-emerald-400/70 shadow-sm relative overflow-hidden">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center shrink-0">
                  2
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm text-white">
                      Scale: Set to <span className="text-emerald-300 underline font-mono font-black">&quot;100%&quot;</span> (Actual Size)
                    </h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Never use <em>&quot;Fit to Printable Area&quot;</em> or <em>&quot;Shrink to Fit&quot;</em>! Avery sheets have pre-cut labels exactly 4.0&quot; × 2.0&quot;. Scaling shrinks the template to ~94%, misaligning all labels.
                  </p>
                  <div className="mt-2 text-[11px] font-mono bg-slate-950/80 text-emerald-300 px-2.5 py-1 rounded-md border border-slate-700 flex items-center justify-between">
                    <span>Print Dialog &gt; Scale &gt; 100% (Default)</span>
                    <span className="text-emerald-400 font-bold">✓ Required</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Checklist Grid */}
          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Full Print Calibration Checklist</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                <span className="font-bold text-white block mb-1">📄 Paper Size</span>
                <span>Select <strong>&quot;Letter&quot; (8.5&quot; × 11&quot;)</strong>. Do not use A4, as A4 is taller and narrower than US Letter.</span>
              </div>
              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                <span className="font-bold text-white block mb-1">🚫 Headers &amp; Footers</span>
                <span><strong>Uncheck</strong> &quot;Headers and Footers&quot; to prevent URLs and dates from printing over top/bottom labels.</span>
              </div>
              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                <span className="font-bold text-white block mb-1">💡 Pro-Tip: Plain Paper Test</span>
                <span>Print 1 test sheet on plain paper first. Hold it behind your Avery sheet up to light to confirm perfect die-cut alignment.</span>
              </div>
            </div>
          </div>

          {/* Browser Specific Navigation Tabs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Step-by-Step for Your Browser:
              </span>
              <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedBrowser('chrome')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                    selectedBrowser === 'chrome'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Google Chrome
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBrowser('safari')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                    selectedBrowser === 'safari'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Apple Safari / Mac
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBrowser('edge')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                    selectedBrowser === 'edge'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Microsoft Edge
                </button>
              </div>
            </div>

            <div className="bg-slate-800/70 p-3.5 rounded-xl border border-slate-700 text-xs text-slate-300">
              {selectedBrowser === 'chrome' && (
                <ol className="list-decimal list-inside space-y-1.5">
                  <li>In the Chrome Print Preview window, click <strong>&quot;More settings&quot;</strong> to expand advanced options.</li>
                  <li>Locate <strong>&quot;Margins&quot;</strong> dropdown and select <strong>&quot;None&quot;</strong>.</li>
                  <li>Locate <strong>&quot;Scale&quot;</strong> dropdown, select <strong>&quot;Custom&quot;</strong>, and set to exactly <strong>100%</strong>.</li>
                  <li>Under <strong>&quot;Options&quot;</strong>, ensure <strong>&quot;Headers and footers&quot;</strong> is <strong>unchecked</strong> and <strong>&quot;Background graphics&quot;</strong> is <strong>checked</strong>.</li>
                </ol>
              )}

              {selectedBrowser === 'safari' && (
                <ol className="list-decimal list-inside space-y-1.5">
                  <li>In the macOS Safari print dialog, click <strong>&quot;Show Details&quot;</strong> at the bottom left if collapsed.</li>
                  <li>Ensure Paper Size is set to <strong>&quot;US Letter&quot;</strong>.</li>
                  <li>Under Scale, enter <strong>100%</strong> (do not select &quot;Scale to fit paper&quot;).</li>
                  <li>Uncheck <strong>&quot;Print headers and footers&quot;</strong> and enable <strong>&quot;Print backgrounds&quot;</strong>.</li>
                </ol>
              )}

              {selectedBrowser === 'edge' && (
                <ol className="list-decimal list-inside space-y-1.5">
                  <li>Click <strong>&quot;More settings&quot;</strong> in Edge&apos;s left-hand print pane.</li>
                  <li>Change <strong>Margins</strong> from &quot;Default&quot; to <strong>&quot;None&quot;</strong>.</li>
                  <li>Set <strong>Scale (%)</strong> to exactly <strong>100</strong>.</li>
                  <li>Uncheck <strong>&quot;Headers and footers&quot;</strong>.</li>
                </ol>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (inline) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {content}
      </div>
    </div>
  );
};
