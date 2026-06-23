// app.js — Script principal del CATÁLOGO (productos.html)
import { Producto } from './classes/Producto.js';
import { Carrito } from './classes/Carrito.js';
import { obtenerProductosDesdeAPI } from './modules/api.js';
import { filtrarProductos } from './modules/filtros.js';
import { guardarEnLocalStorage, obtenerDeLocalStorage } from './modules/storage.js';
import { formatearMoneda } from './modules/helpers.js';
import { mostrarMensaje, inyectarBadge, actualizarBadgeCarrito } from './modules/ui.js';

// ── Estado ──────────────────────────────────────────────────
let listaProductos = [];
let miCarrito = new Carrito(obtenerDeLocalStorage('carritoTechStore') || []);

// ── Cargar productos desde JSON ──────────────────────────────
async function inicializarTienda() {
  const spinner = document.getElementById('spinner-catalogo');
  const errorEl = document.getElementById('error-catalogo');

  try {
    if (spinner) spinner.style.display = 'block';

    const data = await obtenerProductosDesdeAPI();

    if (!data || data.length === 0) throw new Error('No se recibieron productos');

    listaProductos = data.map(item => new Producto(item));
    renderizar(listaProductos);
    conectarFiltros();

  } catch (error) {
    console.error('[Catálogo]', error);
    if (errorEl) { errorEl.textContent = '⚠ Error al cargar productos: ' + error.message; errorEl.style.display = 'block'; }
  } finally {
    if (spinner) spinner.style.display = 'none';
  }
}

// ── Renderizar tarjetas ──────────────────────────────────────
function renderizar(productos) {
  const dl = document.querySelector('section[aria-label="Resultados del catálogo"] dl');
  const h2 = document.querySelector('section[aria-label="Resultados del catálogo"] h2');
  if (!dl) return;

  if (h2) h2.textContent = `Resultados (${productos.length})`;
  dl.innerHTML = '';

  if (productos.length === 0) {
    const p = document.createElement('p');
    p.textContent = 'No se encontraron productos con esos filtros.';
    p.style.cssText = 'grid-column:1/-1;text-align:center;padding:40px;color:#6B7280;';
    dl.appendChild(p);
    return;
  }

  productos.forEach(prod => {
    const dd = document.createElement('dd');
    const disponible = prod.estaDisponible();
    const ofertaHTML = prod.descuento > 0
      ? `<mark>${prod.descuento}% OFF</mark>`
      : prod.envioGratis ? `<mark>Envío Gratis</mark>` : '';

    dd.innerHTML = `
      <strong>${prod.nombre}</strong>
      ${ofertaHTML}
      <img src="${prod.imagen}" alt="${prod.nombre}" loading="lazy"
           onerror="this.src='img/placeholder.jpg'">
      <span style="font-size:0.85rem;color:#6B7280;">${prod.especificaciones ? Object.values(prod.especificaciones).slice(0,2).join(' · ') : ''}</span>
      <span style="font-size:1.05rem;font-weight:700;color:#1E3A8A;">${prod.obtenerPrecioFormateado()}</span>
      ${prod.descuento > 0 ? `<span style="text-decoration:line-through;color:#9CA3AF;font-size:0.85rem;">${prod.obtenerPrecioOriginalFormateado()}</span>` : ''}
      <span style="font-size:0.8rem;color:${disponible?'#065F46':'#EF4444'};font-weight:600;">${disponible?'✔ Disponible':'✖ Agotado'}</span>
      <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:auto;">
        <a href="producto.html" class="btn-blanco" style="font-size:0.85rem;padding:8px 12px;">Ver detalles</a>
        <button class="btn-anadir"
          data-id="${prod.id}"
          style="background:linear-gradient(to right,#1E3A8A,#2563EB);color:#fff;border:none;padding:8px 14px;border-radius:8px;cursor:pointer;font-weight:600;font-size:0.85rem;${!disponible?'opacity:0.5;cursor:not-allowed;':''}"
          ${!disponible ? 'disabled' : ''}>
          ${disponible ? 'Añadir' : 'Agotado'}
        </button>
      </div>
    `;

    // Evento click en botón añadir
    const btn = dd.querySelector('.btn-anadir');
    if (btn && disponible) {
      btn.addEventListener('click', () => {
        miCarrito.agregar(prod);
        guardarEnLocalStorage('carritoTechStore', miCarrito.items);
        actualizarBadgeCarrito();
        mostrarMensaje(`"${prod.nombre}" añadido al carrito`, 'success');
        const textoOrig = btn.textContent;
        btn.textContent = '✔ Añadido';
        setTimeout(() => { btn.textContent = textoOrig; }, 1500);
      });
    }

    dl.appendChild(dd);
  });
}

// ── Filtros ──────────────────────────────────────────────────
function conectarFiltros() {
  // Búsqueda en tiempo real
  const inputBusqueda = document.getElementById('buscador-datalist');
  const inputGlobal   = document.getElementById('busqueda-global');

  const aplicar = () => {
    const texto    = (inputBusqueda?.value || inputGlobal?.value || '').toLowerCase();
    const marcas   = [...document.querySelectorAll('input[name="marca"]:checked')].map(c => c.value);
    const catRadio = document.querySelector('input[name="categoria"]:checked');
    const cat      = catRadio ? catRadio.value : '';
    const minP     = parseFloat(document.getElementById('precio-min')?.value) || 0;
    const maxP     = parseFloat(document.getElementById('precio-max')?.value) || Infinity;
    const color    = document.getElementById('color-dispositivo')?.value || '';

    const filtrados = listaProductos.filter(p => {
      const coincideTexto = p.nombre.toLowerCase().includes(texto) ||
                            Object.values(p.especificaciones || {}).some(v => String(v).toLowerCase().includes(texto));
      const coincideMarca = marcas.length === 0 || marcas.includes(p.marca);
      const coincideCat   = cat === '' || p.categoria === cat;
      const coincideMin   = p.precio >= minP;
      const coincideMax   = p.precio <= maxP;
      const coincideColor = color === '' || p.color === color;
      return coincideTexto && coincideMarca && coincideCat && coincideMin && coincideMax && coincideColor;
    });

    renderizar(filtrados);
  };

  inputBusqueda?.addEventListener('input', aplicar);
  inputBusqueda?.addEventListener('keyup', e => e.key === 'Enter' && aplicar());
  inputGlobal?.addEventListener('input', aplicar);
  document.querySelectorAll('input[name="marca"]').forEach(c => c.addEventListener('change', aplicar));
  document.querySelectorAll('input[name="categoria"]').forEach(r => r.addEventListener('change', aplicar));
  document.getElementById('precio-min')?.addEventListener('change', aplicar);
  document.getElementById('precio-max')?.addEventListener('change', aplicar);
  document.getElementById('color-dispositivo')?.addEventListener('change', aplicar);

  // Submit del formulario de filtros
  document.querySelector('aside form')?.addEventListener('submit', e => { e.preventDefault(); aplicar(); });

  // Reset
  document.querySelector('button[type="reset"]')?.addEventListener('click', () => {
    setTimeout(() => renderizar(listaProductos), 0);
  });
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  inyectarBadge();
  inicializarTienda();
});