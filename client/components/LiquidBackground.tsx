
import React from 'react';

const LiquidBackground: React.FC = () => {
  return (
    <div className="liquid-bg fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <style>{`
        @keyframes floaty {
          0% { transform: translate(0,0) scale(1); }
          50% { transform: translate(6%, -4%) scale(1.08); }
          100% { transform: translate(0,0) scale(1); }
        }
      `}</style>
      <div className="absolute -left-[10%] -top-[20%] h-[40vmax] w-[40vmax] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(80,170,255,0.35),transparent_40%)] opacity-45 mix-blend-screen motion-safe:animate-[floaty_12s_ease-in-out_infinite] [filter:blur(60px)_saturate(130%)]"></div>
      <div className="absolute -right-[15%] top-[5%] h-[40vmax] w-[40vmax] rounded-full bg-[radial-gradient(circle_at_60%_60%,rgba(200,120,255,0.30),transparent_40%)] opacity-45 mix-blend-screen motion-safe:animate-[floaty_16s_ease-in-out_infinite] [filter:blur(60px)_saturate(130%)]"></div>
      <div className="absolute bottom-[-15%] left-[20%] h-[40vmax] w-[40vmax] rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(120,255,200,0.25),transparent_40%)] opacity-45 mix-blend-screen motion-safe:animate-[floaty_20s_ease-in-out_infinite] [filter:blur(60px)_saturate(130%)]"></div>
    </div>
  );
};

export default LiquidBackground;
