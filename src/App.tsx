import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { TireCatalog } from './components/TireCatalog';
import { TireDetailModal } from './components/TireDetailModal';
import { ServicesSection } from './components/ServicesSection';
import { RoadsideRescueSOS } from './components/RoadsideRescueSOS';
import { DominicaTyreGuide } from './components/DominicaTyreGuide';
import { LocationSection } from './components/LocationSection';
import { MyOrdersView } from './components/MyOrdersView';
import { CartDrawer } from './components/CartDrawer';
import { AdminOrdersModal, AdminOrder } from './components/AdminOrdersModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { DeviceSimulatorModal, DevicePlatform } from './components/DeviceSimulatorModal';
import { Footer } from './components/Footer';
import { TYRES_DATA } from './data/tyresData';
import { Tyre, CartItem, DominicaVehiclePreset, TyreCondition, BackgroundTheme } from './types';
import { 
  Phone, 
  MessageSquare, 
  AlertTriangle, 
  Wrench, 
  ShieldCheck, 
  MapPin, 
  Car, 
  RotateCcw
} from 'lucide-react';
import { SHOP_LOCATION_INFO } from './data/servicesData';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('inventory');
  const [servicesSubTab, setServicesSubTab] = useState<'services' | 'guide' | 'disposal'>('services');
  const [bgTheme, setBgTheme] = useState<BackgroundTheme>(() => {
    try {
      return (localStorage.getItem('max_executive_bg_theme') as BackgroundTheme) || 'tarmac';
    } catch {
      return 'tarmac';
    }
  });
  
  // Cart state persisted in localStorage
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('max_executive_cart') || localStorage.getItem('maranatha_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSOSOpen, setIsSOSOpen] = useState(false);

  const handleOpenSOS = () => {
    setIsSOSOpen(true);
    setActiveTab('location');
    setTimeout(() => {
      const el = document.getElementById('location-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 150);
  };
  const [isAdminOrdersOpen, setIsAdminOrdersOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isDeviceSimulatorOpen, setIsDeviceSimulatorOpen] = useState(false);
  const [deviceSimulatorPlatform, setDeviceSimulatorPlatform] = useState<DevicePlatform>('ios');

  const isInsideSimulator = useMemo(() => {
    try {
      return typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('sim') === '1';
    } catch {
      return false;
    }
  }, []);

  const handleOpenDeviceSimulator = (platform: DevicePlatform = 'ios') => {
    setDeviceSimulatorPlatform(platform);
    setIsDeviceSimulatorOpen(true);
  };
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem('max_executive_admin_logged_in') === 'true';
    } catch {
      return false;
    }
  });
  const [selectedTyreDetail, setSelectedTyreDetail] = useState<Tyre | null>(null);

  const DEFAULT_INITIAL_RESERVATIONS: AdminOrder[] = useMemo(() => [
    {
      id: 'ord-pichelin-01',
      reservationCode: 'MTC-849201',
      customerName: 'Marcus Fontaine',
      customerPhone: '+1 (767) 245-8912',
      customerEmail: 'mfontaine.dom@gmail.com',
      vehicleInfo: 'Toyota Hilux 4x4 (Double Cab)',
      preferredDate: 'Today (Fast-Lane Fitting)',
      items: [
        {
          id: 'cart-1',
          tyre: TYRES_DATA[0],
          quantity: 2,
          includeMounting: true,
          includeNewValves: true,
          includeShredding: true
        }
      ],
      totalXCD: (TYRES_DATA[0].priceXCD + 20 + 15 + 1) * 2,
      paymentMethod: 'Pay at Shop / WhatsApp',
      timestamp: 'Today, 8:45 AM',
      paymentStatus: 'Pending',
      dispatchStatus: 'Pending'
    },
    {
      id: 'ord-pichelin-02',
      reservationCode: 'MTC-913404',
      customerName: 'Kervin Charles',
      customerPhone: '+1 (767) 612-4432',
      customerEmail: 'kervin.c@dominica.dm',
      vehicleInfo: 'Nissan X-Trail T32',
      preferredDate: 'Today, 2:00 PM',
      items: [
        {
          id: 'cart-2',
          tyre: TYRES_DATA[1] || TYRES_DATA[0],
          quantity: 2,
          includeMounting: true,
          includeNewValves: true,
          includeShredding: false
        }
      ],
      totalXCD: ((TYRES_DATA[1] || TYRES_DATA[0]).priceXCD + 20 + 15) * 2,
      paymentMethod: 'Stripe Online',
      timestamp: 'Yesterday, 3:15 PM',
      paymentStatus: 'Confirmed',
      dispatchStatus: 'Ready for Fitting'
    },
    {
      id: 'ord-pichelin-03',
      reservationCode: 'MTC-724189',
      customerName: 'Althea St. Jean',
      customerPhone: '+1 (767) 316-9081',
      customerEmail: 'althea.stjean@gmail.com',
      vehicleInfo: 'Suzuki Swift (ZXI Hatchback)',
      preferredDate: 'Yesterday Morning',
      items: [
        {
          id: 'cart-3',
          tyre: TYRES_DATA[2] || TYRES_DATA[0],
          quantity: 4,
          includeMounting: true,
          includeNewValves: true,
          includeShredding: true
        }
      ],
      totalXCD: ((TYRES_DATA[2] || TYRES_DATA[0]).priceXCD + 20 + 15 + 1) * 4,
      paymentMethod: 'Stripe Online',
      timestamp: '2 days ago',
      paymentStatus: 'Confirmed',
      dispatchStatus: 'Completed'
    }
  ], []);

  const [adminOrders, setAdminOrders] = useState<AdminOrder[]>(() => {
    try {
      const saved = localStorage.getItem('max_executive_admin_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return [
        {
          id: 'ord-pichelin-01',
          reservationCode: 'MTC-849201',
          customerName: 'Marcus Fontaine',
          customerPhone: '+1 (767) 245-8912',
          customerEmail: 'mfontaine.dom@gmail.com',
          vehicleInfo: 'Toyota Hilux 4x4 (Double Cab)',
          preferredDate: 'Today (Fast-Lane Fitting)',
          items: [
            {
              id: 'cart-1',
              tyre: TYRES_DATA[0],
              quantity: 2,
              includeMounting: true,
              includeNewValves: true,
              includeShredding: true
            }
          ],
          totalXCD: (TYRES_DATA[0].priceXCD + 20 + 15 + 1) * 2,
          paymentMethod: 'Pay at Shop / WhatsApp',
          timestamp: 'Today, 8:45 AM',
          paymentStatus: 'Pending',
          dispatchStatus: 'Pending'
        },
        {
          id: 'ord-pichelin-02',
          reservationCode: 'MTC-913404',
          customerName: 'Kervin Charles',
          customerPhone: '+1 (767) 612-4432',
          customerEmail: 'kervin.c@dominica.dm',
          vehicleInfo: 'Nissan X-Trail T32',
          preferredDate: 'Today, 2:00 PM',
          items: [
            {
              id: 'cart-2',
              tyre: TYRES_DATA[1] || TYRES_DATA[0],
              quantity: 2,
              includeMounting: true,
              includeNewValves: true,
              includeShredding: false
            }
          ],
          totalXCD: ((TYRES_DATA[1] || TYRES_DATA[0]).priceXCD + 20 + 15) * 2,
          paymentMethod: 'Stripe Online',
          timestamp: 'Yesterday, 3:15 PM',
          paymentStatus: 'Confirmed',
          dispatchStatus: 'Ready for Fitting'
        },
        {
          id: 'ord-pichelin-03',
          reservationCode: 'MTC-724189',
          customerName: 'Althea St. Jean',
          customerPhone: '+1 (767) 316-9081',
          customerEmail: 'althea.stjean@gmail.com',
          vehicleInfo: 'Suzuki Swift (ZXI Hatchback)',
          preferredDate: 'Yesterday Morning',
          items: [
            {
              id: 'cart-3',
              tyre: TYRES_DATA[2] || TYRES_DATA[0],
              quantity: 4,
              includeMounting: true,
              includeNewValves: true,
              includeShredding: true
            }
          ],
          totalXCD: ((TYRES_DATA[2] || TYRES_DATA[0]).priceXCD + 20 + 15 + 1) * 4,
          paymentMethod: 'Stripe Online',
          timestamp: '2 days ago',
          paymentStatus: 'Confirmed',
          dispatchStatus: 'Completed'
        }
      ];
    } catch {
      return [];
    }
  });

  const [whatsappCustomMessage, setWhatsappCustomMessage] = useState<string>(() => {
    try {
      return localStorage.getItem('max_executive_whatsapp_msg') || 'Hello Max Executive Tires, I need tyres in Pichelin';
    } catch {
      return 'Hello Max Executive Tires, I need tyres in Pichelin';
    }
  });

  const [servicePrices, setServicePrices] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('max_executive_service_prices');
      return saved ? JSON.parse(saved) : {
        'srv-roadside': 80,
        'srv-shredder': 1,
        'mounting': 20,
        'valves': 15,
        'balancing': 15
      };
    } catch {
      return {
        'srv-roadside': 80,
        'srv-shredder': 1,
        'mounting': 20,
        'valves': 15,
        'balancing': 15
      };
    }
  });

  const [tyrePriceOverrides, setTyrePriceOverrides] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('max_executive_tyre_price_overrides');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [tyreStockOverrides, setTyreStockOverrides] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('max_executive_tyre_stock_overrides');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [customTyres, setCustomTyres] = useState<Tyre[]>(() => {
    try {
      const saved = localStorage.getItem('max_executive_custom_tyres');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('max_executive_tyre_price_overrides', JSON.stringify(tyrePriceOverrides));
    } catch {}
  }, [tyrePriceOverrides]);

  useEffect(() => {
    try {
      localStorage.setItem('max_executive_tyre_stock_overrides', JSON.stringify(tyreStockOverrides));
    } catch {}
  }, [tyreStockOverrides]);

  useEffect(() => {
    try {
      localStorage.setItem('max_executive_custom_tyres', JSON.stringify(customTyres));
    } catch {}
  }, [customTyres]);

  const handleUpdateSingleTyrePrice = (tyreId: string, newPriceXCD: number) => {
    setTyrePriceOverrides(prev => ({
      ...prev,
      [tyreId]: newPriceXCD
    }));
    logActivity('PRICE_UPDATE', `Updated price for tyre ${tyreId} to EC$ ${newPriceXCD}`);
  };

  const handleUpdateSingleTyreStock = (tyreId: string, newStock: number) => {
    setTyreStockOverrides(prev => ({
      ...prev,
      [tyreId]: newStock
    }));
    logActivity('STATUS_CHANGE', `Updated inventory stock for tyre ${tyreId} to ${newStock} units`);
  };

  const handleAddNewTyreToInventory = (newTyre: Tyre) => {
    setCustomTyres(prev => [newTyre, ...prev]);
    logActivity('OTHER', `Added new tyre SKU to inventory: ${newTyre.brand} ${newTyre.modelName} (${newTyre.size})`);
  };

  const handleBulkUpdateTyrePrices = (category: string, newPriceXCD: number, mode: 'set' | 'add' | 'subtract' = 'set') => {
    setTyrePriceOverrides(prev => {
      const next = { ...prev };
      TYRES_DATA.forEach(t => {
        if (category === 'ALL' || t.category === category) {
          const current = next[t.id] !== undefined ? next[t.id] : t.priceXCD;
          let updated = newPriceXCD;
          if (mode === 'add') updated = current + newPriceXCD;
          if (mode === 'subtract') updated = Math.max(10, current - newPriceXCD);
          next[t.id] = updated;
        }
      });
      return next;
    });
    logActivity('PRICE_UPDATE', `Bulk updated tyre prices for category "${category}" (${mode}): ${newPriceXCD} XCD`);
  };

  const tyresWithOverrides = useMemo(() => {
    const allTyres = [...customTyres, ...TYRES_DATA];
    return allTyres.map(t => {
      const priceOverride = tyrePriceOverrides[t.id];
      const stockOverride = tyreStockOverrides[t.id];
      return {
        ...t,
        priceXCD: priceOverride !== undefined ? priceOverride : t.priceXCD,
        stockCount: stockOverride !== undefined ? stockOverride : t.stockCount,
      };
    });
  }, [tyrePriceOverrides, tyreStockOverrides, customTyres]);

  const [adminActivityLog, setAdminActivityLog] = useState<Array<{
    id: string;
    timestamp: string;
    actionType: 'STATUS_CHANGE' | 'ORDER_DELETION' | 'BULK_ACTION' | 'PRICE_UPDATE' | 'OTHER';
    description: string;
    adminName: string;
  }>>(() => {
    try {
      const saved = localStorage.getItem('max_executive_admin_activity_log');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('max_executive_service_prices', JSON.stringify(servicePrices));
    } catch {}
  }, [servicePrices]);

  useEffect(() => {
    try {
      localStorage.setItem('max_executive_admin_activity_log', JSON.stringify(adminActivityLog));
    } catch {}
  }, [adminActivityLog]);

  const logActivity = (actionType: 'STATUS_CHANGE' | 'ORDER_DELETION' | 'BULK_ACTION' | 'PRICE_UPDATE' | 'OTHER', description: string) => {
    const newItem = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toLocaleString(),
      actionType,
      description,
      adminName: 'Executive Admin'
    };
    setAdminActivityLog(prev => [newItem, ...prev]);
  };

  const handleUpdateServicePrice = (serviceId: string, newPriceXCD: number) => {
    setServicePrices(prev => ({ ...prev, [serviceId]: newPriceXCD }));
    logActivity('PRICE_UPDATE', `Updated service rate for [${serviceId}] to EC$ ${newPriceXCD}`);
  };

  useEffect(() => {
    try {
      localStorage.setItem('max_executive_whatsapp_msg', whatsappCustomMessage);
    } catch (e) {
      console.warn('Could not save whatsapp message:', e);
    }
  }, [whatsappCustomMessage]);

  useEffect(() => {
    try {
      localStorage.setItem('max_executive_admin_orders', JSON.stringify(adminOrders));
    } catch (e) {
      console.warn('Could not save admin orders:', e);
    }
  }, [adminOrders]);

  const handleOpenAdmin = () => {
    if (isAdminLoggedIn) {
      setIsAdminOrdersOpen(true);
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  const handleSuccessLogin = () => {
    setIsAdminLoggedIn(true);
    try {
      localStorage.setItem('max_executive_admin_logged_in', 'true');
    } catch {}
    setIsAdminLoginOpen(false);
    setIsAdminOrdersOpen(true);
  };

  const handleLogoffAdmin = () => {
    setIsAdminLoggedIn(false);
    try {
      localStorage.removeItem('max_executive_admin_logged_in');
    } catch {}
    setIsAdminOrdersOpen(false);
  };

  const handleUpdateOrder = (orderId: string, updatedFields: Partial<AdminOrder>) => {
    setAdminOrders(prev => {
      const target = prev.find(o => o.id === orderId);
      if (target && updatedFields.dispatchStatus && updatedFields.dispatchStatus !== target.dispatchStatus) {
        logActivity('STATUS_CHANGE', `Updated order #${target.reservationCode} (${target.customerName}) status to "${updatedFields.dispatchStatus}"`);
      }
      return prev.map(o => o.id === orderId ? { ...o, ...updatedFields } : o);
    });
  };

  const handleDeleteOrder = (orderId: string) => {
    setAdminOrders(prev => {
      const target = prev.find(o => o.id === orderId);
      if (target) {
        logActivity('ORDER_DELETION', `Deleted order #${target.reservationCode} (${target.customerName})`);
      }
      return prev.filter(o => o.id !== orderId);
    });
  };

  const handleBulkUpdateOrders = (orderIds: string[], updatedFields: Partial<AdminOrder>) => {
    setAdminOrders(prev => prev.map(o => orderIds.includes(o.id) ? { ...o, ...updatedFields } : o));
    logActivity('BULK_ACTION', `Bulk updated ${orderIds.length} orders`);
  };

  const handleBulkDeleteOrders = (orderIds: string[]) => {
    setAdminOrders(prev => prev.filter(o => !orderIds.includes(o.id)));
    logActivity('ORDER_DELETION', `Bulk deleted ${orderIds.length} orders`);
  };

  const handleClearOrders = () => {
    setAdminOrders([]);
    logActivity('ORDER_DELETION', 'Cleared all customer orders');
  };

  const handleOrderSubmitted = (orderData: Omit<AdminOrder, 'id' | 'timestamp'>) => {
    const newOrder: AdminOrder = {
      ...orderData,
      id: 'ord-' + Date.now(),
      timestamp: new Date().toLocaleString(),
    };
    setAdminOrders((prev) => [newOrder, ...prev]);
  };

  // Filters
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedWidth, setSelectedWidth] = useState<string>('');
  const [selectedAspect, setSelectedAspect] = useState<string>('');
  const [selectedRim, setSelectedRim] = useState<string>('');
  const [selectedCondition, setSelectedCondition] = useState<TyreCondition | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('max_executive_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.warn('Could not save cart:', e);
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem('max_executive_bg_theme', bgTheme);
    } catch (e) {
      console.warn('Could not save bg theme:', e);
    }
  }, [bgTheme]);

  // Handle Preset selection
  const handleSelectVehiclePreset = (preset: DominicaVehiclePreset) => {
    if (activePresetId === preset.id) {
      setActivePresetId(null);
      setSelectedCategory('All Categories');
      setSelectedRim('');
      setSelectedWidth('');
      setSelectedAspect('');
    } else {
      setActivePresetId(preset.id);
      // Auto-populate filter from preset
      setSelectedCategory(preset.category);
      if (preset.typicalSizes.length > 0) {
        const firstSize = preset.typicalSizes[0]; // e.g. "265/65 R17"
        const parts = firstSize.match(/(\d+)\/(\d+)\s*R(\d+)/);
        if (parts) {
          setSelectedWidth(parts[1]);
          setSelectedAspect(parts[2]);
          setSelectedRim(parts[3]);
        }
      }
    }
  };

  const handleResetFilters = () => {
    setSelectedBrand('');
    setSelectedModel('');
    setSelectedWidth('');
    setSelectedAspect('');
    setSelectedRim('');
    setSelectedCondition('all');
    setSelectedCategory('All Categories');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('featured');
    setSearchQuery('');
    setActivePresetId(null);
  };

  // Filtered & Sorted Tyres
  const filteredTyres = useMemo(() => {
    const list = tyresWithOverrides.filter((tyre) => {
      // Brand filter
      if (selectedBrand && tyre.brand.toLowerCase() !== selectedBrand.toLowerCase()) {
        return false;
      }
      // Model filter
      if (selectedModel.trim() && !tyre.modelName.toLowerCase().includes(selectedModel.trim().toLowerCase())) {
        return false;
      }
      // Condition / Type filter (new / used)
      if (selectedCondition !== 'all' && tyre.condition !== selectedCondition) {
        return false;
      }
      // Width filter
      if (selectedWidth && tyre.width.toString() !== selectedWidth) {
        return false;
      }
      // Aspect ratio filter
      if (selectedAspect && tyre.aspectRatio.toString() !== selectedAspect) {
        return false;
      }
      // Rim diameter filter
      if (selectedRim && tyre.rimDiameter.toString() !== selectedRim) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'All Categories' && tyre.category !== selectedCategory) {
        return false;
      }
      // Max price filter
      if (maxPrice) {
        const limit = Number(maxPrice);
        if (tyre.priceXCD > limit) return false;
      }
      // Search keyword (matches brand, model, size, features, description)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesBrand = tyre.brand.toLowerCase().includes(q);
        const matchesModel = tyre.modelName.toLowerCase().includes(q);
        const matchesSize = tyre.size.toLowerCase().includes(q);
        const matchesDesc = tyre.shortDescription.toLowerCase().includes(q);
        const matchesCategory = tyre.category.toLowerCase().includes(q);
        if (!matchesBrand && !matchesModel && !matchesSize && !matchesDesc && !matchesCategory) {
          return false;
        }
      }
      return true;
    });

    // Sorting
    return [...list].sort((a, b) => {
      if (sortBy === 'price-asc') return a.priceXCD - b.priceXCD;
      if (sortBy === 'price-desc') return b.priceXCD - a.priceXCD;
      if (sortBy === 'brand-asc') return a.brand.localeCompare(b.brand);
      if (sortBy === 'grip-desc') return b.dominicaMountainRating - a.dominicaMountainRating;
      // Default: popular first, then special deals
      return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
    });
  }, [
    selectedBrand,
    selectedModel,
    selectedCondition,
    selectedWidth,
    selectedAspect,
    selectedRim,
    selectedCategory,
    maxPrice,
    sortBy,
    searchQuery,
    ]);

  // Cart operations
  const handleAddToCart = (tyre: Tyre) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.tyre.id === tyre.id);
      if (existing) {
        return prev.map((item) =>
          item.tyre.id === tyre.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: `item-${Date.now()}-${Math.random()}`,
          tyre,
          quantity: 2,
          includeMounting: true,
          includeNewValves: true,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const handleAddToCartWithServices = (
    tyre: Tyre,
    qty: number,
    includeMounting: boolean,
    includeValves: boolean,
    includeShredding: boolean
  ) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.tyre.id === tyre.id);
      if (existing) {
        return prev.map((item) =>
          item.tyre.id === tyre.id
            ? {
                ...item,
                quantity: item.quantity + qty,
                includeMounting,
                includeNewValves: includeValves,
                includeShredding,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          id: `item-${Date.now()}-${Math.random()}`,
          tyre,
          quantity: qty,
          includeMounting,
          includeNewValves: includeValves,
          includeShredding,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleToggleService = (
    itemId: string,
    serviceKey: 'mounting' | 'valves' | 'shredding'
  ) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          if (serviceKey === 'mounting') return { ...item, includeMounting: !item.includeMounting };
          if (serviceKey === 'valves') return { ...item, includeNewValves: !item.includeNewValves };
          if (serviceKey === 'shredding') return { ...item, includeShredding: !item.includeShredding };
        }
        return item;
      })
    );
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const totalCartCount = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 selection:bg-[#0984E3] selection:text-white ${
      bgTheme === 'carbon' 
        ? 'bg-theme-carbon text-slate-100' 
        : bgTheme === 'light' 
          ? 'bg-theme-light text-slate-900' 
          : 'bg-theme-tarmac text-slate-100'
    }`}>
      
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        
        bgTheme={bgTheme}
        setBgTheme={setBgTheme}
        cartCount={totalCartCount}
        openCart={() => setIsCartOpen(true)}
        openSOS={handleOpenSOS}
        adminOrdersCount={adminOrders.length}
        openAdminOrders={handleOpenAdmin}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        
        {/* Hero Section */}
        <Hero
          onSearchClick={() => {
            setActiveTab('inventory');
            window.scrollTo({ top: 400, behavior: 'smooth' });
          }}
          onBookServiceClick={() => {
            setActiveTab('services');
            const el = document.getElementById('services-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          onSOSClick={handleOpenSOS}
        />



        {/* Tab-driven Content Container */}
        <div 
          style={{ 
            height: '494.5px', 
            width: '920px', 
            marginTop: '-26px', 
            marginBottom: '-12px',
            paddingTop: '5px',
            paddingBottom: '0px',
            paddingLeft: '26px'
          }} 
          className="mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 overflow-y-auto"
        >
          
          {/* TAB 1: Inventory & Sales */}
          {activeTab === 'inventory' && (
            <div 
              style={{
                fontSize: '15px',
                marginTop: '-14px',
                marginBottom: '0px',
                marginLeft: '-8px',
                marginRight: '-6px'
              }} 
              className="space-y-8 animate-fade-in"
            >


              <TireCatalog
                tyres={filteredTyres}
                
                onSelectTyre={(tyre) => setSelectedTyreDetail(tyre)}
                onAddToCart={handleAddToCart}
              />
            </div>
          )}

          {/* TAB: Workshop Services, Print Menu, Safety Guide & Eco Tyre Disposal */}
          {activeTab === 'services' && (
            <div className="animate-fade-in space-y-12">
              <ServicesSection
                onOpenSOS={handleOpenSOS}
                servicePrices={servicePrices}
                tyres={tyresWithOverrides}
                initialTab={servicesSubTab}
              />
            </div>
          )}

          {/* TAB 2: Location & Workshop Schedule */}
          {activeTab === 'location' && (
            <div 
              style={{
                fontSize: '11px',
                marginTop: '-15px',
                marginBottom: '13px'
              }} 
              className="animate-fade-in space-y-12"
            >
              <LocationSection 
                onNavigateToServices={(subTab) => {
                  if (subTab) setServicesSubTab(subTab);
                  setActiveTab('services');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          )}

          {/* TAB 3: My Orders & Receipts */}
          {activeTab === 'orders' && (
            <div className="animate-fade-in space-y-6">
              <MyOrdersView
                orders={adminOrders}
                servicePrices={servicePrices}
                compact={false}
                onBrowseInventory={() => setActiveTab('inventory')}
                onUpdateOrderStatus={(orderId, status) => {
                  handleUpdateOrder(orderId, { dispatchStatus: status });
                }}
              />
            </div>
          )}

          {/* Emergency SOS Modal if open */}
          {isSOSOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
              <div className="max-w-3xl w-full my-8">
                <RoadsideRescueSOS onClose={() => setIsSOSOpen(false)} />
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Floating Desktop & Tablet Assistance Widget */}
      <aside aria-label="Quick Assistance and Emergency Contacts" className="hidden md:flex fixed bottom-6 right-6 z-30 flex-col items-end gap-2.5">
        <button
          onClick={handleOpenSOS}
          className="group inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-full shadow-lg shadow-red-600/30 transition transform hover:scale-105"
          title="Emergency Roadside Puncture Rescue"
        >
          <AlertTriangle className="w-4 h-4 animate-bounce" />
          <span>Roadside SOS</span>
        </button>

        <a
          href={`https://wa.me/${SHOP_LOCATION_INFO.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappCustomMessage)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-full shadow-lg shadow-emerald-600/30 transition transform hover:scale-105"
        >
          <MessageSquare className="w-4 h-4" />
          <span>WhatsApp Shop</span>
        </a>
      </aside>

      {/* Floating Bottom Quick Action for Mobile */}
      <div 
        className="md:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-30 flex gap-2 justify-center items-center px-2 max-w-[calc(100vw-24px)]"
        style={{ width: '500px', minHeight: '31px' }}
      >
        <button
          onClick={handleOpenSOS}
          className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-2 rounded-lg shadow-md flex items-center justify-center gap-1.5 h-full py-1.5"
          style={{ width: '199.5px' }}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>SOS Roadside</span>
        </button>

        <a
          href={`https://wa.me/${SHOP_LOCATION_INFO.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappCustomMessage)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-2 rounded-lg shadow-md flex items-center justify-center gap-1.5 h-full py-1.5"
          style={{ width: '200.5px' }}
        >
          <MessageSquare className="w-4 h-4" />
          <span>WhatsApp Shop</span>
        </a>
      </div>

      {/* Detail Modal */}
      {selectedTyreDetail && (
        <TireDetailModal
          tyre={selectedTyreDetail}
          
          onClose={() => setSelectedTyreDetail(null)}
          servicePrices={servicePrices}
          onAddToCartWithServices={handleAddToCartWithServices}
        />
      )}

      {/* Reservation Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        orders={adminOrders}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onToggleService={handleToggleService}
        onClearCart={handleClearCart}
        servicePrices={servicePrices}
        onOrderSubmitted={handleOrderSubmitted}
        onUpdateOrderStatus={(orderId, status) => {
          handleUpdateOrder(orderId, { dispatchStatus: status });
        }}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccessLogin={handleSuccessLogin}
      />

      {/* Admin Orders Modal */}
      <AdminOrdersModal
        isOpen={isAdminOrdersOpen}
        onClose={() => setIsAdminOrdersOpen(false)}
        orders={adminOrders}
        onClearOrders={handleClearOrders}
        onLogoff={handleLogoffAdmin}
        onUpdateOrder={handleUpdateOrder}
        onDeleteOrder={handleDeleteOrder}
        onBulkUpdateOrders={handleBulkUpdateOrders}
        onBulkDeleteOrders={handleBulkDeleteOrders}
        whatsappCustomMessage={whatsappCustomMessage}
        onUpdateWhatsAppMessage={setWhatsappCustomMessage}
        servicePrices={servicePrices}
        onUpdateServicePrice={handleUpdateServicePrice}
        adminActivityLog={adminActivityLog}
        onClearActivityLog={() => {
          setAdminActivityLog([]);
          logActivity('OTHER', 'Cleared admin activity log');
        }}
        onBulkUpdateTyrePrices={handleBulkUpdateTyrePrices}
        onAddOrder={handleOrderSubmitted}
        tyres={tyresWithOverrides}
        onOpenDeviceSimulator={handleOpenDeviceSimulator}
        onUpdateTyrePrice={handleUpdateSingleTyrePrice}
        onUpdateTyreStock={handleUpdateSingleTyreStock}
        onAddNewTyre={handleAddNewTyreToInventory}
      />

      {/* iOS & Android Device Simulator Modal (Available via Admin Portal) */}
      <DeviceSimulatorModal
        isOpen={isDeviceSimulatorOpen}
        onClose={() => setIsDeviceSimulatorOpen(false)}
        initialPlatform={deviceSimulatorPlatform}
      />

      {/* Need Help? Floating Bubble for Technical Tyre Advice */}
      <div 
        style={{
          marginTop: '-14px',
          marginBottom: '-15px',
          marginLeft: '-1px',
          paddingTop: '0px',
          width: '865px',
          height: '71px'
        }}
        className="relative z-40"
      >
        <a
          href={`https://wa.me/${SHOP_LOCATION_INFO.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hello Max Executive Tires! I need technical tyre advice and expert fitment recommendations for my vehicle in Dominica.')}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginTop: '-12px' }}
          className="fixed bottom-6 right-6 z-40 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full px-4 py-3 shadow-2xl flex items-center gap-2.5 transition transform hover:scale-105 group border-2 border-white/25"
          title="Need Help? Chat on WhatsApp for Technical Tyre Advice"
        >
          <MessageSquare className="w-5 h-5 animate-bounce text-emerald-100" />
          <span className="font-extrabold text-xs tracking-tight">Need Help? Tyre Advice</span>
        </a>
      </div>

      {/* Footer */}
      <div 
        style={{ 
          marginTop: '-13px', 
          paddingTop: '0px', 
          marginBottom: '16px', 
          height: '83px' 
        }}
      >
        <Footer
          setActiveTab={setActiveTab}
          onOpenSOS={handleOpenSOS}
        />
      </div>

    </div>
  );
}
