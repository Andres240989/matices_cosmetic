/**
 * Writes the synthetic sample files in data/sample/. Products and numbers are invented;
 * they never come from a customer. Deterministic data; .xlsx bytes differ between runs only by zip timestamps.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import writeExcelFile from "write-excel-file/node";

const OUT_DIR = join(import.meta.dirname, "..", "data", "sample");
/** The web app links to this copy of the template. */
const PUBLIC_DIR = join(import.meta.dirname, "..", "public");

type SampleProduct = {
  productId: string;
  name: string;
  costPesos: number;
  pricePesos: number;
  /** Stock on 1 July 2026. */
  openingJul: number;
  /** Units sold in July, August, September. */
  sold: [number, number, number];
  /** Units received in July, August, September. */
  received: [number, number, number];
  /** Units sold from 1 to 15 October, to get today's stock. */
  soldOctober: number;
  inTransit?: number;
  /** First month the product exists (0 = July). */
  firstMonth?: number;
};

const PRODUCTS: SampleProduct[] = [
  {
    productId: "1001",
    name: "TINTE CREMA AURA 1 NEGRO 60 ML",
    costPesos: 9200,
    pricePesos: 16900,
    openingJul: 8,
    sold: [3, 4, 5],
    received: [0, 6, 0],
    soldOctober: 2,
  },
  {
    productId: "1002",
    name: "TINTE CREMA AURA 5 CASTANO CLARO 60 ML",
    costPesos: 9200,
    pricePesos: 16900,
    openingJul: 6,
    sold: [2, 3, 2],
    received: [0, 0, 4],
    soldOctober: 1,
  },
  {
    productId: "1003",
    name: "TINTE CREMA AURA 7.1 RUBIO MEDIO CENIZO 60 ML",
    costPesos: 9200,
    pricePesos: 16900,
    openingJul: 5,
    sold: [1, 2, 2],
    received: [0, 0, 0],
    soldOctober: 0,
  },
  {
    productId: "1004",
    name: "TINTE CREMA AURA 8.3 RUBIO CLARO DORADO 60 ML",
    costPesos: 9200,
    pricePesos: 16900,
    openingJul: 4,
    sold: [1, 1, 1],
    received: [0, 0, 0],
    soldOctober: 1,
  },
  {
    productId: "1005",
    name: "TINTE CREMA AURA 9.1 RUBIO CLARISIMO CENIZO 60 ML",
    costPesos: 9200,
    pricePesos: 16900,
    openingJul: 6,
    sold: [0, 0, 0],
    received: [0, 0, 0],
    soldOctober: 0,
  },
  {
    productId: "1006",
    name: "TINTE CREMA AURA 6.66 RUBIO OSCURO ROJO 60 ML",
    costPesos: 9200,
    pricePesos: 16900,
    openingJul: 4,
    sold: [0, 0, 0],
    received: [0, 0, 0],
    soldOctober: 0,
  },
  {
    productId: "1007",
    name: "TINTE CREMA AURA 10.21 RUBIO EXTRA CLARO 60 ML",
    costPesos: 9200,
    pricePesos: 16900,
    openingJul: 3,
    sold: [0, 1, 0],
    received: [0, 0, 0],
    soldOctober: 0,
  },
  {
    productId: "1008",
    name: "TINTE CREMA AURA 0.11 CORRECTOR AZUL 60 ML",
    costPesos: 9200,
    pricePesos: 16900,
    openingJul: 2,
    sold: [0, 0, 0],
    received: [0, 0, 0],
    soldOctober: 0,
  },
  {
    productId: "2001",
    name: "OXIGENADA CREMA BRISA 20 VOL 1000 ML",
    costPesos: 14500,
    pricePesos: 24900,
    openingJul: 20,
    sold: [9, 11, 12],
    received: [12, 12, 0],
    soldOctober: 5,
  },
  {
    productId: "2002",
    name: "OXIGENADA CREMA BRISA 30 VOL 1000 ML",
    costPesos: 14500,
    pricePesos: 24900,
    openingJul: 15,
    sold: [5, 6, 6],
    received: [6, 6, 6],
    soldOctober: 2,
  },
  {
    productId: "2003",
    name: "OXIGENADA CREMA BRISA 40 VOL 1000 ML",
    costPesos: 14500,
    pricePesos: 24900,
    openingJul: 6,
    sold: [2, 3, 3],
    received: [0, 3, 0],
    soldOctober: 0,
    inTransit: 6,
  },
  {
    productId: "3001",
    name: "SHAMPOO NUTRITIVO BRISA KERATINA 400 ML",
    costPesos: 18900,
    pricePesos: 32900,
    openingJul: 24,
    sold: [10, 8, 12],
    received: [12, 0, 12],
    soldOctober: 6,
  },
  {
    productId: "3002",
    name: "ACONDICIONADOR NUTRITIVO BRISA KERATINA 400 ML",
    costPesos: 19900,
    pricePesos: 34900,
    openingJul: 10,
    sold: [6, 5, 7],
    received: [6, 6, 0],
    soldOctober: 3,
  },
  {
    productId: "3003",
    name: "MASCARILLA REPARADORA BRISA ARGAN 300 GR",
    costPesos: 24500,
    pricePesos: 42900,
    openingJul: 12,
    sold: [1, 0, 1],
    received: [0, 0, 0],
    soldOctober: 0,
  },
  {
    productId: "3004",
    name: "AMPOLLA CAPILAR BRISA KERATINA X 12",
    costPesos: 31000,
    pricePesos: 54900,
    openingJul: 9,
    sold: [0, 0, 0],
    received: [0, 0, 0],
    soldOctober: 0,
  },
  {
    productId: "3005",
    name: "SERUM PUNTAS BRISA ARGAN 60 ML",
    costPesos: 15800,
    pricePesos: 27900,
    openingJul: 0,
    sold: [0, 2, 3],
    received: [0, 6, 0],
    soldOctober: 1,
    firstMonth: 1,
  },
  {
    productId: "4001",
    name: "DECOLORANTE POLVO AURA BLUE 500 GR",
    costPesos: 38500,
    pricePesos: 62900,
    openingJul: 7,
    sold: [2, 3, 2],
    received: [0, 3, 0],
    soldOctober: 1,
  },
  {
    productId: "4002",
    name: "DECOLORANTE POLVO AURA BLUE 50 GR",
    costPesos: 6100,
    pricePesos: 10900,
    openingJul: 30,
    sold: [14, 16, 15],
    received: [20, 10, 10],
    soldOctober: 7,
  },
  {
    productId: "5001",
    name: "ESMALTE TONOS ROJO PASION 13 ML",
    costPesos: 3900,
    pricePesos: 7900,
    openingJul: 18,
    sold: [6, 5, 7],
    received: [0, 6, 0],
    soldOctober: 4,
  },
  {
    productId: "5002",
    name: "ESMALTE TONOS NUDE 13 ML",
    costPesos: 3900,
    pricePesos: 7900,
    openingJul: 15,
    sold: [4, 4, 5],
    received: [0, 0, 0],
    soldOctober: 2,
  },
  {
    productId: "5003",
    name: "QUITAESMALTE TONOS SIN ACETONA 120 ML",
    costPesos: 0,
    pricePesos: 5900,
    openingJul: 10,
    sold: [3, 3, 3],
    received: [0, 0, 0],
    soldOctober: 1,
  },
  {
    productId: "5004",
    name: "LIMA UÑAS TONOS PROFESIONAL X 10",
    costPesos: 4200,
    pricePesos: 8900,
    openingJul: 1,
    sold: [2, 2, 2],
    received: [0, 0, 0],
    soldOctober: 0,
  },
];

