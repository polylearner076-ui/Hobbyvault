import React, { useRef, useState, useEffect } from 'react';
import { useVault } from '../../context/VaultContext';
import {
  Sparkles,
  RotateCw,
  Anchor,
  Flame,
  Gamepad2,
  LayoutGrid,
  Plus,
  Box,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SandboxTabsProps {
  onOpenNewSandboxModal: () => void;
}

export const SandboxTabs: React.FC<SandboxTabsProps> = ({ onOpenNewSandboxModal }) => {
  const {
    sandboxes,
    activeSandboxId,
    setActiveSandboxId,
    items,
    formatPrice,
    deleteSandbox,
  } = useVault();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 4);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [sandboxes, items]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkScroll, 300);
    }
  };

  const getIcon = (iconName: string, className = 'w-4 h-4') => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'RotateCw':
        return <RotateCw className={className} />;
      case 'Anchor':
        return <Anchor className={className} />;
      case 'Flame':
        return <Flame className={className} />;
      case 'Gamepad2':
        return <Gamepad2 className={className} />;
      default:
        return <Box className={className} />;
    }
  };

  const getSandboxStats = (sandboxId: string) => {
    const sbItems = sandboxId === 'all' ? items : items.filter((i) => i.sandboxId === sandboxId);
    const count = sbItems.reduce((acc, i) => acc + i.quantity, 0);
    const valueUSD = sbItems.reduce((acc, i) => acc + i.currentPriceUSD * i.quantity, 0);
    return { count, valueUSD };
  };

  const allStats = getSandboxStats('all');

  // Filter out any legacy watches tabs
  const displaySandboxes = sandboxes.filter(
    (sb) =>
      sb.id !== 'sandbox-watches' &&
      sb.id !== 'watches' &&
      sb.type !== 'watches' &&
      sb.name.toLowerCase() !== 'watches'
  );

  return (
    <div className="relative w-full border-b border-black/[0.06] bg-[#F2F2F7] group/tabs">
      {/* Left Scroll Indicator / Button */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center pl-1 sm:pl-2 bg-gradient-to-r from-[#F2F2F7] via-[#F2F2F7]/90 to-transparent pr-4 pointer-events-none">
          <button
            type="button"
            onClick={() => scroll('left')}
            className="w-7 h-7 rounded-full bg-white shadow-md border border-black/[0.08] flex items-center justify-center text-[#1C1C1E] hover:bg-[#F2F2F7] hover:scale-105 active:scale-95 transition-all pointer-events-auto cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Right Scroll Indicator / Button */}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center pr-1 sm:pl-4 bg-gradient-to-l from-[#F2F2F7] via-[#F2F2F7]/90 to-transparent pl-4 pointer-events-none">
          <button
            type="button"
            onClick={() => scroll('right')}
            className="w-7 h-7 rounded-full bg-white shadow-md border border-black/[0.08] flex items-center justify-center text-[#1C1C1E] hover:bg-[#F2F2F7] hover:scale-105 active:scale-95 transition-all pointer-events-auto cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScroll}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        className="w-full overflow-x-auto py-2 touch-pan-x overscroll-x-contain scroll-smooth [&::-webkit-scrollbar]:hidden"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center gap-1.5 sm:gap-2 w-max pr-8 sm:pr-6">
          {/* All Portfolios Tab */}
          <button
            id="tab-sandbox-all"
            onClick={() => setActiveSandboxId('all')}
            className={`shrink-0 group flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
              activeSandboxId === 'all'
                ? 'bg-white text-[#1C1C1E] shadow-xs border border-black/[0.06]'
                : 'text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-black/[0.03] border border-transparent'
            }`}
          >
            <div
              className={`w-5 h-5 sm:w-6 sm:h-6 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                activeSandboxId === 'all' ? 'bg-[#007AFF] text-white shadow-2xs' : 'bg-black/[0.05] text-[#8E8E93] group-hover:text-[#1C1C1E]'
              }`}
            >
              <LayoutGrid className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
            <div className="flex flex-col text-left whitespace-nowrap">
              <span className="leading-tight font-bold">All Portfolios</span>
              <span className="text-[10px] font-medium text-[#8E8E93]">
                {allStats.count} items • {formatPrice(allStats.valueUSD)}
              </span>
            </div>
          </button>

          {/* Individual Sandboxes */}
          {displaySandboxes.map((sb) => {
            const stats = getSandboxStats(sb.id);
            const isActive = activeSandboxId === sb.id;

            return (
              <div key={sb.id} className="relative group/tab shrink-0">
                <button
                  id={`tab-sandbox-${sb.id}`}
                  onClick={() => setActiveSandboxId(sb.id)}
                  className={`flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#1C1C1E] shadow-xs border border-black/[0.06]'
                      : 'text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-black/[0.03] border border-transparent'
                  }`}
                >
                  <div
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-xl flex items-center justify-center transition-colors shadow-2xs shrink-0"
                    style={{
                      backgroundColor: isActive ? sb.themeColor : `${sb.themeColor}15`,
                      color: isActive ? '#fff' : sb.themeColor,
                    }}
                  >
                    {getIcon(sb.iconName, 'w-3 h-3 sm:w-3.5 sm:h-3.5')}
                  </div>
                  <div className="flex flex-col text-left whitespace-nowrap">
                    <span className="leading-tight font-bold">{sb.name}</span>
                    <span className="text-[10px] font-medium text-[#8E8E93]">
                      {stats.count} items • {formatPrice(stats.valueUSD)}
                    </span>
                  </div>
                </button>

                {/* Close/Delete tab button for custom sandboxes or agent result windows */}
                {(sb.id.startsWith('sandbox-custom') || sb.id.startsWith('sandbox-agent') || sb.isAgentResult || sb.id === 'sandbox-watches' || sb.id === 'watches') && (
                  <button
                    id={`btn-delete-sandbox-${sb.id}`}
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (activeSandboxId === sb.id) {
                        setActiveSandboxId('all');
                      }
                      await deleteSandbox(sb.id);
                    }}
                    title={sb.isAgentResult ? 'Close this Agent Window' : 'Delete this vault'}
                    className="absolute -top-1 -right-1 hidden group-hover/tab:flex w-4 h-4 rounded-full bg-[#FF3B30] text-white items-center justify-center text-[10px] hover:bg-red-600 shadow cursor-pointer transition-transform hover:scale-110"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}

          {/* Add New Sandbox Button */}
          <button
            id="btn-add-new-sandbox-tab"
            onClick={onOpenNewSandboxModal}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold text-[#007AFF] hover:bg-[#007AFF]/10 border border-dashed border-[#007AFF]/30 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Hobby Vault</span>
          </button>
        </div>
      </div>
    </div>
  );
};
