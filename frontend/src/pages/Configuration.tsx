import React, { useEffect, useState, useCallback } from "react";
import styled from "styled-components";
import Navigation from "../components/common/Navigation";
import { catalogsApi } from "../services/api";
import FranchiseManager from "../components/configuration/FranchiseManager";
import { useNotification } from "../contexts/NotificationContext";

const Page = styled.div`
  min-height: 100vh;
  background: #f8f9fa;
`;

const Container = styled.div`
  margin: 0 auto;
  padding: 24px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h1`
  font-size: 20px;
  margin: 0;
`;

const Tabs = styled.div`
  display: flex;
  gap: 8px;
`;

const TabButton = styled.button.withConfig({
  shouldForwardProp: (p) => p !== "active",
})<{
  active?: boolean;
}>`
  padding: 8px 12px;
  background: ${(p) => (p.active ? "#3498db" : "white")};
  color: ${(p) => (p.active ? "white" : "#2c3e50")};
  border: 1px solid #ecf0f1;
  border-radius: 6px;
  cursor: pointer;
`;

const Card = styled.div`
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
`;

const FormRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  align-items: center;
`;

const Input = styled.input`
  padding: 8px 10px;
  border: 1px solid #e6e6e6;
  border-radius: 6px;
  flex: 1;
`;

const Select = styled.select`
  padding: 8px 10px;
  border: 1px solid #e6e6e6;
  border-radius: 6px;
`;

const Button = styled.button.withConfig({
  shouldForwardProp: (p) => p !== "variant",
})<{
  variant?: "primary" | "secondary" | "danger";
}>`
  padding: 8px 12px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  background: ${(p) =>
    p.variant === "secondary"
      ? "#95a5a6"
      : p.variant === "danger"
      ? "#e74c3c"
      : "#3498db"};
  color: white;
`;

const List = styled.div`
  margin-top: 8px;
  border-top: 1px solid #f1f1f1;
`;

const ListItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f1f1f1;
`;

const Small = styled.div`
  font-size: 13px;
  color: #7f8c8d;
