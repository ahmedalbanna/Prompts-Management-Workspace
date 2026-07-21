import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import ReactDOM from "react-dom";
import { ChevronLeft, ChevronRight, PanelLeft, PanelRight, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Context to manage Layout Shell slot states (e.g., collapsed left/right panels, overlay active states)
interface LayoutContextType {
  isLeftOpen: boolean;
  setIsLeftOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleLeft: () => void;
  isRightOpen: boolean;
  setIsRightOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleRight: () => void;
  activeOverlay: ReactNode | null;
  openOverlay: (content: ReactNode) => void;
  closeOverlay: () => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function useLayoutShell() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayoutShell must be used within a LayoutShell");
  }
  return context;
}

export interface LayoutShellProps {
  topSlot?: ReactNode;
  leftSlot?: ReactNode;
  contentSlot?: ReactNode;
  rightSlot?: ReactNode;
  bottomSlot?: ReactNode;
  overlaySlot?: ReactNode;
  children?: ReactNode;
  
  // Initial panel states
  defaultLeftOpen?: boolean;
  defaultRightOpen?: boolean;

  // Controlled panel states
  isLeftOpen?: boolean;
  onToggleLeft?: () => void;
  isRightOpen?: boolean;
  onToggleRight?: () => void;

  // Custom panel titles / badges
  leftTitle?: string;
  rightTitle?: string;
}

/**
 * LayoutShell: Core Architecture Slot System
 * Provides structured slots: TopSlot, LeftSlot, ContentSlot, RightSlot, BottomSlot, OverlayPortal
 * Enhanced with motion animations and state persistence.
 */
