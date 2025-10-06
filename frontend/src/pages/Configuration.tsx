import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Navigation from '../components/common/Navigation';
import { franchiseLocationsApi, catalogsApi, configurationsApi } from '../services/api';
import { FranchiseLocation } from '../types';
import FranchiseManager from '../components/configuration/FranchiseManager';
import { useNotification } from '../contexts/NotificationContext';

const Page = styled.div`
  min-height: 100vh;
  background: #f8f9fa;
`;

const Container = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h1`
  font-size: 20px;
  margin: 0;
`;

const Tabs = styled.div`
  display: flex;
  gap: 8px;
`;

const TabButton = styled.button.withConfig({ shouldForwardProp: (p) => p !== 'active' })<{
  active?: boolean;
}>`
  padding: 8px 12px;
  background: ${p => p.active ? '#3498db' : 'white'};
  color: ${p => p.active ? 'white' : '#2c3e50'};
  border: 1px solid #ecf0f1;
  border-radius: 6px;
  cursor: pointer;
`;

const Card = styled.div`
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
`;

const FormRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  align-items: center;
`;

const Input = styled.input`
  padding: 8px 10px;
  border: 1px solid #e6e6e6;
  border-radius: 6px;
  flex: 1;
`;

const Select = styled.select`
  padding: 8px 10px;
  border: 1px solid #e6e6e6;
  border-radius: 6px;
`;

const Button = styled.button.withConfig({ shouldForwardProp: (p) => p !== 'variant' })<{
  variant?: 'primary' | 'secondary' | 'danger'
}>`
  padding: 8px 12px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  background: ${p => p.variant === 'secondary' ? '#95a5a6' : p.variant === 'danger' ? '#e74c3c' : '#3498db'};
  color: white;
`;

const List = styled.div`
  margin-top: 8px;
  border-top: 1px solid #f1f1f1;
`;

const ListItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f1f1f1;
`;

const Small = styled.div`
  font-size: 13px;
  color: #7f8c8d;
`;

const ErrorMessage = styled.div`
  background: #ffe6e6;
  color: #e74c3c;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  border: 1px solid #ffcdd2;
`;

const SuccessMessage = styled.div`
  background: #e8f5e8;
  color: #27ae60;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  border: 1px solid #c8e6c9;
`;

