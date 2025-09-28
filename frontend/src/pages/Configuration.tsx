import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Navigation from '../components/common/Navigation';
import { franchiseLocationsApi, catalogsApi, configurationsApi } from '../services/api';
import { FranchiseLocation } from '../types';
import FranchiseManager from '../components/configuration/FranchiseManager';

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
  const [tab, setTab] = useState<'franchises' | 'brands' | 'characteristics'>('franchises');
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
  }, []);



  const createBrand = async () => {
    if (!brandName.trim()) return;
    try {
      await catalogsApi.createBrand({ name: brandName.trim(), description: brandDesc.trim() });
      const b = await catalogsApi.getBrands();
      setBrands(b || []);
      setBrandName(''); setBrandDesc('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error');
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
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const createCharacteristicValue = async () => {
    if (!selectedChar || !valueBrand || !valueVal || !valueDisplay) return alert('Complete los campos');
    try {
      await catalogsApi.createCharacteristicValue(selectedChar, { brandId: valueBrand, value: valueVal.trim(), displayName: valueDisplay.trim(), hexColor: valueHex.trim() });
      alert('Valor creado');
      setValueVal(''); setValueDisplay(''); setValueHex('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error');
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
      </Container>
    </Page>
  );
};

export default ConfigurationPage;
