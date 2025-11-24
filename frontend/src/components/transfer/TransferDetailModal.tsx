import React, { useEffect, useState } from "react";
import {
  getTransferById,
  markCourierReceived,
  storeScan,
} from "../../services/transfers";
import { useAuth } from "../../contexts/AuthContext";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transferId: string | null;
  onUpdated?: () => void;
}

const API_URL = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/$/, "");

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  padding: "28px 36px",
  width: "640px",
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
  position: "relative",
  fontFamily: "'Inter', system-ui, sans-serif",
};

const closeBtnStyle: React.CSSProperties = {
  position: "absolute",
  top: 10,
  right: 16,
  fontSize: 22,
  cursor: "pointer",
  border: "none",
  background: "transparent",
  color: "#555",
};

const btnGreen = {
  background: "#28a745",
  color: "white",
  border: "none",
  borderRadius: 6,
  padding: "5px 10px",
  cursor: "pointer",
};

const btnRed = {
  background: "#dc3545",
  color: "white",
  border: "none",
  borderRadius: 6,
  padding: "5px 10px",
  cursor: "pointer",
};

const btnBlue = {
  background: "#007bff",
  color: "white",
  border: "none",
  borderRadius: 6,
  padding: "8px 16px",
  cursor: "pointer",
};

function formatStatus(status: string) {
  if (!status) return "-";
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

const TransferDetailModal: React.FC<Props> = ({
  isOpen,
  onClose,
  transferId,
  onUpdated,
}) => {
  const [transfer, setTransfer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!isOpen || !transferId) return;
    setLoading(true);
    getTransferById(transferId)
      .then((data) => {
        setTransfer(data);
      })
      .finally(() => setLoading(false));
  }, [isOpen, transferId]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const isReparto = user?.role === "Reparto";

  const handleMarkOne = async (itemId: string, received: boolean) => {
    try {
      const body = received
        ? { receivedItemId: itemId }
        : { notReceivedItemId: itemId };
      await markCourierReceived(transfer._id, body);

      if (onUpdated) onUpdated();
      const updated = await getTransferById(transfer._id);
      setTransfer(updated);
    } catch (err: any) {
      alert("Error al actualizar reparto: " + err.message);
    }
  };

  const handleMarkAll = async (received: boolean) => {
    try {
      await markCourierReceived(transfer._id, {
        [received ? "allReceived" : "allNotReceived"]: true,
      });

      if (onUpdated) onUpdated();
      const updated = await getTransferById(transfer._id);
      setTransfer(updated);
    } catch (err: any) {
      alert("Error al actualizar reparto: " + err.message);
    }
  };

  const isSucursalUser =
    user?.role === "Vendedor" || user?.role === "Cajero";

  const [deviceBranch, setDeviceBranch] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (transfer?.toBranch) {
      setDeviceBranch(transfer.toBranch);
    }
  }, [isOpen, transfer]); 

  const isDestino =
    transfer?.toBranch &&
    deviceBranch &&
    transfer.toBranch.toLowerCase() === deviceBranch.toLowerCase();

  const canStoreConfirm = isSucursalUser && isDestino;

  const handleStoreOne = async (itemId: string, received: boolean) => {
    try {
      await storeScan(transfer._id, [
        {
          imei: transfer.items.find((x: any) => x._id === itemId)?.imei,
          status: received ? "recibido" : "no_recibido",
        },
      ]);

      if (onUpdated) onUpdated();
      const updated = await getTransferById(transfer._id);
      setTransfer(updated);
    } catch (err: any) {
      alert("Error al actualizar sucursal: " + err.message);
    }
  };

  const handleStoreAll = async (received: boolean) => {
    try {
      await storeScan(
        transfer._id,
        transfer.items.map((item: any) => ({
          imei: item.imei,
          status: received ? "recibido" : "no_recibido",
        }))
      );

      if (onUpdated) onUpdated();
      const updated = await getTransferById(transfer._id);
      setTransfer(updated);
    } catch (err: any) {
      alert("Error al actualizar sucursal: " + err.message);
    }
  };

  if (!isOpen) return null;

  const statusColor =
    transfer?.status?.includes("completado")
      ? "#28a745"
      : transfer?.status?.includes("pendiente")
      ? "#ffc107"
      : transfer?.status?.includes("no_recibido") ||
        transfer?.status?.includes("fallida")
      ? "#dc3545"
      : "#17a2b8";

  return (
    <div style={overlayStyle} onClick={handleOverlayClick}>
      <div style={modalStyle}>
        <div
          style={{
            height: 6,
            width: "100%",
            borderRadius: "8px 8px 0 0",
            background: statusColor,
            position: "absolute",
            top: 0,
            left: 0,
          }}
        ></div>

        <button style={closeBtnStyle} onClick={onClose}>
          ×
        </button>

        {loading ? (
          <p style={{ textAlign: "center" }}>Cargando...</p>
        ) : transfer ? (
          <>
            <h2 style={{ marginBottom: 16, fontSize: 22, fontWeight: 700 }}>
              Transferencia {transfer.code}
            </h2>

            <div style={{ marginBottom: 16, color: "#444", lineHeight: 1.6 }}>
              <p>
                <b>Origen:</b> {transfer.fromBranch}
              </p>
              <p>
                <b>Destino:</b> {transfer.toBranch}
              </p>
              <p>
                <b>Estado:</b>{" "}
                <span style={{ color: statusColor, fontWeight: 600 }}>
                  {formatStatus(transfer.status)}
                </span>
              </p>
            </div>

            {/* PANEL DE CONTROL SOLO PARA ADMIN */}
            {["Master admin", "Administrador", "Supervisor"].includes(
              user?.role ?? ""
            ) && (
              <div
                style={{
                  padding: "12px",
                  background: "#f7f7f7",
                  borderRadius: 8,
                  marginBottom: 20,
                  border: "1px solid #ddd",
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                <h3
                  style={{
                    fontSize: 16,
                    marginBottom: 10,
                    fontWeight: 600,
                  }}
                >
                  Panel de Control
                </h3>

                <p>
                  <b>Creado por:</b>{" "}
                  {transfer?.requestedBy
                    ? `${transfer.requestedBy.firstName ?? ""} ${
                        transfer.requestedBy.lastName ?? ""
                      } (${transfer.requestedBy.role ?? ""})`.trim()
                    : "—"}
                </p>

                <p>
                  <b>Repartidor asignado:</b>{" "}
                  {transfer?.assignedDeliveryUser
                    ? `${transfer.assignedDeliveryUser.firstName} ${transfer.assignedDeliveryUser.lastName}`
                    : "No asignado"}
                </p>

                <p>
                  <b>Recibido por sucursal:</b>{" "}
                  {transfer?.receivedBy
                    ? `${transfer.receivedBy.firstName} ${transfer.receivedBy.lastName}`
                    : "—"}
                </p>

                <p>
                  <b>Creado:</b>{" "}
                  {transfer?.createdAt
                    ? new Date(transfer.createdAt).toLocaleString()
                    : "(sin fecha)"}
                </p>

                <p>
                  <b>Última actualización:</b>{" "}
                  {transfer?.updatedAt
                    ? new Date(transfer.updatedAt).toLocaleString()
                    : "(sin fecha)"}
                </p>

                <hr style={{ margin: "10px 0" }} />

                <h4 style={{ fontSize: 15, marginBottom: 6 }}>
                  Movimientos por equipo:
                </h4>
                {transfer.items.map((item: any, i: number) => (
                  <div
                    key={i}
                    style={{
                      padding: "6px 10px",
                      background: "#fff",
                      borderRadius: 6,
                      border: "1px solid #ddd",
                      marginBottom: 8,
                    }}
                  >
                    <p>
                      <b>IMEI:</b> {item.imei}
                    </p>

                    <p>
                      <b>Reparto:</b>{" "}
                      {item.courier?.at
                        ? `${new Date(
                            item.courier.at ?? 0
                          ).toLocaleString()} por ${
                            item.courier?.by
                              ? `${item.courier.by.firstName ?? ""} ${
                                  item.courier.by.lastName ?? ""
                                }`.trim()
                              : "desconocido"
                          }`
                        : "Pendiente"}
                    </p>

                    <p>
                      <b>Sucursal:</b>{" "}
                      {item.store?.at
                        ? `${new Date(
                            item.store.at ?? 0
                          ).toLocaleString()} por ${
                            item.store?.by
                              ? `${item.store.by.firstName ?? ""} ${
                                  item.store.by.lastName ?? ""
                                }`.trim()
                              : "desconocido"
                          }`
                        : "Pendiente"}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: 10,
                fontSize: 14,
              }}
            >
              <thead>
                <tr style={{ background: "#f8f9fa" }}>
                  <th style={{ textAlign: "left", padding: "10px 8px" }}>
                    IMEI
                  </th>
                  <th style={{ textAlign: "left", padding: "10px 8px" }}>
                    Equipo
                  </th>
                  <th style={{ textAlign: "center", padding: "10px 8px" }}>
                    Reparto
                  </th>
                  <th style={{ textAlign: "center", padding: "10px 8px" }}>
                    Sucursal
                  </th>

                  {isReparto && (
                    <th style={{ textAlign: "center", padding: "10px 8px" }}>
                      Acción
                    </th>
                  )}

                  {canStoreConfirm && (
                    <th style={{ textAlign: "center", padding: "10px 8px" }}>
                      Acción Sucursal
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {transfer.items.map((item: any) => {
                  const courierStatus = item.courier?.status || "pendiente";
                  const storeStatus = item.store?.status || "pendiente";

                  return (
                    <tr
                      key={item._id}
                      style={{
                        borderBottom: "1px solid #e1e1e1",
                        background:
                          storeStatus === "recibido"
                            ? "#e9f9ee"
                            : storeStatus === "no_recibido"
                            ? "#fdeaea"
                            : "#fff",
                      }}
                    >
                      <td style={{ padding: 10 }}>{item.imei}</td>
                      <td style={{ padding: 10 }}>
                        {item.equipment?.brand} {item.equipment?.model}
                      </td>

                      <td style={{ textAlign: "center", padding: 10 }}>
                        {formatStatus(courierStatus)}
                      </td>

                      <td style={{ textAlign: "center", padding: 10 }}>
                        {formatStatus(storeStatus)}
                      </td>

                      {isReparto && (
                        <td style={{ textAlign: "center", padding: 10 }}>
                          {courierStatus === "recibido" ? (
                            <span style={{ color: "green", fontWeight: 600 }}>
                              ✅ Recibido
                            </span>
                          ) : courierStatus === "no_recibido" ? (
                            <span style={{ color: "red", fontWeight: 600 }}>
                              ❌ No recibido
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => handleMarkOne(item._id, true)}
                                style={{ ...btnGreen, marginRight: 6 }}
                              >
                                Recibido
                              </button>

                              <button
                                onClick={() => handleMarkOne(item._id, false)}
                                style={btnRed}
                              >
                                No recibido
                              </button>
                            </>
                          )}
                        </td>
                      )}

                      {canStoreConfirm && (
                        <td style={{ textAlign: "center", padding: 10 }}>
                          {storeStatus === "recibido" ? (
                            <span style={{ color: "green", fontWeight: 600 }}>
                              🏪 Recibido
                            </span>
                          ) : storeStatus === "no_recibido" ? (
                            <span style={{ color: "red", fontWeight: 600 }}>
                              🚫 No recibido
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => handleStoreOne(item._id, true)}
                                style={{ ...btnGreen, marginRight: 6 }}
                              >
                                Recibido
                              </button>

                              <button
                                onClick={() => handleStoreOne(item._id, false)}
                                style={btnRed}
                              >
                                No recibido
                              </button>
                            </>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {isReparto && (
              <div
                style={{
                  textAlign: "right",
                  marginTop: 24,
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                }}
              >
                <button onClick={() => handleMarkAll(true)} style={btnBlue}>
                  Recibir todos
                </button>
                <button onClick={() => handleMarkAll(false)} style={btnRed}>
                  Marcar todos como no recibidos
                </button>
              </div>
            )}

            {canStoreConfirm && (
              <div
                style={{
                  textAlign: "right",
                  marginTop: 24,
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                }}
              >
                <button onClick={() => handleStoreAll(true)} style={btnBlue}>
                  Recibir todos (Sucursal)
                </button>
                <button onClick={() => handleStoreAll(false)} style={btnRed}>
                  Marcar todos como no recibidos (Sucursal)
                </button>
              </div>
            )}
          </>
        ) : (
          <p>No se encontró la transferencia.</p>
        )}
      </div>
    </div>
  );
};

export default TransferDetailModal;