import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, 
  Quote, 
  CheckCircle2, 
  Building2, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';

export interface TestimonialData {
  id: string;
  name: string;
  role: string;
  company: string;
  avatarImage?: string;
  avatarText?: string;
  rating: number;
  quote: string;
  primaryMetric: string;
  secondaryMetric: string;
  verifiedBadge: string;
  industry: string;
}

interface TestimonialCarouselProps {
  testimonials: TestimonialData[];
  themeConfig: any;
  autoPlayInterval?: number;
}

export default function TestimonialCarousel({ 
  testimonials, 
  themeConfig, 
  autoPlayInterval = 5000 
}: TestimonialCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const containerRef = useRef<HTMLDivElement>(null);

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(nextSlide, autoPlayInterval);
    return () => clearInterval(interval);
  }, [nextSlide, autoPlayInterval, isHovered]);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const current = testimonials[currentIndex];

  const [selectedCase, setSelectedCase] = useState<TestimonialData | null>(null);

  return (
    <div 
      className="relative w-full max-w-6xl mx-auto py-12"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-[550px] md:h-[450px] overflow-hidden rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl shadow-2xl">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.4 }
            }}
            className="absolute inset-0 p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center"
          >
            {/* Left: Author & Image */}
            <div className="w-full md:w-1/3 flex flex-col items-center md:items-start text-center md:text-left">
              <div className="relative group">
                <div className={`absolute -inset-1 bg-gradient-to-r ${themeConfig.glowColor || 'from-blue-500 to-emerald-500'} rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200`}></div>
                <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-slate-800 bg-slate-950 flex items-center justify-center">
                  {current.avatarImage ? (
                    <img 
                      src={current.avatarImage} 
                      alt={current.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className={`text-3xl font-black ${themeConfig.accentText}`}>
                      {current.avatarText}
                    </span>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-full p-1.5 border-4 border-slate-900 shadow-lg">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                  {current.name}
                </h3>
                <p className="text-sm text-slate-400 font-medium">
                  {current.role}
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-xs font-mono text-slate-500">
                  <Building2 className="w-3.5 h-3.5" />
                  {current.company}
                </div>
              </div>

              <div className="flex gap-1 mt-4">
                {[...Array(current.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-blue-500 text-blue-500" />
                ))}
              </div>
            </div>

            {/* Right: Content & Metrics */}
            <div className="w-full md:w-2/3 flex flex-col justify-between h-full">
              <div className="relative">
                <Quote className="absolute -top-6 -left-8 w-12 h-12 text-blue-500/10" />
                <p className="text-lg md:text-xl font-medium text-slate-200 leading-relaxed italic">
                  "{current.quote}"
                </p>
              </div>

              <div>
                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 flex flex-col justify-center items-center text-center group hover:border-emerald-500/30 transition-colors">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1">
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                      Growth
                    </div>
                    <div className={`text-xl md:text-2xl font-black ${themeConfig.accentText}`}>
                      {current.primaryMetric}
                    </div>
                  </div>
                  <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 flex flex-col justify-center items-center text-center group hover:border-blue-500/30 transition-colors">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1">
                      <Award className="w-3 h-3 text-blue-400" />
                      Result
                    </div>
                    <div className="text-xl md:text-2xl font-black text-white">
                      {current.secondaryMetric}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-mono font-bold text-blue-400 uppercase tracking-tighter">
                      {current.industry}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                      {current.verifiedBadge}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setSelectedCase(current)}
                    className="flex items-center gap-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl transition-all cursor-pointer border border-slate-700"
                  >
                    Inspect Strategy
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-center gap-4 mt-8">
        <button
          onClick={prevSlide}
          className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-blue-500/50 transition-all cursor-pointer shadow-lg active:scale-90"
          aria-label="Previous testimonial"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <div className="flex gap-2">
          {testimonials.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setDirection(idx > currentIndex ? 1 : -1);
                setCurrentIndex(idx);
              }}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                currentIndex === idx ? "w-8 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "w-2 bg-slate-800 hover:bg-slate-700"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-blue-500/50 transition-all cursor-pointer shadow-lg active:scale-90"
          aria-label="Next testimonial"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Case Study Modal */}
      <AnimatePresence>
        {selectedCase && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4">
                <button 
                  onClick={() => setSelectedCase(null)}
                  className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center">
                  {selectedCase.avatarImage ? (
                    <img 
                      src={selectedCase.avatarImage} 
                      alt={`${selectedCase.name} portrait`} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    <span className="text-xl font-black text-blue-400">{selectedCase.avatarText}</span>
                  )}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">{selectedCase.name}</h4>
                  <p className="text-sm text-slate-400">{selectedCase.role} @ {selectedCase.company}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5">
                  <h5 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest mb-3">Verified Outcome</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-mono text-slate-500 uppercase">Primary Growth</p>
                      <p className="text-xl font-black text-white">{selectedCase.primaryMetric}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-slate-500 uppercase">Business Value</p>
                      <p className="text-xl font-black text-white">{selectedCase.secondaryMetric}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest mb-2">Detailed Quote</h5>
                  <p className="text-sm md:text-base text-slate-300 leading-relaxed italic border-l-2 border-blue-500 pl-4 py-1">
                    "{selectedCase.quote}"
                  </p>
                </div>

                <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
                  <Award className="w-5 h-5 text-emerald-400" />
                  <p className="text-xs font-mono text-slate-400">
                    <span className="text-emerald-400 font-bold">Verification:</span> {selectedCase.verifiedBadge}
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800 flex justify-end">
                <button 
                  onClick={() => setSelectedCase(null)}
                  className={`bg-gradient-to-r ${themeConfig.primaryGradient} text-slate-950 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer`}
                >
                  Close Case
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