`;

const ConfigurationPage: React.FC = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [tab, setTab] = useState<"franchises" | "product-types" | "equipment">(
    "franchises"
  );

  // franchises

  // product types
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const [productCompany, setProductCompany] = useState("");
  const [productModel, setProductModel] = useState("");
  const [minInventoryThreshold, setMinInventoryThreshold] = useState<number>(0);
  const [brands, setBrands] = useState<any[]>([]);

  // Equipment states
  const [printers, setPrinters] = useState<any[]>([]);
  const [currentPrinter, setCurrentPrinter] = useState<string>("");
  const [loadingPrinters, setLoadingPrinters] = useState<boolean>(false);

  const loadEquipmentData = useCallback(async () => {
    setLoadingPrinters(true);
    try {
      // Load current printer from localStorage
      const saved = localStorage.getItem("selectedPrinter");
      if (saved) {
        setCurrentPrinter(saved);
      }

      // Try to load available printers (optional service)
      const winServiceUrl =
        process.env.REACT_APP_WIN_SERVICE_URL || "http://localhost:5005";

      // Add timeout and proper error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      try {
        const response = await fetch(`${winServiceUrl}/api/printer/list`, {
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
          },
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const printersList = data.printers || data || [];
          const printersArray = Array.isArray(printersList) ? printersList : [];
          setPrinters(printersArray);
          console.log("Printers loaded:", printersArray);
        } else {
          // Service responded but with error
          console.warn(
            "Printer service responded with error:",
            response.status
          );
          setPrinters([]);
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);

        if (fetchError.name === "AbortError") {
          console.warn("Printer service request timeout (3s)");
        } else if (
          fetchError.code === "ECONNREFUSED" ||
          fetchError.message.includes("Failed to fetch")
        ) {
          console.warn("Printer service not available (connection refused)");
        } else {
          console.warn(
            "Error connecting to printer service:",
            fetchError.message
          );
        }

        // Set empty array but don't show error to user (this service is optional)
        setPrinters([]);
      }
    } catch (err) {
      console.error("Unexpected error in loadEquipmentData:", err);
      setPrinters([]);
    } finally {
      setLoadingPrinters(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const b = await catalogsApi.getBrands();
        setBrands(b || []);
        // TODO: Load product types when API is available
        // const pt = await catalogsApi.getProductTypes();
        // setProductTypes(pt || []);
      } catch (err) {
        console.error(err);
      }
    };
    load();
    loadEquipmentData();
  }, [loadEquipmentData]);

  const changePrinter = async (printerName: string) => {
    try {
      localStorage.setItem("selectedPrinter", printerName);
      setCurrentPrinter(printerName);
      notifySuccess("Impresora predeterminada actualizada");
    } catch (err) {
      notifyError("Error al cambiar impresora");
    }
  };

  const testPrinter = async () => {
    if (!currentPrinter) {
      notifyError("Selecciona una impresora primero");
      return;
    }

    try {
      const winServiceUrl =
        process.env.REACT_APP_WIN_SERVICE_URL || "http://localhost:5005";
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(
        `${winServiceUrl}/api/printer/test?printerName=${encodeURIComponent(
          currentPrinter
        )}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        notifySuccess("Test de impresora ejecutado correctamente");
      } else {
        const errorText = await response
          .text()
          .catch(() => "Error desconocido");
        notifyError(
          `Error en el test de impresora: ${response.status} - ${errorText}`
        );
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        notifyError("Timeout: el test de impresora tardó demasiado (5s)");
      } else if (
        err.message.includes("Failed to fetch") ||
        err.code === "ECONNREFUSED"
      ) {
        notifyError(
          "Servicio de impresoras no disponible. Verifica que esté ejecutándose en el puerto 5005."
        );
      } else {
        notifyError(`Error al ejecutar test de impresora: ${err.message}`);
      }
    }
  };

  const createProductType = async () => {
    if (!productCompany || !productModel.trim()) {
      notifyError("Complete todos los campos requeridos");
      return;
    }
    if (minInventoryThreshold < 0) {
      notifyError("El umbral de inventario mínimo debe ser mayor o igual a 0");
      return;
    }
    try {
      // TODO: Implement API call when backend is ready
      // await catalogsApi.createProductType({
      //   company: productCompany,
      //   model: productModel.trim(),
      //   minInventoryThreshold
      // });
      // const pt = await catalogsApi.getProductTypes();
      // setProductTypes(pt || []);
      // setProductCompany('');
      // setProductModel('');
      // setMinInventoryThreshold(0);
      // notifySuccess('Tipo de producto creado exitosamente');

      // Temporary: Show success message (remove when API is implemented)
      notifySuccess(
        "Tipo de producto creado exitosamente (API pendiente de implementación)"
      );
      setProductCompany("");
      setProductModel("");
      setMinInventoryThreshold(0);
    } catch (err: any) {
      notifyError(
        err.response?.data?.error || "Error al crear el tipo de producto"
      );
    }
  };

  const deleteProductType = async (id: string) => {
    if (!window.confirm("¿Eliminar tipo de producto?")) return;
    try {
      // TODO: Implement API call when backend is ready
      // await catalogsApi.deleteProductType(id);
      // const pt = await catalogsApi.getProductTypes();
      // setProductTypes(pt || []);
      notifySuccess(
        "Tipo de producto eliminado (API pendiente de implementación)"
      );
    } catch (err: any) {
      notifyError(
        err.response?.data?.error || "Error al eliminar el tipo de producto"
      );
    }
  };

  const handleError = (message: string) => {
    notifyError(message);
  };

  const handleSuccess = (message: string) => {
    notifySuccess(message);
  };

  return (
    <Page>
      <Navigation />
      <Container>
        <Header>
          <Title>Configuración</Title>
          <Tabs>
            <TabButton
              active={tab === "franchises"}
              onClick={() => setTab("franchises")}
            >
              Franquicias
            </TabButton>
            <TabButton
              active={tab === "product-types"}
              onClick={() => setTab("product-types")}
            >
              Tipo de producto
            </TabButton>
            <TabButton
              active={tab === "equipment"}
              onClick={() => setTab("equipment")}
            >
              Configuración del equipo
            </TabButton>
          </Tabs>
        </Header>

        {tab === "franchises" && (
          <Card>
            <FranchiseManager onError={handleError} onSuccess={handleSuccess} />
          </Card>
        )}

        {tab === "product-types" && (
          <Card>
            <h3>Tipo de producto</h3>
            <FormRow>
              <Select
                value={productCompany}
                onChange={(e) => setProductCompany(e.target.value)}
                style={{ flex: 1 }}
              >
                <option value="">-- Seleccione empresa --</option>
                {brands.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </FormRow>
            <FormRow>
              <Input
                placeholder="Modelo específico (ej: Galaxy S25, Redmi Note 13)"
                value={productModel}
                onChange={(e) => setProductModel(e.target.value)}
              />
            </FormRow>
            <FormRow>
              <Input
                type="number"
                placeholder="Umbral mínimo de inventario"
                value={minInventoryThreshold || ""}
                onChange={(e) =>
                  setMinInventoryThreshold(parseInt(e.target.value) || 0)
                }
                min="0"
              />
              <Small style={{ marginLeft: "8px", alignSelf: "center" }}>
                Se notificará cuando el stock baje de este valor
              </Small>
            </FormRow>
            <FormRow>
              <Button onClick={createProductType}>Crear</Button>
            </FormRow>
            <List style={{ marginTop: "16px" }}>
              {productTypes.length === 0 ? (
                <ListItem>
                  <Small>No hay tipos de producto registrados</Small>
                </ListItem>
              ) : (
                productTypes.map((pt: any) => (
                  <ListItem key={pt._id}>
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {pt.companyName || pt.company} - {pt.model}
                      </div>
                      <Small>Umbral mínimo: {pt.minInventoryThreshold}</Small>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Button variant="secondary" onClick={() => {}}>
                        Editar
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => deleteProductType(pt._id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </ListItem>
                ))
              )}
            </List>
          </Card>
        )}

        {tab === "equipment" && (
          <Card>
            <h3 style={{ marginBottom: "20px", color: "#2c3e50" }}>
              Configuración del equipo
            </h3>

            <div style={{ marginBottom: "24px" }}>
              <div
                style={{
                  marginBottom: "8px",
                  fontWeight: "500",
                  color: "#2c3e50",
                }}
              >
                Impresora predeterminada
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                  marginTop: "8px",
                }}
              >
                <select
                  value={currentPrinter}
                  onChange={(e) => changePrinter(e.target.value)}
                  disabled={loadingPrinters}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    backgroundColor: loadingPrinters ? "#f3f4f6" : "white",
                    fontSize: "14px",
                    minWidth: "200px",
                  }}
                >
                  <option value="">
                    {loadingPrinters
                      ? "Cargando impresoras..."
                      : "Seleccionar impresora..."}
                  </option>
                  {Array.isArray(printers) &&
                    printers.map((printer) => (
                      <option
                        key={printer.name || printer}
                        value={printer.name || printer}
                      >
                        {printer.name || printer}{" "}
                        {printer.isDefault ? "(Por defecto del sistema)" : ""}
                      </option>
                    ))}
                </select>
                <Button
                  onClick={testPrinter}
                  disabled={!currentPrinter || loadingPrinters}
                  variant="secondary"
                >
                  {loadingPrinters ? "Cargando..." : "Probar impresora"}
                </Button>
              </div>
              {currentPrinter && (
                <Small style={{ marginTop: "8px", color: "#6b7280" }}>
                  Impresora actual: {currentPrinter}
                </Small>
              )}
            </div>

            <div style={{ marginBottom: "24px" }}>
              <Button
                onClick={loadEquipmentData}
                disabled={loadingPrinters}
                variant="secondary"
                style={{ marginRight: "12px" }}
              >
                {loadingPrinters
                  ? "Actualizando..."
                  : "Actualizar lista de impresoras"}
              </Button>
            </div>
          </Card>
        )}
      </Container>
    </Page>
  );
};

export default ConfigurationPage;
