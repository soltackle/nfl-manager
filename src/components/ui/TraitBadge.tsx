import React from 'react';
import { motion } from 'framer-motion';

interface TraitBadgeProps {
  trait: string;
}

// OVR tabanlı değil ama genel olarak yeteneklerin altın/özel görünmesi istenmiş
export const TraitBadge: React.FC<TraitBadgeProps> = ({ trait }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative inline-flex items-center gap-1 rounded-sm border border-yellow-500/30 bg-gradient-to-r from-yellow-600/20 to-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.15)] backdrop-blur-sm transition-all hover:border-yellow-400/60 hover:from-yellow-500/30 hover:to-amber-400/20 hover:text-yellow-400 hover:shadow-[0_0_12px_rgba(234,179,8,0.3)]"
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75"></span>
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-yellow-500"></span>
      </span>
      {trait}
      
      {/* Tooltip */}
      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max -translate-x-1/2 scale-95 rounded-md bg-black/90 px-3 py-1.5 text-xs font-normal text-white opacity-0 shadow-xl transition-all group-hover:scale-100 group-hover:opacity-100">
        <span className="font-bold text-yellow-400">{trait}</span> yeteneği
      </div>
    </motion.div>
  );
};
