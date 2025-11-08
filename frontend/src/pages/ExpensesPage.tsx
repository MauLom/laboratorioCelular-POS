import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Input,
  Heading,
  Text,
  Spinner,
  Flex,
} from '@chakra-ui/react';
import {
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../services/expenses';
import type { Expense } from '../types/expense';
import Layout from '../components/common/Layout';
import { CustomToast } from '../components/common/CustomToast';

export default function ExpensesPage() {
  const [toastData, setToastData] = useState<{ message: string; status: string } | null>(null);
  const toast = {
    success: (msg: string) => setToastData({ message: msg, status: 'success' }),
    error: (msg: string) => setToastData({ message: msg, status: 'error' }),
    info: (msg: string) => setToastData({ message: msg, status: 'info' }),
  }; 

  const currentUser =
    localStorage.getItem('userName') ||
    localStorage.getItem('username') ||
    'Usuario Actual';

  const localDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Monterrey' });

  const emptyExpense: Expense = {
    reason: '',
    amount: 0,
    user: currentUser,
    date: localDate,
    notes: '',
  };

  const [items, setItems] = useState<Expense[]>([]);
  const [form, setForm] = useState<Expense>(emptyExpense);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [userFilter, setUserFilter] = useState('');

  async function load(filters?: { q?: string; from?: string; to?: string; user?: string }) {
    setLoading(true);
    try {
      const res = await listExpenses(filters);
      setItems(Array.isArray(res) ? res : []);
    } catch {
      toast.error('No se pudieron cargar los gastos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    console.log('Token detectado en useEffect:', token);

    if (!token) {
      console.warn('Esperando token antes de cargar gastos...');
      const checkInterval = setInterval(() => {
        const retryToken = localStorage.getItem('auth_token');
        console.log('Reintentando token:', retryToken);
        if (retryToken) {
          clearInterval(checkInterval);
          console.log('Token encontrado, cargando gastos...')
          load();
        }
      }, 500);
      return () => clearInterval(checkInterval);
    }

    // Si ya hay un token, carga inmediatamente
    load();
  }, [load]);

  const handleChange = (key: keyof Expense, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await updateExpense(editingId, form);
        toast.success('Gasto actualizado correctamente.');
      } else {
        await createExpense(form);
        toast.success('Gasto registrado correctamente.');
      }
      setForm(emptyExpense);
      setEditingId(null);
      await load();
    } catch (error) {
      console.error(error);
      toast.error('Ocurrió un error al guardar gastos.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (exp: Expense) => {
    setForm({
      ...exp,
      date: exp.date.slice(0, 10),
      user: currentUser,
    });
    setEditingId(exp._id || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!window.confirm('¿Eliminar gasto?')) return;
    setLoading(true);
    try {
      await deleteExpense(id);
      toast.success('Gasto eliminado correctamente.');
      await load();
    } catch {
      toast.error('No se pudo eliminar el gasto.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilters = async () => await load({ q, from, to, user: userFilter });
  const clearFilters = async () => {
    setQ('');
    setFrom('');
    setTo('');
    setUserFilter('');
    await load();
  };

  const total = useMemo(
    () => (Array.isArray(items) ? items.reduce((a, b) => a + (b.amount || 0), 0) : 0),
    [items]
  );

  const uniqueUsers = useMemo(
    () => Array.from(new Set(items.map(i => i.user))).sort(),
    [items]
  );

  return (
    <Layout>
      {/* Formulario de registro */}
      <Box bg="white" p="20px" borderRadius="8px" boxShadow="md">
        <Heading as="h2" size="md" mb="4">
          Registro de Gastos
        </Heading>

        <form onSubmit={handleSubmit}>
          <Flex direction="column">
            <Flex mb="10px">
              <Input
                placeholder="Motivo"
                value={form.reason}
                onChange={e => handleChange('reason', e.target.value)}
                required
                mr="10px"
              />
              <Input
                placeholder="Monto"
                type="number"
                value={form.amount}
                onChange={e => handleChange('amount', Number(e.target.value))}
                required
              />
            </Flex>

            <Flex mb="10px">
              <Input
                placeholder="Usuario"
                value={form.user}
                readOnly
                bg="#f0f0f0"
                cursor="not-allowed"
                mr="10px"
              />
              <Input
                type="date"
                value={form.date}
                onChange={(e) => handleChange('date', e.target.value)}
                readOnly={
                  !['Master admin', 'Administrador', 'Admin'].includes(
                    localStorage.getItem('userRole') || localStorage.getItem('role') || ''
                  )
                }
                bg={
                  ['Master admin', 'Administrador', 'Admin'].includes(
                    localStorage.getItem('userRole') || localStorage.getItem('role') || ''
                  )
                    ? 'white'
                    : '#f0f0f0'
                }
                cursor={
                  ['Master admin', 'Administrador', 'Admin'].includes(
                    localStorage.getItem('userRole') || localStorage.getItem('role') || ''
                  )
                    ? 'text'
                    : 'not-allowed'
                }
              />
            </Flex>

            <Input
              placeholder="Notas (opcional)"
              value={form.notes || ''}
              onChange={e => handleChange('notes', e.target.value)}
              mb="10px"
            />

            <Flex>
              <Button colorScheme="blue" type="submit" disabled={loading} mr="10px">
                {editingId ? 'Actualizar' : 'Guardar'}
              </Button>
              {editingId && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setForm(emptyExpense);
                  }}
                >
                  Cancelar
                </Button>
              )}
            </Flex>
          </Flex>
        </form>
      </Box>

      {/* Filtros */}
      {['Master admin', 'Administrador', 'Admin', 'Supervisor de sucursales', 'Supervisor de oficina'].includes(
        localStorage.getItem('userRole') || localStorage.getItem('role') || ''
      ) && (
      <Box bg="white" mt="20px" p="20px" borderRadius="8px" boxShadow="md">
        <Heading as="h3" size="sm" mb="4">
          Búsqueda y Filtros
        </Heading>
        <Flex wrap="wrap" mb="10px">
          <Input
            placeholder="Buscar (motivo, notas, usuario)"
            value={q}
            onChange={e => setQ(e.target.value)}
            mr="10px"
            mb="10px"
          />
          <Input
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
            mr="10px"
            mb="10px"
          />
          <Input
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
            mr="10px"
            mb="10px"
          />
          <select
            value={userFilter}
            onChange={e => setUserFilter(e.target.value)}
            style={{
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '6px',
              marginRight: '10px',
              marginBottom: '10px',
            }}
          >
            <option value="">Todos los usuarios</option>
            {uniqueUsers.map(u => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          <Button colorScheme="blue" onClick={handleFilters} disabled={loading} mr="10px">
            Aplicar
          </Button>
          <Button variant="outline" onClick={clearFilters} disabled={loading}>
            Limpiar
          </Button>
        </Flex>
      </Box>
     )} 

      {/* Tabla de resultados */}
      <Box bg="white" mt="20px" p="20px" borderRadius="8px" boxShadow="md">
        {loading ? (
          <Spinner size="xl" />
        ) : (
          <Box overflowX="auto">
            <Box as="table" width="100%" border="1px solid #ccc" borderRadius="8px">
              <Box as="thead" bg="green.400" color="white" fontWeight="bold">
                <Box as="tr">
                  <Box as="th" p="8px">
                    Fecha
                  </Box>
                  <Box as="th" p="8px">
                    Motivo
                  </Box>
                  <Box as="th" p="8px">
                    Monto
                  </Box>
                  <Box as="th" p="8px">
                    Usuario
                  </Box>
                  <Box as="th" p="8px">
                    Notas
                  </Box>
                  <Box as="th" p="8px" textAlign="center">
                    Acciones
                  </Box>
                </Box>
              </Box>

              <Box as="tbody">
                {Array.isArray(items) && items.length > 0 ? (
                  items.map(e => (
                    <Box
                      as="tr"
                      key={e._id}
                      _hover={{ bg: '#f9f9f9' }}
                      borderBottom="1px solid #ddd"
                    >
                      <Box as="td" p="8px">
                        {(() => {
                          const parts = e.date.split('T')[0].split('-');
                          return `${parts[2]}/${parts[1]}/${parts[0]}`;
                        })()}
                      </Box>
                      <Box as="td" p="8px">
                        {e.reason}
                      </Box>
                      <Box as="td" p="8px" fontWeight="bold">
                        ${Number(e.amount).toFixed(2)}
                      </Box>
                      <Box as="td" p="8px">
                        {e.user}
                      </Box>
                      <Box as="td" p="8px">
                        {e.notes || '-'}
                      </Box>
                      <Box as="td" p="8px" textAlign="center">
                        <Flex justify="center">
                          {['Master admin', 'Administrador', 'Admin', 'Supervisor de sucursales', 'Supervisor de oficina'].includes(
                            localStorage.getItem('userRole') || localStorage.getItem('role') || ''
                          ) ? (
                            <>
                             <Button
                              size="sm"
                              colorScheme="yellow"
                              onClick={() => handleEdit(e)}
                              mr="6px"
                             >
                              Editar
                             </Button>
                             <Button
                               size="sm"
                               colorScheme="red"
                               onClick={() => handleDelete(e._id)}
                              >
                                Eliminar
                              </Button>
                             </>
                          ) : (
                            <Text color="gray.400" fontSize="sm">
                              —
                            </Text>
                          )}
                         </Flex>
                        </Box>  
                    </Box>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ padding: '10px', textAlign: 'center' }}>
                      No hay gastos registrados.
                    </td>
                  </tr>
                )}
              </Box>
            </Box>

            <Text fontWeight="bold" textAlign="right" mt="10px">
              Total mostrado: ${total.toFixed(2)}
            </Text>
          </Box>
        )}
      </Box>
      {toastData && <CustomToast message={toastData.message} status={toastData.status} />}
    </Layout>
  );
}