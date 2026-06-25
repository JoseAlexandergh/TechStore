/**
 * techstore.js — Script único sin módulos ES
 * Compatible con Live Server y apertura directa de archivo
 */

// ══════════════════════════════════════════════════════════════
// STORAGE
// ══════════════════════════════════════════════════════════════
const Storage = {
  set(clave, valor) {
    try { localStorage.setItem(clave, JSON.stringify(valor)); } catch(e) {}
  },
  get(clave, defecto = null) {
    try {
      const v = localStorage.getItem(clave);
      return v !== null ? JSON.parse(v) : defecto;
    } catch(e) { return defecto; }
  },
  CARRITO: 'techstore_carrito',
  ORDEN:   'techstore_ultima_orden'
};

// ══════════════════════════════════════════════════════════════
// CLASE PRODUCTO
// ══════════════════════════════════════════════════════════════
class Producto {
  constructor({ id, sku='', nombre, marca='', categoria='', precio,
                precioOriginal, descuento=0, envioGratis=false,
                stock=0, color='', imagen='', destacado=false, especificaciones={} }) {
    this.id             = id;
    this.sku            = sku;
    this.nombre         = nombre;
    this.marca          = marca;
    this.categoria      = categoria;
    this.precio         = Number(precio);
    this.precioOriginal = Number(precioOriginal || precio);
    this.descuento      = Number(descuento);
    this.envioGratis    = Boolean(envioGratis);
    this.stock          = Number(stock);
    this.color          = color;
    this.imagen         = imagen;
    this.destacado      = Boolean(destacado);
    this.especificaciones = especificaciones || {};
  }
  estaDisponible()           { return this.stock > 0; }
  obtenerPrecioFormateado()  { return '$' + this.precio.toLocaleString('es-DO'); }
  obtenerPrecioOriginalFormateado() { return '$' + this.precioOriginal.toLocaleString('es-DO'); }
}

// ══════════════════════════════════════════════════════════════
// CLASE CLIENTE
// ══════════════════════════════════════════════════════════════
class Cliente {
  constructor({ nombre='', email='', telefono='', direccion='' } = {}) {
    this.nombre    = nombre.trim();
    this.email     = email.trim();
    this.telefono  = telefono.trim();
    this.direccion = direccion.trim();
  }
  generarNumeroOrden() {
    return 'ORD-' + Math.floor(1000 + Math.random() * 9000);
  }
  tieneDatosValidos() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return this.nombre.length >= 3 && emailRegex.test(this.email);
  }
}

// ══════════════════════════════════════════════════════════════
// CLASE CARRITO
// ══════════════════════════════════════════════════════════════
class Carrito {
  constructor() {
    this.items       = [];
    this.tasaImpuesto = 0.18;
    this._cargarDesdeStorage();
  }

  _cargarDesdeStorage() {
    var datos = Storage.get(Storage.CARRITO, []);
    if (!Array.isArray(datos)) { this.items = []; return; }
    var self = this;
    this.items = datos
      .filter(function(d) { return d && d.producto && d.producto.nombre; })
      .map(function(d) {
        return {
          cantidad: Number(d.cantidad) || 1,
          producto: new Producto({
            id:             d.producto.id             || 0,
            sku:            d.producto.sku            || '',
            nombre:         d.producto.nombre         || '',
            marca:          d.producto.marca          || '',
            categoria:      d.producto.categoria      || '',
            precio:         Number(d.producto.precio) || 0,
            precioOriginal: Number(d.producto.precioOriginal || d.producto.precio) || 0,
            descuento:      Number(d.producto.descuento)     || 0,
            envioGratis:    Boolean(d.producto.envioGratis),
            stock:          Number(d.producto.stock)         || 99,
            color:          d.producto.color          || '',
            imagen:         d.producto.imagen         || '',
            destacado:      Boolean(d.producto.destacado),
            especificaciones: d.producto.especificaciones || {}
          })
        };
      });
  }

  _guardarEnStorage() {
    // Guardar solo datos planos para que JSON.stringify no pierda nada
    var datos = this.items.map(function(i) {
      return {
        cantidad: i.cantidad,
        producto: {
          id:             i.producto.id,
          sku:            i.producto.sku            || '',
          nombre:         i.producto.nombre,
          marca:          i.producto.marca          || '',
          categoria:      i.producto.categoria      || '',
          precio:         i.producto.precio,
          precioOriginal: i.producto.precioOriginal || i.producto.precio,
          descuento:      i.producto.descuento      || 0,
          envioGratis:    i.producto.envioGratis    || false,
          stock:          i.producto.stock          || 99,
          color:          i.producto.color          || '',
          imagen:         i.producto.imagen         || '',
          destacado:      i.producto.destacado      || false,
          especificaciones: i.producto.especificaciones || {}
        }
      };
    });
    Storage.set(Storage.CARRITO, datos);
  }

