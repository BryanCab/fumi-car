# Fumi-Car · sitio web

Sitio estático (HTML + CSS + JS sin dependencias de build) de **Fumi-Car**, control profesional de plagas en CDMX y Estado de México. Producción: https://fumi-car.com

## Páginas
| Archivo | Contenido |
| --- | --- |
| `index.html` | Inicio: hero, servicios, paquetes, cobertura, portal PestOS, trabajo real, FAQ y formulario (envía a WhatsApp). |
| `guia-cliente.html` | Proceso, paquetes, cuidados, agenda/pagos y reto interactivo. |
| `promociones.html` | Promociones y rifa del mes. |

## Estructura
- `base.css` / `base.js`: sistema de diseño compartido (tokens, header, footer, botones, reveal, contadores).
- `home.css` / `home.js`, `guia-cliente.css` / `guia-cliente.js`, `promociones.css`: estilos y lógica por página.
- `assets/images/`: imágenes locales optimizadas (WebP). Las fotos de ambientación vienen por CDN de Unsplash.
- `sitemap.xml`, `robots.txt`: SEO.

## Desarrollo
No requiere build. Para verlo localmente: `python -m http.server 8080` y abrir http://localhost:8080.
Al cambiar CSS/JS, sube el parámetro `?v=` de los `<link>`/`<script>` para invalidar caché.

## Paleta
Verde bosque `#06231B`, verde hoja `#5DBB3F`, amarillo `#FFC61A`, crema `#F5F3EA` (tomada de la mascota oficial).
