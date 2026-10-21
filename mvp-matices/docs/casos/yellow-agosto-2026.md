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

## Resultado en el MVP con solo agosto (21 de octubre de 2026)

Cargando el mismo archivo pasado a la plantilla Matices, con el periodo 1 a 31 de agosto, stock hoy al 15 de octubre y las reglas por defecto (v1):

- Rotación de la línea: **0,059**, igual al análisis manual.
- Pedir ya: 4 referencias (2975, 3022, 3024, 3018), 14 unidades, $120.750 a costo. Vigilar: 3 (3012, 3032, 2999).

La diferencia con el resultado esperado (6 referencias, 16 unidades, $138.000) se explica por la ventana: el caso de referencia usa ventas del 1 de agosto al 10 de octubre (71 días); con solo agosto no entran las ventas de septiembre y octubre de 3009 y 3017. El motor no cambió y la prueba de referencia sigue pasando. El archivo real convertido vive solo en `data/private/` y no se sube al repositorio.
