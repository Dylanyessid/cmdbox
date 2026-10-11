# cmdbox — Decisiones técnicas

> Complementa a [requirements.md](requirements.md): aquel documento define **qué** hace la app; este define **cómo** está construida y qué convenciones sigue el código.

## 1. Convenciones de datos

| Tema | Convención | Motivo |
|---|---|---|
| **Fechas** | Unix epoch en **milisegundos**. `INTEGER` en SQLite, `number` en TypeScript. Nombres terminados en `At` (`createdAt`) / `_at` (`created_at`). | Es lo que devuelve `Date.now()`, se ordena y compara directamente y no depende de zonas horarias. Cabe sin pérdida en un `number` de JavaScript. |
| **IDs** | **UUID v4** como texto, generados en el frontend con `crypto.randomUUID()`. | El ID se conoce antes de insertar y permite exportar/importar colecciones (RF-20) sin colisiones. |
| **Nombres de campos** | `snake_case` en SQL, `camelCase` en TypeScript. La conversión se hace solo en los repositorios (`toCollection`, `toCommand`). | Cada lenguaje sigue su convención habitual y el resto de la app nunca ve nombres de columnas. |
| **Booleanos** | Nombres con prefijo `is`/`has`/`can` (`isSecret`, `is_sensitive`). En SQLite son `INTEGER` con valores `0`/`1` y se convierten a `0`/`1` antes de enviarlos. | El prefijo deja claro que es un booleano: `secret` podría confundirse con el valor secreto. SQLite no tiene tipo booleano y `plugin-sql` envía un `true` de JavaScript como texto JSON, que una tabla `STRICT` rechaza. |
| **Listas y objetos propios de una entidad** | Columna `TEXT` con JSON, validada con `CHECK (json_valid(...))`. | Ver D-02. |
| **Texto** | Los nombres se guardan sin espacios al inicio o al final (`trim`). Las listas se ordenan alfabéticamente sin distinguir mayúsculas (`COLLATE NOCASE`). | Evita nombres "vacíos" o duplicados que solo difieren en espacios, y un orden natural para el usuario. |

## 2. Decisiones

Cada decisión sigue el formato **contexto → decisión → consecuencias**.

### D-01 · Cada escritura es una sola sentencia SQL

- **Contexto**: `tauri-plugin-sql` ejecuta cada llamada en cualquier conexión de su pool. Un `BEGIN` y un `COMMIT` enviados por separado desde el frontend pueden ir a conexiones distintas, así que las transacciones de varios pasos no son fiables (verificado en el código fuente del plugin, v2.5.0).
- **Decisión**: el esquema se diseña para que toda operación de escritura sea **una única sentencia**, que SQLite ejecuta de forma atómica.
- **Consecuencias**: no hay estados intermedios inconsistentes. Si en el futuro una operación necesita varias sentencias, se implementará como un comando en Rust con una transacción real.

### D-02 · Tags y variables como columnas JSON

- **Contexto**: un comando tiene una lista de tags y una lista de variables. Con tablas separadas, guardar un comando requeriría varias sentencias (incompatible con D-01).
- **Decisión**: `tags` y `variables` se guardan como JSON dentro de la tabla `commands`.
- **Consecuencias**: guardar un comando es atómico y simple. A cambio, no se pueden consultar tags eficientemente con SQL; no es un problema porque la búsqueda se hace en memoria en el frontend.

### D-03 · Borrado en cascada

- **Contexto**: borrar una colección debe borrar sus comandos (D-01 impide hacerlo en dos pasos).
- **Decisión**: `commands.collection_id` usa `ON DELETE CASCADE`. sqlx activa las claves foráneas por defecto en cada conexión.
- **Consecuencias**: el borrado es atómico y no pueden quedar comandos huérfanos.

### D-04 · Migraciones versionadas en Rust

- **Contexto**: el esquema de la base de datos cambiará a medida que se implementen requisitos (por ejemplo, entornos).
- **Decisión**: cada cambio es un archivo SQL numerado en `src-tauri/migrations/`, registrado en `src-tauri/src/lib.rs`. Se aplican al iniciar la app (`preload` en `tauri.conf.json`) y sqlx registra cuáles ya se ejecutaron.
- **Consecuencias**: una migración ya publicada **nunca se edita**; cualquier cambio va en una migración nueva. Las tablas son `STRICT` y usan `CHECK` para que la base de datos rechace datos inválidos aunque haya un bug en el código.

