import { Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from './components/Header';
import UploadPage from './pages/UploadPage';
import ReconcilePage from './pages/ReconcilePage';
import ReviewPage from './pages/ReviewPage';
import AuditPage from './pages/AuditPage';
import MCPToolsPage from './pages/MCPToolsPage';
import { apiClient } from './lib/api';

function App() {
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([]);
  const [selectedTenant, setSelectedTenant] = useState('demo-tenant-1');

  useEffect(() => {
    const loadTenants = async () => {
      try {
        const tenantList = await apiClient.getTenants();
        setTenants(tenantList);
      } catch (error) {
        console.error('Failed to load tenants:', error);
      }
    };
    loadTenants();
  }, []);

  useEffect(() => {
    localStorage.setItem('tenantId', selectedTenant);
  }, [selectedTenant]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        selectedTenant={selectedTenant}
        onTenantChange={setSelectedTenant}
        tenants={tenants}
      />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/reconcile" element={<ReconcilePage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/mcp-tools" element={<MCPToolsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;