const MONTHS = [
  { periodStart: "2026-07-01", periodEnd: "2026-07-31", label: "JUL" },
  { periodStart: "2026-08-01", periodEnd: "2026-08-31", label: "AUG" },
  { periodStart: "2026-09-01", periodEnd: "2026-09-30", label: "SEP" },
] as const;

type MonthRow = {
  productId: string;
  name: string;
  opening: number;
  closing: number;
  sold: number;
  costPesos: number;
  pricePesos: number;
};

/** Stock flows month to month: closing = opening + received - sold. Product 5004 ends negative on purpose (rule R1). */
function monthRows(monthIndex: number): MonthRow[] {
  return PRODUCTS.filter((p) => (p.firstMonth ?? 0) <= monthIndex).map((p) => {
    let opening = p.openingJul;
    for (let m = 0; m < monthIndex; m += 1) opening += p.received[m]! - p.sold[m]!;
    const closing = opening + p.received[monthIndex]! - p.sold[monthIndex]!;
    return { ...p, opening, closing, sold: p.sold[monthIndex]! };
  });
}

function stockToday(p: SampleProduct): number {
  const [closingSep] = monthRows(2)
    .filter((r) => r.productId === p.productId)
    .map((r) => r.closing);
  return (closingSep ?? 0) - p.soldOctober;
}

