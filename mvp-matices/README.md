# Matices · MVP

> **Los datos se leen. El código recomienda. La persona autoriza.**

Aplicación web que lee el inventario por periodos (plantilla Matices), calcula la **rotación** de cada producto y de la línea, y da la **compra sugerida** con la explicación de cada recomendación. No compra nada: la decisión es de una persona.

## Poner en marcha

Requisitos: Node 22 o superior.

```bash
npm install
npm run dev      # http://localhost:3000
```

1. Carga uno o varios archivos con la plantilla (`public/plantilla-matices.xlsx`, también enlazada en la pantalla).
2. Revisa el reporte de carga: filas cargadas y filas rechazadas con su motivo.
3. Ajusta la fecha de análisis y las reglas; elige la base de demanda (un periodo o el consolidado).
4. Revisa resumen, gráficos y tabla; exporta la compra sugerida a CSV.

## Rotación

`rotación = unidades vendidas en el periodo / ((inventario inicial + inventario final) / 2)`, con las ventas acumuladas entre el inicio y el fin del mismo periodo. Con varios periodos consecutivos, el consolidado usa el inventario inicial del primero, el final del último y la suma de las ventas. Detalle en [`docs/SPEC-FUNCIONAL.md`](docs/SPEC-FUNCIONAL.md).

## Archivos de prueba (`data/sample/`, sintéticos)

| Archivo                                          | Para probar                                  |
| ------------------------------------------------ | -------------------------------------------- |
| `plantilla-matices.xlsx` / `.csv`                | La plantilla con una fila de ejemplo         |
| `inventario-multiperiodo-2026-07-a-2026-09.xlsx` | Tres meses consecutivos y el consolidado     |
| `inventario-2026-08.csv`                         | Un mes, CSV con `;` y encabezados con tildes |
| `con-errores-2026-09.csv`                        | Ocho filas inválidas reportadas sin detener  |

Se regeneran con `npm run samples`. Los datos reales van en `data/private/`, que Git ignora.

## Verificar

```bash
npm test && npm run typecheck && npm run lint
```
