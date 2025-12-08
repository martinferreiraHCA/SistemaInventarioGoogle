# Sistema de Gestión de Laboratorio

Sistema completo de gestión de laboratorio con inventario, bitácora, solicitudes de prácticas y gestión de usuarios. Diseñado con Google Apps Script y Google Sheets como base de datos.

## 🎨 Características

- **Diseño Minimalista y Responsive**: Interfaz limpia que funciona en escritorio y móvil
- **Gestión de Inventario**: Registro completo de elementos con fotos, cantidades, estados y 8 categorías de física
- **Importar/Exportar CSV**: Gestión masiva de inventario y bitácora mediante archivos CSV
- **Estadísticas en Tiempo Real**: Panel de métricas con alertas de stock bajo y items en reparación
- **Búsqueda Avanzada**: Filtros por fechas, texto y categorías en bitácora e inventario
- **Sistema de Roles**: Dos roles (Preparador/Admin y Docente) con diferentes permisos
- **Bitácora del Laboratorio**: Registro detallado de actividades con edición y búsqueda avanzada
- **Sistema de Solicitudes**: Los docentes pueden solicitar materiales y el preparador puede gestionarlas
- **Notificaciones por Email**: Automáticas cuando hay nuevas solicitudes o prácticas listas
- **Upload de Imágenes**: Subir fotos de elementos y materiales preparados a Google Drive
- **Cambio de Contraseña**: Los usuarios pueden cambiar su contraseña desde la interfaz
- **Validación de Datos**: Validación completa de formularios con mensajes descriptivos

## 🎨 Paleta de Colores

- **Azul Principal**: `#242B59` - Color principal del sistema
- **Blanco**: `#FFFFFF` - Fondo y texto principal
- **Rojo Claro**: `#E1523D` - Alertas y botones de eliminar
- **Verde Claro**: `#A4B01D` - Confirmaciones y estado activo
- **Negro**: `#252525` - Texto secundario

## 📋 Requisitos

- Cuenta de Google
- Acceso a Google Drive
- Navegador web moderno (Chrome, Firefox, Safari, Edge)

## 🚀 Instalación

### 1. Configurar Google Sheets

El sistema utiliza **dos hojas de cálculo separadas**:

