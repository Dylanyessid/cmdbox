# cmdbox — Requisitos

> Estado: **borrador v0.4** · Última actualización: 2026-10-11

## 1. Problema

En el día a día usamos decenas de comandos (`docker`, `git`, `kubectl`, `psql`, `gcloud`…) con flags y parámetros difíciles de recordar. Hoy terminan dispersos en blocs de notas, Notion o el historial de la shell: herramientas que no están pensadas para eso, donde es lento encontrarlos y hay que editarlos a mano antes de usarlos.

## 2. Visión

Una app de escritorio tipo **Postman, pero para comandos de terminal**: guardar comandos organizados en colecciones, parametrizarlos con variables, cambiar de entorno y copiarlos listos para pegar en la terminal, todo desde una interfaz rápida y liviana.

## 3. Usuario objetivo

Desarrolladores y, en general, cualquier persona que trabaja a diario en la terminal y usa muchos comandos repetitivos con pequeñas variaciones. El primer usuario es el propio autor.

## 4. Requisitos funcionales

Prioridad según **MoSCoW**: **M** = Must (MVP), **S** = Should, **C** = Could, **W** = Won't (por ahora).

### 4.1 Colecciones

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | Crear, renombrar y eliminar colecciones. | M |
| RF-02 | Ver las colecciones y sus comandos en una barra lateral. | M |
| RF-03 | Organizar colecciones en carpetas anidadas. | C |

### 4.2 Comandos

| ID | Requisito | Prioridad |
|---|---|---|
| RF-04 | Crear un comando con: nombre, plantilla del comando, descripción, tags y colección. | M |
| RF-05 | Editar, duplicar y eliminar comandos. | M |

### 4.3 Variables

| ID | Requisito | Prioridad |
|---|---|---|
| RF-06 | Usar variables con la sintaxis `{{nombre}}` dentro de la plantilla del comando. | M |
| RF-07 | Detectar automáticamente las variables y generar un formulario para llenarlas. | M |
| RF-08 | Definir un valor por defecto por variable. | S |
| RF-09 | Mostrar una vista previa del comando final con las variables resueltas. | M |
| RF-10 | Impedir copiar el comando si falta el valor de alguna variable. | M |
| RF-11 | Marcar una variable como **secreta**: su valor se oculta en la interfaz. | S |

### 4.4 Entornos

| ID | Requisito | Prioridad |
|---|---|---|
| RF-12 | Crear entornos (ej. `dev`, `prod`) con valores para variables. | M |
| RF-13 | Seleccionar el entorno activo. | M |
| RF-14 | Resolver variables con esta precedencia: valor manual > entorno activo > valor por defecto. | M |
| RF-15 | Marcar un entorno como **sensible**: se resalta visualmente y exige confirmación antes de copiar. | S |

### 4.5 Uso de comandos

| ID | Requisito | Prioridad |
|---|---|---|
| RF-16 | Copiar el comando resuelto al portapapeles. | M |
| RF-17 | Buscar, seleccionar y copiar un comando solo con el teclado (`Ctrl+K` → `Enter`). | S |
| RF-18 | Búsqueda rápida (`Ctrl+K`) por nombre, plantilla y tags, con coincidencia aproximada (fuzzy). | M |
| RF-19 | Registrar el uso de cada comando (veces copiado, último uso) para ordenarlos por frecuencia. | S |

### 4.6 Datos

| ID | Requisito | Prioridad |
|---|---|---|
| RF-20 | Exportar e importar colecciones (JSON). | S |

### 4.7 Versiones futuras

| ID | Requisito | Prioridad |
|---|---|---|
| RF-21 | Ejecutar comandos dentro de la app y mostrar su salida. | W |
| RF-22 | Abrir un comando en la terminal del sistema con las variables resueltas. | W |
| RF-23 | Terminal integrada (pty) para comandos interactivos. | W |
| RF-24 | Guardar los valores de variables secretas en el keychain del sistema operativo. | W |

