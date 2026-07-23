# 🚀 toBlog: Plataforma Editorial y Motor de Contenidos Estilo Medium

[![Astro](https://img.shields.io/badge/Astro-v7.0%2B-FF5D01?logo=astro&logoColor=white)](https://astro.build/)
[![React](https://img.shields.io/badge/React-v19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Turso](https://img.shields.io/badge/Turso-LibSQL-4FF8D2?logo=sqlite&logoColor=black)](https://turso.tech/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v4.0-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

**toBlog** es un motor de publicación editorial y plataforma de contenidos de alto rendimiento inspirado en el diseño y la experiencia de usuario de **Medium**. Está desarrollado sobre una arquitectura híbrida de **Astro 7 (SSR)** con **Islas de React 19**, utilizando una base de datos distribuida en el borde con **Turso (LibSQL)** y **Drizzle ORM**, autenticación segura con **Lucia Auth** y almacenamiento multimedia en **Cloudflare R2**.

---

## 🧠 Fundamentos Técnicos y Arquitectura

### 1. Motor de Vistas Únicas (Unique View Tracking System)
Para evitar la inflación artificial de métricas por recarga consecutiva de página ($F5$), el sistema implementa una verificación mediante cookies de servidor seguras con ventana deslizante de 24 horas:

$$\text{Si } \text{Cookie}(\text{viewed\_post\_ID}) \notin \text{Request.Cookies} \implies \Delta \text{viewCount} = \text{viewCount} + 1$$

* **Seguridad HTTP-Only:** Las cookies se emiten con la bandera `httpOnly: true`, haciéndolas inaccesibles para scripts maliciosos en el cliente (XSS).
* **Incremento Atómico en SQL:** La actualización se ejecuta directamente en el motor de base de datos a través de una expresión atómica Drizzle `sql\`${posts.viewCount} + 1\``, garantizando consistencia ante peticiones concurrentes.

### 2. Algoritmo de Lecturas Únicas (Scroll & Time Engagement Observer)
A diferencia de una simple vista, una **Lectura (Read)** mide la retención real del usuario. El sistema combina el monitoreo topológico del DOM con una restricción temporal mínima:

$$\text{Lectura Válida} = (\text{Sentinel.Intersecting} == \text{true}) \land (t_{\text{permanencia}} \ge 10\,\text{segundos})$$

* **Centinela en DOM:** Se posiciona un elemento invisible (`#read-tracker-sentinel`) al final del contenido del artículo.
* **IntersectionObserver API:** Un observador asíncrono rastrea cuando el usuario ha desplazado la pantalla hasta el final del escrito.
* **Disparo Silencioso:** Cumplida la condición, el cliente envía un *beacon* vía `POST /api/posts/read` que registra la lectura única y emite una cookie de bloqueo por 24 horas.

### 3. Sistema de Autenticación & Sesiones en el Borde
* **Lucia Auth v3:** Gestión de sesiones persistentes basadas en cookies respaldadas por la base de datos Turso SQLite.
* **Cifrado de Contraseñas:** Algoritmo **Argon2id** para el hashing seguro de credenciales de acceso.
* **Flujo de Verificación Transaccional:** Generación de tokens de un solo uso de 15 minutos enviados mediante **Resend Email API**.

### 4. Arquitectura Híbrida SSR + Islas Reactivas (React 19 + SWR)
* **SSR Instantáneo (Server-Side Rendering):** El servidor procesa el HTML inicial incluyendo metadatos SEO y datos primarios del Dashboard.
* **Revalidación SWR en Cliente:** La interfaz React del Studio utiliza la estrategia `Cache-First + Background Revalidation` con intervalos de deduplicación de 5000ms para mantener las métricas actualizadas sin parpadeos.

---

## 📂 Estructura del Proyecto

El repositorio está organizado de manera modular siguiendo las mejores prácticas de Astro y React:

```text
toBlog/
├── db/                                  # Scripts extra-aplicación
│   └── seed.ts                          # Script de alimentación inicial de la BD (Admin + Posts)
├── public/                              # Recursos estáticos globales (Favicon, imágenes estáticas)
├── scripts/                             # Scripts de utilidades e inspección técnica (Ignorado en Git)
├── src/                                 # Código fuente de la aplicación
│   ├── actions/                         # Acciones de servidor (Astro Actions)
│   │   ├── auth.ts                      # Lógica de registro, inicio de sesión y verificación de email
│   │   ├── index.ts                     # Exportador global de servidor
│   │   ├── interactions.ts              # Lógica de likes (aplausos) y marcadores (bookmarks)
│   │   ├── posts.ts                     # CRUD de artículos, duplicación y consulta de métricas
│   │   ├── profile.ts                   # Actualización de perfil del autor
│   │   └── tools.ts                     # Herramientas auxiliares
│   ├── components/                      # Componentes UI (Astro & React)
│   │   ├── blog/                        # Componentes interactivos del artículo público
│   │   │   ├── BookmarkButton.tsx       # Botón interactivo de guardado
│   │   │   ├── CommentsSection.tsx      # Sección de comentarios e hilos de discusión
│   │   │   ├── LikeButton.tsx           # Botón de aplausos acumulativos
│   │   │   └── ShareButton.tsx          # Popover de compartir con centrado matemático
│   │   ├── common/                      # Componentes comunes de interfaz
│   │   │   └── Header.astro             # Barra de navegación principal pública
│   │   ├── editor/                      # Componentes del editor enriquecido
│   │   │   ├── EditorWYSIWYG.tsx        # Editor TipTap interactivo con subida a R2
│   │   │   └── Reader.tsx               # Renderizador HTML seguro de contenidos
│   │   ├── studio/                      # Componentes del panel de control
│   │   │   ├── DashboardList.tsx        # Tabla elástica de artículos y resumen de métricas
│   │   │   ├── TagSelector.tsx          # Selector dinámico de etiquetas
│   │   │   └── UserProfileDropdown.tsx  # Menú desplegable de usuario autenticado
│   │   └── ui/                          # Tarjetas y componentes visuales reutilizables
│   │       └── PostCard.astro           # Tarjeta de artículo para feeds
│   ├── db/                              # Capa de base de datos
│   │   ├── client.ts                    # Inicializador del cliente Turso / LibSQL
│   │   └── schema.ts                    # Esquema Drizzle (Users, Sessions, Posts, Bookmarks, Likes, Tags)
│   ├── layouts/                         # Estructuras base de diseño HTML
│   │   ├── BaseLayout.astro             # Layout del sitio público (Header + Footer + SEO)
│   │   └── StudioLayout.astro           # Layout del panel de administración (Studio)
│   ├── lib/                             # Clientes e integraciones externas
│   │   ├── aiConfig.ts                  # Configuración de herramientas asistidas
│   │   ├── lucia.ts                     # Instancia y adaptador de Lucia Auth v3
│   │   └── r2.ts                        # Cliente AWS S3 para Cloudflare R2
│   ├── pages/                           # Enrutamiento de la aplicación (SSR)
│   │   ├── api/                         # Endpoints API de servidor
│   │   │   ├── auth/                    # Endpoints de sesión (/logout, /verify-email)
│   │   │   ├── posts/                   # Endpoints de interacción (/read)
│   │   │   └── upload.ts                # Receptor y procesador de imágenes hacia R2
│   │   ├── blog/                        # Rutas de la sección del blog
│   │   │   ├── index.astro              # Feed principal de publicaciones
│   │   │   └── [slug].astro             # Vista detallada del artículo (Tracking de Vistas/Lecturas)
│   │   ├── studio/                      # Rutas del panel de administración
│   │   │   ├── index.astro              # Dashboard principal con conteo de métricas
│   │   │   └── escribir.astro           # Creación y edición de artículos
│   │   ├── biblioteca.astro             # Vista unificada de artículos guardados por el usuario
│   │   ├── index.astro                  # Página de aterrizaje / Inicio público
│   │   ├── login.astro                  # Formulario de inicio de sesión
│   │   ├── register.astro               # Formulario de registro de usuarios
│   │   └── verify-notice.astro          # Pantalla de aviso de verificación de correo
│   └── styles/                          # Estilos globales
│       └── global.css                   # Importación de Tailwind CSS v4 y tokens de diseño
├── .env.example                         # Plantilla de variables de entorno requeridas
├── astro.config.mjs                     # Configuración principal de Astro (Integraciones React + Tailwind)
├── drizzle.config.ts                    # Configuración de Drizzle Kit para migraciones
├── package.json                         # Definición de dependencias y scripts del proyecto
└── README.md                            # Documentación del proyecto
```

---

## ⚙️ Requisitos del Sistema

* **Node.js**: Versión `>= 22.12.0`
* **Gestor de Paquetes**: `pnpm` (recomendado) o `npm` / `yarn`
* **Base de Datos**: Cuenta activa en [Turso](https://turso.tech/) (o SQLite local)
* **Almacenamiento de Archivos**: Bucket en [Cloudflare R2](https://www.cloudflare.com/products/r2/) (Compatible con S3)
* **Proveedor de Emails**: Cuenta en [Resend](https://resend.com/)

---

## 🚀 Guía de Ejecución

### 1. Clonar el Repositorio e Instalar Dependencias

```bash
git clone https://github.com/elisbanpaco/myBlog.git
cd myBlog
pnpm install
```

### 2. Configurar Variables de Entorno

Copia el archivo `.env.example` para generar tu configuración local `.env`:

```bash
cp .env.example .env
```

Configura tus credenciales en el archivo `.env`:

```ini
# Base de datos Turso (LibSQL)
TURSO_DATABASE_URL=libsql://<tu-base-de-datos>.turso.io
TURSO_AUTH_TOKEN=<tu-token-de-acceso>

# Cloudflare R2 / Almacenamiento S3
R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=<tu-access-key-id>
R2_SECRET_ACCESS_KEY=<tu-secret-access-key>
R2_BUCKET_NAME=toblog-media
R2_PUBLIC_URL=https://<tu-bucket-publico>.r2.dev

# Envíos de correo transaccionales con Resend
API_RESEND=re_<tu_api_key>
```

### 3. Inicializar la Base de Datos Local

Puedes levantar una base de datos local SQLite utilizando Drizzle Kit (se guardará en `.astro/content.db`):

```bash
# Crear las tablas en la base de datos local
pnpm db:push:local

# Insertar el usuario administrador y artículos de prueba iniciales
pnpm db:seed:local
```

### 4. Iniciar el Servidor de Desarrollo

```bash
pnpm dev
```

El servidor estará disponible en [http://localhost:4321](http://localhost:4321).

> **Nota para desarrollo:** Para ejecutar el servidor en segundo plano puedes usar `astro dev --background` y gestionarlo mediante `astro dev status` y `astro dev logs`.

---

## 🔑 Credenciales de Prueba (Entorno Local)

Tras ejecutar el comando `pnpm db:seed:local`, podrás acceder al panel `/studio` con el usuario por defecto:

* **Usuario:** `admin`
* **Contraseña:** `admin1234`

---

## 📊 Tabla de Comandos Disponibles

| Comando | Descripción |
| :--- | :--- |
| `pnpm dev` | Inicia el servidor de desarrollo local de Astro. |
| `pnpm build` | Compila la aplicación optimizada para producción en `./dist/`. |
| `pnpm preview` | Previsualiza la compilación de producción en entorno local. |
| `pnpm lint` | Analiza el código en busca de problemas de formato con ESLint. |
| `pnpm lint:fix` | Corrige automáticamente los errores detectados por ESLint. |
| `pnpm db:push:local` | Sincroniza el esquema Drizzle con la base de datos local. |
| `pnpm db:push:remote` | Sincroniza el esquema Drizzle con la BD remota de Turso. |
| `pnpm db:seed:local` | Puebla la base de datos local con datos de prueba. |
| `pnpm db:seed:remote` | Puebla la BD remota de Turso con datos iniciales. |
| `pnpm db:studio` | Abre la consola web **Drizzle Studio** para inspeccionar las tablas. |

---

## 📄 Licencia

Este proyecto está distribuido bajo la Licencia **MIT**. Consulta el archivo [LICENSE](./LICENSE) para más información.
