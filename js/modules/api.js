export const obtenerProductosDesdeAPI = async () => {
  try {
    const response = await fetch('./data/productos.json');
    if (!response.ok) throw new Error('Error al conectar con la base de datos');
    return await response.json();
  } catch (error) {
    console.error("Fallo en la carga de datos:", error);
    return [];
  }
};