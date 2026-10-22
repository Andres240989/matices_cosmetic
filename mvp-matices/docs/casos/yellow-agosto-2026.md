# Caso de referencia: línea Alfaparf Yellow, agosto de 2026

Caso real que valida el motor. Resumen del análisis manual (el detalle está en el proyecto "Proyecto D.A.A.S - Mc Matices", documento `analisis-rotacion-linea-yellow-agosto-2026`).

- Fuente: `ROTACION_INVENTARIO_2026-08.xlsx`, 68 referencias de tinte de 60 ml.
- Ventana de ventas: 1 de agosto a 10 de octubre de 2026 (71 días). Análisis: 15 de octubre de 2026.
- Parámetros: entrega 10 días, pedido cada 30 días, nivel de servicio 90 %, sin pedidos en tránsito.

## Resultado esperado

| Código | Referencia                         | Vendido | Stock | Nivel objetivo | Comprar |
| ------ | ---------------------------------- | ------- | ----- | -------------- | ------- |
| 2975   | 1 Negro                            | 6       | 0     | 6              | 6       |
| 3009   | 7.45 Rubio medio cobre caoba       | 3       | 0     | 3              | 3       |
| 3017   | 8.3 Rubio claro dorado             | 1       | 0     | 2              | 2       |
| 3022   | 9 Rubio clarísimo                  | 1       | 0     | 2              | 2       |
| 3024   | 9.13 Rubio clarísimo cenizo dorado | 1       | 0     | 2              | 2       |
| 3018   | 8.31 Rubio claro dorado cenizo     | 1       | 1     | 2              | 1       |

Total: 16 unidades en 6 referencias, $138.000 a costo (8.625 por unidad). Las otras 62 referencias no requieren compra.

## Hallazgos de negocio

- Capital en 52 referencias sin ventas: $1.185.750 (84 % del capital de la línea).
- La demanda es el límite, no la asignación de capital: redistribuir entre referencias que sí se venden mueve poco dinero. La palanca es liberar stock sin venta (devolución, traslado, promoción) y reponer lo agotado que sí tiene demanda.

## Uso en las pruebas

`tests/engine/yellow-line.test.ts` reproduce las seis referencias con sus ventas y stock, y comprueba 16 unidades y $138.000. Si el motor cambia y este resultado cambia, hay que justificarlo en este documento.

## Datos reales de agosto en el MVP (21 de octubre de 2026)

El cliente confirmó que el dato real de agosto son tres archivos separados: inventario inicial (`INV 1 AGO`), inventario final (`INV 31 AGO`) y ventas, con el costo unitario actualizado. Reemplazan, para las demos, a la hoja `ROTACION_INVENTARIO_2026-08.xlsx` (que traía 8 unidades vendidas en agosto).

- 68 referencias, 56 unidades vendidas en 23 referencias. Los archivos no traen código de producto: se unen por nombre y el código queda vacío (no se inventa).
- En 18 referencias `inicial − ventas ≠ final`, siempre con el final mayor: probablemente hubo compras en el mes que los archivos no informan. La rotación usa los datos tal cual.
- Sin stock hoy, en tránsito ni precio: se usa el inventario final como stock hoy.

Resultado con el periodo 1 a 31 de agosto de 2026, fecha de análisis 31 de agosto y reglas por defecto (v1):

- Rotación de la línea: **0,308**.
- Pedir ya: 11 referencias, 53 unidades, **$502.393** a costo. Vigilar: 6. Stock suficiente: 51.
- Capital parado: $1.019.892 de $1.665.957 a costo (61 %).

Este resultado no se compara con el esperado de arriba (6 referencias, 16 unidades, $138.000): ese es el análisis manual de la ventana de 71 días con la hoja anterior, y sigue siendo la prueba de referencia del motor, que no cambió. Los archivos reales y su conversión a la plantilla viven solo en `data/private/` y no se suben al repositorio.
