import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { VaultProvider, useVault } from './context/VaultContext';
import { AppleNavbar } from './components/layout/AppleNavbar';
import { SandboxTabs } from './components/portfolio/SandboxTabs';
import { PortfolioHeader } from './components/portfolio/PortfolioHeader';
import { AssetGrid } from './components/portfolio/AssetGrid';
import { AssetDetailModal } from './components/modals/AssetDetailModal';
import { AddItemModal } from './components/modals/AddItemModal';
import { ScanModal } from './components/modals/ScanModal';
import { AnalyticsModal } from './components/modals/AnalyticsModal';
import { CustomSandboxModal } from './components/modals/CustomSandboxModal';
import { ApiDiagnosticsModal } from './components/modals/ApiDiagnosticsModal';
import { StorageInventoryModal } from './components/modals/StorageInventoryModal';
import { AuthModal } from './components/auth/AuthModal';
import { GuestWelcomeView } from './components/auth/GuestWelcomeView';
import { AssetItem } from './types';

function MainVaultApp() {
  const { activeUserId } = useAuth();
  const { selectedItem, setSelectedItem } = useVault();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [showNewSandboxModal, setShowNewSandboxModal] = useState(false);
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState(false);
  const [authModal, setAuthModal] = useState<{
    isOpen: boolean;
    mode: 'signin' | 'register';
  }>({
    isOpen: false,
    mode: 'signin',
  });

  return (
    <div className="min-h-screen bg-[#F2F2F7] text-[#1C1C1E] flex flex-col font-sans selection:bg-[#007AFF] selection:text-white">
      {/* Top Apple HIG Translucent Header */}
      <AppleNavbar
        onOpenAddModal={() => setShowAddModal(true)}
        onOpenScanModal={() => setShowScanModal(true)}
        onOpenAnalyticsModal={() => setShowAnalyticsModal(true)}
        onOpenStorageModal={() => setShowStorageModal(true)}
        onOpenNewSandboxModal={() => setShowNewSandboxModal(true)}
        onOpenDiagnosticsModal={() => setShowDiagnosticsModal(true)}
        onOpenAuthModal={(mode) => setAuthModal({ isOpen: true, mode })}
      />

      {/* Conditional Rendering: Guest Welcome View vs Authenticated Personal Vault */}
      {!activeUserId ? (
        <main className="flex-1 flex flex-col justify-center">
          <GuestWelcomeView
            onOpenAuthModal={(mode) => setAuthModal({ isOpen: true, mode })}
          />
        </main>
      ) : (
        <>
          {/* Sandboxed Hobby Vault Tabs */}
          <SandboxTabs onOpenNewSandboxModal={() => setShowNewSandboxModal(true)} />

          {/* Main Dynamic Portfolio & Metric Banner */}
          <PortfolioHeader />

          {/* Main Asset Grid & Filter Area */}
          <main className="flex-1">
            <AssetGrid
              onSelectItem={(item: AssetItem) => setSelectedItem(item)}
              onOpenAddModal={() => setShowAddModal(true)}
              onOpenScanModal={() => setShowScanModal(true)}
            />
          </main>
        </>
      )}

      {/* Modals */}
      {selectedItem && (
        <AssetDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {showAddModal && (
        <AddItemModal onClose={() => setShowAddModal(false)} />
      )}

      {showScanModal && (
        <ScanModal onClose={() => setShowScanModal(false)} />
      )}

      {showAnalyticsModal && (
        <AnalyticsModal onClose={() => setShowAnalyticsModal(false)} />
      )}

      {showStorageModal && (
        <StorageInventoryModal onClose={() => setShowStorageModal(false)} />
      )}

      {showNewSandboxModal && (
        <CustomSandboxModal onClose={() => setShowNewSandboxModal(false)} />
      )}

      {showDiagnosticsModal && (
        <ApiDiagnosticsModal
          isOpen={showDiagnosticsModal}
          onClose={() => setShowDiagnosticsModal(false)}
        />
      )}

      <AuthModal
        isOpen={authModal.isOpen}
        initialMode={authModal.mode}
        onClose={() => setAuthModal({ isOpen: false, mode: 'signin' })}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <VaultProvider>
        <MainVaultApp />
      </VaultProvider>
    </AuthProvider>
  );
}