## 5. Requisitos no funcionales

| ID | Requisito |
|---|---|
| RNF-01 | **Liviana**: inicio rápido y bajo consumo de memoria en reposo (motivo principal para elegir Tauri). |
| RNF-02 | **Local y offline**: todos los datos se guardan en la máquina del usuario; sin cuenta ni telemetría. |
| RNF-03 | **Seguridad — sin ejecución**: el MVP no ejecuta comandos ni lanza procesos; solo los copia al portapapeles. |
| RNF-04 | **Seguridad — mínimo privilegio**: la interfaz solo tiene los permisos (capabilities de Tauri) estrictamente necesarios. |
| RNF-05 | **Seguridad — CSP** configurada para que la interfaz no cargue recursos externos. |
| RNF-06 | **Plataforma**: Linux primero; diseño que no impida soportar macOS y Windows después. |
| RNF-07 | **Usable con teclado**: las acciones principales tienen atajos. |

## 6. Fuera de alcance (MVP)

- Ejecutar comandos de cualquier forma (ver RF-21 a RF-23).
- Sincronización en la nube y cuentas de usuario.
- Colaboración en equipo / colecciones compartidas en tiempo real.
- Encadenar comandos en flujos o pipelines.

## 7. Decisiones técnicas

| Decisión | Motivo |
|---|---|
| **Tauri v2** en lugar de Electron | App más liviana: usa el webview del sistema en vez de incluir Chromium (RNF-01). |
| **React + TypeScript** en el frontend | Stack que el autor domina; permite enfocarse en el producto. |
| **Plugins oficiales de Tauri** en lugar de Rust propio | Reduce el código Rust al mínimo y aprovecha piezas mantenidas y auditadas. |
| **Sin ejecución en el MVP**: solo copiar al portapapeles | Evita gestión de procesos, permisos de shell y riesgos de seguridad; enfoca el MVP en organizar, parametrizar y encontrar comandos. |
| **SQLite** (`plugin-sql`) para la persistencia | Garantiza consistencia de los datos y operaciones atómicas: cada escritura se aplica completa o no se aplica, incluso si la app se cierra inesperadamente. Además, maneja bien escrituras pequeñas y frecuentes, como el registro de uso (RF-19). |
| **Almacenamiento detrás de una capa de repositorio** | La interfaz no depende de SQLite directamente; facilita las pruebas y permite cambiar la persistencia sin tocar el resto de la app. |
| **Secretos solo ocultos en la interfaz** en el MVP | Cubre el riesgo principal (que se vean en pantalla) sin la complejidad de integrar el keychain de cada sistema operativo. Limitación conocida: los valores se guardan sin cifrar en la base de datos local; el keychain queda para el futuro (RF-24). |
| **Interfaz en inglés** | Hace la app usable por cualquier desarrollador y el proyecto más útil como portafolio internacional. |
| **pnpm** como gestor de paquetes | Preferencia del autor; instalaciones rápidas. |

## 8. Modelo de datos (borrador)

Tablas en SQLite; las relaciones usan claves foráneas con `ON DELETE CASCADE` (al borrar una colección se borran sus comandos en una sola operación).

```
Collection   { id, name, createdAt, updatedAt }
Command      { id, collectionId → Collection, name, template, description, tags[],
               variables: Variable[], copyCount, lastUsedAt?,
               createdAt, updatedAt }
Variable     { name, defaultValue?, secret }          // detectadas de la plantilla
Environment  { id, name, sensitive, values: { [variable]: string } }
```

> **Nota técnica**: `plugin-sql` usa un pool de conexiones, por lo que una transacción enviada como varias llamadas separadas desde el frontend (`BEGIN` … `COMMIT`) podría no ejecutarse en la misma conexión. Hay que verificarlo al implementar la persistencia; si se confirma, las operaciones de varios pasos se implementarán como un comando en Rust con una transacción real.

## 9. Preguntas abiertas

Ninguna por ahora.
