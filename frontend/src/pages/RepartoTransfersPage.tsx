import React, { useEffect, useState } from "react";
import { Box, Button, Spinner, Text } from "@chakra-ui/react";
import { useAuth } from "../contexts/AuthContext";
import { getAllTransfers, getTransferById, markCourierReceived } from "../services/transfers";

declare module "@chakra-ui/react" {
  interface ButtonProps {
    isLoading?: boolean;
  }
}

const RepartoTransfersPage: React.FC = () => {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTransfers();
  }, []);

  const loadTransfers = async () => {
    setLoading(true);
    try {
      const data = await getAllTransfers();
      setTransfers(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const openDetails = async (id: string) => {
    setLoading(true);
    const data = await getTransferById(id);
    setSelected(data);
    setLoading(false);
  };

  const markItem = async (imei: string, status: "recibido" | "no_recibido") => {
    if (!selected) return;

    setSaving(true);
    try {
      await markCourierReceived(selected._id, {
        [status === "recibido" ? "receivedItemId" : "notReceivedItemId"]: imei,
      });  
      await openDetails(selected._id);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  if (!selected)
    return (
      <Box p={4}>
        <Text fontSize="xl" mb={4} fontWeight="bold">
          Transferencias asignadas ({user?.firstName})
        </Text>

        {loading ? (
          <Spinner />
        ) : transfers.length === 0 ? (
          <Text>No hay transferencias.</Text>
        ) : (
          transfers.map((t) => (
            <Box
              key={t._id}
              p={4}
              mb={3}
              borderRadius="md"
              shadow="md"
              bg="white"
              onClick={() => openDetails(t._id)}
            >
              <Text fontWeight="bold">{t.code}</Text>
              <Text>Origen: {t.fromBranch}</Text>
              <Text>Destino: {t.toBranch}</Text>
              <Text>Total: {t.totalItems}</Text>

              <Button
                mt={2}
                width="100%"
                colorScheme="blue"
              >
                Ver / Recibir
              </Button>
            </Box>
          ))
        )}
      </Box>
    );

  return (
    <Box p={4}>
      <Button mb={3} onClick={() => setSelected(null)}>
        ← Regresar
      </Button>

      <Text fontSize="lg" fontWeight="bold" mb={2}>
        Transferencia {selected.code}
      </Text>

      <Text>Origen: {selected.fromBranch}</Text>
      <Text>Destino: {selected.toBranch}</Text>
      <Text mb={4}>Estado: {selected.status}</Text>

      {selected.items.map((item: any) => (
        <Box
          key={item._id}
          p={3}
          mb={3}
          bg="white"
          shadow="sm"
          borderRadius="md"
        >
          <Text fontWeight="bold">IMEI: {item.imei}</Text>
          <Text mb={2}>
            {item.equipment?.brand} {item.equipment?.model}
          </Text>

          <Button
            colorScheme="green"
            width="100%"
            mb={2}
            isLoading={saving}
            onClick={() => markItem(item.imei, "recibido")}
          >
            ✅ Recibido
          </Button>

          <Button
            colorScheme="red"
            width="100%"
            isLoading={saving}
            onClick={() => markItem(item.imei, "no_recibido")}
          >
            ❌ No recibido
          </Button>
        </Box>
      ))}
    </Box>
  );
};

export default RepartoTransfersPage;