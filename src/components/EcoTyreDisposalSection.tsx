import React, { useState } from 'react';
import { 
  Leaf, 
  Recycle, 
  TreePine, 
  Droplets, 
  Flame, 
  ShieldCheck, 
  Layers, 
  Scale, 
  CheckCircle2, 
  AlertTriangle, 
  Truck, 
  Phone, 
  ArrowRight, 
  MapPin, 
  Sparkles, 
  Calculator,
  Building2,
  Mountain,
  FileCheck,
  Clock,
  ExternalLink
} from 'lucide-react';
import { SHOP_LOCATION_INFO } from '../data/servicesData';

interface EcoTyreDisposalSectionProps {
  onOpenSOS?: () => void;
  onContactShop?: () => void;
}

export const EcoTyreDisposalSection: React.FC<EcoTyreDisposalSectionProps> = ({
  onOpenSOS,
  onContactShop,
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [tyreCount, setTyreCount] = useState<number>(4);
  const [selectedThreat, setSelectedThreat] = useState<'mosquitoes' | 'fires' | 'watershed' | 'landfills'>('mosquitoes');

  // Eco Calculation formulas based on typical 10kg passenger tyre
  const stagnantWaterEliminatedLitres = tyreCount * 12; // An average passenger tyre holds 10-15L stagnant water
  const rubberDivertedKg = tyreCount * 9.5; // ~9.5kg rubber per passenger tyre
  const steelRecycledKg = tyreCount * 1.5; // ~1.5kg high-tensile steel per tyre
  const erosionAggregateSqM = (tyreCount * 0.35).toFixed(1); // Mulch / aggregate coverage

  const environmentalThreats = {
    mosquitoes: {
      title: 'Aedes Mosquito Breeding & Dengue/Zika Epidemics',
      tag: 'Vector-Borne Disease Control',
      badgeColor: 'bg-red-500/10 text-red-700 border-red-200',
      icon: Droplets,
      description: 'Dominica’s frequent tropical rainfall causes discarded tyres in Pichelin, Grand Bay, and road ravines to fill with stagnant water within 24 to 48 hours. Dark, warm tyre cavities create the single most fertile breeding habitat for Aedes aegypti and Aedes albopictus mosquitoes—the exclusive vectors of Dengue fever, Chikungunya, and Zika virus.',
      impactFacts: [
        'A single abandoned tyre can produce over 1,000 mosquito larvae per week in Dominica’s humid climate.',
        'Tyres naturally shield stagnant water from evaporating and protect larvae from natural predators like dragonflies.',
        'Mechanical shredding at Maranatha Square permanently destroys the hollow rim cavity, providing 100% vector elimination.'
      ],
      pichelinContext: 'Located in the lush river valley between Roseau and Grand Bay, Pichelin receives significant rainfall. Eliminating stagnant tyre reservoirs directly protects community health across the Grand Bay constituency.'
    },
    fires: {
      title: 'Toxic Mountain Tyre Fires & Air Pollution',
      tag: 'Atmospheric & Public Health Hazard',
      badgeColor: 'bg-amber-500/10 text-amber-800 border-amber-200',
      icon: Flame,
      description: 'Informal scrap tyre dumping in roadside bush or ravines creates extreme wildfire hazards. Once ignited by agricultural clearing fires or dry season brush, tyre fires burn at temperatures exceeding 1,000°C and cannot be extinguished with standard water tenders.',
      impactFacts: [
        'Releases thick, choking black smoke loaded with mutagenic dioxins, furans, sulfur dioxide, and benzene.',
        'Deposits carcinogenic soot onto residential rainwater catchment roofs, contaminating household drinking water cisterns.',
        'Tyre fires can smolder internally underground for weeks, threatening nearby homes, power lines, and pristine mountain rainforest.'
      ],
      pichelinContext: 'Many Dominica households in southern villages rely on roof rainwater collection. An uncontrolled scrap tyre fire downwind severely threatens clean drinking water security.'
    },
    watershed: {
      title: 'River Basin Contamination & Volcanic Soil Leaching',
      tag: 'River & Marine Ecosystem Protection',
      badgeColor: 'bg-blue-500/10 text-blue-700 border-blue-200',
      icon: Mountain,
      description: 'When tyres decompose in damp tropical soil or river ravines over decades, toxic chemical compounds leach into the surrounding ecosystem. Rainwater runoff carries heavy metals and microplastic particles into Dominica’s pristine mountain streams.',
      impactFacts: [
        'Leaches heavy concentrations of zinc, cadmium, lead, and polycyclic aromatic hydrocarbons (PAHs).',
        'Directly toxic to freshwater crayfish, tilapia, and river aquatic species in the Grand Bay and Geneva river valleys.',
        'Contaminates agricultural soil relied on by local farmers for citrus, avocado, dasheen, and organic root crops.'
      ],
      pichelinContext: 'Pichelin sits atop critical agricultural drainage channels that flow toward the Atlantic and Soufrière marine reserves. Zero-landfill shredding keeps these volcanic soils uncontaminated.'
    },
    landfills: {
      title: 'Dominica Landfill Crisis & 100-Year Carcass Survival',
      tag: 'Landfill Capacity & Geo-Liner Preservation',
      badgeColor: 'bg-purple-500/10 text-purple-700 border-purple-200',
      icon: Layers,
      description: 'Automotive tyres are intentionally engineered to be practically indestructible. Thrown into landfills, whole tyres refuse to decompose for over a century, consume enormous space, and pose severe engineering problems for waste management authorities.',
      impactFacts: [
        'Whole tyres trap underground landfill methane gas and gradually "bubble" or "float" to the surface through tonnes of soil.',
        'Rising tyres tear through expensive geotextile landfill protective liners, allowing hazardous municipal leachates into the water table.',
        'Commercial shredding reduces tyre volume by over 80%, transforming bulky waste into valuable civil construction aggregate.'
      ],
      pichelinContext: 'Dominica is a small island with limited landfill acreage. Diverting end-of-life tyres from the municipal waste stream preserves vital landfill lifespan for the nation.'
    }
  };

  const disposalWorkflow = [
    {
      step: 1,
      title: 'Intake Inspection, Grading & Metal De-Rim',
      badge: 'Step 1: Receipt & Sorting',
      desc: 'Old or scrap tyres are received at our Maranatha Square workshop facility. Each tyre is inspected to determine if the structural casing has agricultural repurposing potential (e.g. low-speed farm trailers or soil retaining buffers) or must proceed immediately to mechanical shredding.',
      inclusions: [
        'Demounted from alloy or steel rims using pneumatic demounters',
        'Removal of lead or zinc balance weights and valve stems',
        'High-pressure wash to remove river silt, road grease, and soil'
      ]
    },
    {
      step: 2,
      title: 'Hydraulic Bead Ring Extraction & Primary Shredding',
      badge: 'Step 2: Heavy Mechanical Destruction',
      desc: 'The tyre is fed into our heavy-duty de-beader to extract thick circular high-tensile carbon steel bead wire rings. The remaining rubber and belt casing then enters our industrial high-torque dual-shaft mechanical shredder.',
      inclusions: [
        'Dual counter-rotating alloy steel blades running at low RPM / ultra-high torque',
        'Easily slices through 8-ply, 10-ply commercial minibus and SUV steel belts',
        'Reduces intact whole tyres into uniform 2-inch to 4-inch coarse rubber strips',
        'Instantly and permanently destroys the water-holding cavity'
      ]
    },
    {
      step: 3,
      title: 'Electromagnetic Steel Separation & Granulation',
      badge: 'Step 3: Material Extraction',
      desc: 'The shredded rubber strips travel across a secondary rotary granulator and under high-intensity neodymium cross-belt electromagnets. This process cleanly separates the embedded steel radial wires from the pure vulcanized rubber.',
      inclusions: [
        'Neodymium magnetic belt extracts 99.8% of fragmented steel radial cords',
        'Clean separated steel is baled and recycled into secondary metal manufacturing',
        'Rubber matrix is ground down into uniform 10mm to 20mm rubber chips'
      ]
    },
    {
      step: 4,
      title: 'Repurposing into Dominica Sustainable Products',
      badge: 'Step 4: 100% Local Circular Economy',
      desc: 'Zero rubber leaves Pichelin for burning or dumping. Every kilogram of shredded rubber is converted into practical, climate-resilient applications designed specifically for Dominica’s mountain landscape.',
      inclusions: [
        'Mountain Retaining Wall & Landslide Backfill: Lightweight, porous aggregate that relieves hydrostatic water pressure behind concrete retaining walls along steep Dominica mountain passes.',
        'Agricultural Weed-Barrier Mulch: Long-lasting, clean rubber mulch for Grand Bay and Soufrière citrus orchards that prevents weed growth and insulates roots without rotting.',
        'School Play Area & Workshop Flooring: Shock-absorbent safety rubber chips that soften falls and cushion heavy equipment.'
      ]
    }
  ];

  return (
    <div id="eco-tyre-disposal-section" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-8">
      
      {/* Hero Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white p-6 sm:p-8">
        <div className="max-w-4xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            <Leaf className="w-3.5 h-3.5 text-emerald-400" />
            Nature Isle Environmental Stewardship • Pichelin, Dominica
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Eco-Friendly Tyre Disposal & Green Mechanical Shredding
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Protecting Dominica’s rainforest rivers, public health, and volcanic soil from tyre dumping. Our commercial mechanical shredder at Maranatha Square permanently converts scrap tyres into clean, reusable agricultural mulch and civil engineering aggregate.
          </p>

          <div className="pt-2 flex flex-wrap gap-2 sm:gap-3 text-xs">
            <div className="bg-white/10 backdrop-blur-xs px-3 py-1 rounded-lg border border-white/10 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Zero Open Burning</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3 py-1 rounded-lg border border-white/10 flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-blue-400" />
              <span>Mosquito Vector Control (Dengue/Zika)</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3 py-1 rounded-lg border border-white/10 flex items-center gap-1.5">
              <Recycle className="w-3.5 h-3.5 text-amber-400" />
              <span>Circular Dominica Repurposing</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: THE CRITICAL ENVIRONMENTAL THREATS IN PICHELIN */}
      <div className="px-6 sm:px-8 space-y-4">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
            <TreePine className="w-3.5 h-3.5" />
            Environmental Reality & Local Impact
          </span>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900">
            1. Why Old Tyres Cannot Be Dumped in Dominica
          </h3>
          <p className="text-xs text-slate-600">
            Discarded tyres in tropical rainforest valleys pose direct public health and ecological hazards. Click each category below to understand the localized threats in Pichelin and southern Dominica:
          </p>
        </div>

        {/* Threat Selection Tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {[
            { id: 'mosquitoes', label: 'Mosquito Vectors', icon: Droplets, color: 'text-red-500' },
            { id: 'fires', label: 'Toxic Mountain Fires', icon: Flame, color: 'text-amber-500' },
            { id: 'watershed', label: 'River & Soil Poisoning', icon: Mountain, color: 'text-blue-500' },
            { id: 'landfills', label: 'Landfill Floating Crises', icon: Layers, color: 'text-purple-500' },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = selectedThreat === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedThreat(item.id as any)}
                className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white/10 text-emerald-400' : 'bg-white text-slate-700'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold leading-tight">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Threat Deep-Dive Box */}
        {(() => {
          const current = environmentalThreats[selectedThreat];
          const CurIcon = current.icon;
          return (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-600 text-white rounded-xl">
                    <CurIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      {current.tag}
                    </span>
                    <h4 className="text-base font-bold text-slate-900">
                      {current.title}
                    </h4>
                  </div>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {current.description}
              </p>

              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Scientific & Environmental Consequences:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {current.impactFacts.map((fact, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block">Pichelin & Grand Bay Community Context:</strong>
                  <span>{current.pichelinContext}</span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* SECTION 2: THE 4-STAGE PROFESSIONAL TYRE DISPOSAL PROCESS */}
      <div className="px-6 sm:px-8 space-y-4">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
            <Recycle className="w-3.5 h-3.5" />
            Engineering & Facility Workflow
          </span>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900">
            2. The Professional Mechanical Shredding & Repurposing Process
          </h3>
          <p className="text-xs text-slate-600">
            How Max Executive Tires safely handles scrap rubber at our dedicated Maranatha Square recycling station:
          </p>
        </div>

        {/* Step Tabs */}
        <div className="flex flex-wrap gap-2">
          {disposalWorkflow.map((st) => {
            const isActive = activeStep === st.step;
            return (
              <button
                key={st.step}
                onClick={() => setActiveStep(st.step)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  isActive ? 'bg-white text-emerald-800 font-extrabold' : 'bg-slate-300 text-slate-700'
                }`}>
                  {st.step}
                </span>
                <span>Stage {st.step}</span>
              </button>
            );
          })}
        </div>

        {/* Active Step Details */}
        {(() => {
          const stepData = disposalWorkflow.find((s) => s.step === activeStep) || disposalWorkflow[0];
          return (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="border-b border-slate-200 pb-2">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  {stepData.badge}
                </span>
                <h4 className="text-base font-bold text-slate-900">
                  {stepData.title}
                </h4>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {stepData.desc}
              </p>

              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Process Parameters & Safety Controls:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {stepData.inclusions.map((inc, i) => (
                    <div key={i} className="bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{inc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* SECTION 3: INTERACTIVE DOMINICA ECO-IMPACT CALCULATOR */}
      <div className="px-6 sm:px-8">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Calculator className="w-4 h-4" />
                Interactive Eco-Impact Calculator
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-white">
                Calculate the Environmental Impact of Your Disposed Tyres
              </h4>
              <p className="text-xs text-slate-300">
                See how many litres of stagnant mosquito water and kilograms of toxic waste you eliminate by recycling in Pichelin:
              </p>
            </div>

            {/* Tyre Quantity Selector */}
            <div className="flex items-center gap-3 bg-slate-800/80 p-2 rounded-xl border border-slate-700 shrink-0">
              <span className="text-xs text-slate-300 font-semibold pl-2">Tyres:</span>
              {[2, 4, 8, 20, 50].map((num) => (
                <button
                  key={num}
                  onClick={() => setTyreCount(num)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    tyreCount === num 
                      ? 'bg-emerald-500 text-white' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Calculator Visual Result Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Stagnant Water Saved</span>
                <Droplets className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-blue-300">
                {stagnantWaterEliminatedLitres.toLocaleString()} Litres
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Potential mosquito breeding water prevented in Pichelin ravines.
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Virgin Rubber Diverted</span>
                <Recycle className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">
                {rubberDivertedKg.toFixed(0)} kg
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                High-grade vulcanized rubber kept out of Dominica landfills.
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Scrap Steel Recovered</span>
                <Layers className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-300">
                {steelRecycledKg.toFixed(0)} kg
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                High-tensile radial wire extracted for metal remanufacturing.
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Erosion Mulch Produced</span>
                <TreePine className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-teal-300">
                {erosionAggregateSqM} m²
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Soil erosion retaining backfill for Dominica mountain slopes.
              </p>
            </div>

          </div>

          <div className="text-center sm:text-left text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-700/60">
            <span>Every single tyre processed at Maranatha Square makes Dominica greener.</span>
            <span className="text-emerald-400 font-bold">Standard Workshop Fee: Nominal EC$ 1 per tyre (Free with new tyre purchase)</span>
          </div>
        </div>
      </div>

      {/* SECTION 4: COMMUNITY RECYCLING DROP-OFF & FLEET COLLECTION */}
      <div className="px-6 sm:px-8">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0984E3]">
              Community Action Program
            </span>
            <h4 className="text-base font-bold text-slate-900">
              Community Drop-Off & Commercial Transport Fleet Recycling
            </h4>
            <p className="text-xs text-slate-600">
              Whether you are an individual motorist replacing a single flat or a commercial minibus/truck fleet operator with 50 bald casings, we provide certified eco-disposal:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <MapPin className="w-4 h-4 text-red-500" />
                <span>Drop-Off Location</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Maranatha Square, Main Highway, Pichelin. Directly accessible from South Link Road with wide turning bays for trailers and trucks.
              </p>
              <div className="text-[11px] text-slate-500 font-medium pt-1">
                Mon – Sat: 7:30 AM – 6:00 PM
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Building2 className="w-4 h-4 text-blue-500" />
                <span>Minibus & Commercial Fleets</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Bulk intake for Grand Bay, Roseau, and Soufrière commuter bus fleets. We provide volume batch shredding and official disposal receipts.
              </p>
              <div className="text-[11px] text-emerald-700 font-medium pt-1">
                Batch fleet discounts & on-site pickup available
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Green Dominica Certificate</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Commercial businesses receive an official "Zero-Landfill Tyre Recycling Certificate" verifying responsible environmental waste disposal.
              </p>
              <div className="text-[11px] text-blue-600 font-medium pt-1">
                Complies with national environmental guidelines
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER CALL-TO-ACTION BAR */}
      <div className="p-6 sm:p-8 bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <h4 className="text-lg font-bold text-white">
            Have Old or Scrap Tyres to Dispose in Dominica?
          </h4>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Never dump tyres in bush ravines or allow them to breed mosquitoes in your yard. Bring them to Maranatha Square in Pichelin for professional mechanical shredding.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
          <a
            href={`tel:${SHOP_LOCATION_INFO.phonePrimary.replace(/[^0-9+]/g, '')}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-3 rounded-xl transition shadow-md"
          >
            <Phone className="w-4 h-4" />
            <span>Call Recycling Desk: {SHOP_LOCATION_INFO.phonePrimary}</span>
          </a>

          <a
            href={`https://wa.me/${SHOP_LOCATION_INFO.whatsapp.replace(/[^0-9]/g, '')}?text=Hello%20Max%20Executive%20Tires,%20I%20have%20scrap%20tyres%20to%20dispose%20of%20in%20Pichelin`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-5 py-3 rounded-xl border border-slate-700 transition"
          >
            <span>WhatsApp Scrap Drop Inquiry</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

    </div>
  );
};
