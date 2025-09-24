import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FranchiseLocation, User } from '../types';
import { franchiseLocationsApi, usersApi } from '../services/api';
import Navigation from '../components/common/Navigation';

const Container = styled.div`
  min-height: 100vh;
  background-color: #f8f9fa;
`;

const Content = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  gap: 20px;
`;

const Title = styled.h1`
  color: #2c3e50;
  font-size: 28px;
  margin: 0;
`;

const Button = styled.button<{ variant?: 'primary' | 'danger' | 'success' | 'secondary' }>`
  background: ${props => {
    switch (props.variant) {
      case 'danger': return '#e74c3c';
      case 'success': return '#27ae60';
      case 'secondary': return '#95a5a6';
      default: return '#3498db';
    }
  }};
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  min-width: 120px;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }

  &:disabled {
    background: #bdc3c7;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 20px;
`;

const LocationGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const LocationCard = styled(Card)<{ isActive: boolean }>`
  opacity: ${props => props.isActive ? 1 : 0.6};
  border-left: 4px solid ${props => props.isActive ? '#27ae60' : '#e74c3c'};
  position: relative;
`;

const LocationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
`;

const LocationTitle = styled.h3`
  color: #2c3e50;
  margin: 0 0 4px 0;
  font-size: 18px;
`;

const LocationCode = styled.span`
  background: #ecf0f1;
  color: #7f8c8d;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
`;

const LocationInfo = styled.div`
  margin-bottom: 16px;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
`;

const InfoLabel = styled.span`
  color: #7f8c8d;
  font-weight: 500;
`;

const InfoValue = styled.span`
  color: #2c3e50;
`;

const StatusBadge = styled.span<{ type: string }>`
  background: ${props => props.type === 'Sucursal' ? '#3498db' : '#9b59b6'};
  color: white;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const Modal = styled.div<{ isOpen: boolean }>`
  display: ${props => props.isOpen ? 'flex' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ecf0f1;
`;

const ModalTitle = styled.h2`
  color: #2c3e50;
  margin: 0;
  font-size: 20px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #7f8c8d;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  
  &:hover {
    background: #ecf0f1;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  color: #2c3e50;
  font-weight: 500;
  font-size: 14px;
`;

const Input = styled.input`
  padding: 12px;
  border: 2px solid #ecf0f1;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3498db;
  }

  &:disabled {
    background: #f8f9fa;
    color: #7f8c8d;
  }
`;

const Select = styled.select`
  padding: 12px;
  border: 2px solid #ecf0f1;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const TextArea = styled.textarea`
  padding: 12px;
  border: 2px solid #ecf0f1;
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
  min-height: 80px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #ecf0f1;
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

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  
  &::after {
    content: '';
    width: 40px;
    height: 40px;
    border: 4px solid #ecf0f1;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const UsersList = styled.div`
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #ecf0f1;
  border-radius: 6px;
  margin-top: 8px;
`;

const UserItem = styled.div`
  padding: 8px 12px;
  border-bottom: 1px solid #ecf0f1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  &:last-child {
    border-bottom: none;
  }
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const UserName = styled.span`
  font-weight: 500;
  color: #2c3e50;
`;

const UserRole = styled.span`
  font-size: 12px;
  color: #7f8c8d;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
`;

const PageButton = styled.button<{ active?: boolean }>`
  padding: 8px 12px;
  border: 2px solid ${props => props.active ? '#3498db' : '#ecf0f1'};
  background: ${props => props.active ? '#3498db' : 'white'};
  color: ${props => props.active ? 'white' : '#2c3e50'};
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    border-color: #3498db;
    background: ${props => props.active ? '#2980b9' : '#f8f9fa'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const FranchiseConfiguration: React.FC = () => {
  const [locations, setLocations] = useState<FranchiseLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<FranchiseLocation | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewingUsers, setViewingUsers] = useState<FranchiseLocation | null>(null);
  const [locationUsers, setLocationUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'Sucursal' as 'Sucursal' | 'Oficina',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Mexico'
    },
    contact: {
      phone: '',
      email: ''
    },
    notes: '',
    isActive: true
  });

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await franchiseLocationsApi.getAll({
        page: currentPage,
        limit: 10
      });
      setLocations(response.locations);
      setTotalPages(response.totalPages);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Error loading franchise locations');
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const fetchLocationUsers = async (locationId: string) => {
    try {
      const response = await usersApi.getAll({
        franchiseLocation: locationId,
        page: 1,
        limit: 100
      });
      setLocationUsers(response.users);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Error loading users');
    }
  };

  const openCreateModal = () => {
    setEditingLocation(null);
    setFormData({
      name: '',
      code: '',
      type: 'Sucursal',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Mexico'
      },
      contact: {
        phone: '',
        email: ''
      },
      notes: '',
      isActive: true
    });
    setModalOpen(true);
  };

  const openEditModal = (location: FranchiseLocation) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      code: location.code,
      type: location.type,
      address: {
        street: location.address?.street || '',
        city: location.address?.city || '',
        state: location.address?.state || '',
        zipCode: location.address?.zipCode || '',
        country: location.address?.country || 'Mexico'
      },
      contact: {
        phone: location.contact?.phone || '',
        email: location.contact?.email || ''
      },
      notes: location.notes || '',
      isActive: location.isActive
    });
    setModalOpen(true);
  };

  const openUsersModal = async (location: FranchiseLocation) => {
    setViewingUsers(location);
    await fetchLocationUsers(location._id!);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      if (editingLocation) {
        await franchiseLocationsApi.update(editingLocation._id!, formData);
        setSuccess('Franchise location updated successfully');
      } else {
        await franchiseLocationsApi.create(formData);
        setSuccess('Franchise location created successfully');
      }
      setModalOpen(false);
      await fetchLocations();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Error saving franchise location');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (location: FranchiseLocation) => {
    try {
      setLoading(true);
      if (location.isActive) {
        await franchiseLocationsApi.delete(location._id!);
        setSuccess('Franchise location deactivated successfully');
      } else {
        await franchiseLocationsApi.update(location._id!, { isActive: true });
        setSuccess('Franchise location activated successfully');
      }
      await fetchLocations();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Error updating franchise location');
    } finally {
      setLoading(false);
    }
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      pages.push(
        <PageButton key={1} onClick={() => setCurrentPage(1)}>
          1
        </PageButton>
      );
      if (startPage > 2) {
        pages.push(<span key="ellipsis1">...</span>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <PageButton
          key={i}
          active={i === currentPage}
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </PageButton>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="ellipsis2">...</span>);
      }
      pages.push(
        <PageButton key={totalPages} onClick={() => setCurrentPage(totalPages)}>
          {totalPages}
        </PageButton>
      );
    }

    return pages;
  };

  return (
    <Container>
      <Navigation />
      <Content>
        <Header>
          <Title>Configuración de Franquicias</Title>
          <Button onClick={openCreateModal}>
            Crear Nueva Ubicación
          </Button>
        </Header>

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}

        {loading && !modalOpen ? (
          <LoadingSpinner />
        ) : (
          <>
            <LocationGrid>
              {locations.map((location) => (
                <LocationCard key={location._id} isActive={location.isActive}>
                  <LocationHeader>
                    <div>
                      <LocationTitle>{location.name}</LocationTitle>
                      <LocationCode>{location.code}</LocationCode>
                    </div>
                    <StatusBadge type={location.type}>{location.type}</StatusBadge>
                  </LocationHeader>

                  <LocationInfo>
                    <InfoRow>
                      <InfoLabel>Estado:</InfoLabel>
                      <InfoValue>{location.isActive ? 'Activo' : 'Inactivo'}</InfoValue>
                    </InfoRow>
                    {location.address?.city && (
                      <InfoRow>
                        <InfoLabel>Ciudad:</InfoLabel>
                        <InfoValue>{location.address.city}</InfoValue>
                      </InfoRow>
                    )}
                    {location.contact?.phone && (
                      <InfoRow>
                        <InfoLabel>Teléfono:</InfoLabel>
                        <InfoValue>{location.contact.phone}</InfoValue>
                      </InfoRow>
                    )}
                    {location.contact?.email && (
                      <InfoRow>
                        <InfoLabel>Email:</InfoLabel>
                        <InfoValue>{location.contact.email}</InfoValue>
                      </InfoRow>
                    )}
                  </LocationInfo>

                  <ActionButtons>
                    <Button
                      variant="secondary"
                      onClick={() => openUsersModal(location)}
                    >
                      Ver Usuarios
                    </Button>
                    <Button onClick={() => openEditModal(location)}>
                      Editar
                    </Button>
                    <Button
                      variant={location.isActive ? "danger" : "success"}
                      onClick={() => handleToggleActive(location)}
                    >
                      {location.isActive ? 'Desactivar' : 'Activar'}
                    </Button>
                  </ActionButtons>
                </LocationCard>
              ))}
            </LocationGrid>

            {totalPages > 1 && (
              <Pagination>
                <PageButton
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Anterior
                </PageButton>
                {renderPagination()}
                <PageButton
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Siguiente
                </PageButton>
              </Pagination>
            )}
          </>
        )}

        {/* Create/Edit Modal */}
        <Modal isOpen={modalOpen}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>
                {editingLocation ? 'Editar Ubicación' : 'Crear Nueva Ubicación'}
              </ModalTitle>
              <CloseButton onClick={() => setModalOpen(false)}>×</CloseButton>
            </ModalHeader>

            <Form onSubmit={handleSubmit}>
              <InputGroup>
                <Label>Nombre *</Label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  maxLength={100}
                />
              </InputGroup>

              <InputGroup>
                <Label>Código *</Label>
                <Input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  required
                  maxLength={10}
                  pattern="[A-Z0-9]+"
                  title="Solo letras mayúsculas y números"
                />
              </InputGroup>

              <InputGroup>
                <Label>Tipo *</Label>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as 'Sucursal' | 'Oficina'})}
                  required
                >
                  <option value="Sucursal">Sucursal</option>
                  <option value="Oficina">Oficina</option>
                </Select>
              </InputGroup>

              <InputGroup>
                <Label>Calle</Label>
                <Input
                  type="text"
                  value={formData.address.street}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: {...formData.address, street: e.target.value}
                  })}
                  maxLength={200}
                />
              </InputGroup>

              <InputGroup>
                <Label>Ciudad</Label>
                <Input
                  type="text"
                  value={formData.address.city}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: {...formData.address, city: e.target.value}
                  })}
                  maxLength={100}
                />
              </InputGroup>

              <InputGroup>
                <Label>Estado</Label>
                <Input
                  type="text"
                  value={formData.address.state}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: {...formData.address, state: e.target.value}
                  })}
                  maxLength={100}
                />
              </InputGroup>

              <InputGroup>
                <Label>Código Postal</Label>
                <Input
                  type="text"
                  value={formData.address.zipCode}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: {...formData.address, zipCode: e.target.value}
                  })}
                  maxLength={20}
                />
              </InputGroup>

              <InputGroup>
                <Label>País</Label>
                <Input
                  type="text"
                  value={formData.address.country}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: {...formData.address, country: e.target.value}
                  })}
                  maxLength={100}
                />
              </InputGroup>

              <InputGroup>
                <Label>Teléfono</Label>
                <Input
                  type="tel"
                  value={formData.contact.phone}
                  onChange={(e) => setFormData({
                    ...formData,
                    contact: {...formData.contact, phone: e.target.value}
                  })}
                  maxLength={20}
                />
              </InputGroup>

              <InputGroup>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.contact.email}
                  onChange={(e) => setFormData({
                    ...formData,
                    contact: {...formData.contact, email: e.target.value}
                  })}
                />
              </InputGroup>

              <InputGroup>
                <Label>Notas</Label>
                <TextArea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  maxLength={500}
                />
              </InputGroup>

              <ModalActions>
                <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {editingLocation ? 'Actualizar' : 'Crear'}
                </Button>
              </ModalActions>
            </Form>
          </ModalContent>
        </Modal>

        {/* Users Modal */}
        <Modal isOpen={!!viewingUsers}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>
                Usuarios en {viewingUsers?.name}
              </ModalTitle>
              <CloseButton onClick={() => setViewingUsers(null)}>×</CloseButton>
            </ModalHeader>

            {locationUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#7f8c8d' }}>
                No hay usuarios asignados a esta ubicación
              </div>
            ) : (
              <UsersList>
                {locationUsers.map((user) => (
                  <UserItem key={user._id}>
                    <UserInfo>
                      <UserName>{user.firstName} {user.lastName}</UserName>
                      <UserRole>{user.role} • {user.username}</UserRole>
                    </UserInfo>
                    <StatusBadge type={user.isActive ? 'active' : 'inactive'}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </StatusBadge>
                  </UserItem>
                ))}
              </UsersList>
            )}
          </ModalContent>
        </Modal>
      </Content>
    </Container>
  );
};

export default FranchiseConfiguration;