// carrito-manager.js — carrito.html
import { Producto }  from './classes/Producto.js';
import { Carrito }   from './classes/Carrito.js';
import { obtenerDeLocalStorage, guardarEnLocalStorage } from './modules/storage.js';
import { mostrarMensaje, actualizarBadgeCarrito, inyectarBadge } from './modules/ui.js';

// ── Reconstruir Carrito desde localStorage ────────────────────
// Los objetos guardados son planos; hay que volver a crear instancias de Producto
// para que los métodos (obtenerPrecioFormateado, etc.) estén disponibles.
function cargarCarrito() {
  const datos = obtenerDeLocalStorage('carritoTechStore') || [];
  const items = datos.map(d => ({
    producto: new Producto({
      id:             d.producto.id,
      sku:            d.producto.sku            || '',
      nombre:         d.producto.nombre,
      marca:          d.producto.marca          || '',
      categoria:      d.producto.categoria      || '',
      precio:         Number(d.producto.precio),
      precioOriginal: Number(d.producto.precioOriginal || d.producto.precio),
      descuento:      Number(d.producto.descuento      || 0),
      envioGratis:    Boolean(d.producto.envioGratis),
      stock:          Number(d.producto.stock   || 99),
      color:          d.producto.color          || '',
      imagen:         d.producto.imagen         || '',
      destacado:      Boolean(d.producto.destacado),
      especificaciones: d.producto.especificaciones || {}
    }),
    cantidad: d.cantidad
  }));
  const c = new Carrito([]);
  c.items = items;
  return c;
}

let miCarrito = cargarCarrito();

