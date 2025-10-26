import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import styled from 'styled-components';
import { Sale, FranchiseLocation, InventoryItem, PaymentMethod } from '../../types';
import { franchiseLocationsApi, inventoryApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useConfiguration } from '../../hooks/useConfigurations';
import SalesArticles, { SalesArticle } from './SalesArticles';

const SalesContainer = styled.div`
  width: 1000px;
  max-width: 95vw;
  min-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow-y: auto;
  padding: 1rem 0;
`;

const Form = styled.form`
  background: white;
  padding: 2rem;
  border-radius: 8px;f
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

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 600px;
  max-width: 95vw;
`;

const ModalTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: #2c3e50;
  text-align: center;
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
`;

const CancelButton = styled(Button)`
  background-color: #95a5a6;
  
  &:hover {
    background-color: #7f8c8d;
  }
`;

interface SalesFormData {
  description: string;
  finance: 'Payjoy' | 'Lespago' | 'Repair' | 'Accessory' | 'Cash' | 'Other';
  concept: 'Parciality' | 'Hitch' | 'Other';
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
  finance: yup.string().required('La Financiera es requerida'),
  concept: yup.string().required('El concepto es requerido'),
  imei: yup.string().optional(),
  paymentType: yup.string().optional(), // Movido al modal, ya no es requerido aquí
  reference: yup.string().default('N/A'), // Valor por defecto válido
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
  articles: SalesArticle[];
  onAddArticle: (article: SalesArticle) => void;
  onDeleteArticle: (id: string) => void;
  resetLocationLock?: boolean; // Nueva prop para resetear el bloqueo
}

const SalesForm: React.FC<SalesFormProps> = ({
  onSubmit,
  initialData,
  isEditing = false,
  isLoading = false,
  articles,
  onAddArticle,
  onDeleteArticle,
  resetLocationLock = false,
}) => {
  const { user } = useAuth();
  const [franchiseLocations, setFranchiseLocations] = useState<FranchiseLocation[]>([]);
  const [systemGuid, setSystemGuid] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<FranchiseLocation | null>(null);
  const [locationLocked, setLocationLocked] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<string>('');
  
  // Estados para múltiples métodos de pago
  const [paymentMethods, setPaymentMethods] = useState<Array<{
    id: string;
    type: string;
    amount: number;
    formattedAmount: string;
  }>>([]);

  // Inicializar con un método de pago vacío cuando se abre el modal
  useEffect(() => {
    if (showPaymentModal && paymentMethods.length === 0) {
      addPaymentMethod();
    }
  }, [showPaymentModal]);

  // Load configurations for concepts and finance types
  const { getLabels: getConceptsLabels, loading: conceptsLoading } = useConfiguration('concepts_concepts');
  const { getLabels: getFinanceLabels, loading: financeLoading } = useConfiguration('finance_types');

  // Determine if user can select from multiple locations
  const canSelectLocation = user?.role === 'Master admin' ||
    user?.role === 'Supervisor de sucursales' ||
    user?.role === 'Supervisor de oficina';

  // Fetch system GUID and franchise locations
  useEffect(() => {
    const initializeData = async () => {
      try {
        let currentGuid = '';
        
        // Try to get system GUID (optional service)
        try {
          const winServiceUrl = process.env.REACT_APP_WIN_SERVICE_URL || 'http://localhost:5005';
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
          
          const guidResponse = await fetch(`${winServiceUrl}/api/system/guid`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (guidResponse.ok) {
            const guidData = await guidResponse.json();
            currentGuid = guidData.guid || guidData.systemGuid || '';
            setSystemGuid(currentGuid);
            console.log('System GUID loaded:', currentGuid);
          } else {
            console.warn('System GUID service responded with error:', guidResponse.status);
          }
        } catch (guidError: any) {
          if (guidError.name === 'AbortError') {
            console.debug('System GUID request timeout (2s) - service not available');
          } else if (guidError.message.includes('Failed to fetch') || guidError.code === 'ECONNREFUSED') {
            console.debug('System GUID service not available (connection refused)');
          } else {
            console.debug('Error fetching system GUID:', guidError.message);
          }
          // Continue without GUID - this is optional functionality
        }

        // Always try to get franchise locations (this is required)
        const locations = await franchiseLocationsApi.getActive();
        setFranchiseLocations(locations);

        // If we got a GUID, try to find matching location
        if (currentGuid) {
          const matchingLocation = locations.find(location => location.guid === currentGuid);
          if (matchingLocation) {
            setSelectedLocation(matchingLocation);
            console.log('Auto-selected location based on GUID:', matchingLocation.name);
          }
        }

        // If no GUID or no matching location, and user can only access one location, auto-select it
        if (!currentGuid || !locations.find(location => location.guid === currentGuid)) {
          if (!canSelectLocation && locations.length === 1) {
            setSelectedLocation(locations[0]);
            console.log('Auto-selected single available location:', locations[0].name);
          }
        }

      } catch (error) {
        console.error('Failed to initialize form data:', error);
        // Even if initialization fails, try to load locations as fallback
        try {
          const locations = await franchiseLocationsApi.getActive();
          setFranchiseLocations(locations);
          if (locations.length === 1 && !canSelectLocation) {
            setSelectedLocation(locations[0]);
          }
        } catch (fallbackError) {
          console.error('Failed to load franchise locations:', fallbackError);
        }
      }
    };

    initializeData();
  }, [canSelectLocation]);

  // Resetear el bloqueo de ubicación cuando se indique desde el padre
  useEffect(() => {
    if (resetLocationLock) {
      setLocationLocked(false);
    }
  }, [resetLocationLock]);

  // Estado para búsqueda de IMEI
  const [imeiInput, setImeiInput] = useState('');
  const [imeiMatches, setImeiMatches] = useState<InventoryItem[]>([]);
  const [imeiLoading, setImeiLoading] = useState(false);
  const [imeiError, setImeiError] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);

  // Estados para formateo de montos
  const [formattedAmount, setFormattedAmount] = useState('');
  const [formattedPaymentAmount, setFormattedPaymentAmount] = useState('');

  // Funciones de utilidad para formateo de monedas
  const formatCurrency = (value: number | string): string => {
    if (!value && value !== 0) return '';
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '';
    
    return numValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const parseCurrency = (formattedValue: string): number => {
    if (!formattedValue) return 0;
    
    // Remover comas y espacios, mantener solo números y punto decimal
    const cleaned = formattedValue.replace(/[,\s]/g, '');
    const parsed = parseFloat(cleaned);
    
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Permitir solo números y punto decimal durante la escritura
    const sanitized = inputValue.replace(/[^\d.]/g, '');
    
    // Validar formato decimal (máximo 2 decimales)
    const decimalParts = sanitized.split('.');
    if (decimalParts.length > 2) return; // Más de un punto decimal
    if (decimalParts[1] && decimalParts[1].length > 2) return; // Más de 2 decimales
    
    // Durante la escritura, mostrar el valor sin formato
    setFormattedAmount(sanitized);
    
    // Actualizar el valor numérico para react-hook-form
    const numValue = parseFloat(sanitized) || 0;
    setValue('amount', numValue);
  };

  const handleAmountBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numValue = parseFloat(inputValue) || 0;
    
    // Aplicar formato al salir del campo
    const formatted = formatCurrency(numValue);
    setFormattedAmount(formatted);
    setValue('amount', numValue);
  };

  const handleAmountFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Al enfocar el campo, mostrar el valor sin formato para facilitar la edición
    const currentValue = e.target.value;
    if (currentValue) {
      const numValue = parseCurrency(currentValue);
      setFormattedAmount(numValue > 0 ? numValue.toString() : '');
    }
  };

  const handlePaymentAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Permitir solo números y punto decimal durante la escritura
    const sanitized = inputValue.replace(/[^\d.]/g, '');
    
    // Validar formato decimal (máximo 2 decimales)
    const decimalParts = sanitized.split('.');
    if (decimalParts.length > 2) return; // Más de un punto decimal
    if (decimalParts[1] && decimalParts[1].length > 2) return; // Más de 2 decimales
    
    // Durante la escritura, mostrar el valor sin formato
    setFormattedPaymentAmount(sanitized);
    
    // Actualizar el valor numérico
    const numValue = parseFloat(sanitized) || 0;
    setPaymentAmount(numValue);
  };

  const handlePaymentAmountBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numValue = parseFloat(inputValue) || 0;
    
    // Aplicar formato al salir del campo
    const formatted = formatCurrency(numValue);
    setFormattedPaymentAmount(formatted);
    setPaymentAmount(numValue);
  };

  const handlePaymentAmountFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Al enfocar el campo, mostrar el valor sin formato para facilitar la edición
    const currentValue = e.target.value;
    if (currentValue) {
      const numValue = parseCurrency(currentValue);
      setFormattedPaymentAmount(numValue > 0 ? numValue.toString() : '');
    }
  };

  // Funciones para múltiples métodos de pago
  const addPaymentMethod = () => {
    const newPaymentMethod = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type: '',
      amount: 0,
      formattedAmount: ''
    };
    setPaymentMethods(prev => [...prev, newPaymentMethod]);
  };

  const removePaymentMethod = (id: string) => {
    setPaymentMethods(prev => {
      const updated = prev.filter(pm => pm.id !== id);
      // Recalcular total
      const total = updated.reduce((sum, pm) => sum + pm.amount, 0);
      setPaymentAmount(total);
      return updated;
    });
  };

  const updatePaymentMethod = (id: string, field: string, value: any) => {
    setPaymentMethods(prev => {
      const updated = prev.map(pm => {
        if (pm.id === id) {
          return { ...pm, [field]: value };
        }
        return pm;
      });
      
      // Recalcular total
      const total = updated.reduce((sum, pm) => sum + pm.amount, 0);
      setPaymentAmount(total);
      
      return updated;
    });
  };

  const handlePaymentMethodAmountChange = (id: string, inputValue: string) => {
    // Permitir solo números y punto decimal durante la escritura
    const sanitized = inputValue.replace(/[^\d.]/g, '');
    
    // Validar formato decimal (máximo 2 decimales)
    const decimalParts = sanitized.split('.');
    if (decimalParts.length > 2) return;
    if (decimalParts[1] && decimalParts[1].length > 2) return;
    
    // Actualizar el valor formateado
    updatePaymentMethod(id, 'formattedAmount', sanitized);
    
    // Actualizar el valor numérico
    const numValue = parseFloat(sanitized) || 0;
    updatePaymentMethod(id, 'amount', numValue);
  };

  const handlePaymentMethodAmountBlur = (id: string, inputValue: string) => {
    const numValue = parseFloat(inputValue) || 0;
    const formatted = formatCurrency(numValue);
    updatePaymentMethod(id, 'formattedAmount', formatted);
    updatePaymentMethod(id, 'amount', numValue);
  };

  const handlePaymentMethodAmountFocus = (id: string, currentValue: string) => {
    if (currentValue) {
      const numValue = parseCurrency(currentValue);
      updatePaymentMethod(id, 'formattedAmount', numValue > 0 ? numValue.toString() : '');
    }
  };



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
      
      // Establecer automáticamente el monto del producto
      if (item.price && item.price > 0) {
        setValue('amount', item.price);
        setFormattedAmount(formatCurrency(item.price));
      }
      
      setImeiMatches([]);
      setSelectedIndex(-1);
      setSelectedProduct(item);
    }
  };

  const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm<SalesFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: initialData || {
      description: '',
      finance: 'Cash',
      concept: 'Parciality',
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

  const handleAddArticle = (data: SalesFormData) => {
    if (selectedLocation) {
      data.branch = selectedLocation._id;
    }

    // Crear el artículo con un ID único
    const article: SalesArticle = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      description: data.description,
      concept: data.concept,
      finance: data.finance,
      imei: data.imei,
      paymentType: '', // Se capturará en el modal de pago
      reference: data.reference,
      amount: data.amount,
      quantity: 1, // Por defecto cantidad 1
    };

    onAddArticle(article);

    // Bloquear la sucursal después del primer artículo para Master Admin
    if (canSelectLocation && selectedLocation) {
      setLocationLocked(true);
    }

      // Resetear el formulario pero mantener algunos valores
    reset({
      description: '',
      finance: data.finance, // Mantener la financiera seleccionada
      concept: data.concept, // Mantener el concepto seleccionado
      imei: '',
      paymentType: '', // Se reseteará ya que se captura en el modal
      reference: '',
      amount: 0,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      branch: data.branch,
      notes: data.notes,
    });    // Resetear también los estados del IMEI y montos formateados
    setImeiInput('');
    setImeiMatches([]);
    setSelectedProduct(null);
    setImeiError('');
    setFormattedAmount('');
  };

  const handleFinalSubmit = async () => {
    if (articles.length === 0) {
      alert('Debe agregar al menos un artículo a la venta');
      return;
    }

    // Mostrar modal para capturar el pago
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async () => {
    if (articles.length === 0) {
      alert('No hay artículos para procesar la venta');
      return;
    }

    // Convertir SalesArticle a SaleArticle (del tipo Sale)
    const saleArticles = articles.map(article => ({
      id: article.id,
      description: article.description,
      concept: article.concept,
      finance: article.finance,
      imei: article.imei || '',
      reference: article.reference || '',
      amount: article.amount,
      quantity: article.quantity
    }));

    // Preparar métodos de pago
    const finalPaymentMethods: PaymentMethod[] = paymentMethods
      .filter(pm => pm.type && pm.amount > 0)
      .map(pm => ({
        id: pm.id,
        type: pm.type as 'efectivo' | 'tarjeta' | 'dolar' | 'transferencia' | 'cheque',
        amount: pm.amount,
        reference: undefined,
        notes: undefined
      }));

    // Construir notas con información detallada del pago
    let paymentNotes = `Venta con ${articles.length} artículo(s). Artículos: ${articles.map(a => a.description).join(', ')}`;
    
    if (finalPaymentMethods.length > 1) {
      const paymentDetails = finalPaymentMethods.map(pm => `${pm.type}: $${pm.amount.toFixed(2)}`);
      paymentNotes += ` | Pagos múltiples: ${paymentDetails.join(', ')}`;
    }

    // Crear la venta final con todos los artículos
    const saleData = {
      description: 'Sale' as const, // Usar valor válido del enum del backend
      finance: (articles[0]?.finance || 'Cash') as 'Payjoy' | 'Lespago' | 'Repair' | 'Accessory' | 'Cash' | 'Other',
      concept: (articles[0]?.concept || 'Other') as 'Parciality' | 'Hitch' | 'Other',
      paymentType: finalPaymentMethods.length > 1 ? 'multiple' : (finalPaymentMethods[0]?.type || 'multiple'),
      reference: articles.map(a => a.reference).filter(r => r && r.trim()).join(', ') || 'N/A',
      amount: articles.reduce((sum, article) => sum + (article.amount * article.quantity), 0),
      paymentAmount: paymentAmount,
      paymentMethods: finalPaymentMethods, // Incluir métodos de pago
      branch: selectedLocation?._id || '',
      notes: paymentNotes,
      imei: articles.find(a => a.imei)?.imei || undefined, // Primer IMEI encontrado
      articles: saleArticles, // Incluir todos los artículos
    };

    setShowPaymentModal(false);
    setFormattedPaymentAmount('');
    setPaymentAmount(0);
    setPaymentType('');
    setPaymentMethods([]);
    await onSubmit(saleData);
  };

  return (
    <SalesContainer>
      <Form onSubmit={handleSubmit(handleAddArticle)}>
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '1.5rem', fontWeight: 700, fontSize: '2rem' }}>Generar nueva venta</h2>
        <FormRow>
          <FormGroup>
            <Label htmlFor="description">Descripción *</Label>
            <Input 
              id="description" 
              type="text" 
              {...register('description')}
              defaultValue={initialData?.description || ''} 
            />
            {errors.description && <ErrorMessage>{errors.description.message}</ErrorMessage>}
          </FormGroup>
          <FormGroup>
            <Label htmlFor="finance">Financiera *</Label>
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
          <Select id="concept" {...register('concept')} disabled={isLoading || conceptsLoading}>
            {conceptsLoading ? (
              <option value="">Cargando...</option>
            ) : (
              getConceptsLabels().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            )}
          </Select>
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
                      
                      // Establecer automáticamente el monto del producto
                      if (item.price && item.price > 0) {
                        setValue('amount', item.price);
                        setFormattedAmount(formatCurrency(item.price));
                      }
                      
                      setImeiMatches([]);
                      setSelectedIndex(-1);
                      setSelectedProduct(item);
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onMouseLeave={() => setSelectedIndex(-1)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{item.model || ''} {item.brand ? `- ${item.brand}` : ''}</strong>
                        <br />
                        <small style={{ color: '#666' }}>IMEI: {item.imei} | Estado: {item.state}</small>
                      </div>
                      {item.price !== undefined && item.price > 0 && (
                        <div style={{ color: '#2980b9', fontWeight: 'bold' }}>
                          ${item.price.toFixed(2)}
                        </div>
                      )}
                    </div>
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
                <div>Producto: {selectedProduct.model || ''} {selectedProduct.brand ? `- ${selectedProduct.brand}` : ''}</div>
              </div>
            )}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="amount">Monto *</Label>
            <Input
              id="amount"
              type="text"
              placeholder="1000.00"
              value={formattedAmount}
              onChange={handleAmountChange}
              onFocus={handleAmountFocus}
              onBlur={handleAmountBlur}
              disabled={isLoading}
              style={{ textAlign: 'right' }}
            />
            {errors.amount && <ErrorMessage>{errors.amount.message}</ErrorMessage>}
            {/* Campo oculto para react-hook-form */}
            <input
              type="hidden"
              {...register('amount')}
            />
          </FormGroup>
        </FormRow>

        <FormGroup>
          <Label htmlFor="reference">Referencia</Label>
          <Input
            id="reference"
            type="text"
            {...register('reference')}
            disabled={isLoading}
          />
          {errors.reference && <ErrorMessage>{errors.reference.message}</ErrorMessage>}
        </FormGroup>



        {/* Sucursal - Automática o Manual para Master Admin */}
        <FormGroup>
          <Label htmlFor="selectedBranch">Sucursal *</Label>
          
          {canSelectLocation ? (
            // Master Admin puede seleccionar manualmente
            <Select
              id="selectedBranch"
              value={selectedLocation?._id || ''}
              onChange={(e) => {
                const locationId = e.target.value;
                const location = franchiseLocations.find(loc => loc._id === locationId);
                setSelectedLocation(location || null);
              }}
              disabled={isLoading || locationLocked}
              style={locationLocked ? {
                backgroundColor: '#f8f9fa',
                color: '#495057',
                cursor: 'not-allowed',
                opacity: 0.9,
                fontWeight: '500'
              } : undefined}
            >
              <option value="">Selecciona una sucursal...</option>
              {franchiseLocations.map((location) => (
                <option key={location._id} value={location._id}>
                  {location.name} ({location.code}) - {location.type}
                </option>
              ))}
            </Select>
          ) : (
            // Usuarios normales - automático
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
          )}

        </FormGroup>

        {/* Botón Agregar Artículo debajo de Sucursal */}
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="submit" disabled={isLoading || !selectedLocation}>
            {isLoading 
              ? 'Guardando...' 
              : !selectedLocation && canSelectLocation 
                ? 'Selecciona una sucursal para continuar'
                : !selectedLocation 
                  ? 'Esperando identificación de sucursal...'
                  : 'Agregar Artículo'
            }
          </Button>
        </div>

          {/* Resumen de artículos agregados */}
          {articles.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <SalesArticles 
                articles={articles}
                onDeleteArticle={onDeleteArticle}
              />
            </div>
          )}

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 'auto',
            paddingTop: '1rem',
            borderTop: '1px solid #ecf0f1'
          }}>
            <Button 
              type="button" 
              onClick={handleFinalSubmit}
              disabled={isLoading || articles.length === 0}
              style={{ backgroundColor: '#e74c3c' }}
            >
              {isLoading ? 'Procesando...' : `Finalizar Venta (${articles.length} artículos)`}
            </Button>
          </div>
        </div>
      </Form>

      {/* Modal de Pago */}
      {showPaymentModal && (
        <Modal onClick={() => {
          setShowPaymentModal(false);
          setFormattedPaymentAmount('');
          setPaymentAmount(0);
          setPaymentType('');
          setPaymentMethods([]);
        }}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>💰 Finalizar Venta</ModalTitle>
            
            <div style={{ marginBottom: '1rem' }}>
              <strong>Total a cobrar: ${articles.reduce((sum, article) => sum + (article.amount * article.quantity), 0).toFixed(2)}</strong>
            </div>
            
            {/* Métodos de Pago */}
            <div style={{ 
              background: '#f8f9fa', 
              padding: '1rem', 
              borderRadius: '8px', 
              border: '1px solid #dee2e6',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, color: '#495057', fontSize: '1rem', fontWeight: '600' }}>
                  Métodos de Pago
                </h4>
                <button
                  type="button"
                  onClick={addPaymentMethod}
                  style={{
                    background: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  + Agregar método
                </button>
              </div>

              {paymentMethods.map((pm, index) => (
                <div key={pm.id} style={{ 
                  background: 'white', 
                  padding: '0.8rem', 
                  borderRadius: '6px', 
                  border: '1px solid #ddd',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#495057' }}>
                      Método {index + 1}
                    </span>
                    {paymentMethods.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePaymentMethod(pm.id)}
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          padding: '0.2rem 0.4rem',
                          borderRadius: '3px',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                          marginLeft: 'auto'
                        }}
                      >
                        X
                      </button>
                    )}
                  </div>
                  
                  <FormRow style={{ gap: '0.5rem' }}>
                    <FormGroup style={{ marginBottom: '0.3rem' }}>
                      <Label style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>Tipo</Label>
                      <Select
                        value={pm.type}
                        onChange={(e) => updatePaymentMethod(pm.id, 'type', e.target.value)}
                        style={{ fontSize: '0.9rem', padding: '0.4rem' }}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="efectivo">Efectivo</option>
                        <option value="tarjeta">Tarjeta</option>
                        <option value="dolar">Dólar</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="cheque">Cheque</option>
                      </Select>
                    </FormGroup>
                    
                    <FormGroup style={{ marginBottom: '0.3rem' }}>
                      <Label style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>Monto</Label>
                      <Input
                        type="text"
                        placeholder="0.00"
                        value={pm.formattedAmount}
                        onChange={(e) => handlePaymentMethodAmountChange(pm.id, e.target.value)}
                        onFocus={() => handlePaymentMethodAmountFocus(pm.id, pm.formattedAmount)}
                        onBlur={(e) => handlePaymentMethodAmountBlur(pm.id, e.target.value)}
                        style={{ textAlign: 'right', fontSize: '0.9rem', padding: '0.4rem' }}
                      />
                    </FormGroup>
                  </FormRow>
                </div>
              ))}

              <div style={{ 
                background: '#e3f2fd', 
                padding: '0.8rem', 
                borderRadius: '6px',
                marginTop: '0.8rem',
                textAlign: 'center',
                borderLeft: '4px solid #2196f3'
              }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1976d2', marginBottom: '0.3rem' }}>
                  Total recibido: ${paymentAmount.toFixed(2)}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#1565c0' }}>
                  {paymentMethods.filter(pm => pm.type && pm.amount > 0).length} método(s) de pago
                </div>
              </div>
            </div>
            
            {paymentAmount > 0 && paymentAmount >= articles.reduce((sum, article) => sum + (article.amount * article.quantity), 0) && (
              <div style={{ 
                background: '#d4edda', 
                color: '#155724', 
                padding: '0.5rem', 
                borderRadius: '4px',
                marginTop: '0.5rem',
                fontSize: '0.9rem'
              }}>
                💡 Cambio a devolver: ${(paymentAmount - articles.reduce((sum, article) => sum + (article.amount * article.quantity), 0)).toFixed(2)}
              </div>
            )}
            
            {paymentAmount > 0 && paymentAmount < articles.reduce((sum, article) => sum + (article.amount * article.quantity), 0) && (
              <div style={{ 
                background: '#f8d7da', 
                color: '#721c24', 
                padding: '0.5rem', 
                borderRadius: '4px',
                marginTop: '0.5rem',
                fontSize: '0.9rem'
              }}>
                ⚠️ El monto recibido es menor al total de la venta
              </div>
            )}

            <ModalButtons>
              <CancelButton type="button" onClick={() => {
                setShowPaymentModal(false);
                setFormattedPaymentAmount('');
                setPaymentAmount(0);
                setPaymentType('');
                setPaymentMethods([]);
              }}>
                Cancelar
              </CancelButton>
              <Button 
                type="button" 
                onClick={handlePaymentSubmit}
                disabled={
                  paymentAmount <= 0 || 
                  paymentMethods.filter(pm => pm.type && pm.amount > 0).length === 0 || 
                  paymentAmount < articles.reduce((sum, article) => sum + (article.amount * article.quantity), 0)
                }
              >
                Procesar Venta
              </Button>
            </ModalButtons>
          </ModalContent>
        </Modal>
      )}
    </SalesContainer>
  );
};

export default SalesForm;