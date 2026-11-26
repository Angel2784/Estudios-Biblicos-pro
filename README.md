# 📜 Estudio Bíblico Pro

App web gratuita de exégesis académica con IA — funciona en PC, tablet y celular.

## 🚀 Cómo publicar en Vercel (gratis, 10 minutos)

### Paso 1 — Subir el código a GitHub
1. Crea una cuenta en [github.com](https://github.com) si no tienes
2. Haz clic en **New repository** → nombre: `estudio-biblico-pro`
3. Descarga [GitHub Desktop](https://desktop.github.com) o usa la web
4. Sube todos estos archivos al repositorio

### Paso 2 — Publicar en Vercel
1. Ve a [vercel.com](https://vercel.com) y entra con tu cuenta de GitHub
2. Haz clic en **Add New Project**
3. Selecciona tu repositorio `estudio-biblico-pro`
4. Vercel detecta automáticamente que es Next.js
5. Haz clic en **Deploy** — listo en ~2 minutos
6. Recibirás un link como: `https://estudio-biblico-pro.vercel.app`

### Paso 3 — Compartir
Comparte ese link con cualquier persona — funciona en cualquier dispositivo sin instalar nada.

---

## 📱 Instalar como app en el celular (PWA)

**Android (Chrome):**
1. Abre el link en Chrome
2. Toca los 3 puntos → "Añadir a pantalla de inicio"

**iPhone (Safari):**
1. Abre el link en Safari
2. Toca el botón compartir → "Añadir a pantalla de inicio"

---

## 💻 Correr localmente (desarrollo)

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Abrir en el navegador
# http://localhost:3000
```

---

## 🔑 API Key de Gemini

Cada usuario obtiene su propia API Key gratuita en:
👉 [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

- **Límite gratuito:** 1,500 requests/día con gemini-2.0-flash
- **La key se guarda** solo en el navegador del usuario (localStorage)
- **Tú no ves ni pagas nada**

---

## 📁 Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx          # Página principal
│   ├── layout.tsx        # Layout con metadatos PWA
│   └── globals.css       # Estilos globales
├── components/
│   ├── ApiKeySetup.tsx   # Pantalla de configuración de API Key
│   ├── StudySection.tsx  # Sección de exégesis
│   ├── ComparativeSection.tsx  # Estudio comparado
│   ├── AnnotationReader.tsx    # Lector con anotaciones
│   └── LibrarySidebar.tsx      # Biblioteca guardada
└── lib/
    ├── gemini.ts         # Llamadas a la API de Gemini
    ├── storage.ts        # Persistencia en localStorage
    └── parser.ts         # Parsing de texto bíblico
```

---

## ✨ Funcionalidades

- ✅ Exégesis académica de cualquier pasaje (13 secciones)
- ✅ Estudio comparativo entre dos pasajes (10 secciones)
- ✅ Resaltado de texto por colores + notas personales
- ✅ Compartir por WhatsApp, Twitter/X y link
- ✅ Biblioteca personal guardada en el navegador
- ✅ Exportar estudios como archivo de texto
- ✅ Funciona en PC, tablet y celular (PWA instalable)
- ✅ 100% gratuito para todos

---

## 🔧 Próximas funcionalidades

- [ ] Sermón/devocional generado por IA
- [ ] Chat con el pasaje (preguntas y respuestas)
- [ ] Modo offline completo
- [ ] Árbol genealógico de personajes
- [ ] Línea de tiempo visual interactiva
