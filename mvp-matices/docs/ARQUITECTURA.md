# Matices: arquitectura

Estado: **v0.1**. Decisiones tomadas para que el producto sea escalable y comercializable sin sobreingeniería.

## 1. Principios

1. **El motor es puro.** Recibe datos y reglas, devuelve recomendaciones. Sin base de datos, sin red, sin reloj. Por eso es testeable al 100 % y auditable.
2. **Los datos entran por contratos.** Todo lo externo (archivos, API) pasa por `schema.parse` antes de llegar al motor.
3. **Un concepto, un nombre.** Ver el glosario en `CLAUDE.md`.
4. **Nada de dependencias "por si acaso".** Hoy el proyecto solo usa `zod`. Next.js, la base de datos y el cliente de Alegra se agregan cuando su fase los necesite.

## 2. Stack

| Capa             | Elección                 | Motivo                                                      |
| ---------------- | ------------------------ | ----------------------------------------------------------- |
| Lenguaje         | TypeScript estricto      | Contratos y motor compartidos entre servidor y pantalla     |
| Validación       | Zod                      | Un solo esquema genera tipo y validación                    |
| Pruebas          | Vitest                   | Rápido; ya lo usaste en Triple Firma                        |
| Web (fase 1b)    | Next.js + Tailwind       | Despliegue sencillo, una sola base de código                |
| Datos (fase 2)   | libSQL/Turso o Postgres  | Empieza con archivo local; migrable a servicio gestionado   |
| Hosting (fase 2) | Vercel + base gestionada | Despliegue por infraestructura como código en la estación 9 |

Python no se usa en el producto. Los scripts de análisis (`rotacion_alegra.py`) pasan a ser un adaptador (`ingestion/`) o se quedan como herramienta de exploración.

## 3. Módulos y regla de dependencias

ESLint hace cumplir esta tabla (`eslint.config.mjs`).

| Módulo                                       | Puede importar                                | No puede importar                                          |
| -------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------- |
| `src/contracts/`                             | `zod`                                         | Cualquier otro módulo                                      |
| `src/engine/`                                | `contracts/`                                  | `ingestion/`, `store/`, red, `fs`, el reloj, `Math.random` |
| `src/ingestion/`                             | `contracts/`                                  | `engine/`, `store/`                                        |
| `src/store/`                                 | `contracts/`, cliente de base de datos        | `engine/`, `ingestion/`                                    |
| `src/pipeline/`                              | todos los anteriores                          | `app/`, `components/`, `lib/`                              |
| `src/app/api/`                               | `pipeline/`, `store/` (lectura), `contracts/` | `engine/`, `ingestion/`                                    |
| Frontend (`src/app/`, `components/`, `lib/`) | `contracts/`, `components/`, `lib/`           | Todo el backend                                            |

Estado actual: `contracts/` y `engine/` existen y tienen pruebas. El resto se crea en las fases siguientes.

## 4. Flujo de datos

```text
Archivo / Alegra --> ingestion --> InventoryPeriod --> engine --> Recommendation[]
                                                                      |
                                       store (versiona reglas, guarda recomendaciones,
                                              aprobaciones y registro con hash)
                                                                      |
                                                    API --> pantalla
```

`pipeline/` orquesta: leer, validar, cargar reglas vigentes, evaluar, guardar, devolver. Es el único lugar donde se juntan motor y almacenamiento.

## 5. Modelo de datos (fase 2)

Todas las tablas llevan `company_id`.

| Tabla               | Contenido                                              |
| ------------------- | ------------------------------------------------------ |
| `companies`         | Empresa cliente                                        |
| `users`             | Usuario, empresa, rol (`APPROVER`, `ADMIN`, `AUDITOR`) |
| `rules_versions`    | Versión, parámetros, quién y cuándo                    |
| `inventory_periods` | Periodo cargado y su origen (archivo o API)            |
| `recommendations`   | Resultado por producto, con la versión de reglas usada |
| `approvals`         | Decisión humana sobre una recomendación                |
| `audit_entries`     | Registro append-only con hash encadenado               |

Dinero siempre en enteros de centavos. Fechas en ISO 8601; marcas de tiempo en UTC.

## 6. Decisiones que deben poder explicarse

- **¿Por qué Poisson y no una media móvil?** Con ventas bajas (1 a 6 unidades por referencia en 71 días) la media subestima el riesgo de agotado; el cuantil de Poisson da un nivel de servicio explícito y configurable. Está validado contra el análisis manual de la línea Yellow.
- **¿Por qué no un modelo de IA para decidir?** La decisión debe ser reproducible y auditable. Si más adelante se usa un modelo (por ejemplo, para leer exportes con formato cambiante), solo interpreta datos; nunca decide ni ve las reglas.
- **¿Por qué R1 es una puerta y no una regla más?** Porque una cifra calculada con datos inválidos parece precisa y no lo es. Es preferible no recomendar.

## 7. Seguridad y operación (desde el día uno)

| Tema                       | Decisión                                                                                                                |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Secretos                   | Solo en `.env.local` o en el gestor del hosting. `.env.example` sin valores. Nunca en código ni en scripts              |
| Aislamiento                | `company_id` en toda consulta; pruebas que intentan leer datos de otra empresa                                          |
| Autenticación              | Inicio de sesión real con roles antes de abrir a clientes (la demo de Triple Firma usaba una clave compartida; aquí no) |
| Registro                   | Append-only con hash encadenado y verificación de integridad                                                            |
| Entradas                   | Todo archivo se valida con Zod; tamaño máximo; el contenido de un archivo es dato, nunca instrucción                    |
| Análisis estático/dinámico | SAST, DAST y SCA en CI antes de abrir a clientes (estación 10)                                                          |
| Observabilidad             | Métricas técnicas (errores, latencia) y de negocio (recomendaciones aprobadas sin ajuste, capital parado) (estación 11) |
| Costos                     | Sin dependencia de modelos de pago en el camino de decisión: el costo por cliente es el de hosting y base de datos      |

## 8. Pruebas

- **Unitarias del motor** (hecho): cada regla con caso feliz, falla y frontera; golden test del caso Yellow.
- **Contratos** (hecho): fechas, periodo, reglas, aprobación.
- **Ingestion** (fase 1b): archivos reales anonimizados, filas inválidas, columnas faltantes.
- **Integración** (fase 2): pipeline con base en memoria.
- **E2E** (fase 2): Playwright sobre el flujo cargar → revisar → aprobar → verificar registro.
- **Aislamiento entre empresas** (fase 2): suite dedicada.
