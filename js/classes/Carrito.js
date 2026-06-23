export class Carrito {
  constructor(itemsIniciales = []) {
    
    this.items = itemsIniciales;
    this.tasaImpuesto = 0.18;  
  }

  
  agregar(producto, cantidad = 1) {
    
    const itemExistente = this.items.find(item => item.producto.id === producto.id);

    if (itemExistente) {
      itemExistente.cantidad += cantidad;
    } else {
      this.items.push({ producto, cantidad });
    }
  }

  
  eliminar(idProducto) {
    
    this.items = this.items.filter(item => item.producto.id !== Number(idProducto));
  }

  
  actualizarCantidad(idProducto, nuevaCantidad) {
    const cantidadNum = Number(nuevaCantidad);

    
    if (cantidadNum <= 0) {
      this.eliminar(idProducto);
      return;
    }

    
    this.items = this.items.map(item => {
      if (item.producto.id === Number(idProducto)) {
        return { ...item, cantidad: cantidadNum };
      }
      return item;
    });
  }

  
  vaciar() {
    this.items = [];
  }

  
  obtenerSubtotal() {
    return this.items.reduce((suma, item) => suma + (item.producto.precio * item.cantidad), 0);
  }

  
  obtenerImpuestos() {
    return this.obtenerSubtotal() * this.tasaImpuesto;
  }

  
  obtenerTotal() {
    return this.obtenerSubtotal() + this.obtenerImpuestos();
  }

  
  obtenerConteoTotal() {
    return this.items.reduce((conteo, item) => conteo + item.cantidad, 0);
  }
}