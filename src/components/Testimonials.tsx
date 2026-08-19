import React from 'react';
import { Star, ShieldCheck, ThumbsUp, MapPin, Quote } from 'lucide-react';

export const Testimonials: React.FC = () => {
  const reviews = [
    {
      name: 'Mervin Baptist',
      role: 'Minibus / Taxi Driver (Roseau - Grand Bay Route)',
      location: 'Grand Bay, Dominica',
      rating: 5,
      comment: 'I drive the Roseau to Grand Bay route every single day carrying full passenger loads over Pichelin hill. Got 4 commercial 8-ply Hankooks mounted and dynamically balanced at Maranatha Square. Zero steering shake on the highway and exceptional wet grip during heavy rain!',
      vehicle: 'Toyota HiAce Minibus',
      verified: 'Verified Customer'
    },
    {
      name: 'Kerwin Henderson',
      role: 'Construction & Agricultural Contractor',
      location: 'Pichelin, Dominica',
      rating: 5,
      comment: 'Bought a pair of Grade-A tested used Bridgestone All-Terrain tyres for my Hilux. The tread was over 85% and pressure-tested right in front of me. Saved over EC$ 600 compared to new without sacrificing safety on rough farm tracks.',
      vehicle: 'Toyota Hilux 4x4 265/65R17',
      verified: 'Verified Customer'
    },
    {
      name: 'Shermine Pierre',
      role: 'Healthcare Worker & Daily Commuter',
      location: 'Soufrière / Pichelin',
      rating: 5,
      comment: 'Had a puncture coming down Bellevue Chopin at 6:30 in the evening. Called their emergency SOS number and the technician met me with a jack and vulcanized patch in 12 minutes! Invaluable service for southern Dominica drivers.',
      vehicle: 'Suzuki Vitara',
      verified: 'Roadside Rescue Customer'
    }
  ];

  return (
    <section className="bg-slate-100/70 rounded-2xl p-6 sm:p-10 border border-slate-200 space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1 bg-blue-50 text-[#0984E3] border border-blue-200/60 text-xs font-bold uppercase px-3 py-1 rounded-md">
          <ThumbsUp className="w-3.5 h-3.5" />
          Dominica Drivers Trust Us
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2D3436] tracking-tight">
          What Local Drivers Say in Pichelin & Grand Bay
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reviews.map((rev, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              {/* Stars */}
              <div className="flex items-center justify-between">
                <div className="flex text-[#E17055]">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#E17055]" />
                  ))}
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {rev.verified}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                "{rev.comment}"
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <div className="font-bold text-[#2D3436] text-sm">{rev.name}</div>
              <div className="text-xs text-slate-500">{rev.role}</div>
              <div className="text-[11px] text-[#0984E3] font-medium mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#0984E3]" />
                <span>{rev.location} • {rev.vehicle}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
