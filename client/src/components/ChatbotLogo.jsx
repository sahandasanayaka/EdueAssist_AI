export default function ChatbotLogo({ size = 32, className = "" }) {
  return (
    <div 
      className={`relative inline-flex items-center justify-center shrink-0 rounded-xl overflow-hidden shadow-xs ${className}`}
      style={{ width: size, height: size }}
    >
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          {/* Deep Forest Tech Background */}
          <linearGradient id="logoBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#001E2B"/>
            <stop offset="100%" stopColor="#003522"/>
          </linearGradient>

          {/* Outer Cover Wing Gradient (Vibrant Emerald) */}
          <linearGradient id="bookCoverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00ED64"/>
            <stop offset="100%" stopColor="#009B4E"/>
          </linearGradient>

          {/* Inner Pages Lower Gradient */}
          <linearGradient id="bookPageGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00FFA8"/>
            <stop offset="100%" stopColor="#00ED64"/>
          </linearGradient>

          {/* Inner Pages Upper Gradient (Brighter Cyan Accent) */}
          <linearGradient id="bookPageGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#70FFC2"/>
            <stop offset="100%" stopColor="#00FFA8"/>
          </linearGradient>
        </defs>

        {/* Squircle Brand Container */}
        <rect width="100" height="100" rx="26" fill="url(#logoBg)"/>
        <rect x="2" y="2" width="96" height="96" rx="24" stroke="#00ED64" strokeWidth="2.5" strokeOpacity="0.35"/>

        {/* Dynamic Aerodynamic Open Book Logo (Exact match to user reference media_1790171892674.png) */}
        <g id="book-wings-symbol">
          
          {/* 1. Left Outer Wing Cover with Sharp Downward Flap */}
          <path 
            d="M50 49.5 C37 44 26 40 18 38 L25.5 56 C24 50 21 44.5 21 41 C28 43 38 47 50 52 Z" 
            fill="url(#bookCoverGrad)"
          />

          {/* 2. Right Outer Wing Cover with Sharp Downward Flap */}
          <path 
            d="M50 49.5 C63 44 74 40 82 38 L74.5 56 C76 50 79 44.5 79 41 C72 43 62 47 50 52 Z" 
            fill="url(#bookCoverGrad)"
          />

          {/* 3. Center Spine Downward Sharp Spike */}
          <path 
            d="M48.8 50 L50 63.5 L51.2 50 Z" 
            fill="url(#bookCoverGrad)"
          />

          {/* 4. Left Lower Flying Page */}
          <path 
            d="M50 47 C42 41 33 37 26 34 L32.5 32 C38 34.5 44 39.5 50 47 Z" 
            fill="url(#bookPageGrad1)"
          />

          {/* 5. Left Upper Flying Page */}
          <path 
            d="M50 45 C44 37 38 31.5 34.5 28.5 L40.5 26.5 C43.5 30 47 36.5 50 45 Z" 
            fill="url(#bookPageGrad2)"
          />

          {/* 6. Right Lower Flying Page */}
          <path 
            d="M50 47 C58 41 67 37 74 34 L67.5 32 C62 34.5 56 39.5 50 47 Z" 
            fill="url(#bookPageGrad1)"
          />

          {/* 7. Right Upper Flying Page */}
          <path 
            d="M50 45 C56 37 62 31.5 65.5 28.5 L59.5 26.5 C56.5 30 53 36.5 50 45 Z" 
            fill="url(#bookPageGrad2)"
          />

        </g>
      </svg>
    </div>
  );
}
