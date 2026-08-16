import React from 'react';
import { useVault } from '../../context/VaultContext';
import {
  Sparkles,
  RotateCw,
  Anchor,
  Flame,
  Gamepad2,
  Layers,
  Plus,
  Box,
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

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2.5 border-b border-black/[0.06] bg-[#F2F2F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 min-w-max">
        {/* All Portfolios Tab */}
        <button
          id="tab-sandbox-all"
          onClick={() => setActiveSandboxId('all')}
          className={`group flex items-center gap-2.5 px-4 py-2 rounded-2xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
            activeSandboxId === 'all'
              ? 'bg-white text-[#1C1C1E] shadow-sm border border-black/[0.06]'
              : 'text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-black/[0.03] border border-transparent'
          }`}
        >
          <div
            className={`w-6 h-6 rounded-xl flex items-center justify-center transition-colors ${
              activeSandboxId === 'all' ? 'bg-[#007AFF] text-white shadow-sm' : 'bg-black/[0.05] text-[#8E8E93] group-hover:text-[#1C1C1E]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="leading-tight font-bold">All Portfolios</span>
            <span className="text-[10px] font-medium text-[#8E8E93]">
              {allStats.count} items • {formatPrice(allStats.valueUSD)}
            </span>
          </div>
        </button>

        {/* Individual Sandboxes */}
        {sandboxes.map((sb) => {
          const stats = getSandboxStats(sb.id);
          const isActive = activeSandboxId === sb.id;

          return (
            <div key={sb.id} className="relative group/tab">
              <button
                id={`tab-sandbox-${sb.id}`}
                onClick={() => setActiveSandboxId(sb.id)}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-white text-[#1C1C1E] shadow-sm border border-black/[0.06]'
                    : 'text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-black/[0.03] border border-transparent'
                }`}
              >
                <div
                  className="w-6 h-6 rounded-xl flex items-center justify-center transition-colors shadow-sm"
                  style={{
                    backgroundColor: isActive ? sb.themeColor : `${sb.themeColor}15`,
                    color: isActive ? '#fff' : sb.themeColor,
                  }}
                >
                  {getIcon(sb.iconName, 'w-3.5 h-3.5')}
                </div>
                <div className="flex flex-col text-left">
                  <span className="leading-tight font-bold">{sb.name}</span>
                  <span className="text-[10px] font-medium text-[#8E8E93]">
                    {stats.count} items • {formatPrice(stats.valueUSD)}
                  </span>
                </div>
              </button>

              {/* Custom sandbox delete button (if user created custom) */}
              {sb.id.startsWith('sandbox-custom') && (
                <button
                  id={`btn-delete-sandbox-${sb.id}`}
                  onClick={async (e) => {
                    e.stopPropagation();
                    await deleteSandbox(sb.id);
                  }}
                  title="Delete this custom sandbox"
                  className="absolute -top-1 -right-1 hidden group-hover/tab:flex w-4 h-4 rounded-full bg-[#FF3B30] text-white items-center justify-center text-[10px] hover:bg-red-600 shadow cursor-pointer"
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
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold text-[#007AFF] hover:bg-[#007AFF]/10 border border-dashed border-[#007AFF]/30 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Hobby Vault</span>
        </button>
      </div>
    </div>
  );
};