#### A. Hoja de Bitácora
1. Abre la hoja: [Bitácora del Laboratorio](https://docs.google.com/spreadsheets/d/19rvs-kBt9o87d40-8nIFUtv8_KnKXnxPfwegUT9h24A/edit)
2. Haz una copia: **Archivo → Hacer una copia**
3. Anota el ID de tu nueva hoja (está en la URL después de `/d/` y antes de `/edit`)

#### B. Hoja de Inventario
1. Abre la hoja: [Inventario del Laboratorio](https://docs.google.com/spreadsheets/d/1w46H58534iN35C55oZHbs4jUpNc6IGX1_NME5ASVbhE/edit)
2. Haz una copia: **Archivo → Hacer una copia**
3. Anota el ID de tu nueva hoja (está en la URL después de `/d/` y antes de `/edit`)

### 2. Crear el Proyecto de Apps Script

1. En **cualquiera de las dos hojas**, ve a **Extensiones → Apps Script**
2. Borra el código predeterminado
3. Crea dos archivos:

#### Archivo: `Code.gs`
- Copia todo el contenido del archivo `code.gs` de este proyecto
- **IMPORTANTE**: Reemplaza ambos IDs en las líneas 8 y 9 con los IDs de tus hojas

```javascript
const BITACORA_SPREADSHEET_ID = 'ID_DE_TU_HOJA_BITACORA';
const INVENTARIO_SPREADSHEET_ID = 'ID_DE_TU_HOJA_INVENTARIO';
```

#### Archivo: `index.html`
- En el editor de Apps Script, ve a **Archivo → Nuevo → Archivo HTML**
- Nómbralo `index`
- Copia todo el contenido del archivo `index.html` de este proyecto

### 3. Desplegar la Aplicación Web

1. En el editor de Apps Script, haz clic en **Implementar → Nueva implementación**
2. Selecciona **Aplicación web**
3. Configura:
   - **Descripción**: Sistema de Gestión de Laboratorio
   - **Ejecutar como**: Yo (tu email)
   - **Quién tiene acceso**: Cualquier persona
4. Haz clic en **Implementar**
5. Copia la **URL de la aplicación web**
6. Autoriza los permisos cuando se te solicite

### 4. Inicializar el Sistema

1. En el editor de Apps Script, selecciona la función `initializeSheets` en el menú desplegable
2. Haz clic en **Ejecutar**
3. Esto creará automáticamente las hojas necesarias en ambos spreadsheets:
   - **Bitácora Spreadsheet**: Hoja "Bitacora"
   - **Inventario Spreadsheet**: Hojas "Inventario", "Usuarios" y "Solicitudes"
4. También creará usuarios de ejemplo para que puedas probar el sistema

## 👥 Usuarios de Ejemplo

⚠️ **IMPORTANTE**: Los usuarios se crean automáticamente cuando ejecutas la función `initializeSheets()` (paso 4 de la instalación).

El sistema crea dos usuarios predefinidos para que puedas probar:

### Preparador (Admin)
- **Email**: `admin@laboratorio.com`
- **Contraseña**: `admin123`
- **Permisos**: Acceso completo al sistema

### Docente
- **Email**: `docente@laboratorio.com`
- **Contraseña**: `docente123`
- **Permisos**: Ver inventario y crear solicitudes

### ⚠️ Si los usuarios no funcionan:
1. Abre el editor de Apps Script
2. Selecciona la función `initializeSheets` en el menú desplegable superior
3. Haz clic en el botón **Ejecutar** (▶️)
4. Autoriza los permisos si te lo pide
5. Espera a que termine la ejecución (verás "Ejecución completada" abajo)
6. Los usuarios ahora deben funcionar - prueba a hacer login

## 📖 Uso del Sistema

### Para Preparadores (Admin)

#### Gestión de Inventario
1. Accede al menú lateral y selecciona **Inventario**
2. **Ver estadísticas**: En la parte superior verás tarjetas con:
   - Total de elementos
   - Items en funcionamiento
   - Items en reparación
   - Total de unidades
   - Alertas (stock bajo, items en reparación)
3. **Agregar elementos manualmente**: Haz clic en **+ Agregar Elemento**
   - Nombre del elemento
   - Cantidad disponible
   - Estado (Funcionamiento/Reparación)
   - Categoría: Mecánica, Electromagnetismo, Óptica, Termodinámica, Ondas y Acústica, Física Moderna, Electrónica, Otros
   - Descripción opcional
   - Foto del elemento (opcional)
4. **Importar inventario desde CSV**:
   - Haz clic en **⬆ Importar CSV**
   - Selecciona un archivo CSV con formato: `ID,Nombre,Cantidad,Estado,Categoria,Descripcion,Foto`
   - El sistema actualizará elementos existentes o creará nuevos
5. **Exportar inventario a CSV**:
   - Haz clic en **⬇ Exportar CSV**
   - Se descargará un archivo CSV con todo tu inventario
6. Puedes filtrar por categoría y estado usando los selectores
7. Edita o elimina elementos según sea necesario

#### Bitácora
1. Selecciona **Bitácora** en el menú lateral
2. **Búsqueda avanzada**:
   - Campo de texto: Busca en práctica, items, usuario u observaciones
   - Fecha desde/hasta: Filtra por rango de fechas
   - Haz clic en "Buscar" para aplicar filtros
   - Haz clic en "Limpiar" para ver todas las entradas
3. **Crear nueva entrada**:
   - Haz clic en **+ Nueva Entrada**
   - Registra:
     - Fecha de la actividad
     - Práctica preparada
     - Items utilizados
     - Usuario destinatario
     - Observaciones
4. **Editar entradas**: Haz clic en el botón "Editar" en cualquier entrada
5. **Eliminar entradas**: Haz clic en el botón "Eliminar"
6. **Exportar a CSV**: Haz clic en **⬇ Exportar CSV** para descargar toda la bitácora
7. **Importar desde CSV**: Haz clic en **⬆ Importar CSV** para cargar entradas desde un archivo CSV
8. **Entradas automáticas**: Cuando marcas una solicitud como preparada, se crea automáticamente una entrada en la bitácora

#### Gestión de Solicitudes
1. Selecciona **Solicitudes** en el menú lateral
2. Verás todas las solicitudes pendientes y preparadas
3. Para marcar una solicitud como preparada:
   - Haz clic en **Marcar como Preparada**
   - Opcionalmente sube una foto del material preparado
   - Agrega observaciones
   - El docente recibirá un email de notificación

#### Gestión de Usuarios
1. Selecciona **Usuarios** en el menú lateral
2. Haz clic en **+ Nuevo Usuario**
3. Completa:
   - Nombre completo
   - Email
   - Contraseña
   - Rol (Docente o Preparador)
4. Los usuarios podrán iniciar sesión con sus credenciales

### Para Docentes

#### Ver Inventario
1. Accede al menú lateral y selecciona **Inventario**
2. Navega por los elementos disponibles
3. Usa los filtros para buscar por categoría o estado
4. **Nota**: Los docentes solo pueden ver el inventario, no modificarlo

#### Solicitar Materiales
1. Selecciona **Mis Solicitudes** en el menú lateral
2. Haz clic en **+ Nueva Solicitud**
3. Completa el formulario:
   - Nombre de la práctica
   - Fecha de inicio
   - Fecha de fin aproximada
   - Fecha en que necesitas el material
   - Selecciona materiales del inventario (con cantidades)
   - Describe materiales adicionales si es necesario
4. Envía la solicitud
5. Recibirás un email cuando esté preparada

## 📱 Características Responsive

El sistema está completamente optimizado para dispositivos móviles:

- **Menú Lateral Colapsable**: En pantallas pequeñas, el menú se oculta automáticamente
- **Botón de Menú**: Aparece un botón ☰ en móviles para abrir/cerrar el menú
- **Tablas Adaptables**: Las tablas se ajustan al tamaño de la pantalla
- **Modales Responsivos**: Los formularios se adaptan a cualquier tamaño de pantalla

## 🗂️ Estructura de Google Sheets

El sistema utiliza **dos hojas de cálculo separadas** para mejor organización:

### Hoja de Bitácora (BITACORA_SPREADSHEET_ID)
Contiene 1 hoja:

**Bitacora**
- Columnas: ID, Fecha, Practica, Items, Usuario, Observaciones, Preparador
- Almacena todas las entradas de la bitácora del laboratorio

### Hoja de Inventario (INVENTARIO_SPREADSHEET_ID)
Contiene 3 hojas:

**1. Inventario**
- Columnas: ID, Nombre, Cantidad, Estado, Categoria, Descripcion, Foto
- Almacena todos los elementos del inventario

**2. Usuarios**
- Columnas: ID, Nombre, Email, Password, Rol
- Almacena los usuarios del sistema

**3. Solicitudes**
- Columnas: ID, Nombre, FechaInicio, FechaFin, FechaNecesaria, Materiales, MaterialesExtra, Docente, DocenteEmail, Estado, FotoPreparada, ObservacionesPreparador
- Almacena las solicitudes de prácticas

## 📸 Gestión de Imágenes

Las imágenes se almacenan en Google Drive:

1. Se crea automáticamente una carpeta llamada **Fotos_Laboratorio**
2. Las imágenes se convierten de base64 y se suben a Drive
3. Se configuran para ser visibles con el enlace
4. Las URLs se guardan en Google Sheets

## 🔔 Sistema de Notificaciones

El sistema envía emails automáticos cuando:

- Un preparador marca una solicitud como preparada
- Los emails tienen formato HTML con los colores del sistema
- Se envían desde la cuenta de Google asociada al script

## 🎨 Personalización

### Cambiar Colores

Edita las variables CSS en `index.html` (líneas 14-20):

```css
:root {
    --azul-principal: #242B59;
    --rojo-claro: #E1523D;
    --negro: #252525;
    --verde-claro: #A4B01D;
    --blanco: #FFFFFF;
    --gris-claro: #F5F5F5;
}
```

### Modificar Categorías

En `index.html`, busca los selectores de categoría y agrega/modifica opciones:

```html
<select id="elementoCategoria" required>
    <option value="Mecánica">Mecánica</option>
    <option value="Electromagnetismo">Electromagnetismo</option>
    <option value="Termodinámica">Termodinámica</option>
    <option value="Otros">Otros</option>
    <!-- Agrega más categorías aquí -->
</select>
```

## 🐛 Solución de Problemas

### Error: "No se puede conectar con Google Sheets"
- Verifica que ambos IDs (`BITACORA_SPREADSHEET_ID` y `INVENTARIO_SPREADSHEET_ID`) en `code.gs` sean correctos
- Asegúrate de haber autorizado los permisos del script para acceder a ambas hojas
- Confirma que has hecho copias de ambas hojas de cálculo (Bitácora e Inventario)

### Las imágenes no se cargan
- Verifica que los archivos en Drive tengan permisos de "Cualquiera con el enlace"
- Revisa que la carpeta `Fotos_Laboratorio` existe en tu Drive

### No recibo notificaciones por email
- Verifica que el email del docente esté correcto en la solicitud
- Revisa la carpeta de spam
- Asegúrate de que el script tenga permisos para enviar emails

### Error al desplegar
- Asegúrate de haber guardado todos los archivos antes de desplegar
- Verifica que no haya errores de sintaxis en el código
- Revisa el registro de ejecución en Apps Script para ver errores detallados

## 📝 Mantenimiento

### Hacer Backup
1. **Google Sheets**: Archivo → Descargar → XLSX
2. **Apps Script**: En el editor, Archivo → Versiones → Ver versiones

### Actualizar el Sistema
1. Realiza cambios en los archivos `code.gs` o `index.html`
2. Guarda los cambios
3. Crea una nueva implementación o actualiza la existente
4. La nueva versión estará disponible en la misma URL

## 🔒 Seguridad

**IMPORTANTE**: Este sistema almacena contraseñas en texto plano en Google Sheets. Para uso en producción, considera:

- Implementar hash de contraseñas
- Usar autenticación de Google OAuth
- Restringir acceso a la hoja de cálculo
- Implementar logs de auditoría

## 🤝 Contribuciones

Este proyecto es de código abierto. Si encuentras errores o tienes sugerencias:

1. Reporta issues
2. Propón mejoras
3. Comparte tus personalizaciones

## 📄 Licencia

Este proyecto es de uso libre para fines educativos y de investigación.

## 👨‍💻 Autor

Sistema desarrollado para la gestión eficiente de laboratorios educativos.

---

**¿Necesitas ayuda?** Revisa la documentación de [Google Apps Script](https://developers.google.com/apps-script) para más información sobre el desarrollo y personalización.