  agregar(producto, cantidad = 1) {
    const existente = this.items.find(i => i.producto.id === producto.id);
    if (existente) {
      existente.cantidad += cantidad;
    } else {
      this.items.push({ producto, cantidad });
    }
    this._guardarEnStorage();
  }

  eliminar(idProducto) {
    this.items = this.items.filter(i => i.producto.id !== Number(idProducto));
    this._guardarEnStorage();
  }

  actualizarCantidad(idProducto, nuevaCantidad) {
    const n = Number(nuevaCantidad);
    if (n <= 0) { this.eliminar(idProducto); return; }
    this.items = this.items.map(i =>
      i.producto.id === Number(idProducto) ? { ...i, cantidad: n } : i
    );
    this._guardarEnStorage();
  }

  vaciar() {
    this.items = [];
    this._guardarEnStorage();
  }

  obtenerSubtotal()    { return this.items.reduce((s, i) => s + i.producto.precio * i.cantidad, 0); }
  obtenerImpuestos()   { return this.obtenerSubtotal() * this.tasaImpuesto; }
  obtenerTotal()       { return this.obtenerSubtotal() + this.obtenerImpuestos(); }
  obtenerConteoTotal() { return this.items.reduce((s, i) => s + i.cantidad, 0); }
}

// ══════════════════════════════════════════════════════════════
// UI COMPARTIDA
// ══════════════════════════════════════════════════════════════
function mostrarToast(mensaje, tipo = 'success') {
  var div = document.getElementById('ts-toast');
  if (!div) {
    div = document.createElement('div');
    div.id = 'ts-toast';
    div.style.cssText =
      'position:fixed;bottom:24px;right:24px;z-index:9999;padding:14px 22px;' +
      'border-radius:10px;font-family:Poppins,sans-serif;font-size:0.88rem;font-weight:600;' +
      'display:flex;align-items:center;gap:10px;box-shadow:0 8px 24px rgba(0,0,0,0.2);' +
      'transform:translateY(80px);opacity:0;transition:all 0.35s ease;pointer-events:none;';
    document.body.appendChild(div);
  }
  var colores = { success:'#065F46', error:'#991B1B', info:'#1E3A8A' };
  var iconos  = { success:'✔', error:'✖', info:'ℹ' };
  div.style.background = colores[tipo] || colores.info;
  div.style.color = '#fff';
  div.innerHTML = '<span>' + (iconos[tipo]||'ℹ') + '</span><span>' + mensaje + '</span>';
  requestAnimationFrame(function() {
    div.style.transform = 'translateY(0)';
    div.style.opacity   = '1';
  });
  setTimeout(function() {
    div.style.transform = 'translateY(80px)';
    div.style.opacity   = '0';
  }, 3000);
}

function actualizarBadge() {
  var carrito = new Carrito();
  var total   = carrito.obtenerConteoTotal();
  document.querySelectorAll('.carrito-badge').forEach(function(b) {
    b.textContent   = total;
    b.style.display = total > 0 ? 'inline-flex' : 'none';
  });
}

function inyectarBadge() {
  document.querySelectorAll('nav a[href="carrito.html"]').forEach(function(a) {
    if (!a.querySelector('.carrito-badge')) {
      var span = document.createElement('span');
      span.className = 'carrito-badge';
      span.style.cssText =
        'display:none;background:#F59E0B;color:#fff;font-size:0.65rem;font-weight:700;' +
        'border-radius:50%;width:18px;height:18px;align-items:center;' +
        'justify-content:center;margin-left:4px;vertical-align:middle;';
      a.appendChild(span);
    }
  });
  actualizarBadge();
}

// ══════════════════════════════════════════════════════════════
// CATÁLOGO — productos.html
// ══════════════════════════════════════════════════════════════
var todosLosProductos = [];

async function iniciarCatalogo() {
  inyectarBadge();

  var spinner = document.getElementById('spinner-catalogo');
  var errorEl = document.getElementById('error-catalogo');

  try {
    if (spinner) spinner.style.display = 'block';

    var resp = await fetch('data/productos.json');
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    var datos = await resp.json();

    todosLosProductos = datos.map(function(d) { return new Producto(d); });
    renderizarCatalogo(todosLosProductos);
    conectarFiltros();

  } catch(err) {
    console.error('[Catálogo]', err);
    if (errorEl) { errorEl.textContent = '⚠ Error: ' + err.message; errorEl.style.display = 'block'; }
  } finally {
    if (spinner) spinner.style.display = 'none';
  }
}

