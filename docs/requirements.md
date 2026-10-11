# cmdbox — Requisitos

> Estado: **borrador v0.1** · Última actualización: 2026-10-11

## 1. Problema

En el día a día usamos decenas de comandos (`docker`, `git`, `kubectl`, `psql`, `dbt`, `gcloud`…) con flags y parámetros difíciles de recordar. Hoy terminan dispersos en blocs de notas, Notion o el historial de la shell: herramientas que no están pensadas para eso, donde es lento encontrarlos y hay que editarlos a mano antes de ejecutarlos.

## 2. Visión

Una app de escritorio tipo **Postman, pero para comandos de terminal**: guardar comandos organizados en colecciones, parametrizarlos con variables, cambiar de entorno y ejecutarlos viendo la salida, todo desde una interfaz rápida y liviana.

## 3. Usuario objetivo

Desarrolladores e ingenieros de datos que trabajan a diario en la terminal y usan muchos comandos repetitivos con pequeñas variaciones. El primer usuario es el propio autor.

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
| RF-06 | Definir un directorio de trabajo opcional por comando. | S |
| RF-07 | Marcar un comando como **interactivo** (requiere entrada del usuario, ej. `ssh`, `psql`). | M |

### 4.3 Variables

| ID | Requisito | Prioridad |
|---|---|---|
| RF-08 | Usar variables con la sintaxis `{{nombre}}` dentro de la plantilla del comando. | M |
| RF-09 | Detectar automáticamente las variables y generar un formulario para llenarlas. | M |
| RF-10 | Definir un valor por defecto por variable. | S |
| RF-11 | Mostrar una vista previa del comando final (con variables resueltas) antes de ejecutarlo. | M |
| RF-12 | Impedir la ejecución si falta el valor de alguna variable. | M |

### 4.4 Entornos

| ID | Requisito | Prioridad |
|---|---|---|
| RF-13 | Crear entornos (ej. `dev`, `prod`) con valores para variables. | M |
| RF-14 | Seleccionar el entorno activo. | M |
| RF-15 | Resolver variables con esta precedencia: valor manual > entorno activo > valor por defecto. | M |
| RF-16 | Marcar un entorno como **sensible**: se resalta visualmente y exige confirmación antes de ejecutar. | S |

### 4.5 Ejecución

| ID | Requisito | Prioridad |
|---|---|---|
| RF-17 | Ejecutar comandos no interactivos y mostrar la salida (stdout/stderr) en vivo. | M |
| RF-18 | Cancelar un comando en ejecución. | M |
| RF-19 | Mostrar código de salida y duración al terminar. | M |
| RF-20 | Abrir los comandos interactivos en la terminal del sistema con las variables ya resueltas. | M |
| RF-21 | Copiar el comando resuelto al portapapeles. | M |
| RF-22 | Terminal integrada (pty) para comandos interactivos dentro de la app. | W |

### 4.6 Búsqueda

| ID | Requisito | Prioridad |
|---|---|---|
| RF-23 | Búsqueda rápida (`Ctrl+K`) por nombre, plantilla y tags, con coincidencia aproximada (fuzzy). | M |

### 4.7 Historial y datos

| ID | Requisito | Prioridad |
|---|---|---|
| RF-24 | Registrar cada ejecución: comando resuelto, entorno, código de salida, duración y fecha. | S |
| RF-25 | Ver estadísticas de uso (comandos más usados, tasa de fallos). | C |
| RF-26 | Exportar e importar colecciones (JSON). | S |

## 5. Requisitos no funcionales

| ID | Requisito |
|---|---|
| RNF-01 | **Liviana**: inicio rápido y bajo consumo de memoria en reposo (motivo principal para elegir Tauri). |
| RNF-02 | **Local y offline**: todos los datos se guardan en la máquina del usuario; sin cuenta ni telemetría. |
| RNF-03 | **Seguridad — mínimo privilegio**: la interfaz solo tiene los permisos (capabilities de Tauri) estrictamente necesarios. |
| RNF-04 | **Seguridad — CSP** configurada para que la interfaz no cargue recursos externos. |
| RNF-05 | **Seguridad — ejecución explícita**: un comando solo se ejecuta por acción directa del usuario, nunca automáticamente. |
| RNF-06 | **Seguridad — secretos**: las variables marcadas como secretas no se muestran en claro ni se guardan en el historial. |
| RNF-07 | **Plataforma**: Linux primero; diseño que no impida soportar macOS y Windows después. |
| RNF-08 | **Usable con teclado**: las acciones principales tienen atajos. |

## 6. Fuera de alcance (MVP)

- Terminal integrada con pty (ver RF-22).
- Sincronización en la nube y cuentas de usuario.
- Colaboración en equipo / colecciones compartidas en tiempo real.
- Encadenar comandos en flujos o pipelines.
- Gestión de conexiones SSH remotas.

## 7. Decisiones técnicas

| Decisión | Motivo |
|---|---|
| **Tauri v2** en lugar de Electron | App más liviana: usa el webview del sistema en vez de incluir Chromium (RNF-01). |
| **React + TypeScript** en el frontend | Stack que el autor domina; permite enfocarse en el producto. |
| **Plugins oficiales de Tauri** en lugar de Rust propio | Reduce el código Rust al mínimo y aprovecha piezas mantenidas y auditadas. |
| **Sin pty en el MVP**; los interactivos se abren en la terminal del sistema | `plugin-shell` no soporta pty. Cubre la mayoría de casos sin complejidad extra. |
| **pnpm** como gestor de paquetes | Preferencia del autor; instalaciones rápidas. |

## 8. Modelo de datos (borrador)

```
Collection   { id, name, createdAt, updatedAt }
Command      { id, collectionId, name, template, description, tags[],
               workingDir?, interactive, createdAt, updatedAt }
Variable     { name, defaultValue?, secret }          // por comando, detectadas de la plantilla
Environment  { id, name, sensitive, values: { [variable]: string } }
Execution    { id, commandId, environmentId?, resolvedCommand,
               exitCode, durationMs, startedAt }
```

## 9. Preguntas abiertas

1. **Almacenamiento**: ¿SQLite (`plugin-sql`) o archivos JSON/YAML? Los archivos se pueden versionar con git y compartir; SQLite facilita el historial y las consultas.
2. **Secretos**: ¿guardarlos en el keychain del sistema desde el MVP o solo ocultarlos (RNF-06) y dejar el keychain para después?
3. **Shell de ejecución**: ¿usar la shell del usuario (`$SHELL`) para que funcionen sus alias y su PATH? Los alias solo se cargan en shells interactivas, lo que tiene implicaciones.
4. **Idioma**: ¿documentación e interfaz en español o en inglés?
