# Trenfe Plataforma Unificada (Frontend + Backend + Intranet)

Documentacion tecnica unificada del ecosistema Trenfe.
Formato basado en la estructura del README de backend.

## Estructura General del Proyecto

```
/Users/sergioom9/Documents/Universidad/TRENFE
├── Trenfe_BackEnd/              # API REST (Express + MongoDB con Deno)
├── Trenfe_FrontEnd/             # Web publica (Fresh 2 + Vite)
└── Trenfe_Intranet/             # Panel admin (Fresh 2 + Vite)
```

---

## Frontend (Web publica)

### Estructura del Proyecto

```
Trenfe_FrontEnd/
├── main.ts                     # API gateway local + middlewares auth/cache + chatbot
├── routes/
│   ├── _app.tsx                # Shell HTML global
│   ├── _layout.tsx             # Header/Footer global
│   ├── index.tsx               # Home
│   ├── (main)/
│   │   ├── login.tsx           # Login (publica)
│   │   └── register.tsx        # Registro (publica)
│   ├── (me)/
│   │   └── profile.tsx         # Perfil (protegida)
│   ├── news/                   # Listado y detalle de noticias
│   ├── tickets/                # Listado, detalle y confirmacion de compra
│   └── track/                  # Formulario y detalle de tracking
├── components/                 # Componentes UI
├── islands/                    # Islas interactivas
├── assets/                     # CSS e imagenes
└── static/                     # Assets publicos
```

### Instalacion

1. Entra en `Trenfe_FrontEnd`
2. Arranca en desarrollo:

```bash
deno task dev
```

3. Build y arranque de produccion:

```bash
deno task build
deno task start
```

### Variables de Entorno

```env
GEMINI_API_KEY=tu_api_key
```

| Variable         | Descripcion |
|------------------|-------------|
| `GEMINI_API_KEY` | API key para el endpoint `/api/chatbot` |

### Endpoints de la API (Gateway local `main.ts`)

#### Auth / Usuario

| Metodo | Ruta            | Proxy backend      | Descripcion |
|--------|-----------------|--------------------|-------------|
| POST   | `/api/login`    | `POST /login`      | Login |
| POST   | `/api/register` | `POST /register`   | Registro |
| POST   | `/api/token`    | `POST /token`      | Validacion token |
| POST   | `/api/user`     | `POST /token/user` | Datos de usuario por bearer |

#### Noticias

| Metodo | Ruta        | Proxy backend      | Descripcion |
|--------|-------------|--------------------|-------------|
| GET    | `/api/news` | `GET /news`        | Listado noticias |
| POST   | `/api/news` | `GET /news/:newid` | Detalle noticia por id |

#### Tickets

| Metodo | Ruta                    | Proxy backend           | Descripcion |
|--------|-------------------------|-------------------------|-------------|
| GET    | `/api/tickets`          | `GET /ticket`           | Listado tickets |
| GET    | `/api/ticket/:ticketid` | `GET /ticket/:ticketid` | Detalle ticket |
| POST   | `/api/tickets`          | `GET /ticket/:ticketid` | Lookup ticket por body |
| POST   | `/api/buy`              | `POST /ticket/sell`     | Compra (requiere cookie bearer) |

#### Tracking

| Metodo | Ruta                  | Proxy backend         | Descripcion |
|--------|-----------------------|-----------------------|-------------|
| GET    | `/api/track/:ticketid`| `GET /track/:ticketid`| Tracking por ticket |

#### Chatbot

| Metodo | Ruta           | Descripcion |
|--------|----------------|-------------|
| POST   | `/api/chatbot` | Asistente conversacional con Gemini, usando contexto de usuario/tickets/noticias |

### Rutas Web

| Ruta                  | Descripcion |
|-----------------------|-------------|
| `/`                   | Home |
| `/login`              | Login |
| `/register`           | Registro |
| `/profile`            | Perfil (protegida) |
| `/news`               | Listado noticias |
| `/news/:id`           | Detalle noticia |
| `/tickets`            | Listado tickets |
| `/tickets/:id`        | Detalle ticket |
| `/tickets/success/:id`| Confirmacion compra |
| `/track`              | Formulario tracking |
| `/track/:id`          | Mapa tracking |

