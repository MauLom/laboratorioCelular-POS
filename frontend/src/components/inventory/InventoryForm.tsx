import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import styled from 'styled-components';
import { InventoryItem } from '../../types';
import { catalogsApi } from '../../services/api';

interface Brand { _id: string; name: string }
interface CharValue { _id: string; value: string; displayName: string }

const Form = styled.form`
  min-width: 800px;
  background: white;
  padding: 2rem;
  border-radius: 8px;
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
  color?: string;
  storage?: string;
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
  const [brands, setBrands] = useState<Brand[]>([]);
  const [colorValues, setColorValues] = useState<CharValue[]>([]);
  const [storageValues, setStorageValues] = useState<CharValue[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string | undefined>(initialData?.brand);

  useEffect(() => {
    const load = async () => {
      try {
        const b = await catalogsApi.getBrands();
        setBrands(b || []);
      } catch (err) {
        console.error('Failed to load brands', err);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadValues = async () => {
      try {
        // find characteristic IDs by name through getCharacteristics could be implemented on server
        const chars = await catalogsApi.getCharacteristics();
        const colorChar = chars.find((c: any) => c.name.toLowerCase() === 'color');
        const storageChar = chars.find((c: any) => c.name.toLowerCase() === 'almacenamiento' || c.name.toLowerCase() === 'storage');

        if (colorChar) {
          const vals = await catalogsApi.getCharacteristicValues(colorChar._id, selectedBrand);
          setColorValues(vals || []);
        } else {
          setColorValues([]);
        }

        if (storageChar) {
          const vals = await catalogsApi.getCharacteristicValues(storageChar._id, selectedBrand);
          setStorageValues(vals || []);
        } else {
          setStorageValues([]);
        }
      } catch (err) {
        console.error('Failed to load characteristic values', err);
      }
    };
    loadValues();
  }, [selectedBrand]);
  const { register, handleSubmit, formState: { errors } } = useForm<InventoryFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: initialData || {
      imei: '',
      state: 'New',
      branch: '',
      model: '',
      brand: '',
      color: '',
      storage: '',
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
        <Select id="brand" {...register('brand')} disabled={isLoading} onChange={(e) => setSelectedBrand(e.target.value || undefined)}>
          <option value="">Seleccione una marca</option>
          {brands.map(b => (
            <option key={b._id} value={b._id}>{b.name}</option>
          ))}
        </Select>
      </FormGroup>

      <FormGroup>
        <Label htmlFor="color">Color</Label>
        <Select id="color" {...register('color')} disabled={isLoading || colorValues.length === 0}>
          <option value="">Seleccione un color</option>
          {colorValues.map(c => (
            <option key={c._id} value={c.value}>{c.displayName}</option>
          ))}
        </Select>
      </FormGroup>

      <FormGroup>
        <Label htmlFor="storage">Almacenamiento</Label>
        <Select id="storage" {...register('storage')} disabled={isLoading || storageValues.length === 0}>
          <option value="">Seleccione almacenamiento</option>
          {storageValues.map(s => (
            <option key={s._id} value={s.value}>{s.displayName}</option>
          ))}
        </Select>
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