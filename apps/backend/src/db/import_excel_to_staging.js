// src/db/import_excel_to_staging.js

// 1) Importamos módulos estándar y de terceros.
import fs from 'fs/promises';                          // fs/promises para operaciones async con archivos
import path from 'path';                               // path para resolver rutas de forma portable
import XLSX from 'xlsx';                               // librería para leer Excel
import { parse, isValid } from 'date-fns';             // parseo/validación de fechas
import { parsePhoneNumberFromString } from 'libphonenumber-js'; // normalización de teléfonos
import { PrismaClient } from '@prisma/client';         // cliente Prisma para escribir en la BD

// 2) Instanciamos Prisma.
const prisma = new PrismaClient();

// 3) Lista de posibles nombres de columnas en el Excel (flexible por si hay variantes).
const COLS = {
  telefono: ['FONO_MOVIL', 'FONO MOVIL', 'CELULAR', 'TELEFONO', 'FONO_FIJO', 'FONO', 'TEL'],
  fecha:    ['FECHA_CITA', 'FECHA', 'DIA_CITA', 'DÍA_CITA'],
  hora:     ['HORA_CITA', 'HORA', 'HORA_AGENDA']
};

// 4) Función de utilidad: busca la primera columna que exista en una fila (case-insensitive).
function getByAnyKey(row, candidates) {
  const keys = Object.keys(row);
  for (const cand of candidates) {
    const hit = keys.find(k => k.toLowerCase().trim() === cand.toLowerCase().trim());
    if (hit) return row[hit];
  }
  return undefined;
}

// 5) Normaliza el teléfono a E.164 (ej: +569XXXXXXXX) usando libphonenumber-js.
//    Si no puede, intenta limpiar a dígitos y retorna algo utilizable o null si es inválido.
function normalizePhone(raw, defaultCountry = 'CL') {
  if (!raw) return null;
  let s = String(raw).replace(/[^\d+]/g, ''); // deja dígitos y '+'
  // Si el número parte sin +56 y parece local chileno (9 dígitos), añade prefijo.
  if (!s.startsWith('+') && s.length >= 9) {
    // Caso muy simple: asume Chile si no hay +.
    const pn = parsePhoneNumberFromString(s, defaultCountry);
    if (pn && pn.isValid()) return pn.number; // E.164
  }
  // Si ya tiene +, intenta parsear directo
  const pn = parsePhoneNumberFromString(s);
  if (pn && pn.isValid()) return pn.number;
  return null;
}

// 6) Parsea fecha y hora desde strings/valores del Excel.
//    - fechaVal puede venir como string "2025-09-01" o "01/09/2025" o incluso serial numérico de Excel.
//    - horaVal puede venir "8:30", "08:30", "8.30", etc. Guardamos horaTexto si no podemos hacer merge seguro.
function parseFechaHora(fechaVal, horaVal) {
  let fechaDate = null;
  let horaTexto = null;

  // Intenta parsear FECHA con distintos formatos frecuentes.
  if (fechaVal instanceof Date) {
    // XLSX a veces ya devuelve Date
    fechaDate = fechaVal;
  } else if (typeof fechaVal === 'number') {
    // serial de Excel -> conviértelo usando XLSX (utilidad interna).
    // Evitamos dependencia interna: el workbook ya convierte a Date si se pide, pero por si acaso esto llega acá,
    // hacemos un fallback simple: Excel serial epoch (no ultra exacto con 1900 leap bug, pero sirve en la mayoría).
    const EXCEL_EPOCH = new Date(Date.UTC(1899, 11, 30)); // 1899-12-30
    const ms = Math.round(Number(fechaVal) * 24 * 60 * 60 * 1000);
    fechaDate = new Date(EXCEL_EPOCH.getTime() + ms);
  } else if (typeof fechaVal === 'string') {
    const formatos = ['yyyy-MM-dd', 'dd/MM/yyyy', 'dd-MM-yyyy', 'MM/dd/yyyy', 'd/M/yyyy'];
    for (const fmt of formatos) {
      const d = parse(fechaVal.trim(), fmt, new Date());
      if (isValid(d)) { fechaDate = d; break; }
    }
  }

  // La hora muchas veces llega como "08:30" o "8:30".
  if (horaVal != null) {
    horaTexto = String(horaVal).trim();
  }

  return { fechaDate, horaTexto };
}

