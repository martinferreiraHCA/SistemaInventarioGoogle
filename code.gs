/**
 * Sistema de Gestión de Laboratorio
 * Backend en Google Apps Script
 *
 * Spreadsheet: https://docs.google.com/spreadsheets/d/1w46H58534iN35C55oZHbs4jUpNc6IGX1_NME5ASVbhE/edit
 */

const SPREADSHEET_ID = '1w46H58534iN35C55oZHbs4jUpNc6IGX1_NME5ASVbhE';
const FOLDER_ID = ''; // ID de carpeta de Drive para fotos (se creará automáticamente)

// Nombres de las hojas
const SHEETS = {
  INVENTARIO: 'Inventario',
  USUARIOS: 'Usuarios',
  SOLICITUDES: 'Solicitudes',
  BITACORA: 'Bitacora'
};

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
 * Inicializa las hojas si no existen
 */
function initializeSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // Inventario
  let inventarioSheet = ss.getSheetByName(SHEETS.INVENTARIO);
  if (!inventarioSheet) {
    inventarioSheet = ss.insertSheet(SHEETS.INVENTARIO);
    inventarioSheet.getRange(1, 1, 1, 9).setValues([[
      'ID', 'Nombre', 'Cantidad', 'Estado', 'Categoria', 'Descripcion', 'FotoURL', 'FechaCreacion', 'UltimaModificacion'
    ]]);
    inventarioSheet.getRange(1, 1, 1, 9).setFontWeight('bold');
  }

  // Usuarios
  let usuariosSheet = ss.getSheetByName(SHEETS.USUARIOS);
  if (!usuariosSheet) {
    usuariosSheet = ss.insertSheet(SHEETS.USUARIOS);
    usuariosSheet.getRange(1, 1, 1, 6).setValues([[
      'ID', 'Email', 'Nombre', 'Rol', 'FechaCreacion', 'Activo'
    ]]);
    usuariosSheet.getRange(1, 1, 1, 6).setFontWeight('bold');
    // Agregar usuario admin por defecto
    const adminId = Utilities.getUuid();
    usuariosSheet.appendRow([adminId, Session.getActiveUser().getEmail() || 'admin@lab.com', 'Administrador', 'preparador', new Date(), true]);
  }

  // Solicitudes
  let solicitudesSheet = ss.getSheetByName(SHEETS.SOLICITUDES);
  if (!solicitudesSheet) {
    solicitudesSheet = ss.insertSheet(SHEETS.SOLICITUDES);
    solicitudesSheet.getRange(1, 1, 1, 12).setValues([[
      'ID', 'DocenteEmail', 'DocenteNombre', 'Materiales', 'Descripcion', 'FechaInicio', 'FechaFin', 'FechaNecesita', 'Estado', 'FotoPreparacion', 'FechaPreparacion', 'PreparadorEmail'
    ]]);
    solicitudesSheet.getRange(1, 1, 1, 12).setFontWeight('bold');
  }

  // Bitácora
  let bitacoraSheet = ss.getSheetByName(SHEETS.BITACORA);
  if (!bitacoraSheet) {
    bitacoraSheet = ss.insertSheet(SHEETS.BITACORA);
    bitacoraSheet.getRange(1, 1, 1, 7).setValues([[
      'ID', 'Fecha', 'PreparadorEmail', 'Actividad', 'Items', 'Usuario', 'Notas'
    ]]);
    bitacoraSheet.getRange(1, 1, 1, 7).setFontWeight('bold');
  }

  return { success: true, message: 'Hojas inicializadas correctamente' };
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
 * Sube una imagen a Drive
 */
function uploadImage(base64Data, fileName) {
  try {
    const folder = getOrCreatePhotoFolder();
    const contentType = base64Data.match(/data:([^;]+);/)[1];
    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Content), contentType, fileName);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return { success: true, url: file.getUrl(), id: file.getId() };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// ==================== USUARIOS ====================

/**
 * Obtiene el usuario actual
 */
function getCurrentUser() {
  const email = Session.getActiveUser().getEmail();
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.USUARIOS);

  if (!sheet) {
    initializeSheets();
    return getCurrentUser();
  }

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === email && data[i][5] === true) {
      return {
        success: true,
        user: {
          id: data[i][0],
          email: data[i][1],
          nombre: data[i][2],
          rol: data[i][3],
          fechaCreacion: data[i][4],
          activo: data[i][5]
        }
      };
    }
  }

  // Si no hay usuario, devolver el primero activo (para pruebas)
  for (let i = 1; i < data.length; i++) {
    if (data[i][5] === true) {
      return {
        success: true,
        user: {
          id: data[i][0],
          email: data[i][1],
          nombre: data[i][2],
          rol: data[i][3],
          fechaCreacion: data[i][4],
          activo: data[i][5]
        }
      };
    }
  }

  return { success: false, error: 'Usuario no encontrado o no autorizado' };
}

/**
 * Obtiene todos los usuarios
 */
