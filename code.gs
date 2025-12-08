/**
 * Sistema de Gestión de Laboratorio Multi-Laboratorio
 * Backend en Google Apps Script
 *
 * Bitácora: https://docs.google.com/spreadsheets/d/19rvs-kBt9o87d40-8nIFUtv8_KnKXnxPfwegUT9h24A/edit
 * Inventario STEM: https://docs.google.com/spreadsheets/d/1w46H58534iN35C55oZHbs4jUpNc6IGX1_NME5ASVbhE/edit
 * Inventario Bio-Química: https://docs.google.com/spreadsheets/d/1ZUdapKn4Bk9xhMqbYehaawhl0zWTPYbi5rIffTrKbQw/edit
 */

// IDs de los Spreadsheets
const BITACORA_SPREADSHEET_ID = '19rvs-kBt9o87d40-8nIFUtv8_KnKXnxPfwegUT9h24A';
const INVENTARIO_STEM_SPREADSHEET_ID = '1w46H58534iN35C55oZHbs4jUpNc6IGX1_NME5ASVbhE';
const INVENTARIO_BIOQUIMICA_SPREADSHEET_ID = '1ZUdapKn4Bk9xhMqbYehaawhl0zWTPYbi5rIffTrKbQw';

// Laboratorios disponibles
const LABORATORIOS = {
  STEM: 'STEM',
  BIOQUIMICA: 'Bio-Química'
};

// Nombres de las hojas
const SHEETS = {
  INVENTARIO: 'Inventario',
  USUARIOS: 'Usuarios',
  SOLICITUDES: 'Solicitudes',
  BITACORA: 'Bitacora',
  CATEGORIAS: 'Categorias'
};

// Función helper para obtener el spreadsheet según el laboratorio
function getSpreadsheetByLab(laboratorio) {
  if (laboratorio === LABORATORIOS.STEM) {
    return SpreadsheetApp.openById(INVENTARIO_STEM_SPREADSHEET_ID);
  } else if (laboratorio === LABORATORIOS.BIOQUIMICA) {
    return SpreadsheetApp.openById(INVENTARIO_BIOQUIMICA_SPREADSHEET_ID);
  }
  return null;
}

/**
 * Sirve la página web
 */
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Sistema de Gestión de Laboratorio')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Inicializa las hojas en ambos laboratorios si no existen
 */
function initializeSheets() {
  // Inicializar LABORATORIO STEM
  initializeLaboratorioSheets(INVENTARIO_STEM_SPREADSHEET_ID, LABORATORIOS.STEM);

  // Inicializar LABORATORIO BIO-QUÍMICA
  initializeLaboratorioSheets(INVENTARIO_BIOQUIMICA_SPREADSHEET_ID, LABORATORIOS.BIOQUIMICA);

  // Inicializar Bitácora (compartida entre laboratorios)
  initializeBitacoraSheet();

  return { success: true, message: 'Hojas inicializadas correctamente en ambos laboratorios' };
}

/**
 * Inicializa las hojas de un laboratorio específico
 */
