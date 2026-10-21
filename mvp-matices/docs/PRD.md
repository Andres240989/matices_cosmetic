# Matices: PRD

> **Tesis:** los datos se leen, el código recomienda, la persona autoriza.
> Matices dice qué comprar, cuánto y por qué. Nunca compra solo.

Estado: **borrador v0.1** (Fase 1 de AI-DLC, estación 2). Las secciones marcadas con _Pendiente_ necesitan investigación o una decisión tuya antes de congelar el PRD.

---

## 1. Problema

Una comercializadora de productos de belleza compra inventario "a ojo": el dueño revisa qué está por agotarse y cuánto se vendió, y con eso hace el pedido. Después calcula 6 a 10 días de entrega. Todo es manual, se repite cada vez, y depende de que una persona esté disponible.

Consecuencias medibles en el caso real (línea Alfaparf Yellow, agosto de 2026):

- 84 % del capital de la línea ($1.185.750 de $1.418.625 a costo) está en 52 referencias que no se vendieron.
- La línea rota 0,059× al mes y tiene unos 448 días de cobertura al ritmo actual.
- Al mismo tiempo, 6 referencias con demanda estaban agotadas: ventas perdidas y riesgo de perder clientes.

Hay capital parado en producto de buen margen y baja rotación, y faltantes en producto de alta rotación.

## 2. Trabajo a resolver (job-to-be-done)

> Cuando voy a hacer el pedido a mi proveedor, quiero saber qué referencias pedir ya, cuántas unidades y por cuánto dinero, para no quedarme sin lo que se vende y no inmovilizar capital en lo que no se mueve, sin depender de revisar todo a mano.

## 3. Usuarios

| Usuario                                  | Qué hace en Matices                                          | Qué necesita                                                  |
| ---------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------- |
| **Dueño/a o gerente** (decide la compra) | Revisa recomendaciones, aprueba, ajusta o rechaza            | Entender el porqué en una frase; ver cuánto dinero compromete |
| **Administrador/a** (configura)          | Define tiempos de entrega, nivel de servicio, carga archivos | Cambiar reglas sin programar y ver el efecto                  |
| **Auditor/contador** (revisa después)    | Consulta qué se recomendó, quién aprobó y con qué reglas     | Registro que no se puede reescribir                           |

## 4. Alcance

### Entra (MVP)

1. Recibir archivos de inventario por periodo (inventario inicial, final, unidades vendidas, costo) y precio cuando exista.
2. Calcular **rotación**, **días de inventario**, **margen** y **GMROI** por producto.
3. Recomendar por producto, con registro de la decisión: **Pedir ya · Vigilar · Stock suficiente**.
4. **Sugerido de compra** en unidades y en pesos.
5. Pantalla simple donde la empresa define sus reglas (entrega, ciclo de pedido, nivel de servicio) y ve el resultado.
6. **Aprobación humana** registrada (aprobar, ajustar con motivo, rechazar con motivo).
7. **Explicación** de cada recomendación en una frase, con los números usados.
8. Capital parado: cuánto dinero hay en productos sin ventas.

### No entra (todavía)

- Crear o enviar órdenes de compra al proveedor, ni gestionar facturas de compra.
- Redistribución de stock entre sedes (se evalúa en fase 2; el caso real muestra que liberar stock sin venta mueve más dinero que redistribuir).
- Pronóstico con estacionalidad o modelos de machine learning (fase 3, solo si el historial lo justifica).

## 5. Reglas de oro (invariantes)

1. **La herramienta no compra.** Sin un registro de aprobación no existe una compra.
2. **Cada recomendación se explica** con los valores que usó, sin texto inventado por un modelo.
3. **Ante la duda, vigilar.** Datos inválidos o historial corto nunca producen un pedido.
4. **El cálculo es determinista**: los mismos datos y las mismas reglas dan siempre la misma recomendación.
5. **Registro que no se reescribe**: recomendaciones, aprobaciones y cambios de reglas quedan encadenados por hash.
6. **Los datos de la empresa son confidenciales**: acceso por empresa y por rol, credenciales fuera del código.

