import React from 'react';

interface BrandLogoProps {
  variant?: 'navbar' | 'hero' | 'footer' | 'badge' | 'card' | 'icon-only';
  className?: string;
  showTagline?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'navbar',
  className = '',
  showTagline = true
}) => {
  // If card/badge variant: Authentic white card with gold pinstripes matching the photo
  if (variant === 'card' || variant === 'badge') {
    return (
      <div className={`relative bg-white rounded-xl p-3 sm:p-4 border border-[#C29B38]/60 shadow-lg inline-flex flex-col items-center select-none ${className}`}>
        {/* Gold Border Accent Lines on edges */}
        <div className="absolute left-2 top-2 bottom-2 w-[1.5px] bg-[#C29B38]"></div>
        <div className="absolute right-2 top-2 bottom-2 w-[1.5px] bg-[#C29B38]"></div>

        <div className="flex items-center gap-3 px-2">
          {/* Official Tire Illustration */}
          <div className="relative shrink-0 w-16 h-16 sm:w-20 sm:h-20">
            <img 
              src="/logo.svg" 
              alt="Max Executive Tires Inc." 
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex flex-col justify-center">
            <div className="text-xl sm:text-2xl font-black text-[#1340D8] tracking-tight leading-tight uppercase font-sans">
              Max Executive
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#1340D8] tracking-tight leading-tight uppercase font-sans">
              Tires Inc.
            </div>
          </div>
        </div>

        {showTagline && (
          <div className="mt-1 text-center font-serif italic text-xs sm:text-sm font-semibold text-[#C29B38] tracking-wide">
            Where quality meets the road!
          </div>
        )}
      </div>
    );
  }

  // Icon only
  if (variant === 'icon-only') {
    return (
      <div className={`relative inline-flex items-center justify-center ${className}`}>
        <img 
          src="/logo.svg" 
          alt="Max Executive Tires Inc." 
          className="w-10 h-10 object-contain drop-shadow-md"
        />
      </div>
    );
  }

  // Header / Navbar & Default Variant (Rich, sharp, matches the uploaded picture with crisp SVG graphics)
  return (
    <div className={`flex items-center gap-3 group select-none ${className}`}>
      {/* Visual Emblem Badge container */}
      <div className="relative bg-white/95 rounded-lg p-1 px-1.5 border border-[#C29B38]/50 shadow-sm flex items-center justify-center shrink-0 group-hover:border-[#0984E3] transition">
        <svg 
          viewBox="0 0 500 240" 
          className="h-10 sm:h-12 w-auto max-w-[170px] sm:max-w-[200px] object-contain"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Left Side: 3D Off-Road Heavy-Duty Tire */}
          <g transform="translate(15, 10)">
            <path d="M 125 15 C 75 15, 30 45, 30 100 C 30 155, 75 185, 125 185 C 138 185, 150 182, 162 176 L 150 156 C 142 160, 134 162, 125 162 C 88 162, 58 135, 58 100 C 58 65, 88 38, 125 38 C 135 38, 145 41, 153 45 L 165 24 C 153 18, 139 15, 125 15 Z" fill="#0D131A" />

            {/* Deep All-Terrain Tread Lug Pattern (Chevron blocks) */}
            <g fill="#FFFFFF" stroke="#0D131A" strokeWidth="2.5" strokeLinejoin="round">
              <polygon points="108,18 122,19 120,33 104,30" />
              <polygon points="85,25 99,28 94,42 79,38" />
              <polygon points="63,38 76,43 69,57 56,50" />
              <polygon points="46,57 57,64 48,77 37,69" />
              <polygon points="34,80 44,88 35,102 24,93" />
              <polygon points="30,105 40,111 31,126 21,118" />
              <polygon points="35,130 46,134 38,149 27,143" />
              <polygon points="49,152 61,154 55,168 43,164" />
              <polygon points="70,168 83,168 79,182 66,180" />
              <polygon points="95,177 109,174 107,188 93,189" />
              <polygon points="120,181 135,175 136,188 122,192" />
            </g>

            {/* Inner Chevron Staggered Grip Blocks */}
            <g fill="#0D131A">
              <polygon points="105,33 115,35 110,48 100,45" />
              <polygon points="85,44 95,47 88,60 78,56" />
              <polygon points="68,60 78,65 70,78 59,72" />
              <polygon points="57,80 67,86 58,99 48,92" />
              <polygon points="54,103 64,108 55,121 44,115" />
              <polygon points="58,124 68,128 61,141 50,136" />
              <polygon points="71,143 82,145 76,158 65,155" />
              <polygon points="90,157 101,156 97,169 86,169" />
              <polygon points="112,162 124,159 122,172 110,174" />
            </g>

            {/* White Inner Rim Groove Circle */}
            <ellipse cx="125" cy="100" rx="52" ry="52" fill="none" stroke="#FFFFFF" strokeWidth="5" />
            <ellipse cx="125" cy="100" rx="42" ry="42" fill="#0D131A" stroke="#1E293B" strokeWidth="2" />
            <ellipse cx="125" cy="100" rx="18" ry="18" fill="#FFFFFF" fillOpacity="0.9" />
            <ellipse cx="125" cy="100" rx="12" ry="12" fill="#0D131A" />
            <ellipse cx="125" cy="100" rx="5" ry="5" fill="#1A56DB" />

            {/* Top & Bottom Dynamic Swooshes */}
            <path d="M 125 34 C 180 34, 250 44, 325 50 C 255 60, 185 54, 125 54 Z" fill="#0D131A" />
            <path d="M 125 146 C 185 146, 255 140, 325 150 C 250 156, 180 166, 125 166 Z" fill="#0D131A" />
          </g>

          {/* Typography */}
          <g transform="translate(195, 25)">
            <text x="0" y="54" fontFamily="Impact, Arial Black, 'Trebuchet MS', sans-serif" fontSize="48" fontWeight="900" fill="#1340D8" letterSpacing="-0.5px">
              Max Executive
            </text>
            <text x="0" y="108" fontFamily="Impact, Arial Black, 'Trebuchet MS', sans-serif" fontSize="48" fontWeight="900" fill="#1340D8" letterSpacing="-0.5px">
              Tires Inc.
            </text>
          </g>

          {/* Tagline */}
          <g transform="translate(50, 205)">
            <text x="45" y="20" fontFamily="Georgia, 'Times New Roman', serif" fontStyle="italic" fontSize="25" fontWeight="700" fill="#C29B38" letterSpacing="0.5px">
              Where quality meets the road!
            </text>
          </g>
        </svg>
      </div>

      {/* Text column for shop location badge */}
      <div className="hidden sm:flex flex-col justify-center">
        <span className="font-extrabold text-sm text-white tracking-tight flex items-center gap-1.5">
          <span 
            className="text-amber-400 font-serif italic inline-block"
            style={{ width: '118.758px', fontSize: '11px', paddingRight: '10px', marginRight: '5px', textAlign: 'center' }}
          >
            Pichelin, Dominica
          </span>
        </span>
        <span 
          className="text-slate-400 font-medium"
          style={{ fontSize: '12px', paddingRight: '5px', textAlign: 'center' }}
        >
          Sales, Fitting & Workshop Bays
        </span>
      </div>
    </div>
  );
};
