import { validarFormulario } from './modules/validacion.js';
import { mostrarMensaje } from './modules/ui.js';

const form = document.getElementById('formulario-contacto');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const datos = {
    nombre: document.getElementById('nombre').value,
    email: document.getElementById('email').value
  };

  const resultado = validarFormulario(datos);

  if (resultado.valido) {
    mostrarMensaje("¡Formulario enviado con éxito!", "success");
    form.reset();
  } else {
    mostrarMensaje("Errores: " + resultado.errores.join(' '), "error");
  }
});