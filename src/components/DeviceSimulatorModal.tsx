import React, { useState, useEffect, useRef } from 'react';
import { 
  Smartphone, 
  Tablet, 
  RotateCw, 
  RefreshCw, 
  ExternalLink, 
  X, 
  Check, 
  Apple, 
  Bot, 
  Wifi, 
  Battery, 
  Signal, 
  ShieldCheck, 
  ChevronDown, 
  Maximize2, 
  Minimize2, 
  Share2, 
  Download,
  Info,
  Layers,
  Globe
} from 'lucide-react';

export type DevicePlatform = 'ios' | 'android';
export type DeviceOrientation = 'portrait' | 'landscape';

export interface DeviceSpec {
  id: string;
  name: string;
  platform: DevicePlatform;
  width: number;
  height: number;
  borderRadius: number;
  bezelWidth: number;
  hasDynamicIsland?: boolean;
  hasPunchHole?: boolean;
  hasHomeIndicator?: boolean;
  hasAndroidNav?: boolean;
  badge: string;
  osVersion: string;
}

export const DEVICE_CATALOG: DeviceSpec[] = [
  // iOS Devices
  {
    id: 'iphone-16-pro',
    name: 'iPhone 16 Pro',
    platform: 'ios',
    width: 393,
    height: 852,
    borderRadius: 48,
    bezelWidth: 10,
    hasDynamicIsland: true,
    hasHomeIndicator: true,
    badge: 'Flagship iOS',
    osVersion: 'iOS 18'
  },
  {
    id: 'iphone-15-pro-max',
    name: 'iPhone 15 Pro Max',
    platform: 'ios',
    width: 430,
    height: 932,
    borderRadius: 50,
    bezelWidth: 10,
    hasDynamicIsland: true,
    hasHomeIndicator: true,
    badge: 'Max iOS',
    osVersion: 'iOS 17'
  },
  {
    id: 'iphone-se',
    name: 'iPhone SE (3rd Gen)',
    platform: 'ios',
    width: 375,
    height: 667,
    borderRadius: 32,
    bezelWidth: 12,
    hasHomeIndicator: false,
    badge: 'Compact iOS',
    osVersion: 'iOS 17'
  },
  {
    id: 'ipad-mini',
    name: 'iPad Mini',
    platform: 'ios',
    width: 768,
    height: 1024,
    borderRadius: 36,
    bezelWidth: 16,
    hasHomeIndicator: true,
    badge: 'iPadOS',
    osVersion: 'iPadOS 17'
  },

  // Android Devices
  {
    id: 'pixel-8-pro',
    name: 'Google Pixel 8 Pro',
    platform: 'android',
    width: 412,
    height: 915,
    borderRadius: 40,
    bezelWidth: 9,
    hasPunchHole: true,
    hasAndroidNav: true,
    badge: 'Google Pixel',
    osVersion: 'Android 14'
  },
  {
    id: 'galaxy-s24-ultra',
    name: 'Samsung Galaxy S24 Ultra',
    platform: 'android',
    width: 412,
    height: 920,
    borderRadius: 24,
    bezelWidth: 8,
    hasPunchHole: true,
    hasAndroidNav: true,
    badge: 'Samsung One UI',
    osVersion: 'Android 14'
  },
  {
    id: 'galaxy-a54',
    name: 'Samsung Galaxy A54 5G',
    platform: 'android',
    width: 360,
    height: 800,
    borderRadius: 36,
    bezelWidth: 12,
    hasPunchHole: true,
    hasAndroidNav: true,
    badge: 'Dominica Popular',
    osVersion: 'Android 13'
  },
  {
    id: 'android-tablet',
    name: 'Samsung Galaxy Tab S9',
    platform: 'android',
    width: 800,
    height: 1200,
    borderRadius: 32,
    bezelWidth: 14,
    hasPunchHole: true,
    hasAndroidNav: true,
    badge: 'Android Tablet',
    osVersion: 'Android 14'
  }
];

interface DeviceSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlatform?: DevicePlatform;
}

