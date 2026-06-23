import { obtenerProductosDesdeAPI } from './modules/api.js';
import { filtrarProductos } from './modules/filtros.js';
import { renderizarProductos } from './modules/ui.js';

let todosLosProductos = [];

async function init() {
    todosLosProductos = await obtenerProductosDesdeAPI();
    renderizarProductos(todosLosProductos, 'contenedor-productos');
    
    document.getElementById('filtro-marca')?.addEventListener('change', actualizarFiltros);
}

function actualizarFiltros() {
    const marca = document.getElementById('filtro-marca').value;
    const filtrados = filtrarProductos(todosLosProductos, { marca });
    renderizarProductos(filtrados, 'contenedor-productos');
}

init();