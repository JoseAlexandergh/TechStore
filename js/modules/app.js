// app.js — Catálogo (productos.html)
import { Producto }    from './classes/Producto.js';
import { Carrito }     from './classes/Carrito.js';
import { obtenerProductosDesdeAPI } from './modules/api.js';
import { guardarEnLocalStorage, obtenerDeLocalStorage } from './modules/storage.js';
import { mostrarMensaje, inyectarBadge, actualizarBadgeCarrito } from './modules/ui.js';

// ── Estado global ─────────────────────────────────────────────
let listaProductos = [];   // Todas las instancias de Producto cargadas del JSON

// Reconstruir Carrito desde localStorage (los items guardados son objetos planos)
function cargarCarrito() {
  const datos = obtenerDeLocalStorage('carritoTechStore') || [];
  // Reconstruir instancias de Producto para que los métodos funcionen
  const itemsReconstruidos = datos.map(d => ({
    producto: new Producto({
      id: d.producto.id, sku: d.producto.sku || '', nombre: d.producto.nombre,
      marca: d.producto.marca || '', categoria: d.producto.categoria || '',
      precio: d.producto.precio, precioOriginal: d.producto.precioOriginal || d.producto.precio,
      descuento: d.producto.descuento || 0, envioGratis: d.producto.envioGratis || false,
      stock: d.producto.stock || 99, color: d.producto.color || '',
      imagen: d.producto.imagen || '', destacado: d.producto.destacado || false,
      especificaciones: d.producto.especificaciones || {}
    }),
    cantidad: d.cantidad
  }));
  const c = new Carrito([]);
  c.items = itemsReconstruidos;
  return c;
}

// ── Cargar productos ──────────────────────────────────────────
async function inicializarTienda() {
  const spinner = document.getElementById('spinner-catalogo');
  const errorEl = document.getElementById('error-catalogo');
  try {
    if (spinner) spinner.style.display = 'block';
    const data = await obtenerProductosDesdeAPI();
    if (!data || data.length === 0) throw new Error('Sin datos');
    listaProductos = data.map(item => new Producto(item));
    renderizar(listaProductos);
    conectarFiltros();
  } catch (err) {
    console.error('[Catálogo]', err);
    if (errorEl) { errorEl.textContent = '⚠ ' + err.message; errorEl.style.display = 'block'; }
  } finally {
    if (spinner) spinner.style.display = 'none';
  }
}

// ── Renderizar tarjetas ───────────────────────────────────────
function renderizar(productos) {
  const dl = document.querySelector('section[aria-label="Resultados del catálogo"] dl');
  const h2 = document.querySelector('section[aria-label="Resultados del catálogo"] h2');
  if (!dl) return;

  h2.textContent = `Resultados (${productos.length})`;
  dl.innerHTML   = '';

  if (productos.length === 0) {
    const p = document.createElement('p');
    p.textContent = 'No hay productos con esos criterios.';
    p.style.cssText = 'grid-column:1/-1;text-align:center;padding:40px;color:#6B7280;';
    dl.appendChild(p);
    return;
  }

  productos.forEach(prod => {
    const disponible = prod.estaDisponible();
    const ofertaHTML = prod.descuento > 0
      ? `<mark>${prod.descuento}% OFF</mark>`
      : (prod.envioGratis ? `<mark>Envío Gratis</mark>` : '');

    const dd = document.createElement('dd');
    dd.innerHTML = `
      <strong>${prod.nombre}</strong>
      ${ofertaHTML}
      <img src="${prod.imagen}" alt="${prod.nombre}" loading="lazy"
           onerror="this.src='img/placeholder.jpg'">
      <span style="font-size:0.82rem;color:#6B7280;">
        ${Object.values(prod.especificaciones || {}).slice(0, 2).join(' · ')}
      </span>
      <span style="font-size:1.05rem;font-weight:700;color:#1E3A8A;">
        ${prod.obtenerPrecioFormateado()}
      </span>
      ${prod.descuento > 0
        ? `<span style="text-decoration:line-through;color:#9CA3AF;font-size:0.82rem;">
             ${prod.obtenerPrecioOriginalFormateado()}
           </span>` : ''}
      <span style="font-size:0.8rem;font-weight:600;color:${disponible ? '#065F46' : '#EF4444'};">
        ${disponible ? '✔ Disponible' : '✖ Agotado'}
      </span>
      <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:auto;">
        <a href="producto.html" class="btn-blanco" style="font-size:0.85rem;padding:8px 12px;">
          Ver detalles
        </a>
        <button class="btn-anadir" data-id="${prod.id}"
          style="background:linear-gradient(to right,#1E3A8A,#2563EB);color:#fff;border:none;
                 padding:8px 14px;border-radius:8px;cursor:pointer;font-weight:600;font-size:0.85rem;
                 ${!disponible ? 'opacity:0.5;cursor:not-allowed;' : ''}"
          ${!disponible ? 'disabled' : ''}>
          ${disponible ? 'Añadir' : 'Agotado'}
        </button>
      </div>
    `;

    // Evento añadir al carrito
    if (disponible) {
      dd.querySelector('.btn-anadir').addEventListener('click', function() {
        const carrito = cargarCarrito();      // leer estado actual
        carrito.agregar(prod);
        guardarEnLocalStorage('carritoTechStore', carrito.items);
        actualizarBadgeCarrito();
        mostrarMensaje(`"${prod.nombre}" añadido al carrito`, 'success');
        this.textContent = '✔ Añadido';
        setTimeout(() => { this.textContent = 'Añadir'; }, 1500);
      });
    }

    dl.appendChild(dd);
  });
}

