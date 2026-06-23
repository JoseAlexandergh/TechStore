export const formatearMoneda = (valor) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(valor);
};


export const generarID = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};