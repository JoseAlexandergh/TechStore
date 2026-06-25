// main.js — index.html
import { Producto }  from './classes/Producto.js';
import { Carrito }   from './classes/Carrito.js';
import { guardarEnLocalStorage, obtenerDeLocalStorage } from './modules/storage.js';
import { mostrarMensaje, inyectarBadge, actualizarBadgeCarrito } from './modules/ui.js';

function cargarCarrito() {
  const datos = obtenerDeLocalStorage('carritoTechStore') || [];
  const items = datos.map(d => ({
    producto: new Producto({
      id: d.producto.id, sku: d.producto.sku || '', nombre: d.producto.nombre,
      marca: d.producto.marca || '', categoria: d.producto.categoria || '',
      precio: Number(d.producto.precio),
      precioOriginal: Number(d.producto.precioOriginal || d.producto.precio),
      descuento: Number(d.producto.descuento || 0),
      envioGratis: Boolean(d.producto.envioGratis),
      stock: Number(d.producto.stock || 99),
      color: d.producto.color || '', imagen: d.producto.imagen || '',
      destacado: Boolean(d.producto.destacado), especificaciones: d.producto.especificaciones || {}
    }),
    cantidad: d.cantidad
  }));
  const c = new Carrito([]);
  c.items = items;
  return c;
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('TechStore iniciado.');
  inyectarBadge();

  // Botones "Añadir al carrito" del index — leen data-* del elemento
  document.querySelectorAll('[data-id][data-nombre][data-precio]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();

      const prod = new Producto({
        id:             parseInt(btn.dataset.id),
        sku:            '',
        nombre:         btn.dataset.nombre,
        marca:          '',
        categoria:      btn.dataset.categoria || '',
        precio:         parseFloat(btn.dataset.precio),
        precioOriginal: parseFloat(btn.dataset.precio),
        descuento:      0,
        envioGratis:    false,
        stock:          99,
        color:          '',
        imagen:         btn.dataset.imagen || '',
        destacado:      false,
        especificaciones: {}
      });

      const carrito = cargarCarrito();  // leer estado actual del localStorage
      carrito.agregar(prod);
      guardarEnLocalStorage('carritoTechStore', carrito.items);
      actualizarBadgeCarrito();
      mostrarMensaje(`"${prod.nombre}" añadido al carrito`, 'success');
    });
  });
});