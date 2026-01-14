import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Button,
  Heading,
  Spinner,
  HStack,
  chakra,
} from "@chakra-ui/react";
import Navigation from "../components/common/Navigation";
import { useAuth } from "../contexts/AuthContext";
import TransferModal from "../components/transfer/TransferModal";
import TransferDetailModal from "../components/transfer/TransferDetailModal";
import {
  createTransfer,
  getAllTransfers,
  deleteTransfer,
} from "../services/transfers";
import TransferStatusTag from "../components/transfer/TransferStatusTag";
import { franchiseLocationsApi } from "../services/api";
import { useBreakpointValue, VStack, Text } from "@chakra-ui/react";
const Select = chakra('select');

const TransfersPage: React.FC = () => {
  const { user } = useAuth();

  const [transfers, setTransfers] = useState<any[]>([]);
  const [visibleTransfers, setVisibleTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const [imei, setImei] = useState("");
  const [fromBranch, setFromBranch] = useState("");
  const [toBranch, setToBranch] = useState("");
  const [date, setDate] = useState("");
  const [branches, setBranches] = useState<any[]>([]);
  const isMobile = useBreakpointValue({ base: true, md: false });

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const isAdmin = ["Master admin", "Administrador", "Supervisor"].includes(
    user?.role || ""
  );

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const res = await franchiseLocationsApi.getActive();
        setBranches(res || []);
      } catch (err) {
        console.error("Error cargando sucursales", err);
      }
    };

    loadBranches();
  }, []);  

  const fetchTransfers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllTransfers(
        isAdmin
          ? {
             imei: imei || undefined,
             fromBranch: fromBranch || undefined,
             toBranch: toBranch || undefined,
             date: date || undefined,
             page,
             limit: PAGE_SIZE,
            }
          : {
              page,
              limit: PAGE_SIZE,
            }  
        );   
      const list = Array.isArray(data) ? data : [];
      setTransfers(list);

      if (!user) {
        setVisibleTransfers([]);
        return;
      }

      const role = user?.role || "";
      let filtered = list;

      if (["Master admin", "Administrador", "Supervisor"].includes(role)) {
        filtered = list;
      }

      else if (role === "Reparto") {
        filtered = list.filter(
          (t) =>
            t.assignedDeliveryUser?.toString() === user?._id?.toString()
        );
      }

      else if (role === "Vendedor" || role === "Cajero") {
        filtered = list;
      }

      else {
        filtered = list;
      }

      setVisibleTransfers(filtered);
    } catch (err) {
      console.error("Error al obtener transferencias:", err);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, imei, fromBranch, toBranch, date, page]);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  const handleCreateTransfer = async (data: any) => {
    try {
      await createTransfer({
        equipmentIds: data.equipmentIds,
        toBranch: data.toBranch,
        reason: data.reason || "",
        assignedDeliveryUser: data.assignedDeliveryUser || null,
      });

      await fetchTransfers();
      setIsModalOpen(false);
    } catch (err: any) {
      alert("Error al crear transferencia: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = window.confirm(
      "¿Seguro que deseas eliminar esta transferencia? Esta acción no se puede deshacer."
    );
    if (!ok) return;

    try {
      await deleteTransfer(id);
      await fetchTransfers();
      alert("Transferencia eliminada correctamente.");
    } catch (err: any) {
      alert("Error al eliminar: " + err.message);
    }
  };

  return (
    <Box bg="#f8f9fa" minH="100vh">
      <Navigation />

      <Box maxW="1100px" mx="auto" py={8}>
        {/* Header */}
        <Box bg="white" p={6} rounded="lg" shadow="md">
          <HStack justify="space-between" align="center">
            <Heading size="lg">Gestión de Transferencias</Heading>

            {isAdmin && (
              <Button colorScheme="blue" onClick={() => setIsModalOpen(true)}>
                Nueva Transferencia
              </Button>
            )}
          </HStack>
        </Box>

        {isAdmin && (
          <Box bg="white" p={4} mt={4} rounded="lg" shadow="sm">
            <HStack
              gap={4}
              flexWrap="wrap"
              flexDirection={isMobile ? "column" : "row"}
              alignItems="stretch"
            > 
              <input
                placeholder="IMEI"
                value={imei}
                onChange={(e) => setImei(e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: 6,
                  width: "100%",
                }}
              />

              <Select
                value={fromBranch}
                onChange={(e) => setFromBranch(e.target.value)}
                w="100%"
                maxW={isMobile ? "100%" : "200px"}
                p={2}
                border="1px solid"
                borderColor="gray.300"
                rounded="md"
                bg="white"
              >
                <option value="">Todas las sucursales (origen)</option>
                {branches.map((b) => (
                  <option key={b._id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </Select>

              <Select
                value={toBranch}
                onChange={(e) => setToBranch(e.target.value)}
                w="100%"
                maxW={isMobile ? "100%" : "200px"}
                p={2}
                border="1px solid"
                borderColor="gray.300"
                rounded="md"
                bg="white"
              >
                <option value="">Todas las sucursales (destino)</option>
                {branches.map((b) => (
                  <option
                    key={b._id}
                    value={b.name}
                    disabled={b.name === fromBranch}
                  >
                    {b.name}
                  </option>
                ))}
              </Select>   

              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: 6,
                  width: "100%",
                }}
              />

              <Button
                colorScheme="blue"
                onClick={() => {
                  setPage(1);
                }}
              >
                Buscar    
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setImei("");
                  setFromBranch("");
                  setToBranch("");
                  setDate("");
                  setPage(1);
                  fetchTransfers();
                }}
              >
                Limpiar
              </Button>
            </HStack>
          </Box>
        )}    

        {/* Tabla */}
        <Box bg="white" p={4} rounded="lg" shadow="sm" mt={6}>
          {loading ? (
            <Spinner size="xl" />
          ) : isMobile ? (
            <MobileTransfersList
              transfers={visibleTransfers}
              isAdmin={isAdmin}
              onView={(id: string) => {
                setDetailId(id);
                setIsDetailOpen(true);
              }}
              onDelete={handleDelete}
            />
          ) : (  
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ backgroundColor: "#f5f5f5" }}>
                <tr>
                  <th style={{ padding: "12px" }}>Código</th>
                  <th style={{ padding: "12px" }}>Origen</th>
                  <th style={{ padding: "12px" }}>Destino</th>
                  <th style={{ padding: "12px" }}>Total</th>
                  <th style={{ padding: "12px" }}>Rec. Reparto</th>
                  <th style={{ padding: "12px" }}>Rec. Sucursal</th>
                  <th style={{ padding: "12px" }}>Estado</th>
                  <th style={{ padding: "12px" }}>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {visibleTransfers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{ padding: "15px", textAlign: "center" }}
                    >
                      No hay transferencias registradas
                    </td>
                  </tr>
                ) : (
                  visibleTransfers.map((t) => (
                    <tr key={t._id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "12px" }}>{t.code}</td>
                      <td style={{ padding: "12px" }}>{t.fromBranch}</td>
                      <td style={{ padding: "12px" }}>{t.toBranch}</td>
                      <td style={{ padding: "12px" }}>{t.totalItems}</td>
                      <td style={{ padding: "12px" }}>{t.courierReceived}</td>
                      <td style={{ padding: "12px" }}>{t.storeReceived}</td>

                      <td style={{ padding: "12px" }}>
                        <TransferStatusTag status={t.status} />
                      </td>

                      <td
                        style={{
                          padding: "12px",
                          display: "flex",
                          gap: "8px",
                        }}
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setDetailId(t._id);
                            setIsDetailOpen(true);
                          }}
                        >
                          Ver detalles
                        </Button>

                        {isAdmin && (
                          <Button
                            size="sm"
                            colorScheme="red"
                            onClick={() => handleDelete(t._id)}
                          >
                            Eliminar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </Box>

        <Box mt={4} display="flex" justifyContent="center" gap={3}>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            Anterior
          </Button>

          <Text alignSelf="center">Página {page}</Text>
          <Button
            onClick={() => setPage((p) => p + 1)}
            disabled={loading || visibleTransfers.length < PAGE_SIZE}
          >
            Siguiente
          </Button>
        </Box>  
      </Box>

      {/* Modales */}
      <TransferModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTransfer}
      />

      <TransferDetailModal
        isOpen={isDetailOpen}
        onClose={async () => {
          setIsDetailOpen(false);
          await fetchTransfers();
        }}
        transferId={detailId}
        onUpdated={fetchTransfers}
      />
    </Box>
  );
};

