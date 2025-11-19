import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import Navigation from '../components/common/Navigation';
import { catalogsApi, usersApi, configurationsApi } from '../services/api';
import FranchiseManager from '../components/configuration/FranchiseManager';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';

const Page = styled.div`
  min-height: 100vh;
  background: #f8f9fa;
`;

const Container = styled.div`
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

const ToggleSwitch = styled.label<{ checked: boolean }>`
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: ${p => p.checked ? '#3498db' : '#ccc'};
    transition: .4s;
    border-radius: 24px;
    &:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
      transform: ${p => p.checked ? 'translateX(26px)' : 'translateX(0)'};
    }
  }
`;

const RoleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f1f1f1;
  &:last-child {
    border-bottom: none;
  }
`;

const RoleName = styled.div`
  font-weight: 500;
  color: #2c3e50;
`;

const ConfigurationPage: React.FC = () => {
  const { notifySuccess, notifyError } = useNotification();
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState<'franchises' | 'brands' | 'characteristics' | 'equipment' | 'cashModal'>('franchises');

  // franchises

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

  // Cash Modal configuration states
  const [roles, setRoles] = useState<string[]>([]);
  const [cashModalRoles, setCashModalRoles] = useState<Set<string>>(new Set());
  const [loadingCashModal, setLoadingCashModal] = useState<boolean>(false);

  const loadEquipmentData = useCallback(async () => {
    setLoadingPrinters(true);
    try {
      // Load current printer from localStorage
      const saved = localStorage.getItem('selectedPrinter');
      if (saved) {
        setCurrentPrinter(saved);
      }
      
      // Try to load available printers (optional service)
      const winServiceUrl = process.env.REACT_APP_WIN_SERVICE_URL || 'http://localhost:5005';
      
      // Add timeout and proper error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      try {
        const response = await fetch(`${winServiceUrl}/api/printer/list`, {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          const printersList = data.printers || data || [];
          const printersArray = Array.isArray(printersList) ? printersList : [];
          setPrinters(printersArray);
          console.log('Printers loaded:', printersArray);
        } else {
          // Service responded but with error
          console.warn('Printer service responded with error:', response.status);
          setPrinters([]);
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          console.warn('Printer service request timeout (3s)');
        } else if (fetchError.code === 'ECONNREFUSED' || fetchError.message.includes('Failed to fetch')) {
          console.warn('Printer service not available (connection refused)');
        } else {
          console.warn('Error connecting to printer service:', fetchError.message);
        }
        
        // Set empty array but don't show error to user (this service is optional)
        setPrinters([]);
      }
      
    } catch (err) {
      console.error('Unexpected error in loadEquipmentData:', err);
      setPrinters([]);
    } finally {
      setLoadingPrinters(false);
    }
  }, []);

  const loadCashModalConfig = useCallback(async () => {
    if (!isAdmin()) return;
    
    setLoadingCashModal(true);
    try {
      // Load roles
      const uniqueRoles = await usersApi.getUniqueRoles();
      setRoles(uniqueRoles);

      // Load configuration
      try {
        const config = await configurationsApi.getByKey('cash_modal_roles');
        if (config && config.values) {
          const enabledRoles = new Set<string>();
          config.values.forEach((v: any) => {
            if (v.isActive !== false) {
              enabledRoles.add(v.value);
            }
          });
          setCashModalRoles(enabledRoles);
        } else {
          // Default: all roles except admin roles
          const defaultRoles = new Set(uniqueRoles.filter(role => 
            !['Supervisor de sucursales', 'Supervisor de oficina', 'Master admin'].includes(role)
          ));
          setCashModalRoles(defaultRoles);
        }
      } catch (err: any) {
        // Configuration doesn't exist yet, use defaults
        const defaultRoles = new Set(uniqueRoles.filter(role => 
          !['Supervisor de sucursales', 'Supervisor de oficina', 'Master admin'].includes(role)
        ));
        setCashModalRoles(defaultRoles);
      }
    } catch (err: any) {
      console.error('Error loading cash modal config:', err);
      notifyError('Error al cargar configuración de modal de caja');
    } finally {
      setLoadingCashModal(false);
    }
  }, [isAdmin, notifyError]);

  const saveCashModalConfig = async () => {
    if (!isAdmin()) {
      notifyError('No tienes permisos para modificar esta configuración');
      return;
    }

    setLoadingCashModal(true);
    try {
      const values = roles.map(role => ({
        value: role,
        label: role,
        isActive: cashModalRoles.has(role)
      }));

      await configurationsApi.createOrUpdate({
        key: 'cash_modal_roles',
        name: 'Roles que reciben el modal de Abrir Caja',
        description: 'Configuración de qué roles de usuario deben recibir el modal de "Abrir Caja" al ingresar a la plataforma',
        values
      });

      notifySuccess('Configuración guardada exitosamente');
    } catch (err: any) {
      console.error('Error saving cash modal config:', err);
      notifyError(err.response?.data?.error || 'Error al guardar la configuración');
    } finally {
      setLoadingCashModal(false);
    }
  };

  const toggleCashModalRole = (role: string) => {
    const newSet = new Set(cashModalRoles);
    if (newSet.has(role)) {
      newSet.delete(role);
    } else {
      newSet.add(role);
    }
    setCashModalRoles(newSet);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const b = await catalogsApi.getBrands();
        setBrands(b || []);
        const chars = await catalogsApi.getCharacteristics();
        setCharacteristics(chars || []);
      } catch (err) {
        console.error(err);
      }
    };
    load();
    loadEquipmentData();
    loadCashModalConfig();
  }, [loadEquipmentData, loadCashModalConfig]);

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
    if (!currentPrinter) {
      notifyError('Selecciona una impresora primero');
      return;
    }

    try {
      const winServiceUrl = process.env.REACT_APP_WIN_SERVICE_URL || 'http://localhost:5005';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
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
        const errorText = await response.text().catch(() => 'Error desconocido');
        notifyError(`Error en el test de impresora: ${response.status} - ${errorText}`);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        notifyError('Timeout: el test de impresora tardó demasiado (5s)');
      } else if (err.message.includes('Failed to fetch') || err.code === 'ECONNREFUSED') {
        notifyError('Servicio de impresoras no disponible. Verifica que esté ejecutándose en el puerto 5005.');
      } else {
        notifyError(`Error al ejecutar test de impresora: ${err.message}`);
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
    notifyError(message);
  };
    
  const handleSuccess = (message: string) => {
    notifySuccess(message);
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
            {isAdmin() && (
              <TabButton active={tab === 'cashModal'} onClick={() => {
                setTab('cashModal');
                loadCashModalConfig();
              }}>Modal de Caja</TabButton>
            )}
          </Tabs>
        </Header>


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

        {tab === 'cashModal' && isAdmin() && (
          <Card>
            <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>Configuración del Modal de Caja</h3>
            <p style={{ marginBottom: '20px', color: '#7f8c8d', fontSize: '14px' }}>
              Selecciona qué roles de usuario deben recibir el modal de "Abrir Caja" al ingresar a la plataforma.
            </p>
            
            {loadingCashModal ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#7f8c8d' }}>
                Cargando configuración...
              </div>
            ) : (
              <>
                <List>
                  {roles.map(role => (
                    <RoleRow key={role}>
                      <RoleName>{role}</RoleName>
                      <ToggleSwitch checked={cashModalRoles.has(role)}>
                        <input
                          type="checkbox"
                          checked={cashModalRoles.has(role)}
                          onChange={() => toggleCashModalRole(role)}
                        />
                        <span className="slider" />
                      </ToggleSwitch>
                    </RoleRow>
                  ))}
                </List>
                
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <Button 
                    variant="secondary" 
                    onClick={loadCashModalConfig}
                    disabled={loadingCashModal}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={saveCashModalConfig}
                    disabled={loadingCashModal}
                  >
                    {loadingCashModal ? 'Guardando...' : 'Guardar configuración'}
                  </Button>
                </div>
              </>
            )}
          </Card>
        )}
      </Container>
    </Page>
  );
};

export default ConfigurationPage;
