# 🚀 myBlog: Astro + Turso + Drizzle + Lucia Auth + Tailwind CSS v4

Un motor de blog minimalista y potente de alto rendimiento desarrollado con **Astro 7** (modo SSR), **React 19**, **Tailwind CSS v4** y una arquitectura de base de datos moderna con **Turso** y **Drizzle ORM**. Cuenta con autenticación integrada mediante **Lucia Auth** y un panel de administración (Studio) con un editor WYSIWYG basado en **TipTap** con soporte de subida de imágenes a **Cloudflare R2**.

---

## 🛠️ Stack Tecnológico

- **Framework Principal:** [Astro 7](https://astro.build/) en modo servidor (SSR).
- **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/) (usando el plugin oficial de Vite) junto con CSS vainilla para diseño optimizado.
- **Interactividad del Studio:** [React 19](https://react.dev/) y [SWR](https://swr.vercel.app/) para la gestión de estados y peticiones en el cliente.
- **Base de Datos:** [Turso](https://turso.tech/) (LibSQL / SQLite).
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/) con Drizzle Kit para control de migraciones y esquemas.
- **Autenticación:** [Lucia Auth v3](https://lucia-auth.com/) con adaptador de SQLite para gestión de sesiones seguras.
- **Editor de Contenido:** [TipTap](https://tiptap.dev/) (Editor de texto enriquecido WYSIWYG) con almacenamiento de imágenes en **Cloudflare R2** (S3 compatible).

---

## 📂 Estructura del Proyecto

El código fuente está estructurado de la siguiente forma:

- **[db/](./db/)**: Scripts de base de datos extra-aplicación (por ejemplo, el script de inicialización [seed.ts](./db/seed.ts)).
- **[src/](./src/)**: Carpeta principal del código fuente.
  - **[actions/](./src/actions/)**: Acciones seguras ejecutadas en el servidor (Astro Actions) para autenticación ([auth.ts](./src/actions/auth.ts)) y gestión de publicaciones ([posts.ts](./src/actions/posts.ts)).
  - **[components/](./src/components/)**:
    - **studio/**: Componentes interactivos en React (`DashboardList`, `EditorWYSIWYG`, `TagSelector`) para el panel de administración.
    - **ui/**: Componentes visuales reutilizables de Astro (como [PostCard.astro](./src/components/ui/PostCard.astro)).
  - **[db/](./src/db/)**: Configuración del cliente Drizzle ([client.ts](./src/db/client.ts)) y definición del esquema ([schema.ts](./src/db/schema.ts)).
  - **[layouts/](./src/layouts/)**: Diseños base del sitio público ([BaseLayout.astro](./src/layouts/BaseLayout.astro)) y del panel de administración ([StudioLayout.astro](./src/layouts/StudioLayout.astro)).
  - **[lib/](./src/lib/)**: Configuraciones de clientes e inicializaciones externas, como Lucia Auth ([lucia.ts](./src/lib/lucia.ts)) y Cloudflare R2 ([r2.ts](./src/lib/r2.ts)).
  - **[pages/](./src/pages/)**: Sistema de rutas del proyecto:
    - `index.astro`: Página de inicio (Inicio). Muestra un Hero y los 3 últimos artículos.
    - `login.astro`: Vista del formulario de acceso.
    - `blog/`: Sección pública con el feed de publicaciones (`index.astro`) y las páginas de artículos dinámicas (`[slug].astro`).
    - `studio/`: Panel del autor. `index.astro` para el listado de posts y `escribir.astro` para crear/editar.
    - `api/`: Rutas API de servidor (Cierre de sesión `/api/auth/logout` y receptor de subidas de archivos `/api/upload`).
  - **[styles/](./src/styles/)**: Contiene [global.css](./src/styles/global.css) que importa Tailwind y establece las variables CSS del sitio.

---

## ⚙️ Configuración e Instalación

### 1. Requisitos Previos

Asegúrate de contar con Node.js (versión `>= 22.12.0`) y `pnpm` instalado de forma global.

### 2. Instalar Dependencias

Clona el proyecto e instala los paquetes necesarios usando `pnpm`:

```sh
pnpm install
```

### 3. Variables de Entorno

Copia el archivo de ejemplo para crear tu configuración local:

```sh
cp .env.example .env
```

Edita el archivo `.env` configurando tus credenciales de **Turso** y **Cloudflare R2**:

```ini
# Base de datos Turso
TURSO_DATABASE_URL=libsql://<tu-base-de-datos>.turso.io
TURSO_AUTH_TOKEN=<tu-token-de-acceso>

# Cloudflare R2 / S3
R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=<tu-access-key-id>
R2_SECRET_ACCESS_KEY=<tu-secret-access-key>
R2_BUCKET_NAME=myblog-media
R2_PUBLIC_URL=https://<tu-bucket>.r2.dev
```

### 4. Configurar la Base de Datos Local

Puedes levantar una base de datos local SQLite utilizando Drizzle Kit (se guardará por defecto en `.astro/content.db`):

```sh
# Crear las tablas en la base de datos local
pnpm db:push:local

# Alimentar la base de datos con el usuario admin y posts de prueba
pnpm db:seed:local
```

### 5. Iniciar el Servidor de Desarrollo

Ejecuta el comando para arrancar la aplicación de manera local:

```sh
pnpm dev
```

> **Nota:** Según las directrices de desarrollo del proyecto, para ejecutar el servidor en segundo plano puedes usar `astro dev --background` y administrarlo mediante `astro dev stop`, `astro dev status` y `astro dev logs`.

El sitio estará disponible por defecto en [http://localhost:4321](http://localhost:4321).

---

## 🔑 Credenciales de Acceso (Por Defecto)

Tras ejecutar el script de seed (`pnpm db:seed:local`), se crea una cuenta de administrador para acceder al panel de control `/studio`:

- **Usuario:** `admin`
- **Contraseña:** `admin1234`

Puedes iniciar sesión en [http://localhost:4321/login](http://localhost:4321/login) para administrar las publicaciones.

---

## 🧞 Comandos Disponibles

| Comando | Acción |
| :--- | :--- |
| `pnpm dev` | Inicia el servidor de desarrollo local de Astro. |
| `pnpm build` | Compila la aplicación optimizada para producción en `./dist/`. |
| `pnpm preview` | Previsualiza localmente la compilación de producción. |
| `pnpm lint` | Analiza el código en busca de problemas de formato con ESLint. |
| `pnpm lint:fix` | Corrige de forma automática los problemas detectados por ESLint. |
| `pnpm db:push:local` | Sincroniza el esquema Drizzle directamente con la base de datos local. |
| `pnpm db:push:remote` | Sincroniza el esquema Drizzle con la base de datos remota de Turso. |
| `pnpm db:seed:local` | Alimenta la base de datos local con datos iniciales (Admin y Post de prueba). |
| `pnpm db:seed:remote` | Alimenta la base de datos remota de Turso con datos iniciales. |
| `pnpm db:studio` | Abre la interfaz web Drizzle Studio para administrar los datos de la base de datos. |

---

## 🚀 Despliegue en Producción

Dado que el proyecto utiliza el modo de salida en servidor (`output: 'server'`), para el despliegue a producción en plataformas como Cloudflare, Vercel, Netlify o un servidor Node VPS, es necesario añadir el adaptador correspondiente de Astro en el archivo [astro.config.mjs](./astro.config.mjs).

Por ejemplo, para desplegar en Node:

1. Añadir el adaptador: `pnpm astro add node`
2. El archivo de configuración importará y declarará `adapter: node({ mode: 'standalone' })`.
3. Ejecutar `pnpm build` y correr el servidor de producción generado.
