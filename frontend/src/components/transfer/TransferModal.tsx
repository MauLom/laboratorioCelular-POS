import React, { useState, useEffect } from "react";
import { Box, Button, Input, Spinner, Textarea } from "@chakra-ui/react";
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

  const [branches, setBranches] = useState<any[]>([]);
  const ALLOW_OFFICES_AS_DESTINATION = false;

  const [bulkImeisText, setBulkImeisText] = useState("");
  const [missingImeis, setMissingImeis] = useState<string[]>([]);

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
    if (!isOpen) return;

    const loadBranches = async () => {
      try {
        const res = await fetch(`${API_URL}/franchise-locations?limit=5000&page=1`,
          { headers: getAuthHeaders() }
        );

        const data = await res.json();
        let locations =
          Array.isArray(data) ? data :
          data.data || data.locations || data.results || [];

        const filtered = locations.filter((loc: any) => {
          if (ALLOW_OFFICES_AS_DESTINATION) return true;

          const type = (loc.type || "").toLowerCase();
          return type === "sucursal";
        }); 

        setBranches(filtered);
      } catch (error) {
        console.error("Error cargando sucursales:", error);
        setBranches([]);
      }
    };
    
    loadBranches();
  }, [isOpen, ALLOW_OFFICES_AS_DESTINATION]);

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
    setBulkImeisText("");
    setMissingImeis([]);
    onClose();
  };

  function parseImeis(text: string): string[] {
    if (!text) return [];
    const matches = text.match(/\d{15}/g);
    if (!matches) return [];
    return Array.from(new Set(matches));
  }

  const handleProcessBulkImeis = () => {
    if (!bulkImeisText.trim()) {
      alert("Pega al menos un IMEI.");
      return;
    }
    
    const imeis = parseImeis(bulkImeisText);

    if (imeis.length === 0) {
      alert("No se encontraron IMEIs válidos (15 dígitos).");
      return;
    }

    const invByImei = new Map<string, any>();
    inventory.forEach((item) => {
      if (item?.imei) invByImei.set(String(item.imei).trim(), item);
    });
    
    const selectedIds = new Set(selectedItems.map((x) => x._id));

    const found: any[] = [];
    const foundImeisTmp: string[] = [];
    const missingTmp: string[] = [];

    for (const imei of imeis) {
      const item = invByImei.get(imei);

      if (!item) {
        missingTmp.push(imei);
        continue;
      }

      if (selectedIds.has(item._id)) continue;

      found.push(item);
      foundImeisTmp.push(imei);
    }

    if (found.length > 0) {
      setSelectedItems((prev) => [...prev, ...found]);
    }
    
    setMissingImeis(missingTmp);
    setBulkImeisText("");

    alert(
      `✅ Encontrados: ${foundImeisTmp.length}\n❌ No encontrados: ${missingTmp.length}`
    );
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
            <option value="New">Nuevo</option>
            <option value="Repair">Reparacion</option>
            <option value="Repaired">Reparado</option>
            <option value="Sold">Vendido</option>
            <option value="Lost">Perdido</option>
            <option value="Clearance">Liquidacion</option>
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

        {/* BULK IMEIS */}
        <Box mb={4}>
          <strong>Pegar IMEIs (múltiples):</strong>

          <Textarea
            mt={2}
            placeholder="Pega aquí muchos IMEIs (uno por línea o separados por espacios)"
            value={bulkImeisText}
            onChange={(e) => setBulkImeisText(e.target.value)}
            rows={4}
          />

          <Button
            mt={2}
            width="100%"
            colorScheme="green"
            onClick={handleProcessBulkImeis}
            disabled={loadingInventory || inventory.length === 0}
          >
            📋 Procesar IMEIs y seleccionar equipos
          </Button>
        </Box>

        {missingImeis.length > 0 && (
          <Box mb={4} p={3} bg="red.50" border="1px solid #fed7d7" borderRadius="md">
            <strong>❌ IMEIs no encontrados ({missingImeis.length}):</strong>

            <Box mt={2} fontSize="sm" maxH="120px" overflowY="auto">
              {missingImeis.map((i) => (
                <Box key={i}>{i}</Box>
              ))}
            </Box>
          </Box>
        )}        

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

            {branches.map((b) => (
              <option key={b._id} value={b.name}>
                {b.name} ({b.type})
              </option>
            ))}   
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