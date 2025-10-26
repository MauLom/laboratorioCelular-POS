import React from 'react';
import styled from 'styled-components';
import { InventoryItem } from '../../types';
import { translateState } from '../../lib/translations';

const Table = styled.table`
  width: 100%;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background-color: #34495e;
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

const StateChip = styled.span<{ state: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  background-color: ${({ state }) => {
    switch (state) {
      case 'New': return '#28a745';
      case 'Repair': return '#ffc107';
      case 'Repaired': return '#17a2b8';
      case 'Sold': return '#6c757d';
      case 'Lost': return '#dc3545';
      case 'Clearance': return '#fd7e14';
      default: return '#6c757d';
    }
  }};
`;

const ActionButton = styled.button<{ variant?: 'edit' | 'delete' }>`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  margin-right: 0.5rem;
  transition: background-color 0.2s;
  
  ${({ variant }) => {
    switch (variant) {
      case 'edit':
        return `
          background-color: #3498db;
          color: white;
          &:hover { background-color: #2980b9; }
        `;
      case 'delete':
        return `
          background-color: #e74c3c;
          color: white;
          &:hover { background-color: #c0392b; }
        `;
      default:
        return `
          background-color: #95a5a6;
          color: white;
          &:hover { background-color: #7f8c8d; }
        `;
    }
  }}
`;

const EmptyState = styled.div`
  padding: 3rem;
  text-align: center;
  color: #6c757d;
  font-size: 1.1rem;
`;

interface InventoryListProps {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (imei: string) => void;
  loading?: boolean;
}

const InventoryList: React.FC<InventoryListProps> = ({
  items,
  onEdit,
  onDelete,
  loading = false,
}) => {
  if (loading) {
    return (
      <Table>
        <tbody>
          <tr>
            <td colSpan={8}>
              <EmptyState>Cargando artículos del inventario...</EmptyState>
            </td>
          </tr>
        </tbody>
      </Table>
    );
  }

  if (items.length === 0) {
    return (
      <Table>
        <tbody>
          <tr>
            <td colSpan={8}>
              <EmptyState>No se encontraron artículos en el inventario</EmptyState>
            </td>
          </tr>
        </tbody>
      </Table>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHeaderCell>IMEI</TableHeaderCell>
          <TableHeaderCell>Estado</TableHeaderCell>
          <TableHeaderCell>Sucursal</TableHeaderCell>
          <TableHeaderCell>Marca</TableHeaderCell>
          <TableHeaderCell>Modelo</TableHeaderCell>
          <TableHeaderCell>Precio</TableHeaderCell>
          <TableHeaderCell>Creado</TableHeaderCell>
          <TableHeaderCell>Acciones</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <tbody>
        {items.map((item) => (
          <TableRow key={item.imei}>
            <TableCell>{item.imei}</TableCell>
            <TableCell>
              <StateChip state={item.state}>{translateState(item.state)}</StateChip>
            </TableCell>
            <TableCell>{item.branch}</TableCell>
            <TableCell>{item.brand || '-'}</TableCell>
            <TableCell>{item.model || '-'}</TableCell>
            <TableCell>
              {item.price ? `$${item.price.toFixed(2)}` : '-'}
            </TableCell>
            <TableCell>
              {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}
            </TableCell>
            <TableCell>
              <ActionButton
                variant="edit"
                onClick={() => onEdit(item)}
              >
                Editar
              </ActionButton>
              <ActionButton
                variant="delete"
                onClick={() => onDelete(item.imei)}
              >
                Eliminar
              </ActionButton>
            </TableCell>
          </TableRow>
        ))}
      </tbody>
    </Table>
  );
};

export default InventoryList;