export const validarFormulario = (datos) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  const errores = [];
  if (datos.nombre.length < 3) errores.push("El nombre es muy corto.");
  if (!emailRegex.test(datos.email)) errores.push("El email no es válido.");
  
  return {
    valido: errores.length === 0,
    errores
  };
};