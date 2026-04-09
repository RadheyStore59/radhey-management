import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LocalStorageAuthProvider, useAuth } from './contexts/LocalStorageAuthContext';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import NewDashboard from './components/NewDashboard';
import LeadsManagement from './components/LeadsManagement';
import SalesManagement from './components/SalesManagement';
import InventoryManagement from './components/InventoryManagement';
import Reports from './components/Reports';
import ImportExcel from './components/ImportExcel';
import Settings from './components/Settings';
import './App.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function AppRoutes() {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <div className="flex h-screen overflow-hidden">
            <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
            <div className="flex-1 overflow-y-auto bg-gray-50">
              <NewDashboard />
            </div>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/leads" element={
        <ProtectedRoute>
          <div className="flex h-screen overflow-hidden">
            <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
            <div className="flex-1 overflow-y-auto bg-gray-50">
              <LeadsManagement />
            </div>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/sales" element={
        <ProtectedRoute>
          <div className="flex h-screen overflow-hidden">
            <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
            <div className="flex-1 overflow-y-auto bg-gray-50">
              <SalesManagement />
            </div>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/inventory" element={
        <ProtectedRoute>
          <div className="flex h-screen overflow-hidden">
            <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
            <div className="flex-1 overflow-y-auto bg-gray-50">
              <InventoryManagement />
            </div>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute>
          <div className="flex h-screen overflow-hidden">
            <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
            <div className="flex-1 overflow-y-auto bg-gray-50">
              <Reports />
            </div>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/import" element={
        <ProtectedRoute>
          <div className="flex h-screen overflow-hidden">
            <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
            <div className="flex-1 overflow-y-auto bg-gray-50">
              <ImportExcel />
            </div>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <div className="flex h-screen overflow-hidden">
            <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
            <div className="flex-1 overflow-y-auto bg-gray-50">
              <Settings />
            </div>
          </div>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <LocalStorageAuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
        </div>
      </Router>
    </LocalStorageAuthProvider>
  );
}

export default App;
