# Legendary Crafting Data

This repository contains the scripts used by the site. Source files are kept in `src/js` and the distributable, minified versions live in `/dist/js/`.

Run `npm run build` to regenerate the bundles. The command uses Rollup to transform each file under `src/js` into `/dist/js/<name>.min.js`.

Include the bundles from `/dist/js/` in your HTML pages:

```html
<script src="/dist/js/bundle-legendary.min.js"></script>
```

After loading `/dist/js/bundle-legendary.min.js` a global object `window.LegendaryData` becomes available with the following properties:

- `LEGENDARY_ITEMS` – mapping of first generation legendary items.
- `LEGENDARY_ITEMS_3GEN` – mapping of third generation legendary weapons.
- `BASIC_MATERIALS` – shared basic material definitions for Gen 1 items.
- `BASIC_MATERIALS_3GEN` – basic material definitions for Gen 3 items.

Example usage:

```html
<script src="/dist/js/bundle-legendary.min.js"></script>
<script>
  const { LEGENDARY_ITEMS } = window.LegendaryData;
  console.log(Object.keys(LEGENDARY_ITEMS));
</script>
```

Modules such as `dones.js` rely on this object to fetch legendary item information. Future scripts should also consume data from `window.LegendaryData` to ensure consistency across the project.

## Notas de refactorización

- Todas las páginas HTML ahora cargan scripts desde `/dist/js/` en lugar de `js/`.
- Los archivos fuente originales se movieron a `src/js`.
- Varias funciones de `items-core.js` se exponen en `window` para seguir siendo accesibles sin módulos.

## Concurrencia

- Las comparativas cargadas desde la URL se procesan en paralelo usando `Promise.allSettled` en lotes de hasta 10 peticiones.
- Los componentes de ítems legendarios se generan concurrentemente mediante `Promise.allSettled`.
- No se añadieron nuevas dependencias; las APIs externas pueden limitar el número máximo de solicitudes simultáneas.

## Configuración del backend

El proyecto incluye un pequeño backend en PHP ubicado en `backend/` que se encarga de guardar favoritos, comparaciones y la información de la sesión.

> **Aviso**
> Este proyecto está configurado para ejecutarse en un servidor real.
> Revisa las variables `DB_HOST`, `DB_NAME`, `DB_USER` y `DB_PASS` en `.env` antes de desplegar.
> El backend ya no está pensado sólo para GitHub Pages.

### Crear la base de datos

1. Crea una base de datos en tu servidor MySQL (por defecto se usa `gw2db`).
2. Ejecuta el script `setup.sql` para crear las tablas necesarias:

   ```bash
   mysql -u <usuario> -p <nombre_db> < backend/setup.sql
   ```

### Configurar credenciales

`backend/config.php` lee las credenciales de conexión mediante las variables de entorno `DB_HOST`, `DB_NAME`, `DB_USER` y `DB_PASS`. Si no existen, se emplean los valores predeterminados definidos en el archivo.

Puedes definir estas variables de dos formas:

1. Exportándolas manualmente en tu terminal:

   ```bash
   export DB_HOST=localhost
   export DB_NAME=gw2db
   export DB_USER=root
   export DB_PASS=
   export GOOGLE_CLIENT_ID=<tu-id-google>
   export GOOGLE_CLIENT_SECRET=<tu-secreto-google>
   export DISCORD_CLIENT_ID=<tu-id-discord>
   export DISCORD_CLIENT_SECRET=<tu-secreto-discord>
   export OAUTH_REDIRECT_URI=https://gw2item.com/backend/oauth_callback.php
   ```

