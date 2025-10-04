import React from 'react';

interface LogoProps {
  isTextVisible?: boolean;
  className?: string;
  size?: number;
}

export const ForensicFlowLogo: React.FC<LogoProps> = ({ isTextVisible = true, className }) => (
    <div className={`flex items-center gap-2 ${className}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-cyan-400">
            <path d="M12.553 5.328c-2.92.83-5.208 3.356-5.46 6.38-2.678.34-4.632 2.53-4.992 5.138 3.32-.204 6.22-2.13 7.51-4.786.68-1.4 1.05-2.97 1.05-4.57 0-1.02.73-1.85 1.65-1.85.92 0 1.65.83 1.65 1.85s-.73 1.85-1.65 1.85h-1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M11.447 18.672c2.92-.83 5.208-3.356 5.46-6.38 2.678-.34 4.632-2.53 4.992-5.138-3.32.204-6.22 2.13-7.51 4.786-.68 1.4-1.05 2.97-1.05 4.57 0 1.02-.73 1.85-1.65 1.85-.92 0-1.65-.83-1.65-1.85s.73-1.85 1.65-1.85h1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {isTextVisible && (
          <span className="text-xl font-bold bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
            ForensicFlow
          </span>
        )}
    </div>
);

// Simple logo component for authentication pages
const Logo: React.FC<{ size?: number }> = ({ size = 60 }) => (
  <div className="flex items-center justify-center">
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-cyan-400">
      <path d="M12.553 5.328c-2.92.83-5.208 3.356-5.46 6.38-2.678.34-4.632 2.53-4.992 5.138 3.32-.204 6.22-2.13 7.51-4.786.68-1.4 1.05-2.97 1.05-4.57 0-1.02.73-1.85 1.65-1.85.92 0 1.65.83 1.65 1.85s-.73 1.85-1.65 1.85h-1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.447 18.672c2.92-.83 5.208-3.356 5.46-6.38 2.678-.34 4.632-2.53 4.992-5.138-3.32.204-6.22 2.13-7.51 4.786-.68 1.4-1.05 2.97-1.05 4.57 0 1.02-.73 1.85-1.65 1.85-.92 0-1.65-.83-1.65-1.85s.73-1.85 1.65-1.85h1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

export default Logo;