const MobileTransfersList = ({
  transfers,
  isAdmin,
  onView,
  onDelete,
}: any) => (
  <VStack gap={4}>
    {transfers.map((t: any) => (
      <Box
        key={t._id}
        bg="white"
        p={4}
        rounded="lg"
        shadow="sm"
        border="1px solid"
        borderColor="gray.200"
      >
        <HStack justify="space-between" mb={2}>
          <Text fontWeight="bold">{t.code}</Text>
          <TransferStatusTag status={t.status} />
        </HStack>

        <Text fontSize="sm"><b>Origen:</b> {t.fromBranch}</Text>
        <Text fontSize="sm"><b>Destino:</b> {t.toBranch}</Text>
        <Text fontSize="sm"><b>Total:</b> {t.totalItems}</Text>
        <Text fontSize="sm">
          <b>Rec. Reparto:</b> {t.courierReceived ? "Sí" : "No"}
        </Text>
        <Text fontSize="sm">
          <b>Rec. Sucursal:</b> {t.storeReceived ? "Sí" : "No"}
        </Text>

        <HStack mt={3} gap={2}>
          <Button
            size="sm"
            variant="outline"
            w="100%"
            onClick={() => onView(t._id)}
          >
            Ver detalles
          </Button>

          {isAdmin && (
            <Button
              size="sm"
              colorScheme="red"
              w="100%"
              onClick={() => onDelete(t._id)}
            >
              Eliminar
            </Button>
          )}
        </HStack>
      </Box>
    ))}
  </VStack>
);

export default TransfersPage;