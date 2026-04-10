import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LocalStorageAuthProvider, useAuth } from './contexts/LocalStorageAuthContext';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import MobileHeader from './components/MobileHeader';
import Dashboard from './components/Dashboard';
import LeadsManagement from './components/LeadsManagement';
import SalesManagement from './components/SalesManagement';
import InvestmentManagement from './components/InvestmentManagement';
import GstManagement from './components/GstManagement';
import CourierManagement from './components/CourierManagement';
import InventoryManagement from './components/InventoryManagement';
import Reports from './components/Reports';
import ImportExcel from './components/ImportExcel';
import Settings from './components/Settings';
import ToastHost from './components/ToastHost';
import './App.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function AppRoutes() {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/" element={
        <Navigate to="/dashboard" />
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <div className="flex h-screen overflow-hidden">
            <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
            <div className={`flex-1 overflow-y-auto bg-gray-50 transition-all duration-300 ${!sidebarCollapsed ? 'lg:ml-0' : ''}`}>
              <MobileHeader onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
              <Dashboard />
            </div>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/leads" element={
        <ProtectedRoute>
          <div className="flex h-screen overflow-hidden">
            <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
            <div className={`flex-1 overflow-y-auto bg-gray-50 transition-all duration-300 ${!sidebarCollapsed ? 'lg:ml-0' : ''}`}>
              <MobileHeader onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
              <LeadsManagement />
            </div>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/sales" element={
        <ProtectedRoute>
          <div className="flex h-screen overflow-hidden">
            <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
            <div className={`flex-1 overflow-y-auto bg-gray-50 transition-all duration-300 ${!sidebarCollapsed ? 'lg:ml-0' : ''}`}>
              <MobileHeader onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
              <SalesManagement />
            </div>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/investments" element={
        <ProtectedRoute>
          <div className="flex h-screen overflow-hidden">
            <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
            <div className={`flex-1 overflow-y-auto bg-gray-50 transition-all duration-300 ${!sidebarCollapsed ? 'lg:ml-0' : ''}`}>
              <MobileHeader onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
              <InvestmentManagement />
            </div>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/investment" element={<Navigate to="/investments" />} />
      <Route path="/inventory" element={
        <ProtectedRoute>
          <div className="flex h-screen overflow-hidden">
            <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
            <div className={`flex-1 overflow-y-auto bg-gray-50 transition-all duration-300 ${!sidebarCollapsed ? 'lg:ml-0' : ''}`}>
              <MobileHeader onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
              <InventoryManagement />
            </div>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/gst" element={
        <ProtectedRoute>
          <div className="flex h-screen overflow-hidden">
            <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
            <div className={`flex-1 overflow-y-auto bg-gray-50 transition-all duration-300 ${!sidebarCollapsed ? 'lg:ml-0' : ''}`}>
              <MobileHeader onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
              <GstManagement />
            </div>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/courier" element={
        <ProtectedRoute>
          <div className="flex h-screen overflow-hidden">
            <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
            <div className={`flex-1 overflow-y-auto bg-gray-50 transition-all duration-300 ${!sidebarCollapsed ? 'lg:ml-0' : ''}`}>
              <MobileHeader onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
              <CourierManagement />
            </div>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute>
          <div className="flex h-screen overflow-hidden">
            <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
            <div className={`flex-1 overflow-y-auto bg-gray-50 transition-all duration-300 ${!sidebarCollapsed ? 'lg:ml-0' : ''}`}>
              <MobileHeader onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
              <Reports />
            </div>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/import" element={
        <ProtectedRoute>
          <div className="flex h-screen overflow-hidden">
            <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
            <div className={`flex-1 overflow-y-auto bg-gray-50 transition-all duration-300 ${!sidebarCollapsed ? 'lg:ml-0' : ''}`}>
              <MobileHeader onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
              <ImportExcel />
            </div>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <div className="flex h-screen overflow-hidden">
            <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
            <div className={`flex-1 overflow-y-auto bg-gray-50 transition-all duration-300 ${!sidebarCollapsed ? 'lg:ml-0' : ''}`}>
              <MobileHeader onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
              <Settings />
            </div>
          </div>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

function App() {
  return (
    <LocalStorageAuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
          <ToastHost />
        </div>
      </Router>
    </LocalStorageAuthProvider>
  );
}

export default App;
