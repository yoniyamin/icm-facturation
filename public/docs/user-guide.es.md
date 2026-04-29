# ICM Administration — Guía de usuario

Un recorrido breve por la aplicación de escaneo de recibos: iniciar sesión, escanear, editar datos, consultar el historial, cambiar de idioma y (para administradores) gestionar quién puede usar la aplicación.

---

## 1. Iniciar sesión

1. Abre la URL de la aplicación en tu navegador (móvil o escritorio).
2. Pulsa **Iniciar sesión con Google**.
3. Elige la cuenta de Google cuyo correo un administrador haya añadido a la lista de permitidos.

Si ves *"Tu correo no está autorizado para usar esta aplicación"*, pide a un administrador que añada tu correo de Google (consulta [§6 — Para administradores](#6-para-administradores)).

> **Consejo:** En el móvil, tras iniciar sesión una vez, puedes añadir la página a la pantalla de inicio ("Añadir a pantalla de inicio") para una experiencia tipo aplicación.

---

## 2. Escanear un recibo

El flujo tiene cuatro pasos: **Capturar → Revisar OCR → Completar datos → Enviar**.

### Paso 1 — Capturar una imagen

Desde la pantalla principal, elige una de estas opciones:

- **Tomar Foto** — abre la cámara de tu dispositivo. Mantén el recibo plano, llena el encuadre, evita las sombras.
- **Subir Imagen** — selecciona un archivo JPG, PNG o HEIC ya guardado en tu dispositivo.

### Paso 2 — Revisar los datos extraídos

La aplicación ejecuta el OCR (reconocimiento de texto) directamente en tu navegador. Cuando termina:

- Los campos detectados (número de recibo, nombre del negocio, fecha, importe, etc.) aparecen arriba con indicadores de confianza (verde = alta, amarillo = media, rojo = baja).
- El texto completo extraído se muestra debajo — puedes desplazarte por él.

Puedes:

- **Editar un campo** — pulsa el icono de lápiz junto al campo y escribe el valor corregido.
- **Reasignar texto** — selecciona cualquier texto del bloque extraído y un pequeño menú emergente te permitirá asignarlo a un campo concreto (útil cuando el OCR colocó el número de recibo en el campo equivocado, por ejemplo).
- **Elegir entre varios montos** — cuando se detectan varios importes, un selector te permite elegir el total correcto.
- **Revertir cambios** para volver al OCR original.
- **Volver a tomar** para descartar el escaneo y empezar de nuevo.

Cuando los datos se vean bien, pulsa **Continuar**.

### Paso 3 — Completar el formulario

- **Número de Recibo** — se rellena automáticamente desde el OCR si se detecta; edítalo si hace falta.
- **Nombre del Proyecto** — busca proyectos existentes o escribe uno nuevo (aparecerá una opción "+ Agregar" si no hay coincidencias).
- **Tema** — elige una categoría (Comida, Suministros de Oficina, Transporte, etc.) o añade una personalizada.
- **Monto + Moneda** — se rellena automáticamente desde el OCR; la moneda por defecto es EUR. Cambia a USD o NIS si es necesario.

Pulsa **Enviar** para subir el recibo.

### Paso 4 — Confirmación

Verás una pantalla de éxito con:

- Un enlace a la imagen del recibo subida.
- Un enlace a la Hoja de Google (solo será útil si la hoja se ha compartido con tu cuenta de Google).
- Un botón **Escanear Otro Recibo**.

---

## 3. Consultar recibos guardados

Abre el menú (icono ☰, arriba a la derecha) → **Recibos**.

Puedes:

- **Filtrar por proyecto** — escribe en el cuadro de búsqueda para acotar.
- **Ordenar** — pulsa cualquier cabecera de columna (Negocio, Proyecto, Categoría, Monto, Fecha) para ordenar ascendente/descendente.
- **Cambiar tamaño de página** — elige 5/10/20/50 por página o *Todos*.
- **Ver la foto** — pulsa **Ver** en la columna Foto para abrir la imagen original.

Pulsa **Volver al escáner** para regresar al flujo de escaneo.

---

## 4. Cambiar de idioma

Menú (☰) → en la sección **Idioma** elige uno de:

- עברית (hebreo) — de derecha a izquierda
- Español
- English (inglés)

Tu elección queda guardada en el dispositivo.

---

## 5. Cerrar sesión

Menú (☰) → **Cerrar sesión**.

---

## 6. Para administradores

Los administradores ven una opción adicional: **Gestionar usuarios**.

### Añadir un usuario

1. Abre **Gestionar usuarios**.
2. Escribe el correo de Google del nuevo usuario.
3. (Opcional) Marca **Otorgar acceso de administrador** para hacerlo también administrador.
4. Pulsa **Agregar usuario**.

El nuevo usuario podrá iniciar sesión inmediatamente en su próxima visita — sin necesidad de redesplegar.

### Eliminar un usuario

En la lista de **Gestionar usuarios**, pulsa el icono de la papelera junto a un usuario → confirma. Perderá el acceso en su próximo intento de inicio de sesión.

### Administradores integrados

Los administradores listados como **Administrador integrado (env)** se definieron en el momento del despliegue mediante la variable de entorno `ADMIN_EMAILS`. No pueden eliminarse desde la interfaz — son la red de seguridad que evita quedarse sin acceso. Para modificarlos, edita la variable de entorno en Vercel.

### Notas importantes

- El correo debe coincidir con la cuenta de Google con la que el usuario inicia sesión. Añadir `alguien@outlook.com` no funcionará a menos que esa persona inicie sesión con Google usando exactamente esa dirección.
- **Promover/degradar a un administrador** surtirá efecto en el *siguiente inicio de sesión* de ese usuario. Si está conectado en ese momento, deberá cerrar sesión y volver a entrar para ver el cambio.
- Añadir un usuario solo concede acceso a **la aplicación**, no a la Hoja de Google ni a la biblioteca de imágenes de Cloudinary directamente. Para compartir la hoja, hazlo desde Google Sheets de la forma habitual.

---

## 7. Solución de problemas

| Problema | Qué intentar |
|---|---|
| "Tu correo no está autorizado" | Pide a un administrador que añada tu correo de Google. |
| El botón de cámara no hace nada | Permite el acceso a la cámara en la configuración del navegador; en iOS usa Safari (las cámaras de PWA funcionan mejor allí). |
| El OCR da malos resultados | Vuelve a tomar la foto con mejor luz; aplana el recibo; llena más el encuadre; evita brillos. |
| Se eligió un importe incorrecto | Usa el *selector de monto* en el paso 2, o edita el importe manualmente antes de enviar. |
| No puedo abrir la Hoja de Google | La hoja pertenece al proyecto; pide al propietario que la comparta con tu cuenta de Google. |
| El envío falla repetidamente | Comprueba tu conexión a internet; si persiste, contacta con el administrador. |

---

## 8. Privacidad

- El OCR se ejecuta totalmente en tu navegador — las imágenes de los recibos no se envían a ningún servicio externo de reconocimiento de texto.
- Las imágenes de los recibos y los metadatos se suben a la cuenta de Cloudinary y a la Hoja de Google del proyecto.
- El inicio de sesión se gestiona mediante Google OAuth; la aplicación solo guarda tu nombre, correo y estado de administrador en una cookie de sesión.
