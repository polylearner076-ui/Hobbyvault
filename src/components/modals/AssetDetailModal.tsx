import React, { useState } from 'react';
import { AssetItem, Transaction, StorageLocation, AssetCopy, ItemCondition, FragilityLevel } from '../../types';
import { useVault } from '../../context/VaultContext';
import { InteractivePriceChart } from '../portfolio/InteractivePriceChart';
import { lookupLiveMarketPrice } from '../../services/api';
import { StorageInventoryModal } from './StorageInventoryModal';
import {
  getConditionMeta,
  calculateCopyValue,
  calculateItemTotalValuation,
  calculateItemTotalCost,
  ensureCopiesForAsset,
} from '../../utils/conditionUtils';
import {
  getAssetWeightGrams,
  getAssetFragility,
  formatWeight,
} from '../../utils/storageAnalytics';
import {
  X,
  Star,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  Check,
  RotateCw,
  Shield,
  Calendar,
  DollarSign,
  Tag,
  Share2,
  Layers,
  Database,
  CheckCircle2,
  Box,
  Archive,
  MapPin,
  FolderPlus,
  Copy,
  Sliders,
  Scale,
  ShieldAlert,
} from 'lucide-react';

interface AssetDetailModalProps {
  item: AssetItem;
  onClose: () => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({ item, onClose }) => {
  const {
    sandboxes,
    updateItem,
    deleteItem,
    formatPrice,
    currencySymbol,
    convertPrice,
    storageUnits,
    setSelectedTag,
    setSelectedCategory,
  } = useVault();

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(item.name);
  const [editedPrice, setEditedPrice] = useState(item.currentPriceUSD.toString());
  const [editedCost, setEditedCost] = useState(item.purchasePriceUSD.toString());
  const [editedQty, setEditedQty] = useState(item.quantity.toString());
  const [editedCondition, setEditedCondition] = useState(item.condition);
  const [editedDate, setEditedDate] = useState(item.purchaseDate || new Date().toISOString().split('T')[0]);
  const [editedSandboxId, setEditedSandboxId] = useState(item.sandboxId);
  const [editedNotes, setEditedNotes] = useState(item.notes || '');
  const [editedGradingCompany, setEditedGradingCompany] = useState(item.cardSpecs?.gradingCompany || 'None');
  const [editedGradeValue, setEditedGradeValue] = useState(item.cardSpecs?.gradeValue || '10');

  // Copies State
  const initialCopies = ensureCopiesForAsset(item);
  const [copies, setCopies] = useState<AssetCopy[]>(initialCopies);
  const [editingCopyId, setEditingCopyId] = useState<string | null>(null);
  const [showAddCopyModal, setShowAddCopyModal] = useState(false);

  // New Copy State
  const [newCopyCondition, setNewCopyCondition] = useState<ItemCondition>('RAW_LP');
  const [newCopyLabel, setNewCopyLabel] = useState('Well Condition (Light Play)');
  const [newCopyCost, setNewCopyCost] = useState((item.currentPriceUSD * 0.75).toFixed(2));
  const [newCopySlot, setNewCopySlot] = useState('');
  const [newCopyNotes, setNewCopyNotes] = useState('');

  // Storage Location Edits
  const [editedMetaStorage, setEditedMetaStorage] = useState(item.storageLocation?.metaStorage || 'Master Fireproof Safe (Office)');
  const [editedContainer, setEditedContainer] = useState(item.storageLocation?.container || 'Pelican 1500 Slab Case');
  const [editedSlot, setEditedSlot] = useState(item.storageLocation?.slot || '');
  const [editedStorageNotes, setEditedStorageNotes] = useState(item.storageLocation?.notes || '');
  const [editedWeightGrams, setEditedWeightGrams] = useState(item.weightGrams ? item.weightGrams.toString() : '');
  const [editedFragility, setEditedFragility] = useState<FragilityLevel>(item.fragility || 'LOW');
  const [editedFragilityNotes, setEditedFragilityNotes] = useState(item.fragilityNotes || '');

  const [isCheckingLivePrice, setIsCheckingLivePrice] = useState(false);
  const [livePriceStatus, setLivePriceStatus] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Reverse check storage modal
  const [showStorageModal, setShowStorageModal] = useState(false);

  // New Transaction form
  const [showAddTx, setShowAddTx] = useState(false);
  const [txType, setTxType] = useState<'BUY' | 'SELL'>('BUY');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txQty, setTxQty] = useState('1');
  const [txPrice, setTxPrice] = useState(item.currentPriceUSD.toString());
  const [txNotes, setTxNotes] = useState('');