function renderizarCatalogo(lista) {
  var dl      = document.querySelector('section[aria-label="Resultados del catálogo"] dl');
  var h2      = document.querySelector('section[aria-label="Resultados del catálogo"] h2');
  var spinner = document.getElementById('spinner-catalogo');
  if (!dl) return;

  if (spinner) spinner.style.display = 'none';
  h2.textContent = 'Resultados (' + lista.length + ')';
  dl.innerHTML   = '';

  if (lista.length === 0) {
    var p = document.createElement('p');
    p.textContent = 'No hay productos con esos criterios.';
    p.style.cssText = 'grid-column:1/-1;text-align:center;padding:40px;color:#6B7280;';
    dl.appendChild(p);
    return;
  }

  lista.forEach(function(prod) {
    var disponible  = prod.estaDisponible();
    var ofertaHTML  = prod.descuento > 0
      ? '<mark>' + prod.descuento + '% OFF</mark>'
      : (prod.envioGratis ? '<mark>Envío Gratis</mark>' : '');
    var especsTexto = Object.values(prod.especificaciones || {}).slice(0,2).join(' · ');

    var dd = document.createElement('dd');
    dd.innerHTML =
      '<strong>' + prod.nombre + '</strong>' +
      ofertaHTML +
      '<img src="' + prod.imagen + '" alt="' + prod.nombre + '" loading="lazy" ' +
           'onerror="this.src=\'img/placeholder.jpg\'">' +
      '<span style="font-size:0.82rem;color:#6B7280;">' + especsTexto + '</span>' +
      '<span style="font-size:1.05rem;font-weight:700;color:#1E3A8A;">' +
           prod.obtenerPrecioFormateado() + '</span>' +
      (prod.descuento > 0
        ? '<span style="text-decoration:line-through;color:#9CA3AF;font-size:0.82rem;">' +
               prod.obtenerPrecioOriginalFormateado() + '</span>'
        : '') +
      '<span style="font-size:0.8rem;font-weight:600;color:' +
           (disponible ? '#065F46' : '#EF4444') + ';">' +
           (disponible ? '✔ Disponible' : '✖ Agotado') + '</span>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:auto;">' +
        '<a href="producto.html" class="btn-ver-detalle" data-id="' + prod.id + '" style="display:inline-block;background-color:#fff;color:#1E3A8A;font-weight:bold;padding:8px 12px;border:2px solid #1E3A8A;border-radius:8px;text-decoration:none;font-size:0.85rem;">Ver detalles</a>' +
        '<button class="btn-anadir-cat" ' +
          'style="background:linear-gradient(to right,#1E3A8A,#2563EB);color:#fff;border:none;' +
                 'padding:8px 14px;border-radius:8px;cursor:pointer;font-weight:600;font-size:0.85rem;' +
                 (disponible ? '' : 'opacity:0.5;cursor:not-allowed;') + '" ' +
          (disponible ? '' : 'disabled') + '>' +
          (disponible ? 'Añadir' : 'Agotado') +
        '</button>' +
      '</div>';

    // Evento "Ver detalles"
    var btnVer = dd.querySelector('.btn-ver-detalle');
    if (btnVer) {
      btnVer.addEventListener('click', function(e) {
        e.preventDefault();
        Storage.set('producto_activo_id', prod.id);
        window.location.href = 'producto.html';
      });
    }

    if (disponible) {
      var btn = dd.querySelector('.btn-anadir-cat');
      btn.addEventListener('click', (function(p, b) {
        return function() {
          var carrito = new Carrito();
          carrito.agregar(p);
          actualizarBadge();
          mostrarToast('"' + p.nombre + '" añadido al carrito');
          b.textContent = '✔ Añadido';
          setTimeout(function() { b.textContent = 'Añadir'; }, 1500);
        };
      })(prod, btn));
    }

    dl.appendChild(dd);
  });
}

