import { TyreService } from '../types';

export const TYRE_SERVICES: TyreService[] = [
  {
    id: 'srv-puncture',
    name: 'BSAU159 Radial Puncture Repair & Mushroom Vulcanization',
    category: 'Puncture & Repair',
    priceXCD: 25,
    durationMinutes: 20,
    description: 'Permanent interior vulcanized two-piece mushroom combi plug-patch. Restores both airtight butyl inner liner and fills puncture channel to prevent steel belt oxidation.',
    inclusions: [
      'Full demount and interior 360° casing inspection',
      'Carbide injury channel reaming (≤6mm / 1/4" crown puncture limit)',
      'Chemical vulcanizing cement & lead-wire mushroom stem patch',
      'High-pressure water dunk tank submersion test & dynamic rim bead seal'
    ],
    iconName: 'Wrench',
    isPopular: true,
    badge: 'Certified Safety Standard',
  },
  {
    id: 'srv-mounting',
    name: 'Precision Pneumatic Tyre Mounting & Bead Lubrication',
    category: 'Fitting & Mounting',
    priceXCD: 20,
    durationMinutes: 15,
    description: 'Heavy-duty non-scratch pneumatic turntable demounting and mounting for standard alloy rims, steelies, and reinforced SUV/truck wheels.',
    inclusions: [
      'Rim bead wire wire-brush cleaning and rim lip corrosion removal',
      'High-grade vegetable-oil mounting paste for leak-proof bead seating',
      'Standard tyre inflation to vehicle door-jamb OEM pressure specifications',
      'Visual rim inspection for cracks, dents, or rim runout'
    ],
    iconName: 'Disc',
    isPopular: true,
  },
  {
    id: 'srv-balancing',
    name: 'Digital Dynamic High-Speed Wheel Balancing',
    category: 'Alignment & Safety',
    priceXCD: 25,
    durationMinutes: 15,
    description: 'Computerized dual-plane spin balancing eliminating steering vibration and high-speed shudder on Dominica’s coastal and mountain link highways.',
    inclusions: [
      'High-precision optical wheel shaft laser measurement',
      'Removal of legacy degraded wheel weights',
      'Installation of zinc clip-on or concealed adhesive counter-weights',
      'Smooth vibration-free highway ride guarantee'
    ],
    iconName: 'Sparkles',
    isPopular: true,
    badge: 'Vibration-Free Ride',
  },
  {
    id: 'srv-valves',
    name: 'High-Pressure Rubber Valve Stem & Core Replacement',
    category: 'Maintenance & Safety',
    priceXCD: 10,
    durationMinutes: 10,
    description: 'Installation of fresh ozone-resistant EPDM rubber snap-in valve stems and brass Schrader cores to eliminate slow bead pressure bleed-down.',
    inclusions: [
      'Brand new TR413 / TR414 brass-threaded ozone-resistant valve stems',
      'New spring-loaded nickel-plated core insertion',
      'Airtight O-ring dust cap installation',
      'Soap bubble core tightness leak verification'
    ],
    iconName: 'Disc',
  },
  {
    id: 'srv-rotation',
    name: '4-Wheel Tyre Rotation & Tread Wear Pattern Audit',
    category: 'Maintenance & Safety',
    priceXCD: 35,
    durationMinutes: 25,
    description: 'Cross-directional tyre rotation extending usable tread life by up to 25%, offsetting Dominica’s steep downhill braking camber and sharp mountain corner wear.',
    inclusions: [
      'Forward cross / modified X rotation based on drivetrain (FWD/RWD/4WD)',
      'Digital depth gauge measurement across all 4 tyres with wear report',
      'Visual audit for camber wear, cupping, heel-toe feathering, and underinflation',
      'Hand torque-wrench lug nut fastening to OEM manufacturer specifications'
    ],
    iconName: 'Wrench',
  },
  {
    id: 'srv-nitrogen',
    name: 'Dry Nitrogen Tyre Inflation & Mountain Altitude Tuning',
    category: 'Maintenance & Safety',
    priceXCD: 15,
    durationMinutes: 15,
    description: '99% pure dry nitrogen purge and fill. Reduces pressure fluctuations between hot coastal driving and cool mountain passes (Freshwater Lake / Soufriere).',
    inclusions: [
      'Complete atmospheric air vacuum purge',
      'Dry inert nitrogen inflation to specified PSI',
      'Eliminates internal moisture oxidation of steel rim lips',
      'Signature green high-visibility valve caps'
    ],
    iconName: 'Sparkles',
  },
  {
    id: 'srv-roadside',
    name: 'Emergency Mobile Roadside Tyre Rescue (SOS)',
    category: 'Emergency Rescue',
    priceXCD: 80,
    durationMinutes: 30,
    description: 'Rapid mobile rescue dispatched directly from Maranatha Square. We come to your breakdown location with jacks, impact tools, air, and spare tyres.',
    inclusions: [
      'Mobile roadside unit dispatched across Pichelin, Grand Bay, Soufriere & South Highway',
      'On-site jack, spare change or mobile flat repair',
      'Option to bring a new or quality used tyre directly to you',
      'On-scene safety triangle and high-torque impact wrench service'
    ],
    iconName: 'Truck',
    isPopular: true,
    badge: 'Pichelin & South Dominica Rapid Response',
  },
  {
    id: 'srv-shredder',
    name: 'Eco-Friendly Tyre Shredder & Green Recycling',
    category: 'Environmental Sustainability',
    priceXCD: 1,
    durationMinutes: 10,
    description: 'State-of-the-art commercial mechanical tyre shredding. Destroys scrap and old bald tyres into clean rubber chips, eliminating vector-borne mosquito breeding sites and zero landfill impact in Dominica’s lush biosphere.',
    inclusions: [
      'Complete mechanical shredding of old/bald scrap tyres',
      'Prevention of stagnant water vector-breeding (Zika/Dengue control)',
      'Recycled into eco-rubber agricultural mulch & civil engineering aggregate',
      'Official Green Dominica Environmental Impact Certificate'
    ],
    iconName: 'Leaf',
    isPopular: true,
    badge: '100% Zero Landfill Commitment',
  }
];

