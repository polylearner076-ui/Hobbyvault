import React, { useState, useMemo } from 'react';
import { useVault } from '../../context/VaultContext';
import { AssetItem, StorageLocation, StorageUnit, StorageUnitType } from '../../types';
import {
  Box,
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
  Lock,
  Tag,
  Eye,
  Trash2,
  ArrowLeftRight,
  CheckSquare,
  Square,
  Star,
  Flame,
  LayoutGrid,
  Filter,
  RefreshCw,
  Info,
  Archive,
  FolderPlus,
  SlidersHorizontal,
} from 'lucide-react';

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

export const PhysicalStorageHub: React.FC = () => {
  const {
    items,
    updateItem,
    formatPrice,
    storageUnits,
    starredStorageKeys,
    toggleStarLocation,
    isLocationStarred,
    addStorageUnit,
    deleteStorageLocation,
    switchItemStorage,
    batchSwitchItemStorage,
    setSelectedItem,
    setActiveView,
    storageFocusLocation,
    setStorageFocusLocation,
  } = useVault();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMetaStorage, setSelectedMetaStorage] = useState<string | null>(
    storageFocusLocation?.meta || null
  );
  const [selectedContainer, setSelectedContainer] = useState<string | null>(
    storageFocusLocation?.container || null
  );

  // Sync if focus location changes externally
  React.useEffect(() => {
    if (storageFocusLocation?.meta) {
      setSelectedMetaStorage(storageFocusLocation.meta);
    }
    if (storageFocusLocation?.container) {
      setSelectedContainer(storageFocusLocation.container);
    }
  }, [storageFocusLocation]);

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

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState<{
    meta: string;
    container?: string;
    itemCount: number;
  } | null>(null);

  // Filter modes: 'all' | 'starred' | 'empty' | 'unallocated'
  const [filterMode, setFilterMode] = useState<'all' | 'starred' | 'empty' | 'unallocated'>('all');

  // Print manifest dialog state
  const [showPrintManifest, setShowPrintManifest] = useState(false);

  // Group items by Meta-Storage -> Container
  const storageHierarchy = useMemo<StorageHierarchyResult>(() => {
    const hierarchy: Record<string, MetaStorageNode> = {};
    const unallocated: AssetItem[] = [];

    // 1. Initialize all registered storageUnits
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
        };
      }

      const val = item.currentPriceUSD * item.quantity;
      const cost = item.purchasePriceUSD * item.quantity;

      hierarchy[meta].totalValueUSD += val;
      hierarchy[meta].totalCostUSD += cost;
      hierarchy[meta].itemCount += item.quantity;

      hierarchy[meta].containers[cont].totalValueUSD += val;
      hierarchy[meta].containers[cont].totalCostUSD += cost;
      hierarchy[meta].containers[cont].items.push(item);
    });

    return { hierarchy, unallocated };
  }, [items, storageUnits]);

  // Summary Metrics
  const totalAllocatedItems = items.length - storageHierarchy.unallocated.length;
  const totalItemsCount = items.length;
  const totalPhysicalValueUSD = (Object.values(storageHierarchy.hierarchy) as MetaStorageNode[]).reduce(
    (acc: number, m: MetaStorageNode) => acc + m.totalValueUSD,
    0
  );
  const totalRegisteredMetaLocations = Object.keys(storageHierarchy.hierarchy).length;
  const totalRegisteredContainers = (Object.values(storageHierarchy.hierarchy) as MetaStorageNode[]).reduce(
    (acc: number, m: MetaStorageNode) => acc + Object.keys(m.containers).length,
    0
  );

  // List of all registered location pairs for quick selection
  const allLocationPairs = useMemo(() => {
    const list: { meta: string; container: string; label: string }[] = [];
    (Object.entries(storageHierarchy.hierarchy) as [string, MetaStorageNode][]).forEach(([meta, metaNode]) => {
      Object.keys(metaNode.containers).forEach((cont) => {
        list.push({
          meta,
          container: cont,
          label: `${meta} ➔ ${cont}`,
        });
      });
    });
    return list;
  }, [storageHierarchy]);

  // Current selected active container data
  const currentContainerData = useMemo(() => {
    if (!selectedMetaStorage || !selectedContainer) return null;
    const metaNode = storageHierarchy.hierarchy[selectedMetaStorage];
    if (!metaNode) return null;
    return metaNode.containers[selectedContainer] || null;
  }, [storageHierarchy, selectedMetaStorage, selectedContainer]);

  // Current selected meta location data
  const currentMetaData = useMemo(() => {
    if (!selectedMetaStorage) return null;
    return storageHierarchy.hierarchy[selectedMetaStorage] || null;
  }, [storageHierarchy, selectedMetaStorage]);

  // Filtered items in the active container based on search query
  const filteredActiveItems = useMemo(() => {
    if (!currentContainerData) return [];
    if (!searchQuery.trim()) return currentContainerData.items;
    const q = searchQuery.toLowerCase();
    return currentContainerData.items.filter(
      (it) =>
        it.name.toLowerCase().includes(q) ||
        it.category.toLowerCase().includes(q) ||
        it.storageLocation?.slot?.toLowerCase().includes(q) ||
        it.storageLocation?.notes?.toLowerCase().includes(q) ||
        it.cardSpecs?.gradingCompany?.toLowerCase().includes(q) ||
        it.cardSpecs?.gradeNumber?.toLowerCase().includes(q)
    );
  }, [currentContainerData, searchQuery]);

  // Filtered meta storage entries based on sidebar filter & search
  const filteredMetaEntries = useMemo(() => {
    let entries = Object.entries(storageHierarchy.hierarchy) as [string, MetaStorageNode][];

    // Filter mode
    if (filterMode === 'starred') {
      entries = entries.filter(([meta, metaData]) => {
        if (isLocationStarred(meta)) return true;
        return Object.keys(metaData.containers).some((c) => isLocationStarred(`${meta}:::${c}`));
      });
    } else if (filterMode === 'empty') {
      entries = entries.filter(([_, metaData]) => metaData.itemCount === 0);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      entries = entries.filter(([meta, metaData]) => {
        if (meta.toLowerCase().includes(q)) return true;
        const matchingContainer = Object.keys(metaData.containers).some((c) => c.toLowerCase().includes(q));
        if (matchingContainer) return true;
        return Object.values(metaData.containers).some((c) =>
          c.items.some((it) => it.name.toLowerCase().includes(q))
        );
      });
    }

    // Sort: Starred locations first, then alphabetical
    return entries.sort(([metaA], [metaB]) => {
      const isStarA = isLocationStarred(metaA);
      const isStarB = isLocationStarred(metaB);
      if (isStarA && !isStarB) return -1;
      if (!isStarA && isStarB) return 1;
      return metaA.localeCompare(metaB);
    });
  }, [storageHierarchy, filterMode, searchQuery, isLocationStarred]);

  // Handle creating a new storage location
  const handleCreateStorage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMetaName.trim() || !newContainerName.trim()) {
      alert('Please provide both a Meta Storage place (e.g. Office Safe) and a Container name (e.g. Top Deck Box).');
      return;
    }

    const created = addStorageUnit({
      metaStorage: newMetaName.trim(),
      container: newContainerName.trim(),
      type: newStorageType,
      notes: newStorageNotes.trim(),
    });

    setSelectedMetaStorage(created.metaStorage);
    setSelectedContainer(created.container);
    setNewContainerName('');
    setNewStorageNotes('');
    setShowAddStorage(false);

    setCreationToast(`Location registered: ${created.metaStorage} ➔ ${created.container}`);
    setTimeout(() => setCreationToast(null), 4000);
  };

  // Handle opening relocation modal
  const handleOpenRelocate = (item: AssetItem) => {
    setRelocatingItem(item);
    setTargetMeta(item.storageLocation?.metaStorage || selectedMetaStorage || '');
    setTargetContainer(item.storageLocation?.container || selectedContainer || '');
    setTargetSlot(item.storageLocation?.slot || '');
    setTargetNotes(item.storageLocation?.notes || '');
  };

  // Execute single item relocation
  const handleSaveRelocate = async () => {
    if (!relocatingItem) return;
    if (!targetMeta.trim() || !targetContainer.trim()) {
      alert('Please specify both the Meta Location and Container.');
      return;
    }

    setIsRelocating(true);
    try {
      const newLoc: StorageLocation = {
        metaStorage: targetMeta.trim(),
        container: targetContainer.trim(),
        slot: targetSlot.trim() || undefined,
        notes: targetNotes.trim() || undefined,
      };
      await switchItemStorage(relocatingItem.id, newLoc);
      setRelocatingItem(null);
    } catch (err) {
      console.error(err);
      alert('Failed to update storage position.');
    } finally {
      setIsRelocating(false);
    }
  };

  // Execute quick inline storage container change
  const handleQuickInlineSwitch = async (item: AssetItem, targetPairKey: string) => {
    const [tMeta, tCont] = targetPairKey.split(':::');
    if (!tMeta || !tCont) return;
    try {
      await switchItemStorage(item.id, {
        metaStorage: tMeta,
        container: tCont,
        slot: item.storageLocation?.slot,
        notes: item.storageLocation?.notes,
      });
    } catch (err) {
      console.error(err);
      alert('Failed to switch storage.');
    }
  };

  // Execute batch move
  const handleExecuteBatchMove = async () => {
    if (selectedItemIds.length === 0 || !batchTargetMeta.trim() || !batchTargetContainer.trim()) {
      alert('Please pick items and specify target storage location.');
      return;
    }

    try {
      await batchSwitchItemStorage(selectedItemIds, {
        metaStorage: batchTargetMeta.trim(),
        container: batchTargetContainer.trim(),
        slot: batchTargetSlotPrefix.trim() ? `${batchTargetSlotPrefix.trim()}` : undefined,
      });
      setShowBatchMoveModal(false);
      setIsBatchMode(false);
      setSelectedItemIds([]);
    } catch (err) {
      console.error(err);
      alert('Failed to batch move items.');
    }
  };

  // Execute deletion of location
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteStorageLocation(deleteTarget.meta, deleteTarget.container);
      if (deleteTarget.container && selectedContainer === deleteTarget.container) {
        setSelectedContainer(null);
      } else if (!deleteTarget.container && selectedMetaStorage === deleteTarget.meta) {
        setSelectedMetaStorage(null);
        setSelectedContainer(null);
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      alert('Failed to delete storage location.');
    }
  };

  const getContainerIcon = (type?: StorageUnitType) => {
    switch (type) {
      case 'safe':
        return <Lock className="w-4 h-4 text-amber-600" />;
      case 'binder':
        return <Layers className="w-4 h-4 text-[#007AFF]" />;
      case 'slab_case':
        return <Shield className="w-4 h-4 text-emerald-600" />;
      case 'box':
        return <Box className="w-4 h-4 text-orange-600" />;
      case 'display':
        return <Eye className="w-4 h-4 text-purple-600" />;
      case 'shelf':
        return <Archive className="w-4 h-4 text-indigo-600" />;
      case 'deposit_box':
        return <MapPin className="w-4 h-4 text-red-600" />;
      default:
        return <Box className="w-4 h-4 text-[#8E8E93]" />;
    }
  };

  return (
    <div id="physical-storage-microservice" className="flex-1 flex flex-col bg-[#F2F2F7]">
      {/* Microservice Header Banner */}
      <div className="bg-white border-b border-black/[0.08] sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Title & Stats */}
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#007AFF] to-sky-400 p-[1px] shadow-sm flex items-center justify-center">
                  <div className="w-full h-full bg-white rounded-[15px] flex items-center justify-center">
                    <Box className="w-5 h-5 text-[#007AFF]" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1C1C1E]">
                      Physical Storage & Inventory Hub
                    </h1>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#007AFF] border border-blue-200">
                      Real-World Vault Map
                    </span>
                  </div>
                  <p className="text-xs text-[#8E8E93] mt-0.5">
                    Pinpoint collectibles across real-world fireproof safes, slab cases, binders, and exact slots.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center flex-wrap gap-2">
              <button
                id="btn-print-manifest"
                onClick={() => setShowPrintManifest(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#F2F2F7] border border-black/[0.08] text-xs font-semibold text-[#1C1C1E] transition-colors shadow-xs"
              >
                <Printer className="w-4 h-4 text-[#8E8E93]" />
                <span>Print Manifest</span>
              </button>

              <button
                id="btn-new-location"
                onClick={() => setShowAddStorage(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#007AFF] hover:bg-[#0066D6] text-white text-xs font-semibold transition-all shadow-xs active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>New Location</span>
              </button>

              <button
                id="btn-switch-to-portfolio"
                onClick={() => setActiveView('portfolio')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black/[0.05] hover:bg-black/[0.08] text-xs font-semibold text-[#1C1C1E] transition-colors"
                title="Switch back to Portfolio Vault"
              >
                <Layers className="w-4 h-4 text-[#8E8E93]" />
                <span className="hidden sm:inline">Portfolio Vault</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93]" />
              </button>
            </div>
          </div>

          {/* Metric Overview Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-black/[0.06]">
            <div className="bg-[#F2F2F7]/80 rounded-xl p-2.5 border border-black/[0.04]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">
                Physical Stored Value
              </div>
              <div className="text-base font-bold text-[#1C1C1E] mt-0.5">
                {formatPrice(totalPhysicalValueUSD)}
              </div>
            </div>

            <div className="bg-[#F2F2F7]/80 rounded-xl p-2.5 border border-black/[0.04]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">
                Allocated Cards
              </div>
              <div className="text-base font-bold text-[#1C1C1E] mt-0.5 flex items-center gap-1.5">
                <span>{totalAllocatedItems} / {totalItemsCount}</span>
                <span className="text-[11px] font-normal text-emerald-600">
                  ({totalItemsCount > 0 ? Math.round((totalAllocatedItems / totalItemsCount) * 100) : 0}%)
                </span>
              </div>
            </div>

            <div className="bg-[#F2F2F7]/80 rounded-xl p-2.5 border border-black/[0.04]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">
                Registered Units
              </div>
              <div className="text-base font-bold text-[#1C1C1E] mt-0.5">
                {totalRegisteredMetaLocations} Places • {totalRegisteredContainers} Units
              </div>
            </div>

            <div
              onClick={() => {
                setFilterMode('unallocated');
                setSelectedMetaStorage(null);
                setSelectedContainer(null);
              }}
              className={`rounded-xl p-2.5 border transition-all cursor-pointer ${
                storageHierarchy.unallocated.length > 0
                  ? 'bg-amber-50/80 border-amber-200/80 hover:bg-amber-100/80'
                  : 'bg-[#F2F2F7]/80 border-black/[0.04]'
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93] flex items-center justify-between">
                <span>Unassigned Loose</span>
                {storageHierarchy.unallocated.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                )}
              </div>
              <div className="text-base font-bold text-[#1C1C1E] mt-0.5 flex items-center gap-1">
                <span>{storageHierarchy.unallocated.length} cards</span>
                <span className="text-[10px] text-[#8E8E93] font-normal">➔ Click to assign</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Creation Toast */}
      {creationToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1C1C1E] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-semibold">{creationToast}</span>
        </div>
      )}

      {/* Main Microservice Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar: Physical Hierarchy Explorer */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-3">
          {/* Filter Pills */}
          <div className="bg-white p-2 rounded-2xl border border-black/[0.06] shadow-xs flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                filterMode === 'all'
                  ? 'bg-[#007AFF] text-white shadow-xs font-semibold'
                  : 'text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-black/[0.04]'
              }`}
            >
              All ({totalRegisteredMetaLocations})
            </button>
            <button
              onClick={() => setFilterMode('starred')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                filterMode === 'starred'
                  ? 'bg-amber-500 text-white shadow-xs font-semibold'
                  : 'text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-black/[0.04]'
              }`}
            >
              <Star className="w-3 h-3 fill-current" />
              <span>Starred</span>
            </button>
            <button
              onClick={() => setFilterMode('empty')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                filterMode === 'empty'
                  ? 'bg-[#1C1C1E] text-white shadow-xs font-semibold'
                  : 'text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-black/[0.04]'
              }`}
            >
              Empty
            </button>
            <button
              onClick={() => {
                setFilterMode('unallocated');
                setSelectedMetaStorage(null);
                setSelectedContainer(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                filterMode === 'unallocated'
                  ? 'bg-amber-500 text-white shadow-xs font-semibold'
                  : 'text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-black/[0.04]'
              }`}
            >
              Loose ({storageHierarchy.unallocated.length})
            </button>
          </div>

          {/* Search box for storage */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#8E8E93] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search safe, binder, slot, card..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-black/[0.08] rounded-xl text-xs focus:outline-none focus:border-[#007AFF] shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#8E8E93] hover:text-[#1C1C1E]"
              >
                Clear
              </button>
            )}
          </div>

          {/* Hierarchy Tree */}
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-xs overflow-hidden flex flex-col max-h-[calc(100vh-280px)] overflow-y-auto">
            <div className="p-3 border-b border-black/[0.06] bg-[#F2F2F7]/50 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">
                Physical Locations & Units
              </span>
              <button
                onClick={() => setShowAddStorage(true)}
                className="text-[11px] font-semibold text-[#007AFF] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Unit</span>
              </button>
            </div>

            <div className="p-2 space-y-1.5">
              {filteredMetaEntries.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#8E8E93]">
                  No storage locations match your filter.
                </div>
              ) : (
                filteredMetaEntries.map(([metaName, metaData]) => {
                  const isMetaSelected = selectedMetaStorage === metaName;
                  const containerCount = Object.keys(metaData.containers).length;
                  const isMetaStarred = isLocationStarred(metaName);

                  return (
                    <div
                      key={metaName}
                      className={`rounded-xl border transition-all ${
                        isMetaSelected
                          ? 'border-[#007AFF]/30 bg-blue-50/40 shadow-xs'
                          : 'border-black/[0.04] bg-white hover:border-black/[0.1]'
                      }`}
                    >
                      {/* Meta Storage Header */}
                      <div className="p-2.5 flex items-center justify-between gap-2">
                        <button
                          onClick={() => {
                            setSelectedMetaStorage(metaName);
                            // Auto-select first container if available
                            const firstCont = Object.keys(metaData.containers)[0];
                            setSelectedContainer(firstCont || null);
                          }}
                          className="flex-1 flex items-start gap-2 text-left cursor-pointer"
                        >
                          <div className="p-1.5 rounded-lg bg-black/[0.04] text-[#1C1C1E] shrink-0 mt-0.5">
                            <Lock className="w-3.5 h-3.5 text-[#007AFF]" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[#1C1C1E] truncate flex items-center gap-1.5">
                              <span>{metaName}</span>
                              {isMetaStarred && (
                                <Star className="w-3 h-3 fill-amber-400 text-amber-500 shrink-0" />
                              )}
                            </div>
                            <div className="text-[10px] text-[#8E8E93] mt-0.5">
                              {containerCount} {containerCount === 1 ? 'container' : 'containers'} • {metaData.itemCount} items
                            </div>
                          </div>
                        </button>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Star button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStarLocation(metaName);
                            }}
                            title={isMetaStarred ? 'Unstar Location' : 'Star Location'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isMetaStarred
                                ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                                : 'text-[#8E8E93] hover:text-amber-500 hover:bg-black/[0.04]'
                            }`}
                          >
                            <Star className={`w-3.5 h-3.5 ${isMetaStarred ? 'fill-current' : ''}`} />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget({
                                meta: metaName,
                                itemCount: metaData.itemCount,
                              });
                            }}
                            title={metaData.itemCount === 0 ? 'Delete unused location' : 'Delete location'}
                            className="p-1.5 rounded-lg text-[#8E8E93] hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Containers Inside Meta Location */}
                      <div className="px-2 pb-2 pt-0.5 space-y-1">
                        {(Object.entries(metaData.containers) as [string, ContainerNode][]).map(
                          ([containerName, cData]) => {
                            const isContainerSelected =
                              selectedMetaStorage === metaName && selectedContainer === containerName;
                            const containerKey = `${metaName}:::${containerName}`;
                            const isContStarred = isLocationStarred(containerKey);

                            return (
                              <div
                                key={containerName}
                                onClick={() => {
                                  setSelectedMetaStorage(metaName);
                                  setSelectedContainer(containerName);
                                }}
                                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-all cursor-pointer ${
                                  isContainerSelected
                                    ? 'bg-[#007AFF] text-white shadow-xs font-semibold'
                                    : 'bg-black/[0.02] text-[#1C1C1E] hover:bg-black/[0.05]'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className={isContainerSelected ? 'text-white' : ''}>
                                    {getContainerIcon(cData.unitConfig?.type)}
                                  </span>
                                  <span className="truncate">{containerName}</span>
                                  {isContStarred && (
                                    <Star className={`w-3 h-3 shrink-0 ${isContainerSelected ? 'fill-white text-white' : 'fill-amber-400 text-amber-500'}`} />
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                  <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                                      isContainerSelected
                                        ? 'bg-white/20 text-white font-medium'
                                        : cData.items.length === 0
                                        ? 'bg-zinc-100 text-zinc-500'
                                        : 'bg-black/[0.06] text-[#1C1C1E]'
                                    }`}
                                  >
                                    {cData.items.length} {cData.items.length === 1 ? 'item' : 'items'}
                                  </span>

                                  {/* Delete container button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteTarget({
                                        meta: metaName,
                                        container: containerName,
                                        itemCount: cData.items.length,
                                      });
                                    }}
                                    title={cData.items.length === 0 ? 'Delete unused container' : 'Delete container'}
                                    className={`p-1 rounded transition-colors ${
                                      isContainerSelected
                                        ? 'text-white/80 hover:text-white hover:bg-white/20'
                                        : 'text-[#8E8E93] hover:text-red-500 hover:bg-red-50'
                                    }`}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Main Content Pane */}
        <div className="flex-1 flex flex-col min-w-0">
          {filterMode === 'unallocated' ? (
            /* Unallocated Loose Cards View */
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-xs p-6 flex-1">
              <div className="flex items-center justify-between pb-4 border-b border-black/[0.06]">
                <div>
                  <h2 className="text-base font-bold text-[#1C1C1E] flex items-center gap-2">
                    <span>Unallocated Collectibles</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                      {storageHierarchy.unallocated.length} Loose
                    </span>
                  </h2>
                  <p className="text-xs text-[#8E8E93] mt-0.5">
                    These collectible assets are in your portfolio but have not been assigned to a physical safe, binder, or slab case.
                  </p>
                </div>
              </div>

              {storageHierarchy.unallocated.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                    <Check className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-[#1C1C1E]">All Collectibles Mapped!</h3>
                  <p className="text-xs text-[#8E8E93] mt-1">
                    Every asset in your portfolio is assigned to a physical storage container.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
                  {storageHierarchy.unallocated.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl border border-black/[0.08] p-3.5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="w-16 h-20 object-contain rounded-lg bg-black/[0.02] p-1 border border-black/[0.04] shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#007AFF]">
                            {item.category}
                          </span>
                          <h4 className="text-xs font-bold text-[#1C1C1E] truncate mt-0.5">
                            {item.name}
                          </h4>
                          <div className="text-xs font-bold text-[#1C1C1E] mt-1">
                            {formatPrice(item.currentPriceUSD * item.quantity)}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-black/[0.04] flex items-center gap-2">
                        <button
                          onClick={() => handleOpenRelocate(item)}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-[#007AFF] hover:bg-[#0066D6] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Assign Location</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : selectedMetaStorage && selectedContainer && currentContainerData ? (
            /* Selected Container Detail & Asset Grid */
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-xs flex-1 flex flex-col">
              {/* Container Header */}
              <div className="p-5 border-b border-black/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#8E8E93]">
                    <span className="font-medium">{selectedMetaStorage}</span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="font-bold text-[#1C1C1E]">{selectedContainer}</span>
                  </div>

                  <div className="flex items-center gap-2.5 mt-1.5">
                    <h2 className="text-xl font-bold text-[#1C1C1E] tracking-tight">
                      {selectedContainer}
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#007AFF] text-xs font-semibold border border-blue-200">
                      {getContainerIcon(currentContainerData.unitConfig?.type)}
                      <span className="capitalize">
                        {currentContainerData.unitConfig?.type || 'Container'}
                      </span>
                    </span>

                    {/* Star button */}
                    <button
                      onClick={() => toggleStarLocation(`${selectedMetaStorage}:::${selectedContainer}`)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        isLocationStarred(`${selectedMetaStorage}:::${selectedContainer}`)
                          ? 'bg-amber-50 text-amber-500 border-amber-200'
                          : 'text-[#8E8E93] border-black/[0.08] hover:text-amber-500'
                      }`}
                      title="Star this container"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          isLocationStarred(`${selectedMetaStorage}:::${selectedContainer}`)
                            ? 'fill-amber-400'
                            : ''
                        }`}
                      />
                    </button>
                  </div>

                  {currentContainerData.unitConfig?.notes && (
                    <p className="text-xs text-[#8E8E93] mt-1 italic">
                      “{currentContainerData.unitConfig.notes}”
                    </p>
                  )}
                </div>

                {/* Right Container Controls */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setShowAssignLooseModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-colors shadow-xs"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>Assign Items Here</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsBatchMode(!isBatchMode);
                      setSelectedItemIds([]);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors shadow-xs ${
                      isBatchMode
                        ? 'bg-[#1C1C1E] text-white border-[#1C1C1E]'
                        : 'bg-white hover:bg-[#F2F2F7] text-[#1C1C1E] border-black/[0.08]'
                    }`}
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>{isBatchMode ? 'Cancel Batch' : 'Batch Move'}</span>
                  </button>

                  <button
                    onClick={() =>
                      setDeleteTarget({
                        meta: selectedMetaStorage,
                        container: selectedContainer,
                        itemCount: currentContainerData.items.length,
                      })
                    }
                    className="p-2 rounded-xl text-[#8E8E93] hover:text-red-600 hover:bg-red-50 border border-black/[0.08] transition-colors"
                    title="Delete container"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Batch Action Ribbon */}
              {isBatchMode && (
                <div className="bg-[#1C1C1E] text-white px-5 py-2.5 flex items-center justify-between gap-4 animate-in fade-in">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        if (selectedItemIds.length === currentContainerData.items.length) {
                          setSelectedItemIds([]);
                        } else {
                          setSelectedItemIds(currentContainerData.items.map((i) => i.id));
                        }
                      }}
                      className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white font-medium"
                    >
                      {selectedItemIds.length === currentContainerData.items.length ? (
                        <CheckSquare className="w-4 h-4 text-[#007AFF]" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                      <span>Select All ({currentContainerData.items.length})</span>
                    </button>
                    <span className="text-xs text-zinc-400">
                      {selectedItemIds.length} items selected
                    </span>
                  </div>

                  <button
                    disabled={selectedItemIds.length === 0}
                    onClick={() => {
                      setBatchTargetMeta('');
                      setBatchTargetContainer('');
                      setShowBatchMoveModal(true);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-[#007AFF] hover:bg-[#0066D6] disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <span>Relocate {selectedItemIds.length} Assets</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Container Content Grid */}
              <div className="p-5 flex-1 overflow-y-auto">
                {currentContainerData.items.length === 0 ? (
                  <div className="py-20 text-center flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mb-3">
                      <Box className="w-7 h-7" />
                    </div>
                    <h3 className="text-sm font-bold text-[#1C1C1E]">This container is empty</h3>
                    <p className="text-xs text-[#8E8E93] max-w-sm mt-1">
                      No cards are currently placed in <strong>{selectedContainer}</strong>. You can assign loose items or move assets here.
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                      <button
                        onClick={() => setShowAssignLooseModal(true)}
                        className="px-4 py-2 rounded-xl bg-[#007AFF] text-white text-xs font-semibold hover:bg-[#0066D6] transition-colors"
                      >
                        Assign Items to this Container
                      </button>
                      <button
                        onClick={() =>
                          setDeleteTarget({
                            meta: selectedMetaStorage,
                            container: selectedContainer,
                            itemCount: 0,
                          })
                        }
                        className="px-3.5 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors"
                      >
                        Delete Empty Container
                      </button>
                    </div>
                  </div>
                ) : filteredActiveItems.length === 0 ? (
                  <div className="py-16 text-center text-xs text-[#8E8E93]">
                    No items in this container match "{searchQuery}".
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredActiveItems.map((item) => {
                      const isSelected = selectedItemIds.includes(item.id);
                      const gain = item.currentPriceUSD - item.purchasePriceUSD;

                      return (
                        <div
                          key={item.id}
                          className={`bg-white rounded-2xl border transition-all p-4 flex flex-col justify-between gap-3 shadow-xs hover:shadow-md ${
                            isSelected
                              ? 'border-[#007AFF] ring-2 ring-[#007AFF]/20 bg-blue-50/20'
                              : 'border-black/[0.08] hover:border-black/[0.15]'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Batch checkbox */}
                            {isBatchMode && (
                              <button
                                onClick={() => {
                                  setSelectedItemIds((prev) =>
                                    prev.includes(item.id)
                                      ? prev.filter((id) => id !== item.id)
                                      : [...prev, item.id]
                                  );
                                }}
                                className="mt-1 text-[#007AFF]"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 fill-current" />
                                ) : (
                                  <Square className="w-4 h-4 text-[#8E8E93]" />
                                )}
                              </button>
                            )}

                            {/* Card Image */}
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              referrerPolicy="no-referrer"
                              className="w-16 h-22 object-contain rounded-lg bg-black/[0.02] p-1 border border-black/[0.04] shrink-0"
                            />

                            {/* Card Details */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#007AFF]">
                                  {item.category}
                                </span>
                                {item.cardSpecs?.gradingCompany && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
                                    {item.cardSpecs.gradingCompany} {item.cardSpecs.gradeNumber}
                                  </span>
                                )}
                              </div>

                              <h4 className="text-xs font-bold text-[#1C1C1E] truncate mt-0.5">
                                {item.name}
                              </h4>

                              <div className="flex items-baseline gap-1.5 mt-1">
                                <span className="text-sm font-bold text-[#1C1C1E]">
                                  {formatPrice(item.currentPriceUSD * item.quantity)}
                                </span>
                                <span
                                  className={`text-[10px] font-semibold ${
                                    gain >= 0 ? 'text-emerald-600' : 'text-red-600'
                                  }`}
                                >
                                  {gain >= 0 ? '+' : ''}
                                  {formatPrice(gain * item.quantity)}
                                </span>
                              </div>

                              {/* Slot / Page Position */}
                              <div className="mt-2 flex items-center gap-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">
                                  Slot:
                                </span>
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-900 border border-zinc-200">
                                  {item.storageLocation?.slot || 'Position #1'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Quick Switch Dropdown & Actions */}
                          <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between gap-2">
                            <div className="flex-1">
                              <select
                                value={`${item.storageLocation?.metaStorage}:::${item.storageLocation?.container}`}
                                onChange={(e) => handleQuickInlineSwitch(item, e.target.value)}
                                className="w-full text-[11px] py-1 px-2 bg-black/[0.03] hover:bg-black/[0.06] border border-black/[0.08] rounded-lg text-[#1C1C1E] font-medium focus:outline-none focus:border-[#007AFF] cursor-pointer"
                              >
                                {allLocationPairs.map((pair) => (
                                  <option
                                    key={`${pair.meta}:::${pair.container}`}
                                    value={`${pair.meta}:::${pair.container}`}
                                  >
                                    Switch ➔ {pair.container} ({pair.meta})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <button
                              onClick={() => handleOpenRelocate(item)}
                              className="px-2.5 py-1 rounded-lg bg-black/[0.04] hover:bg-black/[0.08] text-xs font-semibold text-[#1C1C1E] transition-colors"
                              title="Detailed relocation & slot change"
                            >
                              Move
                            </button>

                            <button
                              onClick={() => setSelectedItem(item)}
                              className="p-1 rounded-lg text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-black/[0.04] transition-colors"
                              title="Inspect asset card"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : selectedMetaStorage && currentMetaData ? (
            /* Selected Meta Location Overview */
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-xs p-6 flex-1 flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-black/[0.06]">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-[#1C1C1E]">{selectedMetaStorage}</h2>
                    {isLocationStarred(selectedMetaStorage) && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        Starred
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#8E8E93] mt-0.5">
                    Physical location containing {Object.keys(currentMetaData.containers).length} storage units and {currentMetaData.itemCount} collectible items.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleStarLocation(selectedMetaStorage)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/[0.08] text-xs font-semibold hover:bg-black/[0.04] transition-colors"
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        isLocationStarred(selectedMetaStorage)
                          ? 'fill-amber-400 text-amber-500'
                          : 'text-[#8E8E93]'
                      }`}
                    />
                    <span>{isLocationStarred(selectedMetaStorage) ? 'Starred' : 'Star Location'}</span>
                  </button>

                  <button
                    onClick={() =>
                      setDeleteTarget({
                        meta: selectedMetaStorage,
                        itemCount: currentMetaData.itemCount,
                      })
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Location</span>
                  </button>
                </div>
              </div>

              {/* Container Tiles */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
                {(Object.entries(currentMetaData.containers) as [string, ContainerNode][]).map(
                  ([contName, cData]) => (
                    <div
                      key={contName}
                      onClick={() => setSelectedContainer(contName)}
                      className="bg-[#F2F2F7]/50 hover:bg-[#F2F2F7] rounded-2xl border border-black/[0.06] p-4 transition-all cursor-pointer hover:shadow-md flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-white text-[#007AFF] shadow-xs">
                            {getContainerIcon(cData.unitConfig?.type)}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-[#1C1C1E]">{contName}</h3>
                            <span className="text-[10px] text-[#8E8E93] capitalize">
                              {cData.unitConfig?.type || 'Container'}
                            </span>
                          </div>
                        </div>

                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-white border border-black/[0.06]">
                          {cData.items.length} items
                        </span>
                      </div>

                      <div className="pt-2 border-t border-black/[0.04] flex items-center justify-between text-xs">
                        <span className="text-[#8E8E93]">Total Value:</span>
                        <span className="font-bold text-[#1C1C1E]">
                          {formatPrice(cData.totalValueUSD)}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          ) : (
            /* Welcome / Overview Screen */
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-xs p-8 flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#007AFF] flex items-center justify-center mb-4 shadow-sm">
                <Box className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-[#1C1C1E] tracking-tight">
                Select a Physical Storage Location
              </h2>
              <p className="text-xs text-[#8E8E93] max-w-md mt-1.5 leading-relaxed">
                Choose any safe, slab case, or binder from the sidebar to inspect collectible assets, transfer cards between containers, or manage your real-world vault.
              </p>

              {/* Quick Pick Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-6 max-w-xl">
                {Object.keys(storageHierarchy.hierarchy).map((meta) => (
                  <button
                    key={meta}
                    onClick={() => {
                      setSelectedMetaStorage(meta);
                      const firstCont = Object.keys(storageHierarchy.hierarchy[meta].containers)[0];
                      setSelectedContainer(firstCont || null);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#F2F2F7] hover:bg-[#007AFF] hover:text-white text-[#1C1C1E] text-xs font-semibold transition-all shadow-xs"
                  >
                    {meta}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* NEW LOCATION MODAL */}
      {showAddStorage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-black/[0.08] shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-[#007AFF]" />
                <h3 className="text-base font-bold text-[#1C1C1E]">Register Physical Location</h3>
              </div>
              <button
                onClick={() => setShowAddStorage(false)}
                className="text-[#8E8E93] hover:text-[#1C1C1E] text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStorage} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold text-[#1C1C1E] block mb-1">
                  1. Meta Storage / Room / Safe Name:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Master Fireproof Safe (Office)"
                  value={newMetaName}
                  onChange={(e) => setNewMetaName(e.target.value)}
                  list="known-meta-names"
                  className="w-full px-3 py-2 bg-white border border-black/[0.08] rounded-xl text-xs focus:outline-none focus:border-[#007AFF]"
                />
                <datalist id="known-meta-names">
                  {Object.keys(storageHierarchy.hierarchy).map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="font-bold text-[#1C1C1E] block mb-1">
                  2. Container / Unit Name:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pelican 1500 Slab Case, VaultX 12-Pocket Binder"
                  value={newContainerName}
                  onChange={(e) => setNewContainerName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-black/[0.08] rounded-xl text-xs focus:outline-none focus:border-[#007AFF]"
                />
              </div>

              <div>
                <label className="font-bold text-[#1C1C1E] block mb-1">3. Storage Type:</label>
                <select
                  value={newStorageType}
                  onChange={(e) => setNewStorageType(e.target.value as StorageUnitType)}
                  className="w-full px-3 py-2 bg-white border border-black/[0.08] rounded-xl text-xs focus:outline-none focus:border-[#007AFF]"
                >
                  <option value="safe">Fireproof Safe / Lockbox</option>
                  <option value="binder">Card Binder (Zip / Ringless)</option>
                  <option value="slab_case">Slab Case / Pelican Case</option>
                  <option value="box">Card Box / Monster Box</option>
                  <option value="display">Display Cabinet / Wall Frame</option>
                  <option value="shelf">Vault Shelf / Closet</option>
                  <option value="deposit_box">Bank Safe Deposit Box</option>
                  <option value="drawer">Office Drawer</option>
                  <option value="other">Other Storage Unit</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#1C1C1E] block mb-1">
                  4. Protection Notes (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Silica gel packet, UV Bumper, 4-digit code"
                  value={newStorageNotes}
                  onChange={(e) => setNewStorageNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-black/[0.08] rounded-xl text-xs focus:outline-none focus:border-[#007AFF]"
                />
              </div>

              <div className="pt-3 border-t border-black/[0.06] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStorage(false)}
                  className="px-4 py-2 rounded-xl border border-black/[0.08] text-[#1C1C1E] font-medium hover:bg-black/[0.04]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#007AFF] hover:bg-[#0066D6] text-white font-semibold shadow-xs"
                >
                  Register Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-black/[0.08] shadow-2xl p-6 w-full max-w-sm text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 mx-auto flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#1C1C1E]">
              Delete {deleteTarget.container ? `"${deleteTarget.container}"` : `"${deleteTarget.meta}"`}?
            </h3>
            <p className="text-xs text-[#8E8E93] mt-2">
              {deleteTarget.itemCount > 0
                ? `This location contains ${deleteTarget.itemCount} items. Deleting it will mark those items as unassigned loose cards.`
                : 'This location is unused with 0 items. It will be permanently removed.'}
            </p>

            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-black/[0.08] text-xs font-semibold text-[#1C1C1E] hover:bg-black/[0.04]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE ITEM RELOCATE MODAL */}
      {relocatingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-black/[0.08] shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#007AFF]" />
                <h3 className="text-base font-bold text-[#1C1C1E]">Relocate Collectible</h3>
              </div>
              <button
                onClick={() => setRelocatingItem(null)}
                className="text-[#8E8E93] hover:text-[#1C1C1E] text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-3 my-4 p-3 rounded-2xl bg-[#F2F2F7]">
              <img
                src={relocatingItem.imageUrl}
                alt={relocatingItem.name}
                referrerPolicy="no-referrer"
                className="w-12 h-16 object-contain rounded-lg bg-white p-1"
              />
              <div>
                <h4 className="text-xs font-bold text-[#1C1C1E]">{relocatingItem.name}</h4>
                <p className="text-[11px] text-[#8E8E93]">
                  Current: {relocatingItem.storageLocation?.metaStorage || 'Loose'} ➔{' '}
                  {relocatingItem.storageLocation?.container || 'Unassigned'}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#1C1C1E] block mb-1">Target Meta Storage:</label>
                <input
                  type="text"
                  value={targetMeta}
                  onChange={(e) => setTargetMeta(e.target.value)}
                  list="known-meta-names"
                  className="w-full px-3 py-2 bg-white border border-black/[0.08] rounded-xl text-xs focus:outline-none focus:border-[#007AFF]"
                />
              </div>

              <div>
                <label className="font-bold text-[#1C1C1E] block mb-1">Target Container:</label>
                <input
                  type="text"
                  value={targetContainer}
                  onChange={(e) => setTargetContainer(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-black/[0.08] rounded-xl text-xs focus:outline-none focus:border-[#007AFF]"
                />
              </div>

              <div>
                <label className="font-bold text-[#1C1C1E] block mb-1">Exact Slot / Page / Row:</label>
                <input
                  type="text"
                  placeholder="e.g. Page 4 Top-Right, Slot #12"
                  value={targetSlot}
                  onChange={(e) => setTargetSlot(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-black/[0.08] rounded-xl text-xs focus:outline-none focus:border-[#007AFF]"
                />
              </div>

              <div className="pt-3 border-t border-black/[0.06] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRelocatingItem(null)}
                  className="px-4 py-2 rounded-xl border border-black/[0.08] text-[#1C1C1E] font-medium hover:bg-black/[0.04]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRelocate}
                  disabled={isRelocating}
                  className="px-5 py-2 rounded-xl bg-[#007AFF] hover:bg-[#0066D6] text-white font-semibold shadow-xs"
                >
                  {isRelocating ? 'Saving...' : 'Confirm Move'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BATCH MOVE MODAL */}
      {showBatchMoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-black/[0.08] shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-[#007AFF]" />
                <h3 className="text-base font-bold text-[#1C1C1E]">
                  Batch Move {selectedItemIds.length} Collectibles
                </h3>
              </div>
              <button
                onClick={() => setShowBatchMoveModal(false)}
                className="text-[#8E8E93] hover:text-[#1C1C1E] text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-bold text-[#1C1C1E] block mb-1">Target Meta Storage:</label>
                <input
                  type="text"
                  placeholder="e.g. Master Fireproof Safe"
                  value={batchTargetMeta}
                  onChange={(e) => setBatchTargetMeta(e.target.value)}
                  list="known-meta-names"
                  className="w-full px-3 py-2 bg-white border border-black/[0.08] rounded-xl text-xs focus:outline-none focus:border-[#007AFF]"
                />
              </div>

              <div>
                <label className="font-bold text-[#1C1C1E] block mb-1">Target Container:</label>
                <input
                  type="text"
                  placeholder="e.g. VaultX 12-Pocket Binder"
                  value={batchTargetContainer}
                  onChange={(e) => setBatchTargetContainer(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-black/[0.08] rounded-xl text-xs focus:outline-none focus:border-[#007AFF]"
                />
              </div>

              <div className="pt-3 border-t border-black/[0.06] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBatchMoveModal(false)}
                  className="px-4 py-2 rounded-xl border border-black/[0.08] text-[#1C1C1E] font-medium hover:bg-black/[0.04]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteBatchMove}
                  className="px-5 py-2 rounded-xl bg-[#007AFF] hover:bg-[#0066D6] text-white font-semibold shadow-xs"
                >
                  Transfer {selectedItemIds.length} Assets
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN LOOSE ITEMS MODAL */}
      {showAssignLooseModal && selectedMetaStorage && selectedContainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-black/[0.08] shadow-2xl p-6 w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div>
                <h3 className="text-base font-bold text-[#1C1C1E]">
                  Assign Items to {selectedContainer}
                </h3>
                <p className="text-xs text-[#8E8E93]">
                  Select loose cards or items from other units to allocate directly here.
                </p>
              </div>
              <button
                onClick={() => setShowAssignLooseModal(false)}
                className="text-[#8E8E93] hover:text-[#1C1C1E] text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-2">
              {storageHierarchy.unallocated.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#8E8E93]">
                  No unallocated loose cards available.
                </div>
              ) : (
                storageHierarchy.unallocated.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-black/[0.06] bg-[#F2F2F7]/50 hover:bg-[#F2F2F7]"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-14 object-contain rounded bg-white p-0.5"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-[#1C1C1E]">{item.name}</h4>
                        <span className="text-[10px] text-[#8E8E93]">{item.category}</span>
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        await switchItemStorage(item.id, {
                          metaStorage: selectedMetaStorage,
                          container: selectedContainer,
                        });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#007AFF] hover:bg-[#0066D6] text-white text-xs font-semibold transition-colors"
                    >
                      Assign Here
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-black/[0.06] flex justify-end">
              <button
                onClick={() => setShowAssignLooseModal(false)}
                className="px-5 py-2 rounded-xl bg-black/[0.06] hover:bg-black/[0.1] text-xs font-semibold text-[#1C1C1E]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT MANIFEST DIALOG */}
      {showPrintManifest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-black/[0.08] shadow-2xl p-6 w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-[#007AFF]" />
                <h3 className="text-base font-bold text-[#1C1C1E]">
                  Physical Storage Inventory Manifest
                </h3>
              </div>
              <button
                onClick={() => setShowPrintManifest(false)}
                className="text-[#8E8E93] hover:text-[#1C1C1E] text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-6 text-xs" id="printable-manifest">
              {Object.entries(storageHierarchy.hierarchy).map(([meta, metaData]) => (
                <div key={meta} className="border-b border-black/[0.06] pb-4">
                  <div className="flex items-center justify-between font-bold text-sm text-[#1C1C1E] mb-2">
                    <span>{meta}</span>
                    <span>{formatPrice((metaData as MetaStorageNode).totalValueUSD)}</span>
                  </div>
                  {Object.entries((metaData as MetaStorageNode).containers).map(([cont, cData]) => (
                    <div key={cont} className="ml-4 mb-3">
                      <div className="font-semibold text-xs text-[#007AFF] mb-1">
                        📦 {cont} ({cData.items.length} assets)
                      </div>
                      <div className="space-y-1 ml-3">
                        {cData.items.map((it) => (
                          <div key={it.id} className="flex items-center justify-between text-[#1C1C1E]">
                            <span>
                              • {it.name}{' '}
                              {it.storageLocation?.slot ? `[${it.storageLocation.slot}]` : ''}
                            </span>
                            <span className="font-mono">{formatPrice(it.currentPriceUSD * it.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between">
              <span className="text-xs text-[#8E8E93]">
                Total Real-World Valuation: <strong>{formatPrice(totalPhysicalValueUSD)}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPrintManifest(false)}
                  className="px-4 py-2 rounded-xl border border-black/[0.08] text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2 rounded-xl bg-[#007AFF] hover:bg-[#0066D6] text-white text-xs font-semibold shadow-xs"
                >
                  Print to PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
