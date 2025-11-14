import React, { useState, useEffect } from "react";
import { Box, Button, Input, Spinner } from "@chakra-ui/react";
import { getAuthHeaders } from "../../services/transfers";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    equipmentIds: string[];
    toBranch: string;
    assignedDeliveryUser?: string;
  }) => void;
}

const API_URL = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/$/, "");

const TransferModal: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);

  const [brandFilter, setBrandFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [imeiInput, setImeiInput] = useState("");

  const [filteredList, setFilteredList] = useState<any[]>([]);

  const [deliveryUsers, setDeliveryUsers] = useState<any[]>([]);
  const [assignedDeliveryUser, setAssignedDeliveryUser] = useState("");

  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [toBranch, setToBranch] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    setLoadingInventory(true);

    fetch(`${API_URL}/inventory?limit=5000&page=1`, {
      headers: getAuthHeaders(),
    })
      .then((res) => res.json())
      .then((json) => setInventory(json.items || []))
      .finally(() => setLoadingInventory(false));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const loadDeliveryUsers = async () => {
      try {
        const res = await fetch(`${API_URL}/users?limit=1000&page=1`, {
          headers: getAuthHeaders(),
        });

        const json = await res.json();

        const list: any[] = Array.isArray(json)
          ? json
          : json.users || json.data || json.results || json.items || json.docs || [];

        const repartidores = list.filter(
          (u: any) => (u.role || "").toLowerCase() === "reparto"
        );

        setDeliveryUsers(repartidores);
      } catch {
        setDeliveryUsers([]);
      }
    };

    loadDeliveryUsers();
  }, [isOpen]);

  useEffect(() => {
    let list = inventory;

    if (brandFilter) {
      list = list.filter((x) =>
        (x.brand || "").toLowerCase().includes(brandFilter.toLowerCase())
      );
    }

    if (modelFilter) {
      list = list.filter((x) =>
        (x.model || "").toLowerCase().includes(modelFilter.toLowerCase())
      );
    }

    if (stateFilter) {
      list = list.filter((x) => (x.state || "") === stateFilter);
    }

    if (imeiInput) {
      list = list.filter((x) =>
        (x.imei || "").toLowerCase().includes(imeiInput.toLowerCase())
      );
    }

    list = list.filter((x) => !selectedItems.some((s) => s._id === x._id));

    setFilteredList(list.slice(0, 100));
  }, [brandFilter, modelFilter, stateFilter, imeiInput, inventory, selectedItems]);

  const selectItem = (item: any) => {
    if (selectedItems.some((i) => i._id === item._id)) return;
    setSelectedItems((prev) => [...prev, item]);
  };

  const handleSubmit = () => {
    if (selectedItems.length === 0 || !toBranch) {
      alert("Debes seleccionar al menos 1 equipo y la sucursal destino.");
      return;
    }

    onSubmit({
      equipmentIds: selectedItems.map((i) => i._id),
      toBranch,
      assignedDeliveryUser: assignedDeliveryUser || undefined,
    });

    setSelectedItems([]);
    setToBranch("");
    setAssignedDeliveryUser("");
    setImeiInput("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      bg="rgba(0,0,0,0.5)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex={1000}
    >
      <Box
        bg="white"
        p={6}
        rounded="lg"
        maxH="90vh"
        overflowY="auto"
        width="600px"
        boxShadow="xl"
        position="relative"
      >
        <Button
          position="absolute"
          top={4}
          right={4}
          variant="ghost"
          onClick={onClose}
          fontSize="xl"
        >
          ×
        </Button>

        <Box as="h2" fontSize="xl" fontWeight="bold" mb={4}>
          Nueva Transferencia
        </Box>

        {/* FILTROS */}
        <Box mb={4}>
          <strong>Filtro por marca:</strong>
          <Input
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            placeholder="Samsung / Motorola / etc"
          />
        </Box>

        <Box mb={4}>
          <strong>Filtro por modelo:</strong>
          <Input
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            placeholder="A32 / S23 / etc"
          />
        </Box>

        <Box mb={4}>
          <strong>Estado:</strong>
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          >
            <option value="">Todos</option>
            <option value="New">New</option>
            <option value="Repair">Repair</option>
            <option value="Repaired">Repaired</option>
            <option value="Sold">Sold</option>
            <option value="Lost">Lost</option>
            <option value="Clearance">Clearance</option>
          </select>
        </Box>

        <Box mb={4}>
          <strong>Buscar IMEI:</strong>
          <Input
            placeholder="Ingresa el IMEI"
            value={imeiInput}
            onChange={(e) => setImeiInput(e.target.value)}
          />
        </Box>

        {/* LISTA PRINCIPAL */}
        {loadingInventory ? (
          <Spinner />
        ) : (
          filteredList.length > 0 && (
            <Box
              border="1px solid #ddd"
              borderRadius="md"
              maxH="200px"
              overflowY="auto"
              mb={4}
            >
              {filteredList.map((item) => (
                <Box
                  key={item._id}
                  p={3}
                  cursor="pointer"
                  _hover={{ background: "gray.100" }}
                  onClick={() => selectItem(item)}
                >
                  <strong>{item.model}</strong> - {item.brand}
                  <br />
                  <small>IMEI: {item.imei} | Estado: {item.state}</small>
                </Box>
              ))}
            </Box>
          )
        )}

        {/* SELECCIONADOS */}
        {selectedItems.length > 0 && (
          <Box mb={4}>
            <strong>Equipos seleccionados:</strong>
            {selectedItems.map((item) => (
              <Box
                key={item._id}
                display="flex"
                justifyContent="space-between"
                bg="gray.50"
                p={2}
                mt={2}
                borderRadius="md"
              >
                <span>
                  {item.brand} - {item.model} (IMEI: {item.imei})
                </span>

                <Button
                  size="xs"
                  colorScheme="red"
                  onClick={() =>
                    setSelectedItems((prev) =>
                      prev.filter((i) => i._id !== item._id)
                    )
                  }
                >
                  X
                </Button>
              </Box>
            ))}
          </Box>
        )}

        {/* SUCURSAL DESTINO */}
        <Box mb={6}>
          <strong>Sucursal Destino</strong>
          <select
            value={toBranch}
            onChange={(e) => setToBranch(e.target.value)}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          >
            <option value="">Seleccionar</option>
            <option value="Maus">Maus</option>
            <option value="Hidalgo">Hidalgo</option>
            <option value="Sucursal 1">Sucursal 1</option>
            <option value="Sucursal 2">Sucursal 2</option>
          </select>
        </Box>

        {/* REPARTIDOR */}
        <select
          value={assignedDeliveryUser}
          onChange={(e) => setAssignedDeliveryUser(e.target.value)}
          style={{ width: "100%", padding: "8px", marginBottom: "12px" }}
        >
          <option value="">Seleccionar repartidor</option>
          {deliveryUsers.map((user) => (
            <option key={user._id} value={user._id}>
              {user.firstName} {user.lastName}
            </option>
          ))}
        </select>

        {/* BOTONES */}
        <Box display="flex" justifyContent="flex-end" gap="12px">
          <Button onClick={onClose}>Cancelar</Button>
          <Button colorScheme="blue" onClick={handleSubmit}>
            Crear Transferencia
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default TransferModal;