export const getUserRole = (): string => {
  return localStorage.getItem("userRole") || localStorage.getItem("role") || "";
};

export const isAdmin = () => ["Master admin", "Administrador", "Supervisor"].includes(getUserRole());
export const isReparto = () => getUserRole() === "Reparto";
export const isVentas = () => ["Vendedor", "Cajero"].includes(getUserRole());