2. Creando un archivo `.env` en la raíz del proyecto con las mismas claves. Este archivo se cargará automáticamente gracias a `backend/env.php`:

  ```env
  DB_HOST=localhost
  DB_NAME=gw2db
  DB_USER=root
  DB_PASS=
  GOOGLE_CLIENT_ID=<tu-id-google>
  GOOGLE_CLIENT_SECRET=<tu-secreto-google>
  DISCORD_CLIENT_ID=<tu-id-discord>
  DISCORD_CLIENT_SECRET=<tu-secreto-discord>
  OAUTH_REDIRECT_URI=https://gw2item.com/backend/oauth_callback.php
  API_BASE_URL=https://api.guildwars2.com/v2
  LANG=es
  MARKET_CSV_URL=https://api.datawars2.ie/gw2/v1/items/csv
  GW2_API_KEY=
  ```

Las variables `API_BASE_URL`, `LANG` y `MARKET_CSV_URL` permiten
personalizar las URL de la API y el idioma por defecto. `GW2_API_KEY`
se usará para acceder a endpoints que requieren autenticación.

Si necesitas usar otra ubicación para este archivo, define la variable
de entorno `ENV_PATH` con la ruta al `.env`. `backend/env.php` la
utilizará antes de comprobar las rutas predeterminadas.

### Configurar DB_HOST, DB_NAME, DB_USER y DB_PASS en un servidor real

Cuando despliegues el backend fuera de GitHub Pages necesitarás que la
conexión a la base de datos apunte a tu servidor. La ruta indicada por
`ENV_PATH` (o el propio `.env`) debe incluir las credenciales reales:

```env
DB_HOST=<ip-o-hostname>
DB_NAME=<nombre_db>
DB_USER=<usuario_db>
DB_PASS=<password_db>
```

Para la instancia en producci\xc3\xb3n este repositorio incluye un `.env`
de ejemplo con los valores reales predefinidos:

```env
DB_HOST=localhost
DB_NAME=ferna380_gw2item
DB_USER=ferna380_ruaner
DB_PASS=<contrase\xc3\xb1a-asignada>
```

Solo debes actualizar `DB_PASS` con la contrase\xc3\xb1a correspondiente si
clonas el proyecto para usarlo en otro entorno. Con ello el backend quedar\xc3\xa1
listo para ejecutarse en un servidor real y no exclusivamente desde GitHub Pages.

Si estos valores no se establecen correctamente, `backend/config.php`
devolverá `{"error":"Database connection failed"}` al no poder abrir la
conexión.

Asegúrate de que `OAUTH_REDIRECT_URI` apunte a la ubicación pública de `oauth_callback.php` y que el resto de valores coincidan con los configurados en las consolas de desarrolladores de Google y Discord.

`GOOGLE_CLIENT_ID` ahora corresponde al nuevo identificador de OAuth y `OAUTH_REDIRECT_URI` debe apuntar a la URL pública donde se encuentra `oauth_callback.php`.

Para que la cookie de sesión pueda marcarse como `secure`, ejecuta el backend bajo HTTPS. `oauth_callback.php` utilizará esa opción automáticamente cuando la variable `$_SERVER['HTTPS']` esté definida.

### Endpoints disponibles

Dentro de `backend/api/` existen tres endpoints principales que el frontend consume mediante `fetch`:

- **`user.php`** – Devuelve la información del usuario autenticado.
- **`favorites.php`** – Permite listar, añadir o eliminar IDs de ítems favoritos usando los métodos `GET`, `POST` y `DELETE` respectivamente.
- **`comparisons.php`** – Gestiona las comparativas guardadas con la misma convención de métodos HTTP.

Todos ellos requieren que el navegador envíe la cookie `session_id` generada al autenticarse con `auth.php` y `oauth_callback.php`. Los módulos de `src/js/storageUtils.js` y `src/js/cuenta.js` muestran ejemplos de cómo se consumen desde el frontend.

### Troubleshooting
Si las variables de entorno no se cargan correctamente, comprueba que `ENV_PATH` apunte a la ruta completa de tu archivo `.env`. Puedes exportarla en la terminal:

```bash
export ENV_PATH=/ruta/completa/a/.env
```

Para verificar que el archivo se ha leído, ejecuta un pequeño script PHP:

```php
var_dump(getenv('DB_HOST'));
```

Debería mostrar el host definido en tu `.env`.