### Seguridad

- Middleware `checkAuth` en rutas protegidas (`/(me)` y `/tickets/(main)`)
- Middleware `alreadylogged` en rutas de login/registro (`/(main)`)
- Validacion de token contra backend (`/token/user`)
- Compra segura en `/api/buy` validando token + `quantity` entero positivo

### Cache

- `GET /api/news`, `GET /api/tickets`, `GET /api/ticket/:ticketid`, `GET /api/track/:ticketid`
  - `Cache-Control: public, max-age=60, stale-while-revalidate=30`
- Resto de endpoints `/api/*`
  - `Cache-Control: no-store`

### Notas de UI y Chatbot

- El chatbot debe mantener estilo moderno y coherente con la web publica (misma linea visual, tipografia y tono de interfaz).
- Se recomienda conservar componentes compartidos de estilo para evitar divergencias entre vistas y chatbot.

---

## Backend (API REST)

### Estructura del Proyecto

```
Trenfe_BackEnd/
├── server.ts                # Punto de entrada
├── security.ts              # Middlewares de seguridad + cache headers
├── util.ts                  # JWT helpers y utilidades
├── auth.ts                  # Helpers de autorizacion
├── cache.ts                 # Cache en memoria
├── types.ts                 # Tipos compartidos
├── DB/                      # Modelos (Mongoose)
│   ├── news.ts
│   ├── tickets.ts
│   ├── track.ts
│   └── user.ts
└── routes/                  # Rutas API
    ├── login.ts
    ├── register.ts
    ├── token.ts
    ├── news.ts
    ├── ticket.ts
    ├── track.ts
    └── user.ts
```

### Instalacion

1. Entra en `Trenfe_BackEnd`
2. Arranca servidor:

```bash
deno task start
```

3. API disponible en `http://localhost:3000`

### Variables de Entorno

```env
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
PORT=3000
ADMIN_TOKEN=example-admin-token
JWT_SECRET=example-jwt-secret
API_NINJAS_API_KEY=example-api-key
GOOGLE_API_KEY=example-google-key
```

| Variable             | Descripcion |
|----------------------|-------------|
| `MONGO_URI`          | Conexion a MongoDB Atlas |
| `PORT`               | Puerto del servidor |
| `ADMIN_TOKEN`        | Token estatico de operaciones admin |
| `JWT_SECRET`         | Firma/verificacion JWT |
| `API_NINJAS_API_KEY` | Geolocalizacion en `/track/create` |
| `GOOGLE_API_KEY`     | Utilidades IA (`sendAIPrompt`) |

### Endpoints

#### Autenticacion

- `POST /login`
- `POST /register`

#### Token

- `POST /token`
- `POST /token/user`

#### Noticias

| Metodo | Ruta           | Auth       |
|--------|----------------|------------|
| GET    | `/news`        | No |
| GET    | `/news/:newid` | No |
| POST   | `/news/create` | Si (admin) |
| PUT    | `/news`        | Si (admin) |
| DELETE | `/news/:newid` | Si (admin) |

#### Tickets

| Metodo | Ruta                | Auth            |
|--------|---------------------|-----------------|
| GET    | `/ticket`           | No |
| GET    | `/ticket/:ticketid` | No |
| POST   | `/ticket/create`    | Si (admin) |
| POST   | `/ticket/sell`      | Usuario o admin |
| PUT    | `/ticket`           | Si (admin) |
| DELETE | `/ticket/:ticketid` | Si (admin) |

#### Tracking

| Metodo | Ruta               | Auth       |
|--------|--------------------|------------|
| GET    | `/track/:ticketid` | No |
| POST   | `/track/create`    | Si (admin) |
| DELETE | `/track/:ticketid` | Si (admin) |

#### Usuario

| Metodo | Ruta            | Auth            |
|--------|-----------------|-----------------|
| GET    | `/user`         | Si (admin) |
| GET    | `/user/:userid` | Usuario o admin |
| PUT    | `/user`         | Usuario o admin |
| DELETE | `/user/:userid` | Usuario o admin |

