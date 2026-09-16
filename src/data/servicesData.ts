import { TyreService } from '../types';

export const TYRE_SERVICES: TyreService[] = [
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
  phonePrimary: '',
  phoneMobile: '',
  whatsapp: '',
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