export const DeviceSimulatorModal: React.FC<DeviceSimulatorModalProps> = ({
  isOpen,
  onClose,
  initialPlatform = 'ios'
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<DevicePlatform>(initialPlatform);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('iphone-16-pro');
  const [orientation, setOrientation] = useState<DeviceOrientation>('portrait');
  const [showDeviceFrame, setShowDeviceFrame] = useState(true);
  const [browserMode, setBrowserMode] = useState<'app' | 'browser'>('app');
  const [customScale, setCustomScale] = useState<number>(0.85);
  const [isScaleMenuOpen, setIsScaleMenuOpen] = useState(false);
  const [showPwaInstallGuide, setShowPwaInstallGuide] = useState(false);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<string>('9:41');

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Sync platform changes with default device
  useEffect(() => {
    if (selectedPlatform === 'ios') {
      setSelectedDeviceId('iphone-16-pro');
      setCurrentTime('9:41');
    } else {
      setSelectedDeviceId('pixel-8-pro');
      setCurrentTime('10:00');
    }
  }, [selectedPlatform]);

  // Current selected device
  const currentDevice = DEVICE_CATALOG.find((d) => d.id === selectedDeviceId) || DEVICE_CATALOG[0];

  // Calculate actual dimensions based on orientation
  const isLandscape = orientation === 'landscape';
  const screenWidth = isLandscape ? currentDevice.height : currentDevice.width;
  const screenHeight = isLandscape ? currentDevice.width : currentDevice.height;

  // Handle reload
  const handleReload = () => {
    setIframeKey((prev) => prev + 1);
  };

  // Keyboard shortcut: ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Source url for preview with mobile_sim parameter
  const previewUrl = `${window.location.origin}${window.location.pathname}?sim=1&platform=${selectedPlatform}`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white font-sans select-none overflow-hidden animate-fadeIn">
      {/* Top Simulator Control Bar */}
      <header className="h-14 sm:h-16 bg-slate-900 border-b border-slate-800 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 shrink-0 shadow-lg">
        {/* Left: Branding & Platform Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 rounded-lg border border-slate-700 text-xs font-bold text-slate-200">
            <Smartphone className="w-4 h-4 text-[#0984E3]" />
            <span className="hidden sm:inline">Device View</span>
          </div>

          {/* Platform Switcher Buttons: iOS vs Android */}
          <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setSelectedPlatform('ios')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
                selectedPlatform === 'ios'
                  ? 'bg-slate-800 text-white shadow-xs border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Switch to Apple iOS Devices"
            >
              <Apple className="w-3.5 h-3.5 text-blue-400" />
              <span>iOS (Apple)</span>
            </button>

            <button
              onClick={() => setSelectedPlatform('android')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
                selectedPlatform === 'android'
                  ? 'bg-emerald-950/80 text-emerald-300 shadow-xs border border-emerald-700/50'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Switch to Google / Samsung Android Devices"
            >
              <Bot className="w-3.5 h-3.5 text-emerald-400" />
              <span>Android</span>
            </button>
          </div>
        </div>

        {/* Center: Device Model Picker & Quick Settings */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Device Model Dropdown */}
          <div className="relative">
            <select
              value={selectedDeviceId}
              onChange={(e) => {
                const dev = DEVICE_CATALOG.find((d) => d.id === e.target.value);
                if (dev) {
                  setSelectedDeviceId(dev.id);
                  setSelectedPlatform(dev.platform);
                }
              }}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-white focus:ring-2 focus:ring-[#0984E3] focus:outline-none cursor-pointer appearance-none pr-7 max-w-[140px] sm:max-w-[200px] truncate"
            >
              <optgroup label="Apple iOS Devices">
                {DEVICE_CATALOG.filter((d) => d.platform === 'ios').map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.width}×{d.height})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Android Devices">
                {DEVICE_CATALOG.filter((d) => d.platform === 'android').map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.width}×{d.height})
                  </option>
                ))}
              </optgroup>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Orientation Toggle */}
          <button
            onClick={() => setOrientation(isLandscape ? 'portrait' : 'landscape')}
            className={`p-2 rounded-lg border text-xs font-bold transition flex items-center gap-1 ${
              isLandscape 
                ? 'bg-amber-950/60 border-amber-600 text-amber-300' 
                : 'bg-slate-950 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title={isLandscape ? "Switch to Portrait Mode" : "Switch to Landscape Mode"}
          >
            <RotateCw className={`w-4 h-4 ${isLandscape ? 'text-amber-400' : ''}`} />
            <span className="hidden md:inline">{isLandscape ? 'Landscape' : 'Portrait'}</span>
          </button>

          {/* Scale / Zoom Control */}
          <div className="relative hidden lg:block">
            <button
              onClick={() => setIsScaleMenuOpen(!isScaleMenuOpen)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5"
              title="Change zoom scale"
            >
              <span>{Math.round(customScale * 100)}%</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isScaleMenuOpen && (
              <div className="absolute top-full mt-1.5 right-0 w-28 bg-slate-900 border border-slate-700 rounded-xl shadow-xl py-1 z-50 text-xs">
                {[0.65, 0.75, 0.85, 0.9, 1.0].map((scale) => (
                  <button
                    key={scale}
                    onClick={() => {
                      setCustomScale(scale);
                      setIsScaleMenuOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-slate-800 ${
                      customScale === scale ? 'text-[#0984E3] font-bold' : 'text-slate-300'
                    }`}
                  >
                    <span>{Math.round(scale * 100)}%</span>
                    {customScale === scale && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mode Switch: PWA App vs Mobile Safari/Chrome */}
          <button
            onClick={() => setBrowserMode(browserMode === 'app' ? 'browser' : 'app')}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition ${
              browserMode === 'app'
                ? 'bg-blue-950/70 border-blue-600/70 text-blue-300'
                : 'bg-slate-950 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Toggle between PWA Standalone App and Browser Mode"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{browserMode === 'app' ? 'Native PWA App' : 'Browser View'}</span>
          </button>

          {/* Reload Iframe */}
          <button
            onClick={handleReload}
            className="p-2 rounded-lg border border-slate-700 bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800 transition"
            title="Reload preview screen"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Real Phone Instructions & Close */}
        <div className="flex items-center gap-2">
          {/* Real Phone Install Instructions button */}
          <button
            onClick={() => setShowPwaInstallGuide(true)}
            className="hidden sm:inline-flex items-center gap-1.5 bg-[#0984E3] hover:bg-[#0873c4] text-white text-xs font-extrabold px-3 py-1.5 rounded-lg shadow-sm transition"
            title="View instructions to install Max Executive Tires on your real iPhone or Android phone"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install on Real Phone</span>
          </button>

          {/* Close Device View */}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-red-600 text-slate-200 hover:text-white text-xs font-extrabold px-3 py-1.5 rounded-lg border border-slate-700 transition"
            title="Exit Device View and return to Full Web View"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Exit Device View</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Stage */}
      <main className="flex-1 overflow-auto bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 sm:p-8 relative">
        {/* Subtle decorative grid */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#38bdf8 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />

        {/* Device Information Pill */}
        <div className="absolute top-3 left-4 hidden md:flex items-center gap-2 px-3 py-1 bg-slate-900/90 border border-slate-800 rounded-full text-[11px] text-slate-400 backdrop-blur-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-white">{currentDevice.name}</span>
          <span className="text-slate-500">•</span>
          <span>{screenWidth} × {screenHeight} px</span>
          <span className="text-slate-500">•</span>
          <span className="text-blue-400 font-mono">{currentDevice.osVersion}</span>
        </div>

        {/* Scaled Device Container */}
        <div
          className="relative transition-transform duration-200 origin-center my-auto flex flex-col items-center justify-center"
          style={{
            transform: `scale(${customScale})`,
          }}
        >
          {/* External Hardware Device Bezel Frame */}
          <div
            className={`relative transition-all duration-300 shadow-2xl flex flex-col ${
              selectedPlatform === 'ios'
                ? 'bg-[#1C1C1E] border-[8px] border-[#2C2C2E] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(14,165,233,0.15)] ring-1 ring-white/20'
                : 'bg-[#121212] border-[8px] border-[#282828] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(16,185,129,0.15)] ring-1 ring-white/15'
            }`}
            style={{
              width: `${screenWidth + (showDeviceFrame ? currentDevice.bezelWidth * 2 : 0)}px`,
              height: `${screenHeight + (showDeviceFrame ? currentDevice.bezelWidth * 2 : 0)}px`,
              borderRadius: showDeviceFrame ? `${currentDevice.borderRadius}px` : '12px',
              padding: showDeviceFrame ? `${currentDevice.bezelWidth}px` : '0px'
            }}
          >
            {/* Side Hardware Buttons Simulation (Buttons on the edge) */}
            {showDeviceFrame && !isLandscape && (
              <>
                {/* Left side: Volume up, down, mute/action */}
                <div className="absolute -left-[11px] top-24 w-[3px] h-9 bg-slate-700 rounded-l" />
                <div className="absolute -left-[11px] top-36 w-[3px] h-12 bg-slate-700 rounded-l" />
                <div className="absolute -left-[11px] top-52 w-[3px] h-12 bg-slate-700 rounded-l" />
                {/* Right side: Power / Lock button */}
                <div className="absolute -right-[11px] top-32 w-[3px] h-16 bg-slate-700 rounded-r" />
              </>
            )}

            {/* Inner Screen Display (Where the Store Renders) */}
            <div
              className="relative w-full h-full bg-slate-950 flex flex-col overflow-hidden text-white"
              style={{
                borderRadius: showDeviceFrame ? `${Math.max(currentDevice.borderRadius - currentDevice.bezelWidth, 8)}px` : '8px'
              }}
            >
              {/* TOP STATUS BAR: iOS vs Android */}
              <div 
                className={`w-full h-11 shrink-0 px-6 flex items-center justify-between z-30 select-none ${
                  selectedPlatform === 'ios' ? 'bg-slate-950/95 text-white' : 'bg-slate-950 text-slate-200'
                }`}
              >
                {/* Left Side: Time */}
                <div className="text-xs font-semibold tracking-tight w-14">
                  {currentTime}
                </div>

                {/* Center: Dynamic Island (iOS) or Punch-hole Camera (Android) */}
                <div className="flex-1 flex justify-center items-center">
                  {selectedPlatform === 'ios' && currentDevice.hasDynamicIsland && !isLandscape && (
                    <div className="w-28 h-7 bg-black rounded-full flex items-center justify-between px-3 border border-white/5 shadow-inner">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#0a0a0a] ring-1 ring-blue-900/50 flex items-center justify-center">
                        <div className="w-1 h-1 rounded-full bg-blue-500/80" />
                      </div>
                      <div className="w-2.5 h-2.5 rounded-full bg-[#111] ring-1 ring-white/10" />
                    </div>
                  )}

                  {selectedPlatform === 'android' && currentDevice.hasPunchHole && !isLandscape && (
                    <div className="w-3.5 h-3.5 rounded-full bg-black ring-1 ring-white/20 shadow-inner flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-emerald-500/70" />
                    </div>
                  )}
                </div>

                {/* Right Side: Network & Battery Indicators */}
                <div className="flex items-center gap-1.5 w-14 justify-end text-[10px] text-slate-300">
                  <Signal className="w-3 h-3 text-slate-200" />
                  <span className="font-bold text-[9px]">5G</span>
                  <Wifi className="w-3 h-3 text-slate-200" />
                  <Battery className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              </div>

              {/* BROWSER BAR (When Browser View is active) */}
              {browserMode === 'browser' && (
                <div className="w-full bg-slate-900 border-b border-slate-800 px-3 py-1.5 flex items-center gap-2 text-xs shrink-0 z-20">
                  <div className="flex-1 bg-slate-950 rounded-lg px-2.5 py-1 flex items-center justify-between border border-slate-800 text-[11px] text-slate-300">
                    <div className="flex items-center gap-1.5 truncate">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span className="font-medium text-white truncate">maxexecutivetires.dm</span>
                    </div>
                    <RefreshCw 
                      onClick={handleReload}
                      className="w-3 h-3 text-slate-400 hover:text-white cursor-pointer ml-1" 
                    />
                  </div>
                </div>
              )}

              {/* Actual Web Application IFRAME */}
              <div className="flex-1 w-full relative bg-slate-950 overflow-hidden">
                <iframe
                  key={iframeKey}
                  ref={iframeRef}
                  src={previewUrl}
                  title={`${currentDevice.name} Live View`}
                  className="w-full h-full border-0 bg-slate-950"
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'block'
                  }}
                />
              </div>

              {/* BOTTOM NAVIGATION BAR: iOS Home Indicator vs Android Gestures */}
              <div 
                className={`w-full h-6 shrink-0 flex items-center justify-center select-none z-30 ${
                  selectedPlatform === 'ios' ? 'bg-slate-950' : 'bg-slate-950'
                }`}
              >
                {selectedPlatform === 'ios' && currentDevice.hasHomeIndicator && (
                  <div className="w-32 h-1 bg-white/70 rounded-full hover:bg-white transition" />
                )}

                {selectedPlatform === 'android' && currentDevice.hasAndroidNav && (
                  <div className="w-24 h-1 bg-white/60 rounded-full" />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* PWA / Real Phone Installation Modal */}
      {showPwaInstallGuide && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-5 text-white shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-950 text-blue-400 border border-blue-800">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">View & Install on Real Devices</h3>
                  <p className="text-xs text-slate-400">Add Max Executive Tires to your home screen</p>
                </div>
              </div>
              <button
                onClick={() => setShowPwaInstallGuide(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Platform instructions tab */}
            <div className="space-y-4 text-xs">
              {/* iOS Safari Instructions */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                  <Apple className="w-4 h-4" />
                  <span>iPhone / iPad (Apple Safari)</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                  <li>Open Safari on your iPhone and visit the store URL.</li>
                  <li>Tap the <strong>Share</strong> button (box with upward arrow) at the bottom toolbar.</li>
                  <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                  <li>Confirm by tapping <strong>Add</strong> in the top-right corner. Max Executive Tires will launch in full-screen standalone mode like a native iOS app!</li>
                </ol>
              </div>

              {/* Android Chrome Instructions */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Bot className="w-4 h-4" />
                  <span>Android (Google Chrome / Samsung Internet)</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                  <li>Open Google Chrome or Samsung Internet on your phone.</li>
                  <li>Tap the <strong>three dots (⋮)</strong> menu in the upper-right corner.</li>
                  <li>Select <strong>Install App</strong> or <strong>Add to Home screen</strong>.</li>
                  <li>Tap <strong>Install</strong> to add the Max Executive Tires icon directly to your app drawer and home screen.</li>
                </ol>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowPwaInstallGuide(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
