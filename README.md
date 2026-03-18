# Trenfe FrontEnd

Aplicacion web publica de Trenfe construida con Fresh 2 + Vite. Este proyecto
expone la experiencia de usuario final y actua como capa intermedia hacia
`Trenfe_BackEnd` mediante endpoints locales en `main.ts`.

## Estado actual

- Flujo completo de autenticacion, noticias, compra de tickets y perfil.
- Seguimiento en tiempo real de trenes con mapa interactivo.
- Chatbot de IA conectado a Gemini y alimentado con DB incluyendo datos usuario si esta autenticado.
- Compra con Stripe Checkout.

## Nuevas caracteristicas destacadas

- Medidas de seguridad en el acceso y consumo de APIs: validacion de parametros,
  control de estados y mensajes de error orientados a bloqueo de abuso desde
  frontend.
- Tracking ferroviario
- Chatbot IA: widget flotante con historial de conversacion y respuestas
  basadas en datos del backend.
- Compras con Stripe: `POST /api/buy` valida sesion, cantidad y ticket antes de
  crear el checkout.
- Integracion con QR por correo: tras el pago correcto el backend genera un QR y
  lo envia por SMTP al usuario, por lo que el frontend expone las rutas de exito
  y cancelacion del flujo.

## Stack

- Fresh 2
- Preact + Islands
- Leaflet
- Gemini API 
- Stripe Checkout

## Estructura

- `main.ts`: endpoints `/api/*`, proxy al backend y orquestacion del chatbot.
- `routes/`: paginas publicas (home, auth, noticias, tickets, tracking, perfil).
- `components/` e `islands/`: UI renderizada e interactividad cliente.
- `assets/` y `static/`: estilos, imagenes y recursos.

## Variables de entorno

```env
GEMINI_API_KEY=
ID_OAUTH2=
SECRET_OAUTH2=
```

Notas:

- `BACKEND_URL` se puede configurar para apuntar a otra instancia del backend.
- `GOOGLE_OAUTH_CLIENT_ID` e `ID_OAUTH2` se usan para login con Google.

## Ejecucion

```bash
deno task build
deno task start
```

## Endpoints API locales (`main.ts`)

### Auth y usuario

- `POST /api/login`
- `GET /api/oauth/google/client-id`
- `POST /api/login/google`
- `POST /api/register`
- `POST /api/token`
- `POST /api/user`

### Noticias y tickets

- `GET /api/news`
- `GET /api/tickets`
- `GET /api/ticket/:ticketid`
- `POST /api/tickets`
- `POST /api/news`

### Compra y tracking

- `POST /api/buy`
- `GET /api/track/:ticketid`

### Chatbot

- `POST /api/chatbot`

## Rutas web

- `/`
- `/login`
- `/register`
- `/profile`
- `/news` y `/news/:id`
- `/tickets`, `/tickets/:id`, `/tickets/success/:id`, `/tickets/fail/:id`
- `/track` y `/track/:id`

## Notas

- La politica de cache en `/api` cachea solo lecturas de noticias,
  tickets y tracking.
- El frontend no procesa pagos ni QR directamente; delega esas tareas en el
  backend para mantener la logica.
