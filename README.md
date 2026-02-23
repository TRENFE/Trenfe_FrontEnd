# Trenfe Frontend con Deno Fresh 2.1

Aplicación completa de intranet con autenticación, gestión de noticias, tickets y perfil de usuario.

## Estructura del Proyecto

```
/
├── main.ts                        # Punto de entrada de la aplicación
├── components/                    # Componentes reutilizables (SSR)
│   ├── Alert.tsx                  # Alerta genérica
│   ├── Alert2.tsx                 # Variante de alerta
│   ├── BuyButton.tsx              # Botón de compra
│   ├── BuyTicketButton.tsx        # Botón de compra de ticket
│   ├── Footer.tsx                 # Pie de página
│   ├── Header.tsx                 # Cabecera de la aplicación
│   ├── Index.tsx                  # Componente de página principal
│   ├── IndividualNew.tsx          # Vista de una noticia individual
│   ├── IndividualTicket.tsx       # Vista de un ticket individual
│   ├── Loading.tsx                # Indicador de carga
│   ├── Login.tsx                  # Formulario de inicio de sesión
│   ├── New.tsx                    # Tarjeta de noticia
│   ├── News.tsx                   # Listado de noticias
│   ├── Register.tsx               # Formulario de registro
│   ├── SuccessCard.tsx            # Tarjeta de compra exitosa
│   ├── Ticket.tsx                 # Tarjeta de ticket
│   ├── Tickets.tsx                # Listado de tickets
│   └── User.tsx                   # Información de usuario
├── islands/                       # Componentes interactivos (cliente)
│   ├── Alert.tsx                  # Alerta interactiva
│   ├── BuyButton.tsx              # Botón de compra interactivo
│   ├── HeaderIsland.tsx           # Cabecera con estado cliente
│   ├── IndividualNewIsland.tsx    # Noticia individual interactiva
│   ├── IndividualTicket.tsx       # Ticket individual interactivo
│   ├── Login.tsx                  # Login con manejo de estado
│   ├── News.tsx                   # Noticias con filtros interactivos
│   ├── Register.tsx               # Registro con validación cliente
│   ├── SuccessIsland.tsx          # Confirmación de compra interactiva
│   ├── Tickets.tsx                # Tickets con filtros interactivos
│   └── User.tsx                   # Perfil de usuario interactivo
├── routes/                        # Rutas de la aplicación
│   ├── (main)/                    # Grupo de rutas públicas (redirige si ya hay sesión)
│   │   ├── login.tsx              # Página de inicio de sesión
│   │   └── register.tsx           # Página de registro
│   ├── (me)/                      # Grupo de rutas protegidas (requiere autenticación)
│   │   └── profile.tsx            # Página de perfil del usuario
│   ├── news/
│   │   └── [id].tsx               # Detalle de una noticia
│   ├── tickets/
│   │   ├── (main)/
│   │   │   ├── [id].tsx           # Detalle de un ticket
│   │   │   └── index.tsx          # Listado de tickets (protegido)
│   │   └── success/
│   │       └── [id].tsx           # Confirmación de compra de ticket
└────── index.tsx                  # Página principal / noticias

```

## Instalación

1. Instala Deno si no lo tienes: https://deno.land/
2. Clona o descarga el proyecto
3. Ejecuta la aplicación en modo desarrollo:

```bash
deno task dev
```

4. Abre tu navegador en http://localhost:8000

## Autenticación y Middleware

El sistema de autenticación usa cookies HttpOnly con un token `bearer`. Hay dos middlewares definidos en `main.ts`:

### `checkAuth` — Rutas protegidas

Verifica que exista una cookie `bearer` válida. Si no hay token o la validación falla, redirige al usuario a `/login`. Se aplica a:

- `/tickets/(main)` — Listado y detalle de tickets
- `/(me)` — Perfil del usuario

### `alreadyLogged` — Rutas públicas

Redirige a `/profile` si el usuario ya tiene sesión activa, evitando que acceda de nuevo al login o registro. Se aplica a:

- `/(main)` — Login y registro

La validación del token se realiza contra el backend en cada petición:

```
POST https://backend-renfe.sergioom9.deno.net/token/user
Body: { "bearer": "string" }
```

## Configuración de la API

Todas las llamadas a la API se realizan contra el backend en `https://backend-renfe.sergioom9.deno.net`.

### Endpoints principales

**Autenticación:**
- `POST /auth/login` — Inicio de sesión
  - Body: `{ "email": "string", "password": "string" }`
  - Respuesta: `{ "bearer": "string" }`
- `POST /auth/register` — Registro de nuevo usuario
  - Body: `{ "nombre": "string", "email": "string", "password": "string" }`

**Validación de token:**
- `POST /token/user` — Valida el token y devuelve datos del usuario
  - Body: `{ "bearer": "string" }`

**Noticias:**
- `GET /noticias` — Listar noticias
- `GET /noticias/:id` — Obtener noticia por ID

**Tickets:**
- `GET /tickets` — Listar tickets
- `GET /tickets/:id` — Obtener ticket por ID
- `POST /tickets/:id/comprar` — Comprar un ticket (requiere autenticación)

**Usuario:**
- `GET /me` — Obtener perfil del usuario autenticado

### Reemplazar la URL del backend

Si necesitas apuntar a otro backend, busca y reemplaza `https://backend-renfe.sergioom9.deno.net`.

## Características

✅ Autenticación con token Bearer en cookie HttpOnly  
✅ Middleware automático de protección de rutas  
✅ Redirección si ya hay sesión activa  
✅ Registro e inicio de sesión  
✅ Listado y detalle de noticias  
✅ Listado y detalle de tickets (protegido)  
✅ Compra de tickets con página de confirmación  
✅ Perfil del usuario autenticado  
✅ Interfaz responsive  
✅ Componentes de carga y alertas  
✅ Navegación con cabecera dinámica  

## Modelos de Datos

### Usuario
```typescript
{
  id: number,
  nombre: string,
  email: string,
  rol: "admin" | "editor" | "usuario"
}
```

### Noticia
```typescript
{
  id: number,
  titulo: string,
  contenido: string,
  categoria: "general" | "tecnologia" | "recursos_humanos" | "eventos",
  fecha: string // ISO 8601
}
```

### Ticket
```typescript
{
  id: number,
  titulo: string,
  descripcion: string,
  precio: number,
  fecha: string, // ISO 8601
  disponibles: number
}
```

## Flujo de la Aplicación

```
Inicio (/)
  └─ Listado de noticias
       └─ /news/:id → Detalle de noticia

/login  ──────────────────────────────── (main) → redirige a /profile si ya hay sesión
/register

/profile ─────────────────────────────── (me) → requiere autenticación

/tickets ─────────────────────────────── (main) → requiere autenticación
  └─ /tickets/:id → Detalle de ticket
       └─ /tickets/success/:id → Confirmación de compra
```

## Seguridad

- El token se almacena en una cookie `bearer`
- Cada petición protegida valida el token contra el backend antes de renderizar
- Si el token es inválido o ha expirado, el usuario es redirigido a `/login`
- Las rutas públicas `(main)` comprueban si ya hay sesión para evitar doble login

## Personalización

Los estilos principales se encuentran en `static/` y los componentes de layout en `_app.tsx` y `_layout.tsx`. Puedes modificar `components/Header.tsx` y `components/Footer.tsx` para adaptar la navegación a tu proyecto.

## Notas
- Añade validación de formularios adicional en el servidor según tus necesidades
- Considera implementar refresh tokens para mejorar la experiencia de sesión
