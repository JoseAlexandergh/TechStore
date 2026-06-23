// main.js — Script del INDEX (inicio)
import { Carrito } from './classes/Carrito.js';
import { guardarEnLocalStorage, obtenerDeLocalStorage } from './modules/storage.js';
import { mostrarMensaje, inyectarBadge, actualizarBadgeCarrito } from './modules/ui.js';
import { Producto } from './classes/Producto.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('TechStore iniciado correctamente.');
  inyectarBadge();

  // Botones "Añadir al carrito" del index con data attributes
  document.querySelectorAll('[data-id][data-nombre][data-precio]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();

      const miCarrito = new Carrito(obtenerDeLocalStorage('carritoTechStore') || []);

      const productoData = {
        id:           parseInt(btn.dataset.id),
        nombre:       btn.dataset.nombre,
        precio:       parseFloat(btn.dataset.precio),
        imagen:       btn.dataset.imagen ?? '',
        categoria:    btn.dataset.categoria ?? '',
        marca:        '',
        stock:        99,
        sku:          '',
        precioOriginal: parseFloat(btn.dataset.precio),
        descuento:    0,
        envioGratis:  false,
        color:        '',
        destacado:    false,
        especificaciones: {}
      };

      const prod = new Producto(productoData);
      miCarrito.agregar(prod);
      guardarEnLocalStorage('carritoTechStore', miCarrito.items);
      actualizarBadgeCarrito();
      mostrarMensaje(`"${prod.nombre}" añadido al carrito`, 'success');
    });
  });
});