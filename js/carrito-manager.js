import { Carrito } from './classes/Carrito.js';
import { obtenerDeLocalStorage } from './modules/storage.js';

const itemsGuardados = obtenerDeLocalStorage('carritoTechStore');
const miCarrito = new Carrito(itemsGuardados);

function renderizarCarrito() {
  const tbody = document.getElementById('carrito-body');
  const tfoot = document.getElementById('carrito-footer');

  if (miCarrito.items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4">Tu carrito está vacío.</td></tr>';
    return;
  }

  
  tbody.innerHTML = miCarrito.items.map(item => `
    <tr>
      <td>${item.producto.nombre}</td>
      <td>${item.cantidad}</td>
      <td>${item.producto.obtenerPrecioFormateado()}</td>
      <td>$${(item.producto.precio * item.cantidad).toLocaleString()}</td>
    </tr>
  `).join('');

  
  tfoot.innerHTML = `
    <tr>
      <td colspan="3" align="right"><strong>Subtotal:</strong></td>
      <td>$${miCarrito.obtenerSubtotal().toLocaleString()}</td>
    </tr>
    <tr>
      <td colspan="3" align="right"><strong>Impuestos (18%):</strong></td>
      <td>$${miCarrito.obtenerImpuestos().toLocaleString()}</td>
    </tr>
    <tr>
      <td colspan="3" align="right"><strong>Total:</strong></td>
      <td><strong>$${miCarrito.obtenerTotal().toLocaleString()}</strong></td>
    </tr>
  `;
}

document.addEventListener('DOMContentLoaded', renderizarCarrito);