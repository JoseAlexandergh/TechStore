export class Cliente {
  
  constructor({ nombre = '', email = '', telefono = '', direccion = '' } = {}) {
    this.nombre = nombre.trim();
    this.email = email.trim();
    this.telefono = telefono.trim();
    this.direccion = direccion.trim();
  }

  
  generarNumeroOrden() {
    
    const codigoAleatorio = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${codigoAleatorio}`;
  }

  
  tieneDatosValidos() {
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return (
      this.nombre.length >= 3 &&
      emailRegex.test(this.email) &&
      this.direccion.length >= 5
    );
  }

  
  obtenerDatosEnvio() {
    return {
      destinatario: this.nombre,
      contacto: this.telefono || 'No especificado',
      destino: this.direccion
    };
  }
}