// 7) Regla dura: para que una fila sea "apta para bot", necesitamos al menos teléfono y fecha/hora parseables.
//    Aquí marcamos la política: si falta tel o fecha, la mandamos a StgCitaError.
function validaReglasDuras({ telefono, fechaDate }) {
  const errores = [];
  if (!telefono) errores.push('telefono_invalido');
  if (!fechaDate) errores.push('fecha_invalida');
  return errores;
}

// 8) Toma un archivo Excel, lo lee y lo inserta en StgCita / StgCitaError con importBatchId.
async function importarExcelARawStaging(excelPath, importBatchId) {
  // Asegurar que el path existe.
  await fs.access(excelPath);

  // Lee el libro Excel.
  const wb = XLSX.readFile(excelPath, { cellDates: true }); // cellDates:true intenta entregar fechas como Date
  const sheetName = wb.SheetNames[0];                       // tomamos la primera hoja
  const ws = wb.Sheets[sheetName];

  // Convierte la hoja a un arreglo de objetos (cada fila = objeto {columna: valor}).
  const rows = XLSX.utils.sheet_to_json(ws, { defval: null }); // defval:null mantiene claves con null

  let okCount = 0;
  let errCount = 0;

  // Itera cada fila del Excel.
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Extrae posibles columnas de teléfono/fecha/hora (flexible con nombres).
    const telRaw  = getByAnyKey(row, COLS.telefono);
    const fechaRaw = getByAnyKey(row, COLS.fecha);
    const horaRaw  = getByAnyKey(row, COLS.hora);

    // Normaliza teléfono.
    const telefono = normalizePhone(telRaw);

    // Parsea fecha/hora.
    const { fechaDate, horaTexto } = parseFechaHora(fechaRaw, horaRaw);

    // Aplica reglas duras (si falla, va a errores).
    const errores = validaReglasDuras({ telefono, fechaDate });

    if (errores.length > 0) {
      // Inserta en tabla de errores con motivo y campos involucrados.
      await prisma.stgCitaError.create({
        data: {
          importBatchId,
          raw: row,
          motivo: errores.join(','),
          campos: { telRaw, fechaRaw, horaRaw }
        }
      });

      // Log opcional por fila (tu schema ya trae ImportLog).
      await prisma.importLog.create({
        data: {
          fuente: 'excel',
          archivo: path.basename(excelPath),
          fila: i + 1, // fila 1-based
          status: 'ERROR',
          errorMensaje: errores.join(',')
        }
      });

      errCount++;
      continue;
    }

    // Si pasó reglas duras, inserta en StgCita con algunos campos ya “extraídos”.
    // Puedes añadir warnings si detectas cosas raras (ej: horaTexto con formato extraño).
    const warnings = {};
    if (!horaTexto || !/^\d{1,2}[:.]\d{2}$/.test(horaTexto)) {
      warnings.hora = 'formato_hora_no_estandar';
    }

    await prisma.stgCita.create({
      data: {
        importBatchId,
        raw: row,
        telefono,
        fecha: fechaDate,
        horaTexto,
        warnings: Object.keys(warnings).length ? warnings : undefined
      }
    });

    await prisma.importLog.create({
      data: {
        fuente: 'excel',
        archivo: path.basename(excelPath),
        fila: i + 1,
        status: 'OK'
      }
    });

    okCount++;
  }

  return { okCount, errCount, total: rows.length, sheetName };
}

// 9) Punto de entrada del script (CLI).
//    Puedes pasar el path del Excel como argumento: `npm run import:staging -- ./data/BASE.xlsx`
async function main() {
  // Toma el path del Excel de argv o de .env (si quisieras).
  const excelPath = process.argv[2];
  if (!excelPath) {
    console.error('❌ Debes indicar la ruta al Excel. Ej: npm run import:staging -- ./data/BASE_ANONIMIZADA_CONTACTABILIDAD.xlsx');
    process.exit(1);
  }

  // Genera un importBatchId simple con timestamp (entero).
  const importBatchId = Math.floor(Date.now() / 1000);

  console.log(`⏳ Importando Excel '${excelPath}' a staging con importBatchId=${importBatchId} ...`);

  // Ejecuta importación.
  const result = await importarExcelARawStaging(excelPath, importBatchId);

  console.log(`✅ Listo. Hoja: ${result.sheetName}`);
  console.log(`   Total filas: ${result.total}`);
  console.log(`   OK: ${result.okCount} | Errores: ${result.errCount}`);
}

// 10) Ejecuta main y maneja errores globales limpiamente.
main()
  .catch(err => {
    console.error('❌ Error en importación:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
