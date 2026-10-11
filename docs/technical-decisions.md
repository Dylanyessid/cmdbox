# cmdbox — Decisiones técnicas

> Complementa a [requirements.md](requirements.md): aquel documento define **qué** hace la app; este define **cómo** está construida y qué convenciones sigue el código.

## 1. Convenciones de datos

| Tema | Convención | Motivo |
|---|---|---|
| **Fechas** | Unix epoch en **milisegundos**. `INTEGER` en SQLite, `number` en TypeScript. Nombres terminados en `At` (`createdAt`) / `_at` (`created_at`). | Es lo que devuelve `Date.now()`, se ordena y compara directamente y no depende de zonas horarias. Cabe sin pérdida en un `number` de JavaScript. |
| **IDs** | **UUID v4** como texto, generados en el frontend con `crypto.randomUUID()`. | El ID se conoce antes de insertar y permite exportar/importar colecciones (RF-20) sin colisiones. |
| **Nombres de campos** | `snake_case` en SQL, `camelCase` en TypeScript. La conversión se hace solo en los repositorios (`toCollection`, `toCommand`). | Cada lenguaje sigue su convención habitual y el resto de la app nunca ve nombres de columnas. |
| **Booleanos** | `INTEGER` con valores `0`/`1` en SQLite; se convierten a `0`/`1` antes de enviarlos. | SQLite no tiene tipo booleano y `plugin-sql` envía un `true` de JavaScript como texto JSON, que una tabla `STRICT` rechaza. |
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
