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
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
        <linearGradient id="globeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
      </defs>
      
      {/* Main circle background */}
      <circle cx="24" cy="24" r="23" fill="url(#globeGradient)" />
      
      {/* Globe lines - horizontal */}
      <ellipse cx="24" cy="24" rx="18" ry="18" stroke="#334155" strokeWidth="1" fill="none" />
      <ellipse cx="24" cy="24" rx="18" ry="10" stroke="#334155" strokeWidth="1" fill="none" />
      <ellipse cx="24" cy="24" rx="18" ry="4" stroke="#334155" strokeWidth="1" fill="none" />
      
      {/* Globe lines - vertical */}
      <ellipse cx="24" cy="24" rx="10" ry="18" stroke="#334155" strokeWidth="1" fill="none" />
      <line x1="24" y1="6" x2="24" y2="42" stroke="#334155" strokeWidth="1" />
      <line x1="6" y1="24" x2="42" y2="24" stroke="#334155" strokeWidth="1" />
      
      {/* Stylized W for World - modern angular design */}
      <path
        d="M12 16L16 32L24 22L32 32L36 16"
        stroke="url(#logoGradient)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Road/speed lines accent */}
      <path
        d="M8 36C12 34 16 35 20 33"
        stroke="#F97316"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M28 33C32 35 36 34 40 36"
        stroke="#F97316"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />
      
      {/* Small accent dot */}
      <circle cx="24" cy="40" r="2" fill="#F97316" />
    </svg>
  );
}
