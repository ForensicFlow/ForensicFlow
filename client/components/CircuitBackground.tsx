import React from 'react';

const CircuitBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-black" aria-hidden="true">
      {/* Animated grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000,transparent)]"></div>
      
      {/* Hexagon pattern overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hexagons" x="0" y="0" width="100" height="87" patternUnits="userSpaceOnUse">
            <polygon points="50,0 93.3,25 93.3,75 50,100 6.7,75 6.7,25" 
                     fill="none" 
                     stroke="rgba(14,165,233,0.3)" 
                     strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexagons)" />
      </svg>
      
      {/* Circuit pattern overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="circuit" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
            {/* Horizontal lines */}
            <line x1="0" y1="40" x2="80" y2="40" stroke="rgba(14,165,233,0.4)" strokeWidth="1" />
            <line x1="120" y1="40" x2="200" y2="40" stroke="rgba(14,165,233,0.4)" strokeWidth="1" />
            <line x1="0" y1="160" x2="50" y2="160" stroke="rgba(14,165,233,0.4)" strokeWidth="1" />
            <line x1="150" y1="160" x2="200" y2="160" stroke="rgba(14,165,233,0.4)" strokeWidth="1" />
            
            {/* Vertical lines */}
            <line x1="80" y1="0" x2="80" y2="40" stroke="rgba(14,165,233,0.4)" strokeWidth="1" />
            <line x1="80" y1="100" x2="80" y2="200" stroke="rgba(14,165,233,0.4)" strokeWidth="1" />
            <line x1="150" y1="0" x2="150" y2="100" stroke="rgba(14,165,233,0.4)" strokeWidth="1" />
            <line x1="150" y1="160" x2="150" y2="200" stroke="rgba(14,165,233,0.4)" strokeWidth="1" />
            
            {/* Circuit nodes */}
            <circle cx="80" cy="40" r="3" fill="rgba(14,165,233,0.6)" />
            <circle cx="80" cy="100" r="3" fill="rgba(14,165,233,0.6)" />
            <circle cx="150" cy="100" r="3" fill="rgba(14,165,233,0.6)" />
            <circle cx="150" cy="160" r="3" fill="rgba(14,165,233,0.6)" />
            <circle cx="50" cy="160" r="3" fill="rgba(14,165,233,0.6)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#circuit)" />
      </svg>

      {/* Animated elements container */}
      <div className="absolute inset-0">
        <style>{`
          @keyframes float {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -30px) scale(1.1); }
            66% { transform: translate(-30px, 20px) scale(0.9); }
          }
          @keyframes float-reverse {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(-40px, 30px) scale(0.9); }
            66% { transform: translate(40px, -20px) scale(1.1); }
          }
          @keyframes pulse-glow {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.6; }
          }
          @keyframes data-flow {
            0% { transform: translateX(-100%); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateX(100%); opacity: 0; }
          }
          @keyframes data-flow-vertical {
            0% { transform: translateY(-100%); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(100%); opacity: 0; }
          }
          @keyframes particle-float {
            0% { transform: translateY(100vh) translateX(0); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(-100vh) translateX(50px); opacity: 0; }
          }
          @keyframes scanline {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100vh); }
          }
          @keyframes binary-rain {
            0% { transform: translateY(-100%); opacity: 0; }
            10% { opacity: 0.5; }
            90% { opacity: 0.5; }
            100% { transform: translateY(100vh); opacity: 0; }
          }
          @keyframes corner-pulse {
            0%, 100% { opacity: 0.2; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.05); }
          }
        `}</style>
        
        {/* Large glowing orbs */}
        <div className="absolute top-[15%] left-[10%] w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] animate-[float_15s_ease-in-out_infinite]"></div>
        <div className="absolute top-[60%] right-[15%] w-80 h-80 bg-blue-500/15 rounded-full blur-[100px] animate-[float_20s_ease-in-out_infinite_reverse]"></div>
        <div className="absolute bottom-[10%] left-[45%] w-72 h-72 bg-cyan-400/10 rounded-full blur-[90px] animate-[float_18s_ease-in-out_infinite]"></div>
        
        {/* Additional smaller glowing orbs */}
        <div className="absolute top-[35%] right-[30%] w-64 h-64 bg-blue-400/10 rounded-full blur-[80px] animate-[float-reverse_22s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-[40%] left-[20%] w-56 h-56 bg-cyan-500/15 rounded-full blur-[70px] animate-[float_17s_ease-in-out_infinite]"></div>
        <div className="absolute top-[50%] left-[70%] w-48 h-48 bg-blue-500/12 rounded-full blur-[60px] animate-[float-reverse_19s_ease-in-out_infinite]"></div>
        
        {/* Horizontal data flow lines */}
        <div className="absolute top-[30%] left-0 w-full h-px overflow-hidden">
          <div className="h-full w-32 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-[data-flow_8s_linear_infinite]"></div>
        </div>
        <div className="absolute top-[70%] left-0 w-full h-px overflow-hidden">
          <div className="h-full w-24 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-[data-flow_10s_linear_infinite]" style={{ animationDelay: '2s' }}></div>
        </div>
        <div className="absolute top-[45%] left-0 w-full h-px overflow-hidden">
          <div className="h-full w-28 bg-gradient-to-r from-transparent via-cyan-300 to-transparent animate-[data-flow_9s_linear_infinite]" style={{ animationDelay: '4s' }}></div>
        </div>
        <div className="absolute top-[85%] left-0 w-full h-px overflow-hidden">
          <div className="h-full w-20 bg-gradient-to-r from-transparent via-blue-300 to-transparent animate-[data-flow_11s_linear_infinite]" style={{ animationDelay: '1s' }}></div>
        </div>
        
        {/* Vertical data flow lines */}
        <div className="absolute left-[20%] top-0 w-px h-full overflow-hidden">
          <div className="w-full h-32 bg-gradient-to-b from-transparent via-cyan-400 to-transparent animate-[data-flow-vertical_12s_linear_infinite]"></div>
        </div>
        <div className="absolute left-[60%] top-0 w-px h-full overflow-hidden">
          <div className="w-full h-24 bg-gradient-to-b from-transparent via-blue-400 to-transparent animate-[data-flow-vertical_10s_linear_infinite]" style={{ animationDelay: '3s' }}></div>
        </div>
        <div className="absolute left-[80%] top-0 w-px h-full overflow-hidden">
          <div className="w-full h-28 bg-gradient-to-b from-transparent via-cyan-300 to-transparent animate-[data-flow-vertical_14s_linear_infinite]" style={{ animationDelay: '1.5s' }}></div>
        </div>
        
        {/* Floating particles */}
        <div className="absolute left-[10%] bottom-0 w-1 h-1 bg-cyan-400 rounded-full opacity-60 animate-[particle-float_15s_linear_infinite]"></div>
        <div className="absolute left-[30%] bottom-0 w-1.5 h-1.5 bg-blue-400 rounded-full opacity-50 animate-[particle-float_18s_linear_infinite]" style={{ animationDelay: '2s' }}></div>
        <div className="absolute left-[50%] bottom-0 w-1 h-1 bg-cyan-300 rounded-full opacity-60 animate-[particle-float_20s_linear_infinite]" style={{ animationDelay: '4s' }}></div>
        <div className="absolute left-[70%] bottom-0 w-1.5 h-1.5 bg-blue-300 rounded-full opacity-50 animate-[particle-float_16s_linear_infinite]" style={{ animationDelay: '1s' }}></div>
        <div className="absolute left-[90%] bottom-0 w-1 h-1 bg-cyan-400 rounded-full opacity-60 animate-[particle-float_19s_linear_infinite]" style={{ animationDelay: '3s' }}></div>
        <div className="absolute left-[15%] bottom-0 w-1 h-1 bg-blue-400 rounded-full opacity-50 animate-[particle-float_17s_linear_infinite]" style={{ animationDelay: '5s' }}></div>
        <div className="absolute left-[45%] bottom-0 w-1.5 h-1.5 bg-cyan-300 rounded-full opacity-60 animate-[particle-float_21s_linear_infinite]" style={{ animationDelay: '2.5s' }}></div>
        <div className="absolute left-[65%] bottom-0 w-1 h-1 bg-blue-300 rounded-full opacity-50 animate-[particle-float_14s_linear_infinite]" style={{ animationDelay: '4.5s' }}></div>
        
        {/* Binary code rain effect */}
        <div className="absolute left-[25%] top-0 text-xs font-mono text-cyan-400/20 animate-[binary-rain_20s_linear_infinite]">
          01010011<br/>01000101<br/>01000011<br/>01010101<br/>01010010<br/>01000101
        </div>
        <div className="absolute left-[55%] top-0 text-xs font-mono text-blue-400/20 animate-[binary-rain_25s_linear_infinite]" style={{ animationDelay: '5s' }}>
          01000100<br/>01000001<br/>01010100<br/>01000001
        </div>
        <div className="absolute left-[75%] top-0 text-xs font-mono text-cyan-300/20 animate-[binary-rain_22s_linear_infinite]" style={{ animationDelay: '8s' }}>
          01000110<br/>01001111<br/>01010010<br/>01000101<br/>01001110<br/>01010011
        </div>
        <div className="absolute left-[40%] top-0 text-xs font-mono text-blue-300/20 animate-[binary-rain_18s_linear_infinite]" style={{ animationDelay: '3s' }}>
          01001001<br/>01000011<br/>01010011
        </div>
        
        {/* Scanning lines */}
        <div className="absolute left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent animate-[scanline_8s_linear_infinite]"></div>
        <div className="absolute left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/20 to-transparent animate-[scanline_12s_linear_infinite]" style={{ animationDelay: '4s' }}></div>
        
        {/* Corner accent elements */}
        <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-cyan-500/30 animate-[corner-pulse_4s_ease-in-out_infinite]"></div>
        <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-cyan-500/30 animate-[corner-pulse_4s_ease-in-out_infinite]" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-blue-500/30 animate-[corner-pulse_4s_ease-in-out_infinite]" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-blue-500/30 animate-[corner-pulse_4s_ease-in-out_infinite]" style={{ animationDelay: '3s' }}></div>
        
        {/* Diagonal lines */}
        <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
          <line x1="0" y1="0" x2="100%" y2="100%" stroke="rgba(14,165,233,0.5)" strokeWidth="1" strokeDasharray="5,10" />
          <line x1="100%" y1="0" x2="0" y2="100%" stroke="rgba(59,130,246,0.5)" strokeWidth="1" strokeDasharray="5,10" />
        </svg>
        
        {/* Additional circuit nodes with glow */}
        <div className="absolute top-[25%] left-[15%] w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.8)] animate-[pulse-glow_3s_ease-in-out_infinite]"></div>
        <div className="absolute top-[60%] left-[70%] w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-[pulse-glow_3s_ease-in-out_infinite]" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-[80%] left-[40%] w-2 h-2 bg-cyan-300 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-[pulse-glow_3s_ease-in-out_infinite]" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[40%] left-[85%] w-2 h-2 bg-blue-300 rounded-full shadow-[0_0_10px_rgba(147,197,253,0.8)] animate-[pulse-glow_3s_ease-in-out_infinite]" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Vignette effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]"></div>
    </div>
  );
};

export default CircuitBackground;
