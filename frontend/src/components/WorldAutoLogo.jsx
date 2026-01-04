export default function WorldAutoLogo({ className = "w-10 h-10" }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background circle with gradient */}
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F0F0F0" />
        </linearGradient>
        <linearGradient id="globeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E3A5F" />
          <stop offset="100%" stopColor="#0F2744" />
        </linearGradient>
      </defs>
      
      {/* Main circle background - Bleu foncé */}
      <circle cx="24" cy="24" r="23" fill="url(#globeGradient)" />
      
      {/* Globe lines - horizontal - Bleu clair */}
      <ellipse cx="24" cy="24" rx="18" ry="18" stroke="#60A5FA" strokeWidth="1" fill="none" />
      <ellipse cx="24" cy="24" rx="18" ry="10" stroke="#60A5FA" strokeWidth="1" fill="none" />
      <ellipse cx="24" cy="24" rx="18" ry="4" stroke="#60A5FA" strokeWidth="1" fill="none" />
      
      {/* Globe lines - vertical - Bleu clair */}
      <ellipse cx="24" cy="24" rx="10" ry="18" stroke="#60A5FA" strokeWidth="1" fill="none" />
      <line x1="24" y1="6" x2="24" y2="42" stroke="#60A5FA" strokeWidth="1" />
      <line x1="6" y1="24" x2="42" y2="24" stroke="#60A5FA" strokeWidth="1" />
      
      {/* Stylized W for World - Blanc */}
      <path
        d="M12 16L16 32L24 22L32 32L36 16"
        stroke="url(#logoGradient)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Road/speed lines accent - Orange */}
      <path
        d="M8 36C12 34 16 35 20 33"
        stroke="#F97316"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        d="M28 33C32 35 36 34 40 36"
        stroke="#F97316"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.8"
      />
      
      {/* Small accent dot - Orange */}
      <circle cx="24" cy="40" r="2" fill="#F97316" />
    </svg>
  );
}
