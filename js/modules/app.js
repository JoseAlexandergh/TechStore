import { Producto } from './classes/Producto.js';
import { Carrito } from './classes/Carrito.js';
import { obtenerProductosDesdeAPI } from './modules/api.js';
import { filtrarProductos } from './modules/filtros.js';
import { guardarEnLocalStorage, obtenerDeLocalStorage } from './modules/storage.js';
import { formatearMoneda } from './modules/helpers.js';

let listaProductos = [];
let miCarrito = new Carrito(obtenerDeLocalStorage('carritoTechStore'));

async function inicializarTienda() {
  const data = await obtenerProductosDesdeAPI();
  listaProductos = data.map(item => new Producto(item));
  renderizar(listaProductos);
}

function renderizar(productos) {
  const contenedor = document.getElementById('contenedor-productos');
  if (!contenedor) return;

  contenedor.innerHTML = productos.map(prod => `
    <dd class="tarjeta-producto">
      <img src="${prod.imagen}" alt="${prod.nombre}" width="150">
      <strong>${prod.nombre}</strong>
      <p>${formatearMoneda(prod.precio)}</p>
      <button onclick="window.agregar('${prod.id}')">Añadir</button>
    </dd>
  `).join('');
}


window.agregar = (id) => {
  const prod = listaProductos.find(p => p.id == id);
  miCarrito.agregar(prod);
  guardarEnLocalStorage('carritoTechStore', miCarrito.items);
  alert('Añadido: ' + prod.nombre);
};

document.addEventListener('DOMContentLoaded', inicializarTienda);