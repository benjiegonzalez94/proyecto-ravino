# Ravino Kashrut - Documentación Técnica y Arquitectura (Actualizado 2025)

Este documento provee el contexto técnico completo para que cualquier desarrollador o Inteligencia Artificial pueda retomar el proyecto, entender la arquitectura del generador de reportes y resolver problemas futuros.

## 1. Visión General del Proyecto
Este es un sistema local (Node.js/Express) empaquetado para correr en las máquinas de los supervisores en las fábricas. 
**Objetivo principal:** Recolectar datos de inspecciones Kosher mediante un formulario web y exportar un documento de Microsoft Word (`.docx`) estrictamente alineado con el formato oficial del Gran Rabinato de Israel (RTL - Right to Left), incluyendo inserción de firmas como imágenes en base64.

## 2. Tecnologías Principales
- **Backend:** Node.js (Express.js)
- **Generación de Word:** `docxtemplater`, `pizzip`, `docxtemplater-image-module-free`
- **Manejo de XML ZIP:** `adm-zip` (Para manipular internamente el `document.xml` del archivo Word).
- **Frontend:** HTML5, Vanilla JavaScript, CSS (Bootstrap-like).
- **Base de Datos:** JSON local (`data.json` gestionado dinámicamente) para mantener portabilidad sin requerir SQL.

## 3. Flujo de Generación de la Plantilla (`create_template.js`)
**Problema histórico:** La plantilla oficial que entrega el Rabinato tiene "subrayados" (`_____`) físicos donde deben ir los datos. Si inyectamos variables directamente, el texto en Hebreo (RTL) suele romperse, saltar líneas o cambiar el formato.
**Solución actual:** 
En lugar de que el usuario inserte manualmente variables como `{nombre}` en el Word, usamos un script (`create_template.js`) que analiza la plantilla original (`טופס דוח רבנות מעודכן 2025 תשפו-1.docx`), busca el XML subyacente y reemplaza los "espacios de subrayado" (`_____`) por las etiquetas dinámicas de `docxtemplater` de manera secuencial.

### Expresión Regular Core (Actualización 2025):
```javascript
const underlinePattern = /(<w:t[^>]*>)([^<]*?)(_{3,})([^<]*)(<\/w:t>)/g;
```
*Por qué es clave:* En la versión 2025 de la plantilla, Microsoft Word agrupa caracteres como los dos puntos `:` dentro de la misma etiqueta XML `<w:t>` que contiene los subrayados. El regex extrae el texto "antes" y "después" de los subrayados para preservarlos en el XML, sustituyendo **únicamente** los guiones bajos por la etiqueta (ej. `{fabrica}`). Existen **50 campos** mapeados secuencialmente en el objeto `positionToTag`.

## 4. Inserción de Firmas como Imágenes
Para inyectar firmas reales y no texto:
- El frontend captura la firma seleccionada (ya precargada y almacenada en `data.json` como un string Base64).
- En el backend (`generate_report.js`), estas firmas se procesan como Buffers de imagen.
- **Importante:** Para que `docxtemplater` sepa que es una imagen, la etiqueta en el Word **debe** llevar el prefijo `%` (ej. `{%firma_mashgiaj}`). 
- El módulo `docxtemplater-image-module-free` toma ese tag, calcula dimensiones físicas y reemplaza el texto por la imagen renderizada dentro del Word.

### Layout de Firmas 2025:
La plantilla 2025 introdujo una tabla lado-a-lado para las firmas finales:
- **Columna Izquierda:** "ואשרו להנפקת תעודת כשרות" (Aprobado para certificado - Certificador). Campo: `{%firma_certificador}`.
- **Columna Derecha:** "נוכח בשעת הייצור" (Presente en producción - Mashgiaj). Campo: `{%firma_mashgiaj}`.
Actualmente, el sistema inserta *solo* la firma del Mashgiaj a la derecha y deja el Certificador en blanco intencionalmente para la firma física/posterior del Rabinato.

## 5. Solución a Descargas en Navegador (Blob + Headers)
Se corrigió un error crítico donde el archivo descargado era un UUID sin extensión:
1. **Backend (`server.js`):** Expone explícitamente el header `Access-Control-Expose-Headers: Content-Disposition`. Esto permite que el frontend lea el nombre de archivo propuesto por el backend.
2. **Frontend (`app.js`):** El `URL.revokeObjectURL(url)` fue envuelto en un `setTimeout(..., 1000)`. Anteriormente, la URL del Blob se destruía antes de que el navegador completara la descarga asíncrona a disco, generando errores de red o archivos fantasmas.

## 6. Proceso de Build y Distribución
El proyecto no requiere que el cliente instale dependencias de Node. El flujo de entrega es:
1. Ejecutar `build.bat` en Windows.
2. Esto crea el directorio `dist\RavinoKashrut\` con todos los archivos necesarios.
3. Se comprime ese directorio en un archivo `.zip` (ej. `RavinoKashrut_v1.1.0_2025.zip`).
4. El cliente descarga el ZIP, lo extrae y ejecuta `instalar.bat`, el cual automáticamente copia el software a `%USERPROFILE%\RavinoKashrut` y crea un acceso directo en el Escritorio.

---
*Nota para IAs:* Si la plantilla del Rabinato cambia en 2026, lo único que debes hacer es guardar el nuevo `.docx` como fuente, revisar mediante un script de consola cuántos subrayados `___` existen en el XML `word/document.xml`, reajustar el objeto `positionToTag` en `create_template.js` para que coincida con el nuevo orden de los subrayados, y correr `node create_template.js` para generar el nuevo `template.docx` base.