function getUsuarios() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEETS.USUARIOS);

    if (!sheet) {
      initializeSheets();
      sheet = ss.getSheetByName(SHEETS.USUARIOS);
    }

    const data = sheet.getDataRange().getValues();
    const usuarios = [];

    for (let i = 1; i < data.length; i++) {
      usuarios.push({
        id: data[i][0],
        email: data[i][1],
        nombre: data[i][2],
        rol: data[i][3],
        fechaCreacion: data[i][4],
        activo: data[i][5]
      });
    }

    return { success: true, usuarios: usuarios };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Agrega un nuevo usuario
 */
function addUsuario(email, nombre, rol) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.USUARIOS);

    // Verificar si el email ya existe
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === email) {
        return { success: false, error: 'El email ya está registrado' };
      }
    }

    const id = Utilities.getUuid();
    sheet.appendRow([id, email, nombre, rol, new Date(), true]);

    return { success: true, id: id };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Actualiza un usuario
 */
function updateUsuario(id, email, nombre, rol, activo) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.USUARIOS);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        sheet.getRange(i + 1, 2, 1, 4).setValues([[email, nombre, rol, activo]]);
        return { success: true };
      }
    }

    return { success: false, error: 'Usuario no encontrado' };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Elimina un usuario
 */
function deleteUsuario(id) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
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
    return { success: false, error: error.toString() };
  }
}

// ==================== INVENTARIO ====================

/**
 * Obtiene todos los elementos del inventario
 */
function getInventario() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEETS.INVENTARIO);

    if (!sheet) {
      initializeSheets();
      sheet = ss.getSheetByName(SHEETS.INVENTARIO);
    }

    const data = sheet.getDataRange().getValues();
    const elementos = [];

    for (let i = 1; i < data.length; i++) {
      elementos.push({
        id: data[i][0],
        nombre: data[i][1],
        cantidad: data[i][2],
        estado: data[i][3],
        categoria: data[i][4],
        descripcion: data[i][5],
        fotoURL: data[i][6],
        fechaCreacion: data[i][7],
        ultimaModificacion: data[i][8]
      });
    }

    return { success: true, elementos: elementos };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Agrega un nuevo elemento al inventario
 */
function addElemento(nombre, cantidad, estado, categoria, descripcion, fotoBase64) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.INVENTARIO);

    let fotoURL = '';
    if (fotoBase64) {
      const fileName = 'elemento_' + Date.now() + '.jpg';
      const uploadResult = uploadImage(fotoBase64, fileName);
      if (uploadResult.success) {
        fotoURL = uploadResult.url;
      }
    }

    const id = Utilities.getUuid();
    const now = new Date();
    sheet.appendRow([id, nombre, cantidad, estado, categoria, descripcion, fotoURL, now, now]);

    return { success: true, id: id, fotoURL: fotoURL };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Actualiza un elemento del inventario
 */
function updateElemento(id, nombre, cantidad, estado, categoria, descripcion, fotoBase64) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.INVENTARIO);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        let fotoURL = data[i][6];

        if (fotoBase64 && fotoBase64.startsWith('data:')) {
          const fileName = 'elemento_' + Date.now() + '.jpg';
          const uploadResult = uploadImage(fotoBase64, fileName);
          if (uploadResult.success) {
            fotoURL = uploadResult.url;
          }
        }

        sheet.getRange(i + 1, 2, 1, 8).setValues([[
          nombre, cantidad, estado, categoria, descripcion, fotoURL, data[i][7], new Date()
        ]]);

        return { success: true, fotoURL: fotoURL };
      }
    }

    return { success: false, error: 'Elemento no encontrado' };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Elimina un elemento del inventario
 */
function deleteElemento(id) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
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
    return { success: false, error: error.toString() };
  }
}

// ==================== SOLICITUDES ====================

/**
 * Obtiene todas las solicitudes
 */
function getSolicitudes(filtroEstado) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEETS.SOLICITUDES);

    if (!sheet) {
      initializeSheets();
      sheet = ss.getSheetByName(SHEETS.SOLICITUDES);
    }

    const data = sheet.getDataRange().getValues();
    const solicitudes = [];

    for (let i = 1; i < data.length; i++) {
      const solicitud = {
        id: data[i][0],
        docenteEmail: data[i][1],
        docenteNombre: data[i][2],
        materiales: data[i][3],
        descripcion: data[i][4],
        fechaInicio: data[i][5],
        fechaFin: data[i][6],
        fechaNecesita: data[i][7],
        estado: data[i][8],
        fotoPreparacion: data[i][9],
        fechaPreparacion: data[i][10],
        preparadorEmail: data[i][11]
      };

      if (!filtroEstado || solicitud.estado === filtroEstado) {
        solicitudes.push(solicitud);
      }
    }

    return { success: true, solicitudes: solicitudes };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Obtiene solicitudes de un docente específico
 */
