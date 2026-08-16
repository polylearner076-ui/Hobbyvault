import React, { useState, useMemo } from 'react';
import { useVault } from '../../context/VaultContext';
import { AssetItem, StorageLocation, StorageUnit, StorageUnitType } from '../../types';
import {
  X,
  Box,
  Archive,
  Search,
  Plus,
  ArrowRight,
  Shield,
  Layers,
  MapPin,
  Check,
  Edit3,
  ExternalLink,
  Printer,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Info,
  FolderPlus,
  Lock,
  Tag,
  Eye,
  Trash2,
  ArrowLeftRight,
  CheckSquare,
  Square,
  HelpCircle,
  Package,
} from 'lucide-react';

interface StorageInventoryModalProps {
  onClose: () => void;
  onSelectAsset?: (item: AssetItem) => void;
  initialSelectedContainer?: string;
  initialSelectedMeta?: string;
}

export interface ContainerNode {
  totalValueUSD: number;
  totalCostUSD: number;
  items: AssetItem[];
  unitConfig?: StorageUnit;
}

export interface MetaStorageNode {
  totalValueUSD: number;
  totalCostUSD: number;
  itemCount: number;
  containers: Record<string, ContainerNode>;
}

export interface StorageHierarchyResult {
  hierarchy: Record<string, MetaStorageNode>;
  unallocated: AssetItem[];
}