function initializeLaboratorioSheets(spreadsheetId, nombreLaboratorio) {
  const ss = SpreadsheetApp.openById(spreadsheetId);

  // Inventario
  let inventarioSheet = ss.getSheetByName(SHEETS.INVENTARIO);
  if (!inventarioSheet) {
    inventarioSheet = ss.insertSheet(SHEETS.INVENTARIO);
    inventarioSheet.getRange(1, 1, 1, 7).setValues([[
      'ID', 'Nombre', 'Cantidad', 'Estado', 'Categoria', 'Descripcion', 'Foto'
    ]]);
    inventarioSheet.getRange(1, 1, 1, 7).setFontWeight('bold');
    inventarioSheet.setFrozenRows(1);
  }

  // Usuarios (solo en spreadsheet STEM - centralizado)
  if (nombreLaboratorio === LABORATORIOS.STEM) {
    let usuariosSheet = ss.getSheetByName(SHEETS.USUARIOS);
    if (!usuariosSheet) {
      usuariosSheet = ss.insertSheet(SHEETS.USUARIOS);
      usuariosSheet.getRange(1, 1, 1, 6).setValues([[
        'ID', 'Nombre', 'Email', 'Password', 'Rol', 'Laboratorio'
      ]]);
      usuariosSheet.getRange(1, 1, 1, 6).setFontWeight('bold');
      usuariosSheet.setFrozenRows(1);

      // Agregar usuarios de ejemplo
      const adminId = Utilities.getUuid();
      const preparadorSTEMId = Utilities.getUuid();
      const preparadorBioId = Utilities.getUuid();
      const docenteSTEMId = Utilities.getUuid();
      const docenteBioId = Utilities.getUuid();

      usuariosSheet.appendRow([adminId, 'Administrador Sistema', 'admin@laboratorio.com', 'admin123', 'Admin', 'STEM']);
      usuariosSheet.appendRow([preparadorSTEMId, 'Preparador STEM', 'preparador.stem@laboratorio.com', 'stem123', 'Preparador', 'STEM']);
      usuariosSheet.appendRow([preparadorBioId, 'Preparador Bio-Química', 'preparador.bio@laboratorio.com', 'bio123', 'Preparador', 'Bio-Química']);
      usuariosSheet.appendRow([docenteSTEMId, 'Docente STEM', 'docente.stem@laboratorio.com', 'docente123', 'Docente', 'STEM']);
      usuariosSheet.appendRow([docenteBioId, 'Docente Bio-Química', 'docente.bio@laboratorio.com', 'docente123', 'Docente', 'Bio-Química']);
    } else {
      // Si ya existe, verificar si tiene columna Laboratorio, si no, agregarla
      const headers = usuariosSheet.getRange(1, 1, 1, usuariosSheet.getLastColumn()).getValues()[0];
      if (headers.indexOf('Laboratorio') === -1) {
        // Agregar columna Laboratorio
        usuariosSheet.getRange(1, 6).setValue('Laboratorio');
        // Asignar STEM por defecto a usuarios existentes
        const lastRow = usuariosSheet.getLastRow();
        if (lastRow > 1) {
          for (let i = 2; i <= lastRow; i++) {
            usuariosSheet.getRange(i, 6).setValue('STEM');
          }
        }
      }
    }
  }

  // Solicitudes
  let solicitudesSheet = ss.getSheetByName(SHEETS.SOLICITUDES);
  if (!solicitudesSheet) {
    solicitudesSheet = ss.insertSheet(SHEETS.SOLICITUDES);
    solicitudesSheet.getRange(1, 1, 1, 15).setValues([[
      'ID', 'Nombre', 'FechaInicio', 'FechaFin', 'FechaNecesaria', 'Materiales', 'MaterialesExtra',
      'Docente', 'DocenteEmail', 'Estado', 'FotoPreparada', 'ObservacionesPreparador',
      'Laboratorio', 'DocumentoPractica', 'ImagenesPractica'
    ]]);
    solicitudesSheet.getRange(1, 1, 1, 15).setFontWeight('bold');
    solicitudesSheet.setFrozenRows(1);
  }

  // Categorías
  let categoriasSheet = ss.getSheetByName(SHEETS.CATEGORIAS);
  if (!categoriasSheet) {
    categoriasSheet = ss.insertSheet(SHEETS.CATEGORIAS);
    categoriasSheet.getRange(1, 1, 1, 2).setValues([['ID', 'Nombre']]);
    categoriasSheet.getRange(1, 1, 1, 2).setFontWeight('bold');
    categoriasSheet.setFrozenRows(1);

    // Agregar categorías por defecto según el laboratorio
    if (nombreLaboratorio === LABORATORIOS.STEM) {
      const categoriasSTEM = [
        'Mecánica', 'Electromagnetismo', 'Óptica', 'Termodinámica',
        'Ondas y Acústica', 'Física Moderna', 'Electrónica', 'Otros'
      ];
      categoriasSTEM.forEach(cat => {
        categoriasSheet.appendRow([Utilities.getUuid(), cat]);
      });
    } else {
      const categoriasBio = [
        'Microbiología', 'Biología Molecular', 'Química Orgánica', 'Química Inorgánica',
        'Bioquímica', 'Análisis Clínicos', 'Material de Vidrio', 'Reactivos', 'Equipos', 'Otros'
      ];
      categoriasBio.forEach(cat => {
        categoriasSheet.appendRow([Utilities.getUuid(), cat]);
      });
    }
  }
}

/**
 * Inicializa la hoja de Bitácora (compartida)
 */
function initializeBitacoraSheet() {
  const bitacoraSS = SpreadsheetApp.openById(BITACORA_SPREADSHEET_ID);

  let bitacoraSheet = bitacoraSS.getSheetByName(SHEETS.BITACORA);
  if (!bitacoraSheet) {
    bitacoraSheet = bitacoraSS.insertSheet(SHEETS.BITACORA);
    bitacoraSheet.getRange(1, 1, 1, 8).setValues([[
      'ID', 'Fecha', 'Practica', 'Items', 'Usuario', 'Observaciones', 'Preparador', 'Laboratorio'
    ]]);
    bitacoraSheet.getRange(1, 1, 1, 8).setFontWeight('bold');
    bitacoraSheet.setFrozenRows(1);
  } else {
    // Si ya existe, verificar si tiene columna Laboratorio
    const headers = bitacoraSheet.getRange(1, 1, 1, bitacoraSheet.getLastColumn()).getValues()[0];
    if (headers.indexOf('Laboratorio') === -1) {
      bitacoraSheet.getRange(1, 8).setValue('Laboratorio');
      // Asignar STEM por defecto a entradas existentes
      const lastRow = bitacoraSheet.getLastRow();
      if (lastRow > 1) {
        for (let i = 2; i <= lastRow; i++) {
          bitacoraSheet.getRange(i, 8).setValue('STEM');
        }
      }
    }
  }
}

