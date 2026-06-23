import { guardarEnLocalStorage, obtenerDeLocalStorage } from './modules/storage.js';


window.abrirModal = () => document.getElementById('modal-editar').classList.add('activo');
window.cerrarModal = () => document.getElementById('modal-editar').classList.remove('activo');
window.mostrarToast = (msg = 'Cambios guardados') => {  };
window.toggleDark = () => {  };

window.guardarDatos = () => {
    
    guardarEnLocalStorage('userProfile', { /* datos */ });
    window.cerrarModal();
    window.mostrarToast('Datos actualizados');
};


document.addEventListener('DOMContentLoaded', () => {
    
});