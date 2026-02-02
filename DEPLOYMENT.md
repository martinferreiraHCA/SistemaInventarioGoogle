# 🚀 Guía de Despliegue - Sistema de Gestión de Laboratorio

## 📋 Requisitos Previos

- Cuenta de Google
- Acceso a Google Apps Script
- Dos spreadsheets creados (STEM y Bio-Química)

## 🔧 Configuración Inicial

### 1. Crear el Proyecto en Google Apps Script

1. Ve a [script.google.com](https://script.google.com)
2. Clic en **"Nuevo proyecto"**
3. Nombra el proyecto: **"Sistema Gestión Laboratorio"**

### 2. Agregar los Archivos

1. Renombra `Code.gs` como desees
2. Agrega el archivo `index.html`:
   - Clic en **"+"** → **"HTML"**
   - Nombra: `index`
   - Pega el contenido de `index.html`
3. Pega el contenido de `code.gs` en el archivo principal

### 3. Configurar IDs de los Spreadsheets

En `code.gs`, líneas 12-13, reemplaza con tus IDs:

```javascript
const INVENTARIO_STEM_SPREADSHEET_ID = 'TU_ID_SPREADSHEET_STEM';
const INVENTARIO_BIOQUIMICA_SPREADSHEET_ID = 'TU_ID_SPREADSHEET_BIOQUIMICA';
```

**¿Cómo obtener el ID?**
- Abre tu spreadsheet
- La URL es: `https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit`
- Copia solo el ID (entre `/d/` y `/edit`)

### 4. Inicializar las Hojas

1. En el editor de Apps Script, ejecuta la función `initializeSheets()`
2. Autoriza los permisos cuando se solicite
3. Esto creará todas las hojas necesarias en ambos spreadsheets

## 🌐 Despliegue como Web App

### Paso 1: Configurar el Despliegue

1. En el editor, clic en **"Implementar"** → **"Nueva implementación"**
2. Clic en el icono de engranaje ⚙️ → **"Aplicación web"**
3. Configura:
   - **Descripción**: "Sistema de Gestión de Laboratorio"
   - **Ejecutar como**: **"Yo"** (tu cuenta)
   - **Quién tiene acceso**: Selecciona según tu caso:

#### 🔐 Opciones de Acceso

##### Opción A: Para Google Workspace (Recomendada - Sin mensaje "Unverified")

```
Quién tiene acceso: Cualquier usuario de [tu-dominio.com]
```

**Ventajas**:
- ✅ No muestra mensaje "Unverified"
- ✅ Autenticación automática con cuentas del dominio
- ✅ No requiere aprobación de cada usuario
- ✅ Más seguro y profesional

**Requisitos**:
- Tener Google Workspace (antes G Suite)
- Todos los usuarios deben tener email de tu dominio (@tu-escuela.edu)

##### Opción B: Para Cuentas Personales de Google

```
Quién tiene acceso: Cualquier usuario con una Cuenta de Google
```

**Nota importante**:
- ⚠️ Mostrará mensaje "Unverified" la primera vez
- Los usuarios deben hacer clic en "Avanzado" → "Ir a Sistema de gestión de laboratorios (no seguro)"
- Solo es necesario hacerlo una vez por usuario

##### Opción C: Para Usuarios Específicos (Más Restrictivo)

```
Quién tiene acceso: Solo yo
```

- Solo tú puedes acceder
- Útil para testing inicial

### Paso 2: Implementar

4. Clic en **"Implementar"**
5. Copia la **URL de la aplicación web**
6. Esta es la URL que compartirás con los usuarios

## 🔒 Eliminar el Mensaje "Unverified"

### Si Tienes Google Workspace (Recomendado)

1. **Desplegar como aplicación interna**:
   - Seguir "Opción A" arriba
   - Configurar "Quién tiene acceso: Cualquier usuario de [tu-dominio]"

2. **Ventajas**:
   - Sin mensaje "Unverified"
   - Sin necesidad de verificación de Google
   - Autenticación transparente para usuarios del dominio

### Si Usas Cuentas Personales de Google

Tienes 3 opciones:

#### Opción 1: Verificar la Aplicación (Proceso Largo)

1. Ir a [Google Cloud Console](https://console.cloud.google.com)
2. Seleccionar el proyecto asociado
3. Configurar **OAuth consent screen**
4. Enviar para verificación de Google
5. **Tiempo**: 4-6 semanas de revisión
6. **Requiere**: Política de privacidad, términos de servicio

#### Opción 2: Mantener en Modo Testing (Recomendado para Uso Interno)

1. Configurar OAuth consent screen como "Testing"
2. Agregar usuarios de prueba (máximo 100)
3. Estos usuarios no verán mensaje "Unverified"
4. **Limitación**: Solo usuarios agregados explícitamente

#### Opción 3: Instruir a Usuarios (Más Simple)

1. Los usuarios verán: "Esta aplicación no está verificada"
2. Instrucciones para usuarios:
   - Clic en **"Avanzado"**
   - Clic en **"Ir a Sistema de gestión de laboratorios (no seguro)"**
   - Permitir permisos
   - ✅ Solo necesario la primera vez

## 👥 Gestión de Usuarios

### Cómo Funciona la Autenticación

El sistema usa **autenticación nativa de Google**:
- Los usuarios inician sesión con su cuenta de Google automáticamente
- No hay contraseñas que gestionar
- El sistema identifica al usuario por su email de Google

### Agregar/Editar Usuarios

1. Abre el spreadsheet STEM (donde están los usuarios centralizados)
2. Ve a la hoja **"Usuarios"**
3. Agrega una fila con:
   - **ID**: Generar UUID (o cualquier string único)
   - **Nombre**: Nombre del usuario
   - **Email**: Email de Google del usuario (importante: debe coincidir con su cuenta de Google)
   - **Password**: Dejar en blanco (ya no se usa)
   - **Rol**: `Admin`, `Preparador`, o `Docente`
   - **Laboratorios**: `STEM`, `Bio-Química`, o `STEM,Bio-Química` (separados por coma para múltiples)

### Auto-Registro

Si un usuario abre la web app y **NO está en la tabla de Usuarios**:
- Se crea automáticamente como **Docente**
- Asignado al laboratorio **STEM** por defecto
- Se le muestra un mensaje: "¡Bienvenido! Se ha creado tu usuario como Docente. Contacta al administrador para cambiar tu rol."

El administrador puede luego editar el rol y laboratorios asignados en el spreadsheet.

## 🔄 Actualizar el Sistema

Cuando hagas cambios en el código:

1. Guarda los cambios en el editor
2. **No es necesario crear nueva implementación** si usas la misma versión
3. Los cambios se reflejarán automáticamente

Si quieres versiones separadas:
1. Clic en **"Implementar"** → **"Nueva implementación"**
2. Esto creará una URL separada para testing

## 🐛 Troubleshooting

### "No se pudo obtener el email del usuario"

**Causa**: El usuario no está autenticado con Google o los permisos no están configurados correctamente.

**Solución**:
1. Verificar que el despliegue tiene "Ejecutar como: Yo"
2. Verificar que "Quién tiene acceso" está configurado correctamente
3. El usuario debe estar autenticado en una cuenta de Google

### "Error: No autorizado"

**Causa**: El usuario no dio permisos a la aplicación.

**Solución**:
1. Volver a autorizar la aplicación
2. En el editor: **Ejecutar** → **initializeSheets()** → Autorizar

### Mensaje "Unverified" No Desaparece

**Solución para Google Workspace**:
- Asegúrate de que "Quién tiene acceso" está en "Cualquier usuario de [tu-dominio]"
- Los usuarios deben usar su email del dominio

**Solución para Cuentas Personales**:
- Es normal, cada usuario debe aceptar una vez
- O seguir proceso de verificación de Google (4-6 semanas)

## 📞 Soporte

Si tienes problemas:
1. Verifica los logs en el editor: **Ver** → **Registros**
2. Verifica la consola del navegador (F12) en el frontend
3. Asegúrate de que los IDs de spreadsheets son correctos

## 📝 Notas Importantes

- ✅ Los usuarios **NO necesitan contraseñas**
- ✅ La autenticación es automática con Google
- ✅ Los datos están protegidos por permisos de Google
- ✅ El sistema funciona 100% dentro del ecosistema de Google
- ⚠️ Cada usuario debe tener una cuenta de Google válida
- ⚠️ El email en la tabla Usuarios **debe coincidir** con el email de Google del usuario
