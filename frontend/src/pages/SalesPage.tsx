import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import Layout from '../components/common/Layout';
import Navigation from '../components/common/Navigation';
import SalesForm from '../components/sales/SalesForm';
import { salesApi } from '../services/api';
import { Sale, PaginatedResponse } from '../types';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
`;

const Title = styled.h2`
  margin: 0;
  color: #2c3e50;
`;

const Button = styled.button`
  background-color: #27ae60;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #229954;
  }
`;

const Table = styled.table`
  width: 100%;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background-color: #27ae60;
  color: white;
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: #f8f9fa;
  }
  
  &:hover {
    background-color: #e9ecef;
  }
`;

const TableHeaderCell = styled.th`
  padding: 1rem;
  text-align: left;
  font-weight: 600;
`;

const TableCell = styled.td`
  padding: 1rem;
  border-top: 1px solid #dee2e6;
`;

const Modal = styled.div<{ isOpen: boolean }>`
  display: ${({ isOpen }) => isOpen ? 'flex' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
  
  &:hover {
    color: #343a40;
  }
`;

const EmptyState = styled.div`
  padding: 3rem;
  text-align: center;
  color: #6c757d;
  font-size: 1.1rem;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
`;

const SalesPage: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [filters, setFilters] = useState({
    description: '',
    finance: '',
  });

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const response: PaginatedResponse<Sale> = await salesApi.getAll(filters);
      setSales(response.sales || []);
    } catch (error) {
      console.error('Failed to fetch sales:', error);
      alert('Failed to fetch sales');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handleAddSale = async (saleData: Omit<Sale, '_id' | 'createdAt' | 'updatedAt'>) => {
    setFormLoading(true);
    try {
      await salesApi.create(saleData);
      setShowForm(false);
      fetchSales();
      alert('Sale recorded successfully!');
    } catch (error) {
      console.error('Failed to record sale:', error);
      alert('Failed to record sale');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteSale = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this sale?')) return;
    
    try {
      await salesApi.delete(id);
      fetchSales();
      alert('Sale deleted successfully!');
    } catch (error) {
      console.error('Failed to delete sale:', error);
      alert('Failed to delete sale');
    }
  };

  const closeForm = () => {
    setShowForm(false);
  };

  if (loading) {
    return (
      <Layout title="Sales Management">
        <Navigation />
        <Container>
          <Header>
            <Title>Sales Records</Title>
          </Header>
          <EmptyState>Loading sales...</EmptyState>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout title="Sales Management">
      <Navigation />
      <Container>
        <Header>
          <Title>Sales Records</Title>
          <Button onClick={() => setShowForm(true)}>Record New Sale</Button>
        </Header>

        <FilterContainer>
          <Select
            value={filters.description}
            onChange={(e) => setFilters({ ...filters, description: e.target.value })}
          >
            <option value="">All Descriptions</option>
            <option value="Fair">Fair</option>
            <option value="Payment">Payment</option>
            <option value="Sale">Sale</option>
            <option value="Deposit">Deposit</option>
          </Select>
          
          <Select
            value={filters.finance}
            onChange={(e) => setFilters({ ...filters, finance: e.target.value })}
          >
            <option value="">All Finance Types</option>
            <option value="Payjoy">Payjoy</option>
            <option value="Lespago">Lespago</option>
            <option value="Repair">Repair</option>
            <option value="Accessory">Accessory</option>
            <option value="Cash">Cash</option>
            <option value="Other">Other</option>
          </Select>
        </FilterContainer>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Description</TableHeaderCell>
              <TableHeaderCell>Finance</TableHeaderCell>
              <TableHeaderCell>Concept</TableHeaderCell>
              <TableHeaderCell>IMEI</TableHeaderCell>
              <TableHeaderCell>Amount</TableHeaderCell>
              <TableHeaderCell>Customer</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <tbody>
            {sales.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState>No sales records found</EmptyState>
                </td>
              </tr>
            ) : (
              sales.map((sale) => (
                <TableRow key={sale._id}>
                  <TableCell>
                    {sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>{sale.description}</TableCell>
                  <TableCell>{sale.finance}</TableCell>
                  <TableCell>{sale.concept}</TableCell>
                  <TableCell>{sale.imei || '-'}</TableCell>
                  <TableCell>${sale.amount.toFixed(2)}</TableCell>
                  <TableCell>{sale.customerName || '-'}</TableCell>
                  <TableCell>
                    <Button
                      onClick={() => sale._id && handleDeleteSale(sale._id)}
                      style={{ 
                        backgroundColor: '#e74c3c', 
                        fontSize: '0.875rem',
                        padding: '0.5rem 1rem'
                      }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </tbody>
        </Table>

        <Modal isOpen={showForm}>
          <ModalContent>
            <CloseButton onClick={closeForm}>&times;</CloseButton>
            <SalesForm
              onSubmit={handleAddSale}
              isLoading={formLoading}
            />
          </ModalContent>
        </Modal>
      </Container>
    </Layout>
  );
};

export default SalesPage;