
import React, { useState } from 'react';
import { View } from './types';
import { Layout } from './components/Layout';
import { AuthScreen } from './views/AuthScreen';
import { Dashboard } from './views/Dashboard';
import { PosScreen } from './views/PosScreen';
import { GenericManager } from './views/GenericManager';
import { PurchaseManager } from './views/PurchaseManager';
import { InventoryManager } from './views/InventoryManager';
import { Reports } from './views/Reports';
import { SettingsScreen } from './views/SettingsScreen';
import { LedgerScreen } from './views/LedgerScreen';
import { StoreProvider, useStore } from './context/StoreContext';

// Create an inner component to consume the context
const AppContent = () => {
  const { currentUser, logout } = useStore();
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);

  if (!currentUser) {
    return <AuthScreen onAuthenticated={() => {}} />;
  }

  const renderView = () => {
    switch (currentView) {
      case View.DASHBOARD: return <Dashboard />;
      case View.POS: return <PosScreen />;
      case View.PRODUCTS: return <InventoryManager />;
      case View.REPORTS: return <Reports />;
      case View.SETTINGS: return <SettingsScreen />;
      case View.PURCHASES: return <PurchaseManager />;
      case View.LEDGER: return <LedgerScreen />;
      default: return <GenericManager type={currentView} />;
    }
  };

  return (
    <Layout 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        onLogout={logout}
    >
        {renderView()}
    </Layout>
  );
};

export default function App() {
  return (
    <StoreProvider>
        <AppContent />
    </StoreProvider>
  );
}