/**
 * Obtiene o crea la carpeta para fotos
 */
function getOrCreatePhotoFolder() {
  const folderName = 'Fotos_Laboratorio';
  const folders = DriveApp.getFoldersByName(folderName);

  if (folders.hasNext()) {
    return folders.next();
  } else {
    return DriveApp.createFolder(folderName);
  }
}

/**
 * Sube una imagen a Drive (base64)
 */
function uploadImage(base64Data, fileName) {
  try {
    if (!base64Data || !base64Data.startsWith('data:')) {
      return { success: false, error: 'Datos de imagen inválidos' };
    }

    const folder = getOrCreatePhotoFolder();
    const contentType = base64Data.match(/data:([^;]+);/)[1];
    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Content), contentType, fileName);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Retornar URL de visualización directa
    return { success: true, url: 'https://drive.google.com/uc?id=' + file.getId() };
  } catch (error) {
    Logger.log('Error al subir imagen: ' + error);
    return { success: false, error: error.toString() };
  }
}

// ==================== AUTENTICACIÓN ====================

/**
 * Autentica un usuario
 */
function loginUser(email, password) {
  try {
    // Validar entrada
    if (!email || !password) {
      return { success: false, message: 'Email y contraseña son requeridos' };
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, message: 'Formato de email inválido' };
    }

    // Usuarios están centralizados en el spreadsheet STEM
    const ss = SpreadsheetApp.openById(INVENTARIO_STEM_SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEETS.USUARIOS);

    if (!sheet) {
      initializeSheets();
      sheet = ss.getSheetByName(SHEETS.USUARIOS);
    }

    const data = sheet.getDataRange().getValues();

    // Verificar si hay datos
    if (data.length <= 1) {
      return { success: false, message: 'No hay usuarios registrados. Ejecute initializeSheets()' };
    }

    for (let i = 1; i < data.length; i++) {
      if (data[i][2] === email && data[i][3] === password) {
        return {
          success: true,
          user: {
            id: data[i][0],
            nombre: data[i][1],
            email: data[i][2],
            rol: data[i][4],
            laboratorio: data[i][5] || 'STEM' // Laboratorio asignado
          }
        };
      }
    }

    return { success: false, message: 'Email o contraseña incorrectos' };
  } catch (error) {
    Logger.log('Error en login: ' + error);
    return { success: false, message: 'Error al iniciar sesión: ' + error.toString() };
  }
}

/**
 * Cambia la contraseña de un usuario
 */
function cambiarPassword(email, oldPassword, newPassword) {
  try {
    // Validar contraseña nueva
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'La nueva contraseña debe tener al menos 6 caracteres' };
    }

    // Usuarios centralizados en spreadsheet STEM
    const ss = SpreadsheetApp.openById(INVENTARIO_STEM_SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.USUARIOS);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][2] === email && data[i][3] === oldPassword) {
        sheet.getRange(i + 1, 4).setValue(newPassword);
        return { success: true, message: 'Contraseña actualizada correctamente' };
      }
    }

    return { success: false, error: 'Contraseña actual incorrecta' };
  } catch (error) {
    Logger.log('Error al cambiar contraseña: ' + error);
    return { success: false, error: error.toString() };
  }
}

// ==================== INVENTARIO ====================

/**
 * Obtiene todos los elementos del inventario de un laboratorio
 */
function getInventario(laboratorio) {
  try {
    const ss = getSpreadsheetByLab(laboratorio || LABORATORIOS.STEM);
    if (!ss) {
      return [];
    }

    let sheet = ss.getSheetByName(SHEETS.INVENTARIO);

    if (!sheet) {
      initializeSheets();
      return [];
    }

    const data = sheet.getDataRange().getValues();
    const elementos = [];

    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) { // Si tiene ID
        elementos.push({
          id: data[i][0],
          nombre: data[i][1],
          cantidad: data[i][2],
          estado: data[i][3],
          categoria: data[i][4],
          descripcion: data[i][5] || '',
          foto: data[i][6] || '',
          laboratorio: laboratorio || LABORATORIOS.STEM
        });
      }
    }

    return elementos;
  } catch (error) {
    Logger.log('Error al obtener inventario: ' + error);
    return [];
  }
}

/**
 * Obtiene las categorías de un laboratorio
 */
function getCategorias(laboratorio) {
  try {
    const ss = getSpreadsheetByLab(laboratorio || LABORATORIOS.STEM);
    if (!ss) {
      return [];
    }

    let sheet = ss.getSheetByName(SHEETS.CATEGORIAS);
    if (!sheet) {
      return [];
    }

    const data = sheet.getDataRange().getValues();
    const categorias = [];

    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        categorias.push({
          id: data[i][0],
          nombre: data[i][1]
        });
      }
    }

    return categorias;
  } catch (error) {
    Logger.log('Error al obtener categorías: ' + error);
    return [];
  }
}