  const totalValue = calculateItemTotalValuation({ ...item, copies });
  const totalCost = calculateItemTotalCost({ ...item, copies });
  const gainUSD = totalValue - totalCost;
  const gainPercent = totalCost > 0 ? (gainUSD / totalCost) * 100 : 0;
  const isGainPositive = gainUSD >= 0;

  const prev24 = item.previousPriceUSD_24h ?? item.currentPriceUSD;
  const delta24hUSD = item.currentPriceUSD - prev24;
  const delta24hPercent = prev24 > 0 ? (delta24hUSD / prev24) * 100 : 0;

  const currentSandbox = sandboxes.find((s) => s.id === item.sandboxId);

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Copy Management Handlers
  const handleAddNewCopy = async (e: React.FormEvent) => {
    e.preventDefault();
    const meta = getConditionMeta(newCopyCondition);
    const pCost = parseFloat(newCopyCost) || item.currentPriceUSD * meta.multiplier;
    const computedVal = item.currentPriceUSD * meta.multiplier;

    const newCopy: AssetCopy = {
      id: `copy-${Date.now()}-${copies.length + 1}`,
      condition: newCopyCondition,
      customConditionLabel: newCopyLabel.trim() || meta.shortLabel,
      purchasePriceUSD: pCost,
      purchaseDate: new Date().toISOString().split('T')[0],
      currentValueUSD: Number(computedVal.toFixed(2)),
      storageLocation: {
        metaStorage: editedMetaStorage,
        container: editedContainer,
        slot: newCopySlot.trim() || undefined,
        notes: newCopyNotes.trim() || undefined,
      },
      notes: newCopyNotes.trim() || undefined,
    };

    const updatedCopies = [...copies, newCopy];
    setCopies(updatedCopies);
    setShowAddCopyModal(false);

    // Save to Firestore
    await updateItem(item.id, {
      copies: updatedCopies,
      quantity: updatedCopies.length,
    });

    setSaveStatus(`Added ${newCopy.customConditionLabel} copy!`);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleUpdateCopy = async (copyId: string, updates: Partial<AssetCopy>) => {
    const updated = copies.map((c) => {
      if (c.id !== copyId) return c;
      const merged = { ...c, ...updates };
      if (updates.condition) {
        const meta = getConditionMeta(updates.condition);
        merged.currentValueUSD = Number((item.currentPriceUSD * meta.multiplier).toFixed(2));
      }
      return merged;
    });

    setCopies(updated);
    await updateItem(item.id, {
      copies: updated,
      quantity: updated.length,
    });

    setSaveStatus('Copy updated');
    setTimeout(() => setSaveStatus(null), 2500);
  };

  const handleDeleteCopy = async (copyId: string) => {
    if (copies.length <= 1) {
      alert('Asset must have at least 1 copy. To remove the entire item, use Delete Asset.');
      return;
    }
    const updated = copies.filter((c) => c.id !== copyId);
    setCopies(updated);
    await updateItem(item.id, {
      copies: updated,
      quantity: updated.length,
    });
    setSaveStatus('Copy removed');
    setTimeout(() => setSaveStatus(null), 2500);
  };

  const handleSaveEdits = async () => {
    const p = parseFloat(editedPrice) || item.currentPriceUSD;
    const c = parseFloat(editedCost) || item.purchasePriceUSD;
    const q = parseInt(editedQty, 10) || copies.length || 1;

    const storageLocation: StorageLocation = {
      metaStorage: editedMetaStorage.trim() || undefined,
      container: editedContainer.trim() || undefined,
      slot: editedSlot.trim() || undefined,
      notes: editedStorageNotes.trim() || undefined,
    };

    // Update copies with new base price valuation
    const refreshedCopies = copies.map((copy) => {
      const meta = getConditionMeta(copy.condition);
      return {
        ...copy,
        currentValueUSD: Number((p * meta.multiplier).toFixed(2)),
      };
    });

    const updates: Partial<AssetItem> = {
      name: editedName,
      currentPriceUSD: p,
      purchasePriceUSD: c,
      quantity: q,
      condition: editedCondition,
      copies: refreshedCopies,
      purchaseDate: editedDate,
      sandboxId: editedSandboxId,
      notes: editedNotes,
      storageLocation,
      weightGrams: editedWeightGrams ? parseFloat(editedWeightGrams) : undefined,
      fragility: editedFragility,
      fragilityNotes: editedFragilityNotes.trim() || undefined,
    };

    if (item.cardSpecs) {
      updates.cardSpecs = {
        ...item.cardSpecs,
        gradingCompany: editedGradingCompany !== 'None' ? (editedGradingCompany as any) : undefined,
        gradeValue: editedGradingCompany !== 'None' ? editedGradeValue : undefined,
      };
    }

    await updateItem(item.id, updates);
    setIsEditing(false);
    setSaveStatus('Asset & Condition configurations saved!');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleToggleFavorite = async () => {
    const newFav = !item.isFavorite;
    await updateItem(item.id, { isFavorite: newFav });
    setSaveStatus(newFav ? 'Favorited in Cloud SQL' : 'Removed from favorites');
    setTimeout(() => setSaveStatus(null), 2500);
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteItem(item.id);
      onClose();
    } catch (e) {
      console.error('Delete failed:', e);
      setIsDeleting(false);
    }
  };

  const handleLivePriceRefresh = async () => {
    try {
      setIsCheckingLivePrice(true);
      setLivePriceStatus('Querying live API comps...');
      const result = await lookupLiveMarketPrice({
        name: item.name,
        category: item.category,
        condition: item.condition,
      });

      if (result && result.currentPriceUSD) {
        await updateItem(item.id, {
          currentPriceUSD: result.currentPriceUSD,
          marketSource: result.marketSource || 'Live API Comps',
        });
        setEditedPrice(result.currentPriceUSD.toString());
        setLivePriceStatus(`Found: ${result.currentPriceUSD.toFixed(2)} (${result.marketSource || 'API'})`);
      } else {
        setLivePriceStatus('No live index match found. Kept current market price.');
      }
    } catch {
      setLivePriceStatus('Price check failed. Please try again.');
    } finally {
      setIsCheckingLivePrice(false);
      setTimeout(() => setLivePriceStatus(null), 4000);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(txQty, 10) || 1;
    const price = parseFloat(txPrice) || item.currentPriceUSD;

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: txType,
      date: txDate,
      pricePerUnitUSD: price,
      quantity: qty,
      notes: txNotes || undefined,
    };

    const existingTx = item.transactions || [];
    const updatedTxList = [newTx, ...existingTx];

    let newQty = item.quantity;
    if (txType === 'BUY') {
      newQty += qty;
    } else if (txType === 'SELL') {
      newQty = Math.max(0, newQty - qty);
    }

    await updateItem(item.id, {
      transactions: updatedTxList,
      quantity: newQty,
    });

    setShowAddTx(false);
    setTxNotes('');
  };

  const handleDeleteItem = async () => {
    if (window.confirm(`Permanently remove "${item.name}" from your Firestore vault?`)) {
      await deleteItem(item.id);
      onClose();
    }
  };

  return (
    <div
      id="asset-detail-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="asset-detail-modal-container"
        className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-black/[0.08] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-black/[0.06] flex items-center justify-between bg-white/90 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: currentSandbox ? currentSandbox.themeColor : '#007AFF' }}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-[#8E8E93]">
              {currentSandbox ? currentSandbox.name : 'Asset Details'}
            </span>
            {saveStatus && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{saveStatus}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              id="asset-favorite-btn"
              onClick={handleToggleFavorite}
              className="p-2 rounded-xl hover:bg-black/[0.05] text-[#8E8E93] hover:text-[#FF9500] transition-colors cursor-pointer"
              title={item.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
            >
              <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-[#FF9500] text-[#FF9500]' : ''}`} />
            </button>

            <button
              id="asset-edit-toggle-btn"
              onClick={() => setIsEditing(!isEditing)}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isEditing ? 'bg-[#007AFF] text-white shadow-sm' : 'hover:bg-black/[0.05] text-[#8E8E93] hover:text-[#1C1C1E]'
              }`}
              title={isEditing ? 'Close Editor' : 'Edit Asset Details'}
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              id="asset-delete-btn"
              onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                showDeleteConfirm
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'hover:bg-red-50 text-[#8E8E93] hover:text-[#FF3B30]'
              }`}
              title="Delete Asset from Database"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <div className="h-4 w-[1px] bg-black/[0.08] mx-1" />

            <button
              id="asset-close-modal-btn"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-black/[0.05] text-[#8E8E93] hover:text-[#1C1C1E] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Alert Banner */}
        {showDeleteConfirm && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs text-red-900 font-medium">
              <Trash2 className="w-4 h-4 text-red-600 shrink-0" />
              <span>Are you sure you want to permanently delete <strong>{item.name}</strong> from Cloud SQL?</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 rounded-lg bg-white border border-red-200 text-xs font-semibold text-red-900 hover:bg-red-50/50"
              >
                Cancel
              </button>
              <button
                type="button"
                id="asset-confirm-delete-action-btn"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-[#1C1C1E]">
          {/* Top Hero Layout: Media Image + Key Stats */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Media Stage */}
            <div className="md:col-span-5 flex flex-col items-center">
              <div className="relative w-full aspect-[4/3] rounded-3xl bg-[#F2F2F7] border border-black/[0.06] overflow-hidden flex items-center justify-center p-4 shadow-inner">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain drop-shadow-md transition-transform duration-300 hover:scale-105"
                />
              </div>

              {/* Source & Market Badge */}
              <div className="mt-3 w-full flex items-center justify-between text-xs text-[#8E8E93]">
                <div className="flex items-center gap-1.5 font-medium">
                  <Database className="w-3.5 h-3.5 text-[#007AFF]" />
                  <span>{item.marketSource || 'Live API Indexed'}</span>
                </div>

                <button
                  onClick={handleLivePriceRefresh}
                  disabled={isCheckingLivePrice}
                  className="flex items-center gap-1 text-[#007AFF] hover:underline font-semibold cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isCheckingLivePrice ? 'animate-spin' : ''}`} />
                  <span>Check Live API</span>
                </button>
              </div>

              {livePriceStatus && (
                <div className="mt-2 w-full p-2 bg-blue-50 border border-blue-200/80 rounded-xl text-[11px] text-blue-900 text-center animate-in fade-in">
                  {livePriceStatus}
                </div>
              )}
            </div>

            {/* Right Summary & Values */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-4">
              <div>
                {/* Condition & Category Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20">
                    {item.condition.replace('_', ' ')}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory(item.category);
                      onClose();
                    }}
                    title={`Filter vault by category: ${item.category}`}
                    className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-black/[0.05] hover:bg-[#007AFF]/10 hover:text-[#007AFF] text-[#1C1C1E] uppercase tracking-wider transition-colors cursor-pointer border border-black/[0.04]"
                  >
                    {item.category}
                  </button>
                  {item.quantity > 1 && (
                    <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-black text-white">
                      x{item.quantity} in Vault
                    </span>
                  )}
                </div>

                {/* Assigned Tags Badges */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                    <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider flex items-center gap-1">
                      <Tag className="w-3 h-3 text-[#007AFF]" />
                      <span>Tags:</span>
                    </span>
                    {item.tags.map((tag, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedTag(tag);
                          onClose();
                        }}
                        title={`Filter vault by #${tag}`}
                        className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-black/[0.04] hover:bg-[#007AFF] hover:text-white text-[#1C1C1E] border border-black/[0.06] transition-colors cursor-pointer"
                      >
                        <span>#{tag}</span>
                      </button>
                    ))}
                  </div>
                )}

                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1C1E] tracking-tight leading-snug">
                  {item.name}
                </h1>

                <p className="text-xs sm:text-sm text-[#8E8E93] mt-1">
                  {item.cardSpecs?.setName || item.beybladeSpecs?.brand || 'Collectible Asset'}
                </p>
              </div>

              {/* Financial Box */}
              <div className="bg-[#F8F9FB] rounded-2xl border border-black/[0.06] p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#8E8E93]">Market Price</div>
                  <div className="text-xl sm:text-2xl font-extrabold text-[#1C1C1E] font-mono mt-0.5">
                    {formatPrice(item.currentPriceUSD)}
                  </div>
                  <div className="text-[11px] text-[#8E8E93]">per unit</div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-[#8E8E93]">Total Value</div>
                  <div className="text-xl sm:text-2xl font-extrabold text-[#1C1C1E] font-mono mt-0.5">
                    {formatPrice(totalValue)}
                  </div>
                  <div className="text-[11px] text-[#8E8E93]">cost: {formatPrice(totalCost)}</div>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <div className="text-[10px] uppercase font-bold text-[#8E8E93]">Gain / Loss</div>
                  <div
                    className={`text-xl sm:text-2xl font-extrabold font-mono mt-0.5 ${
                      isGainPositive ? 'text-[#34C759]' : 'text-[#FF3B30]'
                    }`}
                  >
                    {isGainPositive ? '+' : ''}
                    {gainPercent.toFixed(1)}%
                  </div>
                  <div
                    className={`text-[11px] font-semibold ${
                      isGainPositive ? 'text-[#34C759]' : 'text-[#FF3B30]'
                    }`}
                  >
                    {isGainPositive ? '+' : ''}
                    {formatPrice(gainUSD)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Form Drawer */}
          {isEditing && (
            <div className="p-5 rounded-2xl bg-[#F2F2F7] border border-black/[0.08] space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1C1C1E]">
                  Modify Asset Details
                </h3>
                <span className="text-[11px] text-[#8E8E93]">Changes will persist to Cloud SQL database</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-[#8E8E93] block mb-1">Asset Name</label>
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#8E8E93] block mb-1">Current Price (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editedPrice}
                    onChange={(e) => setEditedPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E] font-mono focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#8E8E93] block mb-1">Buy Price / Cost Basis (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editedCost}
                    onChange={(e) => setEditedCost(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E] font-mono focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#8E8E93] block mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={editedQty}
                    onChange={(e) => setEditedQty(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E] font-mono focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#8E8E93] block mb-1">Sandbox</label>
                  <select
                    value={editedSandboxId}
                    onChange={(e) => setEditedSandboxId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                  >
                    {sandboxes.map((sb) => (
                      <option key={sb.id} value={sb.id}>
                        {sb.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Storage Location Editing in Drawer */}
                <div className="sm:col-span-3 pt-2 border-t border-black/[0.06]">
                  <div className="flex items-center gap-2 mb-2">
                    <Box className="w-4 h-4 text-[#007AFF]" />
                    <span className="text-xs font-bold text-[#1C1C1E]">
                      Physical Storage Location Details
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-[#8E8E93] block mb-1">
                        Meta Storage (Safe, Room)
                      </label>
                      <input
                        type="text"
                        value={editedMetaStorage}
                        onChange={(e) => setEditedMetaStorage(e.target.value)}
                        placeholder="e.g. Master Fireproof Safe"
                        className="w-full px-3 py-2 bg-white border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#8E8E93] block mb-1">
                        Container (Binder, Slab Box)
                      </label>
                      <input
                        type="text"
                        value={editedContainer}
                        onChange={(e) => setEditedContainer(e.target.value)}
                        placeholder="e.g. Pelican 1500 Slab Case"
                        className="w-full px-3 py-2 bg-white border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#8E8E93] block mb-1">
                        Slot / Position
                      </label>
                      <input
                        type="text"
                        value={editedSlot}
                        onChange={(e) => setEditedSlot(e.target.value)}
                        placeholder="e.g. Row 1, Slab #02"
                        className="w-full px-3 py-2 bg-white border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#8E8E93] block mb-1">
                        Protection Notes
                      </label>
                      <input
                        type="text"
                        value={editedStorageNotes}
                        onChange={(e) => setEditedStorageNotes(e.target.value)}
                        placeholder="e.g. UV sleeve + silica gel"
                        className="w-full px-3 py-2 bg-white border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#8E8E93] block mb-1 flex items-center gap-1">
                        <Scale className="w-3 h-3 text-[#007AFF]" />
                        <span>Weight (grams)</span>
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={editedWeightGrams}
                        onChange={(e) => setEditedWeightGrams(e.target.value)}
                        placeholder="e.g. 54 (Slab), 1.8 (Raw), 45 (Beyblade)"
                        className="w-full px-3 py-2 bg-white border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#8E8E93] block mb-1 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-amber-500" />
                        <span>Preservation Fragility</span>
                      </label>
                      <select
                        value={editedFragility}
                        onChange={(e) => setEditedFragility(e.target.value as FragilityLevel)}
                        className="w-full px-3 py-2 bg-white border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                      >
                        <option value="LOW">LOW (Durable / Hard Slabs / Metal)</option>
                        <option value="MEDIUM">MEDIUM (Moderate / Boxed / Sleeved)</option>
                        <option value="HIGH">HIGH (Delicate / Vintage Foils / High Grails)</option>
                        <option value="CRITICAL">CRITICAL (Ultra-Fragile / Glass / Unprotected)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-[#8E8E93] block mb-1">
                        Fragility & Handling Notes
                      </label>
                      <input
                        type="text"
                        value={editedFragilityNotes}
                        onChange={(e) => setEditedFragilityNotes(e.target.value)}
                        placeholder="e.g. Temperature-sensitive foil, handle only with cotton gloves"
                        className="w-full px-3 py-2 bg-white border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-black/[0.08] text-xs font-semibold text-[#1C1C1E] hover:bg-black/[0.02] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdits}
                  className="px-5 py-2 rounded-xl bg-[#007AFF] hover:bg-[#0066D6] text-xs font-semibold text-white shadow-sm cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Dedicated Copies & Condition Management Card */}
          <div className="bg-white rounded-3xl border border-black/[0.06] p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#1C1C1E]">
                      Copies & Condition Breakdown
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black text-white">
                      {copies.length} {copies.length === 1 ? 'Copy' : 'Copies'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8E8E93]">
                    Manage individual copies, grading conditions (e.g. Well, Poor, Mint), and item locations
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddCopyModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#007AFF] hover:bg-[#0066D6] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Copy in Another Condition</span>
              </button>
            </div>

            {/* List of individual copies */}
            <div className="grid grid-cols-1 gap-2.5">
              {copies.map((copy, index) => {
                const meta = getConditionMeta(copy.condition);
                const copyVal = calculateCopyValue(item.currentPriceUSD, copy);
                const copyCost = copy.purchasePriceUSD ?? (item.purchasePriceUSD / copies.length);
                const isEditingThis = editingCopyId === copy.id;

                return (
                  <div
                    key={copy.id}
                    className="p-3.5 rounded-2xl bg-[#F8F9FB] border border-black/[0.05] hover:border-black/[0.1] transition-all space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-black/[0.05] text-[#1C1C1E] text-xs font-mono font-bold flex items-center justify-center">
                          #{index + 1}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${meta.badgeBg} ${meta.badgeBorder}`}>
                          {copy.customConditionLabel || meta.shortLabel}
                        </span>
                        <span className="text-[11px] text-[#8E8E93] font-mono">
                          ({(meta.multiplier * 100).toFixed(0)}% base multiplier)
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs font-bold font-mono text-[#1C1C1E]">
                            {formatPrice(copyVal)}
                          </div>
                          <div className="text-[10px] text-[#8E8E93] font-mono">
                            Cost: {formatPrice(copyCost)}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setEditingCopyId(isEditingThis ? null : copy.id)}
                          className="p-1.5 rounded-lg hover:bg-black/[0.05] text-[#8E8E93] hover:text-[#007AFF] transition-colors"
                          title="Edit copy details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteCopy(copy.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-[#8E8E93] hover:text-red-600 transition-colors"
                          title="Delete copy"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Copy sub-details: location & notes */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#8E8E93]">
                      {(copy.storageLocation?.container || copy.storageLocation?.slot) && (
                        <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-black/[0.04]">
                          <MapPin className="w-3 h-3 text-[#007AFF]" />
                          <span>
                            {copy.storageLocation.container || 'Vault Container'}
                            {copy.storageLocation.slot ? ` • ${copy.storageLocation.slot}` : ''}
                          </span>
                        </div>
                      )}
                      {copy.notes && (
                        <div className="italic text-[#1C1C1E]/80 bg-white px-2 py-0.5 rounded-md border border-black/[0.04] truncate max-w-[300px]">
                          "{copy.notes}"
                        </div>
                      )}
                    </div>

                    {/* Inline editor for this copy */}
                    {isEditingThis && (
                      <div className="mt-2 pt-3 border-t border-black/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white p-3 rounded-xl">
                        <div>
                          <label className="text-[10px] font-bold text-[#8E8E93] block mb-1">Condition</label>
                          <select
                            value={copy.condition}
                            onChange={(e) => handleUpdateCopy(copy.id, { condition: e.target.value as ItemCondition })}
                            className="w-full px-2 py-1.5 bg-[#F2F2F7] border border-black/[0.08] rounded-lg text-xs"
                          >
                            <option value="PSA_10_GEM_MINT">PSA 10 Gem Mint (2.6x)</option>
                            <option value="BGS_10_PRISTINE">BGS 10 Pristine (3.2x)</option>
                            <option value="CGC_10_PRISTINE">CGC 10 Pristine (2.5x)</option>
                            <option value="PSA_9_MINT">PSA 9 Mint (1.4x)</option>
                            <option value="RAW_NM">Near Mint / Raw (1.0x)</option>
                            <option value="RAW_LP">Well Condition / Light Play (0.75x)</option>
                            <option value="RAW_MP">Moderately Played (0.50x)</option>
                            <option value="RAW_HP">Poor Condition / Heavy Play (0.30x)</option>
                            <option value="RAW_DMG">Damaged (0.15x)</option>
                            <option value="NIB">New In Box / Sealed (1.8x)</option>
                            <option value="USED_COMPLETE">Used Complete (0.8x)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-[#8E8E93] block mb-1">Cost Paid (USD)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={copy.purchasePriceUSD ?? ''}
                            onChange={(e) => handleUpdateCopy(copy.id, { purchasePriceUSD: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2 py-1.5 bg-[#F2F2F7] border border-black/[0.08] rounded-lg text-xs font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-[#8E8E93] block mb-1">Storage Slot / Notes</label>
                          <input
                            type="text"
                            value={copy.storageLocation?.slot || ''}
                            placeholder="e.g. Binder 2, Page 4"
                            onChange={(e) => handleUpdateCopy(copy.id, {
                              storageLocation: {
                                ...copy.storageLocation,
                                slot: e.target.value,
                              }
                            })}
                            className="w-full px-2 py-1.5 bg-[#F2F2F7] border border-black/[0.08] rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Copy Modal Popup */}
          {showAddCopyModal && (
            <div className="p-4 rounded-2xl bg-[#007AFF]/5 border border-[#007AFF]/20 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#007AFF]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#007AFF]">
                    Add New Copy in Different Condition
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddCopyModal(false)}
                  className="p-1 text-[#8E8E93] hover:text-[#1C1C1E]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddNewCopy} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-[#8E8E93] block mb-1">Select Condition</label>
                  <select
                    value={newCopyCondition}
                    onChange={(e) => {
                      const cond = e.target.value as ItemCondition;
                      setNewCopyCondition(cond);
                      const meta = getConditionMeta(cond);
                      setNewCopyLabel(meta.label);
                      setNewCopyCost((item.currentPriceUSD * meta.multiplier).toFixed(2));
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E]"
                  >
                    <option value="PSA_10_GEM_MINT">PSA 10 Gem Mint (2.6x value)</option>
                    <option value="BGS_10_PRISTINE">BGS 10 Pristine (3.2x value)</option>
                    <option value="CGC_10_PRISTINE">CGC 10 Pristine (2.5x value)</option>
                    <option value="PSA_9_MINT">PSA 9 Mint (1.4x value)</option>
                    <option value="RAW_NM">Near Mint / Raw (1.0x value)</option>
                    <option value="RAW_LP">Well Condition / Light Play (0.75x value)</option>
                    <option value="RAW_MP">Moderately Played (0.50x value)</option>
                    <option value="RAW_HP">Poor Condition / Heavy Play (0.30x value)</option>
                    <option value="RAW_DMG">Damaged (0.15x value)</option>
                    <option value="NIB">New In Box / Sealed (1.8x value)</option>
                    <option value="USED_COMPLETE">Used Complete (0.8x value)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#8E8E93] block mb-1">Custom Label</label>
                  <input
                    type="text"
                    value={newCopyLabel}
                    onChange={(e) => setNewCopyLabel(e.target.value)}
                    placeholder="e.g. Well Condition (LP)"
                    className="w-full px-2.5 py-1.5 bg-white border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#8E8E93] block mb-1">Purchase Price (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newCopyCost}
                    onChange={(e) => setNewCopyCost(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E] font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#8E8E93] block mb-1">Specific Slot / Notes</label>
                  <input
                    type="text"
                    value={newCopySlot}
                    onChange={(e) => setNewCopySlot(e.target.value)}
                    placeholder="e.g. Binder #2, Page 1"
                    className="w-full px-2.5 py-1.5 bg-white border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E]"
                  />
                </div>

                <div className="sm:col-span-2 md:col-span-4 flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddCopyModal(false)}
                    className="px-3 py-1.5 bg-white border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E] font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#007AFF] hover:bg-[#0066D6] text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    Save Copy to Vault
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Dedicated Physical Storage & Location Card */}
          <div className="bg-white rounded-3xl border border-black/[0.06] p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center">
                  <Box className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1C1C1E]">
                    Real-World Physical Storage & Location
                  </h3>
                  <p className="text-[11px] text-[#8E8E93]">
                    Hierarchical vault placement & collector storage tracking
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowStorageModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#007AFF]/10 hover:bg-[#007AFF]/20 text-[#007AFF] text-xs font-bold transition-colors cursor-pointer"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Reverse-Check Container</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-black/[0.04] hover:bg-black/[0.08] text-[#1C1C1E] text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3 h-3 text-[#8E8E93]" />
                  <span>Edit Location</span>
                </button>
              </div>
            </div>

            {/* 3-Tier Storage Breadcrumbs Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#F8F9FB] rounded-2xl border border-black/[0.04]">
              {/* Level 1: Meta Storage */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">
                  <Shield className="w-3 h-3 text-[#007AFF]" />
                  <span>1. Meta Storage / Room</span>
                </div>
                <div className="font-bold text-xs text-[#1C1C1E] truncate">
                  {item.storageLocation?.metaStorage || 'Master Fireproof Safe (Office)'}
                </div>
                <div className="text-[10px] text-[#8E8E93]">Macro vault location</div>
              </div>

              {/* Level 2: Container / Binder */}
              <div className="space-y-1 sm:border-l sm:border-black/[0.06] sm:pl-4">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">
                  <Archive className="w-3 h-3 text-[#007AFF]" />
                  <span>2. Container / Binder</span>
                </div>
                <div className="font-bold text-xs text-[#1C1C1E] truncate">
                  {item.storageLocation?.container || 'Pelican 1500 Slab Case'}
                </div>
                <div className="text-[10px] text-[#8E8E93]">Physical enclosure</div>
              </div>

              {/* Level 3: Slot / Position */}
              <div className="space-y-1 sm:border-l sm:border-black/[0.06] sm:pl-4">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">
                  <MapPin className="w-3 h-3 text-[#007AFF]" />
                  <span>3. Slot / Position</span>
                </div>
                <div className="font-bold text-xs text-[#007AFF] truncate font-mono">
                  {item.storageLocation?.slot || 'Row 1, Slab #01'}
                </div>
                <div className="text-[10px] text-[#8E8E93]">Exact page or slot</div>
              </div>
            </div>

            {/* Physical Preservation & Mass Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-[#F8F9FB] rounded-2xl border border-black/[0.04] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-50 text-[#007AFF]">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">
                      Physical Mass
                    </div>
                    <div className="text-xs font-bold text-[#1C1C1E]">
                      {formatWeight(getAssetWeightGrams(item) * (item.quantity || 1)).display}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-[#8E8E93] bg-white px-2 py-0.5 rounded-md border border-black/[0.04]">
                  {getAssetWeightGrams(item)}g / unit
                </span>
              </div>

              <div className="p-3 bg-[#F8F9FB] rounded-2xl border border-black/[0.04] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">
                      Preservation Fragility
                    </div>
                    <div className="text-xs font-bold text-[#1C1C1E] flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          getAssetFragility(item) === 'CRITICAL'
                            ? 'bg-red-500'
                            : getAssetFragility(item) === 'HIGH'
                            ? 'bg-amber-500'
                            : getAssetFragility(item) === 'MEDIUM'
                            ? 'bg-blue-500'
                            : 'bg-emerald-500'
                        }`}
                      />
                      <span>{getAssetFragility(item)} Risk</span>
                    </div>
                  </div>
                </div>
                {item.fragilityNotes && (
                  <span className="text-[10px] text-[#8E8E93] truncate max-w-[120px]" title={item.fragilityNotes}>
                    {item.fragilityNotes}
                  </span>
                )}
              </div>
            </div>

            {/* Storage Protection Notes */}
            {item.storageLocation?.notes && (
              <div className="px-3.5 py-2 bg-blue-50/50 border border-blue-100 rounded-xl text-xs text-blue-950 flex items-center gap-2">
                <span className="font-bold text-[10px] uppercase text-[#007AFF]">Protection Notes:</span>
                <span>{item.storageLocation.notes}</span>
              </div>
            )}
          </div>

          {/* Historical Price Trend */}
          <div className="bg-white rounded-3xl border border-black/[0.06] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1C1C1E]">
                Historical Value Chart
              </h3>
              <span className="text-xs font-mono text-[#8E8E93]">
                {item.priceHistory?.length || 0} Price Points Recorded
              </span>
            </div>

            <InteractivePriceChart
              customHistory={item.priceHistory}
              customCostUSD={item.purchasePriceUSD}
              height={200}
              showTimeRangeSelector={false}
            />
          </div>

          {/* Transactions Log Section */}
          <div className="bg-[#F8F9FB] rounded-3xl border border-black/[0.06] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1C1C1E]">
                  Acquisition & Transaction History
                </h3>
                <p className="text-[11px] text-[#8E8E93]">Track additions and sales for this asset</p>
              </div>

              <button
                onClick={() => setShowAddTx(!showAddTx)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-black/[0.08] hover:bg-black/[0.02] rounded-xl text-xs font-semibold text-[#007AFF] shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Transaction</span>
              </button>
            </div>

            {showAddTx && (
              <form onSubmit={handleAddTransaction} className="p-4 bg-white rounded-2xl border border-black/[0.08] space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-[#8E8E93] block mb-1">Type</label>
                    <select
                      value={txType}
                      onChange={(e: any) => setTxType(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#F2F2F7] border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E]"
                    >
                      <option value="BUY">Buy / Add</option>
                      <option value="SELL">Sell / Realize</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#8E8E93] block mb-1">Date</label>
                    <input
                      type="date"
                      value={txDate}
                      onChange={(e) => setTxDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#F2F2F7] border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#8E8E93] block mb-1">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={txQty}
                      onChange={(e) => setTxQty(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#F2F2F7] border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E] font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#8E8E93] block mb-1">Price (USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={txPrice}
                      onChange={(e) => setTxPrice(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#F2F2F7] border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E] font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddTx(false)}
                    className="px-3 py-1.5 bg-[#F2F2F7] rounded-xl text-xs text-[#1C1C1E] font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#007AFF] hover:bg-[#0066D6] text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
                  >
                    Add Entry
                  </button>
                </div>
              </form>
            )}

            {/* List of Transactions */}
            <div className="space-y-2">
              {(item.transactions && item.transactions.length > 0) ? (
                item.transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white border border-black/[0.04] text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          tx.type === 'BUY'
                            ? 'bg-blue-50 text-[#007AFF]'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {tx.type}
                      </span>
                      <span className="font-mono text-[#8E8E93] text-[11px]">{tx.date}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-mono text-[#8E8E93]">Qty: x{tx.quantity}</span>
                      <span className="font-mono font-bold text-[#1C1C1E]">
                        {formatPrice(tx.priceUSD)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-xs text-[#8E8E93]">
                  Initial purchase logged on {item.purchaseDate || 'vault creation'} @ {formatPrice(item.purchasePriceUSD)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showStorageModal && (
        <StorageInventoryModal
          initialSelectedMeta={item.storageLocation?.metaStorage}
          initialSelectedContainer={item.storageLocation?.container}
          onClose={() => setShowStorageModal(false)}
        />
      )}
    </div>
  );
};
