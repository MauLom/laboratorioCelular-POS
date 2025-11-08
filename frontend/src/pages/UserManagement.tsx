import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { User, FranchiseLocation, UserRole } from '../types';
import { usersApi, franchiseLocationsApi } from '../services/api';
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
  justify-content: between;
  align-items: center;
  margin-bottom: 30px;
  gap: 20px;
`;

const Title = styled.h1`
  color: #2c3e50;
  font-size: 28px;
  margin: 0;
`;

const Button = styled.button<{ variant?: 'primary' | 'danger' | 'success' }>`
  background: ${props => {
    switch (props.variant) {
      case 'danger': return '#e74c3c';
      case 'success': return '#27ae60';
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
  transition: background-color 0.2s;

  &:hover {
    background: ${props => {
      switch (props.variant) {
        case 'danger': return '#c0392b';
        case 'success': return '#219a52';
        default: return '#2980b9';
      }
    }};
  }

  &:disabled {
    background: #bdc3c7;
    cursor: not-allowed;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const Th = styled.th`
  background: #2c3e50;
  color: white;
  padding: 16px;
  text-align: left;
  font-weight: 600;
`;

const Td = styled.td`
  padding: 16px;
  border-bottom: 1px solid #eee;
`;

const Badge = styled.span<{ status?: 'active' | 'inactive'; role?: string }>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  
  ${props => props.status === 'active' && `
    background: #d4edda;
    color: #155724;
  `}
  
  ${props => props.status === 'inactive' && `
    background: #f8d7da;
    color: #721c24;
  `}
  
  ${props => props.role === 'Master admin' && `
    background: #f0e68c;
    color: #8b4513;
  `}
`;

const Modal = styled.div<{ isOpen: boolean }>`
  display: ${props => props.isOpen ? 'flex' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 30px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalTitle = styled.h2`
  color: #2c3e50;
  margin: 0 0 20px 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: 500;
  color: #2c3e50;
  font-size: 14px;
`;

const Input = styled.input`
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 16px;
  
  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const Select = styled.select`
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 16px;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
`;

const ErrorMessage = styled.div`
  background: #ffebee;
  color: #c62828;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
`;
interface UserFormData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  franchiseLocation?: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<FranchiseLocation[]>([]);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'Cajero',
    franchiseLocation: ''
  });

  const USER_ROLES: UserRole[] = [
    'Cajero',
    'Supervisor de sucursal',
    'Supervisor de sucursales',
    'Oficina',
    'Supervisor de oficina',
    'Master admin'
  ];

  const ROLES_REQUIRING_LOCATION: UserRole[] = [
    'Cajero',
    'Supervisor de sucursal',
    'Oficina'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersResponse, locationsResponse] = await Promise.all([
        usersApi.getAll(),
        franchiseLocationsApi.getActive()
      ]);
      setUsers(usersResponse.users);
      setLocations(locationsResponse);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Error loading data');
    } finally { 
      // setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'Cajero',
      franchiseLocation: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      franchiseLocation: user.franchiseLocation?._id || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editingUser) {
        // Update user
        const updateData: any = {
          username: formData.username,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role
        };

        if (ROLES_REQUIRING_LOCATION.includes(formData.role)) {
          if (!formData.franchiseLocation) {
            setError('Este rol requiere una sucursal asignada');
            return;
          }
          updateData.franchiseLocation = formData.franchiseLocation;
        }

        await usersApi.update(editingUser._id!, updateData);
      } else {
        // Create user
        if (!formData.password) {
          setError('La contraseña es obligatoria para nuevos usuarios');
          return;
        }

        const createData: any = {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role
        };

        if (ROLES_REQUIRING_LOCATION.includes(formData.role)) {
          if (!formData.franchiseLocation) {
            setError('Este rol requiere una sucursal asignada');
            return;
          }
          createData.franchiseLocation = formData.franchiseLocation;
        }

        await usersApi.create(createData);
      }

      setModalOpen(false);
      fetchData();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Error saving user');
    }
  };

  const handleDelete = async (user: User) => {
    if (window.confirm(`¿Estás seguro de que deseas desactivar al usuario ${user.username}?`)) {
      try {
        await usersApi.delete(user._id!);
        fetchData();
      } catch (error: any) {
        setError(error.response?.data?.error || 'Error deleting user');
      }
    }
  };


  return (
    <Container>
      <Navigation />
      <Content>
        <Header>
          <Title>Gestión de Usuarios</Title>
          <Button onClick={openCreateModal}>Crear Usuario</Button>
        </Header>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <Table>
        <thead>
          <tr>
            <Th>Usuario</Th>
            <Th>Nombre</Th>
            <Th>Email</Th>
            <Th>Rol</Th>
            <Th>Sucursal</Th>
            <Th>Estado</Th>
            <Th>Acciones</Th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user._id}>
              <Td>{user.username}</Td>
              <Td>{user.firstName} {user.lastName}</Td>
              <Td>{user.email}</Td>
              <Td>
                <Badge role={user.role === 'Master admin' ? 'Master admin' : undefined}>
                  {user.role}
                </Badge>
              </Td>
              <Td>{user.franchiseLocation?.name || '-'}</Td>
              <Td>
                <Badge status={user.isActive ? 'active' : 'inactive'}>
                  {user.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
              </Td>
              <Td>
                <Button onClick={() => openEditModal(user)}>Editar</Button>
                {user.isActive && (
                  <Button 
                    variant="danger" 
                    onClick={() => handleDelete(user)}
                    style={{ marginLeft: '8px' }}
                  >
                    Desactivar
                  </Button>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal isOpen={modalOpen}>
        <ModalContent>
          <ModalTitle>{editingUser ? 'Editar Usuario' : 'Crear Usuario'}</ModalTitle>
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          <Form onSubmit={handleSubmit}>
            <InputGroup>
              <Label>Usuario</Label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                required
              />
            </InputGroup>
            
            <InputGroup>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </InputGroup>
            
            {!editingUser && (
              <InputGroup>
                <Label>Contraseña</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
              </InputGroup>
            )}
            
            <InputGroup>
              <Label>Nombre</Label>
              <Input
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                required
              />
            </InputGroup>
            
            <InputGroup>
              <Label>Apellido</Label>
              <Input
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                required
              />
            </InputGroup>
            
            <InputGroup>
              <Label>Rol</Label>
              <Select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                required
              >
                {USER_ROLES.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </Select>
            </InputGroup>
            
            {ROLES_REQUIRING_LOCATION.includes(formData.role) && (
              <InputGroup>
                <Label>Sucursal *</Label>
                <Select
                  value={formData.franchiseLocation}
                  onChange={(e) => setFormData({...formData, franchiseLocation: e.target.value})}
                  required
                >
                  <option value="">Seleccionar sucursal...</option>
                  {locations.map(location => (
                    <option key={location._id} value={location._id}>
                      {location.name} ({location.code})
                    </option>
                  ))}
                </Select>
              </InputGroup>
            )}
            
            <ModalActions>
              <Button type="button" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button variant="success" type="submit">
                {editingUser ? 'Actualizar' : 'Crear'}
              </Button>
            </ModalActions>
          </Form>
        </ModalContent>
      </Modal>
      </Content>
    </Container>
  );
};

export default UserManagement;