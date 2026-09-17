import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Wrench, 
  Search, 
  Eye, 
  Layers, 
  ShieldAlert, 
  Truck, 
  Phone,
  Flame,
  ArrowRight,
  Info
} from 'lucide-react';
import { SHOP_LOCATION_INFO } from '../data/servicesData';

export const PunctureRepairGuide: React.FC<{ onOpenSOS?: () => void }> = ({ onOpenSOS }) => {
  const [selectedZone, setSelectedZone] = useState<'crown' | 'shoulder' | 'sidewall'>('crown');
  const [activeStep, setActiveStep] = useState<number>(1);

  const zones = {
    crown: {
      title: 'Zone A: The Crown (Center 70% of Tread)',
      status: 'REPAIRABLE',
      statusColor: 'bg-emerald-500 text-white',
      borderColor: 'border-emerald-500',
      description: 'The reinforced center area between the primary outer tread grooves. Punctures caused by nails, screws, or small metal debris up to 6mm (1/4") are safely repairable when internal casing integrity is intact.',
      requirements: [
        'Puncture diameter strictly ≤ 6mm (0.24 inches)',
        'Injury angle ≤ 25° from perpendicular surface',
        'Must use a 2-piece or combi mushroom vulcanizing plug-patch',
        'Tyre must be demounted for full internal casing inspection'
      ],
      verdict: 'Approved for permanent vulcanized repair to international BSAU159 safety standards.'
    },
    shoulder: {
      title: 'Zone B: The Shoulder (Outer 15% Shoulders)',
      status: 'NON-REPAIRABLE',
      statusColor: 'bg-amber-600 text-white',
      borderColor: 'border-amber-500',
      description: 'The high-flex transition area between the tread face and sidewall. This zone experiences maximum centrifugal shear stress and heat generation when negotiating Dominica’s steep downhill mountain curves.',
      requirements: [
        'Subject to heavy deflection during cornering and braking',
        'Patches applied here peel and detach due to continual carcass flex',
        'High probability of sudden catastrophic pressure loss on mountain switchbacks'
      ],
      verdict: 'STRICT SAFETY RED-FLAG: Tyre replacement required. Never compromise on shoulder injuries.'
    },
    sidewall: {
      title: 'Zone C: The Sidewall & Bead Casing',
      status: 'STRICTLY FORBIDDEN',
      statusColor: 'bg-red-600 text-white',
      borderColor: 'border-red-600',
      description: 'The thin vertical flex zone that supports the vehicle load. The sidewall contains delicate radial body ply cords with zero steel belts. Any puncture, tear, curb gouge, or impact bulge permanently compromises the tyre’s structural integrity.',
      requirements: [
        'Zero steel belts to retain a plug or vulcanized patch stem',
        'Sidewall flexes millions of times, causing immediate plug ejection',
        'Extreme blowout hazard at highway or hill descent speeds'
      ],
      verdict: 'IMMEDIATE SCRAP / REPLACEMENT: Never allow any shop or roadside technician to plug a sidewall.'
    }
  };

  const steps = [
    {
      step: 1,
      title: 'Complete Wheel Demount & 360° Internal Casing Audit',
      badge: 'Mandatory Inspection',
      icon: Eye,
      summary: 'Never rely on external "string plug" repairs done while the tyre remains mounted on the car. Removing the tyre is the only way to detect internal casing failure.',
      details: [
        'Inspect the airtight inner butyl liner for run-flat heat scorch marks (wrinkled or melted rubber rings).',
        'Check for "black rubber powder / crumb" inside the casing—a telltale sign that the driver drove on low pressure, grinding internal cords into dust.',
        'Inspect bead wire rings for tears, kinks, or rim-chafing that prevent an airtight seal.'
      ],
      dangerNote: 'Danger: An external string plug hides internal cord delamination, which can cause sudden mountain blowouts.'
    },
    {
      step: 2,
      title: 'Injury Channel Probing & Precision Angle Verification',
      badge: 'Geometric Audit',
      icon: Search,
      summary: 'Before reaming, the technician uses a blunt metal probe to follow the exact trajectory of the puncturing object.',
      details: [
        'Determine if the injury enters straight or at an angle: punctures exceeding 25° require specialized two-piece stem-and-patch systems rather than single combi units.',
        'Measure puncture channel width: maximum permissible hole diameter is 6mm (1/4 inch). Slits, cuts, and irregular tears are non-repairable.',
        'Ensure the injury is located strictly within the repairable Crown zone (middle 70% of tread).'
      ],
      dangerNote: 'If the hole exceeds 6mm or has steel cords frayed sideways across multiple tread ribs, the casing cannot be salvaged.'
    },
    {
      step: 3,
      title: 'Carbide Canal Reaming & Low-Speed Inner Liner Buffing',
      badge: 'Chemical Prep',
      icon: Wrench,
      summary: 'Creating a sterile, textured mechanical surface for permanent chemical cold-vulcanization.',
      details: [
        'Ream the injury canal from inside-out using a low-speed pneumatic drill and precision carbide cutter to remove corroded steel wire fragments.',
        'Clean the inner butyl liner around the puncture with solvent pre-wash cleaner to remove mold-release lubricants.',
        'Gently scuff the rubber with a low-speed wire dome brush to create a velvet texture (RMA buff texture 1 or 2) without exposing cord plies.',
        'Vacuum all rubber dust and debris—never blow with compressed air containing oil/water contaminants.'
      ],
      dangerNote: 'Over-buffing exposes structural cords and ruins casing tensile strength.'
    },
    {
      step: 4,
      title: 'BSAU159 Combi-Mushroom Plug-Patch Vulcanization',
      badge: 'Dual-Barrier Seal',
      icon: Layers,
      summary: 'Our standard: a high-grade mushroom combi unit provides two critical safety barriers in one permanent repair.',
      details: [
        'Barrier 1 (Rubber Stem): Coated with vulcanizing cement and pulled through the channel with a lead wire. Completely seals the hole from the outside, blocking rain, mud, and road salt from reaching and rusting the steel belts.',
        'Barrier 2 (Reinforced Patch Base): Chemically vulcanizes to the inner liner, creating an airtight bond capable of holding over 50 PSI permanently.',
        'Roll the patch thoroughly from the center outward with a serrated stitching wheel to eliminate trapped air bubbles.',
        'Apply safety over-buff sealant over the exposed perimeter of the patch to protect against air bleed-down.'
      ],
      dangerNote: 'A simple flat patch without a stem allows water into the steel belts, leading to rust belt separation within months.'
    },
    {
      step: 5,
      title: 'High-Pressure Submersion Dunk-Tank & Bead Testing',
      badge: 'Final Verification',
      icon: ShieldCheck,
      summary: 'No repaired tyre leaves our Maranatha Square workshop without zero-tolerance pressure leak testing.',
      details: [
        'Remount tyre using commercial bead lubrication paste to seat beads uniformly on the rim flange.',
        'Inflate to factory operating PSI plus 5 PSI test tolerance.',
        'Fully submerge the inflated assembly in our workshop dunk tank to inspect for microscopic air bubbles at the repair site, bead perimeter, and valve stem.',
        'Perform digital dynamic spin balancing to compensate for the counterweight of the vulcanized patch.'
      ],
      dangerNote: 'Ensures 100% airtight integrity before the driver tackles high-speed highway or mountain driving.'
    }
  ];

  const disqualificationReasons = [
    { title: 'Run-Flat Casing Burn', desc: 'Internal rubber crumb or melted inner liner from driving while flat.' },
    { title: 'Puncture Size > 6mm', desc: 'Holes larger than 1/4 inch cannot be safely bridged by plug stems.' },
    { title: 'Tread Depth < 1.6mm', desc: 'Tyre is legally bald and lacks water evacuation channels on wet roads.' },
    { title: 'Bead Ring Distortion', desc: 'Kinked or exposed steel bead wires that cannot maintain an airtight rim seal.' },
    { title: 'Adjacent Prior Repairs', desc: 'Another repair located within 16 inches on the same circumference.' },
    { title: 'Age or Ozone Weather-Checking', desc: 'Severe sidewall dry-rot cracks or casing older than 8–10 years.' },
  ];

  return (
    <div id="puncture-repair-guide" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-8">
      
      {/* Component Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white p-6 sm:p-8">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            Dominica Mountain Safety & Quality Protocol
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Professional Tyre Puncture Repair & Inspection Guide
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Dominica’s mountainous terrain puts extraordinary demands on tyres. Learn the exact 5-step inspection and vulcanization process required to guarantee your safety after a roadside puncture.
          </p>
        </div>
      </div>

      {/* SECTION 1: INTERACTIVE REPAIR ZONE SELECTOR */}
      <div className="px-6 sm:px-8 space-y-4">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0984E3]">
            Safety Assessment Criteria
          </span>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900">
            1. Where is the Puncture Located? (Tyre Anatomy Zones)
          </h3>
          <p className="text-xs text-slate-600">
            Click each zone below to see whether a tyre can be safely repaired according to international BSAU159 standards:
          </p>
        </div>

        {/* Zone Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => setSelectedZone('crown')}
            className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
              selectedZone === 'crown'
                ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Zone A: Crown</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                Repairable
              </span>
            </div>
            <span className="text-[11px] text-slate-500 mt-2">Center 70% of main tread width</span>
          </button>

          <button
            onClick={() => setSelectedZone('shoulder')}
            className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
              selectedZone === 'shoulder'
                ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Zone B: Shoulder</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase">
                High Danger
              </span>
            </div>
            <span className="text-[11px] text-slate-500 mt-2">Outer 15% edge curves</span>
          </button>

          <button
            onClick={() => setSelectedZone('sidewall')}
            className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
              selectedZone === 'sidewall'
                ? 'bg-red-50/70 border-red-500 ring-2 ring-red-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Zone C: Sidewall</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 uppercase">
                Forbidden
              </span>
            </div>
            <span className="text-[11px] text-slate-500 mt-2">Vertical flex body plies</span>
          </button>
        </div>

        {/* Selected Zone Detail Card */}
        <div className={`p-5 rounded-xl border ${zones[selectedZone].borderColor} bg-slate-50 space-y-3`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="font-bold text-sm sm:text-base text-slate-900">
              {zones[selectedZone].title}
            </h4>
            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${zones[selectedZone].statusColor}`}>
              {zones[selectedZone].status}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {zones[selectedZone].description}
          </p>

          <div className="space-y-1.5 pt-2 border-t border-slate-200">
            <strong className="text-[11px] uppercase font-bold text-slate-500 block">Inspection & Safety Criteria:</strong>
            <ul className="space-y-1 text-xs text-slate-700">
              {zones[selectedZone].requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2">
                  {selectedZone === 'crown' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-800">
            <strong>Verdict:</strong> {zones[selectedZone].verdict}
          </div>
        </div>
      </div>

      {/* SECTION 2: THE 5-STEP INSPECTION & VULCANIZING WORKFLOW */}
      <div className="px-6 sm:px-8 space-y-4">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0984E3]">
            Workshop Quality Standard
          </span>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900">
            2. The 5-Stage Professional Inspection & Repair Process
          </h3>
          <p className="text-xs text-slate-600">
            Why our roadside and workshop repairs never fail: every tyre undergoes rigorous multi-point demounting and vulcanization.
          </p>
        </div>

        {/* Step Selector Tabs */}
        <div className="flex flex-wrap gap-2">
          {steps.map((s) => {
            const Icon = s.icon;
            const isActive = activeStep === s.step;
            return (
              <button
                key={s.step}
                onClick={() => setActiveStep(s.step)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                  isActive 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  isActive ? 'bg-[#0984E3] text-white' : 'bg-slate-300 text-slate-700'
                }`}>
                  {s.step}
                </span>
                <span>Stage {s.step}</span>
              </button>
            );
          })}
        </div>

        {/* Active Step Showcase */}
        {(() => {
          const cur = steps.find(s => s.step === activeStep) || steps[0];
          const CurIcon = cur.icon;
          return (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#0984E3] text-white rounded-xl">
                    <CurIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#0984E3] uppercase tracking-wider">
                      Stage {cur.step} of 5 • {cur.badge}
                    </span>
                    <h4 className="text-base font-bold text-slate-900">
                      {cur.title}
                    </h4>
                  </div>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {cur.summary}
              </p>

              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Mandatory Execution Steps:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {cur.details.map((d, dIdx) => (
                    <li key={dIdx} className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-[#0984E3] shrink-0 mt-0.5" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{cur.dangerNote}</span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* SECTION 3: WHY STRING PLUGS WITHOUT DEMOUNTING ARE DANGEROUS */}
      <div className="px-6 sm:px-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-red-700 font-bold text-sm sm:text-base">
            <Flame className="w-5 h-5 text-red-600 shrink-0" />
            <span>The Danger of "Quick String Plugs" on Dominica Mountain Roads</span>
          </div>
          <p className="text-xs sm:text-sm text-red-900/90 leading-relaxed">
            Many informal roadside mechanics will simply shove a brown string plug into a tyre without removing it from the rim. While convenient in an immediate breakdown, <strong>this is strictly temporary</strong>. Without looking inside, there is no way to know if driving on the flat has ground the internal casing into rubber dust or damaged the steel belts. On Dominica’s steep downhill braking switchbacks, heat causes string plugs to blow out, resulting in loss of vehicle control.
          </p>
          <div className="text-xs font-bold text-red-800">
            Recommendation: Use roadside string plugs only at slow crawl speed to reach Maranatha Square for a permanent demounted mushroom repair.
          </div>
        </div>
      </div>

      {/* SECTION 4: DISQUALIFICATION REASONS TABLE */}
      <div className="px-6 sm:px-8 space-y-3">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0984E3]">
            Safety First Policy
          </span>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900">
            3. When a Tyre MUST Be Replaced (Non-Negotiable Red Flags)
          </h3>
          <p className="text-xs text-slate-600">
            Under these conditions, repairing the tyre is unsafe and our certified technicians will advise immediate replacement:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {disqualificationReasons.map((r, i) => (
            <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span>{r.title}</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-snug">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 5: ROADSIDE FLAT TYRE EMERGENCY PROTOCOL & SOS */}
      <div className="p-6 sm:p-8 bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-red-600/20 text-red-300 border border-red-500/30 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase">
            <Truck className="w-3.5 h-3.5 text-red-400" />
            Roadside Emergency Protocol
          </div>
          <h4 className="text-lg sm:text-xl font-bold text-white">
            Have a Flat on the South Highway or Mountain Pass?
          </h4>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Pull off to a firm, level shoulder immediately. Turn on hazard flashers and place your safety triangle 50m behind. Driving even 100 meters on a flat rim will permanently destroy the tyre casing.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
          {onOpenSOS && (
            <button
              onClick={onOpenSOS}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition shadow-md"
            >
              <Truck className="w-4 h-4" />
              <span>Dispatch Mobile SOS Unit</span>
            </button>
          )}

          <a
            href={`tel:${SHOP_LOCATION_INFO.phonePrimary.replace(/[^0-9+]/g, '')}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#0984E3] hover:bg-[#0873c4] text-white font-bold text-xs px-5 py-3 rounded-xl transition shadow-md"
          >
            <Phone className="w-4 h-4" />
            <span>Call Shop: {SHOP_LOCATION_INFO.phonePrimary}</span>
          </a>
        </div>
      </div>

    </div>
  );
};
