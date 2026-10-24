# Control Diario - Visitas Efectivas (v1.0.0)

Aplicación móvil táctil (PWA / APK) diseñada para registro rápido de **Visitas Efectivas** en celulares, cálculo de subtotales diarios, control automático por quincenas y rotación cíclica de base de datos.

Inspirada en la identidad visual de **SoyDelivery** (azul `#0056b3` y amarillo `#FFE600`) y **MercadoLibre**.

---

## 🚀 Características Principales

1. **Fecha automática superior**:
   * Muestra la fecha del día actual en español sin cabeceras innecesarias.

2. **Entrada numérica directa con Enter**:
   * Campo de número gigante (`inputMode="numeric"` y `enterKeyHint="done"`).
   * Al pulsar **Enter** o **Listo** en el teclado del celular, guarda y calcula de inmediato cerrando el teclado automáticamente.

3. **Lógica de cálculo & Quincenas**:
   * **Subtotal diario**: Visitas efectivas × $50.
   * **20 Días hábiles al mes** (Lunes a Viernes):
     * **1° Quincena**: Días 1 al 10 hábiles (Semanas 1 y 2).
     * **2° Quincena**: Días 11 al 20 hábiles (Semanas 3 y 4).
   * Panel en tiempo real: Subtotal del día, acumulado 1° Quincena, acumulado 2° Quincena y Total Mensual.

4. **Base de datos con rotación cíclica de 2 meses**:
   * Los datos se guardan localmente en el dispositivo (`localStorage`) funcionando 100% offline.
   * Acumula 2 meses (mes actual y anterior). Al comenzar el 3° mes, el más antiguo se libera automáticamente en segundo plano para no sobrecargar el almacenamiento.
   * Las actualizaciones nunca borran los datos guardados.

5. **Actualizaciones automáticas con ventana emergente**:
   * La aplicación verifica actualizaciones en segundo plano.
   * Cuando hay una versión nueva, muestra una ventana emergente:
     * **Actualizar**: Aplica la nueva versión conservando todos los datos intactos.
     * **Cancelar**: Permite continuar trabajando sin interrupción.

---

## 🛠️ Tecnologías

* **React 19** + **TypeScript**
* **Vite 8** + **Tailwind CSS v4**
* **Vite PWA Plugin** (Service Worker con caché offline y Web App Manifest)
* **Lucide React** (Iconos)

---

## 📦 Cómo subir esta versión a GitHub

Ejecuta los siguientes comandos en tu terminal en la raíz del proyecto:

```bash
# 1. Inicializar Git
git init

# 2. Agregar todos los archivos
git add .

# 3. Crear el primer commit
git commit -m "feat: v1.0.0 primer release de Control Diario APK"

# 4. Establecer la rama principal
git branch -M main

# 5. Vincular a tu repositorio remoto en GitHub
git remote add origin https://github.com/TU_USUARIO/control-diario-apk.git

# 6. Subir el código
git push -u origin main
```

---

## 📱 Cómo obtener y descargar tu archivo APK

### Opción A: Descargar el APK compilado directamente desde GitHub (¡Automático!)
1. Al hacer `git push`, GitHub Actions ejecuta automáticamente el flujo de compilación nativa de Android con Gradle.
2. Ve a la pestaña **Actions** en tu repositorio de GitHub.
3. Entra en la última ejecución de **"Compilar APK Android"**.
4. En la parte inferior, en la sección **Artifacts**, haz clic en **`Control-Diario-APK-v1.0.0`**.
5. Descargarás directamente el archivo instalable **`Control-Diario-v1.0.0.apk`** para instalar en tu celular.

### Opción B: Instalación directa desde el navegador (WebAPK)
1. Abre la aplicación en **Google Chrome** en tu teléfono Android.
2. Toca el menú de 3 puntos (⋮) en la esquina superior derecha.
3. Selecciona **"Instalar aplicación"** o **"Agregar a la pantalla principal"**.
4. Se generará la app nativa con ícono propio, pantalla completa y funcionamiento 100% offline.

---

## 💻 Desarrollo local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build
```