const TEMPLATE_HEADER = [
  "periodo_inicio",
  "periodo_fin",
  "codigo",
  "producto",
  "inventario_inicial",
  "inventario_final",
  "unidades_vendidas",
  "stock_hoy",
  "en_transito",
  "costo_unitario",
  "precio_venta",
];

function templateRow(month: (typeof MONTHS)[number], row: MonthRow, product: SampleProduct) {
  return [
    month.periodStart,
    month.periodEnd,
    row.productId,
    row.name,
    row.opening,
    row.closing,
    row.sold,
    stockToday(product),
    product.inTransit ?? 0,
    row.costPesos,
    row.pricePesos,
  ];
}

function productById(productId: string): SampleProduct {
  return PRODUCTS.find((p) => p.productId === productId)!;
}

function csvLine(cells: (string | number)[], delimiter: string): string {
  return cells
    .map((cell) => {
      const text = String(cell);
      return text.includes(delimiter) || text.includes('"')
        ? `"${text.replace(/"/g, '""')}"`
        : text;
    })
    .join(delimiter);
}

function writeCsv(fileName: string, rows: (string | number)[][], delimiter: string) {
  writeFileSync(
    join(OUT_DIR, fileName),
    rows.map((r) => csvLine(r, delimiter)).join("\r\n") + "\r\n",
  );
}

/** Three consecutive months in one sheet. Stock today is as of 15 October 2026. */
async function writeMultiPeriod() {
  const rows = MONTHS.flatMap((month, index) =>
    monthRows(index).map((row) => templateRow(month, row, productById(row.productId))),
  );
  await writeExcelFile([TEMPLATE_HEADER, ...rows], { sheet: "Inventario" }).toFile(
    join(OUT_DIR, "inventario-multiperiodo-2026-07-a-2026-09.xlsx"),
  );
}

/** August only, as Excel in Spanish saves CSV: semicolons and headers with capitals and accents. */
function writeSingleMonthCsv() {
  const header = [
    "Periodo Inicio",
    "Periodo Fin",
    "Código",
    "Producto",
    "Inventario Inicial",
    "Inventario Final",
    "Unidades Vendidas",
    "Stock Hoy",
    "En Tránsito",
    "Costo Unitario",
    "Precio Venta",
  ];
  const rows = monthRows(1).map((row) => templateRow(MONTHS[1], row, productById(row.productId)));
  writeCsv("inventario-2026-08.csv", [header, ...rows], ";");
}

/** September with eight bad rows mixed among good ones. */
function writeWithErrors() {
  const month = MONTHS[2];
  const good = monthRows(2)
    .slice(0, 8)
    .map((row) => templateRow(month, row, productById(row.productId)));
  const bad: (string | number)[][] = [
    [month.periodStart, month.periodEnd, "9000", "", 5, 3, 2, 3, 0, 9200, 16900],
    [
      month.periodStart,
      month.periodEnd,
      "9001",
      "CANTIDAD CON TEXTO",
      "cinco",
      3,
      2,
      3,
      0,
      9200,
      16900,
    ],
    [
      month.periodStart,
      month.periodEnd,
      "9002",
      "UNIDADES CON DECIMALES",
      5,
      3,
      1.5,
      3,
      0,
      9200,
      16900,
    ],
    [month.periodStart, month.periodEnd, "9003", "SIN COSTO", 5, 3, 2, 3, 0, "", 16900],
    [month.periodStart, "2026-09-31", "9004", "FECHA IMPOSIBLE", 5, 3, 2, 3, 0, 9200, 16900],
    [month.periodStart, month.periodEnd, "9005", "STOCK HOY VACIO", 5, 3, 2, "", 0, 9200, 16900],
    [
      month.periodStart,
      month.periodEnd,
      "9006",
      "COSTO CON PUNTO DE MILES",
      5,
      3,
      2,
      3,
      0,
      "9.200",
      16900,
    ],
    [
      ...templateRow(month, monthRows(2)[0]!, PRODUCTS[0]!).slice(0, 3),
      "CODIGO REPETIDO",
      1,
      1,
      0,
      1,
      0,
      9200,
      16900,
    ],
  ];
  writeCsv(
    "con-errores-2026-09.csv",
    [TEMPLATE_HEADER, ...good.slice(0, 4), ...bad, ...good.slice(4)],
    ",",
  );
}