export const StorageInventoryModal: React.FC<StorageInventoryModalProps> = ({
  onClose,
  onSelectAsset,
  initialSelectedContainer,
  initialSelectedMeta,
}) => {
  const {
    items,
    updateItem,
    formatPrice,
    storageUnits,
    addStorageUnit,
    deleteStorageUnit,
    switchItemStorage,
    batchSwitchItemStorage,
  } = useVault();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMetaStorage, setSelectedMetaStorage] = useState<string | null>(initialSelectedMeta || null);
  const [selectedContainer, setSelectedContainer] = useState<string | null>(initialSelectedContainer || null);

  // Relocation / Move modal state (single item)
  const [relocatingItem, setRelocatingItem] = useState<AssetItem | null>(null);
  const [targetMeta, setTargetMeta] = useState('');
  const [targetContainer, setTargetContainer] = useState('');
  const [targetSlot, setTargetSlot] = useState('');
  const [targetNotes, setTargetNotes] = useState('');
  const [isRelocating, setIsRelocating] = useState(false);

  // Batch relocation state
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [showBatchMoveModal, setShowBatchMoveModal] = useState(false);
  const [batchTargetMeta, setBatchTargetMeta] = useState('');
  const [batchTargetContainer, setBatchTargetContainer] = useState('');
  const [batchTargetSlotPrefix, setBatchTargetSlotPrefix] = useState('');

  // Assign Loose Items Drawer state
  const [showAssignLooseModal, setShowAssignLooseModal] = useState(false);

  // New Storage creation form state
  const [showAddStorage, setShowAddStorage] = useState(false);
  const [newMetaName, setNewMetaName] = useState('');
  const [newContainerName, setNewContainerName] = useState('');
  const [newStorageType, setNewStorageType] = useState<StorageUnitType>('binder');
  const [newStorageNotes, setNewStorageNotes] = useState('');
  const [creationToast, setCreationToast] = useState<string | null>(null);

  // Quick filter by storage type or unallocated
  const [filterMode, setFilterMode] = useState<'all' | 'unallocated'>('all');

  // Group items by Meta-Storage -> Container, starting with all registered storageUnits
  const storageHierarchy = useMemo<StorageHierarchyResult>(() => {
    const hierarchy: Record<string, MetaStorageNode> = {};
    const unallocated: AssetItem[] = [];

    // 1. Initialize all registered storageUnits so even 0-item containers appear in the left list
    storageUnits.forEach((unit) => {
      const meta = unit.metaStorage.trim();
      const cont = unit.container.trim();
      if (!meta || !cont) return;

      if (!hierarchy[meta]) {
        hierarchy[meta] = {
          totalValueUSD: 0,
          totalCostUSD: 0,
          itemCount: 0,
          containers: {},
        };
      }

      if (!hierarchy[meta].containers[cont]) {
        hierarchy[meta].containers[cont] = {
          totalValueUSD: 0,
          totalCostUSD: 0,
          items: [],
          unitConfig: unit,
        };
      }
    });

    // 2. Populate items into containers
    items.forEach((item) => {
      const loc = item.storageLocation;
      if (!loc || !loc.metaStorage || !loc.container) {
        unallocated.push(item);
        return;
      }

      const meta = loc.metaStorage.trim() || 'Uncategorized Safe / Location';
      const cont = loc.container.trim() || 'General Storage Container';
      const itemVal = item.currentPriceUSD * item.quantity;
      const itemCost = item.purchasePriceUSD * item.quantity;

      if (!hierarchy[meta]) {
        hierarchy[meta] = {
          totalValueUSD: 0,
          totalCostUSD: 0,
          itemCount: 0,
          containers: {},
        };
      }

      hierarchy[meta].totalValueUSD += itemVal;
      hierarchy[meta].totalCostUSD += itemCost;
      hierarchy[meta].itemCount += item.quantity;

      if (!hierarchy[meta].containers[cont]) {
        hierarchy[meta].containers[cont] = {
          totalValueUSD: 0,
          totalCostUSD: 0,
          items: [],
        };
      }

      hierarchy[meta].containers[cont].totalValueUSD += itemVal;
      hierarchy[meta].containers[cont].totalCostUSD += itemCost;
      hierarchy[meta].containers[cont].items.push(item);
    });

    return { hierarchy, unallocated };
  }, [storageUnits, items]);

  // Unique list of all known meta-storages for auto-complete
  const knownMetas = useMemo(() => {
    const set = new Set<string>();
    storageUnits.forEach((u) => {
      if (u.metaStorage) set.add(u.metaStorage);
    });
    items.forEach((i) => {
      if (i.storageLocation?.metaStorage) set.add(i.storageLocation.metaStorage);
    });
    set.add('Master Fireproof Safe (Office)');
    set.add('Display Cabinet (Living Room)');
    set.add('Home Office Desk');
    set.add('Bank Safe Deposit Box #412');
    set.add('Archive Storage Closet');
    return Array.from(set);
  }, [storageUnits, items]);

  // Unique list of containers for targetMeta
  const knownContainersForMeta = useMemo(() => {
    const set = new Set<string>();
    storageUnits.forEach((u) => {
      if (!targetMeta || u.metaStorage === targetMeta) {
        set.add(u.container);
      }
    });
    items.forEach((i) => {
      if (i.storageLocation?.container) {
        if (!targetMeta || i.storageLocation.metaStorage === targetMeta) {
          set.add(i.storageLocation.container);
        }
      }
    });
    set.add('Pelican 1500 Slab Case');
    set.add('VaultX 12-Pocket Premium Zip Binder');
    set.add('Ultra Pro 9-Pocket Binder');
    set.add('Ultimate Guard Boulder 100+ Deck Box');
    set.add('Acrylic Display Showcase Tier 1');
    set.add('BCW 3200-ct Monster Box');
    return Array.from(set);
  }, [storageUnits, items, targetMeta]);

  // List of all registered location pairs for quick selection
  const allLocationPairs = useMemo(() => {
    const list: { meta: string; container: string; label: string }[] = [];
    (Object.entries(storageHierarchy.hierarchy) as [string, MetaStorageNode][]).forEach(([meta, metaNode]) => {
      Object.keys(metaNode.containers).forEach((cont) => {
        list.push({
          meta,
          container: cont,
          label: `${meta} ▸ ${cont}`,
        });
      });
    });
    return list;
  }, [storageHierarchy]);

  // Filter items matching search
  const filteredSearchItems = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return items.filter((item) => {
      const matchName = item.name.toLowerCase().includes(q);
      const matchMeta = item.storageLocation?.metaStorage?.toLowerCase().includes(q);
      const matchContainer = item.storageLocation?.container?.toLowerCase().includes(q);
      const matchSlot = item.storageLocation?.slot?.toLowerCase().includes(q);
      const matchCondition = item.condition.toLowerCase().includes(q);
      const matchTags = item.tags.some((t) => t.toLowerCase().includes(q));
      return matchName || matchMeta || matchContainer || matchSlot || matchCondition || matchTags;
    });
  }, [items, searchQuery]);

  // Open Relocate Modal for single item
  const handleOpenRelocate = (item: AssetItem) => {
    setRelocatingItem(item);
    setTargetMeta(item.storageLocation?.metaStorage || knownMetas[0] || 'Master Fireproof Safe (Office)');
    setTargetContainer(item.storageLocation?.container || 'VaultX 12-Pocket Premium Zip Binder');
    setTargetSlot(item.storageLocation?.slot || '');
    setTargetNotes(item.storageLocation?.notes || '');
  };

  const handleSaveRelocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!relocatingItem || !targetMeta.trim() || !targetContainer.trim()) return;

    setIsRelocating(true);
    try {
      const newStorage: StorageLocation = {
        metaStorage: targetMeta.trim(),
        container: targetContainer.trim(),
        slot: targetSlot.trim() || undefined,
        notes: targetNotes.trim() || undefined,
      };

      await switchItemStorage(relocatingItem.id, newStorage);
      setRelocatingItem(null);
    } catch (err) {
      console.error('Relocation failed:', err);
    } finally {
      setIsRelocating(false);
    }
  };

  // Instant Quick Move from card dropdown
  const handleQuickSwitchLocation = async (item: AssetItem, targetMetaName: string, targetContainerName: string) => {
    if (!targetMetaName || !targetContainerName) return;
    try {
      const newStorage: StorageLocation = {
        metaStorage: targetMetaName,
        container: targetContainerName,
        slot: item.storageLocation?.slot,
        notes: item.storageLocation?.notes,
      };
      await switchItemStorage(item.id, newStorage);
    } catch (err) {
      console.error('Quick switch failed:', err);
    }
  };

  // Create new Storage Location
  const handleCreateStorageLocation = (e: React.FormEvent) => {
    e.preventDefault();
    const meta = newMetaName.trim();
    const cont = newContainerName.trim();
    if (!meta || !cont) return;

    // Add to storage units persistent repository
    addStorageUnit({
      metaStorage: meta,
      container: cont,
      type: newStorageType,
      notes: newStorageNotes.trim() || undefined,
    });

    // Select the new location immediately
    setFilterMode('all');
    setSelectedMetaStorage(meta);
    setSelectedContainer(cont);

    // Reset and close
    setShowAddStorage(false);
    setNewMetaName('');
    setNewContainerName('');
    setNewStorageNotes('');
    setCreationToast(`Created storage location "${meta} ▸ ${cont}"`);
    setTimeout(() => setCreationToast(null), 4000);
  };

  // Batch relocation handler
  const handleExecuteBatchMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchTargetMeta.trim() || !batchTargetContainer.trim() || selectedItemIds.length === 0) return;

    setIsRelocating(true);
    try {
      const newStorage: StorageLocation = {
        metaStorage: batchTargetMeta.trim(),
        container: batchTargetContainer.trim(),
        slot: batchTargetSlotPrefix.trim() || undefined,
      };

      await batchSwitchItemStorage(selectedItemIds, newStorage);
      setShowBatchMoveModal(false);
      setSelectedItemIds([]);
      setIsBatchMode(false);
    } catch (err) {
      console.error('Batch move failed:', err);
    } finally {
      setIsRelocating(false);
    }
  };

  // Assign loose items into active container
  const handleAssignLooseItemToActiveContainer = async (looseItem: AssetItem) => {
    if (!selectedMetaStorage || !selectedContainer) return;
    const newStorage: StorageLocation = {
      metaStorage: selectedMetaStorage,
      container: selectedContainer,
      slot: looseItem.storageLocation?.slot || undefined,
      notes: looseItem.storageLocation?.notes || undefined,
    };
    await switchItemStorage(looseItem.id, newStorage);
  };

  const totalVaultValue = items.reduce((acc, i) => acc + i.currentPriceUSD * i.quantity, 0);
  const totalAllocatedItems = items.filter((i) => i.storageLocation?.metaStorage && i.storageLocation?.container).length;

  const getContainerIcon = (type?: StorageUnitType, name?: string) => {
    const t = (type || '').toLowerCase();
    const n = (name || '').toLowerCase();
    if (t === 'safe' || n.includes('safe') || n.includes('vault')) return <Shield className="w-4 h-4 text-emerald-600" />;
    if (t === 'binder' || n.includes('binder') || n.includes('zip')) return <Layers className="w-4 h-4 text-blue-600" />;
    if (t === 'slab_case' || n.includes('pelican') || n.includes('slab') || n.includes('case')) return <Box className="w-4 h-4 text-indigo-600" />;
    if (t === 'display' || n.includes('display') || n.includes('showcase')) return <Sparkles className="w-4 h-4 text-amber-600" />;
    if (t === 'box' || n.includes('box')) return <Package className="w-4 h-4 text-orange-600" />;
    return <Archive className="w-4 h-4 text-sky-600" />;
  };

  return (
    <div
      id="storage-inventory-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-black/65 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="storage-inventory-modal"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-6xl max-h-[92vh] bg-[#F8F9FB] rounded-3xl shadow-2xl border border-black/[0.08] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Top Header Bar */}
        <div className="px-6 py-4 bg-white border-b border-black/[0.06] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#007AFF] to-sky-500 text-white flex items-center justify-center shadow-md">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-[#1C1C1E] tracking-tight">
                  Physical Storage & Inventory Hub
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20">
                  Reverse Check
                </span>
              </div>
              <p className="text-xs text-[#8E8E93]">
                Map collectible assets to real-world safes, binders, slab cases, and exact slots
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              title="Print Physical Vault Packing Manifest"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/[0.04] hover:bg-black/[0.08] text-xs font-semibold text-[#1C1C1E] transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Manifest</span>
            </button>

            <button
              onClick={() => setShowAddStorage(!showAddStorage)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#007AFF] hover:bg-[#0066D6] text-xs font-semibold text-white shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Location</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-black/[0.04] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Notification Toast */}
        {creationToast && (
          <div className="px-6 py-2.5 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs font-medium flex items-center justify-between animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{creationToast}</span>
            </div>
            <button onClick={() => setCreationToast(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Global Stats Summary Bar */}
        <div className="px-6 py-3 bg-[#F2F2F7] border-b border-black/[0.04] flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-[#8E8E93] font-medium">Meta Locations: </span>
              <span className="font-bold text-[#1C1C1E]">
                {Object.keys(storageHierarchy.hierarchy).length} Physical Locations
              </span>
            </div>
            <div>
              <span className="text-[#8E8E93] font-medium">Allocated Assets: </span>
              <span className="font-bold text-[#1C1C1E]">
                {totalAllocatedItems} / {items.length} ({((totalAllocatedItems / Math.max(1, items.length)) * 100).toFixed(0)}%)
              </span>
            </div>
            <div>
              <span className="text-[#8E8E93] font-medium">Total Stored Value: </span>
              <span className="font-bold font-mono text-[#007AFF]">
                {formatPrice(totalVaultValue)}
              </span>
            </div>
          </div>

          {/* Quick Filter Switch */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-black/[0.06] shadow-2xs">
            <button
              onClick={() => {
                setFilterMode('all');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-[#007AFF] text-white shadow-xs'
                  : 'text-[#8E8E93] hover:text-[#1C1C1E]'
              }`}
            >
              All Storages
            </button>
            <button
              onClick={() => {
                setFilterMode('unallocated');
                setSelectedMetaStorage(null);
                setSelectedContainer(null);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                filterMode === 'unallocated'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-[#8E8E93] hover:text-amber-700'
              }`}
            >
              <span>Unassigned Loose Items</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  filterMode === 'unallocated' ? 'bg-white/30 text-white' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {storageHierarchy.unallocated.length}
              </span>
            </button>
          </div>
        </div>

        {/* Create Storage Drawer / Form */}
        {showAddStorage && (
          <form
            onSubmit={handleCreateStorageLocation}
            className="px-6 py-4 bg-blue-50/70 border-b border-blue-200/80 animate-in fade-in"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-[#007AFF]" />
                <h4 className="text-xs font-bold text-[#1C1C1E] uppercase tracking-wider">
                  Register New Physical Storage Location & Unit
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStorage(false)}
                className="text-xs text-[#8E8E93] hover:text-[#1C1C1E] cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#8E8E93] block mb-1">
                  1. Meta Storage / Room / Safe
                </label>
                <input
                  type="text"
                  placeholder="e.g. Master Fireproof Safe, Living Room..."
                  value={newMetaName}
                  onChange={(e) => setNewMetaName(e.target.value)}
                  list="known-metas-list"
                  className="w-full px-3 py-2 bg-white border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                  required
                />
                <datalist id="known-metas-list">
                  {knownMetas.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#8E8E93] block mb-1">
                  2. Specific Container / Binder / Case
                </label>
                <input
                  type="text"
                  placeholder="e.g. VaultX 12-Pocket Binder #2, Pelican 1500..."
                  value={newContainerName}
                  onChange={(e) => setNewContainerName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#8E8E93] block mb-1">
                  3. Storage Category Type
                </label>
                <select
                  value={newStorageType}
                  onChange={(e) => setNewStorageType(e.target.value as StorageUnitType)}
                  className="w-full px-3 py-2 bg-white border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                >
                  <option value="binder">Archival Binder (Zip/Ringless)</option>
                  <option value="slab_case">Graded Slab Case (Pelican/Aluminum)</option>
                  <option value="safe">Fireproof Safe / Lockbox</option>
                  <option value="display">Showcase / Acrylic Display</option>
                  <option value="box">Deck Box / Monster Storage Box</option>
                  <option value="deposit_box">Bank Safe Deposit Box</option>
                  <option value="shelf">Cabinet / Storage Shelf</option>
                  <option value="other">Other Storage Unit</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 bg-[#007AFF] hover:bg-[#0066D6] text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Create & Select Storage
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Search / Filter Input */}
        <div className="p-4 sm:px-6 bg-white border-b border-black/[0.06]">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by card name, safe, binder name, slab case, slot, or PSA grade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#F2F2F7] border border-transparent focus:border-[#007AFF] focus:bg-white rounded-xl text-xs text-[#1C1C1E] focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8E8E93] hover:text-[#1C1C1E] cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Main Body: Master Hierarchy + Detail Inventory Panel */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Column: Storage Location Tree & Meta-Storages List */}
          <div className="lg:col-span-4 border-r border-black/[0.06] bg-white overflow-y-auto p-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">
                Physical Locations & Units
              </span>
              <span className="text-[10px] text-[#8E8E93] font-medium">
                {Object.keys(storageHierarchy.hierarchy).length} Safes / Places
              </span>
            </div>

            {/* If unallocated items exist, show prominent badge */}
            {storageHierarchy.unallocated.length > 0 && (
              <div
                onClick={() => {
                  setFilterMode('unallocated');
                  setSelectedMetaStorage(null);
                  setSelectedContainer(null);
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  filterMode === 'unallocated'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-md'
                    : 'bg-amber-50 hover:bg-amber-100/80 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className={`w-4 h-4 ${filterMode === 'unallocated' ? 'text-white' : 'text-amber-600'}`} />
                    <span className="font-bold text-xs">Unassigned Items</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      filterMode === 'unallocated' ? 'bg-white/20 text-white' : 'bg-amber-200 text-amber-900'
                    }`}
                  >
                    {storageHierarchy.unallocated.length} cards
                  </span>
                </div>
                <p className={`text-[11px] mt-1 ${filterMode === 'unallocated' ? 'text-white/80' : 'text-amber-700'}`}>
                  Collectibles not yet placed in a binder, safe, or container
                </p>
              </div>
            )}

            {/* List of Meta Storages */}
            {(Object.entries(storageHierarchy.hierarchy) as [string, MetaStorageNode][]).map(([metaName, metaData]) => {
              const isMetaSelected = selectedMetaStorage === metaName;
              const containerCount = Object.keys(metaData.containers).length;
              const gain = metaData.totalValueUSD - metaData.totalCostUSD;
              const isGainPos = gain >= 0;

              return (
                <div
                  key={metaName}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isMetaSelected
                      ? 'border-[#007AFF] bg-blue-50/30 shadow-xs'
                      : 'border-black/[0.06] bg-white hover:border-black/[0.12]'
                  }`}
                >
                  {/* Meta Storage Header */}
                  <div
                    onClick={() => {
                      setFilterMode('all');
                      if (isMetaSelected) {
                        setSelectedMetaStorage(null);
                        setSelectedContainer(null);
                      } else {
                        setSelectedMetaStorage(metaName);
                        const firstCont = Object.keys(metaData.containers)[0];
                        setSelectedContainer(firstCont || null);
                      }
                    }}
                    className="p-3.5 flex items-start justify-between gap-2 cursor-pointer hover:bg-black/[0.02]"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-xl bg-black/[0.05] text-[#007AFF] flex items-center justify-center shrink-0 mt-0.5">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-[#1C1C1E] truncate">
                          {metaName}
                        </h3>
                        <div className="text-[11px] text-[#8E8E93] flex items-center gap-1.5 mt-0.5">
                          <span>{containerCount} container{containerCount === 1 ? '' : 's'}</span>
                          <span>•</span>
                          <span>{metaData.itemCount} items</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold font-mono text-[#1C1C1E]">
                        {formatPrice(metaData.totalValueUSD)}
                      </div>
                      {metaData.itemCount > 0 && (
                        <div className={`text-[10px] font-mono font-semibold ${isGainPos ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                          {isGainPos ? '+' : ''}{formatPrice(gain)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sub-containers under this Meta-Storage */}
                  {isMetaSelected && (
                    <div className="px-3 pb-3 pt-1 space-y-1.5 border-t border-black/[0.04] bg-[#F8F9FB]">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93] pt-1 flex items-center justify-between">
                        <span>Containers inside:</span>
                      </div>
                      {(Object.entries(metaData.containers) as [string, ContainerNode][]).map(([containerName, cData]) => {
                        const isContainerSelected = selectedContainer === containerName;
                        return (
                          <div
                            key={containerName}
                            onClick={(e) => {
                              e.stopPropagation();
                              setFilterMode('all');
                              setSelectedMetaStorage(metaName);
                              setSelectedContainer(containerName);
                            }}
                            className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all cursor-pointer ${
                              isContainerSelected
                                ? 'bg-[#007AFF] text-white border-[#007AFF] shadow-xs'
                                : 'bg-white hover:bg-black/[0.02] text-[#1C1C1E] border-black/[0.06]'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {getContainerIcon(cData.unitConfig?.type, containerName)}
                              <span className="font-semibold truncate">{containerName}</span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                                  isContainerSelected
                                    ? 'bg-white/20 text-white'
                                    : cData.items.length === 0
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-black/[0.04] text-[#8E8E93]'
                                }`}
                              >
                                {cData.items.length} {cData.items.length === 1 ? 'item' : 'items'}
                              </span>
                              <span className={`font-mono text-[11px] font-bold ${isContainerSelected ? 'text-white' : 'text-[#1C1C1E]'}`}>
                                {formatPrice(cData.totalValueUSD)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Column: Detail Inventory Manifest Panel */}
          <div className="lg:col-span-8 bg-[#F8F9FB] overflow-y-auto p-4 sm:p-6 flex flex-col justify-between space-y-4">
            <div>
              {/* Search results view */}
              {filteredSearchItems !== null ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-[#007AFF]" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#1C1C1E]">
                        Search Results ({filteredSearchItems.length} matching items)
                      </h3>
                    </div>
                    <span className="text-xs text-[#8E8E93]">
                      Click any card to inspect or relocate
                    </span>
                  </div>

                  {filteredSearchItems.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-3xl border border-black/[0.06] text-xs text-[#8E8E93]">
                      No collectible assets or storage locations matched "{searchQuery}".
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredSearchItems.map((item) => (
                        <AssetInventoryCard
                          key={item.id}
                          item={item}
                          formatPrice={formatPrice}
                          allLocationPairs={allLocationPairs}
                          onOpenDetail={() => onSelectAsset?.(item)}
                          onRelocate={() => handleOpenRelocate(item)}
                          onQuickSwitch={(meta, cont) => handleQuickSwitchLocation(item, meta, cont)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : filterMode === 'unallocated' ? (
                /* Unallocated items view */
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                        <Info className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-amber-900">
                          Unassigned Loose Items ({storageHierarchy.unallocated.length})
                        </h3>
                        <p className="text-[11px] text-amber-700">
                          These assets haven't been assigned to a physical binder, slab case, or safe yet.
                        </p>
                      </div>
                    </div>
                  </div>

                  {storageHierarchy.unallocated.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-3xl border border-black/[0.06] text-xs text-[#8E8E93]">
                      All collectibles in your vault are cataloged and allocated to physical storage!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {storageHierarchy.unallocated.map((item) => (
                        <AssetInventoryCard
                          key={item.id}
                          item={item}
                          formatPrice={formatPrice}
                          allLocationPairs={allLocationPairs}
                          onOpenDetail={() => onSelectAsset?.(item)}
                          onRelocate={() => handleOpenRelocate(item)}
                          onQuickSwitch={(meta, cont) => handleQuickSwitchLocation(item, meta, cont)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : selectedMetaStorage && selectedContainer ? (
                /* Specific Container Reverse-Check View */
                <div className="space-y-4">
                  {/* Container Hero Banner */}
                  <div className="p-5 bg-white rounded-3xl border border-black/[0.06] shadow-xs flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#007AFF] to-indigo-600 text-white flex items-center justify-center shadow-sm">
                        <Archive className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#007AFF] bg-[#007AFF]/10 px-2 py-0.5 rounded-full border border-[#007AFF]/20">
                            {selectedMetaStorage}
                          </span>
                          <span className="text-xs text-[#8E8E93]">▸</span>
                          <h2 className="text-base font-extrabold text-[#1C1C1E]">
                            {selectedContainer}
                          </h2>
                        </div>
                        <div className="text-xs text-[#8E8E93] mt-1 flex items-center gap-3">
                          <span>
                            Contains{' '}
                            <strong className="text-[#1C1C1E]">
                              {storageHierarchy.hierarchy[selectedMetaStorage]?.containers[selectedContainer]?.items.length || 0}
                            </strong>{' '}
                            items
                          </span>
                          <span>•</span>
                          <span>
                            Total Valuation:{' '}
                            <strong className="text-[#007AFF] font-mono">
                              {formatPrice(
                                storageHierarchy.hierarchy[selectedMetaStorage]?.containers[selectedContainer]?.totalValueUSD || 0
                              )}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowAssignLooseModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-xs font-semibold text-[#007AFF] transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Assign Items Here</span>
                      </button>

                      {(storageHierarchy.hierarchy[selectedMetaStorage]?.containers[selectedContainer]?.items.length || 0) > 0 && (
                        <button
                          onClick={() => {
                            setIsBatchMode(!isBatchMode);
                            setSelectedItemIds([]);
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                            isBatchMode ? 'bg-[#1C1C1E] text-white' : 'bg-black/[0.04] hover:bg-black/[0.08] text-[#1C1C1E]'
                          }`}
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                          <span>{isBatchMode ? 'Cancel Batch' : 'Batch Move'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Batch Action Bar */}
                  {isBatchMode && (
                    <div className="p-3 bg-[#1C1C1E] text-white rounded-2xl flex items-center justify-between text-xs animate-in slide-in-from-top-2">
                      <div className="flex items-center gap-3">
                        <span className="font-bold">
                          {selectedItemIds.length} item{selectedItemIds.length === 1 ? '' : 's'} selected
                        </span>
                        <button
                          onClick={() => {
                            const allIds =
                              storageHierarchy.hierarchy[selectedMetaStorage]?.containers[selectedContainer]?.items.map((i) => i.id) || [];
                            setSelectedItemIds(selectedItemIds.length === allIds.length ? [] : allIds);
                          }}
                          className="text-xs text-white/70 hover:text-white underline cursor-pointer"
                        >
                          {selectedItemIds.length ===
                          (storageHierarchy.hierarchy[selectedMetaStorage]?.containers[selectedContainer]?.items.length || 0)
                            ? 'Deselect All'
                            : 'Select All'}
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          if (selectedItemIds.length === 0) return;
                          setBatchTargetMeta(selectedMetaStorage);
                          setBatchTargetContainer('');
                          setShowBatchMoveModal(true);
                        }}
                        disabled={selectedItemIds.length === 0}
                        className="px-3.5 py-1.5 rounded-xl bg-[#007AFF] hover:bg-[#0066D6] disabled:opacity-50 text-white font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>Move Selected to Another Unit</span>
                      </button>
                    </div>
                  )}

                  {/* Items inside this container */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#8E8E93]">
                        Assets Cataloged in {selectedContainer}
                      </h4>
                      <span className="text-[11px] text-[#8E8E93]">
                        Reverse-Check Manifest
                      </span>
                    </div>

                    {(storageHierarchy.hierarchy[selectedMetaStorage]?.containers[selectedContainer]?.items.length || 0) === 0 ? (
                      /* Empty Container Placeholder */
                      <div className="p-8 bg-white rounded-3xl border border-black/[0.06] text-center space-y-3">
                        <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                          <Package className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[#1C1C1E]">This storage container is currently empty</h4>
                          <p className="text-xs text-[#8E8E93] max-w-sm mx-auto mt-1">
                            You have registered "{selectedContainer}". Allocate loose items or switch existing collectibles into this unit.
                          </p>
                        </div>
                        <div className="pt-2 flex justify-center gap-2">
                          <button
                            onClick={() => setShowAssignLooseModal(true)}
                            className="px-4 py-2 bg-[#007AFF] hover:bg-[#0066D6] text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer"
                          >
                            ➕ Assign Items to {selectedContainer}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(storageHierarchy.hierarchy[selectedMetaStorage]?.containers[selectedContainer]?.items || []).map((item) => {
                          const isSelected = selectedItemIds.includes(item.id);
                          return (
                            <div key={item.id} className="relative">
                              {isBatchMode && (
                                <button
                                  onClick={() => {
                                    setSelectedItemIds((prev) =>
                                      prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]
                                    );
                                  }}
                                  className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-lg bg-white/90 shadow-md text-[#007AFF] cursor-pointer"
                                >
                                  {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-[#8E8E93]" />}
                                </button>
                              )}
                              <AssetInventoryCard
                                item={item}
                                formatPrice={formatPrice}
                                allLocationPairs={allLocationPairs}
                                onOpenDetail={() => onSelectAsset?.(item)}
                                onRelocate={() => handleOpenRelocate(item)}
                                onQuickSwitch={(meta, cont) => handleQuickSwitchLocation(item, meta, cont)}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Overview State when no container is chosen */
                <div className="p-10 text-center bg-white rounded-3xl border border-black/[0.06] space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-3xl bg-blue-50 text-[#007AFF] flex items-center justify-center">
                    <Box className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1C1C1E]">
                      Select a Storage Location or Safe
                    </h3>
                    <p className="text-xs text-[#8E8E93] max-w-md mx-auto mt-1 leading-relaxed">
                      Choose any physical safe, binder, or slab case on the left to inspect every collectible card and asset stored inside it.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-wrap justify-center gap-2">
                    {Object.keys(storageHierarchy.hierarchy).map((meta) => (
                      <button
                        key={meta}
                        onClick={() => {
                          setSelectedMetaStorage(meta);
                          const firstCont = Object.keys(storageHierarchy.hierarchy[meta].containers)[0];
                          setSelectedContainer(firstCont || null);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-[#F2F2F7] hover:bg-black/[0.07] border border-black/[0.06] text-xs font-semibold text-[#1C1C1E] transition-colors cursor-pointer"
                      >
                        {meta}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal: Assign Loose / Other Items to Current Container */}
        {showAssignLooseModal && selectedMetaStorage && selectedContainer && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
            onClick={() => setShowAssignLooseModal(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl border border-black/[0.08] flex flex-col max-h-[85vh] animate-in zoom-in-95"
            >
              <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#007AFF]" />
                  <h3 className="text-sm font-bold text-[#1C1C1E]">
                    Assign Collectibles to {selectedContainer}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAssignLooseModal(false)}
                  className="text-xs text-[#8E8E93] hover:text-[#1C1C1E] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-2 text-xs text-[#8E8E93]">
                Target Location: <strong className="text-[#1C1C1E]">{selectedMetaStorage} ▸ {selectedContainer}</strong>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 py-2">
                {items.length === 0 ? (
                  <p className="text-xs text-center py-6 text-[#8E8E93]">No items available in your vault.</p>
                ) : (
                  items.map((item) => {
                    const isAlreadyHere =
                      item.storageLocation?.metaStorage === selectedMetaStorage &&
                      item.storageLocation?.container === selectedContainer;

                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-all ${
                          isAlreadyHere ? 'bg-emerald-50/60 border-emerald-200' : 'bg-[#F8F9FB] border-black/[0.04]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 object-contain rounded-lg bg-white border border-black/[0.06] shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-[#1C1C1E] truncate">{item.name}</div>
                            <div className="text-[10px] text-[#8E8E93]">
                              Current:{' '}
                              {item.storageLocation?.metaStorage && item.storageLocation?.container
                                ? `${item.storageLocation.metaStorage} ▸ ${item.storageLocation.container}`
                                : 'Unassigned loose item'}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isAlreadyHere ? (
                            <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center gap-1">
                              <Check className="w-3 h-3" /> Stored Here
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAssignLooseItemToActiveContainer(item)}
                              className="px-3 py-1.5 rounded-xl bg-[#007AFF] hover:bg-[#0066D6] text-white font-semibold text-[11px] shadow-xs cursor-pointer"
                            >
                              Place Here
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="pt-3 border-t border-black/[0.06] flex justify-end">
                <button
                  onClick={() => setShowAssignLooseModal(false)}
                  className="px-4 py-2 bg-[#F2F2F7] hover:bg-black/[0.04] text-[#1C1C1E] text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Relocate / Move Single Item */}
        {relocatingItem && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
            onClick={() => setRelocatingItem(null)}
          >
            <form
              onSubmit={handleSaveRelocation}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-black/[0.08] space-y-4 animate-in zoom-in-95"
            >
              <div className="flex items-center justify-between pb-2 border-b border-black/[0.06]">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#007AFF]" />
                  <h3 className="text-sm font-bold text-[#1C1C1E]">
                    Relocate Collectible Asset
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setRelocatingItem(null)}
                  className="text-xs text-[#8E8E93] hover:text-[#1C1C1E] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Item Preview */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#F8F9FB] border border-black/[0.04]">
                <img
                  src={relocatingItem.imageUrl}
                  alt={relocatingItem.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 object-contain rounded-xl bg-white border border-black/[0.06]"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-[#1C1C1E] truncate">
                    {relocatingItem.name}
                  </div>
                  <div className="text-[11px] text-[#8E8E93]">
                    Current: {relocatingItem.storageLocation?.metaStorage || 'Unassigned'} ▸ {relocatingItem.storageLocation?.container || 'None'}
                  </div>
                </div>
              </div>

              {/* Location Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-[#8E8E93] block mb-1">
                    Meta Storage Location (Safe, Cabinet, Room)
                  </label>
                  <input
                    type="text"
                    value={targetMeta}
                    onChange={(e) => setTargetMeta(e.target.value)}
                    list="relocate-meta-list"
                    className="w-full px-3 py-2 bg-[#F2F2F7] border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                    placeholder="e.g. Master Fireproof Safe (Office)"
                    required
                  />
                  <datalist id="relocate-meta-list">
                    {knownMetas.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#8E8E93] block mb-1">
                    Specific Container (Binder, Slab Case, Box)
                  </label>
                  <input
                    type="text"
                    value={targetContainer}
                    onChange={(e) => setTargetContainer(e.target.value)}
                    list="relocate-container-list"
                    className="w-full px-3 py-2 bg-[#F2F2F7] border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                    placeholder="e.g. VaultX 12-Pocket Binder #1"
                    required
                  />
                  <datalist id="relocate-container-list">
                    {knownContainersForMeta.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#8E8E93] block mb-1">
                    Exact Slot / Page / Position (Optional)
                  </label>
                  <input
                    type="text"
                    value={targetSlot}
                    onChange={(e) => setTargetSlot(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F2F2F7] border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                    placeholder="e.g. Page 3, Slot 2 (Top Right) or Row 1, Slab #04"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#8E8E93] block mb-1">
                    Protection / Packaging Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={targetNotes}
                    onChange={(e) => setTargetNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F2F2F7] border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                    placeholder="e.g. Double sleeved with KMC Perfect Fit & silica pack"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRelocatingItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#1C1C1E] bg-[#F2F2F7] hover:bg-black/[0.04] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRelocating}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0066D6] shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isRelocating ? 'Updating...' : 'Save Relocation'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal: Batch Move Selected Items */}
        {showBatchMoveModal && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
            onClick={() => setShowBatchMoveModal(false)}
          >
            <form
              onSubmit={handleExecuteBatchMove}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-black/[0.08] space-y-4 animate-in zoom-in-95"
            >
              <div className="flex items-center justify-between pb-2 border-b border-black/[0.06]">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-[#007AFF]" />
                  <h3 className="text-sm font-bold text-[#1C1C1E]">
                    Batch Move ({selectedItemIds.length} items)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBatchMoveModal(false)}
                  className="text-xs text-[#8E8E93] hover:text-[#1C1C1E] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-[#8E8E93] block mb-1">
                    Destination Meta Storage (Safe / Cabinet / Room)
                  </label>
                  <input
                    type="text"
                    value={batchTargetMeta}
                    onChange={(e) => setBatchTargetMeta(e.target.value)}
                    list="batch-meta-list"
                    className="w-full px-3 py-2 bg-[#F2F2F7] border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                    placeholder="e.g. Master Fireproof Safe (Office)"
                    required
                  />
                  <datalist id="batch-meta-list">
                    {knownMetas.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#8E8E93] block mb-1">
                    Destination Specific Container (Binder / Slab Case)
                  </label>
                  <input
                    type="text"
                    value={batchTargetContainer}
                    onChange={(e) => setBatchTargetContainer(e.target.value)}
                    list="batch-container-list"
                    className="w-full px-3 py-2 bg-[#F2F2F7] border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                    placeholder="e.g. Pelican 1500 Slab Case #2"
                    required
                  />
                  <datalist id="batch-container-list">
                    {knownContainersForMeta.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#8E8E93] block mb-1">
                    Slot Prefix / Tag (Optional)
                  </label>
                  <input
                    type="text"
                    value={batchTargetSlotPrefix}
                    onChange={(e) => setBatchTargetSlotPrefix(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F2F2F7] border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                    placeholder="e.g. Binder Section A"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBatchMoveModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#1C1C1E] bg-[#F2F2F7] hover:bg-black/[0.04] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRelocating}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0066D6] shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isRelocating ? 'Transferring...' : `Move ${selectedItemIds.length} Items`}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

// Sub-component for individual asset card inside the inventory manifest
interface AssetInventoryCardProps {
  item: AssetItem;
  formatPrice: (val: number) => string;
  allLocationPairs: { meta: string; container: string; label: string }[];
  onOpenDetail: () => void;
  onRelocate: () => void;
  onQuickSwitch: (meta: string, container: string) => void;
}

const AssetInventoryCard: React.FC<AssetInventoryCardProps> = ({
  item,
  formatPrice,
  allLocationPairs,
  onOpenDetail,
  onRelocate,
  onQuickSwitch,
}) => {
  const loc = item.storageLocation;
  const totalVal = item.currentPriceUSD * item.quantity;
  const [showQuickDropdown, setShowQuickDropdown] = useState(false);

  return (
    <div
      className="p-3.5 bg-white rounded-2xl border border-black/[0.06] hover:border-black/[0.12] transition-all shadow-2xs hover:shadow-sm flex flex-col justify-between gap-3 text-xs relative"
    >
      <div className="flex items-start gap-3">
        <div className="relative w-14 h-14 rounded-xl bg-[#F2F2F7] border border-black/[0.04] shrink-0 overflow-hidden flex items-center justify-center p-1">
          <img
            src={item.imageUrl}
            alt={item.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain"
          />
          {item.quantity > 1 && (
            <span className="absolute bottom-1 right-1 px-1 rounded bg-black/80 text-white font-mono text-[9px] font-bold">
              x{item.quantity}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#007AFF]/10 text-[#007AFF]">
              {item.condition.replace('_', ' ')}
            </span>
            <span className="text-[10px] text-[#8E8E93] uppercase font-mono">
              {item.category}
            </span>
          </div>

          <h4
            onClick={onOpenDetail}
            className="font-bold text-[#1C1C1E] line-clamp-1 hover:text-[#007AFF] cursor-pointer transition-colors"
            title={item.name}
          >
            {item.name}
          </h4>

          {/* Exact Slot & Storage Position Badge */}
          <div className="mt-1 flex items-center gap-1 text-[11px] text-[#007AFF] font-medium truncate">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">
              {loc?.slot ? loc.slot : loc?.container ? `${loc.container}` : 'Unassigned loose item'}
            </span>
          </div>

          {loc?.notes && (
            <div className="text-[10px] text-[#8E8E93] italic line-clamp-1 mt-0.5">
              {loc.notes}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info & Quick Relocate / Detail Buttons */}
      <div className="pt-2 border-t border-black/[0.04] flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] text-[#8E8E93] uppercase font-bold block">Market Value</span>
          <span className="font-extrabold font-mono text-sm text-[#1C1C1E]">
            {formatPrice(totalVal)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 relative">
          <div className="relative">
            <button
              onClick={() => setShowQuickDropdown(!showQuickDropdown)}
              title="Quick switch to another container"
              className="px-2 py-1 rounded-lg bg-[#F2F2F7] hover:bg-black/[0.06] text-[#1C1C1E] text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeftRight className="w-3 h-3 text-[#007AFF]" />
              <span>Switch</span>
            </button>

            {/* Quick Switch Dropdown Popover */}
            {showQuickDropdown && (
              <div
                className="absolute bottom-full right-0 mb-1 w-56 bg-white rounded-2xl shadow-xl border border-black/[0.1] p-1 z-30 space-y-0.5 animate-in fade-in zoom-in-95"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase text-[#8E8E93] border-b border-black/[0.04]">
                  Quick Switch Location
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {allLocationPairs.map((pair, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        onQuickSwitch(pair.meta, pair.container);
                        setShowQuickDropdown(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] text-[#1C1C1E] hover:bg-blue-50 hover:text-[#007AFF] transition-colors truncate block cursor-pointer"
                    >
                      {pair.label}
                    </button>
                  ))}
                </div>
                <div className="pt-1 border-t border-black/[0.04]">
                  <button
                    onClick={() => {
                      setShowQuickDropdown(false);
                      onRelocate();
                    }}
                    className="w-full text-left px-2.5 py-1 rounded-lg text-[10px] font-semibold text-[#007AFF] hover:bg-blue-50 cursor-pointer"
                  >
                    Custom details & slot...
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onRelocate}
            title="Edit detailed location, slot, and notes"
            className="px-2 py-1 rounded-lg bg-[#F2F2F7] hover:bg-black/[0.06] text-[#1C1C1E] text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="w-3 h-3 text-[#007AFF]" />
            <span>Move</span>
          </button>

          <button
            onClick={onOpenDetail}
            title="View full asset card and comps"
            className="px-2 py-1 rounded-lg bg-[#007AFF]/10 hover:bg-[#007AFF]/20 text-[#007AFF] text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Eye className="w-3 h-3" />
            <span>View</span>
          </button>
        </div>
      </div>
    </div>
  );
};
