import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { VaultProvider, useVault } from './context/VaultContext';
import { AppleNavbar } from './components/layout/AppleNavbar';
import { SandboxTabs } from './components/portfolio/SandboxTabs';
import { PortfolioHeader } from './components/portfolio/PortfolioHeader';
import { AssetGrid } from './components/portfolio/AssetGrid';
import { AssetDetailModal } from './components/modals/AssetDetailModal';
import { AddItemModal } from './components/modals/AddItemModal';
import { AnalyticsModal } from './components/modals/AnalyticsModal';
import { CustomSandboxModal } from './components/modals/CustomSandboxModal';
import { ApiDiagnosticsModal } from './components/modals/ApiDiagnosticsModal';
import { StorageInventoryModal } from './components/modals/StorageInventoryModal';
import { OmniAgentModal } from './components/modals/OmniAgentModal';
import { PhysicalStorageHub } from './components/storage/PhysicalStorageHub';
import { AuthModal } from './components/auth/AuthModal';
import { GuestWelcomeView } from './components/auth/GuestWelcomeView';
import { BackgroundTasksIndicator } from './components/common/BackgroundTasksIndicator';
import { AssetItem } from './types';

function MainVaultApp() {
  const { activeUserId } = useAuth();
  const { selectedItem, setSelectedItem, activeView, setActiveView } = useVault();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
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
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F2F2F7] text-[#1C1C1E] flex flex-col font-sans selection:bg-[#007AFF] selection:text-white">
      {/* Top Apple HIG Translucent Header */}
      <AppleNavbar
        onOpenAddModal={() => setShowAddModal(true)}
        onOpenAnalyticsModal={() => setShowAnalyticsModal(true)}
        onOpenAgentModal={() => setShowAgentModal(true)}
        onOpenStorageModal={() => setActiveView('storage')}
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
      ) : activeView === 'storage' ? (
        /* Full-Page Physical Storage & Real-World Inventory Hub Microservice */
        <main className="flex-1 flex flex-col">
          <PhysicalStorageHub />
        </main>
      ) : (
        /* Standard Vault Portfolio View */
        <>
          {/* Sandboxed Hobby Vault Tabs */}
          <SandboxTabs onOpenNewSandboxModal={() => setShowNewSandboxModal(true)} />

          {/* Main Dynamic Portfolio & Metric Banner */}
          <PortfolioHeader onOpenAgentModal={() => setShowAgentModal(true)} />

          {/* Main Asset Grid & Filter Area */}
          <main className="flex-1">
            <AssetGrid
              onSelectItem={(item: AssetItem) => setSelectedItem(item)}
              onOpenAddModal={() => setShowAddModal(true)}
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

      {showAnalyticsModal && (
        <AnalyticsModal onClose={() => setShowAnalyticsModal(false)} />
      )}

      {showAgentModal && (
        <OmniAgentModal onClose={() => setShowAgentModal(false)} />
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

      {/* Floating Background AI Tasks Indicator */}
      <BackgroundTasksIndicator />
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