function conectarFiltros() {

  function aplicarFiltros() {
    var texto  = (
      (document.getElementById('buscador-datalist') || {}).value ||
      (document.getElementById('busqueda-global')   || {}).value || ''
    ).trim().toLowerCase();

    var marcasChecked = document.querySelectorAll('input[name="marca"]:checked');
    var marcas = Array.from(marcasChecked).map(function(c) { return c.value; });

    var catRadio = document.querySelector('input[name="categoria"]:checked');
    var cat      = catRadio ? catRadio.value : '';

    var minEl = document.getElementById('precio-min');
    var maxEl = document.getElementById('precio-max');
    var minP  = minEl && minEl.value !== '' ? parseFloat(minEl.value) : 0;
    var maxP  = maxEl && maxEl.value !== '' ? parseFloat(maxEl.value) : Infinity;

    var color = (document.getElementById('color-dispositivo') || {}).value || '';

    var filtrados = todosLosProductos.filter(function(p) {
      var okTexto = texto === '' ||
        p.nombre.toLowerCase().includes(texto) ||
        Object.values(p.especificaciones || {})
              .some(function(v) { return String(v).toLowerCase().includes(texto); });
      var okMarca  = marcas.length === 0 || marcas.indexOf(p.marca) !== -1;
      var okCat    = cat   === '' || p.categoria === cat;
      var okMin    = p.precio >= minP;
      var okMax    = p.precio <= maxP;
      var okColor  = color  === '' || p.color === color;
      return okTexto && okMarca && okCat && okMin && okMax && okColor;
    });

    renderizarCatalogo(filtrados);
  }

  // Búsqueda en tiempo real
  var bDl = document.getElementById('buscador-datalist');
  var bGl = document.getElementById('busqueda-global');
  if (bDl) bDl.addEventListener('input', aplicarFiltros);
  if (bGl) bGl.addEventListener('input', aplicarFiltros);

  // Marcas
  document.querySelectorAll('input[name="marca"]').forEach(function(cb) {
    cb.addEventListener('change', aplicarFiltros);
  });

  // Categoría
  document.querySelectorAll('input[name="categoria"]').forEach(function(r) {
    r.addEventListener('change', aplicarFiltros);
  });

  // Precio — input Y change
  ['precio-min','precio-max'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) {
      el.addEventListener('input',  aplicarFiltros);
      el.addEventListener('change', aplicarFiltros);
    }
  });

  // Color
  var colorSel = document.getElementById('color-dispositivo');
  if (colorSel) colorSel.addEventListener('change', aplicarFiltros);

  // Submit formulario filtros
  var formFiltros = document.querySelector('aside form');
  if (formFiltros) {
    formFiltros.addEventListener('submit', function(e) {
      e.preventDefault();
      aplicarFiltros();
    });
  }

  // Reset
  var btnReset = document.querySelector('aside button[type="reset"]');
  if (btnReset) {
    btnReset.addEventListener('click', function() {
      setTimeout(function() { renderizarCatalogo(todosLosProductos); }, 0);
    });
  }
}

// ══════════════════════════════════════════════════════════════
// INDEX — index.html
// ══════════════════════════════════════════════════════════════
function iniciarIndex() {
  inyectarBadge();

  // Botones "Ver Producto" — guardan el id y navegan a producto.html
  document.querySelectorAll('a[data-id][href="producto.html"]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      Storage.set('producto_activo_id', parseInt(btn.dataset.id));
      window.location.href = 'producto.html';
    });
  });
}

// ══════════════════════════════════════════════════════════════
// CARRITO — carrito.html
// ══════════════════════════════════════════════════════════════
function iniciarCarrito() {
  inyectarBadge();
  renderizarCarrito();

  // Vaciar
  var btnVaciar = document.getElementById('btn-vaciar-carrito');
  if (btnVaciar) {
    btnVaciar.addEventListener('click', function() {
      var c = new Carrito();
      if (c.items.length === 0) { mostrarToast('El carrito ya está vacío', 'info'); return; }
      c.vaciar();
      actualizarBadge();
      renderizarCarrito();
      mostrarToast('Carrito vaciado', 'info');
    });
  }

  // Pago
  var formPago = document.getElementById('form-pago');
  if (formPago) {
    formPago.addEventListener('submit', function(e) {
      e.preventDefault();
      var c = new Carrito();
      if (c.items.length === 0) { mostrarToast('Tu carrito está vacío', 'error'); return; }
      mostrarDialogCompra(c);
    });
  }
}

