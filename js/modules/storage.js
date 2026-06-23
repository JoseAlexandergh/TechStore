export const guardarEnLocalStorage = (clave, valor) => {
  
  localStorage.setItem(clave, JSON.stringify(valor));
};

export const obtenerDeLocalStorage = (clave) => {
  const dato = localStorage.getItem(clave);
  
  return dato ? JSON.parse(dato) : [];
};

export const eliminarDeLocalStorage = (clave) => {
  localStorage.removeItem(clave);
};