### D-05 · Repositorios como única puerta a la base de datos

- **Contexto**: la interfaz no debería depender de SQLite ni de SQL.
- **Decisión**: el resto de la app solo importa desde `src/repositories` (interfaces en `types.ts`). La implementación con SQLite vive en `src/repositories/sqlite/` y se elige únicamente en `src/repositories/index.ts`.
- **Consecuencias**: la persistencia se puede probar con implementaciones falsas y reemplazar sin tocar la interfaz.

### D-06 · Consultas SQL en el frontend (riesgo aceptado)

- **Contexto**: con `sql:allow-execute`, el frontend puede ejecutar cualquier SQL contra la base de datos. Si existiera una vulnerabilidad XSS, un script inyectado podría leer, modificar o borrar los datos. La alternativa sería exponer solo comandos fijos en Rust (`create_collection`, `delete_command`…), pero aun así un script inyectado podría **leer** todos los datos a través de esos comandos: solo se evitaría el SQL arbitrario.
- **Decisión**: mantener las consultas en TypeScript (en la capa de repositorios) y concentrar la defensa en evitar el XSS y la fuga de datos:
  - **Consultas parametrizadas** (`?1`, `?2`…, la sintaxis nativa de SQLite): los valores nunca se concatenan al SQL. Cualquier `${}` dentro de una consulta solo puede ser una constante del código.
  - **CSP estricta** (RNF-05): no se cargan scripts externos y no se permiten conexiones a servidores externos, así que un script inyectado no podría enviar los datos a ningún lado.
  - **React escapa el texto por defecto**; está prohibido `dangerouslySetInnerHTML` y renderizar HTML proveniente de los datos.
- **Consecuencias**: se acepta un riesgo bajo (requiere primero un XSS, en una app que no carga contenido externo, y afecta solo a la base de datos local) a cambio de no mantener una capa de comandos en Rust. Si el riesgo cambia (por ejemplo, con sincronización en la nube), se migra solo la implementación de `src/repositories/sqlite/` (ver D-05).

### D-07 · Borrado definitivo en lugar de borrado lógico

- **Contexto**: un borrado lógico (columna `deleted_at`) permitiría recuperar datos eliminados por error. A cambio, cada consulta debe filtrar los registros borrados (olvidarlo hace reaparecer datos), hay que diseñar la restauración (¿un comando cuya colección sigue borrada?), los datos crecen sin límite y los valores de variables secretas "borradas" seguirían guardados.
- **Decisión**: borrado definitivo (`DELETE` + `ON DELETE CASCADE`), protegido por un diálogo de confirmación que indica qué se eliminará. La exportación a JSON (RF-20) sirve como respaldo.
- **Consecuencias**: un borrado confirmado no se puede deshacer. Si en el futuro se implementa la recuperación (RF-25), la opción preferida es un "deshacer" temporal sin cambiar el esquema; si se optara por borrado lógico, la propagación a los comandos se haría con un trigger de SQLite para mantener la operación en una sola sentencia (D-01).

### D-08 · Estilos inline permitidos en la CSP

- **Contexto**: los componentes de la interfaz inyectan etiquetas `<style>` en tiempo de ejecución: `sonner` (notificaciones) inserta su CSS al cargarse y los diálogos y menús de Radix (base de shadcn/ui) lo hacen para bloquear el scroll mientras están abiertos. Con `style-src 'self'` esos estilos se bloquean. Además, Tauri añade un *nonce* a `style-src` al compilar, y cuando hay un nonce los navegadores ignoran `'unsafe-inline'`.
- **Decisión**: `style-src 'self' 'unsafe-inline'` y `dangerousDisableAssetCspModification: ["style-src"]`, para que Tauri no añada el nonce **solo** a los estilos. `script-src` no cambia: los scripts siguen limitados a la app y protegidos con nonces y hashes.
- **Consecuencias**: un atacante que lograra inyectar HTML podría inyectar CSS, pero no ejecutar JavaScript. Los ataques basados en CSS que filtran datos dependen de cargar recursos externos (`url(...)`), que siguen bloqueados por `img-src`, `font-src` (vía `default-src`) y `connect-src`. Se acepta este riesgo bajo a cambio de usar componentes accesibles y mantenidos en lugar de reimplementarlos.
