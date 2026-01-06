import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/contexts/AuthContext';

import Dashboard from './Dashboard';
import OrdersPage from './OrdersPage';
import DirectoriesPage from './DirectoriesPage';
import SettingsPage from './SettingsPage';
import UsersPage from './UsersPage';
import StatusesSettings from './StatusesSettings';
import PrintTemplatesSettings from './PrintTemplatesSettings';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { currentUser } = useAuth();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'orders':
        return <OrdersPage />;
      case 'directories-contractors':
      case 'directories-products':
      case 'directories-services':
      case 'directories-devices':
      case 'directories-accessories':
      case 'directories-malfunctions':
      case 'directories-units':
      case 'directories-money':
        return <DirectoriesPage activeDirectory={activeTab} />;
      case 'settings':
        return <SettingsPage />;
      case 'settings-users':
        return <UsersPage />;
      case 'settings-statuses':
        return <StatusesSettings />;
      case 'settings-print-templates':
        return <PrintTemplatesSettings />;
      case 'shop':
        window.open('/shop', '_blank');
        return null;
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-700 mb-2">В разработке</h2>
              <p className="text-slate-500">
                Раздел "{activeTab}" находится в разработке
              </p>
            </div>
          </div>
        );
    }
  };

  if (!currentUser) return null;

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main className="flex-1 overflow-auto">
        <div className="p-8">{renderContent()}</div>
      </main>
    </div>
  );
};

export default Index;