export function LayoutShell({
  topSlot,
  leftSlot,
  contentSlot,
  rightSlot,
  bottomSlot,
  overlaySlot,
  children,
  defaultLeftOpen = false,
  defaultRightOpen = false,
  isLeftOpen: externalIsLeftOpen,
  onToggleLeft,
  isRightOpen: externalIsRightOpen,
  onToggleRight,
  leftTitle = "Quick Navigator",
  rightTitle = "Inspector Panel"
}: LayoutShellProps) {
  // Use persistent state for panels
  const [internalLeftOpen, setInternalLeftOpen] = useState(() => {
    const saved = localStorage.getItem("layout-left-open");
    return saved !== null ? JSON.parse(saved) : defaultLeftOpen;
  });
  
  const [internalRightOpen, setInternalRightOpen] = useState(() => {
    const saved = localStorage.getItem("layout-right-open");
    return saved !== null ? JSON.parse(saved) : defaultRightOpen;
  });

  const isLeftOpen = externalIsLeftOpen !== undefined ? externalIsLeftOpen : internalLeftOpen;
  const isRightOpen = externalIsRightOpen !== undefined ? externalIsRightOpen : internalRightOpen;

  const [activeOverlay, setActiveOverlay] = useState<ReactNode | null>(overlaySlot || null);

  useEffect(() => {
    localStorage.setItem("layout-left-open", JSON.stringify(isLeftOpen));
  }, [isLeftOpen]);

  useEffect(() => {
    localStorage.setItem("layout-right-open", JSON.stringify(isRightOpen));
  }, [isRightOpen]);

  const toggleLeft = () => {
    if (onToggleLeft) {
      onToggleLeft();
    } else {
      setInternalLeftOpen((prev: boolean) => !prev);
    }
  };

  const toggleRight = () => {
    if (onToggleRight) {
      onToggleRight();
    } else {
      setInternalRightOpen((prev: boolean) => !prev);
    }
  };

  const setIsLeftOpen = (value: boolean | ((val: boolean) => boolean)) => {
    const next = typeof value === "function" ? value(isLeftOpen) : value;
    if (onToggleLeft) {
      if (next !== isLeftOpen) onToggleLeft();
    } else {
      setInternalLeftOpen(next);
    }
  };

  const setIsRightOpen = (value: boolean | ((val: boolean) => boolean)) => {
    const next = typeof value === "function" ? value(isRightOpen) : value;
    if (onToggleRight) {
      if (next !== isRightOpen) onToggleRight();
    } else {
      setInternalRightOpen(next);
    }
  };

  const openOverlay = (content: ReactNode) => setActiveOverlay(content);
  const closeOverlay = () => setActiveOverlay(null);

  // Sync overlaySlot prop if passed directly
  useEffect(() => {
    if (overlaySlot !== undefined) {
      setActiveOverlay(overlaySlot);
    }
  }, [overlaySlot]);

  return (
    <LayoutContext.Provider
      value={{
        isLeftOpen,
        setIsLeftOpen,
        toggleLeft,
        isRightOpen,
        setIsRightOpen,
        toggleRight,
        activeOverlay,
        openOverlay,
        closeOverlay
      }}
    >
      <div 
        className="min-h-screen bg-[#020617] text-slate-100 flex flex-col justify-between relative overflow-x-hidden font-sans selection:bg-indigo-500/30 selection:text-indigo-200"
        id="layout-shell-root"
      >
        {/* Background ambient glow effects - Refined subtle gradients */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/5 blur-[140px] rounded-full"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/5 blur-[140px] rounded-full"></div>
        </div>

        {/* TOP SLOT */}
        {topSlot && (
          <header className="glass-container sticky top-0 z-40 border-b border-white/5 shadow-xl shadow-black/20" id="layout-top-slot">
            {topSlot}
          </header>
        )}

        {/* MIDDLE SECTION: LeftSlot + ContentSlot + RightSlot */}
        <div className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 py-4 z-10 flex gap-4 relative" id="layout-middle-section">
          
          {/* LEFT SLOT (Animated Sidebar) */}
          <AnimatePresence initial={false}>
            {leftSlot && isLeftOpen && (
              <motion.aside
                id="layout-left-slot"
                initial={{ width: 0, opacity: 0, marginRight: 0 }}
                animate={{ width: 288, opacity: 1, marginRight: 16 }}
                exit={{ width: 0, opacity: 0, marginRight: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="flex flex-col shrink-0"
              >
                <div className="glass-container rounded-2xl p-4 flex flex-col h-full border border-white/10 shadow-2xl bg-slate-900/40 backdrop-blur-xl">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                        <PanelLeft className="h-3.5 w-3.5 text-indigo-400" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{leftTitle}</span>
                    </div>
                    <button
                      onClick={toggleLeft}
                      className="p-1.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {leftSlot}
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* CONTENT SLOT (Main Active Viewport) */}
          <main className="flex-1 min-w-0 transition-all duration-300" id="layout-content-slot">
            <motion.div 
              layout
              className="h-full"
              initial={false}
            >
              {contentSlot || children}
            </motion.div>
          </main>

          {/* RIGHT SLOT (Animated Inspector) */}
          <AnimatePresence initial={false}>
            {rightSlot && isRightOpen && (
              <motion.aside
                id="layout-right-slot"
                initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                animate={{ width: 340, opacity: 1, marginLeft: 16 }}
                exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="flex flex-col shrink-0"
              >
                <div className="glass-container rounded-2xl p-4 flex flex-col h-full border border-white/10 shadow-2xl bg-slate-900/40 backdrop-blur-xl">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                        <PanelRight className="h-3.5 w-3.5 text-indigo-400" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{rightTitle}</span>
                    </div>
                    <button
                      onClick={toggleRight}
                      className="p-1.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {rightSlot}
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

        </div>

        {/* BOTTOM SLOT */}
        {bottomSlot && (
          <footer className="glass-container border-t border-white/5 z-40 bg-slate-950/80 backdrop-blur-md" id="layout-bottom-slot">
            {bottomSlot}
          </footer>
        )}

        {/* OVERLAY PORTAL */}
        <OverlayPortal activeOverlay={activeOverlay} onClose={closeOverlay} />

      </div>
    </LayoutContext.Provider>
  );
}

// Sub-components for declarative Slot building:

export function TopSlot({ children }: { children: ReactNode }) {
  return <div className="w-full h-full">{children}</div>;
}

export function LeftSlot({ children }: { children: ReactNode }) {
  return <div className="w-full h-full">{children}</div>;
}

export function ContentSlot({ children }: { children: ReactNode }) {
  return <div className="w-full h-full">{children}</div>;
}

export function RightSlot({ children }: { children: ReactNode }) {
  return <div className="w-full h-full">{children}</div>;
}

export function BottomSlot({ children }: { children: ReactNode }) {
  return <div className="w-full h-full">{children}</div>;
}

export function OverlayPortal({ 
  activeOverlay, 
  onClose 
}: { 
  activeOverlay?: ReactNode | null; 
  onClose?: () => void;
}) {
  return (
    <AnimatePresence>
      {activeOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm cursor-pointer"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-white/10 p-6 shadow-3xl text-slate-100 z-10"
          >
            {onClose && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer z-10"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            {activeOverlay}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Attach sub-components to LayoutShell for flexible usage
LayoutShell.TopSlot = TopSlot;
LayoutShell.LeftSlot = LeftSlot;
LayoutShell.ContentSlot = ContentSlot;
LayoutShell.RightSlot = RightSlot;
LayoutShell.BottomSlot = BottomSlot;
LayoutShell.OverlayPortal = OverlayPortal;

