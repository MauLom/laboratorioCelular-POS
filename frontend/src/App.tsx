import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import CashSessionProvider from './components/cash/CashSessionProvider';
import NotificationManager from './components/ui/NotificationManager';
import LoginPage from './pages/LoginPage';
import SetNewPasswordPage from './pages/SetNewPasswordPage';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import SalesPage from './pages/SalesPage';
import UserManagement from './pages/UserManagement';
import ConfigurationPage from './pages/Configuration';
import ExpensesPage from './pages/ExpensesPage';
import CashClose from './components/cash/CashClose';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <CashSessionProvider>
          <Router>
            <div className="App">
              <NotificationManager />
              <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route 
                path="/set-new-password" 
                element={
                  <ProtectedRoute>
                    <SetNewPasswordPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/inventory" 
                element={
                  <ProtectedRoute>
                    <InventoryPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/sales" 
                element={
                  <ProtectedRoute>
                    <SalesPage />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/expenses"
                element={
                  <ProtectedRoute>
                   <ExpensesPage />
                  </ProtectedRoute> 
                }
               />
              <Route
                path="/cash-close"
                element={
                  <ProtectedRoute>
                    <CashClose />
                  </ProtectedRoute>
                }
              /> 
              <Route 
                path="/users" 
                element={
                  <ProtectedRoute requiredRoles={['Master admin']}>
                    <UserManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/configuration" 
                element={
                  <ProtectedRoute requiredRoles={['Master admin']}>
                    <ConfigurationPage />
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
        </CashSessionProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
