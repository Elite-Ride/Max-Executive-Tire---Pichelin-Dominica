import React, { useState } from 'react';
import { 
  AlertTriangle, 
  PhoneCall, 
  MapPin, 
  Navigation, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  X, 
  ShieldAlert, 
  Wrench,
  Car
} from 'lucide-react';
import { SHOP_LOCATION_INFO } from '../data/servicesData';

interface RoadsideRescueSOSProps {
  onClose?: () => void;
}

export const RoadsideRescueSOS: React.FC<RoadsideRescueSOSProps> = ({ onClose }) => {
  const [selectedLocation, setSelectedLocation] = useState('Pichelin (Maranatha Square / Main Hill)');
  const [customLocation, setCustomLocation] = useState('');
  const [vehicleType, setVehicleType] = useState('Toyota Hilux / SUV');
  const [tyreSizeNeeded, setTyreSizeNeeded] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [issueType, setIssueType] = useState<'Flat Tyre / Puncture' | 'Blowout' | 'Need Spare Wheel Mounted' | 'Need New/Used Tyre Brought to Scene'>('Flat Tyre / Puncture');
  const [gpsCoordinates, setGpsCoordinates] = useState<string | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [dispatchSent, setDispatchSent] = useState(false);

  const dominicaLocations = [
    'Pichelin (Maranatha Square / Main Hill)',
    'Grand Bay (Berricoa / Geneva / Main Road)',
    'Bellevue Chopin (Roseau-South Highway)',
    'Soufrière / Gallion Hill',
    'Scotts Head / Soufriere Road',
    'Bagatelle / Fond St. Jean Route',
    'Loubiere / Castle Comfort Valley Route',
    'Other / Rural South Dominica Road'
  ];

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`;
        setGpsCoordinates(coords);
        setGettingLocation(false);
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setGettingLocation(false);
        alert('Could not fetch exact GPS. Please select your nearest landmark from the list below.');
      },
      { timeout: 10000 }
    );
  };

  const constructWhatsAppSOSUrl = () => {
    const locText = gpsCoordinates 
      ? `${selectedLocation} (GPS: ${gpsCoordinates}) - ${customLocation}` 
      : `${selectedLocation} - ${customLocation}`;
    
    const message = `🚨 *EMERGENCY TYRE ROADSIDE RESCUE REQUEST* 🚨\n\n` +
      `📍 *Location:* ${locText}\n` +
      `🚗 *Vehicle:* ${vehicleType}\n` +
      `⚠️ *Issue:* ${issueType}\n` +
      `🔘 *Tyre Size (if known):* ${tyreSizeNeeded || 'Unknown / Need tech to inspect'}\n` +
      `👤 *Driver:* ${driverName || 'Dominica Driver'}\n` +
      `📞 *Phone:* ${driverPhone || 'On-scene'}\n\n` +
      `*Please dispatch mobile rescue van from Maranatha Square, Pichelin immediately!*`;

    return `https://wa.me/${SHOP_LOCATION_INFO.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
  };

  const handleSOSSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDispatchSent(true);
    // Open WhatsApp automatically
    window.open(constructWhatsAppSOSUrl(), '_blank');

    // Smooth scroll to location section
    const el = document.getElementById('location-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div id="roadside-sos-container" className="bg-slate-950 text-white rounded-2xl border border-red-600/80 shadow-xl overflow-hidden my-8">
      {/* Top Warning Banner */}
      <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight">
              SOS Mobile Tyre Rescue Dispatch
            </h2>
            <p className="text-xs text-red-100 font-medium">
              Fast Roadside Assistance from Maranatha Square, Pichelin (South Dominica)
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {/* Direct Call Header */}
        <div className="bg-red-950/30 border border-red-800/60 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
              Emergency Technician On Call in Pichelin
            </span>
            <div className="text-xl sm:text-2xl font-bold text-white">
              {SHOP_LOCATION_INFO.phonePrimary} / {SHOP_LOCATION_INFO.phoneMobile}
            </div>
            <p className="text-xs text-slate-400">
              Mobile van equipped with 3-ton pneumatic jack, impact wrenches, and spare tyres.
            </p>
          </div>

          <a
            href={`tel:${SHOP_LOCATION_INFO.phonePrimary.replace(/[^0-9+]/g, '')}`}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold text-sm px-6 py-3.5 rounded-lg shadow-xs transition transform active:scale-95"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Call Hotline Now</span>
          </a>
        </div>

        {dispatchSent ? (
          <div className="bg-slate-900 border border-emerald-500/60 rounded-xl p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-white">SOS Dispatch Signal Sent!</h3>
            <p className="text-slate-300 text-sm max-w-md mx-auto">
              Our mobile rescue team at Maranatha Square is preparing the rescue van. 
              Please stay in a safe spot off the road and turn on your vehicle hazard lights.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <a
                href={constructWhatsAppSOSUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600 text-white font-bold text-xs px-5 py-2.5 rounded-lg hover:bg-emerald-500 transition inline-flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Open WhatsApp Chat
              </a>
              <button
                type="button"
                onClick={() => setDispatchSent(false)}
                className="bg-slate-800 text-slate-300 font-bold text-xs px-4 py-2.5 rounded-lg hover:bg-slate-700 transition"
              >
                Update Request Details
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSOSSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Landmark Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nearest Landmark / Parish Route *
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-red-500"
                >
                  {dominicaLocations.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Exact Spot / GPS Button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-300">
                    Specific Landmark / Milepost
                  </label>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={gettingLocation}
                    className="text-[11px] text-[#0984E3] hover:underline font-bold inline-flex items-center gap-1"
                  >
                    <Navigation className="w-3 h-3" />
                    {gettingLocation ? 'Finding GPS...' : 'Auto-Detect GPS'}
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Near Pichelin Catholic Church, before the steep curve"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500"
                />
                {gpsCoordinates && (
                  <span className="text-[11px] text-emerald-400 mt-1 block font-mono">
                    ✓ GPS Locked: {gpsCoordinates}
                  </span>
                )}
              </div>

              {/* Issue Type */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  What happened to your tyre?
                </label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-red-500"
                >
                  <option value="Flat Tyre / Puncture">Flat Tyre / Puncture (Need On-site Patch)</option>
                  <option value="Blowout">Tyre Blowout / Shredded (Need Replacement Tyre Brought)</option>
                  <option value="Need Spare Wheel Mounted">Stuck with Spare (Need Jack / Lug Nut Help)</option>
                  <option value="Need New/Used Tyre Brought to Scene">Bring In-Stock Tyre to Scene</option>
                </select>
              </div>

              {/* Vehicle Type & Tyre Size */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Vehicle Model
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hilux, Noah, Vitz"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Tyre Size (if known)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 265/65R17"
                    value={tyreSizeNeeded}
                    onChange={(e) => setTyreSizeNeeded(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Driver Contact */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Driver Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Driver Phone / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. (767) 275-8973"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-red-400" />
                Dispatched in under 15 minutes from Maranatha Square
              </span>

              <button
                type="submit"
                id="submit-sos-dispatch-btn"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold text-sm px-8 py-3.5 rounded-lg shadow-xs transition transform active:scale-95"
              >
                <Truck className="w-5 h-5" />
                <span>Send Emergency SOS Dispatch</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
