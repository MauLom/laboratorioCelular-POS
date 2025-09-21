import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import styled from 'styled-components';
import { InventoryItem } from '../../types';

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
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #2980b9;
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

interface InventoryFormData {
  imei: string;
  state: 'New' | 'Repair' | 'Repaired' | 'Sold' | 'Lost' | 'Clearance';
  branch: string;
  model?: string;
  brand?: string;
  price?: number;
  notes?: string;
}

const schema = yup.object().shape({
  imei: yup.string().required('El IMEI es requerido').min(10, 'El IMEI debe tener al menos 10 caracteres'),
  state: yup.string().required('El estado es requerido'),
  branch: yup.string().required('La sucursal es requerida'),
  model: yup.string().optional(),
  brand: yup.string().optional(),
  price: yup.number().optional().min(0, 'El precio debe ser positivo'),
  notes: yup.string().optional(),
});

interface InventoryFormProps {
  onSubmit: (data: Omit<InventoryItem, '_id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialData?: InventoryItem;
  isEditing?: boolean;
  isLoading?: boolean;
}

const InventoryForm: React.FC<InventoryFormProps> = ({
  onSubmit,
  initialData,
  isEditing = false,
  isLoading = false,
}) => {
  const { register, handleSubmit, formState: { errors } } = useForm<InventoryFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: initialData || {
      imei: '',
      state: 'New',
      branch: '',
      model: '',
      brand: '',
      price: 0,
      notes: '',
    },
  });

  const handleFormSubmit = async (data: InventoryFormData) => {
    await onSubmit(data);
  };

  return (
    <Form onSubmit={handleSubmit(handleFormSubmit)}>
      <FormGroup>
        <Label htmlFor="imei">IMEI *</Label>
        <Input
          id="imei"
          type="text"
          {...register('imei')}
          disabled={isEditing || isLoading}
        />
        {errors.imei && <ErrorMessage>{errors.imei.message}</ErrorMessage>}
      </FormGroup>

      <FormGroup>
        <Label htmlFor="state">Estado *</Label>
        <Select id="state" {...register('state')} disabled={isLoading}>
          <option value="New">Nuevo</option>
          <option value="Repair">En Reparación</option>
          <option value="Repaired">Reparado</option>
          <option value="Sold">Vendido</option>
          <option value="Lost">Perdido</option>
          <option value="Clearance">Liquidación</option>
        </Select>
        {errors.state && <ErrorMessage>{errors.state.message}</ErrorMessage>}
      </FormGroup>

      <FormGroup>
        <Label htmlFor="branch">Sucursal *</Label>
        <Input
          id="branch"
          type="text"
          {...register('branch')}
          disabled={isLoading}
        />
        {errors.branch && <ErrorMessage>{errors.branch.message}</ErrorMessage>}
      </FormGroup>

      <FormGroup>
        <Label htmlFor="model">Modelo</Label>
        <Input
          id="model"
          type="text"
          {...register('model')}
          disabled={isLoading}
        />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="brand">Marca</Label>
        <Input
          id="brand"
          type="text"
          {...register('brand')}
          disabled={isLoading}
        />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="price">Precio</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          min="0"
          {...register('price')}
          disabled={isLoading}
        />
        {errors.price && <ErrorMessage>{errors.price.message}</ErrorMessage>}
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
        {isLoading ? 'Guardando...' : isEditing ? 'Actualizar Artículo' : 'Agregar Artículo'}
      </Button>
    </Form>
  );
};

export default InventoryForm;