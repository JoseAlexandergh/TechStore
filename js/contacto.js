// contacto.js — Formulario de contacto con validación y slider (problemas 4 y 5)
import { validarFormulario } from './modules/validacion.js';
import { mostrarMensaje, inyectarBadge } from './modules/ui.js';

document.addEventListener('DOMContentLoaded', () => {
  inyectarBadge();

  // PROBLEMA 4: Rango de presupuesto con número visible
  const rango = document.getElementById('presupuesto-rango');
  let valorDisplay = document.getElementById('presupuesto-valor');

  if (rango) {
    // Crear el display si no existe
    if (!valorDisplay) {
      valorDisplay = document.createElement('span');
      valorDisplay.id = 'presupuesto-valor';
      valorDisplay.style.cssText = 'font-weight:700;color:#1E3A8A;margin-left:10px;font-size:1rem;';
      rango.insertAdjacentElement('afterend', valorDisplay);
    }
    valorDisplay.textContent = `$${parseInt(rango.value).toLocaleString('es-DO')}`;
    rango.addEventListener('input', () => {
      valorDisplay.textContent = `$${parseInt(rango.value).toLocaleString('es-DO')}`;
    });
  }

  // Generar ticket ID único
  const ticketInput = document.getElementById('ticket-id');
  if (ticketInput) {
    ticketInput.value = `TCK-${Math.floor(10000 + Math.random() * 90000)}`;
  }

  // PROBLEMA 5: Un solo formulario — el que tiene id o method="post"
  // Eliminar cualquier formulario duplicado que no sea el principal
  const forms = document.querySelectorAll('main form');
  if (forms.length > 1) {
    // Mantener solo el primero (el de contacto real)
    for (let i = 1; i < forms.length; i++) forms[i].remove();
  }

  // Validación en tiempo real
  const form = document.querySelector('main form[method="post"], main form[enctype]');
  if (!form) return;

  form.querySelectorAll('input:not([type="hidden"]):not([disabled]), textarea').forEach(campo => {
    campo.addEventListener('input', () => validarCampoVisual(campo));
    campo.addEventListener('blur',  () => validarCampoVisual(campo));
  });

  // Submit con preventDefault
  form.addEventListener('submit', e => {
    e.preventDefault();

    const nombre = document.getElementById('nombre-cliente')?.value || '';
    const email  = document.getElementById('email-cliente')?.value || '';
    const pin    = document.getElementById('clave-seguridad')?.value || '';

    const resultado = validarFormulario({ nombre, email });

    if (!resultado.valido || pin.length < 4) {
      mostrarMensajeFormulario('⚠ Revisa los campos marcados.', 'error');
      return;
    }

    mostrarMensajeFormulario(`✔ Ticket enviado. ID: ${ticketInput?.value}`, 'success');
    setTimeout(() => form.reset(), 3000);
  });
});

// Validación visual campo a campo con RegExp
const REGEX = {
  email:    /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  telefono: /^[0-9]{3}-[0-9]{3}-[0-9]{4}$/,
  pin:      /^.{4,6}$/,
  nombre:   /^.{2,}$/,
  url:      /^https?:\/\/.+/,
};

function validarCampoVisual(campo) {
  const val  = campo.value.trim();
  const name = campo.name;
  const tipo = campo.type;
  let error  = '';

  if (campo.required && val === '') { error = 'Campo obligatorio.'; }
  else if (tipo === 'email' && val && !REGEX.email.test(val)) { error = 'Email inválido.'; }
  else if (name === 'telefono' && val && !REGEX.telefono.test(val)) { error = 'Formato: 809-555-5555'; }
  else if (name === 'pin' && val && !REGEX.pin.test(val)) { error = 'PIN de 4 a 6 caracteres.'; }
  else if (name === 'nombre' && val && !REGEX.nombre.test(val)) { error = 'Mínimo 2 caracteres.'; }
  else if (tipo === 'url' && val && !REGEX.url.test(val)) { error = 'Debe ser una URL válida.'; }

  let span = campo.parentElement?.querySelector('.error-campo');
  if (!span) {
    span = document.createElement('span');
    span.className = 'error-campo';
    span.style.cssText = 'color:#EF4444;font-size:0.75rem;display:block;margin-top:3px;';
    campo.parentElement?.appendChild(span);
  }
  span.textContent = error;
  campo.style.borderColor = error ? '#EF4444' : '';
}

function mostrarMensajeFormulario(texto, tipo) {
  const form = document.querySelector('main form');
  let div = form?.querySelector('.msg-form');
  if (!div) {
    div = document.createElement('div');
    div.className = 'msg-form';
    div.style.cssText = 'padding:12px 16px;border-radius:8px;margin-top:12px;font-weight:600;font-size:0.9rem;';
    form?.appendChild(div);
  }
  div.textContent = texto;
  div.style.background = tipo === 'success' ? '#D1FAE5' : '#FEE2E2';
  div.style.color       = tipo === 'success' ? '#065F46'  : '#991B1B';
  div.style.border      = `1px solid ${tipo === 'success' ? '#6EE7B7' : '#FCA5A5'}`;
}