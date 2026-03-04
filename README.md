# Trenfe FrontEnd

Aplicación web pública de Trenfe (Fresh 2 + Vite) con pasarela API en `main.ts`
hacia el backend.

## Estado actual

- `deno check main.ts`: OK.
- Incluye flujo de login/registro, noticias, tickets, tracking y chatbot.

## Stack

- Fresh 2
- Preact + Islands
- Vite

## Estructura

- `main.ts`: endpoints `/api/*` (proxy/orquestación).
- `routes/`: páginas web (home, auth, perfil, noticias, tickets, track).
- `components/` e `islands/`: UI y comportamiento interactivo.
- `assets/` y `static/`: estilos y recursos.

## Variables de entorno

```env
GEMINI_API_KEY=
```

## Ejecución

```bash
deno task dev
```

Build + run:

```bash
deno task build
deno task start
```

## Endpoints API locales (`main.ts`)

### Auth / usuario

- `POST /api/login`
- `GET /api/oauth/google/client-id`
- `POST /api/login/google`
- `POST /api/register`
- `POST /api/token`
- `POST /api/user`

### Noticias / tickets / compras / tracking

- `GET /api/news`
- `GET /api/tickets`
- `GET /api/ticket/:ticketid`
- `POST /api/tickets` (lookup por body)
- `POST /api/news` (detalle por id)
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
- `/tickets`, `/tickets/:id`, `/tickets/success/:id`
- `/track` y `/track/:id`

## Notas

- La app consume `Trenfe_BackEnd` para negocio principal.
- `POST /api/buy` valida cantidad y token antes de enviar a backend.
