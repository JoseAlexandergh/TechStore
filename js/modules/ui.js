// ui.js — Módulo de interfaz compartida
export const mostrarMensaje = (mensaje, tipo = 'info') => {
  let div = document.getElementById('mensaje-ui');
  if (!div) {
    div = document.createElement('div');
    div.id = 'mensaje-ui';
    div.style.cssText = `
      position:fixed;bottom:24px;right:24px;z-index:9999;
      padding:14px 22px;border-radius:10px;font-family:'Poppins',sans-serif;
      font-size:0.88rem;font-weight:600;display:flex;align-items:center;
      gap:10px;box-shadow:0 8px 24px rgba(0,0,0,0.2);
      transform:translateY(80px);opacity:0;transition:all 0.35s ease;
    `;
    document.body.appendChild(div);
  }
  const colores = {
    success: { bg:'#065F46', icono:'✔' },
    error:   { bg:'#991B1B', icono:'✖' },
    info:    { bg:'#1E3A8A', icono:'ℹ' },
  };
  const c = colores[tipo] ?? colores.info;
  div.style.background = c.bg;
  div.style.color = '#fff';
  div.innerHTML = `<span>${c.icono}</span><span>${mensaje}</span>`;
  requestAnimationFrame(() => {
    div.style.transform = 'translateY(0)';
    div.style.opacity   = '1';
  });
  setTimeout(() => {
    div.style.transform = 'translateY(80px)';
    div.style.opacity   = '0';
  }, 3000);
};

// Lee directamente el array de localStorage — no necesita instancias de Producto
export const actualizarBadgeCarrito = () => {
  try {
    const raw   = localStorage.getItem('carritoTechStore');
    const items = raw ? JSON.parse(raw) : [];
    // Sumar cantidades del array plano guardado
    const total = Array.isArray(items)
      ? items.reduce((sum, i) => sum + (Number(i.cantidad) || 0), 0)
      : 0;
    document.querySelectorAll('.carrito-badge').forEach(b => {
      b.textContent = total;
      b.style.display = total > 0 ? 'inline-flex' : 'none';
    });
  } catch (_) {}
};

export const inyectarBadge = () => {
  document.querySelectorAll('nav a[href="carrito.html"]').forEach(a => {
    if (!a.querySelector('.carrito-badge')) {
      const span = document.createElement('span');
      span.className = 'carrito-badge';
      span.style.cssText =
        'display:none;background:#F59E0B;color:#fff;font-size:0.65rem;font-weight:700;' +
        'border-radius:50%;width:18px;height:18px;align-items:center;' +
        'justify-content:center;margin-left:4px;vertical-align:middle;';
      a.appendChild(span);
    }
  });
  actualizarBadgeCarrito();
};