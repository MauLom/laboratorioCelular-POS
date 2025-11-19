import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import Navigation from '../components/common/Navigation';
import { catalogsApi, usersApi, configurationsApi } from '../services/api';
import FranchiseManager from '../components/configuration/FranchiseManager';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';

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

const ToggleSwitch = styled.label<{ checked: boolean }>`
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: ${p => p.checked ? '#3498db' : '#ccc'};
    transition: .4s;
    border-radius: 24px;
    &:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
      transform: ${p => p.checked ? 'translateX(26px)' : 'translateX(0)'};
    }
  }
`;

const RoleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f1f1f1;
  &:last-child {
    border-bottom: none;
  }
`;

const RoleName = styled.div`
  font-weight: 500;
  color: #2c3e50;
`;

const ConfigurationPage: React.FC = () => {
  const { notifySuccess, notifyError } = useNotification();
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState<'franchises'  | "product-types"  | 'brands' | 'characteristics' | 'equipment' | 'cashModal'>('franchises');


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

  // Cash Modal configuration states
  const [roles, setRoles] = useState<string[]>([]);
  const [cashModalRoles, setCashModalRoles] = useState<Set<string>>(new Set());
  const [loadingCashModal, setLoadingCashModal] = useState<boolean>(false);

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

  const loadCashModalConfig = useCallback(async () => {
    if (!isAdmin()) return;
    
    setLoadingCashModal(true);
    try {
      // Load roles
      const uniqueRoles = await usersApi.getUniqueRoles();
      setRoles(uniqueRoles);

      // Load configuration
      try {
        const config = await configurationsApi.getByKey('cash_modal_roles');
        if (config && config.values) {
          const enabledRoles = new Set<string>();
          config.values.forEach((v: any) => {
            if (v.isActive !== false) {
              enabledRoles.add(v.value);
            }
          });
          setCashModalRoles(enabledRoles);
        } else {
          // Default: all roles except admin roles
          const defaultRoles = new Set(uniqueRoles.filter(role => 
            !['Supervisor de sucursales', 'Supervisor de oficina', 'Master admin'].includes(role)
          ));
          setCashModalRoles(defaultRoles);
        }
      } catch (err: any) {
        // Configuration doesn't exist yet, use defaults
        const defaultRoles = new Set(uniqueRoles.filter(role => 
          !['Supervisor de sucursales', 'Supervisor de oficina', 'Master admin'].includes(role)
        ));
        setCashModalRoles(defaultRoles);
      }
    } catch (err: any) {
      console.error('Error loading cash modal config:', err);
      notifyError('Error al cargar configuración de modal de caja');
    } finally {
      setLoadingCashModal(false);
    }
  }, [isAdmin, notifyError]);

  const saveCashModalConfig = async () => {
    if (!isAdmin()) {
      notifyError('No tienes permisos para modificar esta configuración');
      return;
    }

    setLoadingCashModal(true);
    try {
      const values = roles.map(role => ({
        value: role,
        label: role,
        isActive: cashModalRoles.has(role)
      }));

      await configurationsApi.createOrUpdate({
        key: 'cash_modal_roles',
        name: 'Roles que reciben el modal de Abrir Caja',
        description: 'Configuración de qué roles de usuario deben recibir el modal de "Abrir Caja" al ingresar a la plataforma',
        values
      });

      notifySuccess('Configuración guardada exitosamente');
    } catch (err: any) {
      console.error('Error saving cash modal config:', err);
      notifyError(err.response?.data?.error || 'Error al guardar la configuración');
    } finally {
      setLoadingCashModal(false);
    }
  };

  const toggleCashModalRole = (role: string) => {
    const newSet = new Set(cashModalRoles);
    if (newSet.has(role)) {
      newSet.delete(role);
    } else {
      newSet.add(role);
    }
    setCashModalRoles(newSet);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const b = await catalogsApi.getBrands();
        setBrands(b || []);
        const pt = await catalogsApi.getProductTypes();
        setProductTypes(pt || []);
      } catch (err) {
        console.error(err);
      }
    };
    load();
    loadEquipmentData();
    loadCashModalConfig();
  }, [loadEquipmentData, loadCashModalConfig]);

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
    console.log('createProductType called', { productCompany, productModel, minInventoryThreshold });
    
    if (!productCompany || !productModel.trim()) {
      notifyError("Complete todos los campos requeridos");
      return;
    }
    if (minInventoryThreshold < 0) {
      notifyError("El umbral de inventario mínimo debe ser mayor o igual a 0");
      return;
    }
    try {
      console.log('Calling API with:', {
        company: productCompany,
        model: productModel.trim(),
        minInventoryThreshold: minInventoryThreshold || 0
      });
      
      await catalogsApi.createProductType({
        company: productCompany,
        model: productModel.trim(),
        minInventoryThreshold: minInventoryThreshold || 0
      });
      
      console.log('Product type created successfully');
      const pt = await catalogsApi.getProductTypes();
      setProductTypes(pt || []);
      setProductCompany("");
      setProductModel("");
      setMinInventoryThreshold(0);
      notifySuccess("Tipo de producto creado exitosamente");
    } catch (err: any) {
      console.error('Error creating product type:', err);
      notifyError(
        err.response?.data?.error || "Error al crear el tipo de producto"
      );
    }
  };

  const deleteProductType = async (id: string) => {
    if (!window.confirm("¿Eliminar tipo de producto?")) return;
    try {
      await catalogsApi.deleteProductType(id);
      const pt = await catalogsApi.getProductTypes();
      setProductTypes(pt || []);
      notifySuccess("Tipo de producto eliminado exitosamente");
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
            <TabButton active={tab === 'franchises'} onClick={() => setTab('franchises')}>Franquicias</TabButton>
            <TabButton active={tab === 'brands'} onClick={() => setTab('brands')}>Marcas</TabButton>
            <TabButton active={tab === 'characteristics'} onClick={() => setTab('characteristics')}>Características</TabButton>
            <TabButton active={tab === 'equipment'} onClick={() => setTab('equipment')}>Configuración del equipo</TabButton>
            {isAdmin() && (
              <TabButton active={tab === 'cashModal'} onClick={() => {
                setTab('cashModal');
                loadCashModalConfig();
              }}>Modal de Caja</TabButton>
            )}
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
              <Button 
                type="button" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  createProductType();
                }}
              >
                Crear
              </Button>
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
                        {pt.company?.name || pt.companyName || "N/A"} - {pt.model}
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

        {tab === 'cashModal' && isAdmin() && (
          <Card>
            <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>Configuración del Modal de Caja</h3>
            <p style={{ marginBottom: '20px', color: '#7f8c8d', fontSize: '14px' }}>
              Selecciona qué roles de usuario deben recibir el modal de "Abrir Caja" al ingresar a la plataforma.
            </p>
            
            {loadingCashModal ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#7f8c8d' }}>
                Cargando configuración...
              </div>
            ) : (
              <>
                <List>
                  {roles.map(role => (
                    <RoleRow key={role}>
                      <RoleName>{role}</RoleName>
                      <ToggleSwitch checked={cashModalRoles.has(role)}>
                        <input
                          type="checkbox"
                          checked={cashModalRoles.has(role)}
                          onChange={() => toggleCashModalRole(role)}
                        />
                        <span className="slider" />
                      </ToggleSwitch>
                    </RoleRow>
                  ))}
                </List>
                
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <Button 
                    variant="secondary" 
                    onClick={loadCashModalConfig}
                    disabled={loadingCashModal}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={saveCashModalConfig}
                    disabled={loadingCashModal}
                  >
                    {loadingCashModal ? 'Guardando...' : 'Guardar configuración'}
                  </Button>
                </div>
              </>
            )}
          </Card>
        )}
      </Container>
    </Page>
  );
};

export default ConfigurationPage;