## 6. Cómo se ve el éxito

Los tres criterios del reto original, traducidos a métricas:

| Criterio                      | Métrica                                                                                                              | Meta del MVP (_por validar con el negocio_) |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| **Autonomía / confiabilidad** | % de recomendaciones que el dueño aprueba sin ajustar; % de "Pedir ya" que realmente se agotaron antes de la entrega | ≥ 80 % aprobadas sin ajuste tras 2 ciclos   |
| **Seguridad**                 | Cero accesos entre empresas; cero credenciales en el repositorio; informe SAST/DAST/SCA sin hallazgos críticos       | 0 críticos                                  |
| **Explicabilidad**            | Una persona sin formación técnica explica por qué se recomendó un producto leyendo solo la pantalla                  | 5 de 5 personas en prueba de usabilidad     |

Métricas de negocio (_Pendiente de línea base_): días de inventario, capital parado, ventas perdidas por agotados, tiempo semanal dedicado a decidir compras.

## 7. Contexto de datos

- **Hoy:** exportes de Alegra (Excel) con inventario y movimientos. Se empieza con un MVP sobre una línea de referencias.
- **Siguiente:** conexión de solo lectura a la API de Alegra para traer inventario y ventas sin archivos.
- **Calidad conocida:** el archivo de la línea Yellow cuadra (inicial − ventas = final); no trae precio de venta (el exporte de inventario general sí lo trae), compras, pedidos en tránsito ni mínimos del proveedor. Con 26 unidades vendidas, una sola venta cambia mucho la recomendación de una referencia.

## 8. Hacia un producto comercializable

Esta sección es la que separa una herramienta interna de un producto.

- **Multiempresa desde el primer modelo de datos**: toda tabla lleva `company_id`; las reglas son por empresa.
- **Conectores como adaptadores**: CSV/Excel y Alegra primero; otros sistemas contables o de punto de venta después, sin tocar el motor.
- **Motor puro y versionado**: cada recomendación guarda la versión de reglas que usó, lo que permite auditar y comparar.
- **Roles**: quien aprueba y quien administra reglas son distintos.
- **Aislamiento y seguridad** desde el diseño (ver `ARQUITECTURA.md`, sección 7).

### Hipótesis de negocio (_Pendiente de validar_)

No hay todavía investigación de mercado en este repositorio. Antes de congelar el PRD hay que hacer, como pide la estación 2 de la metodología:

- [ ] Entrevistar a 5 dueños de comercializadoras o droguerías/perfumerías: ¿cómo deciden hoy la compra? ¿cuánto vale un agotado?
- [ ] Benchmark de alternativas: módulos de inventario de los propios sistemas contables, hojas de cálculo con plantillas, software de planeación de inventario para pymes. Comparar precio, facilidad y explicabilidad.
- [ ] Hipótesis de precio: suscripción mensual por empresa, escalonada por número de referencias o de usuarios. Probar con 2 o 3 empresas piloto antes de fijar cifras.
- [ ] Definir el cliente ideal: tamaño, número de referencias, sistema contable que usa.

## 9. Riesgos y supuestos

| Riesgo                                               | Mitigación                                                                               |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Historial corto → recomendaciones inestables         | Regla R1 exige un mínimo de días; la pantalla muestra la confianza                       |
| Datos sucios del exporte                             | Validación con Zod al entrar; lo inválido se marca y no genera pedido                    |
| El dueño no confía en la recomendación               | Explicación con números + registro de aprobación + comparación con su decisión histórica |
| Cambios en la API del proveedor del sistema contable | Conector aislado en un adaptador, con pruebas de contrato                                |
| Fuga de datos entre empresas                         | `company_id` en todo, pruebas de aislamiento, revisión DAST                              |

**Supuestos:** entrega del proveedor de 10 días (extremo conservador del rango 8 a 10); un pedido cada 30 días; sin pedidos en tránsito salvo que se informen.
