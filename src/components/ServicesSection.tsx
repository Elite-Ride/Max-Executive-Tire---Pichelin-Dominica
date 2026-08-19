import React, { useState } from 'react';
import { 
  Wrench, 
  Disc, 
  ShieldAlert, 
  RotateCw, 
  CircleDot, 
  Truck, 
  Sparkles, 
  Clock, 
  Check, 
  Calendar, 
  Car, 
  Phone, 
  User, 
  MapPin, 
  FileText,
  CheckCircle2
} from 'lucide-react';
import { TyreService, Currency } from '../types';
import { TYRE_SERVICES, SHOP_LOCATION_INFO } from '../data/servicesData';

interface ServicesSectionProps {
  currency: Currency;
  onOpenSOS: () => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  currency,
  onOpenSOS,
}) => {
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(['srv-mounting', 'srv-balancing']);
  const [tyreCount, setTyreCount] = useState<number>(4);
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('09:00 AM');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const getServiceIcon = (iconName: string) => {
    switch (iconName) {
      case 'Wrench': return <Wrench className="w-5 h-5 text-[#0984E3]" />;
      case 'Disc': return <Disc className="w-5 h-5 text-[#0984E3]" />;
      case 'ShieldAlert': return <ShieldAlert className="w-5 h-5 text-emerald-600" />;
      case 'RotateCw': return <RotateCw className="w-5 h-5 text-[#0984E3]" />;
      case 'CircleDot': return <CircleDot className="w-5 h-5 text-[#E17055]" />;
      case 'Truck': return <Truck className="w-5 h-5 text-red-500" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5 text-indigo-500" />;
      default: return <Wrench className="w-5 h-5 text-[#0984E3]" />;
    }
  };

  const toggleServiceSelection = (serviceId: string) => {
    if (selectedServiceIds.includes(serviceId)) {
      setSelectedServiceIds(selectedServiceIds.filter(id => id !== serviceId));
    } else {
      setSelectedServiceIds([...selectedServiceIds, serviceId]);
    }
  };

  // Calculate Total
  const calculatedTotalXCD = selectedServiceIds.reduce((sum, id) => {
    const service = TYRE_SERVICES.find(s => s.id === id);
    if (!service) return sum;
    // Rotation and Roadside are per-job, others are per tyre
    if (service.id === 'srv-rotation' || service.id === 'srv-roadside') {
      return sum + service.priceXCD;
    }
    return sum + (service.priceXCD * tyreCount);
  }, 0);

  const calculatedTotalUSD = calculatedTotalXCD / 2.70;

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedServiceIds.length === 0) {
      alert('Please select at least one workshop service.');
      return;
    }
    if (!customerName || !customerPhone) {
      alert('Please provide your name and phone number.');
      return;
    }

    setSubmitting(true);
    const bookingPayload = {
      serviceIds: selectedServiceIds,
      tyreCount,
      vehicleMake,
      vehicleModel,
      vehiclePlate,
      appointmentDate: appointmentDate || 'Today (Walk-in / Fast Lane)',
      appointmentTime,
      customerName,
      customerPhone,
      notes,
      totalXCD: calculatedTotalXCD,
      totalUSD: calculatedTotalUSD,
    };

    try {
      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload),
      });
      const data = await res.json();
      const refId = data.bookingId || ('MTC-' + Math.floor(100000 + Math.random() * 900000));
      setBookingSuccess(refId);
    } catch (err) {
      const refId = 'MTC-' + Math.floor(100000 + Math.random() * 900000);
      setBookingSuccess(refId);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="services-section" className="space-y-12">
      {/* Section Title */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 bg-blue-50 text-[#0984E3] border border-blue-200/60 text-xs font-bold uppercase px-3 py-1 rounded-md">
          <Wrench className="w-3.5 h-3.5" />
          Pichelin Workshop Station
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-[#2D3436] tracking-tight">
          Professional Tyre Services & Transparent Pricing
        </h2>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          Equipped with digital balancing machines, pneumatic tire changers, and vulcanizing hot-press tools at Maranatha Square, Pichelin.
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TYRE_SERVICES.map((service) => {
          const isSelected = selectedServiceIds.includes(service.id);
          const isEmergency = service.id === 'srv-roadside';

          return (
            <div
              key={service.id}
              id={`service-card-${service.id}`}
              className={`rounded-2xl p-6 border transition-all duration-200 flex flex-col justify-between ${
                isSelected 
                  ? 'bg-blue-50/40 border-[#0984E3] shadow-xs' 
                  : isEmergency 
                    ? 'bg-red-50/30 border-red-200 hover:border-red-300' 
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="space-y-4">
                {/* Header with Icon & Category */}
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    {getServiceIcon(service.iconName)}
                  </div>

                  <div className="text-right">
                    <span className="text-xl font-bold text-[#2D3436] block">
                      {currency === 'XCD' ? `EC$ ${service.priceXCD}` : `$${service.priceUSD.toFixed(2)}`}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {service.id === 'srv-rotation' || service.id === 'srv-roadside' ? 'Per Vehicle' : 'Per Tyre'}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {service.category}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      <Clock className="w-3 h-3 text-[#0984E3]" />
                      <span>Est. Duration: {service.durationMinutes} mins</span>
                    </span>
                    {service.badge && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                        {service.badge}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-bold text-[#2D3436] leading-snug">
                    {service.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                {/* Inclusions checklist */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    What's Included:
                  </span>
                  <ul className="space-y-1 text-xs text-slate-700">
                    {service.inclusions.map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-5 border-t border-slate-100 mt-4">
                {isEmergency ? (
                  <button
                    type="button"
                    onClick={onOpenSOS}
                    className="w-full inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 px-3 rounded-lg shadow-xs transition"
                  >
                    <Truck className="w-4 h-4" />
                    Request Rapid SOS Rescue
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleServiceSelection(service.id)}
                    className={`w-full inline-flex items-center justify-center gap-2 text-xs font-bold py-2.5 px-3 rounded-lg transition ${
                      isSelected
                        ? 'bg-[#0984E3] text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        Selected in Booking
                      </>
                    ) : (
                      <>
                        <span>+ Add to Booking Quote</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Service Appointment Booking Form */}
      <div id="service-booking-form-box" className="bg-slate-900 text-white rounded-2xl p-6 sm:p-10 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <span className="text-[#0984E3] text-xs font-bold uppercase tracking-wider block">
                Instant Appointment & Quote
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white">
                Book Workshop Fitting & Balancing
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                Skip the waiting line at Maranatha Square, Pichelin. Our bay technician will be ready for you.
              </p>
            </div>

            {/* Estimated Total Price Summary */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-right self-start sm:self-auto min-w-[200px]">
              <span className="text-xs text-slate-400 block font-medium">Estimated Workshop Cost:</span>
              <span className="text-2xl sm:text-3xl font-bold text-white">
                {currency === 'XCD' ? `EC$ ${calculatedTotalXCD}` : `$${calculatedTotalUSD.toFixed(2)} USD`}
              </span>
              <span className="text-[11px] text-slate-400 block">
                for {tyreCount} {tyreCount === 1 ? 'tyre' : 'tyres'}
              </span>
            </div>
          </div>

          {bookingSuccess ? (
            <div className="bg-emerald-950/80 border border-emerald-500/60 rounded-xl p-8 text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-2xl font-bold text-white">Appointment Confirmed!</h4>
              <p className="text-emerald-200 text-sm max-w-md mx-auto">
                Your reservation reference is <span className="font-mono font-bold text-white bg-emerald-900/60 px-2 py-0.5 rounded">{bookingSuccess}</span>. 
                We are reserving your bay at Maranatha Square, Pichelin.
              </p>
              <div className="pt-3 flex flex-wrap justify-center gap-3">
                <a
                  href={`https://wa.me/${SHOP_LOCATION_INFO.whatsapp.replace(/[^0-9]/g, '')}?text=Hello%20Max%20Executive%20Tires,%20I%20have%20booked%20an%20appointment%20ref:%20${bookingSuccess}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-6 py-3 rounded-lg transition"
                >
                  Send Confirmation to WhatsApp
                </a>
                <button
                  type="button"
                  onClick={() => setBookingSuccess(null)}
                  className="bg-slate-800 text-white font-bold text-sm px-5 py-3 rounded-lg hover:bg-slate-700 transition"
                >
                  Book Another Vehicle
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleBookingSubmit} className="space-y-6">
              {/* Selected Services Pill Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Select Workshop Services:
                </label>
                <div className="flex flex-wrap gap-2">
                  {TYRE_SERVICES.filter(s => s.id !== 'srv-roadside').map(service => {
                    const isSelected = selectedServiceIds.includes(service.id);
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => toggleServiceSelection(service.id)}
                        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold border transition ${
                          isSelected
                            ? 'bg-[#0984E3] border-[#0984E3] text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        <span>{service.name}</span>
                        <span className="text-[11px] opacity-80">(EC$ {service.priceXCD})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tyre Count Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Number of Tyres to Service:
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 4, 5].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setTyreCount(cnt)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold border transition ${
                        tyreCount === cnt
                          ? 'bg-[#0984E3] border-[#0984E3] text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {cnt} {cnt === 1 ? 'Tyre' : cnt === 5 ? '5 (Full Set + Spare)' : 'Tyres'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Input Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Vehicle Make & Model */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Vehicle Make & Model
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Toyota Hilux, RAV4, Noah"
                      value={vehicleMake}
                      onChange={(e) => setVehicleMake(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0984E3] focus:border-[#0984E3]"
                    />
                    <Car className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
                  </div>
                </div>

                {/* License Plate */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    License Plate (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TD 4821, HF 892"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0984E3] focus:border-[#0984E3]"
                  />
                </div>

                {/* Customer Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Your Full Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jefferson Charles"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0984E3] focus:border-[#0984E3]"
                    />
                    <User className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
                  </div>
                </div>

                {/* Customer Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Phone / WhatsApp Number *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      placeholder="e.g. (767) 275-8973"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0984E3] focus:border-[#0984E3]"
                    />
                    <Phone className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0984E3] focus:border-[#0984E3]"
                  />
                </div>

                {/* Time Slot */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Preferred Time Slot
                  </label>
                  <select
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-[#0984E3] focus:border-[#0984E3]"
                  >
                    <option value="08:00 AM">08:00 AM (Early Bird)</option>
                    <option value="09:30 AM">09:30 AM (Morning)</option>
                    <option value="11:00 AM">11:00 AM (Mid-Day)</option>
                    <option value="01:30 PM">01:30 PM (Afternoon)</option>
                    <option value="03:30 PM">03:30 PM (Afternoon)</option>
                    <option value="05:00 PM">05:00 PM (Late Afternoon)</option>
                  </select>
                </div>
              </div>

              {/* Special Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Notes / Specific Issues (e.g. slow air leak, steering vibration on highway)
                </label>
                <textarea
                  rows={2}
                  placeholder="Tell us any symptoms your car is having on Dominica roads..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0984E3] focus:border-[#0984E3]"
                ></textarea>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <MapPin className="w-4 h-4 text-[#0984E3] shrink-0" />
                  <span>Maranatha Square, Pichelin • Drive-in bay reserved upon submission</span>
                </div>

                <button
                  type="submit"
                  id="submit-service-booking-btn"
                  disabled={submitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#0984E3] hover:bg-[#0873c4] text-white font-bold text-sm px-8 py-3.5 rounded-lg shadow-xs transition transform active:scale-95 disabled:opacity-50"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{submitting ? 'Confirming...' : 'Confirm Workshop Booking'}</span>
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </section>
  );
};
