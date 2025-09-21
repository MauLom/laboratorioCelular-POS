import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import styled from 'styled-components';
import { Sale } from '../../types';

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
  description: yup.string().required('Description is required'),
  finance: yup.string().required('Finance type is required'),
  concept: yup.string().required('Concept is required'),
  imei: yup.string().optional(),
  paymentType: yup.string().required('Payment type is required'),
  reference: yup.string().required('Reference is required'),
  amount: yup.number().required('Amount is required').min(0, 'Amount must be positive'),
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
      branch: '',
      notes: '',
    },
  });

  const handleFormSubmit = async (data: SalesFormData) => {
    await onSubmit(data);
  };

  return (
    <Form onSubmit={handleSubmit(handleFormSubmit)}>
      <FormRow>
        <FormGroup>
          <Label htmlFor="description">Description *</Label>
          <Select id="description" {...register('description')} disabled={isLoading}>
            <option value="Fair">Fair</option>
            <option value="Payment">Payment</option>
            <option value="Sale">Sale</option>
            <option value="Deposit">Deposit</option>
          </Select>
          {errors.description && <ErrorMessage>{errors.description.message}</ErrorMessage>}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="finance">Finance *</Label>
          <Select id="finance" {...register('finance')} disabled={isLoading}>
            <option value="Payjoy">Payjoy</option>
            <option value="Lespago">Lespago</option>
            <option value="Repair">Repair</option>
            <option value="Accessory">Accessory</option>
            <option value="Cash">Cash</option>
            <option value="Other">Other</option>
          </Select>
          {errors.finance && <ErrorMessage>{errors.finance.message}</ErrorMessage>}
        </FormGroup>
      </FormRow>

      <FormGroup>
        <Label htmlFor="concept">Concept *</Label>
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
          <Label htmlFor="imei">IMEI (if applicable)</Label>
          <Input
            id="imei"
            type="text"
            {...register('imei')}
            disabled={isLoading}
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="paymentType">Payment Type *</Label>
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
          <Label htmlFor="reference">Reference *</Label>
          <Input
            id="reference"
            type="text"
            {...register('reference')}
            disabled={isLoading}
          />
          {errors.reference && <ErrorMessage>{errors.reference.message}</ErrorMessage>}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="amount">Amount *</Label>
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
          <Label htmlFor="customerName">Customer Name</Label>
          <Input
            id="customerName"
            type="text"
            {...register('customerName')}
            disabled={isLoading}
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="customerPhone">Customer Phone</Label>
          <Input
            id="customerPhone"
            type="tel"
            {...register('customerPhone')}
            disabled={isLoading}
          />
        </FormGroup>
      </FormRow>

      <FormGroup>
        <Label htmlFor="branch">Branch</Label>
        <Input
          id="branch"
          type="text"
          {...register('branch')}
          disabled={isLoading}
        />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="notes">Notes</Label>
        <TextArea
          id="notes"
          {...register('notes')}
          disabled={isLoading}
        />
      </FormGroup>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : isEditing ? 'Update Sale' : 'Record Sale'}
      </Button>
    </Form>
  );
};

export default SalesForm;