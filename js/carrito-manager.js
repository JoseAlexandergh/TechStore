// carrito-manager.js — Vista del carrito (carrito.html)
import { Carrito } from './classes/Carrito.js';
import { obtenerDeLocalStorage, guardarEnLocalStorage } from './modules/storage.js';
import { mostrarMensaje, actualizarBadgeCarrito, inyectarBadge } from './modules/ui.js';

const miCarrito = new Carrito(obtenerDeLocalStorage('carritoTechStore') || []);

// ── Render tabla ─────────────────────────────────────────────
function renderizarCarrito() {
  const secVacia = document.getElementById('carrito-vacio');
  const secTabla = document.getElementById('carrito-tabla');
  const tbody    = document.getElementById('carrito-body');
  const tfoot    = document.getElementById('carrito-footer');

  if (!tbody) return;

  if (miCarrito.items.length === 0) {
    if (secVacia) secVacia.style.display = 'block';
    if (secTabla) secTabla.style.display = 'none';
    actualizarResumen();
    return;
  }

  if (secVacia) secVacia.style.display = 'none';
  if (secTabla) secTabla.style.display = 'block';

  // forEach para recorrer items
  tbody.innerHTML = '';
  miCarrito.items.forEach(item => {
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          <img src="${item.producto.imagen}" alt="${item.producto.nombre}"
               width="55" height="45" style="object-fit:contain;border-radius:6px;"
               onerror="this.src='img/placeholder.jpg'">
          <span>${item.producto.nombre}</span>
        </div>
      </td>
      <td>
        <div style="display:flex;align-items:center;gap:6px;">
          <button class="btn-cant" data-accion="restar" data-id="${item.producto.id}"
            style="width:28px;height:28px;border-radius:6px;padding:0;font-size:1rem;cursor:pointer;background:linear-gradient(to right,#1E3A8A,#2563EB);color:#fff;border:none;">−</button>
          <span style="min-width:24px;text-align:center;font-weight:600;">${item.cantidad}</span>
          <button class="btn-cant" data-accion="sumar" data-id="${item.producto.id}"
            style="width:28px;height:28px;border-radius:6px;padding:0;font-size:1rem;cursor:pointer;background:linear-gradient(to right,#1E3A8A,#2563EB);color:#fff;border:none;">+</button>
        </div>
      </td>
      <td>${item.producto.obtenerPrecioFormateado()}</td>
      <td><strong>$${(item.producto.precio * item.cantidad).toLocaleString('es-DO')}</strong></td>
      <td>
        <button class="btn-eliminar" data-id="${item.producto.id}"
          style="background:#EF4444;color:#fff;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:0.8rem;">
          🗑
        </button>
      </td>
    `;
    tbody.appendChild(fila);
  });

  // Botones cantidad
  document.querySelectorAll('.btn-cant').forEach(btn => {
    btn.addEventListener('click', () => {
      const id     = parseInt(btn.dataset.id);
      const accion = btn.dataset.accion;
      const item   = miCarrito.items.find(i => i.producto.id === id);
      if (!item) return;
      const nueva = accion === 'sumar' ? item.cantidad + 1 : item.cantidad - 1;
      miCarrito.actualizarCantidad(id, nueva);
      guardarEnLocalStorage('carritoTechStore', miCarrito.items);
      actualizarBadgeCarrito();
      renderizarCarrito();
    });
  });

  // Botones eliminar
  document.querySelectorAll('.btn-eliminar').forEach(btn => {
    btn.addEventListener('click', () => {
      miCarrito.eliminar(parseInt(btn.dataset.id));
      guardarEnLocalStorage('carritoTechStore', miCarrito.items);
      actualizarBadgeCarrito();
      renderizarCarrito();
      mostrarMensaje('Producto eliminado', 'info');
    });
  });

  // Tfoot
  if (tfoot) {
    tfoot.innerHTML = `
      <tr>
        <td colspan="3" style="text-align:right;"><strong>Subtotal:</strong></td>
        <td>$${miCarrito.obtenerSubtotal().toLocaleString('es-DO')}</td>
        <td></td>
      </tr>
      <tr>
        <td colspan="3" style="text-align:right;color:#6B7280;">ITBIS (18%):</td>
        <td style="color:#6B7280;">$${miCarrito.obtenerImpuestos().toLocaleString('es-DO', {maximumFractionDigits:2})}</td>
        <td></td>
      </tr>
      <tr>
        <td colspan="3" style="text-align:right;"><strong>Total:</strong></td>
        <td><strong style="color:#1E3A8A;font-size:1.05rem;">$${miCarrito.obtenerTotal().toLocaleString('es-DO', {maximumFractionDigits:2})}</strong></td>
        <td></td>
      </tr>
    `;
  }

  actualizarResumen();
}

// ── Progreso y meter ─────────────────────────────────────────
function actualizarResumen() {
  const subtotal = miCarrito.obtenerSubtotal();

  // Progreso: 0 items = paso 1, hasta 4
  const progress = document.querySelector('progress');
  if (progress) {
    // while loop para calcular paso
    let paso = 1;
    const umbrales = [0, 200, 1000, 3000];
    let i = 0;
    while (i < umbrales.length) {
      if (subtotal >= umbrales[i]) paso = i + 1;
      i++;
    }
    progress.value = miCarrito.items.length === 0 ? 0 : paso;
  }

  const meter = document.querySelector('meter');
  if (meter) meter.value = subtotal;
}

// ── Botón vaciar ─────────────────────────────────────────────
function conectarBotones() {
  const btnVaciar = document.getElementById('btn-vaciar-carrito');
  if (btnVaciar) {
    btnVaciar.addEventListener('click', () => {
      if (miCarrito.items.length === 0) { mostrarMensaje('El carrito ya está vacío', 'info'); return; }
      miCarrito.vaciar();
      guardarEnLocalStorage('carritoTechStore', miCarrito.items);
      actualizarBadgeCarrito();
      renderizarCarrito();
      mostrarMensaje('Carrito vaciado', 'info');
    });
  }

  // Proceder al pago — PROBLEMA 3 solucionado
  const formPago = document.querySelector('form[id="form-pago"]');
  if (formPago) {
    formPago.addEventListener('submit', e => {
      e.preventDefault();
      if (miCarrito.items.length === 0) { mostrarMensaje('Tu carrito está vacío', 'error'); return; }
      mostrarDialogCompra();
    });
  }
}

// ── Dialog de compra exitosa ─────────────────────────────────
function mostrarDialogCompra() {
  const numeroOrden = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
  const total = miCarrito.obtenerTotal();

  let dialog = document.getElementById('dialog-compra');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'dialog-compra';
    dialog.style.cssText = 'border:none;border-radius:16px;padding:0;max-width:400px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);font-family:Poppins,sans-serif;';
    document.body.appendChild(dialog);
  }
  dialog.innerHTML = `
    <div style="background:linear-gradient(135deg,#1E3A8A,#2563EB);padding:24px;border-radius:16px 16px 0 0;text-align:center;color:white;">
      <div style="font-size:3rem;margin-bottom:8px;">✔</div>
      <h2 style="margin:0;">¡Compra realizada con éxito!</h2>
    </div>
    <div style="padding:24px;text-align:center;">
      <p>Número de orden: <strong style="color:#1E3A8A;">${numeroOrden}</strong></p>
      <p>Total: <strong>$${total.toLocaleString('es-DO', {maximumFractionDigits:2})}</strong></p>
      <p style="color:#6B7280;font-size:0.85rem;">Fecha: ${new Date().toLocaleDateString('es-DO')}</p>
      <button onclick="document.getElementById('dialog-compra').close()"
        style="margin-top:16px;background:linear-gradient(to right,#1E3A8A,#2563EB);color:white;border:none;padding:12px 28px;border-radius:8px;font-weight:600;cursor:pointer;font-family:Poppins,sans-serif;">
        Aceptar
      </button>
    </div>
  `;
  dialog.showModal();

  // Vaciar carrito después de compra
  miCarrito.vaciar();
  guardarEnLocalStorage('carritoTechStore', miCarrito.items);
  actualizarBadgeCarrito();
  renderizarCarrito();
}

document.addEventListener('DOMContentLoaded', () => {
  inyectarBadge();
  renderizarCarrito();
  conectarBotones();
});