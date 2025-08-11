import { Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from './components/Header';
import ChatDrawer from './components/ChatDrawer';
import ChatTest from './components/ChatTest';
import UploadPage from './pages/UploadPage';
import ReconcilePage from './pages/ReconcilePage';
import ReviewPage from './pages/ReviewPage';
import AuditPage from './pages/AuditPage';

import { apiClient } from './lib/api';

function App() {
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([]);
  const [selectedTenant, setSelectedTenant] = useState('demo-tenant-1');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  // Check for demo mode
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isDemo = urlParams.get('demo') === '1' || import.meta.env.VITE_DEMO === '1';
    setIsDemoMode(isDemo);
  }, []);

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
        onChatToggle={() => setIsChatOpen(!isChatOpen)}
        isDemoMode={isDemoMode}
      />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<UploadPage isDemoMode={isDemoMode} />} />
          <Route path="/reconcile" element={<ReconcilePage isDemoMode={isDemoMode} />} />
          <Route path="/review" element={<ReviewPage isDemoMode={isDemoMode} />} />
          <Route path="/audit" element={<AuditPage isDemoMode={isDemoMode} />} />

          <Route path="/chat-test" element={<ChatTest />} />
        </Routes>
      </main>
      
      {/* Chat Drawer */}
      {isChatOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40"
          onClick={() => setIsChatOpen(false)}
        />
      )}
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
}

export default App;