// ── Filtros ───────────────────────────────────────────────────
function conectarFiltros() {

  // Función central: lee todos los controles y filtra
  const aplicar = () => {
    const texto  = (document.getElementById('buscador-datalist')?.value
                 || document.getElementById('busqueda-global')?.value
                 || '').trim().toLowerCase();

    const marcas = [...document.querySelectorAll('input[name="marca"]:checked')]
                     .map(c => c.value);

    const catRadio = document.querySelector('input[name="categoria"]:checked');
    const cat      = catRadio ? catRadio.value : '';

    const minRaw = document.getElementById('precio-min')?.value;
    const maxRaw = document.getElementById('precio-max')?.value;
    const minP   = minRaw !== '' && minRaw != null ? parseFloat(minRaw) : 0;
    const maxP   = maxRaw !== '' && maxRaw != null ? parseFloat(maxRaw) : Infinity;

    const color  = document.getElementById('color-dispositivo')?.value || '';

    const filtrados = listaProductos.filter(p => {
      // Texto: nombre o especificaciones
      const okTexto  = texto === ''
        || p.nombre.toLowerCase().includes(texto)
        || Object.values(p.especificaciones || {})
             .some(v => String(v).toLowerCase().includes(texto));

      // Marcas: ninguna marcada = todas pasan
      const okMarca  = marcas.length === 0 || marcas.includes(p.marca);

      // Categoría: vacío = todas pasan
      const okCat    = cat === '' || p.categoria === cat;

      // Precio
      const okMin    = p.precio >= minP;
      const okMax    = p.precio <= maxP;

      // Color: vacío = todos pasan
      const okColor  = color === '' || p.color === color;

      return okTexto && okMarca && okCat && okMin && okMax && okColor;
    });

    renderizar(filtrados);
  };

  // Búsqueda en tiempo real (input)
  document.getElementById('buscador-datalist')?.addEventListener('input', aplicar);
  document.getElementById('busqueda-global')  ?.addEventListener('input', aplicar);

  // Marcas — disparan al marcar/desmarcar
  document.querySelectorAll('input[name="marca"]')
    .forEach(cb => cb.addEventListener('change', aplicar));

  // Categoría — dispara al seleccionar radio
  document.querySelectorAll('input[name="categoria"]')
    .forEach(r => r.addEventListener('change', aplicar));

  // Precio — dispara tanto al perder foco (change) como al escribir (input)
  ['precio-min', 'precio-max'].forEach(id => {
    const el = document.getElementById(id);
    el?.addEventListener('input',  aplicar);
    el?.addEventListener('change', aplicar);
  });

  // Color
  document.getElementById('color-dispositivo')?.addEventListener('change', aplicar);

  // Botón "Aplicar Filtros" (submit del aside)
  document.querySelector('aside form')?.addEventListener('submit', e => {
    e.preventDefault();
    aplicar();
  });

  // Botón "Borrar Selección" (reset)
  document.querySelector('aside button[type="reset"]')?.addEventListener('click', () => {
    // reset() limpia los campos; después de un tick renderizamos todo
    setTimeout(() => renderizar(listaProductos), 0);
  });
}

// ── Arranque ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  inyectarBadge();
  inicializarTienda();
});