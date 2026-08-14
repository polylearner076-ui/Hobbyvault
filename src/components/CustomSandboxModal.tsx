import React, { useState } from 'react';
import { useVault } from '../context/VaultContext';
import {
  X,
  Plus,
  Sparkles,
  RotateCw,
  Anchor,
  Flame,
  Gamepad2,
  Box,
  Layers,
  Check,
} from 'lucide-react';
import { HobbyType } from '../types';

interface CustomSandboxModalProps {
  onClose: () => void;
}

export const CustomSandboxModal: React.FC<CustomSandboxModalProps> = ({ onClose }) => {
  const { addSandbox } = useVault();

  const [name, setName] = useState('');
  const [type, setType] = useState<HobbyType>('custom');
  const [description, setDescription] = useState('');
  const [themeColor, setThemeColor] = useState('#007AFF');
  const [iconName, setIconName] = useState('Box');

  const colorPresets = [
    { label: 'Blue', color: '#007AFF' },
    { label: 'Purple', color: '#AF52DE' },
    { label: 'Amber', color: '#FF9500' },
    { label: 'Crimson', color: '#FF3B30' },
    { label: 'Mint', color: '#34C759' },
    { label: 'Teal', color: '#30B0C7' },
    { label: 'Indigo', color: '#5856D6' },
    { label: 'Pink', color: '#FF2D55' },
  ];

  const iconOptions = [
    { name: 'Box', icon: <Box className="w-4 h-4" /> },
    { name: 'Sparkles', icon: <Sparkles className="w-4 h-4" /> },
    { name: 'RotateCw', icon: <RotateCw className="w-4 h-4" /> },
    { name: 'Flame', icon: <Flame className="w-4 h-4" /> },
    { name: 'Anchor', icon: <Anchor className="w-4 h-4" /> },
    { name: 'Gamepad2', icon: <Gamepad2 className="w-4 h-4" /> },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addSandbox({
      name: name.trim(),
      type,
      description: description.trim() || `Dedicated vault for ${name.trim()} collectibles`,
      themeColor,
      iconName,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/30 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div
        id="custom-sandbox-modal"
        className="relative w-full max-w-lg rounded-3xl bg-white border border-black/[0.08] shadow-2xl overflow-hidden flex flex-col my-auto text-[#1C1C1E]"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06] bg-[#F2F2F7]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#1C1C1E] tracking-wide">
              Create New Hobby Vault Sandbox
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white hover:bg-black/[0.05] text-[#8E8E93] hover:text-[#1C1C1E] border border-black/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="text-[11px] font-bold text-[#8E8E93] block mb-1">
              Vault Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Disney Lorcana, Gunpla / Gundam, Hot Wheels, Warhammer..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#F2F2F7] border border-black/[0.08] rounded-xl text-[#1C1C1E] text-xs sm:text-sm placeholder-[#8E8E93] focus:outline-none focus:border-[#007AFF]"
              autoFocus
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#8E8E93] block mb-1">
              Category Type
            </label>
            <select
              value={type}
              onChange={(e: any) => setType(e.target.value)}
              className="w-full px-3 py-2 bg-[#F2F2F7] border border-black/[0.08] rounded-xl text-[#1C1C1E] font-medium focus:outline-none focus:border-[#007AFF]"
            >
              <option value="custom">Custom Collectibles Sandbox</option>
              <option value="pokemon">TCG / Trading Cards</option>
              <option value="beyblade">Spinning Tops / Action Toys</option>
              <option value="gaming">Video Games & Hardware</option>
              <option value="mtg">Card Strategy Game</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#8E8E93] block mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Sealed booster packs, graded singles, tournament blades..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[#F2F2F7] border border-black/[0.08] rounded-xl text-[#1C1C1E] text-xs placeholder-[#8E8E93] focus:outline-none focus:border-[#007AFF]"
            />
          </div>

          {/* Theme Color Presets */}
          <div>
            <label className="text-[11px] font-bold text-[#8E8E93] block mb-1.5">
              Accent Theme Color
            </label>
            <div className="flex flex-wrap gap-2">
              {colorPresets.map((c) => (
                <button
                  key={c.color}
                  type="button"
                  onClick={() => setThemeColor(c.color)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                    themeColor === c.color ? 'scale-110 ring-2 ring-[#007AFF] shadow-md' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.color }}
                >
                  {themeColor === c.color && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="text-[11px] font-bold text-[#8E8E93] block mb-1.5">
              Vault Icon
            </label>
            <div className="flex gap-2">
              {iconOptions.map((opt) => (
                <button
                  key={opt.name}
                  type="button"
                  onClick={() => setIconName(opt.name)}
                  className={`p-2.5 rounded-xl border transition-colors flex items-center justify-center ${
                    iconName === opt.name
                      ? 'bg-[#007AFF]/10 border-[#007AFF] text-[#007AFF]'
                      : 'bg-[#F2F2F7] border-black/[0.06] text-[#8E8E93] hover:text-[#1C1C1E]'
                  }`}
                >
                  {opt.icon}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-black/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-[#8E8E93] hover:text-[#1C1C1E] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#007AFF] hover:bg-[#0066D6] text-white font-bold text-xs shadow-sm"
            >
              Create Sandbox
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
