import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import styled from 'styled-components';
import { Sale, FranchiseLocation, InventoryItem } from '../../types';
import { franchiseLocationsApi, inventoryApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useConfiguration } from '../../hooks/useConfigurations';

const Form = styled.form`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  width: 800px;
  max-width: 800px;
  min-width: 800px;
  height: 750px;
  max-height: 750px;
  min-height: 750px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #2c3e50;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  background-color: white;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const Button = styled.button`
  background-color: #27ae60;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #229954;
  }
  
  &:disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.span`
  color: #e74c3c;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  display: block;
`;

const InfoMessage = styled.div`
  background: #e8f4fd;
  color: #0066cc;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  border: 1px solid #b3d9ff;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

interface SalesFormData {
  description: 'Fair' | 'Payment' | 'Sale' | 'Deposit';
  finance: 'Payjoy' | 'Lespago' | 'Repair' | 'Accessory' | 'Cash' | 'Other';
  concept: string;
  imei?: string;
  paymentType: string;
  reference: string;
  amount: number;
  paymentAmount?: number;
  customerName?: string;
  customerPhone?: string;
  branch?: string;
  notes?: string;
}

const schema = yup.object().shape({
  description: yup.string().required('La descripción es requerida'),
  finance: yup.string().required('El tipo de financiamiento es requerido'),
  concept: yup.string().required('El concepto es requerido'),
  imei: yup.string().optional(),
  paymentType: yup.string().required('El tipo de pago es requerido'),
  reference: yup.string().required('La referencia es requerida'),
  amount: yup.number().required('El monto es requerido').min(0, 'El monto debe ser positivo'),
  paymentAmount: yup.number().optional().min(0, 'El monto de pago debe ser positivo'),
  customerName: yup.string().optional(),
  customerPhone: yup.string().optional(),
  branch: yup.string().optional(),
  notes: yup.string().optional(),
});

interface SalesFormProps {
  onSubmit: (data: Omit<Sale, '_id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialData?: Sale;
  isEditing?: boolean;
  isLoading?: boolean;
}

const SalesForm: React.FC<SalesFormProps> = ({
  onSubmit,
  initialData,
  isEditing = false,
  isLoading = false,
}) => {
  const { user } = useAuth();
  const [franchiseLocations, setFranchiseLocations] = useState<FranchiseLocation[]>([]);
  const [systemGuid, setSystemGuid] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<FranchiseLocation | null>(null);
  
  // Load configurations for descriptions and finance types
  const { getLabels: getDescriptionLabels, loading: descriptionsLoading } = useConfiguration('sales_descriptions');
  const { getLabels: getFinanceLabels, loading: financeLoading } = useConfiguration('finance_types');

  // Determine if user can select from multiple locations
  const canSelectLocation = user?.role === 'Master admin' || 
                           user?.role === 'Supervisor de sucursales' || 
                           user?.role === 'Supervisor de oficina';

  // Fetch system GUID and franchise locations
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Obtener el GUID del sistema local
        const winServiceUrl = process.env.REACT_APP_WIN_SERVICE_URL || 'http://localhost:5005';
        const guidResponse = await fetch(`${winServiceUrl}/api/system/guid`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        let currentGuid = '';
        if (guidResponse.ok) {
          const guidData = await guidResponse.json();
          currentGuid = guidData.guid || guidData.systemGuid || '';
          setSystemGuid(currentGuid);
        }

        // Obtener todas las sucursales
        const locations = await franchiseLocationsApi.getActive();
        setFranchiseLocations(locations);

        // Buscar la sucursal que coincida con el GUID del sistema
        if (currentGuid) {
          const matchingLocation = locations.find(location => location.guid === currentGuid);
          if (matchingLocation) {
            setSelectedLocation(matchingLocation);
          }
        }
      } catch (error) {
        console.error('Failed to initialize form data:', error);
      }
    };

    initializeData();
  }, []);

  // Estado para búsqueda de IMEI
  const [imeiInput, setImeiInput] = useState('');
  const [imeiMatches, setImeiMatches] = useState<InventoryItem[]>([]);
  const [imeiLoading, setImeiLoading] = useState(false);
  const [imeiError, setImeiError] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);

  // Buscar coincidencias de IMEI
  useEffect(() => {
    if (imeiInput.length < 4) {
      setImeiMatches([]);
      setImeiError('');
      setSelectedIndex(-1);
      setSelectedProduct(null);
      return;
    }
    setImeiLoading(true);
    inventoryApi.searchByImei(imeiInput)
      .then(items => {
        setImeiMatches(items);
        setImeiError(items.length === 0 ? 'No se encontraron coincidencias' : '');
        setSelectedIndex(items.length > 0 ? 0 : -1);
        setSelectedProduct(null);
      })
      .catch(() => {
        setImeiMatches([]);
        setImeiError('Error al buscar IMEI');
        setSelectedIndex(-1);
        setSelectedProduct(null);
      })
      .finally(() => setImeiLoading(false));
  }, [imeiInput]);

  // Manejo de teclado para selección
  const handleImeiKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (imeiMatches.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(idx => Math.min(idx + 1, imeiMatches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(idx => Math.max(idx - 1, 0));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      const item = imeiMatches[selectedIndex];
      setImeiInput(item.imei);
      setValue('imei', item.imei); // <-- Actualiza el valor en React Hook Form
      setImeiMatches([]);
      setSelectedIndex(-1);
      setSelectedProduct(item);
    }
  };

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<SalesFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: initialData || {
      description: 'Sale',
      finance: 'Cash',
      concept: '',
      imei: '',
      paymentType: '',
      reference: '',
      amount: 0,
      paymentAmount: 0,
      customerName: '',
      customerPhone: '',
      branch: canSelectLocation ? '' : (user?.franchiseLocation as FranchiseLocation)?._id || '',
      notes: '',
    },
  });

  const handleFormSubmit = async (data: SalesFormData) => {
      if (selectedLocation) {
        data.branch = selectedLocation._id;
      }
      
    await onSubmit(data);
  };

  return (
    <Form onSubmit={handleSubmit(handleFormSubmit)}>
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '1.5rem', fontWeight: 700, fontSize: '2rem' }}>Generar nueva venta</h2>
      <FormRow>
        <FormGroup>
          <Label htmlFor="description">Descripción *</Label>
          <Select id="description" {...register('description')} disabled={isLoading || descriptionsLoading}>
            {descriptionsLoading ? (
              <option value="">Cargando...</option>
            ) : (
              getDescriptionLabels().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            )}
          </Select>
          {errors.description && <ErrorMessage>{errors.description.message}</ErrorMessage>}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="finance">Financiamiento *</Label>
          <Select id="finance" {...register('finance')} disabled={isLoading || financeLoading}>
            {financeLoading ? (
              <option value="">Cargando...</option>
            ) : (
              getFinanceLabels().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            )}
          </Select>
          {errors.finance && <ErrorMessage>{errors.finance.message}</ErrorMessage>}
        </FormGroup>
      </FormRow>

      <FormGroup>
        <Label htmlFor="concept">Concepto *</Label>
        <Input
          id="concept"
          type="text"
          {...register('concept')}
          disabled={isLoading}
        />
        {errors.concept && <ErrorMessage>{errors.concept.message}</ErrorMessage>}
      </FormGroup>

      <FormRow>
        <FormGroup>
          <Label htmlFor="imei">IMEI</Label>
          <Input
            id="imei-input"
            type="text"
            placeholder="Escribe el IMEI..."
            value={imeiInput}
            onChange={e => setImeiInput(e.target.value)}
            disabled={isLoading}
            autoComplete="off"
            onKeyDown={handleImeiKeyDown}
          />
          {imeiLoading && imeiInput.length >= 2 && (
            <span style={{ color: '#888', fontSize: '0.9rem' }}>Buscando...</span>
          )}
          {imeiMatches.length > 0 && imeiInput.length >= 4 && (
            <ul style={{ background: '#f8f9fa', border: '1px solid #ddd', borderRadius: 4, padding: '0.5rem', marginTop: 4, listStyle: 'none' }}>
              {imeiMatches.map((item, idx) => (
                <li key={item._id}
                  style={{
                    cursor: 'pointer',
                    padding: '0.25rem 0',
                    transition: 'background 0.2s',
                    background: selectedIndex === idx ? '#eafaf1' : undefined
                  }}
                  onClick={() => {
                    setImeiInput(item.imei);
                    setValue('imei', item.imei); // <-- Actualiza el valor en React Hook Form
                    setImeiMatches([]);
                    setSelectedIndex(-1);
                    setSelectedProduct(item);
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onMouseLeave={() => setSelectedIndex(-1)}
                >
                  <strong>{item.model || ''} {item.brand ? `- ${item.brand}` : ''}</strong> | IMEI: {item.imei} | Estado: {item.state} {item.price !== undefined ? `| Precio: $${item.price}` : ''}
                </li>
              ))}
            </ul>
          )}
          {imeiError && imeiInput.length >= 2 && (
            <span style={{ color: '#e74c3c', fontSize: '0.9rem' }}>{imeiError}</span>
          )}
          <Input
            id="imei"
            type="text"
            style={{ display: 'none' }}
            {...register('imei')}
          />
        {/* Mostrar el nombre del producto seleccionado debajo del input */}
        {selectedProduct && (
          <div style={{ color: '#229954', fontWeight: 400, fontSize: '0.95rem', fontStyle: 'italic' }}>
            Producto: {selectedProduct.model || ''} {selectedProduct.brand ? `- ${selectedProduct.brand}` : ''}
          </div>
        )}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="paymentType">Tipo de Pago *</Label>
          <Select
            id="paymentType"
            {...register('paymentType')}
            disabled={isLoading}
          >
            <option value="">Selecciona tipo de pago...</option>
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="dolar">Dólar</option>
            <option value="mixto">Mixto</option>
          </Select>
          {errors.paymentType && <ErrorMessage>{errors.paymentType.message}</ErrorMessage>}
        </FormGroup>
      </FormRow>

      <FormRow>
        <FormGroup>
          <Label htmlFor="reference">Referencia *</Label>
          <Input
            id="reference"
            type="text"
            {...register('reference')}
            disabled={isLoading}
          />
          {errors.reference && <ErrorMessage>{errors.reference.message}</ErrorMessage>}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="amount">Monto *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            {...register('amount')}
            disabled={isLoading}
          />
          {errors.amount && <ErrorMessage>{errors.amount.message}</ErrorMessage>}
        </FormGroup>
      </FormRow>

      {/* Pago con - nuevo campo */}
      <FormRow>
        <FormGroup>
          <Label htmlFor="paymentAmount">Pago con</Label>
          <Input
            id="paymentAmount"
            type="number"
            step="0.01"
            min="0"
            placeholder="Monto con el que se realiza el pago"
            {...register('paymentAmount')}
            disabled={isLoading}
          />
          {errors.paymentAmount && <ErrorMessage>{errors.paymentAmount.message}</ErrorMessage>}
        </FormGroup>

        <FormGroup>
          {/* Espacio vacío para mantener la alineación */}
        </FormGroup>
      </FormRow>

      {/* Sucursal seleccionada automáticamente */}
      <FormGroup>
        <Label htmlFor="selectedBranch">Sucursal *</Label>
        <Select
          id="selectedBranch"
          value={selectedLocation?._id || ''}
          disabled={true}
          style={{ 
            backgroundColor: '#f8f9fa',
            color: '#495057',
            cursor: 'not-allowed',
            opacity: 0.9,
            fontWeight: '500'
          }}
        >
          {selectedLocation ? (
            <option value={selectedLocation._id}>
              {selectedLocation.name} ({selectedLocation.code}) - {selectedLocation.type}
            </option>
          ) : (
            <option value="">
              {systemGuid ? `Buscando sucursal para GUID: ${systemGuid.substring(0, 8)}...` : 'Obteniendo información del sistema...'}
            </option>
          )}
        </Select>
        
        {selectedLocation && (
          <InfoMessage>
            ✓ Sucursal identificada automáticamente mediante GUID del sistema: {systemGuid ? systemGuid.substring(0, 8) + '...' : 'N/A'}
          </InfoMessage>
        )}
        
        {!selectedLocation && systemGuid && (
          <ErrorMessage>
            ⚠ No se encontró una sucursal registrada con el GUID de este sistema. Contacte al administrador para registrar esta sucursal.
          </ErrorMessage>
        )}
        
        {!systemGuid && (
          <ErrorMessage>
            ⚠ No se pudo obtener el GUID del sistema. Verifique que el servicio Windows esté ejecutándose.
          </ErrorMessage>
        )}
      </FormGroup>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          alignItems: 'center', 
          marginTop: 'auto',
          paddingTop: '1rem',
          borderTop: '1px solid #ecf0f1'
        }}>
          <Button type="submit" disabled={isLoading || !selectedLocation}>
            {isLoading ? 'Guardando...' : isEditing ? 'Actualizar Venta' : 'Registrar Venta'}
          </Button>
        </div>
      </div>
    </Form>
  );
};

export default SalesForm;