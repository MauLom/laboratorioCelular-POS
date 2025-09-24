import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import styled from 'styled-components';
import { Sale, FranchiseLocation } from '../../types';
import { franchiseLocationsApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useConfiguration } from '../../hooks/useConfigurations';

const Form = styled.form`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  max-width: 600px;
  margin: 0 auto;
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
  
  // Load configurations for descriptions and finance types
  const { getLabels: getDescriptionLabels, loading: descriptionsLoading } = useConfiguration('sales_descriptions');
  const { getLabels: getFinanceLabels, loading: financeLoading } = useConfiguration('finance_types');

  // Determine if user can select from multiple locations
  const canSelectLocation = user?.role === 'Master admin' || 
                           user?.role === 'Supervisor de sucursales' || 
                           user?.role === 'Supervisor de oficina';

  // Fetch franchise locations if user can select
  useEffect(() => {
    const fetchLocations = async () => {
      if (canSelectLocation) {
        try {
          const locations = await franchiseLocationsApi.getActive();
          setFranchiseLocations(locations);
        } catch (error) {
          console.error('Failed to fetch franchise locations:', error);
        }
      }
    };

    fetchLocations();
  }, [canSelectLocation]);

  const { register, handleSubmit, formState: { errors } } = useForm<SalesFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: initialData || {
      description: 'Sale',
      finance: 'Cash',
      concept: '',
      imei: '',
      paymentType: '',
      reference: '',
      amount: 0,
      customerName: '',
      customerPhone: '',
      branch: canSelectLocation ? '' : (user?.franchiseLocation as FranchiseLocation)?._id || '',
      notes: '',
    },
  });

  const handleFormSubmit = async (data: SalesFormData) => {
    // If user cannot select location, use their assigned franchise location ID
    if (!canSelectLocation && user?.franchiseLocation) {
      data.branch = (user.franchiseLocation as FranchiseLocation)._id || '';
    }
    await onSubmit(data);
  };

  return (
    <Form onSubmit={handleSubmit(handleFormSubmit)}>
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
          <Label htmlFor="imei">IMEI (si aplica)</Label>
          <Input
            id="imei"
            type="text"
            {...register('imei')}
            disabled={isLoading}
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="paymentType">Tipo de Pago *</Label>
          <Input
            id="paymentType"
            type="text"
            {...register('paymentType')}
            disabled={isLoading}
          />
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

      <FormRow>
        <FormGroup>
          <Label htmlFor="customerName">Nombre del Cliente</Label>
          <Input
            id="customerName"
            type="text"
            {...register('customerName')}
            disabled={isLoading}
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="customerPhone">Teléfono del Cliente</Label>
          <Input
            id="customerPhone"
            type="tel"
            {...register('customerPhone')}
            disabled={isLoading}
          />
        </FormGroup>
      </FormRow>

      <FormGroup>
        <Label htmlFor="branch">Sucursal</Label>
        {canSelectLocation ? (
          <Select
            id="branch"
            {...register('branch')}
            disabled={isLoading}
          >
            <option value="">Seleccionar sucursal...</option>
            {franchiseLocations.map((location) => (
              <option key={location._id} value={location._id}>
                {location.name} ({location.code})
              </option>
            ))}
          </Select>
        ) : (
          <Input
            id="branch"
            type="text"
            value={user?.franchiseLocation ? 
              `${(user.franchiseLocation as FranchiseLocation).name} (${(user.franchiseLocation as FranchiseLocation).code})` : 
              'No asignada'
            }
            disabled={true}
            style={{ background: '#f8f9fa', color: '#6c757d' }}
          />
        )}
      </FormGroup>

      <FormGroup>
        <Label htmlFor="notes">Notas</Label>
        <TextArea
          id="notes"
          {...register('notes')}
          disabled={isLoading}
        />
      </FormGroup>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Guardando...' : isEditing ? 'Actualizar Venta' : 'Registrar Venta'}
      </Button>
    </Form>
  );
};

export default SalesForm;