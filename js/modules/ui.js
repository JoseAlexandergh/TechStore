export const limpiarContenedor = (id) => {
  const container = document.getElementById(id);
  if (container) container.innerHTML = '';
};

export const mostrarMensaje = (mensaje, tipo = 'info') => {
  console.log(`[${tipo.toUpperCase()}]: ${mensaje}`);
  
  alert(mensaje); 
};