export const WORKSHOP_HOURS = [
  { day: 'Monday', hours: '7:30 AM – 6:00 PM', status: 'Open' },
  { day: 'Tuesday', hours: '7:30 AM – 6:00 PM', status: 'Open' },
  { day: 'Wednesday', hours: '7:30 AM – 6:00 PM', status: 'Open' },
  { day: 'Thursday', hours: '7:30 AM – 6:00 PM', status: 'Open' },
  { day: 'Friday', hours: '7:30 AM – 6:00 PM', status: 'Open' },
  { day: 'Saturday', hours: '7:30 AM – 5:30 PM', status: 'Open' },
  { day: 'Sunday', hours: 'Emergency Roadside On-Call', status: 'On-Call' },
];

export const SHOP_LOCATION_INFO = {
  name: 'Max Executive Tires',
  address: 'Maranatha Square, Main Highway, Pichelin',
  parish: 'St. Patrick, Commonwealth of Dominica',
  phonePrimary: '+1 767 616 0155',
  phoneMobile: '+1 767 616 0155',
  whatsapp: '+1 767 616 0155',
  email: 'maxexecutivetires.dm@gmail.com',
  landmarks: 'Centrally located at Maranatha Square in Pichelin, right off the Grand Bay-Roseau link road, opposite the community center with easy drive-in workshop bays.',
  serviceAreas: [
    'Pichelin (Maranatha Square)',
    'Grand Bay & Berricoa',
    'Bellevue Chopin & Roseau Valley',
    'Soufrière & Scotts Head',
    'Bagatelle & Petite Savanne Road',
    'Geneva & South Coast Route'
  ]
};
