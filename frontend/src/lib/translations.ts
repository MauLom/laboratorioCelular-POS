// Mapeos de traducción para mostrar valores al usuario en español
// Los valores en la BD se mantienen en inglés, pero se traducen para la UI

export const stateTranslations = {
  'New': 'Nuevo',
  'Repair': 'En Reparación',
  'Repaired': 'Reparado',
  'Sold': 'Vendido',
  'Lost': 'Perdido',
  'Clearance': 'Liquidación'
} as const;

export const descriptionTranslations = {
  'Fair': 'Feria',
  'Payment': 'Pago',
  'Sale': 'Venta',
  'Deposit': 'Depósito'
} as const;

export const financeTranslations = {
  'Payjoy': 'Payjoy',
  'Lespago': 'Lespago',
  'Repair': 'Reparación',
  'Accessory': 'Accesorio',
  'Cash': 'Efectivo',
  'Sale': 'Venta Contado',
  'Other': 'Otro'
} as const;

export const concept = {
  'Parciality': 'Parcialidad',
} as const;


// Funciones helper para traducir
export const translateState = (state: string): string => {
  return stateTranslations[state as keyof typeof stateTranslations] || state;
};

export const translateDescription = (description: string): string => {
  return descriptionTranslations[description as keyof typeof descriptionTranslations] || description;
};

export const translateFinance = (finance: string): string => {
  return financeTranslations[finance as keyof typeof financeTranslations] || finance;
};

export const translateConcept = (conceptKey: string): string => {
  return concept[conceptKey as keyof typeof concept] || conceptKey;
}

// Función para obtener todas las traducciones (útil para búsquedas)
export const getAllTranslations = () => ({
  states: stateTranslations,
  descriptions: descriptionTranslations,
  finances: financeTranslations,
  concepts: concept
});