function renderizarCarrito() {
  var carrito  = new Carrito();
  var secVacia = document.getElementById('carrito-vacio');
  var secTabla = document.getElementById('carrito-tabla');
  var tbody    = document.getElementById('carrito-body');
  var tfoot    = document.getElementById('carrito-footer');
  var progress = document.querySelector('progress');
  var meter    = document.querySelector('meter');
  var elSub    = document.getElementById('resumen-subtotal');
  var elImp    = document.getElementById('resumen-impuestos');
  var elTot    = document.getElementById('resumen-total');

  if (!tbody) return;

  if (carrito.items.length === 0) {
    if (secVacia) secVacia.style.display = 'block';
    if (secTabla) secTabla.style.display = 'none';
    if (progress) progress.value = 0;
    if (meter)    meter.value    = 0;
    if (elSub) elSub.textContent = '$0';
    if (elImp) elImp.textContent = '$0';
    if (elTot) elTot.textContent = '$0';
    return;
  }

  if (secVacia) secVacia.style.display = 'none';
  if (secTabla) secTabla.style.display = 'block';

  tbody.innerHTML = '';
  carrito.items.forEach(function(item) {
    var fila = document.createElement('tr');
    fila.innerHTML =
      '<td><div style="display:flex;align-items:center;gap:10px;">' +
        '<img src="' + item.producto.imagen + '" alt="' + item.producto.nombre + '" ' +
             'width="55" height="45" style="object-fit:contain;border-radius:6px;" ' +
             'onerror="this.src=\'img/placeholder.jpg\'">' +
        '<span>' + item.producto.nombre + '</span></div></td>' +
      '<td><div style="display:flex;align-items:center;gap:6px;">' +
        '<button class="btn-cant" data-accion="restar" data-id="' + item.producto.id + '" ' +
          'style="width:28px;height:28px;border-radius:6px;padding:0;font-size:1.1rem;' +
                 'cursor:pointer;background:linear-gradient(to right,#1E3A8A,#2563EB);' +
                 'color:#fff;border:none;">&#8722;</button>' +
        '<span style="min-width:28px;text-align:center;font-weight:600;">' + item.cantidad + '</span>' +
        '<button class="btn-cant" data-accion="sumar" data-id="' + item.producto.id + '" ' +
          'style="width:28px;height:28px;border-radius:6px;padding:0;font-size:1.1rem;' +
                 'cursor:pointer;background:linear-gradient(to right,#1E3A8A,#2563EB);' +
                 'color:#fff;border:none;">+</button>' +
      '</div></td>' +
      '<td>' + item.producto.obtenerPrecioFormateado() + '</td>' +
      '<td><strong>$' + (item.producto.precio * item.cantidad).toLocaleString('es-DO') + '</strong></td>' +
      '<td><button class="btn-eliminar" data-id="' + item.producto.id + '" ' +
          'style="background:#EF4444;color:#fff;border:none;padding:6px 12px;' +
                 'border-radius:6px;cursor:pointer;font-size:0.85rem;">&#128465;</button></td>';
    tbody.appendChild(fila);
  });

  document.querySelectorAll('.btn-cant').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var c    = new Carrito();
      var id   = parseInt(btn.dataset.id);
      var item = c.items.find(function(i) { return i.producto.id === id; });
      if (!item) return;
      var nueva = btn.dataset.accion === 'sumar' ? item.cantidad + 1 : item.cantidad - 1;
      c.actualizarCantidad(id, nueva);
      actualizarBadge();
      renderizarCarrito();
    });
  });

  document.querySelectorAll('.btn-eliminar').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var c = new Carrito();
      c.eliminar(parseInt(btn.dataset.id));
      actualizarBadge();
      renderizarCarrito();
      mostrarToast('Producto eliminado', 'info');
    });
  });

  if (tfoot) {
    tfoot.innerHTML =
      '<tr>' +
        '<td colspan="3" style="text-align:right;padding:10px 15px;"><strong>Subtotal:</strong></td>' +
        '<td style="padding:10px 15px;">$' + carrito.obtenerSubtotal().toLocaleString('es-DO') + '</td>' +
        '<td></td>' +
      '</tr><tr>' +
        '<td colspan="3" style="text-align:right;color:#6B7280;">ITBIS (18%):</td>' +
        '<td style="color:#6B7280;">$' + carrito.obtenerImpuestos().toFixed(2) + '</td>' +
        '<td></td>' +
      '</tr><tr>' +
        '<td colspan="3" style="text-align:right;"><strong>Total:</strong></td>' +
        '<td><strong style="color:#1E3A8A;font-size:1.05rem;">$' + carrito.obtenerTotal().toFixed(2) + '</strong></td>' +
        '<td></td>' +
      '</tr>';
  }

  var sub = carrito.obtenerSubtotal();
  if (elSub) elSub.textContent = '$' + sub.toLocaleString('es-DO');
  if (elImp) elImp.textContent = '$' + carrito.obtenerImpuestos().toFixed(2);
  if (elTot) elTot.textContent = '$' + carrito.obtenerTotal().toFixed(2);

  var totalItems = carrito.obtenerConteoTotal();
  if (progress) {
    progress.value = totalItems === 0 ? 0 : totalItems <= 2 ? 2 : totalItems <= 5 ? 3 : 4;
  }
  if (meter) meter.value = sub;
}


