import React, { useState } from 'react';
import { AssetItem, Transaction } from '../types';
import { useVault } from '../context/VaultContext';
import { InteractivePriceChart } from './InteractivePriceChart';
import { lookupLiveMarketPrice } from '../services/api';
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
} from 'lucide-react';

interface AssetDetailModalProps {
  item: AssetItem;
  onClose: () => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({ item, onClose }) => {
  const { updateItem, deleteItem, formatPrice, currencySymbol, convertPrice } = useVault();

  const [isEditing, setIsEditing] = useState(false);
  const [editedPrice, setEditedPrice] = useState(item.currentPriceUSD.toString());
  const [editedQty, setEditedQty] = useState(item.quantity.toString());
  const [editedCondition, setEditedCondition] = useState(item.condition);
  const [editedNotes, setEditedNotes] = useState(item.notes || '');
  const [isCheckingLivePrice, setIsCheckingLivePrice] = useState(false);
  const [livePriceStatus, setLivePriceStatus] = useState<string | null>(null);

  // New Transaction form
  const [showAddTx, setShowAddTx] = useState(false);
  const [txType, setTxType] = useState<'BUY' | 'SELL'>('BUY');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txQty, setTxQty] = useState('1');
  const [txPrice, setTxPrice] = useState(item.currentPriceUSD.toString());
  const [txNotes, setTxNotes] = useState('');

  const totalValue = item.currentPriceUSD * item.quantity;
  const totalCost = item.purchasePriceUSD * item.quantity;
  const gainUSD = totalValue - totalCost;
  const gainPct = totalCost > 0 ? (gainUSD / totalCost) * 100 : 0;
  const isGainPositive = gainUSD >= 0;

  const handleSaveEdits = () => {
    const numPrice = parseFloat(editedPrice) || item.currentPriceUSD;
    const numQty = parseInt(editedQty, 10) || item.quantity;

    updateItem(item.id, {
      currentPriceUSD: numPrice,
      quantity: numQty,
      condition: editedCondition as any,
      notes: editedNotes,
    });
    setIsEditing(false);
  };

  const handleFetchLivePrice = async () => {
    try {
      setIsCheckingLivePrice(true);
      setLivePriceStatus('Querying live market index...');
      const res = await lookupLiveMarketPrice({
        name: item.name,
        category: item.category,
        condition: item.condition,
        setOrGen: item.cardSpecs?.setName || item.beybladeSpecs?.generation,
      });

      if (res && res.currentPriceUSD) {
        updateItem(item.id, {
          currentPriceUSD: res.currentPriceUSD,
          previousPriceUSD_24h: res.previousPriceUSD_24h ?? item.currentPriceUSD,
          previousPriceUSD_7d: res.previousPriceUSD_7d,
          previousPriceUSD_30d: res.previousPriceUSD_30d,
          marketSource: res.marketSource || 'Live Market API Feed',
        });
        setEditedPrice(res.currentPriceUSD.toString());
        setLivePriceStatus(`Updated to ${formatPrice(res.currentPriceUSD)}! (${res.marketSource || 'API'})`);
      } else {
        setLivePriceStatus('Could not retrieve updated price feed.');
      }
    } catch (err) {
      setLivePriceStatus('Live fetch failed.');
    } finally {
      setIsCheckingLivePrice(false);
      setTimeout(() => setLivePriceStatus(null), 4000);
    }
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(txQty, 10) || 1;
    const price = parseFloat(txPrice) || item.currentPriceUSD;

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: txType,
      date: txDate,
      quantity: qty,
      pricePerUnitUSD: price,
      notes: txNotes,
    };

    const newQty = txType === 'BUY' ? item.quantity + qty : Math.max(0, item.quantity - qty);
    const updatedTxs = [...(item.transactions || []), newTx];

    updateItem(item.id, {
      transactions: updatedTxs,
      quantity: newQty,
    });

