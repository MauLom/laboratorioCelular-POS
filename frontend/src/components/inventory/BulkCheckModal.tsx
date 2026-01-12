import React, { useState, useEffect } from "react";
import { Box, Button, Heading, Text } from "@chakra-ui/react";
import { inventoryApi } from "../../services/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const PAGE_SIZE = 10;

const BulkCheckModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [rawInput, setRawInput] = useState("");
  const [found, setFound] = useState<any[]>([]);
  const [missing, setMissing] = useState<string[]>([]);

  const [foundPage, setFoundPage] = useState(1);
  const [missingPage, setMissingPage] = useState(1);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setRawInput("");
      setFound([]);
      setMissing([]);
      setFoundPage(1);
      setMissingPage(1);
      setErrorMsg(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const paginate = (arr: any[], page: number) => {
    const start = (page - 1) * PAGE_SIZE;
    return arr.slice(start, start + PAGE_SIZE);
  };

  const foundTotalPages = Math.ceil(found.length / PAGE_SIZE);
  const missingTotalPages = Math.ceil(missing.length / PAGE_SIZE);

  const handleProcess = async () => {
    setErrorMsg(null);
    const extracted = rawInput.match(/\d{10,18}/g) || [];
    const imeis = Array.from(new Set(extracted));

    if (imeis.length === 0) {
      setErrorMsg("No se detectaron IMEIs válidos en el texto.");
      return;
    }

    setLoading(true);
    try {
      const result = await inventoryApi.checkMultiImeis(imeis);

      setFound(result.found);
      setMissing(result.notFound);
      setFoundPage(1);
      setMissingPage(1);
    } catch (err: any) {
      const backendMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message;

      setFound([]);
      setMissing([]);
      setErrorMsg(backendMsg || "Ocurrió un error al procesar los IMEIs.");
    } finally {
      setLoading(false);
    }  
  };

  return (
    <Box
      position="fixed"
      inset={0}
      bg="rgba(0,0,0,0.5)"
      display="flex"
      justifyContent="center"
      alignItems="center"
      zIndex={2000}
      p={4}
    >
      <Box
        bg="white"
        p={6}
        rounded="lg"
        w="650px"
        maxH="85vh"
        overflowY="auto"
        shadow="xl"
        position="relative"
      >
        <Button
          onClick={onClose}
          variant="ghost"
          position="absolute"
          top={4}
          right={4}
          fontSize="xl"
        >
          ×
        </Button>

        <Heading size="md" mb={4}>
          Buscar IMEIs en inventario
        </Heading>

        <textarea
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          placeholder="Pega lista de IMEIs..."
          style={{
            width: "100%",
            height: "150px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "10px",
            fontSize: "14px",
          }}
        />

        <Button
          w="100%"
          colorScheme="blue"
          mt={3}
          onClick={handleProcess}
          isLoading={loading}
          loadingText="Procesando..."
        >
          Procesar IMEIs

        </Button>

        {errorMsg && (
          <Box
            mt={3}
            p={3}
            bg="red.50"
            border="1px solid"
            borderColor="red.200"
            borderRadius="md"
            color="red.700"
            fontSize="sm"
            fontWeight="semibold"
          >
            ⚠️ {errorMsg}
            </Box>
        )}  

        {/* ENCONTRADOS */}
        {found.length > 0 && (
          <Box mt={5} p={3} bg="green.50" rounded="md">
            <Heading size="sm" mb={2}>
              Encontrados ({found.length})
            </Heading>

            {paginate(found, foundPage).map((item) => (
              <Box
                key={item.imei}
                p={2}
                mb={2}
                bg="white"
                rounded="md"
                border="1px solid #eee"
              >
                <Text><b>IMEI:</b> {item.imei}</Text>
                <Text><b>Modelo:</b> {item.model || "--"}</Text>
                <Text>
                  <b>Sucursal:</b> {item.franchiseLocation?.name || "--"}
                </Text>
              </Box>
            ))}

            <Box display="flex" justifyContent="space-between" mt={2}>
              <Button
                size="sm"
                onClick={() => setFoundPage(p => Math.max(1, p - 1))}
                disabled={foundPage === 1}
              >
                Anterior
              </Button>

              <Text fontSize="sm">
                Página {foundPage} de {foundTotalPages}
              </Text>

              <Button
                size="sm"
                onClick={() => setFoundPage(p => Math.min(foundTotalPages, p + 1))}
                disabled={foundPage === foundTotalPages}
              >
                Siguiente
              </Button>
            </Box>
          </Box>
        )}

        {/* NO ENCONTRADOS */}
        {missing.length > 0 && (
          <Box mt={5} p={3} bg="red.50" rounded="md">
            <Heading size="sm" mb={2}>
              No encontrados ({missing.length})
            </Heading>

            {paginate(missing, missingPage).map((imei) => (
              <Box
                key={imei}
                p={1}
                borderBottom="1px solid #ddd"
                fontSize="sm"
              >
                {imei}
              </Box>
            ))}

            <Box display="flex" justifyContent="space-between" mt={2}>
              <Button
                size="sm"
                onClick={() => setMissingPage(p => Math.max(1, p - 1))}
                disabled={missingPage === 1}
              >
                Anterior
              </Button>

              <Text fontSize="sm">
                Página {missingPage} de {missingTotalPages}
              </Text>

              <Button
                size="sm"
                onClick={() => setMissingPage(p => Math.min(missingTotalPages, p + 1))}
                disabled={missingPage === missingTotalPages}
              >
                Siguiente
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default BulkCheckModal;