/**
 * Guarda un elemento (nuevo o actualiza existente)
 */
function saveElemento(elemento, laboratorio) {
  try {
    // Validar datos requeridos
    if (!elemento.nombre || elemento.nombre.trim() === '') {
      return { success: false, error: 'El nombre es requerido' };
    }
    if (elemento.cantidad === undefined || elemento.cantidad === null || elemento.cantidad < 0) {
      return { success: false, error: 'La cantidad debe ser mayor o igual a 0' };
    }
    if (!elemento.estado) {
      return { success: false, error: 'El estado es requerido' };
    }
    if (!elemento.categoria) {
      return { success: false, error: 'La categoría es requerida' };
    }

    const ss = getSpreadsheetByLab(laboratorio || LABORATORIOS.STEM);
    if (!ss) {
      return { success: false, error: 'Laboratorio inválido' };
    }

    let sheet = ss.getSheetByName(SHEETS.INVENTARIO);

    if (!sheet) {
      initializeSheets();
      sheet = ss.getSheetByName(SHEETS.INVENTARIO);
    }

    // Procesar foto si existe
    let fotoURL = elemento.foto || '';
    if (elemento.foto && elemento.foto.startsWith('data:')) {
      const fileName = 'elemento_' + Date.now() + '.jpg';
      const uploadResult = uploadImage(elemento.foto, fileName);
      if (uploadResult.success) {
        fotoURL = uploadResult.url;
      }
    }

    const data = sheet.getDataRange().getValues();

    // Si tiene ID, actualizar
    if (elemento.id) {
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === elemento.id) {
          sheet.getRange(i + 1, 1, 1, 7).setValues([[
            elemento.id,
            elemento.nombre.trim(),
            parseInt(elemento.cantidad),
            elemento.estado,
            elemento.categoria,
            elemento.descripcion || '',
            fotoURL
          ]]);
          return { success: true };
        }
      }
    }

    // Si no tiene ID o no se encontró, crear nuevo
    const id = Utilities.getUuid();
    sheet.appendRow([
      id,
      elemento.nombre.trim(),
      parseInt(elemento.cantidad),
      elemento.estado,
      elemento.categoria,
      elemento.descripcion || '',
      fotoURL
    ]);

    return { success: true };
  } catch (error) {
    Logger.log('Error al guardar elemento: ' + error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Obtiene estadísticas del inventario
 */
function getEstadisticasInventario() {
  try {
    const elementos = getInventario();

    const stats = {
      totalElementos: elementos.length,
      totalCantidad: 0,
      enFuncionamiento: 0,
      enReparacion: 0,
      stockBajo: [],
      porCategoria: {},
      alertas: []
    };

    elementos.forEach(elemento => {
      stats.totalCantidad += parseInt(elemento.cantidad) || 0;

      if (elemento.estado === 'Funcionamiento') {
        stats.enFuncionamiento++;
      } else if (elemento.estado === 'Reparación') {
        stats.enReparacion++;
      }

      // Contar por categoría
      if (!stats.porCategoria[elemento.categoria]) {
        stats.porCategoria[elemento.categoria] = { cantidad: 0, items: 0 };
      }
      stats.porCategoria[elemento.categoria].cantidad += parseInt(elemento.cantidad) || 0;
      stats.porCategoria[elemento.categoria].items++;

      // Stock bajo (menos de 5 unidades)
      if (parseInt(elemento.cantidad) < 5 && parseInt(elemento.cantidad) > 0) {
        stats.stockBajo.push({
          nombre: elemento.nombre,
          cantidad: elemento.cantidad,
          categoria: elemento.categoria
        });
      }

      // Sin stock
      if (parseInt(elemento.cantidad) === 0) {
        stats.alertas.push({
          tipo: 'sin_stock',
          mensaje: `${elemento.nombre} no tiene unidades disponibles`,
          elemento: elemento.nombre
        });
      }

      // Items en reparación
      if (elemento.estado === 'Reparación') {
        stats.alertas.push({
          tipo: 'reparacion',
          mensaje: `${elemento.nombre} está en reparación`,
          elemento: elemento.nombre
        });
      }
    });

    return stats;
  } catch (error) {
    Logger.log('Error al obtener estadísticas: ' + error);
    return null;
  }
}

/**
 * Elimina un elemento del inventario
 */
function deleteElemento(id) {
  try {
    const ss = SpreadsheetApp.openById(INVENTARIO_SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.INVENTARIO);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        sheet.deleteRow(i + 1);
        return { success: true };
      }
    }

    return { success: false, error: 'Elemento no encontrado' };
  } catch (error) {
    Logger.log('Error al eliminar elemento: ' + error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Exporta el inventario a formato CSV
 */
function exportInventarioToCSV() {
  try {
    const ss = SpreadsheetApp.openById(INVENTARIO_SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.INVENTARIO);

    if (!sheet) {
      return { success: false, error: 'Hoja de inventario no encontrada' };
    }

    const data = sheet.getDataRange().getValues();
    let csv = '';

    // Crear CSV
    for (let i = 0; i < data.length; i++) {
      const row = data[i].map(cell => {
        // Escapar comillas y comas
        let value = String(cell);
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          value = '"' + value.replace(/"/g, '""') + '"';
        }
        return value;
      });
      csv += row.join(',') + '\n';
    }

    // Crear archivo temporal en Drive
    const folder = getOrCreatePhotoFolder();
    const fileName = 'Inventario_' + new Date().getTime() + '.csv';
    const file = folder.createFile(fileName, csv, 'text/csv');
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return {
      success: true,
      url: file.getUrl(),
      downloadUrl: 'https://drive.google.com/uc?export=download&id=' + file.getId()
    };
  } catch (error) {
    Logger.log('Error al exportar inventario: ' + error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Importa inventario desde CSV
 */
function importInventarioFromCSV(csvContent) {
  try {
    const ss = SpreadsheetApp.openById(INVENTARIO_SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEETS.INVENTARIO);

    if (!sheet) {
      initializeSheets();
      sheet = ss.getSheetByName(SHEETS.INVENTARIO);
    }

    // Parsear CSV
    const lines = csvContent.split('\n');
    let importCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 1; i < lines.length; i++) { // Saltar encabezado
      if (!lines[i].trim()) continue;

      try {
        const values = parseCSVLine(lines[i]);
        if (values.length >= 4) { // Mínimo: nombre, cantidad, estado, categoria
          // Verificar si el elemento ya existe por nombre
          const nombre = values[1] ? values[1].trim() : '';
          if (!nombre) continue;

          const data = sheet.getDataRange().getValues();
          let exists = false;
          let existingId = null;

          for (let j = 1; j < data.length; j++) {
            if (data[j][1] && data[j][1].toLowerCase() === nombre.toLowerCase()) {
              exists = true;
              existingId = data[j][0];
              break;
            }
          }

          const cantidad = parseInt(values[2]) || 0;
          const estado = values[3] || 'Funcionamiento';
          const categoria = values[4] || 'Otros';
          const descripcion = values[5] || '';
          const foto = values[6] || '';

          if (exists && existingId) {
            // Actualizar elemento existente
            for (let j = 1; j < data.length; j++) {
              if (data[j][0] === existingId) {
                sheet.getRange(j + 1, 1, 1, 7).setValues([[
                  existingId,
                  nombre,
                  cantidad,
                  estado,
                  categoria,
                  descripcion,
                  foto
                ]]);
                importCount++;
                break;
              }
            }
          } else {
            // Crear nuevo elemento
            const id = Utilities.getUuid();
            sheet.appendRow([
              id,
              nombre,
              cantidad,
              estado,
              categoria,
              descripcion,
              foto
            ]);
            importCount++;
          }
        }
      } catch (lineError) {
        errorCount++;
        errors.push(`Línea ${i}: ${lineError.toString()}`);
      }
    }

    return {
      success: true,
      importCount: importCount,
      errorCount: errorCount,
      errors: errors.slice(0, 5) // Solo primeros 5 errores
    };
  } catch (error) {
    Logger.log('Error al importar inventario: ' + error);
    return { success: false, error: error.toString() };
  }
}

// ==================== BITÁCORA ====================

/**
 * Obtiene todas las entradas de la bitácora
 */
function getBitacora() {
  try {
    const ss = SpreadsheetApp.openById(BITACORA_SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEETS.BITACORA);

    if (!sheet) {
      initializeSheets();
      return [];
    }

    const data = sheet.getDataRange().getValues();
    const entradas = [];

    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        entradas.push({
          id: data[i][0],
          fecha: data[i][1],
          practica: data[i][2],
          items: data[i][3],
          usuario: data[i][4],
          observaciones: data[i][5] || '',
          preparador: data[i][6] || ''
        });
      }
    }

    // Ordenar por fecha descendente
    entradas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    return entradas;
  } catch (error) {
    Logger.log('Error al obtener bitácora: ' + error);
    return [];
  }
}

/**
 * Busca en la bitácora por rango de fechas o texto
 */
function buscarBitacora(filtros) {
  try {
    let entradas = getBitacora();

    // Filtrar por fecha de inicio
    if (filtros.fechaInicio) {
      entradas = entradas.filter(e => {
        const fecha = new Date(e.fecha);
        const inicio = new Date(filtros.fechaInicio);
        return fecha >= inicio;
      });
    }

    // Filtrar por fecha de fin
    if (filtros.fechaFin) {
      entradas = entradas.filter(e => {
        const fecha = new Date(e.fecha);
        const fin = new Date(filtros.fechaFin);
        return fecha <= fin;
      });
    }

    // Filtrar por texto en práctica, items o usuario
    if (filtros.texto) {
      const texto = filtros.texto.toLowerCase();
      entradas = entradas.filter(e =>
        e.practica.toLowerCase().includes(texto) ||
        e.items.toLowerCase().includes(texto) ||
        e.usuario.toLowerCase().includes(texto) ||
        (e.observaciones && e.observaciones.toLowerCase().includes(texto))
      );
    }

    // Filtrar por preparador
    if (filtros.preparador) {
      entradas = entradas.filter(e =>
        e.preparador && e.preparador.toLowerCase().includes(filtros.preparador.toLowerCase())
      );
    }

    return entradas;
  } catch (error) {
    Logger.log('Error al buscar en bitácora: ' + error);
    return [];
  }
}

/**
 * Guarda una entrada de bitácora
 */
function saveBitacora(entry) {
  try {
    const ss = SpreadsheetApp.openById(BITACORA_SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEETS.BITACORA);

    if (!sheet) {
      initializeSheets();
      sheet = ss.getSheetByName(SHEETS.BITACORA);
    }

    const id = entry.id || Utilities.getUuid();

    // Si tiene ID, verificar si es actualización
    if (entry.id) {
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === entry.id) {
          // Actualizar entrada existente
          sheet.getRange(i + 1, 1, 1, 7).setValues([[
            id,
            entry.fecha,
            entry.practica,
            entry.items,
            entry.usuario,
            entry.observaciones || '',
            entry.preparador || ''
          ]]);
          return { success: true };
        }
      }
    }

    // Nueva entrada
    sheet.appendRow([
      id,
      entry.fecha,
      entry.practica,
      entry.items,
      entry.usuario,
      entry.observaciones || '',
      entry.preparador || ''
    ]);

    return { success: true };
  } catch (error) {
    Logger.log('Error al guardar bitácora: ' + error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Agrega entrada automática cuando se completa una solicitud
 */
function addBitacoraFromSolicitud(solicitud, preparador) {
  try {
    const entry = {
      fecha: new Date().toISOString().split('T')[0],
      practica: 'Solicitud preparada: ' + solicitud.nombre,
      items: solicitud.materiales,
      usuario: solicitud.docente,
      observaciones: 'Solicitud completada automáticamente',
      preparador: preparador
    };

    return saveBitacora(entry);
  } catch (error) {
    Logger.log('Error al agregar entrada automática de bitácora: ' + error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Elimina una entrada de bitácora
 */
function deleteBitacora(id) {
  try {
    const ss = SpreadsheetApp.openById(BITACORA_SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.BITACORA);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        sheet.deleteRow(i + 1);
        return { success: true };
      }
    }

    return { success: false, error: 'Entrada no encontrada' };
  } catch (error) {
    Logger.log('Error al eliminar bitácora: ' + error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Exporta la bitácora a formato CSV
 */
function exportBitacoraToCSV() {
  try {
    const ss = SpreadsheetApp.openById(BITACORA_SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.BITACORA);

    if (!sheet) {
      return { success: false, error: 'Hoja de bitácora no encontrada' };
    }

    const data = sheet.getDataRange().getValues();
    let csv = '';

    // Crear CSV
    for (let i = 0; i < data.length; i++) {
      const row = data[i].map(cell => {
        // Escapar comillas y comas
        let value = String(cell);
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          value = '"' + value.replace(/"/g, '""') + '"';
        }
        return value;
      });
      csv += row.join(',') + '\n';
    }

    // Crear archivo temporal en Drive
    const folder = getOrCreatePhotoFolder();
    const fileName = 'Bitacora_' + new Date().getTime() + '.csv';
    const file = folder.createFile(fileName, csv, 'text/csv');
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return {
      success: true,
      url: file.getUrl(),
      downloadUrl: 'https://drive.google.com/uc?export=download&id=' + file.getId()
    };
  } catch (error) {
    Logger.log('Error al exportar bitácora: ' + error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Importa bitácora desde CSV
 */
function importBitacoraFromCSV(csvContent) {
  try {
    const ss = SpreadsheetApp.openById(BITACORA_SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEETS.BITACORA);

    if (!sheet) {
      initializeSheets();
      sheet = ss.getSheetByName(SHEETS.BITACORA);
    }

    // Parsear CSV
    const lines = csvContent.split('\n');
    let importCount = 0;

    for (let i = 1; i < lines.length; i++) { // Saltar encabezado
      if (!lines[i].trim()) continue;

      const values = parseCSVLine(lines[i]);
      if (values.length >= 7) {
        // Verificar si el ID ya existe
        const id = values[0] || Utilities.getUuid();
        const data = sheet.getDataRange().getValues();
        let exists = false;

        for (let j = 1; j < data.length; j++) {
          if (data[j][0] === id) {
            exists = true;
            break;
          }
        }

        if (!exists) {
          sheet.appendRow([
            id,
            values[1], // fecha
            values[2], // practica
            values[3], // items
            values[4], // usuario
            values[5], // observaciones
            values[6]  // preparador
          ]);
          importCount++;
        }
      }
    }

    return { success: true, importCount: importCount };
  } catch (error) {
    Logger.log('Error al importar bitácora: ' + error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Parsea una línea CSV respetando comillas
 */
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Saltar siguiente comilla
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current); // Último valor
  return values;
}

// ==================== SOLICITUDES ====================

/**
 * Obtiene todas las solicitudes
 */
function getAllSolicitudes() {
  try {
    const ss = SpreadsheetApp.openById(INVENTARIO_SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEETS.SOLICITUDES);

    if (!sheet) {
      initializeSheets();
      return [];
    }

    const data = sheet.getDataRange().getValues();
    const solicitudes = [];

    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        solicitudes.push({
          id: data[i][0],
          nombre: data[i][1],
          fechaInicio: formatDate(data[i][2]),
          fechaFin: formatDate(data[i][3]),
          fechaNecesaria: formatDate(data[i][4]),
          materiales: data[i][5],
          materialesExtra: data[i][6] || '',
          docente: data[i][7],
          docenteEmail: data[i][8],
          estado: data[i][9] || 'Pendiente',
          fotoPreparada: data[i][10] || '',
          observacionesPreparador: data[i][11] || ''
        });
      }
    }

    return solicitudes;
  } catch (error) {
    Logger.log('Error al obtener solicitudes: ' + error);
    return [];
  }
}

/**
 * Obtiene solicitudes de un docente específico
 */
function getSolicitudesByDocente(email) {
  try {
    const solicitudes = getAllSolicitudes();
    return solicitudes.filter(s => s.docenteEmail === email);
  } catch (error) {
    Logger.log('Error al obtener solicitudes del docente: ' + error);
    return [];
  }
}

/**
 * Guarda una nueva solicitud
 */
function saveSolicitud(solicitud) {
  try {
    // Validar datos requeridos
    if (!solicitud.nombre || solicitud.nombre.trim() === '') {
      return { success: false, error: 'El nombre de la práctica es requerido' };
    }
    if (!solicitud.fechaInicio || !solicitud.fechaFin || !solicitud.fechaNecesaria) {
      return { success: false, error: 'Todas las fechas son requeridas' };
    }
    if (!solicitud.materiales && !solicitud.materialesExtra) {
      return { success: false, error: 'Debe especificar al menos un material' };
    }

    // Validar que fechaInicio sea anterior a fechaFin
    const inicio = new Date(solicitud.fechaInicio);
    const fin = new Date(solicitud.fechaFin);
    if (inicio > fin) {
      return { success: false, error: 'La fecha de inicio debe ser anterior a la fecha de fin' };
    }

    const ss = SpreadsheetApp.openById(INVENTARIO_SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEETS.SOLICITUDES);

    if (!sheet) {
      initializeSheets();
      sheet = ss.getSheetByName(SHEETS.SOLICITUDES);
    }

    const id = Utilities.getUuid();
    sheet.appendRow([
      id,
      solicitud.nombre.trim(),
      solicitud.fechaInicio,
      solicitud.fechaFin,
      solicitud.fechaNecesaria,
      solicitud.materiales || '',
      solicitud.materialesExtra || '',
      solicitud.docente,
      solicitud.docenteEmail,
      'Pendiente',
      '',
      ''
    ]);

    // Notificar a los preparadores
    notificarNuevaSolicitud(solicitud);

    return { success: true };
  } catch (error) {
    Logger.log('Error al guardar solicitud: ' + error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Notifica a los preparadores sobre una nueva solicitud
 */
function notificarNuevaSolicitud(solicitud) {
  try {
    const usuarios = getUsuarios();
    const preparadores = usuarios.filter(u => u.rol === 'Preparador');

    preparadores.forEach(preparador => {
      sendNotification(
        preparador.email,
        'Nueva Solicitud de Material',
        `El docente ${solicitud.docente} ha solicitado materiales para la práctica "${solicitud.nombre}".\n\nFecha necesaria: ${solicitud.fechaNecesaria}`
      );
    });
  } catch (error) {
    Logger.log('Error al notificar nueva solicitud: ' + error);
  }
}

/**
 * Marca una solicitud como preparada
 */
function marcarSolicitudPreparada(data) {
  try {
    const ss = SpreadsheetApp.openById(INVENTARIO_SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.SOLICITUDES);
    const sheetData = sheet.getDataRange().getValues();

    // Procesar foto si existe
    let fotoURL = '';
    if (data.foto && data.foto.startsWith('data:')) {
      const fileName = 'preparacion_' + Date.now() + '.jpg';
      const uploadResult = uploadImage(data.foto, fileName);
      if (uploadResult.success) {
        fotoURL = uploadResult.url;
      }
    }

    for (let i = 1; i < sheetData.length; i++) {
      if (sheetData[i][0] === data.id) {
        // Actualizar estado, foto y observaciones
        sheet.getRange(i + 1, 10, 1, 3).setValues([['Preparada', fotoURL, data.observaciones || '']]);

        // Crear objeto solicitud para bitácora
        const solicitud = {
          nombre: sheetData[i][1],
          materiales: sheetData[i][5],
          docente: sheetData[i][7]
        };

        // Agregar entrada automática en bitácora
        addBitacoraFromSolicitud(solicitud, data.preparador || 'Preparador');

        // Enviar notificación al docente
        const docenteEmail = sheetData[i][8];
        const nombrePractica = sheetData[i][1];
        sendNotification(
          docenteEmail,
          'Práctica Lista',
          'Su solicitud "' + nombrePractica + '" ha sido preparada y está lista para usar.'
        );

        return { success: true };
      }
    }

    return { success: false, error: 'Solicitud no encontrada' };
  } catch (error) {
    Logger.log('Error al marcar solicitud como preparada: ' + error);
    return { success: false, error: error.toString() };
  }
}

// ==================== USUARIOS ====================

/**
 * Obtiene todos los usuarios
 */
function getUsuarios() {
  try {
    const ss = SpreadsheetApp.openById(INVENTARIO_SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEETS.USUARIOS);

    if (!sheet) {
      initializeSheets();
      return [];
    }

    const data = sheet.getDataRange().getValues();
    const usuarios = [];

    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        usuarios.push({
          id: data[i][0],
          nombre: data[i][1],
          email: data[i][2],
          password: data[i][3],
          rol: data[i][4]
        });
      }
    }

    return usuarios;
  } catch (error) {
    Logger.log('Error al obtener usuarios: ' + error);
    return [];
  }
}

/**
 * Guarda un usuario (nuevo o actualiza existente)
 */
function saveUsuario(usuario) {
  try {
    // Validar datos requeridos
    if (!usuario.nombre || usuario.nombre.trim() === '') {
      return { success: false, error: 'El nombre es requerido' };
    }
    if (!usuario.email || usuario.email.trim() === '') {
      return { success: false, error: 'El email es requerido' };
    }
    if (!usuario.password || usuario.password.length < 6) {
      return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
    }
    if (!usuario.rol || (usuario.rol !== 'Preparador' && usuario.rol !== 'Docente')) {
      return { success: false, error: 'El rol debe ser Preparador o Docente' };
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(usuario.email)) {
      return { success: false, error: 'Formato de email inválido' };
    }

    const ss = SpreadsheetApp.openById(INVENTARIO_SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEETS.USUARIOS);

    if (!sheet) {
      initializeSheets();
      sheet = ss.getSheetByName(SHEETS.USUARIOS);
    }

    const data = sheet.getDataRange().getValues();

    // Verificar si el email ya existe (excepto si es el mismo usuario)
    for (let i = 1; i < data.length; i++) {
      if (data[i][2] === usuario.email.trim() && data[i][0] !== usuario.id) {
        return { success: false, error: 'El email ya está registrado' };
      }
    }

    // Si tiene ID, actualizar
    if (usuario.id) {
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === usuario.id) {
          sheet.getRange(i + 1, 1, 1, 5).setValues([[
            usuario.id,
            usuario.nombre.trim(),
            usuario.email.trim(),
            usuario.password,
            usuario.rol
          ]]);
          return { success: true };
        }
      }
    }

    // Si no tiene ID o no se encontró, crear nuevo
    const id = Utilities.getUuid();
    sheet.appendRow([
      id,
      usuario.nombre.trim(),
      usuario.email.trim(),
      usuario.password,
      usuario.rol
    ]);

    return { success: true };
  } catch (error) {
    Logger.log('Error al guardar usuario: ' + error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Elimina un usuario
 */
function deleteUsuario(id) {
  try {
    const ss = SpreadsheetApp.openById(INVENTARIO_SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.USUARIOS);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        sheet.deleteRow(i + 1);
        return { success: true };
      }
    }

    return { success: false, error: 'Usuario no encontrado' };
  } catch (error) {
    Logger.log('Error al eliminar usuario: ' + error);
    return { success: false, error: error.toString() };
  }
}

// ==================== NOTIFICACIONES ====================

/**
 * Envía una notificación por email
 */
function sendNotification(email, subject, body) {
  try {
    MailApp.sendEmail({
      to: email,
      subject: '[Laboratorio] ' + subject,
      body: body,
      htmlBody: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #242B59; margin-bottom: 20px;">${subject}</h2>
            <p style="color: #252525; line-height: 1.6;">${body}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #888; font-size: 12px;">Sistema de Gestión de Laboratorio</p>
          </div>
        </div>
      `
    });
    return { success: true };
  } catch (error) {
    Logger.log('Error al enviar notificación: ' + error);
    return { success: false, error: error.toString() };
  }
}

// ==================== UTILIDADES ====================

/**
 * Formatea una fecha para mostrar
 */
function formatDate(date) {
  if (!date) return '';
  if (typeof date === 'string') return date;

  try {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    return date.toString();
  }
}

/**
 * Función para ejecutar al configurar el proyecto
 */
function onInstall() {
  initializeSheets();
}
