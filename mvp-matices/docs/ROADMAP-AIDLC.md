# Matices: roadmap con la metodología AI-DLC de 30X

La metodología de 30X ("AI for Developers") lleva un producto de la idea al producto desplegado en 12 estaciones, con la especificación como columna vertebral y el agente de código trabajando dentro de un entorno diseñado (contexto, herramientas, control y evaluación). Esta tabla traduce cada estación a lo que significa para Matices y dice en qué punto está.

Fuente de las estaciones: <https://30x.com/ai-for-developers>. La página no detalla las reglas internas de AI-DLC; los hábitos concretos (contratos Zod, motor puro, `CLAUDE.md` con invariantes, regla de dependencias en ESLint, registro con hash) vienen de tu experiencia en Triple Firma.

| #   | Estación 30X                             | Entregable en Matices                                                                                   | Estado                                                    |
| --- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 1   | Bienvenida, demo y elección del producto | Producto elegido: recomendador de compra de inventario                                                  | Hecho                                                     |
| 2   | Mentalidad de producto y PRD             | `docs/PRD.md`                                                                                           | **Borrador v0.1**; faltan entrevistas, benchmark y precio |
| 3   | Herramientas de IA, stack y spec técnica | `docs/ARQUITECTURA.md` (stack y decisiones)                                                             | Borrador v0.1                                             |
| 4   | Control de la especificación funcional   | `docs/SPEC-FUNCIONAL.md`                                                                                | Borrador v0.1                                             |
| 5   | Arquitectura (BDD, TDD, DDD)             | Módulos con regla de dependencias; contratos como lenguaje del dominio; pruebas primero para cada regla | **Base hecha**: contratos, motor y 33 pruebas             |
| 6   | Agentes de código en implementación      | `CLAUDE.md` + spec → código, tú como arquitecto                                                         | En curso                                                  |
| 7   | Arnés y orquestación de agentes          | `CLAUDE.md` (invariantes, glosario, convenciones), lint de fronteras, pruebas como evaluación           | Base hecha                                                |
| 8   | Pruebas de integración y E2E             | Pipeline con base en memoria; Playwright sobre el flujo completo                                        | Pendiente (fase 2)                                        |
| 9   | Despliegue en la nube con IaC            | Vercel + base gestionada, definidos como código                                                         | Pendiente (fase 2)                                        |
| 10  | Seguridad: SAST, DAST, SCA               | Informe de seguridad; pruebas de aislamiento entre empresas                                             | Pendiente (fase 2)                                        |
| 11  | Observabilidad 360°                      | Tablero técnico y de negocio                                                                            | Pendiente (fase 3)                                        |
| 12  | Demo Day                                 | Problema, solución, valor de negocio, video                                                             | Pendiente                                                 |

## Fases

**Fase 1a (hecha): núcleo verificable.** Contratos, motor de reglas, pruebas, documentos.

**Fase 1b: MVP usable con archivos.**

1. `ingestion/`: leer el exporte de Alegra (`inventario_alegra_*.xlsx`) y el archivo de rotación; reportar filas inválidas.
2. `store/` con libSQL y `pipeline/` que orquesta.
3. Pantallas: cargar, reglas, recomendaciones, resumen, bandeja de aprobación, registro.
4. Registro de auditoría con hash y "Verificar integridad".

**Fase 2: producto.** Multiempresa, inicio de sesión con roles, conector de solo lectura a Alegra, E2E, despliegue como código, informe de seguridad.

**Fase 3: escala.** Observabilidad, redistribución entre sedes, estacionalidad, segundo conector, precios y facturación del servicio.

## Cómo trabajar cada fase con el agente (ciclo AI-DLC)

1. **Spec primero.** Cambiar `SPEC-FUNCIONAL.md` antes que el código.
2. **Pruebas que fallan.** Escribir las pruebas de la regla o la pantalla nueva y verlas fallar.
3. **Implementar** con el agente, dentro de las fronteras de `CLAUDE.md`.
4. **Verificar**: `npm test`, `npm run typecheck`, `npm run lint`. Si algo falla, se corrige antes de seguir.
5. **Revisar como arquitecto**: ¿respeta los invariantes? ¿el glosario? ¿hay dependencias nuevas sin necesidad?
6. **Registrar** la decisión en los documentos y hacer commit pequeño.

## Pendientes que necesitan una decisión tuya

- **Seguridad inmediata:** `rotacion_alegra.py` en tu carpeta de proyectos tiene el correo y el token de Alegra escritos en el código. Mueve esos valores a variables de entorno y **revoca y genera un token nuevo** en Alegra, preferiblemente de solo lectura. Este repositorio no los contiene.
- **Datos para rentabilidad:** el archivo de rotación de Yellow no trae precio de venta; el exporte general de inventario sí. Hay que decidir de cuál se toma el precio por referencia.
- **Investigación de mercado** (estación 2): entrevistas, benchmark y precio.
- **Nombre del producto y del repositorio.**
