import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Heading,
  chakra,
} from "@chakra-ui/react";
import { inventoryApi } from "../../services/api";
import { useAlert } from "../../hooks/useAlert";

const Select = chakra("select");

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void | Promise<void>;
}

const BulkImeiModal: React.FC<Props> = ({ isOpen, onClose, onUpdated }) => {
  const { success, error } = useAlert();

  const [rawInput, setRawInput] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImeis, setSelectedImeis] = useState<string[]>([]);
  const [stateToApply, setStateToApply] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setRawInput("");
      setResults([]);
      setSelectedImeis([]);
      setStateToApply("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSearch = async () => {
    try {
      setLoading(true);

      const extracted = rawInput.match(/\d{10,18}/g) || [];
      const imeis = Array.from(new Set(extracted));

      if (imeis.length === 0) {
        error("No se detectaron IMEIs válidos");
        return;
      }

      const result = await inventoryApi.checkMultiImeis(imeis);

      setResults(result.found);
      setSelectedImeis(result.found.map((r: any) => r.imei));
    } catch {
      error("Error buscando IMEIs");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      if (!stateToApply) {
        error("Seleccione estado");
        return;
      }

      if (selectedImeis.length === 0) {
        error("No hay IMEIs seleccionados");
        return;
      }

      setLoading(true);

      await inventoryApi.bulkUpdateState(selectedImeis, stateToApply.trim());

      success("Estados actualizados");

      onUpdated();
      onClose();

      setRawInput("");
      setResults([]);
      setSelectedImeis([]);
      setStateToApply("");
    } catch {
      error("Error actualizando estado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="rgba(0,0,0,0.5)"
      display="flex"
      justifyContent="center"
      alignItems="center"
      zIndex={2000}
      p={4}
    >
      <Box
        bg="white"
        rounded="lg"
        shadow="xl"
        p={6}
        w="700px"
        maxH="90vh"
        overflowY="auto"
        position="relative"
      >
        <Button
          onClick={onClose}
          variant="ghost"
          position="absolute"
          top={4}
          right={4}
          fontSize="xl"
          color="gray.600"
        >
          ×
        </Button>

        <Heading size="md" mb={4} fontWeight="600" color="gray.700">
          Procesar múltiples IMEIs
        </Heading>

        <textarea
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          placeholder="Pega IMEIs, texto o códigos — se detectarán automáticamente"
          style={{
            width: "100%",
            height: "150px",
            border: "1px solid #ccc",
            borderRadius: "6px",
            padding: "8px",
            fontSize: "14px",
          }}
        />

        <Button
          mt={2}
          size="sm"
          variant="outline"
          colorScheme="gray"
          w="100%"
          onClick={() => {
            setRawInput("");
            setResults([]);
            setSelectedImeis([]);
            setStateToApply("");
          }}
        >
          Limpiar todo
        </Button>

        <Button
          mt={3}
          w="100%"
          colorScheme="blue"
          onClick={handleSearch}
          isLoading={loading}
        >
          Buscar IMEIs
        </Button>

        {results.length > 0 && (
          <>
            <Heading size="sm" mt={5} mb={1} fontWeight="600" color="gray.700">
              Resultados encontrados ({results.length})
            </Heading>

            <Box display="flex" gap={3} mt={2} mb={2}>
              <Button
                size="sm"
                colorScheme="purple"
                w="50%"
                onClick={() => setSelectedImeis(results.map((r: any) => r.imei))}
              >
                Seleccionar todo
              </Button>
              <Button
                size="sm"
                colorScheme="gray"
                w="50%"
                onClick={() => setSelectedImeis([])}
              >
                Deseleccionar todo
              </Button>
            </Box>      

            <Box
              mt={2}
              maxH="260px"
              overflowY="auto"
              border="1px solid #e2e8f0"
              rounded="md"
              p={2}
              bg="gray.50"
            >
              {results.map((item) => (
                <Box
                  key={item.imei}
                  p={3}
                  mb={2}
                  rounded="md"
                  bg="white"
                  shadow="xs"
                  border="1px solid #ececec"
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedImeis.includes(item.imei)}
                      style={{ marginTop: "4px" }}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedImeis((prev) => [...prev, item.imei]);
                        } else {
                          setSelectedImeis((prev) =>
                            prev.filter((x) => x !== item.imei)
                          );
                        }
                      }}
                    />

                    <Box fontSize="sm" color="gray.700">
                      <Box fontWeight="bold">{item.imei}</Box>
                      <Box>Estado: {item.state}</Box>
                      <Box>
                        Modelo:{" "}
                        <span style={{ color: "#1a73e8" }}>
                          {item.model || "--"}
                        </span>
                      </Box>
                      <Box>
                        Sucursal:{" "}
                        <span style={{ color: "#9c27b0" }}>
                          {item.franchiseLocation?.name || "--"}
                        </span>
                      </Box>
                    </Box>
                  </label>
                </Box>
              ))}
            </Box>

            <Select
              mt={3}
              p={2}
              border="1px solid"
              borderColor="gray.300"
              rounded="md"
              value={stateToApply}
              onChange={(e: any) => setStateToApply(e.target.value)}
              w="100%"
            >
              <option value="">Cambiar estado a...</option>
              <option value="New">Nuevo</option>
              <option value="OnRepair">En Reparación</option>
              <option value="Repaired">Reparado</option>
              <option value="OnSale">En Venta</option>
              <option value="Sold">Vendido</option>
              <option value="Lost">Perdido</option>
              <option value="Clearance">Liquidación</option>
            </Select>

            <Button
              mt={3}
              w="100%"
              colorScheme="green"
              onClick={handleUpdate}
              isLoading={loading}
            >
              Guardar cambios
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
};

export default BulkImeiModal;