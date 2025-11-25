import React, { useEffect, useState, useRef, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import { Spinner } from '@chakra-ui/react';
import { ProductType, FranchiseLocation, Brand } from '../../types';
import { catalogsApi, franchiseLocationsApi, inventoryApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../hooks/useAlert';

interface IMEIEntry {
  imei: string;
  imei2?: string;
  id: string; // For React keys
}

interface PreviewItem {
  imei: string;
  imei2?: string;
  productType: string;
  memory: string;
  color?: string;
  provider?: string;
  purchasePrice?: number;
  purchaseInvoiceId?: string;
  purchaseInvoiceDate?: string;
  franchiseLocation: string;
  state: string;
}

interface ProductFormData {
  productType?: ProductType;
  storage: string;
  color?: string;
  provider?: string;
  purchasePrice?: number;
  purchaseInvoiceId?: string;
  purchaseInvoiceDate?: string;
  franchiseLocation: string;
  state: string;
}

interface AddInventoryFormProps {
  onClose: () => void;
  onSubmit: () => void; // Callback to refresh parent
}

// Styled Components
const ModalOverlay = styled.div`
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
  border-radius: 8px;
  padding: 2rem;
  max-width: 1000px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0.5rem;
  line-height: 1;
  
  &:hover {
    color: #000;
  }
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.5rem;
`;

const Description = styled.p`
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 2rem;
`;

const Section = styled.div`
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e0e0e0;
  
  &:last-child {
    border-bottom: none;
  }
`;

const SectionTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 1rem;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
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
  
  &:disabled {
    background-color: #f8f9fa;
    color: #6c757d;
    cursor: not-allowed;
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
  
  &:disabled {
    background-color: #f8f9fa;
    color: #6c757d;
    cursor: not-allowed;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  min-height: 120px;
  resize: vertical;
  font-family: inherit;
  
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
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background-color: #2980b9;
  }
  
  &:disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
  }
  
  &.secondary {
    background-color: #95a5a6;
    
    &:hover {
      background-color: #7f8c8d;
    }
  }
  
  &.danger {
    background-color: #e74c3c;
    
    &:hover {
      background-color: #c0392b;
    }
  }
`;

const IMEISection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const IMEIList = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
`;

const IMEIItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
`;

const RemoveButton = styled.button`
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  line-height: 1;
  
  &:hover {
    background: #c0392b;
  }
`;

const PreviewTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
`;

const PreviewTableHeader = styled.thead`
  background: #f8f9fa;
`;

const PreviewTableRow = styled.tr`
  border-bottom: 1px solid #e0e0e0;
  
  &:hover {
    background: #f8f9fa;
  }
`;

const PreviewTableCell = styled.td`
  padding: 0.75rem;
  font-size: 0.9rem;
`;

const PreviewTableHeaderCell = styled.th`
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
`;

const ErrorMessage = styled.span`
  color: #e74c3c;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  display: block;
`;

const InlineError = styled.div`
  color: #e74c3c;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  padding: 0.5rem;
  background: #ffe6e6;
  border: 1px solid #ffcdd2;
  border-radius: 4px;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  border-radius: 8px;
`;

const LoadingSpinner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  
  span {
    color: #3498db;
    font-weight: 500;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
`;

const AutocompleteContainer = styled.div`
  position: relative;
  width: 100%;
`;

const AutocompleteDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-top: none;
  border-radius: 0 0 4px 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const AutocompleteOption = styled.div`
  padding: 0.75rem;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  
  &:hover {
    background-color: #f8f9fa;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const AddInventoryForm: React.FC<AddInventoryFormProps> = ({ onClose, onSubmit }) => {
  const { user } = useAuth();
  const { success, error } = useAlert();
  
  // State for product form
  const [productFormData, setProductFormData] = useState<ProductFormData>({
    storage: '',
    franchiseLocation: '',
    state: 'New'
  });
  
  // State for IMEI entries
  const [imeiEntries, setImeiEntries] = useState<IMEIEntry[]>([]);
  const [currentImei, setCurrentImei] = useState('');
  const [currentImei2, setCurrentImei2] = useState('');
  const [bulkImeiText, setBulkImeiText] = useState('');
  
  // State for preview
  const [showPreview, setShowPreview] = useState(false);
  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([]);
  
  // State for data loading
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [franchiseLocations, setFranchiseLocations] = useState<FranchiseLocation[]>([]);
  const [colorValues, setColorValues] = useState<Array<{ _id: string; value: string; displayName: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // State for validation errors
  const [validationErrors, setValidationErrors] = useState<{
    productType?: string;
    franchiseLocation?: string;
    imei?: string;
    purchasePrice?: string;
    purchaseInvoiceDate?: string;
  }>({});
  
  // State for product type autocomplete
  const [productTypeSearch, setProductTypeSearch] = useState('');
  const [showProductTypeDropdown, setShowProductTypeDropdown] = useState(false);
  const productTypeInputRef = useRef<HTMLInputElement>(null);
  const productTypeDropdownRef = useRef<HTMLDivElement>(null);
  
  // Determine if user can select multiple locations
  const canSelectMultipleLocations = user?.role === 'Supervisor de sucursales' || 
                                   user?.role === 'Supervisor de oficina' || 
                                   user?.role === 'Master admin';
  
  // Get default franchise location
  const getDefaultFranchiseLocation = () => {
    if (user?.franchiseLocation) {
      return typeof user.franchiseLocation === 'string' 
        ? user.franchiseLocation 
        : user.franchiseLocation._id || '';
    }
    return '';
  };
  
  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load product types
        const types = await catalogsApi.getProductTypes();
        setProductTypes(types || []);
        
        // Load franchise locations if user has permission
        if (canSelectMultipleLocations) {
          const locations = await franchiseLocationsApi.getAll();
          setFranchiseLocations(locations.locations || []);
        }
        
        // Set default franchise location
        const defaultLocation = getDefaultFranchiseLocation();
        if (defaultLocation) {
          setProductFormData(prev => ({ ...prev, franchiseLocation: defaultLocation }));
        }
      } catch (err) {
        console.error('Failed to load data', err);
        error('Error al cargar los datos');
      }
    };
    
    loadData();
  }, [canSelectMultipleLocations]);
  
  // Get product type display name (defined early for use in other hooks)
  const getProductTypeDisplayName = (productType: ProductType) => {
    if (typeof productType.company === 'string') {
      return productType.model;
    }
    return `${(productType.company as Brand).name} - ${productType.model}`;
  };
  
  // Load color values when product type changes
  useEffect(() => {
    const loadColorValues = async () => {
      if (!productFormData.productType) {
        setColorValues([]);
        return;
      }
      
      try {
        const chars = await catalogsApi.getCharacteristics();
        const colorChar = chars.find((c: any) => c.name.toLowerCase() === 'color');
        
        if (colorChar) {
          const brandId = typeof productFormData.productType.company === 'string'
            ? productFormData.productType.company
            : productFormData.productType.company._id;
          const vals = await catalogsApi.getCharacteristicValues(colorChar._id, brandId);
          setColorValues(vals || []);
        } else {
          setColorValues([]);
        }
      } catch (err) {
        console.error('Failed to load color values', err);
        setColorValues([]);
      }
    };
    
    loadColorValues();
  }, [productFormData.productType]);
  
  // Handle product form changes
  const handleProductFormChange = (field: keyof ProductFormData, value: any) => {
    setProductFormData(prev => ({ ...prev, [field]: value }));
  };
  
  // Handle add IMEI manually
  const handleAddImei = () => {
    if (!currentImei.trim()) {
      error('El IMEI principal es requerido');
      return;
    }
    
    const newEntry: IMEIEntry = {
      imei: currentImei.trim(),
      imei2: currentImei2.trim() || undefined,
      id: Date.now().toString()
    };
    
    setImeiEntries([...imeiEntries, newEntry]);
    setCurrentImei('');
    setCurrentImei2('');
    success('IMEI añadido a la lista');
  };
  
  // Handle bulk IMEI import
  const handleProcessBulkImeis = () => {
    if (!bulkImeiText.trim()) {
      error('Debe ingresar al menos un IMEI');
      return;
    }
    
    // Parse text: split by newlines, commas, spaces, or tabs
    const imeis = bulkImeiText
      .split(/[\n,\s\t]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    if (imeis.length === 0) {
      error('No se encontraron IMEIs válidos');
      return;
    }
    
    const newEntries: IMEIEntry[] = imeis.map(imei => ({
      imei,
      id: `${Date.now()}-${Math.random()}`
    }));
    
    setImeiEntries([...imeiEntries, ...newEntries]);
    setBulkImeiText('');
    success(`${newEntries.length} IMEI(s) añadido(s) a la lista`);
  };
  
  // Handle remove IMEI
  const handleRemoveImei = (id: string) => {
    setImeiEntries(imeiEntries.filter(entry => entry.id !== id));
  };
  
  // Generate preview
  const generatePreview = () => {
    const errors: typeof validationErrors = {};
    let hasErrors = false;
    
    if (imeiEntries.length === 0) {
      errors.imei = 'Debe agregar al menos un IMEI';
      hasErrors = true;
    }
    
    if (!productFormData.productType) {
      errors.productType = 'Debe seleccionar un tipo de producto';
      hasErrors = true;
    }
    
    if (!productFormData.franchiseLocation) {
      errors.franchiseLocation = 'Debe asignar una tienda';
      hasErrors = true;
    }
    
    if (hasErrors) {
      setValidationErrors(errors);
      error('Por favor corrija los errores antes de continuar');
      return;
    }
    
    setValidationErrors({});
    
    if (!productFormData.productType) return;
    
    const productTypeName = typeof productFormData.productType.company === 'string'
      ? productFormData.productType.model
      : `${(productFormData.productType.company as Brand).name} - ${productFormData.productType.model}`;
    
    const preview: PreviewItem[] = imeiEntries.map(entry => ({
      imei: entry.imei,
      imei2: entry.imei2,
      productType: productTypeName,
      memory: productFormData.storage || '',
      color: productFormData.color || '',
      provider: productFormData.provider || '',
      purchasePrice: productFormData.purchasePrice,
      purchaseInvoiceId: productFormData.purchaseInvoiceId || '',
      purchaseInvoiceDate: productFormData.purchaseInvoiceDate || '',
      franchiseLocation: productFormData.franchiseLocation,
      state: productFormData.state || 'New'
    }));
    
    setPreviewItems(preview);
    setShowPreview(true);
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    // Validation (Step 8.1)
    const errors: typeof validationErrors = {};
    let hasErrors = false;
    
    if (previewItems.length === 0) {
      error('No hay artículos para agregar');
      return;
    }
    
    if (!productFormData.productType) {
      errors.productType = 'Debe seleccionar un tipo de producto';
      hasErrors = true;
    }
    
    if (!productFormData.franchiseLocation) {
      errors.franchiseLocation = 'Debe asignar una tienda';
      hasErrors = true;
    }
    
    // Validate purchase price if provided
    if (productFormData.purchasePrice !== undefined && productFormData.purchasePrice < 0) {
      errors.purchasePrice = 'El precio de compra debe ser un valor positivo';
      hasErrors = true;
    }
    
    // Validate invoice date if provided
    if (productFormData.purchaseInvoiceDate) {
      const invoiceDate = new Date(productFormData.purchaseInvoiceDate);
      if (isNaN(invoiceDate.getTime())) {
        errors.purchaseInvoiceDate = 'La fecha de factura no es válida';
        hasErrors = true;
      }
    }
    
    if (hasErrors) {
      setValidationErrors(errors);
      error('Por favor corrija los errores antes de continuar');
      return;
    }
    
    setValidationErrors({});
    
    setSubmitting(true);
    try {
      // Transform preview items to API format
      const itemsToCreate = previewItems.map(item => ({
        imei: item.imei,
        imei2: item.imei2,
        state: item.state as any,
        franchiseLocation: item.franchiseLocation,
        productType: productFormData.productType?._id,
        // Legacy fields for backward compatibility
        model: productFormData.productType?.model,
        brand: typeof productFormData.productType?.company === 'string'
          ? productFormData.productType.company
          : (productFormData.productType?.company as Brand)?._id || (productFormData.productType?.company as Brand)?.name,
        color: item.color,
        storage: item.memory,
        provider: item.provider,
        purchasePrice: item.purchasePrice,
        purchaseInvoiceId: item.purchaseInvoiceId,
        purchaseInvoiceDate: item.purchaseInvoiceDate ? new Date(item.purchaseInvoiceDate).toISOString() : undefined,
        price: productFormData.purchasePrice // Use purchase price as sale price initially
      }));
      
      if (itemsToCreate.length === 1) {
        // Single item - use existing endpoint
        await inventoryApi.create(itemsToCreate[0] as any);
      } else {
        // Multiple items - use bulk endpoint
        await inventoryApi.createBulk(itemsToCreate as any);
      }
      
      success(`¡${itemsToCreate.length} artículo(s) agregado(s) exitosamente!`);
      onClose();
      onSubmit();
    } catch (err: any) {
      console.error('Failed to add items:', err);
      error(err.response?.data?.error || 'Error al agregar los artículos');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Filter product types based on search
  const filteredProductTypes = useMemo(() => {
    if (!productTypeSearch.trim()) {
      // Show all product types when search is empty
      return productTypes;
    }
    const searchLower = productTypeSearch.toLowerCase();
    return productTypes.filter(pt => {
      const displayName = getProductTypeDisplayName(pt).toLowerCase();
      return displayName.includes(searchLower);
    });
  }, [productTypes, productTypeSearch, getProductTypeDisplayName]);
  
  // Handle product type selection
  const handleProductTypeSelect = (productType: ProductType) => {
    handleProductFormChange('productType', productType);
    setProductTypeSearch(getProductTypeDisplayName(productType));
    setShowProductTypeDropdown(false);
  };
  
  // Handle product type input change
  const handleProductTypeInputChange = (value: string) => {
    setProductTypeSearch(value);
    // Always show dropdown when typing
    if (value.trim() || productTypes.length > 0) {
      setShowProductTypeDropdown(true);
    }
    
    // If value matches exactly, select it
    const exactMatch = productTypes.find(pt => 
      getProductTypeDisplayName(pt).toLowerCase() === value.toLowerCase()
    );
    if (exactMatch) {
      handleProductFormChange('productType', exactMatch);
    } else if (value === '') {
      handleProductFormChange('productType', undefined);
    }
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        productTypeInputRef.current &&
        productTypeDropdownRef.current &&
        !productTypeInputRef.current.contains(event.target as Node) &&
        !productTypeDropdownRef.current.contains(event.target as Node)
      ) {
        setShowProductTypeDropdown(false);
        // Reset search to selected value if one is selected
        if (productFormData.productType) {
          setProductTypeSearch(getProductTypeDisplayName(productFormData.productType));
        }
      }
    };
    
    if (showProductTypeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showProductTypeDropdown, productFormData.productType]);
  
  // Update search when product type changes externally
  useEffect(() => {
    if (productFormData.productType) {
      setProductTypeSearch(getProductTypeDisplayName(productFormData.productType));
    }
  }, [productFormData.productType]);
  
  return (
    <ModalOverlay onClick={(e) => e.target === e.currentTarget && onClose()}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>×</CloseButton>
        
        <Title>Añadir Artículo(s) a Inventario</Title>
        <Description>
          Registra los detalles comunes y luego añade los IMEIs para cada artículo, ya sea manual o pegando una lista.
        </Description>
        
        {!showPreview ? (
          <>
            {/* Section 1: Product Details Form */}
            <Section>
              <SectionTitle>Detalles del Producto</SectionTitle>
              <FormGrid>
                <FormGroup style={{ gridColumn: '1 / -1' }}>
                  <Label htmlFor="productType">Tipo de Producto (Marca/Modelo Base) *</Label>
                  {productTypes.length === 0 ? (
                    <>
                      <Input
                        id="productType"
                        type="text"
                        placeholder="No hay tipos de producto disponibles"
                        value=""
                        disabled={true}
                        style={{ backgroundColor: '#f8f9fa' }}
                      />
                      <InlineError style={{ background: '#fff3cd', borderColor: '#ffc107', color: '#856404' }}>
                        ⚠️ No hay tipos de producto configurados. Por favor, cree tipos de producto en la página de Configuración primero.
                        <br />
                        <small style={{ fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                          Los tipos de producto son combinaciones de Marca + Modelo (ej: "Samsung - Galaxy S21")
                        </small>
                      </InlineError>
                    </>
                  ) : (
                    <AutocompleteContainer ref={productTypeInputRef}>
                      <Input
                        id="productType"
                        type="text"
                        placeholder={`Selecciona o escribe tipo de producto (${productTypes.length} disponibles)...`}
                        value={productTypeSearch}
                        onChange={(e) => handleProductTypeInputChange(e.target.value)}
                        onFocus={() => {
                          if (productTypes.length > 0) {
                            setShowProductTypeDropdown(true);
                          }
                        }}
                        onClick={() => {
                          if (productTypes.length > 0) {
                            setShowProductTypeDropdown(true);
                          }
                        }}
                        required
                        autoComplete="off"
                        disabled={submitting}
                      />
                      {showProductTypeDropdown && productTypes.length > 0 && (
                        <AutocompleteDropdown ref={productTypeDropdownRef}>
                          {filteredProductTypes.length > 0 ? (
                            filteredProductTypes.map(pt => (
                              <AutocompleteOption
                                key={pt._id}
                                onClick={() => handleProductTypeSelect(pt)}
                              >
                                {getProductTypeDisplayName(pt)}
                              </AutocompleteOption>
                            ))
                          ) : productTypeSearch.trim() ? (
                            <AutocompleteOption style={{ color: '#999', cursor: 'default' }}>
                              No se encontraron resultados para "{productTypeSearch}"
                            </AutocompleteOption>
                          ) : (
                            <AutocompleteOption style={{ color: '#999', cursor: 'default' }}>
                              Escriba para buscar o seleccione de la lista
                            </AutocompleteOption>
                          )}
                        </AutocompleteDropdown>
                      )}
                    </AutocompleteContainer>
                  )}
                  {validationErrors.productType && (
                    <InlineError>{validationErrors.productType}</InlineError>
                  )}
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="storage">Memoria</Label>
                  <Input
                    id="storage"
                    type="text"
                    placeholder="Ej: 256GB"
                    value={productFormData.storage}
                    onChange={(e) => handleProductFormChange('storage', e.target.value)}
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="color">Color (Opcional)</Label>
                  <Select
                    id="color"
                    value={productFormData.color || ''}
                    onChange={(e) => handleProductFormChange('color', e.target.value || undefined)}
                    disabled={!productFormData.productType || colorValues.length === 0}
                  >
                    <option value="">Seleccione un color</option>
                    {colorValues.map(c => (
                      <option key={c._id} value={c.value}>
                        {c.displayName}
                      </option>
                    ))}
                  </Select>
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="provider">Proveedor</Label>
                  <Input
                    id="provider"
                    type="text"
                    placeholder="Ej: TechSupplier Inc."
                    value={productFormData.provider || ''}
                    onChange={(e) => handleProductFormChange('provider', e.target.value || undefined)}
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="purchasePrice">Precio de Compra (Unitario)</Label>
                    <Input
                      id="purchasePrice"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Ej: 750.00"
                      value={productFormData.purchasePrice || ''}
                      onChange={(e) => handleProductFormChange('purchasePrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                      disabled={submitting}
                    />
                    {validationErrors.purchasePrice && (
                      <InlineError>{validationErrors.purchasePrice}</InlineError>
                    )}
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="purchaseInvoiceId">ID Factura de Compra</Label>
                  <Input
                    id="purchaseInvoiceId"
                    type="text"
                    placeholder="Ej: INV-2023-001"
                    value={productFormData.purchaseInvoiceId || ''}
                    onChange={(e) => handleProductFormChange('purchaseInvoiceId', e.target.value || undefined)}
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="purchaseInvoiceDate">Fecha Factura de Compra</Label>
                    <Input
                      id="purchaseInvoiceDate"
                      type="date"
                      placeholder="Selecciona una fecha"
                      value={productFormData.purchaseInvoiceDate || ''}
                      onChange={(e) => handleProductFormChange('purchaseInvoiceDate', e.target.value || undefined)}
                      disabled={submitting}
                    />
                    {validationErrors.purchaseInvoiceDate && (
                      <InlineError>{validationErrors.purchaseInvoiceDate}</InlineError>
                    )}
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="franchiseLocation">
                    Asignar a Tienda *
                    {!canSelectMultipleLocations && (
                      <span style={{ fontSize: '0.8em', color: '#6c757d', fontWeight: 'normal' }}>
                        {' '}(asignada automáticamente)
                      </span>
                    )}
                  </Label>
                  {canSelectMultipleLocations ? (
                    <Select
                      id="franchiseLocation"
                      value={productFormData.franchiseLocation}
                      onChange={(e) => handleProductFormChange('franchiseLocation', e.target.value)}
                      required
                    >
                      <option value="">Seleccionar tienda</option>
                      {franchiseLocations.map(location => (
                        <option key={location._id} value={location._id}>
                          {location.name}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Input
                      id="franchiseLocation-display"
                      type="text"
                      value={user?.franchiseLocation && typeof user.franchiseLocation === 'object' 
                        ? user.franchiseLocation.name 
                        : 'Tienda no asignada'}
                      disabled={true}
                    />
                  )}
                  {validationErrors.franchiseLocation && (
                    <InlineError>{validationErrors.franchiseLocation}</InlineError>
                  )}
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="state">Estatus Inicial *</Label>
                  <Select
                    id="state"
                    value={productFormData.state}
                    onChange={(e) => handleProductFormChange('state', e.target.value)}
                    required
                  >
                    <option value="New">Nuevo</option>
                    <option value="OnRepair">En Reparación</option>
                    <option value="Repaired">Reparado</option>
                    <option value="Sold">Vendido</option>
                    <option value="OnSale">En Venta</option>
                    <option value="Lost">Perdido</option>
                  </Select>
                </FormGroup>
              </FormGrid>
            </Section>
            
            {/* Section 2: IMEI Entry */}
            <Section>
              <SectionTitle>Añadir IMEIs</SectionTitle>
              <IMEISection>
                {/* Manual Entry */}
                <div>
                  <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>Añadir IMEI Manualmente</h4>
                  <FormGroup>
                    <Label htmlFor="currentImei">IMEI Principal Actual</Label>
                    <Input
                      id="currentImei"
                      type="text"
                      placeholder="Introduce el IMEI principal"
                      value={currentImei}
                      onChange={(e) => setCurrentImei(e.target.value)}
                      disabled={submitting}
                    />
                    {validationErrors.imei && (
                      <InlineError>{validationErrors.imei}</InlineError>
                    )}
                  </FormGroup>
                  <FormGroup>
                    <Label htmlFor="currentImei2">IMEI 2 Actual (Opcional)</Label>
                    <Input
                      id="currentImei2"
                      type="text"
                      placeholder="Introduce el IMEI secundario"
                      value={currentImei2}
                      onChange={(e) => setCurrentImei2(e.target.value)}
                    />
                  </FormGroup>
                  <Button onClick={handleAddImei} style={{ width: '100%' }} disabled={submitting}>
                    + Añadir IMEI a la Lista
                  </Button>
                  
                  {imeiEntries.length > 0 && (
                    <div style={{ marginTop: '1rem' }}>
                      <Label>IMEIs a Registrar ({imeiEntries.length}):</Label>
                      <IMEIList>
                        {imeiEntries.map(entry => (
                          <IMEIItem key={entry.id}>
                            <span>
                              IMEI: {entry.imei}
                              {entry.imei2 && `, IMEI2: ${entry.imei2}`}
                            </span>
                            <RemoveButton onClick={() => handleRemoveImei(entry.id)}>
                              ×
                            </RemoveButton>
                          </IMEIItem>
                        ))}
                      </IMEIList>
                    </div>
                  )}
                </div>
                
                {/* Bulk Import */}
                <div>
                  <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>Pegar Lista de IMEIs (Principales)</h4>
                  <FormGroup>
                    <Label htmlFor="bulkImeiText">Pegar aquí (un IMEI por línea o separados):</Label>
                    <TextArea
                      id="bulkImeiText"
                      placeholder="123456789012345&#10;987654321098765&#10;..."
                      value={bulkImeiText}
                      onChange={(e) => setBulkImeiText(e.target.value)}
                    />
                  </FormGroup>
                  <Button onClick={handleProcessBulkImeis} style={{ width: '100%' }} disabled={submitting}>
                    📋 Procesar y Añadir IMEIs Pegados
                  </Button>
                </div>
              </IMEISection>
            </Section>
            
            {/* Action Buttons */}
            <ButtonGroup>
              <Button className="secondary" onClick={onClose} disabled={submitting}>
                Cancelar
              </Button>
              <Button onClick={generatePreview} disabled={imeiEntries.length === 0 || submitting}>
                Añadir {imeiEntries.length} Artículo(s)
              </Button>
            </ButtonGroup>
          </>
        ) : (
          <>
            {/* Section 3: Preview */}
            <Section>
              <SectionTitle>Vista Previa - {previewItems.length} Artículo(s) a Añadir</SectionTitle>
              <PreviewTable>
                <PreviewTableHeader>
                  <PreviewTableRow>
                    <PreviewTableHeaderCell>IMEI</PreviewTableHeaderCell>
                    <PreviewTableHeaderCell>IMEI2</PreviewTableHeaderCell>
                    <PreviewTableHeaderCell>Tipo de Producto</PreviewTableHeaderCell>
                    <PreviewTableHeaderCell>Memoria</PreviewTableHeaderCell>
                    <PreviewTableHeaderCell>Color</PreviewTableHeaderCell>
                    <PreviewTableHeaderCell>Proveedor</PreviewTableHeaderCell>
                    <PreviewTableHeaderCell>Precio Compra</PreviewTableHeaderCell>
                    <PreviewTableHeaderCell>ID Factura</PreviewTableHeaderCell>
                    <PreviewTableHeaderCell>Fecha Factura</PreviewTableHeaderCell>
                    <PreviewTableHeaderCell>Estado</PreviewTableHeaderCell>
                  </PreviewTableRow>
                </PreviewTableHeader>
                <tbody>
                  {previewItems.map((item, index) => (
                    <PreviewTableRow key={index}>
                      <PreviewTableCell>{item.imei}</PreviewTableCell>
                      <PreviewTableCell>{item.imei2 || '-'}</PreviewTableCell>
                      <PreviewTableCell>{item.productType}</PreviewTableCell>
                      <PreviewTableCell>{item.memory || '-'}</PreviewTableCell>
                      <PreviewTableCell>{item.color || '-'}</PreviewTableCell>
                      <PreviewTableCell>{item.provider || '-'}</PreviewTableCell>
                      <PreviewTableCell>{item.purchasePrice ? `$${item.purchasePrice.toFixed(2)}` : '-'}</PreviewTableCell>
                      <PreviewTableCell>{item.purchaseInvoiceId || '-'}</PreviewTableCell>
                      <PreviewTableCell>{item.purchaseInvoiceDate || '-'}</PreviewTableCell>
                      <PreviewTableCell>{item.state}</PreviewTableCell>
                    </PreviewTableRow>
                  ))}
                </tbody>
              </PreviewTable>
            </Section>
            
            {/* Action Buttons */}
            <ButtonGroup>
              <Button className="secondary" onClick={() => setShowPreview(false)} disabled={submitting}>
                Volver a Editar
              </Button>
              <Button onClick={handleSubmit} disabled={submitting || previewItems.length === 0}>
                {submitting ? 'Guardando...' : `Confirmar y Añadir ${previewItems.length} Artículo(s)`}
              </Button>
            </ButtonGroup>
          </>
        )}
      </ModalContent>
    </ModalOverlay>
  );
};

export default AddInventoryForm;

