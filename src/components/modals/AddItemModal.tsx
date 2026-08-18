import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useVault } from '../../context/VaultContext';
import { lookupLiveMarketPrice, searchOnlineSuggestions, SearchSuggestionResult } from '../../services/api';
import {
  X,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Globe,
  Tag,
  Box,
  MapPin,
  Layers,
  ArrowRight,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Plus,
  Trash2,
  Copy,
  Info,
  Scale,
  ShieldAlert,
} from 'lucide-react';
import { HobbyType, ItemCondition, AssetCopy, FragilityLevel, CategoryTypeMeta } from '../../types';
import { CONDITION_METAS, getConditionMeta, calculateCopyValue } from '../../utils/conditionUtils';
import { CATEGORY_GROUPS, getAllCategoryMetas, getCategoryMeta } from '../../utils/categoryUtils';
import { CollectibleImage } from '../common/CollectibleImage';

interface AddItemModalProps {
  onClose: () => void;
}

interface NewCopyDraft {
  id: string;
  condition: ItemCondition;
  customConditionLabel: string;
  purchasePriceUSD: string;
  purchaseDate: string;
  storageMeta: string;
  storageContainer: string;
  storageSlot: string;
  notes: string;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({ onClose }) => {
  const {
    sandboxes,
    activeSandboxId,
    addItem,
    items,
    formatPrice,
    storageUnits,
    categoryMetas,
    addCustomCategoryMeta,
  } = useVault();

  // Determine initial sandbox and its category
  const activeSb = sandboxes.find((s) => s.id === activeSandboxId) || sandboxes[0];
  const initialSandboxId = activeSb ? activeSb.id : (sandboxes[0]?.id || 'sandbox-pokemon');
  const initialCategory = (activeSb ? activeSb.type : (sandboxes[0]?.type || 'pokemon')) as HobbyType;

  // Custom Item Form State
  const [name, setName] = useState('');
  const [sandboxId, setSandboxId] = useState<string>(initialSandboxId);
  const [category, setCategory] = useState<HobbyType>(initialCategory);
  const [imageUrl, setImageUrl] = useState('');
  const [currentPriceUSD, setCurrentPriceUSD] = useState('25.00');
  const [purchasePriceUSD, setPurchasePriceUSD] = useState('20.00');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantity, setQuantity] = useState('1');
  const [condition, setCondition] = useState<ItemCondition>('RAW_NM');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');

  // Multi-copy toggle & state (for assets with multiple copies in different conditions)
  const [useMultiCopies, setUseMultiCopies] = useState(false);
  const [copiesDrafts, setCopiesDrafts] = useState<NewCopyDraft[]>([
    {
      id: 'draft-copy-1',
      condition: 'RAW_NM',
      customConditionLabel: 'Near Mint',
      purchasePriceUSD: '20.00',
      purchaseDate: new Date().toISOString().split('T')[0],
      storageMeta: 'Master Fireproof Safe (Office)',
      storageContainer: 'VaultX 12-Pocket Premium Zip Binder',
      storageSlot: 'Page 1, Slot 1',
      notes: '',
    },
    {
      id: 'draft-copy-2',
      condition: 'RAW_LP',
      customConditionLabel: 'Well Condition (Light Play)',
      purchasePriceUSD: '15.00',
      purchaseDate: new Date().toISOString().split('T')[0],
      storageMeta: 'Master Fireproof Safe (Office)',
      storageContainer: 'VaultX 12-Pocket Premium Zip Binder',
      storageSlot: 'Page 1, Slot 2',
      notes: '',
    },
  ]);

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
  const [weightGrams, setWeightGrams] = useState('');
  const [fragility, setFragility] = useState<FragilityLevel>('LOW');
  const [fragilityNotes, setFragilityNotes] = useState('');

  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<string | null>(null);

