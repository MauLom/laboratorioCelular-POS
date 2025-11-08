// Servicio para leer POS.config y exponer appConfig globalmente

let appConfig: string | null = null;

export const loadPOSConfig = async (): Promise<string | null> => {
  try {
    const response = await fetch('/POS.config');
    if (!response.ok) throw new Error('No se pudo leer POS.config');
    const text = await response.text();
    // Buscar línea con appConfig=valor
    const match = text.match(/appConfig\s*=\s*([A-Za-z0-9_-]+)/);
    if (match) {
      appConfig = match[1];
      return appConfig;
    }
    return null;
  } catch (err) {
    console.error('Error leyendo POS.config:', err);
    return null;
  }
};

export const getAppConfig = (): string | null => appConfig;
