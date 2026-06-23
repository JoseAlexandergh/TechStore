import { Carrito } from './classes/Carrito.js';
import { obtenerDeLocalStorage } from './modules/storage.js';

const miCarrito = new Carrito(obtenerDeLocalStorage('carritoTechStore'));

function renderizarTabla() {
    const tbody = document.getElementById('carrito-body');
    if (!tbody) return;

    tbody.innerHTML = miCarrito.items.map(item => `
        <tr>
            <td>${item.producto.nombre}</td>
            <td>${item.cantidad}</td>
            <td>${item.producto.obtenerPrecioFormateado()}</td>
            <td>$${(item.producto.precio * item.cantidad).toLocaleString()}</td>
        </tr>
    `).join('');
}

document.addEventListener('DOMContentLoaded', renderizarTabla);


const botonEliminar = document.createElement('button');
botonEliminar.textContent = 'Eliminar';
botonEliminar.onclick = () => miCarrito.eliminar(item.producto.id);