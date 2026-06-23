export class Producto {
  
  constructor({ id, sku, nombre, marca, categoria, precio, precioOriginal, descuento, envioGratis, stock, color, imagen, destacado, especificaciones }) {
    this.id = id;
    this.sku = sku;
    this.nombre = nombre;
    this.marca = marca;
    this.categoria = categoria;
    this.precio = Number(precio);
    this.precioOriginal = Number(precioOriginal);
    this.descuento = Number(descuento);
    this.envioGratis = Boolean(envioGratis);
    this.stock = Number(stock);
    this.color = color;
    this.imagen = imagen;
    this.destacado = Boolean(destacado);
    this.especificaciones = especificaciones || {};
  }

  
  estaDisponible() {
    return this.stock > 0;
  }

  
  obtenerPrecioFormateado() {
    return `$${this.precio.toLocaleString('en-US')}`;
  }

  
  obtenerPrecioOriginalFormateado() {
    return this.descuento > 0 ? `$${this.precioOriginal.toLocaleString('en-US')}` : '';
  }

  
  reducirStock(cantidad = 1) {
    if (this.stock >= cantidad) {
      this.stock -= cantidad;
      return true; 
    }
    return false; 
  }
}