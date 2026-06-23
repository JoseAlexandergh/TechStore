// api.js — Fetch de productos desde JSON local
export const obtenerProductosDesdeAPI = async () => {
  try {
    const response = await fetch('./js/data/productos.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('[API]', error);
    return [];
  }
};