function getSolicitudesDocente(email) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.SOLICITUDES);
    const data = sheet.getDataRange().getValues();
    const solicitudes = [];

    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === email) {
        solicitudes.push({
          id: data[i][0],
          docenteEmail: data[i][1],
          docenteNombre: data[i][2],
          materiales: data[i][3],
          descripcion: data[i][4],
          fechaInicio: data[i][5],
          fechaFin: data[i][6],
          fechaNecesita: data[i][7],
          estado: data[i][8],
          fotoPreparacion: data[i][9],
          fechaPreparacion: data[i][10],
          preparadorEmail: data[i][11]
        });
      }
    }

    return { success: true, solicitudes: solicitudes };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Crea una nueva solicitud de práctica
 */
function addSolicitud(docenteEmail, docenteNombre, materiales, descripcion, fechaInicio, fechaFin, fechaNecesita) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.SOLICITUDES);

    const id = Utilities.getUuid();
    sheet.appendRow([
      id, docenteEmail, docenteNombre, materiales, descripcion,
      fechaInicio, fechaFin, fechaNecesita, 'pendiente', '', '', ''
    ]);

    return { success: true, id: id };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Marca una solicitud como preparada
 */
function marcarSolicitudPreparada(id, preparadorEmail, fotoBase64) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.SOLICITUDES);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        let fotoURL = '';
        if (fotoBase64) {
          const fileName = 'preparacion_' + Date.now() + '.jpg';
          const uploadResult = uploadImage(fotoBase64, fileName);
          if (uploadResult.success) {
            fotoURL = uploadResult.url;
          }
        }

        sheet.getRange(i + 1, 9, 1, 4).setValues([['preparada', fotoURL, new Date(), preparadorEmail]]);

        // Enviar notificación al docente
        const docenteEmail = data[i][1];
        sendNotification(docenteEmail, 'Práctica lista',
          'Su solicitud de práctica ha sido preparada y está lista para retirar.');

        return { success: true, fotoURL: fotoURL };
      }
    }

    return { success: false, error: 'Solicitud no encontrada' };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Actualiza el estado de una solicitud
 */
function updateSolicitudEstado(id, estado) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.SOLICITUDES);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        sheet.getRange(i + 1, 9).setValue(estado);
        return { success: true };
      }
    }

    return { success: false, error: 'Solicitud no encontrada' };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// ==================== BITÁCORA ====================

/**
 * Obtiene todas las entradas de la bitácora
 */
function getBitacora() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEETS.BITACORA);

    if (!sheet) {
      initializeSheets();
      sheet = ss.getSheetByName(SHEETS.BITACORA);
    }

    const data = sheet.getDataRange().getValues();
    const entradas = [];

    for (let i = 1; i < data.length; i++) {
      entradas.push({
        id: data[i][0],
        fecha: data[i][1],
        preparadorEmail: data[i][2],
        actividad: data[i][3],
        items: data[i][4],
        usuario: data[i][5],
        notas: data[i][6]
      });
    }

    // Ordenar por fecha descendente
    entradas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    return { success: true, entradas: entradas };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Agrega una entrada a la bitácora
 */
function addBitacora(preparadorEmail, actividad, items, usuario, notas) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.BITACORA);

    const id = Utilities.getUuid();
    sheet.appendRow([id, new Date(), preparadorEmail, actividad, items, usuario, notas]);

    return { success: true, id: id };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Elimina una entrada de la bitácora
 */
function deleteBitacora(id) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
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
    return { success: false, error: error.toString() };
  }
}

// ==================== ESTADÍSTICAS ====================

/**
 * Obtiene estadísticas del laboratorio
 */
function getEstadisticas() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    // Inventario
    const invSheet = ss.getSheetByName(SHEETS.INVENTARIO);
    const invData = invSheet ? invSheet.getDataRange().getValues() : [];
    const totalElementos = Math.max(0, invData.length - 1);

    let enFuncionamiento = 0;
    let enReparacion = 0;
    const categorias = {};

    for (let i = 1; i < invData.length; i++) {
      if (invData[i][3] === 'funcionamiento') enFuncionamiento++;
      if (invData[i][3] === 'reparacion') enReparacion++;
      const cat = invData[i][4] || 'Sin categoría';
      categorias[cat] = (categorias[cat] || 0) + 1;
    }

    // Solicitudes
    const solSheet = ss.getSheetByName(SHEETS.SOLICITUDES);
    const solData = solSheet ? solSheet.getDataRange().getValues() : [];
    let solicitudesPendientes = 0;
    let solicitudesPreparadas = 0;

    for (let i = 1; i < solData.length; i++) {
      if (solData[i][8] === 'pendiente') solicitudesPendientes++;
      if (solData[i][8] === 'preparada') solicitudesPreparadas++;
    }

    return {
      success: true,
      estadisticas: {
        totalElementos,
        enFuncionamiento,
        enReparacion,
        categorias,
        solicitudesPendientes,
        solicitudesPreparadas
      }
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}
