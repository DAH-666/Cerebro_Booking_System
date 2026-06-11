Markdown
# 🎛️ CEREBRO — SYS.BOOKING v3.0

**Serverless Web App para la Gestión de Estudios de Grabación de Alto Rendimiento**

![Demo Principal de Cerebro](assets/demo-main.gif)

## 📝 Sobre el Proyecto

Cerebro es una aplicación web B2B diseñada para centralizar las reservas de salas en entornos de producción musical complejos. 

El objetivo principal de este proyecto era eliminar la necesidad de mantener servidores dedicados o bases de datos tradicionales. Para lograrlo, utiliza la infraestructura de Google Workspace como un Backend-as-a-Service (BaaS). Mediante Google Apps Script (GAS), el sistema sincroniza datos bidireccionalmente, evita cruces de horarios y gestiona aprobaciones fuera de jornada con alertas directas por WhatsApp y correo electrónico.

## 🛠️ Stack Tecnológico

**Frontend (SPA):**
* HTML5 & CSS Custom Properties
* Tailwind CSS & FontAwesome
* Vanilla JavaScript (ES6+, Fetch API)
* Google Identity Services SDK

**Serverless Backend:**
* Google Apps Script (API Web App / Enrutador doPost y doGet)
* Google Calendar API (Base de datos principal)
* GmailApp API (Notificaciones)
* CallMeBot API (Gateway para push notifications en WhatsApp)

## 🧠 Core Features

### 1. Autenticación y Control de Acceso
Integra OAuth 2.0 (Google Identity Services) con un filtro de dominios en tiempo real. Solo los usuarios con correos pertenecientes a sellos o empresas preaprobadas en el backend pueden renderizar la interfaz y solicitar reservas.

### 2. Motor Anti-Solapamientos
Para evitar las dobles reservas, el frontend consulta la API de Calendar limitando la búsqueda a las horas solicitadas (`timeMin` y `timeMax`). Si detecta un conflicto, la transacción se bloquea en milisegundos antes de enviar nada al servidor.

### 3. Lógica de Cuotas por Discográfica
El sistema cuenta con un controlador de concurrencia. Evalúa cuántos estudios tiene reservados un mismo sello en un día específico y aplica límites de uso dependiendo de los acuerdos comerciales configurados.

### 4. Alertas Asíncronas (WhatsApp & Email)
Las reservas dentro del horario estándar (L-V, 10h-22h) se procesan automáticamente. Si un proyecto requiere trabajar de madrugada o en fin de semana, el sistema dispara un webhook. A través de la API de CallMeBot, el Studio Manager recibe un mensaje de WhatsApp con los datos de la sesión y un enlace único (UUID) para aprobar o denegar la solicitud desde el móvil.

### 5. Interfaz "Teenage Engineering"
El frontend huye del diseño corporativo clásico. Utiliza una UI brutalista inspirada en el hardware de sintetizadores (botones mecánicos, etiquetas de esquemas eléctricos) optimizada por hardware mediante transformaciones CSS3 para mantener 60 FPS fluidos.

## 🔄 Flujo de Usuario

```text
[ Usuario ] ──► [ Auth OAuth 2.0 ] ──► [ Filtro de Dominio ] ──► [ Formulario ]
                                                                      │
[ Aprobación Automática ] ◄── [ Validador Lógico (GAS) ] ◄────────────┘
         │
         ├─── (Horario Estándar) ───────► [ Reserva Confirmada en Calendar ]
         │
         └─── (Horarios Especiales) ────► [ Generación de UUID ]
                                                  │
                                   ┌──────────────┴──────────────┐
                                   ▼                             ▼
                            [ Alerta Email ]            [ Alerta WhatsApp ]
                                   │                             │
                                   └──────────────┬──────────────┘
                                                  ▼
                                      [ Panel de Aprobación ]
                                                  │
                                         (Aprobar / Denegar)
                                                  │
                                     [ Actualización en Calendar ]
📦 Despliegue Local (Setup)
1. Configuración del Backend (Google Apps Script)

Crea un proyecto en GAS y pega el código de backend_script.js.

Modifica las variables globales con tus datos:

JavaScript
var PORTAL_URL = '[https://tudominio.com/index.html](https://tudominio.com/index.html)';
var CALENDAR_ID = 'tu_calendario@tuempresa.com';
var MAIN_STUDIO_EMAIL = 'admin@tuempresa.com';
2. Integración de WhatsApp (CallMeBot)

Añade el número de CallMeBot a tus contactos y envía el mensaje: I allow callmebot to send me messages.

Recibirás una API Key. Añádela a tu script:

JavaScript
var WHATSAPP_PHONE = '34XXXXXXXXX';
var WHATSAPP_APIKEY = 'XXXXXX';
3. Autenticación de Google Cloud

En GCP, crea una credencial OAuth 2.0 (Client ID para aplicación web).

Añade la URL de tu hosting en los Orígenes Autorizados.

4. Conexión y Publicación

Publica el script de GAS como Aplicación Web (acceso para "Cualquier persona").

Copia la URL terminada en /exec y tu GOOGLE_CLIENT_ID en los archivos script.js, modificar.js y approval.js del frontend.

Despliega la carpeta en tu proveedor de hosting estático favorito (Vercel, GitHub Pages, etc.).

🔒 Licencia
Distribuido bajo la licencia MIT de código abierto para fines de portfolio.