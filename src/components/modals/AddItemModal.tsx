import React, { useState, useMemo } from 'react';
import { useVault } from '../../context/VaultContext';
import { POPULAR_CATALOG_ITEMS } from '../../data/initialData';
import { lookupLiveMarketPrice } from '../../services/api';
import {
  X,
  Search,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { HobbyType, ItemCondition } from '../../types';

interface AddItemModalProps {
  onClose: () => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({ onClose }) => {
  const { sandboxes, activeSandboxId, addItem, formatPrice } = useVault();

  const [activeTab, setActiveTab] = useState<'catalog' | 'custom'>('catalog');
  const [catalogSearch, setCatalogSearch] = useState('');

  // Custom Item Form State
  const [name, setName] = useState('');
  const [sandboxId, setSandboxId] = useState<string>(
    activeSandboxId !== 'all' ? activeSandboxId : sandboxes[0]?.id || 'sandbox-pokemon'
  );
  const [category, setCategory] = useState<HobbyType>('pokemon');
  const [imageUrl, setImageUrl] = useState('');
  const [currentPriceUSD, setCurrentPriceUSD] = useState('25.00');
  const [purchasePriceUSD, setPurchasePriceUSD] = useState('20.00');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantity, setQuantity] = useState('1');
  const [condition, setCondition] = useState<ItemCondition>('RAW_NM');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');

  // beyblade / card specific specs
  const [bbGen, setBbGen] = useState<'Beyblade X' | 'Burst' | 'Metal Fight' | 'Original / Plastics' | 'Other'>('Beyblade X');
  const [bbType, setBbType] = useState<'Attack' | 'Defense' | 'Stamina' | 'Balance'>('Attack');
  const [bbBlade, setBbBlade] = useState('');
  const [bbRatchet, setBbRatchet] = useState('3-60');
  const [bbBit, setBbBit] = useState('Flat');
  const [bbBrand, setBbBrand] = useState<'Takara Tomy' | 'Hasbro'>('Takara Tomy');

  // Card specific specs
  const [cardSet, setCardSet] = useState('');
  const [cardRarity, setCardRarity] = useState('');
  const [gradingCompany, setGradingCompany] = useState<'PSA' | 'BGS' | 'CGC' | 'None'>('None');
  const [gradeValue, setGradeValue] = useState('10');
  const [certNumber, setCertNumber] = useState('');

  // Physical Storage Location State
  const [metaStorage, setMetaStorage] = useState('Master Fireproof Safe (Office)');
  const [container, setContainer] = useState('VaultX 12-Pocket Premium Zip Binder');
  const [slot, setSlot] = useState('Page 1, Slot 1');
  const [storageNotes, setStorageNotes] = useState('');

  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<string | null>(null);

  // Sync category with selected sandbox
  const handleSandboxChange = (sbId: string) => {
    setSandboxId(sbId);
    const match = sandboxes.find((s) => s.id === sbId);
    if (match) {
      setCategory(match.type);
    }
  };

  // Filter Catalog
  const filteredCatalog = useMemo(() => {
    if (!catalogSearch.trim()) return POPULAR_CATALOG_ITEMS;
    const q = catalogSearch.toLowerCase();
    return POPULAR_CATALOG_ITEMS.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [catalogSearch]);

  // Handle Quick Add from Catalog
  const handleQuickAdd = async (catalogItem: (typeof POPULAR_CATALOG_ITEMS)[0]) => {
    const targetSandboxId =
      activeSandboxId !== 'all'
        ? activeSandboxId
        : sandboxes.find((s) => s.type === catalogItem.category)?.id || sandboxes[0]?.id || 'sandbox-pokemon';

    // Assign default storage based on category
    const defaultStorage = catalogItem.category === 'beyblade'
      ? {
          metaStorage: 'Display Cabinet (Living Room)',
          container: 'Acrylic Display Showcase Tier 1',
          slot: 'Pedestal Showcase',
          notes: 'Display casing enclosed',
        }
      : {
          metaStorage: 'Master Fireproof Safe (Office)',
          container: 'VaultX 12-Pocket Premium Zip Binder',
          slot: 'Page 1, Slot 1',
          notes: 'Standard collector sleeve',
        };

    await addItem({
      sandboxId: targetSandboxId,
      name: catalogItem.name,
      category: catalogItem.category as HobbyType,
      imageUrl: catalogItem.imageUrl,
      currentPriceUSD: catalogItem.currentPriceUSD,
      purchasePriceUSD: Number((catalogItem.currentPriceUSD * 0.85).toFixed(2)),
      purchaseDate: new Date().toISOString().split('T')[0],
      quantity: 1,
      condition: 'RAW_NM',
      tags: catalogItem.tags,
      priceHistory: [],
      beybladeSpecs: (catalogItem as any).beybladeSpecs,
      cardSpecs: (catalogItem as any).cardSpecs,
      storageLocation: defaultStorage,
      transactions: [
        {
          id: `tx-${Date.now()}`,
          type: 'BUY',
          date: new Date().toISOString().split('T')[0],
          quantity: 1,
          priceUSD: Number((catalogItem.currentPriceUSD * 0.85).toFixed(2)),
          notes: 'Added from catalog',
        },
      ],
      isFavorite: false,
    });
    onClose();
  };

  // Live price estimation for custom entry
  const handleEstimatePrice = async () => {
    if (!name.trim()) {
      alert('Please enter an item name first');
      return;
    }
    try {
      setIsFetchingPrice(true);
      setFetchStatus('Pulling live comps from market API...');
      const res = await lookupLiveMarketPrice({ name, category, condition });

      if (res && res.currentPriceUSD) {
        setCurrentPriceUSD(res.currentPriceUSD.toString());
        setPurchasePriceUSD((res.currentPriceUSD * 0.85).toFixed(2));
        setFetchStatus(`Live market price found: ${res.currentPriceUSD} (${res.marketSource || 'API'})`);
      } else {
        setFetchStatus('No live price feed found, using default estimate.');
      }
    } catch {
      setFetchStatus('Price check error.');
    } finally {
      setIsFetchingPrice(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const curPrice = parseFloat(currentPriceUSD) || 10;
    const buyPrice = parseFloat(purchasePriceUSD) || curPrice;
    const qty = parseInt(quantity, 10) || 1;

    const parsedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const defaultImg =
      category === 'beyblade'
        ? 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80'
        : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';

    await addItem({
      sandboxId,
      name: name.trim(),
      category,
      imageUrl: imageUrl.trim() || defaultImg,
      currentPriceUSD: curPrice,
      purchasePriceUSD: buyPrice,
      purchaseDate,
      quantity: qty,
      condition,
      tags: parsedTags.length > 0 ? parsedTags : [category.toUpperCase()],
      notes,
      priceHistory: [],
      beybladeSpecs:
        category === 'beyblade'
          ? {
              generation: bbGen,
              type: bbType,
              spinDirection: 'Right',
              blade: bbBlade || name,
              ratchet: bbRatchet,
              bit: bbBit,
              brand: bbBrand,
            }
          : undefined,
      cardSpecs:
        category === 'pokemon' || category === 'onepiece' || category === 'mtg' || category === 'yugioh'
          ? {
              game: (category === 'pokemon' ? 'Pokemon' : category === 'onepiece' ? 'One Piece' : 'Magic: The Gathering') as any,
              setName: cardSet || 'Standard Set',
              rarity: cardRarity || 'Rare',
              gradingCompany,
              gradeValue: gradingCompany !== 'None' ? gradeValue : undefined,
              certNumber: certNumber || undefined,
            }
          : undefined,
      storageLocation: {
        metaStorage: metaStorage.trim() || undefined,
        container: container.trim() || undefined,
        slot: slot.trim() || undefined,
        notes: storageNotes.trim() || undefined,
      },
      transactions: [
        {
          id: `tx-${Date.now()}`,
          type: 'BUY',
          date: purchaseDate,
          quantity: qty,
          priceUSD: buyPrice,
          notes: notes || 'Initial purchase lot',
        },
      ],
      isFavorite: false,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/30 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div
        id="add-item-modal"
        className="relative w-full max-w-2xl rounded-3xl bg-white border border-black/[0.08] shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh] text-[#1C1C1E]"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06] bg-[#F2F2F7]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#1C1C1E] tracking-wide">Add New Collectible Asset</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white hover:bg-black/[0.05] text-[#8E8E93] hover:text-[#1C1C1E] border border-black/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 border-b border-black/[0.06] bg-[#F2F2F7]/50 flex gap-2">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'catalog'
                ? 'border-[#007AFF] text-[#007AFF]'
                : 'border-transparent text-[#8E8E93] hover:text-[#1C1C1E]'
            }`}
          >
            Popular Catalog Search
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'custom'
                ? 'border-[#007AFF] text-[#007AFF]'
                : 'border-transparent text-[#8E8E93] hover:text-[#1C1C1E]'
            }`}
          >
            Custom Item / Manual Entry
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'catalog' ? (
            <div className="space-y-4">
              {/* Catalog Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Search Pokémon cards, Beyblade X releases, MTG, One Piece..."
                  className="w-full pl-9 pr-4 py-2.5 bg-[#F2F2F7] border border-black/[0.08] rounded-xl text-xs sm:text-sm text-[#1C1C1E] placeholder-[#8E8E93] focus:outline-none focus:border-[#007AFF]"
                  autoFocus
                />
              </div>

              {/* Catalog Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                {filteredCatalog.map((catItem, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#F2F2F7] border border-black/[0.06] hover:bg-black/[0.03] transition-colors"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <img
                        src={catItem.imageUrl}
                        alt={catItem.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 object-contain rounded-lg bg-white p-1 border border-black/[0.06] shrink-0"
                      />
                      <div className="truncate">
                        <div className="font-bold text-xs text-[#1C1C1E] truncate">{catItem.name}</div>
                        <div className="text-[11px] text-[#007AFF] font-mono font-semibold mt-0.5">
                          {formatPrice(catItem.currentPriceUSD)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleQuickAdd(catItem)}
                      className="ml-2 px-3 py-1.5 rounded-xl bg-[#007AFF] hover:bg-[#0066D6] text-white font-bold text-xs flex items-center gap-1 shrink-0 shadow-sm cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Add</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Custom Form */
            <form onSubmit={handleCustomSubmit} className="space-y-4 text-xs">
              {/* Target Sandbox */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#8E8E93] block mb-1">
                    Target Hobby Sandbox / Vault *
                  </label>
                  <select
                    value={sandboxId}
                    onChange={(e) => handleSandboxChange(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F2F2F7] border border-black/[0.08] rounded-xl text-[#1C1C1E] font-medium focus:outline-none focus:border-[#007AFF]"
                  >
                    {sandboxes.map((sb) => (
                      <option key={sb.id} value={sb.id}>
                        {sb.name} ({sb.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#8E8E93] block mb-1">
                    Hobby Category
                  </label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F2F2F7] border border-black/[0.08] rounded-xl text-[#1C1C1E] font-medium focus:outline-none focus:border-[#007AFF]"
                  >
                    <option value="pokemon">Pokémon TCG</option>
                    <option value="beyblade">Beyblade</option>
                    <option value="onepiece">One Piece TCG</option>
                    <option value="mtg">Magic: The Gathering</option>
                    <option value="yugioh">Yu-Gi-Oh!</option>
                    <option value="gaming">Retro / Modern Gaming</option>
                    <option value="tcg_general">Other Collectible</option>
                  </select>
                </div>
              </div>

              {/* Item Name & Live Price Fetcher */}
              <div>
                <label className="text-[11px] font-bold text-[#8E8E93] block mb-1">
                  Item Name / Card Title *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cobalt Drake 4-60F, Charizard ex #199/165, Black Lotus..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[#F2F2F7] border border-black/[0.08] rounded-xl text-[#1C1C1E] text-xs focus:outline-none focus:border-[#007AFF]"
                  />
                  <button
                    type="button"
                    onClick={handleEstimatePrice}
                    disabled={isFetchingPrice}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#007AFF]/10 hover:bg-[#007AFF]/15 text-[#007AFF] border border-[#007AFF]/20 font-semibold text-xs transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isFetchingPrice ? 'animate-spin' : ''}`} />
                    <span>Fetch Price</span>
                  </button>
                </div>
                {fetchStatus && <div className="text-[11px] text-[#007AFF] mt-1 font-medium">{fetchStatus}</div>}
              </div>

              {/* Pricing, Quantity & Condition */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#8E8E93] block mb-1">
                    Market Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={currentPriceUSD}
                    onChange={(e) => setCurrentPriceUSD(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F2F2F7] border border-black/[0.08] rounded-xl text-[#1C1C1E] font-mono focus:outline-none focus:border-[#007AFF]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#8E8E93] block mb-1">
                    Buy Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={purchasePriceUSD}
                    onChange={(e) => setPurchasePriceUSD(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F2F2F7] border border-black/[0.08] rounded-xl text-[#1C1C1E] font-mono focus:outline-none focus:border-[#007AFF]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#8E8E93] block mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F2F2F7] border border-black/[0.08] rounded-xl text-[#1C1C1E] font-mono focus:outline-none focus:border-[#007AFF]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#8E8E93] block mb-1">
                    Condition / Grade
                  </label>
                  <select
                    value={condition}
                    onChange={(e: any) => setCondition(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F2F2F7] border border-black/[0.08] rounded-xl text-[#1C1C1E] focus:outline-none focus:border-[#007AFF]"
                  >
                    <option value="RAW_NM">Raw Near Mint</option>
                    <option value="PSA_10">PSA 10 Gem Mint</option>
                    <option value="PSA_9">PSA 9 Mint</option>
                    <option value="BGS_10">BGS 10 Pristine</option>
                    <option value="CGC_10">CGC 10 Pristine</option>
                    <option value="NIB">New in Box (NIB)</option>
                    <option value="MINT_IN_BOX">Mint in Box</option>
                    <option value="RAW_LP">Raw Lightly Played</option>
                  </select>
                </div>
              </div>

              {/* Beyblade Specific Fields */}
              {category === 'beyblade' && (
                <div className="p-3 rounded-2xl bg-[#F2F2F7] border border-black/[0.06] space-y-2">
                  <div className="text-[11px] font-bold text-[#007AFF] uppercase tracking-wider">
                    Beyblade Parameters
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="text-[10px] text-[#8E8E93] font-bold block">Generation</label>
                      <select
                        value={bbGen}
                        onChange={(e: any) => setBbGen(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-black/[0.08] rounded-lg text-[#1C1C1E] focus:outline-none focus:border-[#007AFF]"
                      >
                        <option value="Beyblade X">Beyblade X</option>
                        <option value="Burst">Beyblade Burst</option>
                        <option value="Metal Fight">Metal Fight (MFB)</option>
                        <option value="Original / Plastics">Original / Plastics</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-[#8E8E93] font-bold block">Type</label>
                      <select
                        value={bbType}
                        onChange={(e: any) => setBbType(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-black/[0.08] rounded-lg text-[#1C1C1E] focus:outline-none focus:border-[#007AFF]"
                      >
                        <option value="Attack">Attack</option>
                        <option value="Defense">Defense</option>
                        <option value="Stamina">Stamina</option>
                        <option value="Balance">Balance</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-[#8E8E93] font-bold block">Ratchet / Track</label>
                      <input
                        type="text"
                        placeholder="e.g. 3-60, 5-70"
                        value={bbRatchet}
                        onChange={(e) => setBbRatchet(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-black/[0.08] rounded-lg text-[#1C1C1E] focus:outline-none focus:border-[#007AFF]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#8E8E93] font-bold block">Bit / Tip</label>
                      <input
                        type="text"
                        placeholder="e.g. Flat, Ball, Needle"
                        value={bbBit}
                        onChange={(e) => setBbBit(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-black/[0.08] rounded-lg text-[#1C1C1E] focus:outline-none focus:border-[#007AFF]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Physical Storage Location Section */}
              <div className="p-3.5 rounded-2xl bg-[#F2F2F7] border border-black/[0.06] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-bold text-[#007AFF] uppercase tracking-wider flex items-center gap-1.5">
                    <span>Physical Storage & Placement</span>
                  </div>
                  <span className="text-[10px] text-[#8E8E93]">Organize in binder, safe, or display box</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10px] text-[#8E8E93] font-bold block mb-1">
                      1. Meta Storage / Safe
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Master Fireproof Safe"
                      value={metaStorage}
                      onChange={(e) => setMetaStorage(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E] focus:outline-none focus:border-[#007AFF]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#8E8E93] font-bold block mb-1">
                      2. Container / Binder
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. VaultX 12-Pocket Binder"
                      value={container}
                      onChange={(e) => setContainer(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E] focus:outline-none focus:border-[#007AFF]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#8E8E93] font-bold block mb-1">
                      3. Slot / Page Position
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Page 1, Slot 1"
                      value={slot}
                      onChange={(e) => setSlot(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E] focus:outline-none focus:border-[#007AFF]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-[#8E8E93] font-bold block mb-1">
                    Storage Protection / Sleeve Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Double sleeved + Toploader + Silica Gel"
                    value={storageNotes}
                    onChange={(e) => setStorageNotes(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E] focus:outline-none focus:border-[#007AFF]"
                  />
                </div>
              </div>

              {/* Image URL & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#8E8E93] block mb-1">
                    Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://images... (leave blank for high-res placeholder)"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F2F2F7] border border-black/[0.08] rounded-xl text-[#1C1C1E] text-xs focus:outline-none focus:border-[#007AFF]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#8E8E93] block mb-1">
                    Tags (Comma Separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 151, Grail, Rare Bey Get, Alt Art"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F2F2F7] border border-black/[0.08] rounded-xl text-[#1C1C1E] text-xs focus:outline-none focus:border-[#007AFF]"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-[#8E8E93] hover:text-[#1C1C1E] font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#007AFF] hover:bg-[#0066D6] text-white font-bold text-xs shadow-sm cursor-pointer"
                >
                  Add to Vault
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
