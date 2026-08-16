import React, { useState, useRef } from 'react';
import { useVault } from '../../context/VaultContext';
import { scanIdentifyAsset } from '../../services/api';
import {
  X,
  Camera,
  Upload,
  Sparkles,
  ScanLine,
  RefreshCw,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { HobbyType, ItemCondition } from '../../types';

interface ScanModalProps {
  onClose: () => void;
}

export const ScanModal: React.FC<ScanModalProps> = ({ onClose }) => {
  const { sandboxes, activeSandboxId, addItem, formatPrice } = useVault();

  const [mode, setMode] = useState<'upload' | 'camera' | 'text'>('upload');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [textQuery, setTextQuery] = useState('');
  const [categoryHint, setCategoryHint] = useState<string>(
    activeSandboxId !== 'all' ? (sandboxes.find((s) => s.id === activeSandboxId)?.type || 'pokemon') : 'pokemon'
  );
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Start Camera
  const startCamera = async () => {
    try {
      setMode('camera');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      alert('Camera access denied or unavailable. Please use photo upload.');
      setMode('upload');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setSelectedImage(dataUrl);
      setMimeType('image/jpeg');
      stopCamera();
      setMode('upload');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMimeType(file.type || 'image/jpeg');
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setScanResult(null);
        setScanError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunScan = async () => {
    if (!selectedImage && !textQuery.trim()) {
      setScanError('Please provide an image or text description.');
      return;
    }

    try {
      setIsScanning(true);
      setScanError(null);
      setScanResult(null);

      const result = await scanIdentifyAsset({
        imageBase64: selectedImage || undefined,
        mimeType,
        textQuery: textQuery.trim() || undefined,
        categoryHint,
      });

      if (result) {
        setScanResult(result);
      } else {
        setScanError('Could not identify collectible. Please try a clearer photo or enter details.');
      }
    } catch (err: any) {
      setScanError(err.message || 'Scanning failed.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddScannedAsset = () => {
    if (!scanResult) return;

    const targetCategory = (scanResult.category || categoryHint || 'pokemon') as HobbyType;
    const targetSandbox =
      sandboxes.find((s) => s.type === targetCategory) ||
      (activeSandboxId !== 'all' ? sandboxes.find((s) => s.id === activeSandboxId) : null) ||
      sandboxes[0];

    const estPrice = scanResult.estimatedPriceUSD || 25.0;

    addItem({
      sandboxId: targetSandbox?.id || 'pokemon-vault',
      name: scanResult.name,
      category: targetCategory,
      imageUrl: selectedImage || (targetCategory === 'beyblade'
        ? 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80'
        : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'),
      currentPriceUSD: estPrice,
      purchasePriceUSD: Number((estPrice * 0.85).toFixed(2)),
      purchaseDate: new Date().toISOString().split('T')[0],
      quantity: 1,
      condition: (scanResult.condition as ItemCondition) || 'RAW_NM',
      tags: scanResult.tags || ['AI Scanned', targetCategory],
      notes: scanResult.notes || 'Identified via AI Collector Scanner',
      priceHistory: [],
      beybladeSpecs: scanResult.beybladeSpecs,
      cardSpecs: scanResult.cardSpecs,
      transactions: [
        {
          id: `tx-${Date.now()}`,
          type: 'BUY',
          date: new Date().toISOString().split('T')[0],
          quantity: 1,
          pricePerUnitUSD: Number((estPrice * 0.85).toFixed(2)),
          notes: 'Scanned asset addition',
        },
      ],
      isFavorite: false,
    });

    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/30 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div
        id="scan-modal"
        className="relative w-full max-w-2xl rounded-3xl bg-white border border-black/[0.08] shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] text-[#1C1C1E]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06] bg-[#F2F2F7]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#007AFF]/10 text-[#007AFF]">
              <ScanLine className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-[#1C1C1E] tracking-wide">AI Collectible Scanner</span>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-white hover:bg-black/[0.05] text-[#8E8E93] hover:text-[#1C1C1E] border border-black/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="px-6 pt-3 border-b border-black/[0.06] bg-[#F2F2F7]/50 flex gap-2">
          <button
            onClick={() => {
              stopCamera();
              setMode('upload');
            }}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              mode === 'upload' ? 'border-[#007AFF] text-[#007AFF]' : 'border-transparent text-[#8E8E93] hover:text-[#1C1C1E]'
            }`}
          >
            Photo Upload / Drop
          </button>
          <button
            onClick={startCamera}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              mode === 'camera' ? 'border-[#007AFF] text-[#007AFF]' : 'border-transparent text-[#8E8E93] hover:text-[#1C1C1E]'
            }`}
          >
            Live Camera Scan
          </button>
          <button
            onClick={() => {
              stopCamera();
              setMode('text');
            }}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              mode === 'text' ? 'border-[#007AFF] text-[#007AFF]' : 'border-transparent text-[#8E8E93] hover:text-[#1C1C1E]'
            }`}
          >
            Card Code / Barcode Text
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {mode === 'camera' ? (
            <div className="space-y-3">
              <div className="relative aspect-[4/3] rounded-2xl bg-black overflow-hidden border border-black/[0.08] flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute inset-8 border-2 border-[#007AFF]/80 rounded-2xl pointer-events-none flex items-center justify-center">
                  <span className="text-[11px] font-semibold text-white bg-black/60 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                    Align Card or Beyblade in Box
                  </span>
                </div>
              </div>
              <button
                onClick={capturePhoto}
                className="w-full py-3 rounded-2xl bg-[#007AFF] hover:bg-[#0066D6] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Capture Snapshot</span>
              </button>
            </div>
          ) : mode === 'upload' ? (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-black/[0.12] hover:border-[#007AFF] rounded-2xl p-6 text-center cursor-pointer bg-[#F2F2F7]/50 hover:bg-[#F2F2F7] transition-colors flex flex-col items-center justify-center"
              >
                {selectedImage ? (
                  <div className="space-y-2">
                    <img
                      src={selectedImage}
                      alt="Preview"
                      className="max-h-48 rounded-xl mx-auto object-contain border border-black/[0.08]"
                    />
                    <span className="text-xs text-[#007AFF] font-semibold block">
                      Click to change image
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center mb-2">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-bold text-[#1C1C1E]">Click or Drag & Drop Photo</div>
                    <div className="text-[11px] text-[#8E8E93] mt-0.5">
                      Upload Pokémon card, Beyblade box/blade, or slab photo
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#8E8E93] block">
                Item Description, Card #, or Barcode / Release Code
              </label>
              <textarea
                rows={3}
                value={textQuery}
                onChange={(e) => setTextQuery(e.target.value)}
                placeholder="e.g. Takara Tomy UX-03 Wizard Rod 5-70DB or Pokemon 151 Charizard ex 199/165 PSA 10"
                className="w-full p-3 bg-[#F2F2F7] border border-black/[0.08] rounded-xl text-xs text-[#1C1C1E] placeholder-[#8E8E93] focus:outline-none focus:border-[#007AFF]"
              />
            </div>
          )}

          {/* Category Hint Selector */}
          <div className="flex items-center justify-between gap-3 p-3 bg-[#F2F2F7] rounded-xl border border-black/[0.06]">
            <span className="text-xs text-[#8E8E93] font-semibold">Expected Hobby Category:</span>
            <select
              value={categoryHint}
              onChange={(e) => setCategoryHint(e.target.value)}
              className="px-2.5 py-1 bg-white border border-black/[0.08] rounded-lg text-xs text-[#1C1C1E] font-medium focus:outline-none focus:border-[#007AFF]"
            >
              <option value="pokemon">Pokémon TCG</option>
              <option value="beyblade">Beyblade</option>
              <option value="onepiece">One Piece TCG</option>
              <option value="mtg">Magic: The Gathering</option>
              <option value="gaming">Retro Gaming</option>
            </select>
          </div>

          {/* Action Button */}
          {!scanResult && (
            <button
              onClick={handleRunScan}
              disabled={isScanning || (!selectedImage && !textQuery.trim())}
              className="w-full py-3 rounded-2xl bg-[#007AFF] hover:bg-[#0066D6] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 transition-all cursor-pointer"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing Collectible via AI Engine...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Scan & Identify Asset</span>
                </>
              )}
            </button>
          )}

          {scanError && (
            <div className="p-3 rounded-xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-[#FF3B30] text-xs font-medium">
              {scanError}
            </div>
          )}

          {/* Scan Results Card */}
          {scanResult && (
            <div className="p-4 rounded-2xl bg-[#F2F2F7] border border-black/[0.08] space-y-3 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#007AFF] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#34C759]" />
                  <span>AI Identification Match ({Math.round((scanResult.confidence || 0.92) * 100)}%)</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20">
                  {scanResult.category?.toUpperCase() || 'COLLECTIBLE'}
                </span>
              </div>

              <div className="text-base font-bold text-[#1C1C1E]">{scanResult.name}</div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 bg-white rounded-xl border border-black/[0.06] shadow-sm">
                  <div className="text-[10px] font-bold text-[#8E8E93]">Estimated Market</div>
                  <div className="text-sm font-bold text-[#34C759] font-mono mt-0.5">
                    {formatPrice(scanResult.estimatedPriceUSD || 35)}
                  </div>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-black/[0.06] shadow-sm">
                  <div className="text-[10px] font-bold text-[#8E8E93]">Detected Grade</div>
                  <div className="text-xs font-bold text-[#1C1C1E] mt-0.5">
                    {scanResult.condition || 'RAW_NM'}
                  </div>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-black/[0.06] shadow-sm col-span-2 sm:span-1">
                  <div className="text-[10px] font-bold text-[#8E8E93]">Suggested Action</div>
                  <div className="text-xs font-semibold text-[#007AFF] truncate mt-0.5">
                    Ready to Vault
                  </div>
                </div>
              </div>

              {scanResult.notes && (
                <div className="text-[11px] text-[#8E8E93] italic">
                  Note: {scanResult.notes}
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => setScanResult(null)}
                  className="px-4 py-2 rounded-xl text-[#8E8E93] hover:text-[#1C1C1E] text-xs font-semibold cursor-pointer"
                >
                  Rescan
                </button>
                <button
                  onClick={handleAddScannedAsset}
                  className="flex-1 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#0066D6] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <span>Accept & Add to Sandbox</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