function mostrarDialogCompra(carrito) {
  var orden = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
  var total = carrito.obtenerTotal();
  var fecha = new Date().toLocaleDateString('es-DO');

  Storage.set(Storage.ORDEN, {
    numero: orden,
    items:  carrito.items.map(function(i) {
      return { producto: { nombre: i.producto.nombre }, cantidad: i.cantidad };
    }),
    total: total,
    fecha: fecha
  });

  var dialog = document.getElementById('dialog-compra');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'dialog-compra';
    dialog.style.cssText =
      'border:none;border-radius:16px;padding:0;max-width:400px;width:90%;' +
      'box-shadow:0 20px 60px rgba(0,0,0,0.3);font-family:Poppins,sans-serif;';
    document.body.appendChild(dialog);
  }

  dialog.innerHTML =
    '<div style="background:linear-gradient(135deg,#1E3A8A,#2563EB);padding:28px;' +
         'border-radius:16px 16px 0 0;text-align:center;color:white;">' +
      '<div style="font-size:3.5rem;margin-bottom:8px;">✅</div>' +
      '<h2 style="margin:0;font-size:1.2rem;">¡Compra realizada con éxito!</h2>' +
    '</div>' +
    '<div style="padding:24px;text-align:center;">' +
      '<p>Orden: <strong style="color:#1E3A8A;">' + orden + '</strong></p>' +
      '<p>Total: <strong>$' + total.toFixed(2) + '</strong></p>' +
      '<p style="color:#6B7280;font-size:0.85rem;">Fecha: ' + fecha + '</p>' +
      '<button onclick="document.getElementById(\'dialog-compra\').close()" ' +
        'style="margin-top:18px;background:linear-gradient(to right,#1E3A8A,#2563EB);' +
               'color:white;border:none;padding:12px 32px;border-radius:8px;' +
               'font-weight:700;cursor:pointer;font-family:Poppins,sans-serif;">' +
        'Aceptar' +
      '</button>' +
    '</div>';

  dialog.showModal();

  carrito.vaciar();
  actualizarBadge();
  renderizarCarrito();
}

// ══════════════════════════════════════════════════════════════
// CONTACTO — contacto.html
// ══════════════════════════════════════════════════════════════
function iniciarContacto() {
  inyectarBadge();

  // Generar ticket ID
  var ticketInput = document.getElementById('ticket-id');
  if (ticketInput) ticketInput.value = 'TCK-' + Math.floor(10000 + Math.random() * 90000);

  // Slider de presupuesto con valor visible (Problema 4)
  var rango = document.getElementById('presupuesto-rango');
  if (rango) {
    var display = document.getElementById('presupuesto-valor');
    if (!display) {
      display = document.createElement('span');
      display.id = 'presupuesto-valor';
      display.style.cssText = 'font-weight:700;color:#1E3A8A;margin-left:10px;font-size:1rem;display:inline-block;';
      rango.insertAdjacentElement('afterend', display);
    }
    function actualizarDisplay() {
      display.textContent = '$' + parseInt(rango.value).toLocaleString('es-DO');
    }
    actualizarDisplay();
    rango.addEventListener('input', actualizarDisplay);
  }

  // Validación en tiempo real
  var REGEX = {
    email:    /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    telefono: /^[0-9]{3}-[0-9]{3}-[0-9]{4}$/,
    pin:      /^.{4,6}$/,
    url:      /^https?:\/\/.+/
  };

  function validarCampo(campo) {
    var val  = campo.value.trim();
    var name = campo.name;
    var tipo = campo.type;
    var err  = '';
    if (campo.required && val === '') { err = 'Campo obligatorio.'; }
    else if (tipo === 'email'   && val && !REGEX.email.test(val))    { err = 'Email inválido.'; }
    else if (name === 'telefono' && val && !REGEX.telefono.test(val)) { err = 'Formato: 809-555-5555'; }
    else if (name === 'pin'     && val && !REGEX.pin.test(val))      { err = 'PIN de 4-6 caracteres.'; }
    else if (tipo === 'url'     && val && !REGEX.url.test(val))      { err = 'URL inválida.'; }

    var span = campo.parentElement && campo.parentElement.querySelector('.err-campo');
    if (!span) {
      span = document.createElement('span');
      span.className = 'err-campo';
      span.style.cssText = 'color:#EF4444;font-size:0.75rem;display:block;margin-top:3px;';
      if (campo.parentElement) campo.parentElement.appendChild(span);
    }
    span.textContent  = err;
    campo.style.borderColor = err ? '#EF4444' : '';
    return err === '';
  }

  var form = document.querySelector('main form[method="post"], main form[enctype]');
  if (!form) return;

  form.querySelectorAll('input:not([type="hidden"]):not([disabled])').forEach(function(c) {
    c.addEventListener('input', function() { validarCampo(c); });
    c.addEventListener('blur',  function() { validarCampo(c); });
  });

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var valido = true;
    form.querySelectorAll('input:not([type="hidden"]):not([disabled])').forEach(function(c) {
      if (!validarCampo(c)) valido = false;
    });
    if (!valido) { mostrarMensajeForm('⚠ Revisa los campos marcados.', 'error'); return; }
    mostrarMensajeForm('✔ Ticket enviado. ID: ' + (ticketInput ? ticketInput.value : ''), 'success');
    setTimeout(function() { form.reset(); }, 3000);
  });

  function mostrarMensajeForm(texto, tipo) {
    var div = form.querySelector('.msg-form');
    if (!div) {
      div = document.createElement('div');
      div.className = 'msg-form';
      div.style.cssText = 'padding:12px 16px;border-radius:8px;margin-top:12px;font-weight:600;font-size:0.9rem;';
      form.appendChild(div);
    }
    div.textContent     = texto;
    div.style.background = tipo === 'success' ? '#D1FAE5' : '#FEE2E2';
    div.style.color      = tipo === 'success' ? '#065F46'  : '#991B1B';
    div.style.border     = '1px solid ' + (tipo === 'success' ? '#6EE7B7' : '#FCA5A5');
  }
}