### Seguridad

- Passwords con `bcryptjs`
- JWT con `JWT_SECRET`
- Endpoints admin con `ADMIN_TOKEN`
- `helmet`, `express-rate-limit`, guardas anti-XSS/SSRF/NoSQL injection
- Politica de cache global en `security.ts`

---

## Intranet (Panel Admin)

### Estructura del Proyecto

```
Trenfe_Intranet/
├── main.ts                     # API interna + middlewares auth
├── routes/
│   ├── _app.tsx               # Shell HTML
│   ├── (index)/index.tsx      # Login
│   └── (main)/
│       ├── dashboard.tsx
│       ├── user.tsx
│       ├── news.tsx
│       └── tickets.tsx
├── components/
├── islands/
├── assets/styles.css
└── static/
```

### Instalacion

1. Entra en `Trenfe_Intranet`
2. Crea `.env` desde `.env.example`
3. Arranca en desarrollo:

```bash
deno task dev
```

4. Build y start:

```bash
deno task build
deno task start
```

### Variables de Entorno

```env
EMAIL=admin@admin.com
PASSWORD=admin123
```

| Variable   | Descripcion |
|------------|-------------|
| `EMAIL`    | Email admin valido para login intranet |
| `PASSWORD` | Password admin valido para login intranet |

### Endpoints de API Interna (`main.ts`)

#### Auth

| Metodo | Ruta          | Descripcion |
|--------|---------------|-------------|
| POST   | `/api/login`  | Login admin por `form-data`, set cookie `auth=admin-token` |
| GET    | `/api/logout` | Logout y borrado de cookie |

#### Noticias

| Metodo | Ruta        | Proxy backend         |
|--------|-------------|-----------------------|
| GET    | `/api/news` | `GET /news` |
| POST   | `/api/news` | `POST /news/create` |
| PUT    | `/api/news` | `PUT /news` |
| DELETE | `/api/news` | `DELETE /news/:newid` |

#### Tickets

| Metodo | Ruta           | Proxy backend |
|--------|----------------|---------------|
| GET    | `/api/tickets` | `GET /ticket` |
| POST   | `/api/tickets` | `POST /ticket/create` |
| PUT    | `/api/tickets` | `PUT /ticket` |
| DELETE | `/api/tickets` | `DELETE /ticket/:ticketid` |

#### Usuarios

| Metodo | Ruta         | Proxy backend |
|--------|--------------|---------------|
| GET    | `/api/users` | `GET /user` |
| POST   | `/api/users` | `POST /register` |
| PUT    | `/api/users` | `PUT /user` |
| DELETE | `/api/users` | `DELETE /user/:userid` |
| POST   | `/api/hash`  | Verificacion local bcrypt |

### Rutas Web

| Ruta         | Descripcion |
|--------------|-------------|
| `/`          | Login |
| `/dashboard` | Dashboard |
| `/user`      | CRUD usuarios |
| `/news`      | CRUD noticias |
| `/tickets`   | CRUD tickets |

### Seguridad

- Sesion por cookie `auth=admin-token`
- Middleware `checkAuth` para `/(main)`
- Middleware `alreadylogged` para `/(index)`
- Operaciones admin con cabecera `Authorization` hacia backend

---

## Arranque Rapido (3 proyectos)

```bash
# Terminal 1
cd /Users/sergioom9/Documents/Universidad/TRENFE/Trenfe_BackEnd && deno task start

# Terminal 2
cd /Users/sergioom9/Documents/Universidad/TRENFE/Trenfe_FrontEnd && deno task dev

# Terminal 3
cd /Users/sergioom9/Documents/Universidad/TRENFE/Trenfe_Intranet && deno task dev
```

## Notas Finales

- Backend es la unica fuente de datos de negocio (usuarios, tickets, noticias, tracking).
- Frontend e Intranet consumen la API desplegada en `https://backend-renfe.sergioom9.deno.net`.
- Mantener coherencia visual moderna entre web publica y chatbot para una experiencia uniforme.