const ConfigurationPage: React.FC = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [tab, setTab] = useState<'franchises' | 'brands' | 'characteristics' | 'equipment'>('franchises');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // franchises
  const [locations, setLocations] = useState<FranchiseLocation[]>([]);

  // brands
  const [brands, setBrands] = useState<any[]>([]);
  const [brandName, setBrandName] = useState('');
  const [brandDesc, setBrandDesc] = useState('');

  // characteristics
  const [characteristics, setCharacteristics] = useState<any[]>([]);
  const [charName, setCharName] = useState('');
  const [charType, setCharType] = useState<'text'|'color'|'select'|'number'>('text');
  const [selectedChar, setSelectedChar] = useState<string | null>(null);
  const [valueBrand, setValueBrand] = useState<string | null>(null);
  const [valueVal, setValueVal] = useState('');
  const [valueDisplay, setValueDisplay] = useState('');
  const [valueHex, setValueHex] = useState('');

  // Equipment states
  const [printers, setPrinters] = useState<any[]>([]);
  const [currentPrinter, setCurrentPrinter] = useState<string>('');
  const [loadingPrinters, setLoadingPrinters] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      try {
        const locs = await franchiseLocationsApi.getActive();
        setLocations(locs || []);
        const b = await catalogsApi.getBrands();
        setBrands(b || []);
        const chars = await catalogsApi.getCharacteristics();
        setCharacteristics(chars || []);
      } catch (err) {
        console.error(err);
        setError('Error loading configuration data');
      }
    };
    load();
    loadEquipmentData();
  }, []);

  const loadEquipmentData = async () => {
    setLoadingPrinters(true);
    try {
      // Load current printer from localStorage
      const saved = localStorage.getItem('selectedPrinter');
      if (saved) {
        setCurrentPrinter(saved);
      }
      
      // Load available printers
      const winServiceUrl = process.env.REACT_APP_WIN_SERVICE_URL || 'http://localhost:5005';
      const response = await fetch(`${winServiceUrl}/api/printer/list`);
      if (response.ok) {
        const data = await response.json();
        // Manejar diferentes estructuras de respuesta
        const printersList = data.printers || data || [];
        // Asegurar que es un array
        const printersArray = Array.isArray(printersList) ? printersList : [];
        setPrinters(printersArray);
        console.log('Printers loaded:', printersArray);
      }
    } catch (err) {
      console.error('Error loading equipment data:', err);
      setPrinters([]); // Asegurar que siempre sea un array
      notifyError('Error al cargar las impresoras disponibles');
    } finally {
      setLoadingPrinters(false);
    }
  };

  const changePrinter = async (printerName: string) => {
    try {
      localStorage.setItem('selectedPrinter', printerName);
      setCurrentPrinter(printerName);
      notifySuccess('Impresora predeterminada actualizada');
    } catch (err) {
      notifyError('Error al cambiar impresora');
    }
  };

  const testPrinter = async () => {
    try {
      const winServiceUrl = process.env.REACT_APP_WIN_SERVICE_URL || 'http://localhost:5005';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${winServiceUrl}/api/printer/test?printerName=${encodeURIComponent(currentPrinter)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        notifySuccess('Test de impresora ejecutado correctamente');
      } else {
        notifyError('Error en el test de impresora');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // notifyError('Timeout: el test de impresora tardó demasiado');
      } else {
        notifyError('Error al ejecutar test de impresora');
      }
    }
  };

  const createBrand = async () => {
    if (!brandName.trim()) return;
    try {
      await catalogsApi.createBrand({ name: brandName.trim(), description: brandDesc.trim() });
      const b = await catalogsApi.getBrands();
      setBrands(b || []);
      setBrandName(''); setBrandDesc('');
      notifySuccess('Marca creada exitosamente');
    } catch (err: any) {
      notifyError(err.response?.data?.error || 'Error al crear la marca');
    }
  };

  const deleteBrand = async (id: string) => {
    if (!window.confirm('Eliminar marca?')) return;
    await catalogsApi.deleteBrand(id);
    const b = await catalogsApi.getBrands();
    setBrands(b || []);
  };

  const createCharacteristic = async () => {
    if (!charName.trim()) return;
    try {
      await catalogsApi.createCharacteristic({ name: charName.trim(), type: charType });
      const chars = await catalogsApi.getCharacteristics();
      setCharacteristics(chars || []);
      setCharName('');
      notifySuccess('Característica creada exitosamente');
    } catch (err: any) {
      notifyError(err.response?.data?.error || 'Error al crear la característica');
    }
  };

  const createCharacteristicValue = async () => {
    if (!selectedChar || !valueBrand || !valueVal || !valueDisplay) {
      notifyError('Complete todos los campos requeridos');
      return;
    }
    try {
      await catalogsApi.createCharacteristicValue(selectedChar, { brandId: valueBrand, value: valueVal.trim(), displayName: valueDisplay.trim(), hexColor: valueHex.trim() });
      notifySuccess('Valor creado exitosamente');
      setValueVal(''); setValueDisplay(''); setValueHex('');
    } catch (err: any) {
      notifyError(err.response?.data?.error || 'Error al crear el valor');
    }
  };

  const handleError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const handleSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 5000);
  };

  return (
    <Page>
      <Navigation />
      <Container>
        <Header>
          <Title>Configuración</Title>
          <Tabs>
            <TabButton active={tab === 'franchises'} onClick={() => setTab('franchises')}>Franquicias</TabButton>
            <TabButton active={tab === 'brands'} onClick={() => setTab('brands')}>Marcas</TabButton>
            <TabButton active={tab === 'characteristics'} onClick={() => setTab('characteristics')}>Características</TabButton>
            <TabButton active={tab === 'equipment'} onClick={() => setTab('equipment')}>Configuración del equipo</TabButton>
          </Tabs>
        </Header>

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}

        {tab === 'franchises' && (
          <Card>
            <FranchiseManager onError={handleError} onSuccess={handleSuccess} />
          </Card>
        )}

        {tab === 'brands' && (
          <Card>
            <h3>Marcas</h3>
            <FormRow>
              <Input placeholder="Nombre de la marca" value={brandName} onChange={e => setBrandName(e.target.value)} />
              <Input placeholder="Descripción (opcional)" value={brandDesc} onChange={e => setBrandDesc(e.target.value)} />
              <Button onClick={createBrand}>Crear</Button>
            </FormRow>
            <List>
              {brands.map(b => (
                <ListItem key={b._id}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{b.name}</div>
                    <Small>{b.description}</Small>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button variant="secondary" onClick={() => {}}>Editar</Button>
                    <Button variant="danger" onClick={() => deleteBrand(b._id)}>Eliminar</Button>
                  </div>
                </ListItem>
              ))}
            </List>
          </Card>
        )}

        {tab === 'characteristics' && (
          <Card>
            <h3>Características</h3>
            <FormRow>
              <Input placeholder="Nombre de la característica" value={charName} onChange={e => setCharName(e.target.value)} />
              <Select value={charType} onChange={e => setCharType(e.target.value as any)}>
                <option value="text">Texto</option>
                <option value="color">Color</option>
                <option value="select">Select</option>
                <option value="number">Número</option>
              </Select>
              <Button onClick={createCharacteristic}>Crear</Button>
            </FormRow>

            <h4>Agregar valor a característica</h4>
            <FormRow>
              <Select value={selectedChar || ''} onChange={e => setSelectedChar(e.target.value || null)}>
                <option value="">-- Seleccione característica --</option>
                {characteristics.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </Select>
              <Select value={valueBrand || ''} onChange={e => setValueBrand(e.target.value || null)}>
                <option value="">-- Seleccione marca --</option>
                {brands.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
              </Select>
            </FormRow>
            <FormRow>
              <Input placeholder="Valor (clave)" value={valueVal} onChange={e => setValueVal(e.target.value)} />
              <Input placeholder="Nombre para mostrar" value={valueDisplay} onChange={e => setValueDisplay(e.target.value)} />
              <Input placeholder="#HEX (opcional)" value={valueHex} onChange={e => setValueHex(e.target.value)} />
              <Button onClick={createCharacteristicValue}>Agregar</Button>
            </FormRow>

            <h4>Características existentes</h4>
            <List>
              {characteristics.map((c: any) => (
                <ListItem key={c._id}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                    <Small>Tipo: {c.type}</Small>
                  </div>
                  <div>
                    <Button variant="secondary" onClick={() => {}}>Ver valores</Button>
                  </div>
                </ListItem>
              ))}
            </List>
          </Card>
        )}

        {tab === 'equipment' && (
          <Card>
            <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>Configuración del equipo</h3>
            
            <div style={{ marginBottom: '24px' }}>
              <div style={{ marginBottom: '8px', fontWeight: '500', color: '#2c3e50' }}>Impresora predeterminada</div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px' }}>
                <select 
                  value={currentPrinter} 
                  onChange={(e) => changePrinter(e.target.value)}
                  disabled={loadingPrinters}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: loadingPrinters ? '#f3f4f6' : 'white',
                    fontSize: '14px',
                    minWidth: '200px'
                  }}
                >
                  <option value="">
                    {loadingPrinters ? 'Cargando impresoras...' : 'Seleccionar impresora...'}
                  </option>
                  {Array.isArray(printers) && printers.map((printer) => (
                    <option key={printer.name || printer} value={printer.name || printer}>
                      {printer.name || printer} {printer.isDefault ? '(Por defecto del sistema)' : ''}
                    </option>
                  ))}
                </select>
                <Button 
                  onClick={testPrinter}
                  disabled={!currentPrinter || loadingPrinters}
                  variant="secondary"
                >
                  {loadingPrinters ? 'Cargando...' : 'Probar impresora'}
                </Button>
              </div>
              {currentPrinter && (
                <Small style={{ marginTop: '8px', color: '#6b7280' }}>
                  Impresora actual: {currentPrinter}
                </Small>
              )}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <Button 
                onClick={loadEquipmentData}
                disabled={loadingPrinters}
                variant="secondary"
                style={{ marginRight: '12px' }}
              >
                {loadingPrinters ? 'Actualizando...' : 'Actualizar lista de impresoras'}
              </Button>
            </div>
          </Card>
        )}
      </Container>
    </Page>
  );
};

export default ConfigurationPage;
