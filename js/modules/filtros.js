export const filtrarProductos = (productos, criterios) => {
  return productos.filter(prod => {
    const coincideMarca = criterios.marca ? prod.marca === criterios.marca : true;
    const coincidePrecio = criterios.maxPrecio ? prod.precio <= criterios.maxPrecio : true;
    
    return coincideMarca && coincidePrecio;
  });
};