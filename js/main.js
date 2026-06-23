
document.addEventListener('DOMContentLoaded', () => {
    console.log("TechStore iniciado correctamente.");
    
    
});

import { Carrito } from './classes/Carrito.js';
import { guardarEnLocalStorage, obtenerDeLocalStorage } from './modules/storage.js';


window.agregarProductoAlCarrito = () => {
    
    const nombre = document.querySelector('h1').innerText;
    const precio = 3499; 
    const id = "APL-M3MAX-16"; 

    
    const producto = { id, nombre, precio };

    
    const miCarrito = new Carrito(obtenerDeLocalStorage('carritoTechStore'));
    miCarrito.agregar(producto);
    
    
    guardarEnLocalStorage('carritoTechStore', miCarrito.items);
    alert(`${nombre} añadido al carrito con éxito.`);
};