// ══════════════════════════════════════════════════════════════
// PERFIL — perfil.html
// ══════════════════════════════════════════════════════════════
function iniciarPerfil() {
  inyectarBadge();

  // Cargar última orden si existe
  var orden  = Storage.get(Storage.ORDEN);
  var tbody  = document.getElementById('tabla-pedidos-body');
  var statP  = document.getElementById('stat-pedidos');
  var statT  = document.getElementById('stat-total');

  if (orden && tbody) {
    var filaSin = document.getElementById('fila-sin-pedidos');
    if (filaSin) filaSin.remove();
    var fila = document.createElement('tr');
    fila.innerHTML =
      '<td>' + orden.numero + '</td>' +
      '<td>' + orden.items.map(function(i) { return i.producto.nombre; }).join(', ') + '</td>' +
      '<td>' + orden.fecha + '</td>' +
      '<td><strong>$' + Number(orden.total).toFixed(2) + '</strong></td>' +
      '<td><span class="badge badge-entregado">Entregado</span></td>';
    tbody.appendChild(fila);
    if (statP) statP.textContent = '1';
    if (statT) statT.textContent = '$' + Number(orden.total).toFixed(2);
  }

  // Modal editar datos
  window.abrirModal  = function() { var m = document.getElementById('modal-editar'); if(m) m.classList.add('activo'); };
  window.cerrarModal = function() { var m = document.getElementById('modal-editar'); if(m) m.classList.remove('activo'); };

  window.guardarDatos = function() {
    var n  = document.getElementById('dato-nombre');
    var ap = document.getElementById('dato-apellido');
    var em = document.getElementById('dato-email');
    var te = document.getElementById('dato-telefono');
    var ni = document.getElementById('input-nombre');
    var ai = document.getElementById('input-apellido');
    var ei = document.getElementById('input-email');
    var ti = document.getElementById('input-telefono');
    if (n  && ni) n.textContent  = ni.value;
    if (ap && ai) ap.textContent = ai.value;
    if (em && ei) em.textContent = ei.value;
    if (te && ti) te.textContent = ti.value;
    window.cerrarModal();
    mostrarToast('Datos actualizados correctamente');
  };

  window.mostrarToast = mostrarToast;

  window.toggleDark = function() {
    document.body.classList.toggle('dark-theme');
    mostrarToast('Modo oscuro ' + (document.body.classList.contains('dark-theme') ? 'activado' : 'desactivado'), 'info');
  };

  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') window.cerrarModal(); });
  var modalEl = document.getElementById('modal-editar');
  if (modalEl) modalEl.addEventListener('click', function(e) { if (e.target === this) window.cerrarModal(); });

  // Nav scroll activo
  var secciones = document.querySelectorAll('.perfil-contenido section');
  var navLinks  = document.querySelectorAll('.perfil-nav a[href^="#"]');
  window.addEventListener('scroll', function() {
    var actual = '';
    secciones.forEach(function(s) { if (window.scrollY >= s.offsetTop - 120) actual = s.id; });
    navLinks.forEach(function(a) { a.classList.toggle('activo', a.getAttribute('href') === '#' + actual); });
  });
}


