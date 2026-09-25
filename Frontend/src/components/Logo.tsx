interface LogoProps {
  size?: number;
  showText?: boolean;
  textSize?: string;
}

export default function Logo({ size = 36, showText = true, textSize = 'text-xl' }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="shield-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="glow-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {/* Shield base */}
        <path
          d="M20 3L5 9v11c0 8.5 6.4 16.4 15 18.3C28.6 36.4 35 28.5 35 20V9L20 3z"
          fill="url(#shield-grad)"
          opacity="0.15"
        />
        <path
          d="M20 3L5 9v11c0 8.5 6.4 16.4 15 18.3C28.6 36.4 35 28.5 35 20V9L20 3z"
          stroke="url(#shield-grad)"
          strokeWidth="1.5"
          fill="none"
        />
        {/* Network nodes */}
        <circle cx="20" cy="13" r="1.5" fill="#60a5fa" opacity="0.8" />
        <circle cx="13" cy="20" r="1.5" fill="#a78bfa" opacity="0.8" />
        <circle cx="27" cy="20" r="1.5" fill="#a78bfa" opacity="0.8" />
        <line x1="20" y1="13" x2="13" y2="20" stroke="rgba(96,165,250,0.4)" strokeWidth="1" />
        <line x1="20" y1="13" x2="27" y2="20" stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
        <line x1="13" y1="20" x2="27" y2="20" stroke="rgba(167,139,250,0.3)" strokeWidth="1" />
        {/* Check mark */}
        <path
          d="M13.5 22.5l4 4 9-9"
          stroke="url(#shield-grad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`${textSize} font-bold text-white`} style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>
            TrustLoan<span className="gradient-text">AI</span>
          </span>
        </div>
      )}
    </div>
  );
}