/** What the person reads in the template's second sheet. The reader only uses the first sheet. */
const INSTRUCTIONS: string[][] = [
  ["Plantilla Matices: cómo llenarla"],
  [""],
  [
    "1. Llena la hoja Inventario: una fila por producto y por periodo. No cambies los nombres de las columnas.",
  ],
  [
    "2. Para varios periodos (por ejemplo julio, agosto y septiembre) agrega más filas con sus fechas, en la misma hoja.",
  ],
  [
    "3. Guarda como .xlsx (recomendado) o .csv y cárgalo en Matices. Deja la hoja Inventario como primera hoja.",
  ],
  [""],
  ["Columna", "Obligatoria", "Qué poner", "Ejemplo"],
  ["periodo_inicio", "Sí", "Primer día del periodo, AAAA-MM-DD o DD/MM/AAAA", "2026-08-01"],
  ["periodo_fin", "Sí", "Último día del periodo", "2026-08-31"],
  [
    "codigo",
    "No",
    "Código del producto en tu sistema. Si no lo tienes, déjalo vacío: el producto se identifica por su nombre",
    "1001",
  ],
  [
    "producto",
    "Sí",
    "Nombre del producto, escrito igual en todos los periodos",
    "TINTE CREMA AURA 1 NEGRO 60 ML",
  ],
  ["inventario_inicial", "Sí", "Unidades al inicio del periodo (número entero)", "5"],
  ["inventario_final", "Sí", "Unidades al final del periodo (número entero)", "7"],
  ["unidades_vendidas", "Sí", "Unidades vendidas entre periodo_inicio y periodo_fin", "4"],
  [
    "stock_hoy",
    "No",
    "Unidades el día del análisis. Si no tienes la columna, bórrala: se usa el inventario final",
    "0",
  ],
  ["en_transito", "No", "Unidades pedidas que aún no llegan. Vacío = 0", "0"],
  ["costo_unitario", "Sí", "Costo por unidad en pesos, sin puntos de miles ni $", "9200"],
  ["precio_venta", "No", "Precio de venta por unidad en pesos", "16900"],
  [""],
  ["Si tus datos vienen en archivos separados (inventario inicial, inventario final y ventas):"],
  ["a. Copia la lista de productos en la columna producto."],
  ["b. Trae cada cantidad buscando por nombre, por ejemplo en inventario_final:"],
  [
    "   =BUSCARX(D2;'[INV FINAL AGO.xlsx]Hoja1'!$A:$A;'[INV FINAL AGO.xlsx]Hoja1'!$B:$B;\"NO ESTÁ\")",
  ],
  ["c. Revisa que ningún producto diga NO ESTÁ y pega las columnas como valores antes de guardar."],
  [""],
  ["Matices recomienda; no compra. Cada compra la decide y aprueba una persona."],
];

async function writeTemplate() {
  const example = [
    "2026-08-01",
    "2026-08-31",
    "1001",
    "TINTE CREMA AURA 1 NEGRO 60 ML",
    5,
    7,
    4,
    0,
    0,
    9200,
    16900,
  ];
  writeCsv("plantilla-matices.csv", [TEMPLATE_HEADER, example], ",");
  for (const dir of [OUT_DIR, PUBLIC_DIR]) {
    await writeExcelFile([
      { sheet: "Inventario", data: [TEMPLATE_HEADER, example] },
      {
        sheet: "Instrucciones",
        data: INSTRUCTIONS,
        columns: [{ width: 22 }, { width: 12 }, { width: 90 }, { width: 34 }],
      },
    ]).toFile(join(dir, "plantilla-matices.xlsx"));
  }
}

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(PUBLIC_DIR, { recursive: true });
await writeMultiPeriod();
writeSingleMonthCsv();
writeWithErrors();
await writeTemplate();
process.stdout.write(`Muestras escritas en ${OUT_DIR}\n`);