// ══════════════════════════════════════════════════════════════
// PRODUCTO — producto.html
// ══════════════════════════════════════════════════════════════
async function iniciarProducto() {
  inyectarBadge();

  var elCargando   = document.getElementById('producto-cargando');
  var elError      = document.getElementById('producto-error');
  var elContenido  = document.getElementById('producto-contenido');

  try {
    // Leer id guardado desde index o catálogo
    var id = Storage.get('producto_activo_id', null);

    // Cargar todos los productos del JSON
    var resp = await fetch('data/productos.json');
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    var datos = await resp.json();

    // Buscar el producto por id; si no hay id guardado, mostrar el primero
    var dato = id !== null
      ? datos.find(function(d) { return d.id === id; })
      : datos[0];

    if (!dato) throw new Error('Producto no encontrado');

    var prod = new Producto(dato);

    // Rellenar el DOM
    document.title = prod.nombre + ' | TechStore';
    document.getElementById('prod-imagen').src        = prod.imagen;
    document.getElementById('prod-imagen').alt        = prod.nombre;
    document.getElementById('prod-nombre').textContent = prod.nombre;
    document.getElementById('prod-sku').textContent    = 'SKU: ' + prod.sku;
    document.getElementById('prod-categoria').textContent = prod.categoria.toUpperCase();
    document.getElementById('prod-precio').textContent = prod.obtenerPrecioFormateado();
    document.getElementById('prod-marca').textContent  = 'Marca: ' + prod.marca;
    document.getElementById('prod-color').textContent  = 'Color: ' + prod.color;

    // Precio original (solo si hay descuento)
    var elPrecioOrig = document.getElementById('prod-precio-original');
    if (prod.descuento > 0) {
      elPrecioOrig.textContent = prod.obtenerPrecioOriginalFormateado();
    } else {
      elPrecioOrig.style.display = 'none';
    }

    // Disponibilidad
    var elDisp = document.getElementById('prod-disponibilidad');
    if (prod.estaDisponible()) {
      elDisp.textContent = '✔ En stock (' + prod.stock + ' unidades)';
      elDisp.className   = 'producto-disponibilidad disponible';
    } else {
      elDisp.textContent = '✖ Agotado';
      elDisp.className   = 'producto-disponibilidad agotado';
    }

    // Envío gratis
    var elEnvio = document.getElementById('prod-envio');
    elEnvio.textContent = prod.envioGratis ? '🚚 Envío gratis' : '';

    // Descripción (construida desde especificaciones)
    var specs = prod.especificaciones || {};
    var specTexto = Object.values(specs).join(' · ');
    document.getElementById('prod-descripcion').textContent = specTexto;

    // Tabla de especificaciones
    var tbody = document.getElementById('prod-specs');
    tbody.innerHTML = '';
    Object.entries(specs).forEach(function(entrada) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>' + entrada[0].charAt(0).toUpperCase() + entrada[0].slice(1) + '</td>' +
                     '<td>' + entrada[1] + '</td>';
      tbody.appendChild(tr);
    });
    // Añadir filas extra
    [
      ['Marca', prod.marca],
      ['Categoría', prod.categoria],
      ['Color', prod.color],
      ['Stock', prod.stock + ' unidades'],
      ['Envío', prod.envioGratis ? 'Gratis' : 'Costo estándar'],
    ].forEach(function(fila) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>' + fila[0] + '</td><td>' + fila[1] + '</td>';
      tbody.appendChild(tr);
    });

    // Botón añadir al carrito
    var btnAnadir = document.getElementById('btn-anadir-detalle');
    if (!prod.estaDisponible()) {
      btnAnadir.disabled     = true;
      btnAnadir.textContent  = 'Producto agotado';
    } else {
      btnAnadir.addEventListener('click', function() {
        var carrito = new Carrito();
        carrito.agregar(prod);
        actualizarBadge();
        mostrarToast('"' + prod.nombre + '" añadido al carrito — ' + prod.obtenerPrecioFormateado());
        btnAnadir.textContent = '✔ Añadido al carrito';
        btnAnadir.style.background = '#065F46';
        setTimeout(function() {
          btnAnadir.innerHTML = '<i class="fa-solid fa-cart-plus"></i> Añadir al carrito';
          btnAnadir.style.background = '';
        }, 2000);
      });
    }

    // Mostrar contenido
    if (elCargando)  elCargando.style.display  = 'none';
    if (elContenido) elContenido.style.display  = 'block';

  } catch(err) {
    console.error('[Producto]', err);
    if (elCargando) elCargando.style.display = 'none';
    if (elError)    elError.style.display    = 'block';
  }
}

// ══════════════════════════════════════════════════════════════
// ROUTER — detectar qué página es y arrancar el módulo correcto
// ══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
  var pagina = window.location.pathname.split('/').pop() || 'index.html';

  if (pagina === 'productos.html')    { iniciarCatalogo(); }
  else if (pagina === 'producto.html')  { iniciarProducto();  }
  else if (pagina === 'carrito.html') { iniciarCarrito();  }
  else if (pagina === 'contacto.html'){ iniciarContacto(); }
  else if (pagina === 'perfil.html')  { iniciarPerfil();   }
  else                                { iniciarIndex();    }  // index.html y cualquier otra
});