  // Debounced Online Suggestions State
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestionResult[]>([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);
  const [autoFilledNotice, setAutoFilledNotice] = useState<string | null>(null);
  const [hasDismissedSuggestions, setHasDismissedSuggestions] = useState(false);
  const dropdownContainerRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Inline custom category creator state
  const [showNewCategoryInline, setShowNewCategoryInline] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#007AFF');
  const [newCategoryIcon, setNewCategoryIcon] = useState('Sparkles');

  const allCategoryMetas = categoryMetas && categoryMetas.length > 0 ? categoryMetas : getAllCategoryMetas();

  // Reflect ONLY current existing categories from sandboxes, items, and custom user categories
  const existingCategories = useMemo(() => {
    const set = new Set<string>();
    sandboxes.forEach((s) => {
      if (s.type) set.add(s.type);
    });
    items.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    categoryMetas.filter((m) => m.isCustom).forEach((m) => set.add(m.id));

    // If empty, supply default active category
    if (set.size === 0) {
      set.add(category || 'pokemon');
    }

    return Array.from(set).map((catId) => getCategoryMeta(catId));
  }, [sandboxes, items, categoryMetas, category]);

  const handleCreateCustomCategoryInline = () => {
    if (!newCategoryLabel.trim()) return;
    const cleanName = newCategoryLabel.trim();
    const id = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newMeta: CategoryTypeMeta = {
      id,
      label: cleanName,
      group: 'Custom Hobby Categories',
      defaultColor: newCategoryColor,
      iconName: newCategoryIcon,
      isCustom: true,
      description: `Custom ${cleanName} collection`,
    };
    addCustomCategoryMeta(newMeta);
    setCategory(id as HobbyType);
    setShowNewCategoryInline(false);
    setNewCategoryLabel('');
  };

  const getSearchPlaceholder = (cat: HobbyType) => {
    switch (cat) {
      case 'watches':
        return 'e.g. Rolex Submariner 126610LN, Omega Speedmaster, Daytona...';
      case 'sneakers':
        return 'e.g. Nike SB Chunky Dunky, Travis Scott Jordan 1 Low, Chicago OG...';
      case 'lego':
        return 'e.g. LEGO Star Wars Millennium Falcon 75192, Rivendell 10316...';
      case 'gunpla':
        return 'e.g. MGEX Strike Freedom, PG Unleashed RX-78-2, RG Hi-Nu...';
      case 'diecast':
        return 'e.g. Hot Wheels RLC Datsun 240Z, Super Treasure Hunt, Skyline...';
      case 'action_figures':
        return 'e.g. S.H.Figuarts Super Saiyan 4 Goku, MAFEX Batman, Hot Toys...';
      case 'warhammer':
        return 'e.g. Warhammer 40k Leviathan Box, Roboute Guilliman, Combat Patrol...';
      case 'yugioh':
        return 'e.g. Blue-Eyes White Dragon LOB-001, Dark Magician, Slifer QCR...';
      case 'lorcana':
        return 'e.g. Elsa Spirit of Winter Enchanted, Tinker Bell Giant Fairy...';
      case 'sports_cards':
        return 'e.g. Victor Wembanyama Prizm Silver RC, Michael Jordan Fleer RC...';
      case 'comics_manga':
        return 'e.g. The Amazing Spider-Man #300, Shonen Jump 1997 #34...';
      case 'coins_bullion':
        return 'e.g. 1 oz American Silver Eagle MS70, Morgan Silver Dollar 1881-S...';
      case 'fine_art':
        return 'e.g. Takashi Murakami Flowers Signed Lithograph, KAWS Chum...';
      case 'vinyl_music':
        return 'e.g. Pink Floyd Dark Side 1st Press, The Beatles Abbey Road...';
      case 'gaming':
      case 'consoles':
        return 'e.g. Pokémon Emerald GBA CIB, Pokémon HeartGold DS, Chrono Trigger...';
      case 'beyblade':
        return 'e.g. Cobalt Drake 4-60F, Wizard Rod 5-70DB, Phoenix Wing, Dran Buster...';
      case 'mtg':
        return 'e.g. Black Lotus, Ragavan Nimble Pilferer, The One Ring, Mox Diamond...';
      case 'onepiece':
        return 'e.g. Monkey.D.Luffy OP05 Manga, Shanks OP01, Zoro OP06...';
      case 'pokemon':
      default:
        return 'e.g. Charizard ex 151, Umbreon VMAX Moonbreon, Pikachu SIR...';
    }
  };

  // Sync category with selected sandbox
  const handleSandboxChange = (sbId: string) => {
    setSandboxId(sbId);
    const match = sandboxes.find((s) => s.id === sbId);
    if (match) {
      setCategory(match.type as HobbyType);
      setHasDismissedSuggestions(false);
      setSearchSuggestions([]);
    }
  };

  // Sync sandbox with selected category
  const handleCategoryChange = (newCat: HobbyType) => {
    setCategory(newCat);
    setHasDismissedSuggestions(false);
    setSearchSuggestions([]);
    const match = sandboxes.find((s) => s.type === newCat);
    if (match) {
      setSandboxId(match.id);
    }
  };

  // Add copy to draft
  const handleAddCopyDraft = (presetCondition: ItemCondition = 'RAW_LP') => {
    const meta = getConditionMeta(presetCondition);
    const baseP = parseFloat(currentPriceUSD) || 20;
    const estVal = (baseP * meta.multiplier).toFixed(2);
    setCopiesDrafts((prev) => [
      ...prev,
      {
        id: `draft-copy-${Date.now()}-${prev.length + 1}`,
        condition: presetCondition,
        customConditionLabel: meta.shortLabel,
        purchasePriceUSD: estVal,
        purchaseDate: new Date().toISOString().split('T')[0],
        storageMeta: metaStorage,
        storageContainer: container,
        storageSlot: `Slot #${prev.length + 1}`,
        notes: '',
      },
    ]);
  };

  const handleRemoveCopyDraft = (id: string) => {
    if (copiesDrafts.length <= 1) return;
    setCopiesDrafts((prev) => prev.filter((c) => c.id !== id));
  };

  const handleUpdateCopyDraft = (id: string, updates: Partial<NewCopyDraft>) => {
    setCopiesDrafts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownContainerRef.current &&
        !dropdownContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestionsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Escape key to close suggestions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showSuggestionsDropdown) {
        setShowSuggestionsDropdown(false);
        setHasDismissedSuggestions(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSuggestionsDropdown]);

  // Debounced search effect (1.2 to 1.5 seconds)
  useEffect(() => {
    if (hasDismissedSuggestions) return;

    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setSearchSuggestions([]);
      setShowSuggestionsDropdown(false);
      setIsSearchingSuggestions(false);
      return;
    }

    setIsSearchingSuggestions(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchOnlineSuggestions(trimmed, category);
        setSearchSuggestions(results);
        if (results.length > 0) {
          setShowSuggestionsDropdown(true);
        } else {
          setShowSuggestionsDropdown(false);
        }
      } catch (err) {
        console.error('Failed to fetch online suggestions:', err);
      } finally {
        setIsSearchingSuggestions(false);
      }
    }, 1200); // 1.2s debounce

