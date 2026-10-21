# Matices: especificación funcional

Estado: **v0.1**. Es el contrato entre el PRD y el código. Si algo no está aquí, no se construye; si el código hace algo distinto, o se corrige el código o se cambia este documento en el mismo cambio.

## 1. Flujo

```text
Archivo de inventario / API de Alegra
        |
        v
Lectura y validación (ingestion/)  ->  InventoryPeriod (contrato Zod)
        |
        v
Motor de reglas (engine/, puro)    ->  Recommendation por producto + resumen
        |
        v
Pantalla: recomendaciones, explicación, capital parado
        |
        v
Persona: APROBAR / AJUSTAR / RECHAZAR  ->  PurchaseApproval
        |
        v
Registro de auditoría encadenado por hash
```

## 2. Entradas

Por producto y periodo (contrato `ProductPeriod`):

| Campo                                    | Significado                            |
| ---------------------------------------- | -------------------------------------- |
| `productId`, `name`                      | Código y nombre en el sistema contable |
| `openingStockUnits`, `closingStockUnits` | Inventario inicial y final del periodo |
| `soldUnits`                              | Unidades vendidas en el periodo        |
| `currentStockUnits`                      | Stock el día del análisis (`asOf`)     |
| `inTransitUnits`                         | Unidades pedidas y aún no recibidas    |
| `unitCostMinor`                          | Costo unitario en centavos (entero)    |
| `unitPriceMinor`                         | Precio de venta en centavos, o `null`  |

Periodo (`InventoryPeriod`): `periodStart`, `periodEnd`, `asOf` en formato `YYYY-MM-DD`. El número de días cuenta ambos extremos (1 ago a 10 oct = 71).

## 3. Reglas configurables (`RulesConfig`)

| Parámetro          | Por defecto | Qué controla                                           |
| ------------------ | ----------- | ------------------------------------------------------ |
| `leadTimeDays`     | 10          | Días entre el pedido y la llegada                      |
| `reviewPeriodDays` | 30          | Días entre un pedido y el siguiente                    |
| `serviceLevel`     | 0,90        | Probabilidad de no agotarse durante el horizonte       |
| `minHistoryDays`   | 30          | Mínimo de días de historial para confiar en la demanda |

Cada cambio crea una versión nueva y queda en el registro. Cada recomendación guarda la versión que usó.

## 4. Cálculos

Sea `d = soldUnits / periodDays` (demanda diaria) y `Q(λ)` el cuantil `serviceLevel` de una distribución de Poisson de media `λ`.

- **Nivel objetivo** = `Q(d × (leadTimeDays + reviewPeriodDays))`
- **Punto de pedido** = `Q(d × leadTimeDays)`
- **Disponible** = `currentStockUnits + inTransitUnits`
- **Compra sugerida** = `max(0, nivel objetivo − disponible)`
- **Valor de la compra** = compra sugerida × `unitCostMinor`
- **Rotación** = `soldUnits / ((opening + closing) / 2)`
- **Días de inventario** = `periodDays / rotación` (vacío si no hubo ventas)
- **Margen** = `(precio − costo) / precio`
- **GMROI anualizado** = `(precio − costo) × soldUnits / (stock promedio × costo) × 365 / periodDays`
- **Capital parado** = `currentStockUnits × costo` si `soldUnits = 0`

## 5. Reglas de decisión

Todas las reglas corren siempre. El resultado final es el más restrictivo: `Pedir ya` > `Vigilar` > `Stock suficiente`. La regla R1 es una puerta: si falla, el resultado es `Vigilar` y la compra sugerida es 0.

| Id  | Regla                                                                                          | Resultado                              |
| --- | ---------------------------------------------------------------------------------------------- | -------------------------------------- |
| R1  | Datos confiables: sin cantidades negativas, costo mayor que cero, historial ≥ `minHistoryDays` | Si falla → **Vigilar**, compra 0       |
| R2  | Hay demanda y `disponible ≤ punto de pedido`                                                   | **Pedir ya**                           |
| R3  | Hay demanda y `punto de pedido < disponible < nivel objetivo`                                  | **Vigilar**                            |
| R4  | Sin ventas y con stock                                                                         | Informa capital parado; no pide compra |

Sin ninguna regla que objete: **Stock suficiente**.

Los productos con compra sugerida pero en `Vigilar` muestran la cifra como referencia; solo cuentan en el total de pedido los de `Pedir ya`.

## 6. Pantallas (MVP)

1. **Cargar datos**: archivo del periodo y fecha de análisis. Muestra qué filas se rechazaron y por qué.
2. **Reglas**: formulario con los cuatro parámetros y su efecto. Guardar crea una versión nueva.
3. **Recomendaciones**: tabla ordenada (Pedir ya primero, mayor compra primero) con semáforo, rotación, días de inventario, margen, compra sugerida y la explicación.
4. **Resumen**: productos por estado, unidades y pesos a pedir, capital parado, capital total a costo.
5. **Bandeja de aprobación**: aprobar, ajustar (con motivo) o rechazar (con motivo). Sin aprobación no se registra compra.
6. **Registro**: historial de recomendaciones, aprobaciones y cambios de reglas, con botón "Verificar integridad".

## 7. Explicación

Plantillas en español en `src/engine/messages.ts`. Ejemplo:

> Pedir ya. Hay 0 unidades disponibles y el punto de pedido es 2: se agotaría antes de que llegue el próximo pedido. Compra sugerida: 6 unidades ($51.750 a costo).

Nunca se genera con un modelo de lenguaje: solo narra lo que el motor ya decidió.

## 8. Criterios de aceptación del MVP

- [ ] El caso Yellow de agosto 2026 reproduce: 6 referencias a pedir, 16 unidades, $138.000 a costo (cubierto por `tests/engine/yellow-line.test.ts`).
- [ ] Cada regla tiene pruebas de caso feliz, falla y frontera.
- [ ] Un archivo con filas inválidas no detiene el análisis: las filas malas se reportan y las demás se evalúan.
- [ ] Ninguna pantalla permite registrar una compra sin aprobación.
- [ ] Cambiar una regla genera una versión nueva y las recomendaciones anteriores conservan la suya.
- [ ] Verificar integridad detecta cualquier edición del registro.
- [ ] Una persona ajena al proyecto explica una recomendación leyendo solo la pantalla.

## 9. Fuera de esta especificación

Redistribución entre sedes, pronóstico con estacionalidad, órdenes de compra automáticas y facturación. Se especifican cuando entren al roadmap.
