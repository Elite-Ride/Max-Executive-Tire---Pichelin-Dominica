export type TyreCondition = 'new' | 'used';
export type Currency = 'XCD' | 'USD';
export type BackgroundTheme = 'tarmac' | 'carbon' | 'light';

export type TyreCategory = 
  | 'Passenger & Hatchback'
  | 'SUV, Crossover & 4x4'
  | 'All-Terrain (A/T)'
  | 'Mud-Terrain (M/T)'
  | 'Commercial Van & Minibus'
  | 'Heavy Duty Pickup & Truck';

export type UsedTreadGrade = 
  | 'Grade A+ (90%+ Tread - Like New)'
  | 'Grade A (80-85% Tread - Premium Used)'
  | 'Grade B+ (70-75% Tread - Budget Value)';

export interface Tyre {
  id: string;
  brand: string;
  modelName: string;
  size: string; // e.g. "205/55 R16"
  width: number; // e.g. 205
  aspectRatio: number; // e.g. 55
  rimDiameter: number; // e.g. 16
  condition: TyreCondition;
  usedGrade?: UsedTreadGrade;
  treadDepthMm: number; // Current tread depth
  originalTreadMm: number;
  category: TyreCategory;
  priceXCD: number; // Eastern Caribbean Dollars (EC$)
  priceUSD: number;
  stockCount: number;
  image: string;
  features: string[];
  warranty: string;
  speedRating: string; // e.g. "H (210 km/h)"
  loadIndex: string; // e.g. "91 (615 kg)"
  plyRating?: string; // e.g. "4-Ply", "6-Ply XL", "8-Ply Commercial"
  wetGripRating: 'A' | 'B' | 'C';
  potholeResistance: 'Reinforced Extra Load (XL)' | 'Heavy Duty 6/8-Ply' | 'Armored Sidewall' | 'Standard Highway';
  dominicaMountainRating: 1 | 2 | 3 | 4 | 5; // 5 = Maximum grip on Pichelin hills & wet asphalt
  isPopular?: boolean;
  isSpecialDeal?: boolean;
  shortDescription: string;
  inspectionPassed: boolean; // Checked for punctures, sidewall bulges, even wear
}

export interface TyreService {
  id: string;
  name: string;
  category: 'Fitting & Mounting' | 'Alignment & Safety' | 'Puncture & Repair' | 'Maintenance & Safety' | 'Emergency Rescue' | 'Environmental Sustainability';
  priceXCD: number;
  priceUSD: number;
  durationMinutes: number;
  description: string;
  inclusions: string[];
  iconName: string;
  isPopular?: boolean;
  badge?: string;
}

export interface CartItem {
  id: string;
  tyre: Tyre;
  quantity: number;
  includeMounting: boolean;
  includeNewValves: boolean;
  includeShredding: boolean;
}

export interface ServiceBooking {
  id?: string;
  serviceIds: string[];
  selectedTyreIds?: string[];
  vehicleMake: string;
  vehicleModel: string;
  vehiclePlate: string;
  preferredDate: string;
  preferredTime: string;
  customerName: string;
  customerPhone: string;
  customerLocation: string;
  notes?: string;
  totalXCD: number;
  totalUSD: number;
}

export interface RoadsideRescueRequest {
  landmarkLocation: string;
  customLocationDetails?: string;
  issueType: 'Flat Tyre / Puncture' | 'Blowout' | 'Need Spare Wheel Mounted' | 'Need New/Used Tyre Brought to Scene' | 'Stuck on Incline';
  vehicleType: string;
  tyreSizeNeeded?: string;
  driverName: string;
  driverPhone: string;
  urgency: 'Emergency (Immediate)' | 'Standard (Within 30 mins)';
}

export interface DominicaVehiclePreset {
  id: string;
  name: string;
  popularModels?: string;
  typicalSizes?: string[];
  category: TyreCategory;
  terrainAdvice?: string;
  description?: string;
  photo?: string;
}

export const EXCHANGE_RATE_USD_TO_XCD = 2.70;