    setShowAddTx(false);
    setTxNotes('');
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${item.name}" from your vault?`)) {
      deleteItem(item.id);
      onClose();
    }
  };

  // External marketplace search links (Category specific & clean query)
  const getSanitizedSearchTerms = () => {
    // Strip hashtags, braces, and excess noise
    const nameNoHash = item.name.replace(/#/g, '');
    const cleanBase = nameNoHash.replace(/\(.*?\)/g, '').trim();

    let tcgPlayerQuery = cleanBase;
    let priceChartingQuery = cleanBase;
    let ebayQuery = cleanBase;

    if (item.category === 'pokemon') {
      const cardNum = item.cardSpecs?.setNumber || item.cardSpecs?.cardNumber || '';
      const isAltArt = item.name.toLowerCase().includes('alt art') || item.name.toLowerCase().includes('special illustration');
      
      // Exact variant queries
      if (item.name.toLowerCase().includes('moonbreon') || (item.name.toLowerCase().includes('umbreon') && item.name.includes('215'))) {
        tcgPlayerQuery = 'Umbreon VMAX 215/203 Alternate Art';
        priceChartingQuery = 'Umbreon VMAX 215 203 Evolving Skies';
        ebayQuery = 'Umbreon VMAX 215/203 Alt Art';
      } else if (item.name.toLowerCase().includes('charizard') && item.name.includes('199')) {
        tcgPlayerQuery = 'Charizard ex 199/165 Special Illustration Rare 151';
        priceChartingQuery = 'Charizard ex 199 165 Scarlet Violet 151';
        ebayQuery = 'Charizard ex 199/165 SIR 151';
      } else if (item.name.toLowerCase().includes('gengar') && item.name.includes('271')) {
        tcgPlayerQuery = 'Gengar VMAX 271/264 Alternate Art Fusion Strike';
        priceChartingQuery = 'Gengar VMAX 271 264 Fusion Strike';
        ebayQuery = 'Gengar VMAX 271/264 Alt Art';
      } else if (item.name.toLowerCase().includes('pikachu') && item.name.toLowerCase().includes('felt')) {
        tcgPlayerQuery = 'Pikachu Grey Felt Hat 085 Van Gogh Promo';
        priceChartingQuery = 'Pikachu Grey Felt Hat 085';
        ebayQuery = 'Pikachu Grey Felt Hat 085 Van Gogh';
      } else {
        tcgPlayerQuery = `${cleanBase} ${cardNum} ${item.cardSpecs?.setName || ''}`.trim();
        priceChartingQuery = `${cleanBase} ${cardNum.replace('/', ' ')}`.trim();
        ebayQuery = `${cleanBase} ${cardNum}`.trim();
      }
    } else if (item.category === 'mtg') {
      tcgPlayerQuery = cleanBase;
      priceChartingQuery = `${cleanBase} ${item.cardSpecs?.setName || ''}`.trim();
      ebayQuery = `${cleanBase} MTG`;
    } else if (item.category === 'beyblade') {
      const beyClean = item.name.replace(/\(.*?\)/g, '').replace(/Takara Tomy/i, '').trim();
      tcgPlayerQuery = beyClean;
      priceChartingQuery = beyClean;
      ebayQuery = `Takara Tomy Beyblade ${beyClean}`;
    } else if (item.category === 'onepiece') {
      const opNum = item.cardSpecs?.setNumber || item.cardSpecs?.cardNumber || '';
      tcgPlayerQuery = `${cleanBase} ${opNum}`.trim();
      priceChartingQuery = `${cleanBase} ${opNum}`.trim();
      ebayQuery = `One Piece Card Game ${cleanBase} ${opNum} Manga`;
    } else if (item.category === 'gaming') {
      const gameClean = cleanBase.replace('Pokémon', 'Pokemon');
      tcgPlayerQuery = gameClean;
      priceChartingQuery = `${gameClean} gba`;
      ebayQuery = `${gameClean} Authentic CIB`;
    }

    const isGraded = item.cardSpecs?.gradingCompany && item.cardSpecs.gradingCompany !== 'None';
    if (isGraded) {
      ebayQuery += ` ${item.cardSpecs?.gradingCompany} ${item.cardSpecs?.gradeValue}`;
    }

    return {
      tcgPlayer: `https://www.tcgplayer.com/search/all/product?q=${encodeURIComponent(tcgPlayerQuery)}`,
      priceCharting: `https://www.pricecharting.com/search-products?q=${encodeURIComponent(priceChartingQuery)}&type=prices`,
      ebaySold: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(ebayQuery)}&LH_Sold=1&LH_Complete=1`,
      primaryQuery: tcgPlayerQuery,
    };
  };

  const compsLinks = getSanitizedSearchTerms();

  const getPrimaryCompsUrl = () => {
    if (item.category === 'gaming') return compsLinks.priceCharting;
    if (item.category === 'beyblade') return compsLinks.ebaySold;
    return compsLinks.tcgPlayer;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/30 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div
        id="asset-detail-modal"
        className="relative w-full max-w-4xl rounded-3xl bg-white border border-black/[0.08] shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] text-[#1C1C1E]"
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06] bg-[#F2F2F7]">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-widest text-[#007AFF]">
              {item.category.toUpperCase()} ASSET DETAILS
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => updateItem(item.id, { isFavorite: !item.isFavorite })}
              className="p-2 rounded-xl bg-white hover:bg-black/[0.05] text-[#8E8E93] hover:text-[#FF9500] border border-black/[0.06] transition-colors shadow-sm"
              title="Favorite"
            >
              <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-[#FF9500] text-[#FF9500]' : ''}`} />
            </button>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 rounded-xl bg-white hover:bg-black/[0.05] text-[#8E8E93] hover:text-[#1C1C1E] border border-black/[0.06] transition-colors shadow-sm"
              title="Edit Item"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              onClick={handleDelete}
              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-[#FF3B30] border border-rose-200/80 transition-colors shadow-sm"
              title="Delete Asset"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white hover:bg-black/[0.05] text-[#8E8E93] hover:text-[#1C1C1E] border border-black/[0.06] transition-colors shadow-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: Image & Specs Card */}
            <div className="flex flex-col items-center">
              <div className="w-full aspect-[4/3] rounded-2xl bg-[#F2F2F7] border border-black/[0.06] p-4 flex items-center justify-center relative overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  referrerPolicy="no-referrer"
                  className="max-h-full max-w-full object-contain"
                  onError={(e: any) => {
                    e.target.src = 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80';
                  }}
                />
              </div>

              {/* External Comps Section */}
              <div className="w-full mt-3 space-y-1.5">
                <a
                  href={getPrimaryCompsUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#007AFF]/10 hover:bg-[#007AFF]/15 text-[#007AFF] text-xs font-bold border border-[#007AFF]/20 transition-all shadow-sm active:scale-[0.98]"
                >
                  <span>View Verified Sold Comps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                {/* Direct Marketplace Quick Access Chips */}
                <div className="grid grid-cols-3 gap-1 pt-1">
                  <a
                    href={compsLinks.tcgPlayer}
                    target="_blank"
                    rel="noreferrer"
                    className="py-1 px-1.5 rounded-lg bg-[#F2F2F7] hover:bg-black/[0.06] text-[10px] font-semibold text-center text-[#1C1C1E] border border-black/[0.04] transition-colors truncate"
                    title="Open on TCGPlayer with sanitized exact card query"
                  >
                    TCGPlayer
                  </a>
                  <a
                    href={compsLinks.priceCharting}
                    target="_blank"
                    rel="noreferrer"
                    className="py-1 px-1.5 rounded-lg bg-[#F2F2F7] hover:bg-black/[0.06] text-[10px] font-semibold text-center text-[#1C1C1E] border border-black/[0.04] transition-colors truncate"
                    title="Open PriceCharting (Graded PSA 10 & Raw price history)"
                  >
                    PriceCharting
                  </a>
                  <a
                    href={compsLinks.ebaySold}
                    target="_blank"
                    rel="noreferrer"
                    className="py-1 px-1.5 rounded-lg bg-[#F2F2F7] hover:bg-black/[0.06] text-[10px] font-semibold text-center text-[#1C1C1E] border border-black/[0.04] transition-colors truncate"
                    title="Open eBay Completed & Sold Listings"
                  >
                    eBay Sold
                  </a>
                </div>
              </div>

              {/* Source Tag & Query Hint */}
              <div className="text-[11px] text-[#8E8E93] text-center mt-2 font-medium">
                Source: {item.marketSource || 'CollectorVault Live Index'}
              </div>
              <div className="text-[10px] text-[#8E8E93] text-center font-mono truncate max-w-full px-2" title={compsLinks.primaryQuery}>
                Target: {compsLinks.primaryQuery}
              </div>
            </div>

            {/* Right: Key Valuation & Specs */}
            <div className="md:col-span-2 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-black/[0.05] text-[#1C1C1E] border border-black/[0.06]">
                    {item.condition.replace('_', ' ')}
                  </span>
                  {item.beybladeSpecs?.type && (
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">
                      {item.beybladeSpecs.type} Type
                    </span>
                  )}
                  {item.cardSpecs?.gradingCompany && item.cardSpecs.gradingCompany !== 'None' && (
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-200 font-mono">
                      {item.cardSpecs.gradingCompany} {item.cardSpecs.gradeValue}
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-[#1C1C1E] leading-snug">{item.name}</h2>
                <p className="text-xs text-[#8E8E93] mt-1 font-medium">
                  {item.cardSpecs?.setName || item.beybladeSpecs?.generation || 'Collectible'} • Purchased on {item.purchaseDate}
                </p>
              </div>

              {/* Value / Gain Box */}
              <div className="p-4 rounded-2xl bg-[#F2F2F7] border border-black/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#8E8E93]">Current Market</div>
                  <div className="text-lg font-bold text-[#1C1C1E] font-mono">{formatPrice(item.currentPriceUSD)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#8E8E93]">Total Quantity</div>
                  <div className="text-lg font-bold text-[#1C1C1E] font-mono">x{item.quantity} ({formatPrice(totalValue)})</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#8E8E93]">Buy Cost / Unit</div>
                  <div className="text-lg font-bold text-[#8E8E93] font-mono">{formatPrice(item.purchasePriceUSD)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#8E8E93]">Unrealized Gain</div>
                  <div className={`text-lg font-bold font-mono ${isGainPositive ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                    {isGainPositive ? '+' : ''}{gainPct.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Live Price Sync Action */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleFetchLivePrice}
                  disabled={isCheckingLivePrice}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#007AFF]/10 hover:bg-[#007AFF]/15 text-[#007AFF] border border-[#007AFF]/20 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingLivePrice ? 'animate-spin' : ''}`} />
                  <span>{isCheckingLivePrice ? 'Fetching API...' : 'Pull Live Price from API'}</span>
                </button>
                {livePriceStatus && (
                  <span className="text-xs text-[#007AFF] font-medium animate-in fade-in">
                    {livePriceStatus}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Edit Form Drawer if isEditing */}
          {isEditing && (
            <div className="p-4 rounded-2xl bg-[#F2F2F7] border border-black/[0.06] space-y-4 animate-in fade-in duration-150">
              <div className="text-xs font-bold text-[#007AFF] uppercase tracking-wider">
                Quick Edit Item Properties
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#8E8E93] block mb-1">
                    Market Price (USD $)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editedPrice}
                    onChange={(e) => setEditedPrice(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E] focus:outline-none focus:border-[#007AFF]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#8E8E93] block mb-1">
                    Owned Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editedQty}
                    onChange={(e) => setEditedQty(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E] focus:outline-none focus:border-[#007AFF]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#8E8E93] block mb-1">
                    Condition / Grade
                  </label>
                  <select
                    value={editedCondition}
                    onChange={(e) => setEditedCondition(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-white border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E] focus:outline-none focus:border-[#007AFF]"
                  >
                    <option value="PSA_10">PSA 10 Gem Mint</option>
                    <option value="PSA_9">PSA 9 Mint</option>
                    <option value="BGS_10">BGS 10 Pristine</option>
                    <option value="CGC_10">CGC 10 Pristine</option>
                    <option value="RAW_NM">Raw Near Mint (NM)</option>
                    <option value="RAW_LP">Raw Lightly Played (LP)</option>
                    <option value="NIB">New In Box (NIB)</option>
                    <option value="MINT_IN_BOX">Mint in Box</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#8E8E93] block mb-1">Notes</label>
                <input
                  type="text"
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  placeholder="e.g., PSA Cert number, tournament win, purchased from convention..."
                  className="w-full px-3 py-1.5 bg-white border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E] focus:outline-none focus:border-[#007AFF]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 rounded-xl text-xs text-[#8E8E93] hover:text-[#1C1C1E] font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdits}
                  className="px-4 py-1.5 rounded-xl bg-[#007AFF] hover:bg-[#0066D6] text-white font-bold text-xs shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Historical Price Chart for this asset */}
          <div className="p-4 rounded-2xl bg-white border border-black/[0.06] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1C1C1E]">
                Asset Price History
              </span>
            </div>
            <InteractivePriceChart
              customHistory={item.priceHistory}
              customCostUSD={item.purchasePriceUSD * item.quantity}
              height={200}
            />
          </div>

          {/* Beyblade or Card Specific Technical Specifications */}
          {item.beybladeSpecs && (
            <div className="p-4 rounded-2xl bg-white border border-black/[0.06] shadow-sm space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#007AFF] flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5" />
                <span>Beyblade Part Breakdown & Specs</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-[#F2F2F7] p-2.5 rounded-xl border border-black/[0.04]">
                  <div className="text-[10px] text-[#8E8E93] font-bold uppercase">Blade / Wheel</div>
                  <div className="font-bold text-[#1C1C1E]">{item.beybladeSpecs.blade || 'Standard'}</div>
                </div>
                <div className="bg-[#F2F2F7] p-2.5 rounded-xl border border-black/[0.04]">
                  <div className="text-[10px] text-[#8E8E93] font-bold uppercase">Ratchet / Track</div>
                  <div className="font-bold text-[#1C1C1E]">{item.beybladeSpecs.ratchet || 'N/A'}</div>
                </div>
                <div className="bg-[#F2F2F7] p-2.5 rounded-xl border border-black/[0.04]">
                  <div className="text-[10px] text-[#8E8E93] font-bold uppercase">Bit / Bottom</div>
                  <div className="font-bold text-[#1C1C1E]">{item.beybladeSpecs.bit || 'N/A'}</div>
                </div>
                <div className="bg-[#F2F2F7] p-2.5 rounded-xl border border-black/[0.04]">
                  <div className="text-[10px] text-[#8E8E93] font-bold uppercase">Weight / System</div>
                  <div className="font-bold text-[#1C1C1E]">
                    {item.beybladeSpecs.weightGrams ? `${item.beybladeSpecs.weightGrams}g` : item.beybladeSpecs.system || 'BX'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {item.cardSpecs && (
            <div className="p-4 rounded-2xl bg-white border border-black/[0.06] shadow-sm space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#007AFF] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>Card Specifications & Grading Data</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-[#F2F2F7] p-2.5 rounded-xl border border-black/[0.04]">
                  <div className="text-[10px] text-[#8E8E93] font-bold uppercase">Set Name</div>
                  <div className="font-bold text-[#1C1C1E] truncate">{item.cardSpecs.setName}</div>
                </div>
                <div className="bg-[#F2F2F7] p-2.5 rounded-xl border border-black/[0.04]">
                  <div className="text-[10px] text-[#8E8E93] font-bold uppercase">Card # / Rarity</div>
                  <div className="font-bold text-[#1C1C1E] truncate">
                    {item.cardSpecs.setNumber || item.cardSpecs.cardNumber || 'Promo'} • {item.cardSpecs.rarity || 'Holo'}
                  </div>
                </div>
                <div className="bg-[#F2F2F7] p-2.5 rounded-xl border border-black/[0.04]">
                  <div className="text-[10px] text-[#8E8E93] font-bold uppercase">Grading Cert #</div>
                  <div className="font-bold font-mono text-[#1C1C1E]">
                    {item.cardSpecs.certNumber || 'Raw / Ungraded'}
                  </div>
                </div>
                <div className="bg-[#F2F2F7] p-2.5 rounded-xl border border-black/[0.04]">
                  <div className="text-[10px] text-[#8E8E93] font-bold uppercase">Release Year</div>
                  <div className="font-bold text-[#1C1C1E]">{item.cardSpecs.releaseYear || 'Modern'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Transactions / Purchase Lots History */}
          <div className="p-4 rounded-2xl bg-white border border-black/[0.06] shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1C1C1E]">
                Transaction & Lot History ({item.transactions?.length || 0})
              </span>
              <button
                onClick={() => setShowAddTx(!showAddTx)}
                className="flex items-center gap-1 text-xs text-[#007AFF] hover:text-[#0066D6] font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Lot</span>
              </button>
            </div>

            {/* Add Tx Form */}
            {showAddTx && (
              <form onSubmit={handleAddTransaction} className="p-3 bg-[#F2F2F7] rounded-xl border border-black/[0.06] space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-[#8E8E93] block">Type</label>
                    <select
                      value={txType}
                      onChange={(e: any) => setTxType(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-black/[0.08] rounded-lg text-xs text-[#1C1C1E]"
                    >
                      <option value="BUY">BUY</option>
                      <option value="SELL">SELL</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#8E8E93] block">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={txQty}
                      onChange={(e) => setTxQty(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-black/[0.08] rounded-lg text-xs text-[#1C1C1E]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#8E8E93] block">Price / Unit ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={txPrice}
                      onChange={(e) => setTxPrice(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-black/[0.08] rounded-lg text-xs text-[#1C1C1E]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#8E8E93] block">Date</label>
                    <input
                      type="date"
                      value={txDate}
                      onChange={(e) => setTxDate(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-black/[0.08] rounded-lg text-xs text-[#1C1C1E]"
                    />
                  </div>
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Notes (e.g. Card Show, Trade, eBay win)"
                    value={txNotes}
                    onChange={(e) => setTxNotes(e.target.value)}
                    className="w-full px-2.5 py-1 bg-white border border-black/[0.08] rounded-lg text-xs text-[#1C1C1E]"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddTx(false)}
                    className="px-3 py-1 text-xs text-[#8E8E93] hover:text-[#1C1C1E] font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-lg bg-[#007AFF] text-white font-bold text-xs shadow-sm"
                  >
                    Save Transaction
                  </button>
                </div>
              </form>
            )}

            {/* List of Txs */}
            <div className="space-y-1.5 text-xs">
              {(item.transactions || []).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-2.5 bg-[#F2F2F7] rounded-xl border border-black/[0.04]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        tx.type === 'BUY'
                          ? 'bg-emerald-50 text-[#34C759] border border-emerald-200'
                          : 'bg-blue-50 text-[#007AFF] border border-blue-200'
                      }`}
                    >
                      {tx.type}
                    </span>
                    <span className="text-[#1C1C1E] font-mono font-bold">x{tx.quantity}</span>
                    <span className="text-[#8E8E93]">@ {formatPrice(tx.pricePerUnitUSD)}</span>
                    {tx.notes && <span className="text-[#8E8E93] italic hidden sm:inline">• {tx.notes}</span>}
                  </div>
                  <div className="text-[#8E8E93] font-mono text-[11px]">{tx.date}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
