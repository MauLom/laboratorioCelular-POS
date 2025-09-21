import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import Layout from '../components/common/Layout';
import Navigation from '../components/common/Navigation';
import { inventoryApi, salesApi } from '../services/api';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
`;

const StatCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 1rem;
  color: #7f8c8d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const QuickActions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
`;

const ActionCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  text-align: center;
`;

const ActionTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: #2c3e50;
`;

const ActionButton = styled(Link)`
  display: inline-block;
  background-color: #3498db;
  color: white;
  text-decoration: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-weight: 600;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #2980b9;
  }
`;

const SalesActionButton = styled(ActionButton)`
  background-color: #27ae60;
  
  &:hover {
    background-color: #229954;
  }
`;

const LoadingCard = styled(StatCard)`
  color: #7f8c8d;
`;

interface InventoryStats {
  stateStats: Array<{ _id: string; count: number }>;
  branchStats: Array<{ _id: string; count: number }>;
}

interface SalesStats {
  descriptionStats: Array<{ _id: string; count: number; totalAmount: number }>;
  financeStats: Array<{ _id: string; count: number; totalAmount: number }>;
}

const DashboardPage: React.FC = () => {
  const [inventoryStats, setInventoryStats] = useState<InventoryStats | null>(null);
  const [salesStats, setSalesStats] = useState<SalesStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [invStats, saleStats] = await Promise.all([
          inventoryApi.getStats(),
          salesApi.getStats(),
        ]);
        
        setInventoryStats(invStats);
        setSalesStats(saleStats);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const getTotalInventoryItems = () => {
    if (!inventoryStats?.stateStats) return 0;
    return inventoryStats.stateStats.reduce((total, stat) => total + stat.count, 0);
  };

  const getTotalSalesAmount = () => {
    if (!salesStats?.descriptionStats) return 0;
    return salesStats.descriptionStats.reduce((total, stat) => total + stat.totalAmount, 0);
  };

  const getAvailableItems = () => {
    if (!inventoryStats?.stateStats) return 0;
    const availableStates = ['New', 'Repaired'];
    return inventoryStats.stateStats
      .filter(stat => availableStates.includes(stat._id))
      .reduce((total, stat) => total + stat.count, 0);
  };

  return (
    <Layout title="Dashboard">
      <Navigation />
      <Container>
        <StatsGrid>
          {loading ? (
            <>
              <LoadingCard>
                <StatValue>-</StatValue>
                <StatLabel>Loading...</StatLabel>
              </LoadingCard>
              <LoadingCard>
                <StatValue>-</StatValue>
                <StatLabel>Loading...</StatLabel>
              </LoadingCard>
              <LoadingCard>
                <StatValue>-</StatValue>
                <StatLabel>Loading...</StatLabel>
              </LoadingCard>
              <LoadingCard>
                <StatValue>-</StatValue>
                <StatLabel>Loading...</StatLabel>
              </LoadingCard>
            </>
          ) : (
            <>
              <StatCard>
                <StatValue>{getTotalInventoryItems()}</StatValue>
                <StatLabel>Total Items</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{getAvailableItems()}</StatValue>
                <StatLabel>Available Items</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{salesStats?.descriptionStats?.length || 0}</StatValue>
                <StatLabel>Total Sales</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>${getTotalSalesAmount().toFixed(2)}</StatValue>
                <StatLabel>Sales Revenue</StatLabel>
              </StatCard>
            </>
          )}
        </StatsGrid>

        <QuickActions>
          <ActionCard>
            <ActionTitle>Inventory Management</ActionTitle>
            <p>Add, edit, and manage your cellphone inventory with different states and tracking.</p>
            <ActionButton to="/inventory">Manage Inventory</ActionButton>
          </ActionCard>

          <ActionCard>
            <ActionTitle>Sales Management</ActionTitle>
            <p>Record sales transactions with detailed information and payment tracking.</p>
            <SalesActionButton to="/sales">Record Sales</SalesActionButton>
          </ActionCard>
        </QuickActions>

        {inventoryStats && (
          <StatCard>
            <h3>Inventory by State</h3>
            <div style={{ textAlign: 'left' }}>
              {inventoryStats.stateStats.map(stat => (
                <div key={stat._id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  margin: '0.5rem 0' 
                }}>
                  <span>{stat._id}:</span>
                  <strong>{stat.count}</strong>
                </div>
              ))}
            </div>
          </StatCard>
        )}
      </Container>
    </Layout>
  );
};

export default DashboardPage;