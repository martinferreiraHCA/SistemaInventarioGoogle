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

// Caché para mejorar rendimiento
const cache = CacheService.getScriptCache();

// Nombres de las hojas
const SHEETS = {
  INVENTARIO: 'Inventario',
  USUARIOS: 'Usuarios',
  SOLICITUDES: 'Solicitudes',
  BITACORA: 'Bitacora',
  CATEGORIAS: 'Categorias',
  ALTAS_BAJAS: 'AltasBajas'
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
    inventarioSheet.getRange(1, 1, 1, 9).setValues([[
      'ID', 'Nombre', 'Cantidad', 'Estado', 'Categoria', 'Descripcion', 'Foto', 'Ubicacion', 'FotoUbicacion'
    ]]);
    inventarioSheet.getRange(1, 1, 1, 9).setFontWeight('bold');
    inventarioSheet.setFrozenRows(1);
  } else {
    // Si ya existe, verificar si tiene las nuevas columnas
    const headers = inventarioSheet.getRange(1, 1, 1, inventarioSheet.getLastColumn()).getValues()[0];
    let columnsAdded = false;
    if (headers.indexOf('Ubicacion') === -1) {
      inventarioSheet.getRange(1, 8).setValue('Ubicacion');
      columnsAdded = true;
    }
    if (headers.indexOf('FotoUbicacion') === -1) {
      inventarioSheet.getRange(1, 9).setValue('FotoUbicacion');
      columnsAdded = true;
    }
  }

  // Usuarios (solo en spreadsheet STEM - centralizado)
  if (nombreLaboratorio === LABORATORIOS.STEM) {
    let usuariosSheet = ss.getSheetByName(SHEETS.USUARIOS);
    if (!usuariosSheet) {
      usuariosSheet = ss.insertSheet(SHEETS.USUARIOS);
      usuariosSheet.getRange(1, 1, 1, 6).setValues([[
        'ID', 'Nombre', 'Email', 'Password', 'Rol', 'Laboratorios'
      ]]);
      usuariosSheet.getRange(1, 1, 1, 6).setFontWeight('bold');
      usuariosSheet.setFrozenRows(1);

      // Agregar usuarios de ejemplo
      const adminId = Utilities.getUuid();
      const preparadorSTEMId = Utilities.getUuid();
      const preparadorBioId = Utilities.getUuid();
      const docenteSTEMId = Utilities.getUuid();
      const docenteBioId = Utilities.getUuid();
      const docenteAmbosId = Utilities.getUuid();

      // Laboratorios separados por comas para múltiples asignaciones
      usuariosSheet.appendRow([adminId, 'Administrador Sistema', 'admin@laboratorio.com', 'admin123', 'Admin', 'STEM,Bio-Química']);
      usuariosSheet.appendRow([preparadorSTEMId, 'Preparador STEM', 'preparador.stem@laboratorio.com', 'stem123', 'Preparador', 'STEM']);
      usuariosSheet.appendRow([preparadorBioId, 'Preparador Bio-Química', 'preparador.bio@laboratorio.com', 'bio123', 'Preparador', 'Bio-Química']);
      usuariosSheet.appendRow([docenteSTEMId, 'Docente STEM', 'docente.stem@laboratorio.com', 'docente123', 'Docente', 'STEM']);
      usuariosSheet.appendRow([docenteBioId, 'Docente Bio-Química', 'docente.bio@laboratorio.com', 'docente123', 'Docente', 'Bio-Química']);
      usuariosSheet.appendRow([docenteAmbosId, 'Docente Ambos Labs', 'docente.ambos@laboratorio.com', 'docente123', 'Docente', 'STEM,Bio-Química']);
    } else {
      // Si ya existe, verificar si tiene columna Laboratorios
      const headers = usuariosSheet.getRange(1, 1, 1, usuariosSheet.getLastColumn()).getValues()[0];
      if (headers.indexOf('Laboratorio') !== -1 && headers.indexOf('Laboratorios') === -1) {
        // Migrar de Laboratorio (singular) a Laboratorios (plural, soporta múltiples)
        usuariosSheet.getRange(1, 6).setValue('Laboratorios');
        // Los valores existentes se mantienen compatibles (un solo laboratorio)
      } else if (headers.indexOf('Laboratorios') === -1) {
        // Agregar columna Laboratorios si no existe ninguna
        usuariosSheet.getRange(1, 6).setValue('Laboratorios');
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

  // Altas y Bajas
  let altasBajasSheet = ss.getSheetByName(SHEETS.ALTAS_BAJAS);
  if (!altasBajasSheet) {
    altasBajasSheet = ss.insertSheet(SHEETS.ALTAS_BAJAS);
    altasBajasSheet.getRange(1, 1, 1, 8).setValues([[
      'ID', 'Fecha', 'Tipo', 'ElementoID', 'ElementoNombre', 'Cantidad', 'Motivo', 'Usuario'
    ]]);
    altasBajasSheet.getRange(1, 1, 1, 8).setFontWeight('bold');
    altasBajasSheet.setFrozenRows(1);
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
    bitacoraSheet.getRange(1, 1, 1, 9).setValues([[
      'ID', 'Fecha', 'Tipo', 'Practica', 'Items', 'Usuario', 'Observaciones', 'Preparador', 'Laboratorio'
    ]]);
    bitacoraSheet.getRange(1, 1, 1, 9).setFontWeight('bold');
    bitacoraSheet.setFrozenRows(1);
  } else {
    // Verificar si tiene columna Tipo
    const headers = bitacoraSheet.getRange(1, 1, 1, bitacoraSheet.getLastColumn()).getValues()[0];
    if (headers.indexOf('Tipo') === -1) {
      // Insertar columna Tipo en posición 3 (después de Fecha)
      bitacoraSheet.insertColumnAfter(2);
      bitacoraSheet.getRange(1, 3).setValue('Tipo');
      // Asignar "Práctica Preparada" por defecto a entradas existentes
      const lastRow = bitacoraSheet.getLastRow();
      if (lastRow > 1) {
        for (let i = 2; i <= lastRow; i++) {
          bitacoraSheet.getRange(i, 3).setValue('Práctica Preparada');
        }
      }
    }
    // Verificar si tiene columna Laboratorio
    if (headers.indexOf('Laboratorio') === -1) {
      bitacoraSheet.getRange(1, 9).setValue('Laboratorio');
      // Asignar STEM por defecto a entradas existentes
      const lastRow = bitacoraSheet.getLastRow();
      if (lastRow > 1) {
        for (let i = 2; i <= lastRow; i++) {
          bitacoraSheet.getRange(i, 9).setValue('STEM');
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
      Logger.log('ERROR: Datos de imagen inválidos');
      return { success: false, error: 'Datos de imagen inválidos' };
    }

    const folder = getOrCreatePhotoFolder();
    Logger.log('Carpeta de fotos: ' + folder.getName());

    const contentType = base64Data.match(/data:([^;]+);/)[1];
    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Content), contentType, fileName);
    const file = folder.createFile(blob);

    // Hacer el archivo público
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileId = file.getId();
    Logger.log('Imagen subida con ID: ' + fileId);

    // Retornar URL de visualización directa - usar thumbnail para mejor rendimiento
    const url = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w400';
    Logger.log('URL generada: ' + url);

    return { success: true, url: url, fileId: fileId };
  } catch (error) {
    Logger.log('Error al subir imagen: ' + error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Sube un documento a Drive (base64) - PDF, Word, etc.
 */
function uploadDocument(base64Data, fileName) {
  try {
    if (!base64Data || !base64Data.startsWith('data:')) {
      Logger.log('ERROR: Datos de documento inválidos');
      return { success: false, error: 'Datos de documento inválidos' };
    }

    const folder = getOrCreatePhotoFolder();
    Logger.log('Carpeta de documentos: ' + folder.getName());

    // Extraer tipo de contenido y datos base64
    const matches = base64Data.match(/data:([^;]+);base64,(.+)/);
    if (!matches) {
      return { success: false, error: 'Formato de documento inválido' };
    }

    const contentType = matches[1];
    const base64Content = matches[2];

    // Determinar extensión según tipo de contenido
    let extension = '.pdf';
    if (contentType.includes('word') || contentType.includes('document')) {
      extension = '.docx';
    } else if (contentType.includes('text')) {
      extension = '.txt';
    }

    const blob = Utilities.newBlob(Utilities.base64Decode(base64Content), contentType, fileName + extension);
    const file = folder.createFile(blob);

    // Hacer el archivo público
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileId = file.getId();
    Logger.log('Documento subido con ID: ' + fileId);

    // Retornar URL de visualización
    const url = 'https://drive.google.com/file/d/' + fileId + '/view';
    Logger.log('URL generada: ' + url);

    return { success: true, url: url, fileId: fileId };
  } catch (error) {
    Logger.log('Error al subir documento: ' + error);
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
        // Parsear laboratorios: puede ser string simple o separados por comas
        const laboratoriosStr = data[i][5] || 'STEM';
        const laboratoriosArray = laboratoriosStr.split(',').map(lab => lab.trim());

        return {
          success: true,
          user: {
            id: data[i][0],
            nombre: data[i][1],
            email: data[i][2],
            rol: data[i][4],
            laboratorios: laboratoriosArray, // Array de laboratorios asignados
            laboratorio: laboratoriosArray[0] // Laboratorio por defecto (primer elemento)
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
    const lab = laboratorio || LABORATORIOS.STEM;

    // Intentar obtener del caché primero
    const cacheKey = 'inventario_' + lab;
    const cached = cache.get(cacheKey);
    if (cached) {
      Logger.log('Inventario obtenido del caché para: ' + lab);
      return JSON.parse(cached);
    }

    const ss = getSpreadsheetByLab(lab);
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
        const estado = data[i][3];

        // FILTRAR: Solo mostrar elementos que NO estén dados de baja
        if (estado !== 'Dado de baja') {
          elementos.push({
            id: data[i][0],
            nombre: data[i][1],
            cantidad: data[i][2],
            estado: estado,
            categoria: data[i][4],
            descripcion: data[i][5] || '',
            foto: data[i][6] || '',
            ubicacion: data[i][7] || '',
            fotoUbicacion: data[i][8] || '',
            laboratorio: lab
          });
        }
      }
    }

    // Guardar en caché por 2 minutos (120 segundos)
    try {
      cache.put(cacheKey, JSON.stringify(elementos), 120);
    } catch (e) {
      Logger.log('Error al guardar caché: ' + e);
    }

    return elementos;
  } catch (error) {
    Logger.log('Error al obtener inventario: ' + error);
    return [];
  }
}

/**
 * Invalida el caché de inventario para un laboratorio
 */
function clearInventarioCache(laboratorio) {
  try {
    const cacheKey = 'inventario_' + (laboratorio || LABORATORIOS.STEM);
    cache.remove(cacheKey);
    Logger.log('Caché invalidado para: ' + laboratorio);
  } catch (error) {
    Logger.log('Error al invalidar caché: ' + error);
  }
}

/**
 * Obtiene las categorías de un laboratorio
 */
function getCategorias(laboratorio) {
  try {
    const lab = laboratorio || LABORATORIOS.STEM;

    // Intentar obtener del caché primero - categorías se cachean por más tiempo
    const cacheKey = 'categorias_' + lab;
    const cached = cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const ss = getSpreadsheetByLab(lab);
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

    // Guardar en caché por 10 minutos (600 segundos)
    try {
      cache.put(cacheKey, JSON.stringify(categorias), 600);
    } catch (e) {
      Logger.log('Error al guardar caché de categorías: ' + e);
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

    // Procesar foto del elemento si existe
    let fotoURL = elemento.foto || '';
    if (elemento.foto && elemento.foto.startsWith('data:')) {
      const fileName = 'elemento_' + Date.now() + '.jpg';
      const uploadResult = uploadImage(elemento.foto, fileName);
      if (uploadResult.success) {
        fotoURL = uploadResult.url;
      }
    }

    // Procesar foto de ubicación si existe
    let fotoUbicacionURL = elemento.fotoUbicacion || '';
    if (elemento.fotoUbicacion && elemento.fotoUbicacion.startsWith('data:')) {
      const fileName = 'ubicacion_' + Date.now() + '.jpg';
      const uploadResult = uploadImage(elemento.fotoUbicacion, fileName);
      if (uploadResult.success) {
        fotoUbicacionURL = uploadResult.url;
      }
    }

    const data = sheet.getDataRange().getValues();

    // Si tiene ID, actualizar
    if (elemento.id) {
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === elemento.id) {
          sheet.getRange(i + 1, 1, 1, 9).setValues([[
            elemento.id,
            elemento.nombre.trim(),
            parseInt(elemento.cantidad),
            elemento.estado,
            elemento.categoria,
            elemento.descripcion || '',
            fotoURL,
            elemento.ubicacion || '',
            fotoUbicacionURL
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
      fotoURL,
      elemento.ubicacion || '',
      fotoUbicacionURL
    ]);

    // Invalidar caché
    clearInventarioCache(laboratorio);

    return { success: true };
  } catch (error) {
    Logger.log('Error al guardar elemento: ' + error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Obtiene estadísticas del inventario por laboratorio
 */
function getEstadisticasInventario(laboratorio) {
  try {
    const elementos = getInventario(laboratorio || LABORATORIOS.STEM);

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
 * Da de baja un elemento del inventario (cambia estado a "Dado de baja")
 */
function deleteElemento(id, laboratorio) {
  try {
    const lab = laboratorio || LABORATORIOS.STEM;
    const ss = getSpreadsheetByLab(lab);
    if (!ss) {
      return { success: false, error: 'Laboratorio inválido' };
    }

    const sheet = ss.getSheetByName(SHEETS.INVENTARIO);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        const elementoNombre = data[i][1];
        const cantidad = data[i][2];

        // Cambiar estado a "Dado de baja" en lugar de eliminar la fila
        sheet.getRange(i + 1, 4).setValue('Dado de baja');

        // Registrar en AltasBajas
        const usuario = Session.getActiveUser().getEmail();
        registrarAltaBaja('Baja', id, elementoNombre, cantidad, 'Dado de baja desde inventario', usuario, lab);

        Logger.log('Elemento dado de baja: ' + elementoNombre + ' (ID: ' + id + ')');

        // Invalidar caché
        clearInventarioCache(lab);
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
 * Guarda o actualiza una categoría
 */
function saveCategoria(categoria, laboratorio) {
  try {
    if (!categoria.nombre || categoria.nombre.trim() === '') {
      return { success: false, error: 'El nombre es requerido' };
    }

    const lab = laboratorio || LABORATORIOS.STEM;
    const ss = getSpreadsheetByLab(lab);
    if (!ss) {
      return { success: false, error: 'Laboratorio inválido' };
    }

    let sheet = ss.getSheetByName(SHEETS.CATEGORIAS);
    if (!sheet) {
      return { success: false, error: 'Hoja de categorías no encontrada' };
    }

    const data = sheet.getDataRange().getValues();
    let nombreAnterior = null;

    // Si tiene ID, actualizar
    if (categoria.id) {
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === categoria.id) {
          nombreAnterior = data[i][1]; // Guardar nombre anterior
          sheet.getRange(i + 1, 1, 1, 2).setValues([[
            categoria.id,
            categoria.nombre.trim()
          ]]);

          // Si se cambió el nombre, actualizar en el inventario
          if (nombreAnterior !== categoria.nombre.trim()) {
            updateInventarioCategorias(nombreAnterior, categoria.nombre.trim(), lab);
          }

          // Invalidar caché
          clearCategoriasCache(lab);
          clearInventarioCache(lab);

          return { success: true };
        }
      }
    }

    // Si no tiene ID o no se encontró, crear nuevo
    const id = Utilities.getUuid();
    sheet.appendRow([id, categoria.nombre.trim()]);

    // Invalidar caché
    clearCategoriasCache(lab);

    return { success: true };
  } catch (error) {
    Logger.log('Error al guardar categoría: ' + error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Actualiza la categoría en todos los elementos del inventario
 */
function updateInventarioCategorias(nombreAnterior, nombreNuevo, laboratorio) {
  try {
    const ss = getSpreadsheetByLab(laboratorio);
    const inventarioSheet = ss.getSheetByName(SHEETS.INVENTARIO);

    if (!inventarioSheet) {
      return;
    }

    const data = inventarioSheet.getDataRange().getValues();

    // Actualizar todos los elementos que tengan la categoría antigua
    for (let i = 1; i < data.length; i++) {
      if (data[i][4] === nombreAnterior) { // Columna 5 es Categoria (índice 4)
        inventarioSheet.getRange(i + 1, 5).setValue(nombreNuevo);
      }
    }

    Logger.log('Categorías actualizadas en inventario: ' + nombreAnterior + ' -> ' + nombreNuevo);
  } catch (error) {
    Logger.log('Error al actualizar categorías en inventario: ' + error);
  }
}

/**
 * Invalida el caché de categorías
 */
function clearCategoriasCache(laboratorio) {
  try {
    const cacheKey = 'categorias_' + (laboratorio || LABORATORIOS.STEM);
    cache.remove(cacheKey);
  } catch (error) {
    Logger.log('Error al invalidar caché de categorías: ' + error);
  }
}

/**
 * Elimina una categoría
 */
function deleteCategoria(id, laboratorio) {
  try {
    const lab = laboratorio || LABORATORIOS.STEM;
    const ss = getSpreadsheetByLab(lab);
    if (!ss) {
      return { success: false, error: 'Laboratorio inválido' };
    }

    const categoriasSheet = ss.getSheetByName(SHEETS.CATEGORIAS);
    const data = categoriasSheet.getDataRange().getValues();

    let nombreCategoria = null;

    // Buscar la categoría y su nombre
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        nombreCategoria = data[i][1];
        break;
      }
    }

    if (!nombreCategoria) {
      return { success: false, error: 'Categoría no encontrada' };
    }

    // Verificar si la categoría está en uso en el inventario
    const inventarioSheet = ss.getSheetByName(SHEETS.INVENTARIO);
    if (inventarioSheet) {
      const inventarioData = inventarioSheet.getDataRange().getValues();
      for (let i = 1; i < inventarioData.length; i++) {
        if (inventarioData[i][4] === nombreCategoria) { // Columna 5 es Categoria
          return {
            success: false,
            error: 'No se puede eliminar esta categoría porque hay elementos que la utilizan. Primero cambia la categoría de esos elementos.'
          };
        }
      }
    }

    // Si no está en uso, eliminar
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        categoriasSheet.deleteRow(i + 1);

        // Invalidar caché
        clearCategoriasCache(lab);

        return { success: true };
      }
    }

    return { success: false, error: 'Categoría no encontrada' };
  } catch (error) {
    Logger.log('Error al eliminar categoría: ' + error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Exporta el inventario a formato CSV
 */
function exportInventarioToCSV(laboratorio) {
  try {
    const ss = getSpreadsheetByLab(laboratorio || LABORATORIOS.STEM);
    if (!ss) {
      return { success: false, error: 'Laboratorio inválido' };
    }

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
function importInventarioFromCSV(csvContent, laboratorio) {
  try {
    const ss = getSpreadsheetByLab(laboratorio || LABORATORIOS.STEM);
    if (!ss) {
      return { success: false, error: 'Laboratorio inválido' };
    }

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
          tipo: data[i][2] || 'Práctica Preparada',
          practica: data[i][3],
          items: data[i][4] || '',
          usuario: data[i][5],
          observaciones: data[i][6] || '',
          preparador: data[i][7] || '',
          laboratorio: data[i][8] || 'STEM'
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
function saveBitacora(entry, laboratorio) {
  try {
    const ss = SpreadsheetApp.openById(BITACORA_SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEETS.BITACORA);

    if (!sheet) {
      initializeSheets();
      sheet = ss.getSheetByName(SHEETS.BITACORA);
    }

    const id = entry.id || Utilities.getUuid();
    const lab = laboratorio || LABORATORIOS.STEM;

    // Si tiene ID, verificar si es actualización
    if (entry.id) {
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === entry.id) {
          // Actualizar entrada existente
          sheet.getRange(i + 1, 1, 1, 9).setValues([[
            id,
            entry.fecha,
            entry.tipo || 'Otro',
            entry.practica,
            entry.items || '',
            entry.usuario,
            entry.observaciones || '',
            entry.preparador || '',
            lab
          ]]);
          return { success: true };
        }
      }
    }

    // Nueva entrada
    sheet.appendRow([
      id,
      entry.fecha,
      entry.tipo || 'Otro',
      entry.practica,
      entry.items || '',
      entry.usuario,
      entry.observaciones || '',
      entry.preparador || '',
      lab
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
function addBitacoraFromSolicitud(solicitud, preparador, laboratorio) {
  try {
    const entry = {
      fecha: new Date().toISOString().split('T')[0],
      tipo: 'Práctica Preparada',
      practica: solicitud.nombre,
      items: solicitud.materiales,
      usuario: solicitud.docente,
      observaciones: 'Solicitud completada automáticamente',
      preparador: preparador
    };

    return saveBitacora(entry, laboratorio);
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
 * Obtiene todas las solicitudes de un laboratorio específico
 */
function getAllSolicitudes(laboratorio) {
  try {
    const lab = laboratorio || LABORATORIOS.STEM;
    const ss = getSpreadsheetByLab(lab);
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
          observacionesPreparador: data[i][11] || '',
          laboratorio: data[i][12] || lab,
          documentoPractica: data[i][13] || '',
          imagenesPractica: data[i][14] || ''
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
function saveSolicitud(solicitud, laboratorio) {
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

    const lab = laboratorio || LABORATORIOS.STEM;
    const ss = getSpreadsheetByLab(lab);
    let sheet = ss.getSheetByName(SHEETS.SOLICITUDES);

    if (!sheet) {
      initializeSheets();
      sheet = ss.getSheetByName(SHEETS.SOLICITUDES);
    }

    // Subir múltiples documentos si existen
    let documentoURLs = '';
    if (solicitud.documentoPractica) {
      const documentosArray = solicitud.documentoPractica.split('|||');
      const urlsArray = [];
      for (let i = 0; i < documentosArray.length; i++) {
        const docResult = uploadDocument(documentosArray[i], solicitud.nombre + '_documento_' + (i + 1));
        if (docResult.success) {
          urlsArray.push(docResult.url);
        }
      }
      documentoURLs = urlsArray.join('|||');
      Logger.log('Documentos subidos: ' + urlsArray.length);
    }

    // Subir múltiples imágenes si existen
    let imagenesURLs = '';
    if (solicitud.imagenesPractica) {
      const imagenesArray = solicitud.imagenesPractica.split('|||');
      const urlsArray = [];
      for (let i = 0; i < imagenesArray.length; i++) {
        const imgResult = uploadImage(imagenesArray[i], solicitud.nombre + '_imagen_' + (i + 1));
        if (imgResult.success) {
          urlsArray.push(imgResult.url);
        }
      }
      imagenesURLs = urlsArray.join('|||');
      Logger.log('Imágenes subidas: ' + urlsArray.length);
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
      '',
      lab,
      documentoURLs, // Ahora puede contener múltiples URLs separadas por |||
      imagenesURLs   // Ahora puede contener múltiples URLs separadas por |||
    ]);

    // Notificar al preparador del laboratorio
    notificarNuevaSolicitud(solicitud, lab);

    return { success: true };
  } catch (error) {
    Logger.log('Error al guardar solicitud: ' + error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Notifica a los preparadores sobre una nueva solicitud
 */
function notificarNuevaSolicitud(solicitud, laboratorio) {
  try {
    // Obtener email del preparador del laboratorio específico
    const preparadorEmail = getPreparadorEmail(laboratorio);

    if (!preparadorEmail) {
      Logger.log('No se pudo enviar notificación: no hay preparador asignado al laboratorio ' + laboratorio);
      return;
    }

    // Formatear fechas de manera amigable
    const fechaInicioStr = typeof solicitud.fechaInicio === 'string' ? solicitud.fechaInicio : formatDate(solicitud.fechaInicio);
    const fechaFinStr = typeof solicitud.fechaFin === 'string' ? solicitud.fechaFin : formatDate(solicitud.fechaFin);
    const fechaInicioAmigable = formatFechaAmigable(fechaInicioStr);
    const fechaFinAmigable = formatFechaAmigable(fechaFinStr);

    // Formatear múltiples días con horas seleccionados
    const fechaNecesariaStr = typeof solicitud.fechaNecesaria === 'string' ? solicitud.fechaNecesaria : formatDate(solicitud.fechaNecesaria);
    const horasNombres = ['', '1ra', '2da', '3ra', '4ta', '5ta', '6ta', '7ma', '8va', '9na', '10ma'];
    let diasNecesariosTexto = '';

    // Verificar si es formato nuevo (con horas) o antiguo (solo fechas)
    if (fechaNecesariaStr.includes(':')) {
      // Nuevo formato: fecha1:hora1,hora2|fecha2:hora3,hora4
      const diasConHoras = fechaNecesariaStr.split('|');
      diasNecesariosTexto = diasConHoras.map(diaHora => {
        const partes = diaHora.split(':');
        const fecha = partes[0];
        const horasStr = partes[1];
        const horas = horasStr.split(',').map(h => horasNombres[parseInt(h)]).join(', ');
        return `  • ${formatFechaAmigable(fecha)}\n    Horas: ${horas}`;
      }).join('\n');
    } else {
      // Formato antiguo: fecha1,fecha2,fecha3
      const fechasArray = fechaNecesariaStr.split(',').map(f => f.trim());
      const fechasFormateadas = fechasArray.map(f => formatFechaAmigable(f));
      diasNecesariosTexto = fechasFormateadas.map(f => `  • ${f}`).join('\n');
    }

    const materialesExtra = solicitud.materialesExtra || 'Ninguno';

    // Construir email para el preparador
    const emailBody = `Estimado/a Preparador,

Ha recibido una nueva solicitud de materiales para el laboratorio ${laboratorio}.

📋 DETALLES DE LA SOLICITUD:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔬 Práctica: ${solicitud.nombre}
👤 Docente solicitante: ${solicitud.docente}
📧 Email: ${solicitud.docenteEmail}
📅 Período de uso: Desde ${fechaInicioAmigable} hasta ${fechaFinAmigable}
📅 Días solicitados:
${diasNecesariosTexto}
🧪 Laboratorio: ${laboratorio}

📦 MATERIALES SOLICITADOS:
${solicitud.materiales || 'No especificado'}

${materialesExtra !== 'Ninguno' ? '📦 Materiales adicionales:\n' + materialesExtra + '\n\n' : ''}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Por favor, prepare los materiales y marque la solicitud como preparada en el sistema cuando esté lista.

Saludos,
Sistema de Gestión de Laboratorio`;

    // Enviar email al preparador con copia al docente
    Logger.log('Enviando notificación de nueva solicitud a preparador: ' + preparadorEmail);
    Logger.log('Con copia a docente: ' + solicitud.docenteEmail);

    const emailResult = sendNotification(
      preparadorEmail,
      '🆕 Nueva Solicitud: ' + solicitud.nombre,
      emailBody,
      { cc: solicitud.docenteEmail }
    );

    if (emailResult.success) {
      Logger.log('Notificación enviada exitosamente');
    } else {
      Logger.log('Error al enviar notificación: ' + emailResult.error);
    }
  } catch (error) {
    Logger.log('Error al notificar nueva solicitud: ' + error);
  }
}

/**
 * Marca una solicitud como preparada
 */
function marcarSolicitudPreparada(data, laboratorio) {
  try {
    const lab = laboratorio || LABORATORIOS.STEM;
    const ss = getSpreadsheetByLab(lab);
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
        addBitacoraFromSolicitud(solicitud, data.preparador || 'Preparador', lab);

        // Enviar notificación detallada al docente
        const docenteEmail = sheetData[i][8];
        const nombrePractica = sheetData[i][1];
        const nombreDocente = sheetData[i][7];
        const fechaInicio = sheetData[i][2];
        const fechaFin = sheetData[i][3];
        const fechaNecesaria = sheetData[i][4];
        const materiales = sheetData[i][5];
        const materialesExtra = sheetData[i][6] || 'Ninguno';
        const observacionesPreparador = data.observaciones || 'Sin observaciones';

        Logger.log('Intentando enviar email a: ' + docenteEmail);

        // Formatear fechas de manera amigable
        // Convertir a string primero (pueden venir como Date objects de Sheets)
        const fechaInicioStr = typeof fechaInicio === 'string' ? fechaInicio : formatDate(fechaInicio);
        const fechaFinStr = typeof fechaFin === 'string' ? fechaFin : formatDate(fechaFin);
        const fechaInicioAmigable = formatFechaAmigable(fechaInicioStr);
        const fechaFinAmigable = formatFechaAmigable(fechaFinStr);

        // Formatear múltiples días con horas seleccionados
        // Convertir fechaNecesaria a string primero (puede venir como Date object de Sheets)
        const fechaNecesariaStr = typeof fechaNecesaria === 'string' ? fechaNecesaria : formatDate(fechaNecesaria);
        const horasNombres = ['', '1ra', '2da', '3ra', '4ta', '5ta', '6ta', '7ma', '8va', '9na', '10ma'];
        let diasNecesariosTexto = '';

        // Verificar si es formato nuevo (con horas) o antiguo (solo fechas)
        if (fechaNecesariaStr.includes(':')) {
          // Nuevo formato: fecha1:hora1,hora2|fecha2:hora3,hora4
          const diasConHoras = fechaNecesariaStr.split('|');
          diasNecesariosTexto = diasConHoras.map(diaHora => {
            const partes = diaHora.split(':');
            const fecha = partes[0];
            const horasStr = partes[1];
            const horas = horasStr.split(',').map(h => horasNombres[parseInt(h)]).join(', ');
            return `  • ${formatFechaAmigable(fecha)}\n    Horas: ${horas}`;
          }).join('\n');
        } else {
          // Formato antiguo: fecha1,fecha2,fecha3
          const fechasArray = fechaNecesariaStr.split(',').map(f => f.trim());
          const fechasFormateadas = fechasArray.map(f => formatFechaAmigable(f));
          diasNecesariosTexto = fechasFormateadas.map(f => `  • ${f}`).join('\n');
        }

        // Construir email con todos los detalles
        const emailBody = `Estimado/a ${nombreDocente},

Le informamos que su solicitud de materiales ha sido preparada y está lista para su uso.

📋 DETALLES DE LA SOLICITUD:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔬 Práctica: ${nombrePractica}
📅 Período de uso: Desde ${fechaInicioAmigable} hasta ${fechaFinAmigable}
📅 Días solicitados:
${diasNecesariosTexto}
🧪 Laboratorio: ${lab}

📦 MATERIALES PREPARADOS:
${materiales}

${materialesExtra !== 'Ninguno' ? '📦 Materiales adicionales:\n' + materialesExtra + '\n\n' : ''}💬 OBSERVACIONES DEL PREPARADOR:
${observacionesPreparador}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Por favor, confirme la recepción de este correo y coordine con el preparador para el retiro de los materiales.

Saludos,
Sistema de Gestión de Laboratorio`;

        // Obtener email del preparador para enviar copia
        const preparadorEmail = getPreparadorEmail(lab);

        // Enviar notificación al docente con copia al preparador (incluir foto si existe)
        const emailResult = sendNotification(
          docenteEmail,
          '✅ Práctica Preparada: ' + nombrePractica,
          emailBody,
          {
            fotoBase64: data.foto || null, // Pasar base64 directamente en lugar de URL
            cc: preparadorEmail || null // Copia al preparador
          }
        );

        if (emailResult.success) {
          Logger.log('Email enviado exitosamente a: ' + docenteEmail);
        } else {
          Logger.log('Error al enviar email: ' + emailResult.error);
          // Continuar aunque falle el email, pero registrar el error
        }

        return { success: true, emailSent: emailResult.success };
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
    const ss = SpreadsheetApp.openById(INVENTARIO_STEM_SPREADSHEET_ID);
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
          rol: data[i][4],
          laboratorio: data[i][5] || 'STEM'
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

    // Validar laboratorios (puede ser uno o varios separados por comas)
    if (!usuario.laboratorio || usuario.laboratorio.trim() === '') {
      return { success: false, error: 'Debe seleccionar al menos un laboratorio' };
    }

    // Validar que cada laboratorio en la lista sea válido
    const laboratoriosArray = usuario.laboratorio.split(',').map(lab => lab.trim());
    const laboratoriosValidos = [LABORATORIOS.STEM, LABORATORIOS.BIOQUIMICA];

    for (let lab of laboratoriosArray) {
      if (!laboratoriosValidos.includes(lab)) {
        return { success: false, error: 'Laboratorio inválido: ' + lab + '. Debe ser STEM o Bio-Química' };
      }
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(usuario.email)) {
      return { success: false, error: 'Formato de email inválido' };
    }

    const ss = SpreadsheetApp.openById(INVENTARIO_STEM_SPREADSHEET_ID);
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
          sheet.getRange(i + 1, 1, 1, 6).setValues([[
            usuario.id,
            usuario.nombre.trim(),
            usuario.email.trim(),
            usuario.password,
            usuario.rol,
            usuario.laboratorio || 'STEM'
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
      usuario.rol,
      usuario.laboratorio || 'STEM'
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
    const ss = SpreadsheetApp.openById(INVENTARIO_STEM_SPREADSHEET_ID);
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
 * Obtiene el email del preparador asignado a un laboratorio
 * @param {string} laboratorio - STEM o Bio-Química
 * @returns {string} Email del preparador o string vacío si no se encuentra
 */
function getPreparadorEmail(laboratorio) {
  try {
    const usuarios = getUsuarios();

    // Buscar preparadores que tengan asignado este laboratorio
    const preparador = usuarios.find(u => {
      if (u.rol !== 'Preparador') return false;

      // Verificar si el laboratorio está en su lista de laboratorios asignados
      const labsAsignados = u.laboratorio ? u.laboratorio.split(',').map(l => l.trim()) : [];
      return labsAsignados.includes(laboratorio);
    });

    if (preparador) {
      Logger.log('Preparador encontrado para ' + laboratorio + ': ' + preparador.email);
      return preparador.email;
    }

    Logger.log('No se encontró preparador para el laboratorio: ' + laboratorio);
    return '';
  } catch (error) {
    Logger.log('Error al obtener email del preparador: ' + error);
    return '';
  }
}

/**
 * Formatea una fecha en español de manera amigable
 * Ejemplo: "2025-12-15" -> "Lunes, 15 de Diciembre de 2025"
 */
function formatFechaAmigable(fechaStr) {
  try {
    if (!fechaStr) return '';

    const fecha = new Date(fechaStr + 'T00:00:00'); // Forzar zona horaria local

    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const diaSemana = diasSemana[fecha.getDay()];
    const dia = fecha.getDate();
    const mes = meses[fecha.getMonth()];
    const año = fecha.getFullYear();

    return `${diaSemana}, ${dia} de ${mes} de ${año}`;
  } catch (error) {
    Logger.log('Error al formatear fecha: ' + error);
    return fechaStr; // Retornar formato original si falla
  }
}

/**
 * Función de prueba para verificar envío de emails
 * EJECUTAR MANUALMENTE desde el editor de Apps Script
 */
function testSendEmail() {
  const testEmail = Session.getActiveUser().getEmail(); // Tu email de Google
  const result = sendNotification(
    testEmail,
    'Prueba de Email',
    'Este es un email de prueba del sistema de laboratorio.\n\nSi recibes esto, el sistema de emails funciona correctamente.'
  );

  Logger.log('Resultado de prueba: ' + JSON.stringify(result));
  return result;
}

/**
 * Envía una notificación por email
 * @param {string} email - Destinatario
 * @param {string} subject - Asunto
 * @param {string} body - Cuerpo del mensaje en texto plano
 * @param {object} options - Opciones adicionales { fotoURL: string }
 */
function sendNotification(email, subject, body, options) {
  try {
    // Validar que el email no esté vacío
    if (!email || email.trim() === '') {
      Logger.log('Error: Email vacío o inválido');
      return { success: false, error: 'Email vacío o inválido' };
    }

    Logger.log('Enviando email a: ' + email);
    Logger.log('Asunto: ' + subject);

    options = options || {};

    // Convertir saltos de línea a HTML
    const htmlBody = body.replace(/\n/g, '<br>');

    // Preparar imagen inline si existe
    let fotoHtml = '';
    let inlineImages = {};

    if (options.fotoBase64 && options.fotoBase64.startsWith('data:image/')) {
      try {
        // Extraer los datos base64 y el tipo MIME
        const matches = options.fotoBase64.match(/^data:([^;]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          const base64Data = matches[2];

          // Convertir base64 a blob
          const blob = Utilities.newBlob(
            Utilities.base64Decode(base64Data),
            mimeType,
            'material_preparado.jpg'
          );

          // Agregar como inline image
          inlineImages['materialPreparado'] = blob;

          // Referenciar la imagen inline en el HTML
          fotoHtml = `
            <div style="margin: 20px 0; text-align: center;">
              <p style="font-weight: bold; color: #242B59; margin-bottom: 10px;">📷 Material Preparado:</p>
              <img src="cid:materialPreparado" alt="Material Preparado" style="max-width: 100%; max-height: 400px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            </div>
          `;
          Logger.log('Imagen procesada y agregada como inline attachment');
        }
      } catch (imgError) {
        Logger.log('Error al procesar imagen para email: ' + imgError);
        // Continuar sin imagen si hay error
      }
    }

    const emailOptions = {
      to: email,
      subject: '[Laboratorio] ' + subject,
      body: body,
      htmlBody: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #242B59; margin-bottom: 20px;">${subject}</h2>
            <div style="color: #252525; line-height: 1.6; white-space: pre-wrap; font-family: monospace; font-size: 13px;">
              ${htmlBody}
            </div>
            ${fotoHtml}
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #888; font-size: 12px;">Sistema de Gestión de Laboratorio</p>
          </div>
        </div>
      `
    };

    // Agregar CC si está especificado
    if (options.cc) {
      emailOptions.cc = options.cc;
      Logger.log('Email con copia a: ' + options.cc);
    }

    // Agregar inlineImages solo si hay imágenes
    if (Object.keys(inlineImages).length > 0) {
      emailOptions.inlineImages = inlineImages;
    }

    MailApp.sendEmail(emailOptions);

    Logger.log('Email enviado exitosamente');
    return { success: true };
  } catch (error) {
    Logger.log('ERROR al enviar notificación: ' + error);
    Logger.log('Stack trace: ' + error.stack);
    return { success: false, error: error.toString() };
  }
}

// ==================== SISTEMA DE ALTAS Y BAJAS ====================

/**
 * Registra un alta o baja de inventario
 */
function registrarAltaBaja(tipo, elementoId, elementoNombre, cantidad, motivo, usuario, laboratorio) {
  try {
    const ss = getSpreadsheetByLab(laboratorio || LABORATORIOS.STEM);
    if (!ss) {
      return { success: false, error: 'Laboratorio inválido' };
    }

    let sheet = ss.getSheetByName(SHEETS.ALTAS_BAJAS);
    if (!sheet) {
      initializeSheets();
      sheet = ss.getSheetByName(SHEETS.ALTAS_BAJAS);
    }

    const id = Utilities.getUuid();
    const fecha = new Date();

    sheet.appendRow([
      id,
      formatDate(fecha),
      tipo, // 'Alta' o 'Baja'
      elementoId,
      elementoNombre,
      parseInt(cantidad),
      motivo || '',
      usuario
    ]);

    return { success: true };
  } catch (error) {
    Logger.log('Error al registrar alta/baja: ' + error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Obtiene el historial de altas y bajas de un laboratorio
 */
function getAltasBajas(laboratorio) {
  try {
    const ss = getSpreadsheetByLab(laboratorio || LABORATORIOS.STEM);
    if (!ss) {
      return [];
    }

    let sheet = ss.getSheetByName(SHEETS.ALTAS_BAJAS);
    if (!sheet) {
      return [];
    }

    const data = sheet.getDataRange().getValues();
    const registros = [];

    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        registros.push({
          id: data[i][0],
          fecha: data[i][1],
          tipo: data[i][2],
          elementoId: data[i][3],
          elementoNombre: data[i][4],
          cantidad: data[i][5],
          motivo: data[i][6] || '',
          usuario: data[i][7]
        });
      }
    }

    // Ordenar por fecha descendente (más recientes primero)
    registros.sort((a, b) => {
      const fechaA = new Date(a.fecha);
      const fechaB = new Date(b.fecha);
      return fechaB - fechaA;
    });

    return registros;
  } catch (error) {
    Logger.log('Error al obtener altas/bajas: ' + error);
    return [];
  }
}

/**
 * Elimina un registro de alta/baja
 */
function deleteAltaBaja(id, laboratorio) {
  try {
    const ss = getSpreadsheetByLab(laboratorio || LABORATORIOS.STEM);
    if (!ss) {
      return { success: false, error: 'Laboratorio inválido' };
    }

    let sheet = ss.getSheetByName(SHEETS.ALTAS_BAJAS);
    if (!sheet) {
      return { success: false, error: 'Hoja no encontrada' };
    }

    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        sheet.deleteRow(i + 1);
        return { success: true };
      }
    }

    return { success: false, error: 'Registro no encontrado' };
  } catch (error) {
    Logger.log('Error al eliminar alta/baja: ' + error);
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
