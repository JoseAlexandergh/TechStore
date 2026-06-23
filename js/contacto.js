
document.getElementById('formulario-contacto').addEventListener('submit', function(e) {
  
  e.preventDefault(); 

  
  const formData = new FormData(this);
  
  
  const archivo = formData.get('archivo');
  console.log("Archivo seleccionado:", archivo ? archivo.name : "Ninguno");

  
  alert("Formulario interceptado. Los datos están listos para ser procesados.");
});