// ── Renderizar tabla ──────────────────────────────────────────
function renderizarCarrito() {
  const secVacia = document.getElementById('carrito-vacio');
  const secTabla = document.getElementById('carrito-tabla');
  const tbody    = document.getElementById('carrito-body');
  const tfoot    = document.getElementById('carrito-footer');

  if (!tbody) return;

  // Recargar siempre desde localStorage para que refleje cambios de otras páginas
  miCarrito = cargarCarrito();

  if (miCarrito.items.length === 0) {
    if (secVacia) secVacia.style.display = 'block';
    if (secTabla) secTabla.style.display = 'none';
    actualizarProgress(0);
    return;
  }

  if (secVacia) secVacia.style.display = 'none';
  if (secTabla) secTabla.style.display = 'block';

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
            style="width:28px;height:28px;border-radius:6px;padding:0;font-size:1.1rem;
                   cursor:pointer;background:linear-gradient(to right,#1E3A8A,#2563EB);
                   color:#fff;border:none;line-height:1;">−</button>
          <span style="min-width:28px;text-align:center;font-weight:600;">${item.cantidad}</span>
          <button class="btn-cant" data-accion="sumar" data-id="${item.producto.id}"
            style="width:28px;height:28px;border-radius:6px;padding:0;font-size:1.1rem;
                   cursor:pointer;background:linear-gradient(to right,#1E3A8A,#2563EB);
                   color:#fff;border:none;line-height:1;">+</button>
        </div>
      </td>
      <td>${item.producto.obtenerPrecioFormateado()}</td>
      <td><strong>$${(item.producto.precio * item.cantidad).toLocaleString('es-DO')}</strong></td>
      <td>
        <button class="btn-eliminar" data-id="${item.producto.id}"
          style="background:#EF4444;color:#fff;border:none;padding:6px 12px;
                 border-radius:6px;cursor:pointer;font-size:0.85rem;">🗑</button>
      </td>
    `;
    tbody.appendChild(fila);
  });

  // Listeners de cantidad
  document.querySelectorAll('.btn-cant').forEach(btn => {
    btn.addEventListener('click', () => {
      const id    = parseInt(btn.dataset.id);
      const item  = miCarrito.items.find(i => i.producto.id === id);
      if (!item) return;
      const nueva = btn.dataset.accion === 'sumar' ? item.cantidad + 1 : item.cantidad - 1;
      miCarrito.actualizarCantidad(id, nueva);
      guardarEnLocalStorage('carritoTechStore', miCarrito.items);
      actualizarBadgeCarrito();
      renderizarCarrito();
    });
  });

  // Listeners de eliminar
  document.querySelectorAll('.btn-eliminar').forEach(btn => {
    btn.addEventListener('click', () => {
      miCarrito.eliminar(parseInt(btn.dataset.id));
      guardarEnLocalStorage('carritoTechStore', miCarrito.items);
      actualizarBadgeCarrito();
      renderizarCarrito();
      mostrarMensaje('Producto eliminado del carrito', 'info');
    });
  });

  // Tfoot con subtotal, impuestos y total
  if (tfoot) {
    tfoot.innerHTML = `
      <tr>
        <td colspan="3" style="text-align:right;padding:10px 15px;"><strong>Subtotal:</strong></td>
        <td style="padding:10px 15px;">$${miCarrito.obtenerSubtotal().toLocaleString('es-DO')}</td>
        <td></td>
      </tr>
      <tr>
        <td colspan="3" style="text-align:right;color:#6B7280;">ITBIS (18%):</td>
        <td style="color:#6B7280;">$${miCarrito.obtenerImpuestos().toFixed(2)}</td>
        <td></td>
      </tr>
      <tr>
        <td colspan="3" style="text-align:right;"><strong>Total:</strong></td>
        <td><strong style="color:#1E3A8A;font-size:1.05rem;">
          $${miCarrito.obtenerTotal().toFixed(2)}
        </strong></td>
        <td></td>
      </tr>
    `;
  }

  // Barra de progreso dinámica según cantidad de items
  actualizarProgress(miCarrito.obtenerConteoTotal());
}

// ── Barra de progreso ─────────────────────────────────────────
// Paso 1 = vacío, 2 = 1-2 items, 3 = 3-5 items, 4 = 6+ items
function actualizarProgress(totalItems) {
  const progress = document.querySelector('progress');
  const meter    = document.querySelector('meter');

  if (progress) {
    let paso = 1;
    if      (totalItems === 0)          paso = 1;
    else if (totalItems <= 2)           paso = 2;
    else if (totalItems <= 5)           paso = 3;
    else                                paso = 4;
    progress.value = paso;
  }

  if (meter && miCarrito) {
    meter.value = miCarrito.obtenerSubtotal();
  }
}

// ── Botones de acción ─────────────────────────────────────────
function conectarBotones() {
  // Vaciar
  document.getElementById('btn-vaciar-carrito')?.addEventListener('click', () => {
    if (miCarrito.items.length === 0) {
      mostrarMensaje('El carrito ya está vacío', 'info');
      return;
    }
    miCarrito.vaciar();
    guardarEnLocalStorage('carritoTechStore', miCarrito.items);
    actualizarBadgeCarrito();
    renderizarCarrito();
    mostrarMensaje('Carrito vaciado', 'info');
  });

  // Proceder al pago
  document.getElementById('form-pago')?.addEventListener('submit', e => {
    e.preventDefault();
    miCarrito = cargarCarrito(); // asegurarse del estado actual
    if (miCarrito.items.length === 0) {
      mostrarMensaje('Tu carrito está vacío', 'error');
      return;
    }
    mostrarDialogCompra();
  });
}

// ── Dialog de compra exitosa ──────────────────────────────────
function mostrarDialogCompra() {
  const numeroOrden = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
  const total       = miCarrito.obtenerTotal();
  const fecha       = new Date().toLocaleDateString('es-DO');

  // Guardar en localStorage para que el perfil lo muestre
  guardarEnLocalStorage('techstore_ultimo_orden', {
    numero: numeroOrden,
    items:  miCarrito.items.map(i => ({
      producto: { nombre: i.producto.nombre },
      cantidad: i.cantidad
    })),
    total,
    fecha
  });

  let dialog = document.getElementById('dialog-compra');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'dialog-compra';
    dialog.style.cssText =
      'border:none;border-radius:16px;padding:0;max-width:400px;width:90%;' +
      'box-shadow:0 20px 60px rgba(0,0,0,0.3);font-family:Poppins,sans-serif;';
    document.body.appendChild(dialog);
  }

  dialog.innerHTML = `
    <div style="background:linear-gradient(135deg,#1E3A8A,#2563EB);padding:28px;
                border-radius:16px 16px 0 0;text-align:center;color:white;">
      <div style="font-size:3.5rem;margin-bottom:8px;">✅</div>
      <h2 style="margin:0;font-size:1.2rem;">¡Compra realizada con éxito!</h2>
    </div>
    <div style="padding:24px;text-align:center;">
      <p style="margin-bottom:6px;">Número de orden:
        <strong style="color:#1E3A8A;">${numeroOrden}</strong></p>
      <p style="margin-bottom:6px;">Total pagado:
        <strong>$${total.toFixed(2)}</strong></p>
      <p style="color:#6B7280;font-size:0.85rem;">Fecha: ${fecha}</p>
      <button onclick="document.getElementById('dialog-compra').close()"
        style="margin-top:18px;background:linear-gradient(to right,#1E3A8A,#2563EB);
               color:white;border:none;padding:12px 32px;border-radius:8px;
               font-weight:700;font-size:0.95rem;cursor:pointer;font-family:Poppins,sans-serif;">
        Aceptar
      </button>
    </div>
  `;

  dialog.showModal();

  // Vaciar carrito tras compra
  miCarrito.vaciar();
  guardarEnLocalStorage('carritoTechStore', miCarrito.items);
  actualizarBadgeCarrito();
  renderizarCarrito();
}

// ── Arranque ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  inyectarBadge();
  renderizarCarrito();
  conectarBotones();
});