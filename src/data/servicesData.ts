import { TyreService } from '../types';

export const TYRE_SERVICES: TyreService[] = [
  {
    id: 'srv-mounting',
    name: 'Precision Tyre Mounting & Demounting',
    category: 'Fitting & Mounting',
    priceXCD: 20,
    priceUSD: 7.50,
    durationMinutes: 15,
    description: 'Professional pneumatic tyre change using scratch-free rim clamping to protect alloy wheels. Includes bead lubrication & rim inspection.',
    inclusions: [
      'Pneumatic demounting and mounting',
      'Alloy wheel rim lip inspection & cleaning',
      'Bead sealing compound application',
      'Inflated to exact vehicle manufacturer PSI'
    ],
    iconName: 'Wrench',
    isPopular: true,
    badge: 'Standard Workshop Service',
  },
  {
    id: 'srv-balancing',
    name: 'Computerized Dynamic Wheel Balancing',
    category: 'Balancing & Alignment',
    priceXCD: 25,
    priceUSD: 9.25,
    durationMinutes: 15,
    description: 'High-precision micro-gram dynamic balancing. Eliminates steering wheel vibration at highway speeds and extends tyre life on Dominica roads.',
    inclusions: [
      'Digital spin balancer calibration',
      'Old clip & adhesive weights removal',
      'High-grade zinc/steel counter-weights applied',
      'Hub mounting surface de-rusting'
    ],
    iconName: 'Disc',
    isPopular: true,
    badge: 'Recommended with Every Tyre Change',
  },
  {
    id: 'srv-puncture',
    name: 'Heavy-Duty Radial Puncture Repair & Vulcanizing',
    category: 'Puncture & Repair',
    priceXCD: 35,
    priceUSD: 13.00,
    durationMinutes: 20,
    description: 'Permanent inside-out mushroom plug vulcanization. Meets strict international safety standards — far superior to temporary external string plugs.',
    inclusions: [
      'Internal tyre carcass inspection for hidden cord damage',
      'Inner liner reaming and chemical vulcanizing cement',
      'Heavy-duty radial reinforcement patch',
      'Immersion pressure leak submersion test'
    ],
    iconName: 'ShieldAlert',
    isPopular: true,
    badge: 'Permanent Safety Fix',
  },
  {
    id: 'srv-rotation',
    name: '4-Wheel Rotation & Mountain Tread Alignment Check',
    category: 'Maintenance & Safety',
    priceXCD: 40,
    priceUSD: 15.00,
    durationMinutes: 25,
    description: 'Cross-pattern rotation engineered to counteract the severe front-outer tyre scrub caused by Dominica’s steep downhill mountain hairpin curves.',
    inclusions: [
      'Full 4-wheel removal & directional cross-rotation',
      'Digital depth gauge check across all 4 tyres',
      'Torque wrench lug nut tightening to factory spec',
      'Suspension play & visual camber check'
    ],
    iconName: 'RotateCw',
    isPopular: false,
    badge: 'Every 5,000 KM in Dominica',
  },
  {
    id: 'srv-valve',
    name: 'High-Pressure Rubber / Metal Valve Replacement',
    category: 'Maintenance & Safety',
    priceXCD: 15,
    priceUSD: 5.50,
    durationMinutes: 10,
    description: 'Brand new high-pressure EPDM ozone-resistant valve stem with brass core. Prevents slow leaks and sudden pressure drops.',
    inclusions: [
      'Fresh ozone-resistant rubber or metal valve stem',
      'New spring-loaded valve core',
      'High-seal dust cap with internal rubber O-ring'
    ],
    iconName: 'CircleDot',
    isPopular: false,
  },
  {
    id: 'srv-roadside',
    name: 'Emergency Mobile Roadside Tyre Rescue (SOS)',
    category: 'Emergency Rescue',
    priceXCD: 75,
    priceUSD: 28.00,
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
    id: 'srv-rim-bead',
    name: 'Bead De-scaling & Rim Rust Seal Treatment',
    category: 'Maintenance & Safety',
    priceXCD: 30,
    priceUSD: 11.00,
    durationMinutes: 20,
    description: 'Special wire-wheel grinding and black liquid bead sealer to stop chronic slow leaks caused by salty Dominica ocean air and rim corrosion.',
    inclusions: [
      'Wire-brush cleaning of wheel rim flange & bead seat',
      'Anti-corrosion protective rim paint/primer',
      'Heavy vulcanized bead sealer compound'
    ],
    iconName: 'Sparkles',
    isPopular: false,
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
  phonePrimary: '+1 (767) 616-0155',
  phoneMobile: '+1 (767) 616-0155',
  whatsapp: '+17676160155',
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