    return () => clearTimeout(timer);
  }, [name, category, hasDismissedSuggestions]);

  // Handle selecting a suggested matched item
  const handleSelectSuggestion = (item: SearchSuggestionResult) => {
    setHasDismissedSuggestions(true);
    setShowSuggestionsDropdown(false);

    // Auto-fill all fields
    setName(item.name);
    setCategory(item.category as HobbyType);

    // Pick matching sandbox if one exists
    const matchedSandbox = sandboxes.find((s) => s.type === item.category);
    if (matchedSandbox) {
      setSandboxId(matchedSandbox.id);
    }

    if (item.imageUrl) {
      setImageUrl(item.imageUrl);
    }

    const priceVal = item.currentPriceUSD || 25.00;
    setCurrentPriceUSD(priceVal.toFixed(2));
    setPurchasePriceUSD((priceVal * 0.85).toFixed(2));

    if (item.tags && item.tags.length > 0) {
      setTags(item.tags.join(', '));
    }

    // Auto-fill Card Specs
    if (item.cardSpecs) {
      if (item.cardSpecs.setName) setCardSet(item.cardSpecs.setName);
      if (item.cardSpecs.rarity) setCardRarity(item.cardSpecs.rarity);
      if (item.cardSpecs.gradingCompany) setGradingCompany(item.cardSpecs.gradingCompany);
      if (item.cardSpecs.gradeValue) setGradeValue(item.cardSpecs.gradeValue);
      if (item.cardSpecs.certNumber) setCertNumber(item.cardSpecs.certNumber);
    }

    // Auto-fill Beyblade Specs
    if (item.beybladeSpecs) {
      if (item.beybladeSpecs.generation) setBbGen(item.beybladeSpecs.generation);
      if (item.beybladeSpecs.type) setBbType(item.beybladeSpecs.type);
      if (item.beybladeSpecs.blade) setBbBlade(item.beybladeSpecs.blade);
      if (item.beybladeSpecs.ratchet) setBbRatchet(item.beybladeSpecs.ratchet);
      if (item.beybladeSpecs.bit) setBbBit(item.beybladeSpecs.bit);
      if (item.beybladeSpecs.brand) setBbBrand(item.beybladeSpecs.brand);
    }

    // Auto-fill Physical Storage Location
    if (item.storageLocation) {
      if (item.storageLocation.metaStorage) setMetaStorage(item.storageLocation.metaStorage);
      if (item.storageLocation.container) setContainer(item.storageLocation.container);
      if (item.storageLocation.slot) setSlot(item.storageLocation.slot);
      if (item.storageLocation.notes) setStorageNotes(item.storageLocation.notes);
    }

    setFetchStatus(`Live market price matched: $${priceVal.toFixed(2)} (${item.marketSource})`);
    setAutoFilledNotice(`✓ Auto-filled from ${item.marketSource}`);

    // Fade out notice
    setTimeout(() => {
      setAutoFilledNotice(null);
    }, 4000);
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
        setFetchStatus(`Live market price found: $${res.currentPriceUSD} (${res.marketSource || 'API'})`);
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
        ? '/assets/images/cobalt_drake_bey_1786709634306.jpg'
        : '';

    let builtCopies: AssetCopy[] | undefined = undefined;
    let finalQty = qty;

    if (useMultiCopies && copiesDrafts.length > 0) {
      finalQty = copiesDrafts.length;
      builtCopies = copiesDrafts.map((draft, idx) => {
        const pPrice = parseFloat(draft.purchasePriceUSD) || buyPrice;
        const copyMeta = getConditionMeta(draft.condition);
        const copyVal = curPrice * copyMeta.multiplier;
        return {
          id: `copy-${Date.now()}-${idx + 1}`,
          condition: draft.condition,
          customConditionLabel: draft.customConditionLabel.trim() || copyMeta.shortLabel,
          purchasePriceUSD: pPrice,
          purchaseDate: draft.purchaseDate || purchaseDate,
          currentValueUSD: Number(copyVal.toFixed(2)),
          storageLocation: {
            metaStorage: draft.storageMeta.trim() || metaStorage,
            container: draft.storageContainer.trim() || container,
            slot: draft.storageSlot.trim() || undefined,
            notes: draft.notes.trim() || undefined,
          },
          notes: draft.notes.trim() || undefined,
        };
      });
    }

    const targetSandboxId =
      sandboxId ||
      sandboxes.find((s) => s.type === category)?.id ||
      (activeSandboxId !== 'all' ? activeSandboxId : null) ||
      sandboxes[0]?.id ||
      'sandbox-pokemon';

    await addItem({
      sandboxId: targetSandboxId,
      name: name.trim(),
      category,
      imageUrl: imageUrl.trim() || defaultImg,
      currentPriceUSD: curPrice,
      purchasePriceUSD: buyPrice,
      purchaseDate,
      quantity: finalQty,
      condition: useMultiCopies && copiesDrafts.length > 0 ? copiesDrafts[0].condition : condition,
      copies: builtCopies,
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
      weightGrams: weightGrams ? parseFloat(weightGrams) : undefined,
      fragility,
      fragilityNotes: fragilityNotes.trim() || undefined,
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

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Custom Form with Online Debounced Search */}
          <form onSubmit={handleCustomSubmit} className="space-y-4 text-xs">
            {/* Auto-filled Notification Banner */}
            {autoFilledNotice && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl animate-in fade-in slide-in-from-top-1 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{autoFilledNotice}</span>
              </div>
            )}

            {/* Hobby Category Selector (Reflects ONLY current existing categories or + Add Custom Category) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-[#8E8E93]">
                  Hobby Category *
                </label>
                {!showNewCategoryInline && (
                  <button
                    type="button"
                    onClick={() => setShowNewCategoryInline(true)}
                    className="text-[11px] text-[#007AFF] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Add Custom Category</span>
                  </button>
                )}
              </div>

              {!showNewCategoryInline ? (
                <select
                  id="add-item-category-select"
                  value={category}
                  onChange={(e) => {
                    if (e.target.value === '__CREATE_NEW__') {
                      setShowNewCategoryInline(true);
                    } else {
                      handleCategoryChange(e.target.value as HobbyType);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-[#F2F2F7] border border-black/[0.08] rounded-xl text-[#1C1C1E] font-medium text-xs focus:outline-none focus:border-[#007AFF] transition-colors cursor-pointer"
                >
                  {existingCategories.map((meta) => (
                    <option key={meta.id} value={meta.id}>
                      {meta.label} {meta.isCustom ? '(Custom)' : ''}
                    </option>
                  ))}
                  <option value="__CREATE_NEW__">+ Add New Custom Category...</option>
                </select>
              ) : (
                <div className="p-3.5 rounded-2xl bg-white border border-[#007AFF]/30 shadow-xs space-y-3 animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1C1C1E]">Create Custom Category</span>
                    <button
                      type="button"
                      onClick={() => setShowNewCategoryInline(false)}
                      className="text-xs text-[#8E8E93] hover:text-[#1C1C1E] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] text-[#8E8E93] font-semibold block mb-1">Category Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Vintage Watches, Coins, Gunpla, Lego, Sports Memorabilia..."
                      value={newCategoryLabel}
                      onChange={(e) => setNewCategoryLabel(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#F2F2F7] border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E] focus:outline-none focus:border-[#007AFF]"
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5">
                      {['#007AFF', '#AF52DE', '#FF9500', '#FF3B30', '#34C759', '#5856D6'].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewCategoryColor(color)}
                          className={`w-5 h-5 rounded-full border-2 transition-transform cursor-pointer ${
                            newCategoryColor === color ? 'scale-125 border-black/40' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleCreateCustomCategoryInline}
                      disabled={!newCategoryLabel.trim()}
                      className="px-3.5 py-1.5 rounded-xl bg-[#007AFF] text-white font-bold text-xs disabled:opacity-50 hover:bg-[#007AFF]/90 transition-colors cursor-pointer shadow-xs"
                    >
                      Save & Use
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Item Name & Live Debounce Online Search Container */}
            <div ref={dropdownContainerRef} className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-[#8E8E93]">
                  Item Name / Card Title *
                </label>
                {isSearchingSuggestions ? (
                  <span className="flex items-center gap-1 text-[10px] text-[#007AFF] font-medium animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Checking live market databases...</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-[#8E8E93]">
                    Type and pause 1s for online auto-suggestions
                  </span>
                )}
              </div>

              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <input
                    ref={nameInputRef}
                    type="text"
                    required
                    placeholder={getSearchPlaceholder(category)}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setHasDismissedSuggestions(false);
                    }}
                    onFocus={() => {
                      if (searchSuggestions.length > 0 && name.trim().length >= 2) {
                        setShowSuggestionsDropdown(true);
                      }
                    }}
                    className="w-full pl-3 pr-8 py-2 bg-[#F2F2F7] border border-black/[0.08] rounded-xl text-[#1C1C1E] text-xs focus:outline-none focus:border-[#007AFF]"
                  />
                  {isSearchingSuggestions && (
                    <Loader2 className="w-3.5 h-3.5 text-[#007AFF] animate-spin absolute right-2.5 top-1/2 -translate-y-1/2" />
                  )}
                </div>

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

              {/* Floating Debounced Online Suggestions Dropdown */}
              {showSuggestionsDropdown && searchSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white/95 backdrop-blur-xl border border-black/10 shadow-2xl rounded-2xl p-2 z-50 max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-black/[0.06] mb-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#1C1C1E]">
                      <Globe className="w-3.5 h-3.5 text-[#007AFF]" />
                      <span>Live Online Matched Items ({searchSuggestions.length})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#8E8E93]">Click to auto-fill form</span>
                      <button
                        type="button"
                        onClick={() => setShowSuggestionsDropdown(false)}
                        className="text-[#8E8E93] hover:text-[#1C1C1E] p-0.5 rounded cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {searchSuggestions.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectSuggestion(item)}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-[#007AFF]/10 border border-transparent hover:border-[#007AFF]/20 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 object-contain rounded-lg bg-[#F2F2F7] p-1 border border-black/[0.06] shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[#F2F2F7] flex items-center justify-center text-[#8E8E93] shrink-0">
                              <Box className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-[#1C1C1E] group-hover:text-[#007AFF] transition-colors truncate">
                              {item.name}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] px-1.5 py-0.5 bg-black/[0.05] rounded text-[#8E8E93] font-medium capitalize">
                                {item.category}
                              </span>
                              <span className="text-[10px] text-[#8E8E93] truncate">
                                {item.marketSource}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 ml-3">
                          {item.currentPriceUSD ? (
                            <div className="text-xs font-bold font-mono text-emerald-600">
                              {formatPrice(item.currentPriceUSD)}
                            </div>
                          ) : (
                            <div className="text-[10px] text-[#8E8E93]">Est. Market</div>
                          )}
                          <span className="text-[10px] text-[#007AFF] font-medium group-hover:underline flex items-center justify-end gap-0.5 mt-0.5">
                            Auto Fill <ArrowRight className="w-2.5 h-2.5" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Price Feedback Alert */}
            {fetchStatus && (
              <div className="p-2.5 rounded-xl bg-[#007AFF]/5 border border-[#007AFF]/15 text-[#007AFF] text-[11px] flex items-center justify-between">
                <span>{fetchStatus}</span>
              </div>
            )}

            {/* Pricing and Acquisition Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#8E8E93] block mb-1">
                  Est. Market (USD) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93] font-mono">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={currentPriceUSD}
                    onChange={(e) => setCurrentPriceUSD(e.target.value)}
                    className="w-full pl-6 pr-3 py-2 bg-[#F2F2F7] border border-black/[0.08] rounded-xl text-[#1C1C1E] font-mono text-xs focus:outline-none focus:border-[#007AFF]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#8E8E93] block mb-1">
                  Paid Price (USD) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93] font-mono">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={purchasePriceUSD}
                    onChange={(e) => setPurchasePriceUSD(e.target.value)}
                    className="w-full pl-6 pr-3 py-2 bg-[#F2F2F7] border border-black/[0.08] rounded-xl text-[#1C1C1E] font-mono text-xs focus:outline-none focus:border-[#007AFF]"
                  />
                </div>
              </div>

              {!useMultiCopies ? (
                <>
                  <div>
                    <label className="text-[11px] font-bold text-[#8E8E93] block mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F2F2F7] border border-black/[0.08] rounded-xl text-[#1C1C1E] text-xs focus:outline-none focus:border-[#007AFF]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#8E8E93] block mb-1">
                      Primary Condition
                    </label>
                    <select
                      value={condition}
                      onChange={(e: any) => setCondition(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F2F2F7] border border-black/[0.08] rounded-xl text-[#1C1C1E] text-xs focus:outline-none focus:border-[#007AFF]"
                    >
                      <option value="PSA_10">Gem Mint 10 (PSA 10)</option>
                      <option value="BGS_10">Pristine 10 (BGS 10)</option>
                      <option value="PSA_9">Mint 9 (PSA 9)</option>
                      <option value="BGS_9.5">Gem Mint 9.5 (BGS 9.5)</option>
                      <option value="NIB">Factory Sealed / New In Box (NIB)</option>
                      <option value="MINT_IN_BOX">Mint In Box (MIB)</option>
                      <option value="RAW_NM">Raw Near Mint (NM)</option>
                      <option value="RAW_LP">Well Condition / Light Play (LP)</option>
                      <option value="RAW_MP">Moderately Played (MP)</option>
                      <option value="RAW_HP">Poor Condition / Heavily Played (HP)</option>
                      <option value="USED">Used / Battle-Tested</option>
                    </select>
                  </div>
                </>
              ) : (
                <div className="col-span-2 flex items-center justify-between p-2 rounded-xl bg-[#007AFF]/10 border border-[#007AFF]/20">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#007AFF]" />
                    <span className="text-xs font-bold text-[#007AFF]">
                      {copiesDrafts.length} Copies in Custom Conditions
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUseMultiCopies(false)}
                    className="text-[11px] text-[#8E8E93] hover:text-[#1C1C1E] underline cursor-pointer"
                  >
                    Switch to single
                  </button>
                </div>
              )}
            </div>

            {/* Multi-Condition Copies Manager Box */}
            {!useMultiCopies ? (
              <div className="p-3.5 rounded-2xl bg-[#F2F2F7] border border-black/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="p-2 rounded-xl bg-white text-[#007AFF] shadow-xs shrink-0">
                    <Copy className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-[#1C1C1E]">
                      Own multiple copies in different conditions?
                    </div>
                    <div className="text-[10px] text-[#8E8E93] truncate">
                      e.g., 1x Near Mint, 1x Well Condition (LP), 1x Poor Condition (HP)
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUseMultiCopies(true);
                    if (copiesDrafts.length === 0) {
                      handleAddCopyDraft('RAW_NM');
                      handleAddCopyDraft('RAW_LP');
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#007AFF] text-white text-xs font-medium hover:bg-[#007AFF]/90 transition-colors flex items-center justify-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Configure Copies</span>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-[#F2F2F7] border border-[#007AFF]/25 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[#007AFF] text-white">
                      <Layers className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#1C1C1E]">
                        Individual Copies & Condition Breakdown
                      </span>
                      <span className="text-[10px] text-[#8E8E93] block">
                        Each copy has its own verified condition, market valuation multiplier, and storage slot.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddCopyDraft('RAW_HP')}
                    className="px-2.5 py-1 rounded-lg bg-white border border-black/[0.08] hover:bg-black/[0.03] text-xs font-semibold text-[#007AFF] flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Copy</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {copiesDrafts.map((draft, idx) => {
                    const meta = getConditionMeta(draft.condition);
                    const baseP = parseFloat(currentPriceUSD) || 20;
                    const computedVal = (baseP * meta.multiplier).toFixed(2);

                    return (
                      <div
                        key={draft.id}
                        className="p-3 rounded-xl bg-white border border-black/[0.08] shadow-xs space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-black/[0.05] text-[#1C1C1E]">
                              Copy #{idx + 1}
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${meta.badgeBg} ${meta.badgeBorder}`}>
                              {meta.shortLabel} (x{meta.multiplier})
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-emerald-600 font-bold">
                              Est. Value: ${computedVal}
                            </span>
                            {copiesDrafts.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveCopyDraft(draft.id)}
                                className="p-1 rounded text-[#8E8E93] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] text-[#8E8E93] block mb-0.5 font-semibold">Condition</label>
                            <select
                              value={draft.condition}
                              onChange={(e: any) => {
                                const newCond = e.target.value;
                                const newMeta = getConditionMeta(newCond);
                                handleUpdateCopyDraft(draft.id, {
                                  condition: newCond,
                                  customConditionLabel: newMeta.shortLabel,
                                });
                              }}
                              className="w-full px-2 py-1.5 bg-[#F2F2F7] border border-black/[0.08] rounded-lg text-xs"
                            >
                              <option value="PSA_10">Gem Mint 10 (PSA 10)</option>
                              <option value="BGS_10">Pristine 10 (BGS 10)</option>
                              <option value="PSA_9">Mint 9 (PSA 9)</option>
                              <option value="BGS_9.5">Gem Mint 9.5 (BGS 9.5)</option>
                              <option value="NIB">Factory Sealed / NIB</option>
                              <option value="RAW_NM">Raw Near Mint (NM)</option>
                              <option value="RAW_LP">Well Condition / Light Play (LP)</option>
                              <option value="RAW_MP">Moderately Played (MP)</option>
                              <option value="RAW_HP">Poor Condition / Heavy Play (HP)</option>
                              <option value="USED">Used / Battle-Tested</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] text-[#8E8E93] block mb-0.5 font-semibold">Condition Description / Label</label>
                            <input
                              type="text"
                              value={draft.customConditionLabel}
                              placeholder="e.g. Well Condition, Minor whitening"
                              onChange={(e) => handleUpdateCopyDraft(draft.id, { customConditionLabel: e.target.value })}
                              className="w-full px-2 py-1.5 bg-[#F2F2F7] border border-black/[0.08] rounded-lg text-xs"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-[#8E8E93] block mb-0.5 font-semibold">Paid Price ($USD)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={draft.purchasePriceUSD}
                              onChange={(e) => handleUpdateCopyDraft(draft.id, { purchasePriceUSD: e.target.value })}
                              className="w-full px-2 py-1.5 bg-[#F2F2F7] border border-black/[0.08] rounded-lg text-xs font-mono"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-black/[0.04]">
                          <div>
                            <input
                              type="text"
                              placeholder="Storage Slot (e.g. Binder Page 2, Slot 4)"
                              value={draft.storageSlot}
                              onChange={(e) => handleUpdateCopyDraft(draft.id, { storageSlot: e.target.value })}
                              className="w-full px-2 py-1 bg-[#F2F2F7] border border-black/[0.06] rounded-md text-[11px]"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Copy notes (e.g. slight crease on back corner)"
                              value={draft.notes}
                              onChange={(e) => handleUpdateCopyDraft(draft.id, { notes: e.target.value })}
                              className="w-full px-2 py-1 bg-[#F2F2F7] border border-black/[0.06] rounded-md text-[11px]"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Beyblade Specifications (Conditional) */}
            {category === 'beyblade' && (
              <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                <div className="flex items-center gap-1.5 text-amber-700 font-bold text-[11px]">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Beyblade Battle & Assembly Specifications</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10px] text-[#8E8E93] block mb-1 font-semibold">Generation</label>
                    <select
                      value={bbGen}
                      onChange={(e: any) => setBbGen(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-black/[0.08] rounded-lg text-xs"
                    >
                      <option value="Beyblade X">Beyblade X</option>
                      <option value="Burst">Burst</option>
                      <option value="Metal Fight">Metal Fight</option>
                      <option value="Original / Plastics">Original / Plastics</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-[#8E8E93] block mb-1 font-semibold">Type</label>
                    <select
                      value={bbType}
                      onChange={(e: any) => setBbType(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-black/[0.08] rounded-lg text-xs"
                    >
                      <option value="Attack">Attack</option>
                      <option value="Defense">Defense</option>
                      <option value="Stamina">Stamina</option>
                      <option value="Balance">Balance</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-[#8E8E93] block mb-1 font-semibold">Brand / Manufacturer</label>
                    <select
                      value={bbBrand}
                      onChange={(e: any) => setBbBrand(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-black/[0.08] rounded-lg text-xs"
                    >
                      <option value="Takara Tomy">Takara Tomy</option>
                      <option value="Hasbro">Hasbro</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-[#8E8E93] block mb-1 font-semibold">Blade Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Cobalt Drake"
                      value={bbBlade}
                      onChange={(e) => setBbBlade(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-black/[0.08] rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#8E8E93] block mb-1 font-semibold">Ratchet (X) / Track</label>
                    <input
                      type="text"
                      placeholder="e.g. 4-60, 5-70, 9-60"
                      value={bbRatchet}
                      onChange={(e) => setBbRatchet(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-black/[0.08] rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#8E8E93] block mb-1 font-semibold">Bit (X) / Tip</label>
                    <input
                      type="text"
                      placeholder="e.g. Flat (F), Disc Ball (DB)"
                      value={bbBit}
                      onChange={(e) => setBbBit(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-black/[0.08] rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Trading Card Specifications (Conditional) */}
            {(category === 'pokemon' || category === 'onepiece' || category === 'mtg' || category === 'yugioh') && (
              <div className="p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-3">
                <div className="flex items-center gap-1.5 text-blue-700 font-bold text-[11px]">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Card Grading & Set Specifications</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[10px] text-[#8E8E93] block mb-1 font-semibold">Set Name</label>
                    <input
                      type="text"
                      placeholder="e.g. 151, Awakening of the New Era"
                      value={cardSet}
                      onChange={(e) => setCardSet(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-black/[0.08] rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#8E8E93] block mb-1 font-semibold">Rarity</label>
                    <input
                      type="text"
                      placeholder="e.g. Special Illustration Rare, SEC"
                      value={cardRarity}
                      onChange={(e) => setCardRarity(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-black/[0.08] rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#8E8E93] block mb-1 font-semibold">Grading Service</label>
                    <select
                      value={gradingCompany}
                      onChange={(e: any) => setGradingCompany(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-black/[0.08] rounded-lg text-xs"
                    >
                      <option value="None">Raw / Ungraded</option>
                      <option value="PSA">PSA</option>
                      <option value="BGS">BGS (Beckett)</option>
                      <option value="CGC">CGC</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-[#8E8E93] block mb-1 font-semibold">Grade</label>
                    <input
                      type="text"
                      disabled={gradingCompany === 'None'}
                      placeholder="10, 9.5, 9"
                      value={gradeValue}
                      onChange={(e) => setGradeValue(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-black/[0.08] rounded-lg text-xs disabled:opacity-40"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Physical Storage & Real-Life Location */}
            <div className="p-3.5 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-purple-800 font-bold text-[11px]">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Physical Storage & Real-Life Inventory Location</span>
                </div>
                <span className="text-[10px] text-[#8E8E93]">Reverse lookup in Profile</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[10px] text-[#8E8E93] block mb-1 font-semibold">
                    1. Meta Storage (Room/Safe/Closet)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Master Fireproof Safe (Office)"
                    value={metaStorage}
                    onChange={(e) => setMetaStorage(e.target.value)}
                    list="add-item-known-metas"
                    className="w-full px-2.5 py-1.5 bg-white border border-black/[0.08] rounded-lg text-xs focus:outline-none focus:border-[#007AFF]"
                  />
                  <datalist id="add-item-known-metas">
                    {Array.from(new Set(storageUnits.map((u) => u.metaStorage))).map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="text-[10px] text-[#8E8E93] block mb-1 font-semibold">
                    2. Specific Storage (Binder/Case/Box)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. VaultX 12-Pocket Zip Binder"
                    value={container}
                    onChange={(e) => setContainer(e.target.value)}
                    list="add-item-known-containers"
                    className="w-full px-2.5 py-1.5 bg-white border border-black/[0.08] rounded-lg text-xs focus:outline-none focus:border-[#007AFF]"
                  />
                  <datalist id="add-item-known-containers">
                    {Array.from(
                      new Set(
                        storageUnits
                          .filter((u) => !metaStorage || u.metaStorage === metaStorage)
                          .map((u) => u.container)
                      )
                    ).map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="text-[10px] text-[#8E8E93] block mb-1 font-semibold">
                    3. Precise Slot / Compartment
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Page 1, Slot 1"
                    value={slot}
                    onChange={(e) => setSlot(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-black/[0.08] rounded-lg text-xs focus:outline-none focus:border-[#007AFF]"
                  />
                </div>
              </div>

              {/* Physical Weight & Fragility Ratings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 border-t border-purple-500/10">
                <div>
                  <label className="text-[10px] text-[#8E8E93] block mb-1 font-semibold flex items-center gap-1">
                    <Scale className="w-3 h-3 text-[#007AFF]" />
                    <span>Weight (grams)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="e.g. 54 (Slab), 1.8 (Raw), 45 (Blade)"
                    value={weightGrams}
                    onChange={(e) => setWeightGrams(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-black/[0.08] rounded-lg text-xs focus:outline-none focus:border-[#007AFF]"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#8E8E93] block mb-1 font-semibold flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-amber-500" />
                    <span>Preservation Fragility</span>
                  </label>
                  <select
                    value={fragility}
                    onChange={(e) => setFragility(e.target.value as FragilityLevel)}
                    className="w-full px-2.5 py-1.5 bg-white border border-black/[0.08] rounded-lg text-xs focus:outline-none focus:border-[#007AFF]"
                  >
                    <option value="LOW">LOW (Durable / Hard Slabs / Metal)</option>
                    <option value="MEDIUM">MEDIUM (Moderate / Sleeved / Boxed)</option>
                    <option value="HIGH">HIGH (Delicate / Vintage / High Grail)</option>
                    <option value="CRITICAL">CRITICAL (Ultra-Fragile / Glass)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-[#8E8E93] block mb-1 font-semibold">
                    Handling / Protection Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UV sleeve + silica gel"
                    value={storageNotes}
                    onChange={(e) => setStorageNotes(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-black/[0.08] rounded-lg text-xs focus:outline-none focus:border-[#007AFF]"
                  />
                </div>
              </div>
            </div>

            {/* Image URL & Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#8E8E93] block mb-1">
                  Custom Image URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="https://..."
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
        </div>
      </div>
    </div>
  );
};
