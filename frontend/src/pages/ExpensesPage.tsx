import React, { useEffect, useMemo, useState, useCallback } from 'react';
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
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import deviceTrackerApi from '../services/deviceTrackerApi';

const LIMIT = 10;

export default function ExpensesPage() {
  const { user } = useAuth();

  const [trackerBranchName, setTrackerBranchName] = useState("Cargando...");
  const [trackerBranchId, setTrackerBranchId] = useState<string | null>(null);

  useEffect(() => {
    async function loadBranch() {
      try {
        const guid = await deviceTrackerApi.getSystemGuid();

        if (!guid) {
          console.warn("⚠ No hay GUID del device tracker, usando fallback del usuario");
          setTrackerBranchName(user?.franchiseLocation?.name || "Sucursal desconocida");
          setTrackerBranchId(user?.franchiseLocation?._id || null);
          return;
        }

        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/franchise-locations/by-guid/${guid}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('auth_token')}`
            }
          }
        );

        if (res.data) {
          setTrackerBranchName(res.data.name);
          setTrackerBranchId(res.data._id);
          localStorage.setItem('branchId', res.data._id);
          return;
        }

      } catch (err) {
        console.error("Error buscando sucursal por Device Tracker:", err);
      }

      setTrackerBranchName(user?.franchiseLocation?.name || "Sucursal desconocida");
      setTrackerBranchId(user?.franchiseLocation?._id || null);
    }

    loadBranch();
  }, [user]);

  const userRole = user?.role || "";
  const isAdmin =
    ["Master admin", "Administrador", "Admin", "Supervisor de sucursales", "Supervisor de oficina"]
      .includes(userRole);

  const [toastData, setToastData] = useState<{ message: string; status: string } | null>(null);
  const toast = useMemo(() => ({
    success: (msg: string) => setToastData({ message: msg, status: 'success' }),
    error: (msg: string) => setToastData({ message: msg, status: 'error' }),
    info: (msg: string) => setToastData({ message: msg, status: 'info' }),
  }), []);

  const currentUser =
    user?.username ||
    user?.firstName ||
    "Usuario Actual";

  const localDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Monterrey' });

  const emptyExpense: Expense = {
    reason: '',
    amount: 0,
    user: currentUser,
    date: localDate,
    notes: '',
    franchiseLocation: trackerBranchId || "",
    deviceGuid: ""
  };

  const [items, setItems] = useState<Expense[]>([]);
  const [form, setForm] = useState<Expense>(emptyExpense);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [userFilter, setUserFilter] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalExpenses, setTotalExpenses] = useState(0);

  const load = useCallback(async (
    filters?: { q?: string; from?: string; to?: string; user?: string },
    page = 1
  ) => {
    setLoading(true);
    try {
      const params = isAdmin
        ? { ...filters, page, limit: LIMIT }
        : { page, limit: LIMIT };

      const res = await listExpenses(params);
      console.log('res completo:', res);
      setItems(res.data);
      setCurrentPage(res.page);
      setTotalPages(res.totalPages);
      setTotalExpenses(res.totalAmount);
    } catch {
      toast.error('No se pudieron cargar los gastos.');
    } finally {
      setLoading(false);
    }
  }, [toast, isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  const handleChange = (key: keyof Expense, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const guid = await deviceTrackerApi.getSystemGuid();

      if (!trackerBranchId) {
        toast.error("No se pudo determinar la sucursal por Device Tracker");
        setLoading(false);
        return;
      }

      const payload = {
        reason: form.reason,
        amount: form.amount,
        notes: form.notes,
        user: form.user,
        date: form.date,
        franchiseLocation: trackerBranchId,
        deviceGuid: guid ?? "SIN_GUID"
      };

      if (editingId && isAdmin) {
        await updateExpense(editingId, payload);
      } else {
        await createExpense(payload);
      }

      toast.success('Gasto registrado correctamente.');
      setForm(emptyExpense);
      setEditingId(null);
      await load({ q, from, to, user: userFilter }, currentPage);

    } catch (error) {
      console.error("Error al guardar gasto:", error);
      toast.error('Ocurrió un error al guardar gastos.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (exp: Expense) => {
    if (!isAdmin) return;
    setForm({
      ...exp,
      date: exp.date.slice(0, 10),
      user: currentUser,
    });
    setEditingId(exp._id || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id?: string) => {
    if (!id || !isAdmin) return;
    if (!window.confirm('¿Eliminar gasto?')) return;

    setLoading(true);
    try {
      await deleteExpense(id);
      toast.success('Gasto eliminado correctamente.');
      await load({ q, from, to, user: userFilter }, currentPage);
    } catch {
      toast.error('No se pudo eliminar el gasto.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilters = async () => {
    setCurrentPage(1);
    await load({ q, from, to, user: userFilter }, 1);
  };

  const clearFilters = async () => {
    setQ('');
    setFrom('');
    setTo('');
    setUserFilter('');
    setCurrentPage(1);
    await load(undefined, 1);
  };

  const total = useMemo(
    () => items.reduce((a, b) => a + (b.amount || 0), 0),
    [items]
  );

  const uniqueUsers = useMemo(
    () => Array.from(new Set(items.map(i => i.user))).sort(),
    [items]
  );

  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
      .reduce<(number | '...')[]>((acc, p, idx, arr) => {
        if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
        acc.push(p);
        return acc;
      }, []);
  }, [totalPages, currentPage]);

  return (
    <Layout>
      {/* FORMULARIO */}
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
                placeholder="Sucursal"
                value={trackerBranchName}
                readOnly={!isAdmin}
                bg={isAdmin ? 'white' : '#f0f0f0'}
                cursor={isAdmin ? 'text' : 'not-allowed'}
              />
            </Flex>

            <Input
              type="date"
              value={form.date}
              onChange={(e) => handleChange('date', e.target.value)}
              readOnly={!isAdmin}
              bg={isAdmin ? 'white' : '#f0f0f0'}
              cursor={isAdmin ? 'text' : 'not-allowed'}
              mb="10px"
            />

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
              {editingId && isAdmin && (
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

      {/* FILTROS SOLO ADMIN */}
      {isAdmin && (
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
                <option key={u} value={u}>{u}</option>
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

      {/* TABLA */}
      <Box bg="white" mt="20px" p="20px" borderRadius="8px" boxShadow="md">
        {loading ? (
          <Spinner size="xl" />
        ) : (
          <Box overflowX="auto">
            <Box as="table" width="100%" border="1px solid #ccc" borderRadius="8px">
              <Box as="thead" bg="green.400" color="white" fontWeight="bold">
                <Box as="tr">
                  <Box as="th" p="8px">Fecha</Box>
                  <Box as="th" p="8px">Motivo</Box>
                  <Box as="th" p="8px">Monto</Box>
                  <Box as="th" p="8px">Usuario</Box>
                  <Box as="th" p="8px">Notas</Box>
                  <Box as="th" p="8px" textAlign="center">Acciones</Box>
                </Box>
              </Box>

              <Box as="tbody">
                {items.length > 0 ? (
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
                      <Box as="td" p="8px">{e.reason}</Box>
                      <Box as="td" p="8px" fontWeight="bold">
                        ${Number(e.amount).toFixed(2)}
                      </Box>
                      <Box as="td" p="8px">{e.user}</Box>
                      <Box as="td" p="8px">{e.notes || '-'}</Box>
                      <Box as="td" p="8px" textAlign="center">
                        <Flex justify="center">
                          {isAdmin ? (
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
                            <Text color="gray.400" fontSize="sm">—</Text>
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

            {/* PAGINACIÓN */}
            {totalPages > 1 && (
              <Flex justify="center" align="center" mt="16px" gap="8px" flexWrap="wrap">
                <Button
                  size="sm"
                  onClick={() => load({ q, from, to, user: userFilter }, currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                >
                  ← Anterior
                </Button>

                {pageNumbers.map((p, i) =>
                  p === '...' ? (
                    <Text key={`ellipsis-${i}`} px="2" lineHeight="32px">…</Text>
                  ) : (
                    <Button
                      key={p}
                      size="sm"
                      colorScheme={p === currentPage ? 'green' : 'gray'}
                      onClick={() => load({ q, from, to, user: userFilter }, p as number)}
                      disabled={loading}
                    >
                      {p}
                    </Button>
                  )
                )}

                <Button
                  size="sm"
                  onClick={() => load({ q, from, to, user: userFilter }, currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                >
                  Siguiente →
                </Button>
              </Flex>
            )}

            {/* TOTALES */}
            <Flex justify="flex-end" align="baseline" mt="10px" gap="8px">
              <Text fontWeight="bold">
                Total página: ${total.toFixed(2)}
              </Text>
              <Text fontWeight="bold" color="green.600">
                Total del día: ${totalExpenses.toFixed(2)}
              </Text>
              {isAdmin && (
                <Text color="gray.500" fontSize="sm">
                  (página {currentPage} de {totalPages} — {totalExpenses} gastos en total)
                </Text>
              )}
            </Flex>
          </Box>
        )}
      </Box>

      {toastData && <CustomToast message={toastData.message} status={toastData.status} />}
    </Layout>
  );
}