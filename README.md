# BarrioRed

Aplicación móvil híbrida de servicios y oficios para el Valle de Aburrá, basada en el planteamiento de Camilo Estrada y Daniel Medina. Implementada con **Ionic React + TypeScript + Capacitor**, con una base de código compartida para Android, iOS y navegador.

## Ejecutar

Requiere Node.js 22 o superior y npm. Desde la raíz del proyecto:

```bash
npm ci
npm run dev
```

Abre la dirección que indique Vite, normalmente `http://127.0.0.1:5173`. No se necesitan claves ni una cuenta de servicios externos para la demostración.

```bash
npm run build         # Verificación TypeScript y compilación de producción
npm test              # Reglas de búsqueda, privacidad y validación
npm run test:e2e      # Recorridos de navegador; requiere Google Chrome instalado
npm run test:e2e:prod # Los mismos recorridos sobre el paquete de producción
npm run format:check # Verificar formato
```

Los tests E2E usan perfiles de navegador aislados. No modifican los datos de tu navegador habitual. El archivo `playwright.config.ts` permite cambiar de Chrome a otro navegador de Playwright.

## Qué puedes probar

- Directorio por oficio, nombre y barrio; filtros por distancia, disponibilidad y puntuación.
- Mapa interactivo OpenStreetMap, ubicación GPS solicitada expresamente y distancias calculadas con Haversine.
- Perfiles técnicos, precios orientativos, portafolio, favoritos persistentes y reseñas.
- Solicitudes exprés con foto, categoría, urgencia y ubicación aproximada.
- Cotizar como técnico, elegir una cotización como vecino, finalizar el trabajo y publicar una única reseña.
- Cancelar solicitudes abiertas con confirmación; consultar el historial.
- Edición de perfil vecino/técnico, imágenes de portafolio y teléfono de contacto.
- Enlaces de llamada y WhatsApp para un perfil local con teléfono configurado. Los técnicos ficticios no tienen teléfonos reales.
- Guardado local con Capacitor Preferences, aviso de desconexión y acceso a los datos ya guardados sin red.
- Diseño adaptable a teléfono, tableta y escritorio, navegación inferior, etiquetas accesibles y controles táctiles.

### Recorrido sugerido

1. En **Explorar**, toca **Pedir una mano** y publica una solicitud.
2. En **Solicitudes**, abre su detalle y toca **Añadir cotización de ejemplo**.
3. Elige la cotización, marca el servicio como finalizado y deja una reseña.
4. Para probar el lado del técnico, crea otra solicitud de electricidad. En **Mi perfil**, selecciona **Soy técnico**, completa la descripción y guarda. En **Solicitudes**, abre el trabajo y envía una cotización. Regresa al rol vecino y guarda para aceptarla.

## Alcance real de esta entrega

Es un **MVP local funcional**, no una plataforma multiusuario desplegada. La interfaz identifica el modo demo y los datos ilustrativos. No se crean cuentas autenticadas, no se envían solicitudes a otras personas y no se simula que una notificación push real haya sido entregada. El correo del perfil es un dato local, no un inicio de sesión.

Los seis técnicos iniciales, sus precios y puntuaciones son ejemplos. Las solicitudes, cotizaciones, favoritos, fotos y reseñas creados por ti permanecen en este dispositivo y origen web. El botón de cotización de ejemplo es una acción explícita, no una respuesta automática atribuida a una persona real.

El mapa y las fuentes web necesitan conexión. La aplicación empaquetada incluye los recursos web y puede abrir sin red; en el navegador no se implementó un service worker, por lo que la carga inicial offline no está garantizada. Las fuentes tienen alternativa local del sistema. Las fotos comprimidas se almacenan localmente para el prototipo; una versión a escala debe usar almacenamiento de archivos y una base local apropiada, no Preferences para un catálogo multimedia extenso.

## Android

El proyecto nativo está en `android/`. Android mínimo configurado: **8.0 / API 26**. Requiere Android Studio, SDK 36 y el JDK compatible con Capacitor 8. Consulta los [requisitos oficiales](https://capacitorjs.com/docs/getting-started/environment-setup).

```bash
npm run cap:sync
npm run android
```

Selecciona un emulador o dispositivo y ejecuta desde Android Studio. Para un APK de depuración también puedes ejecutar `gradlew.bat assembleDebug` desde `android/` en Windows, con el SDK/JDK configurados. La firma de distribución no está incluida.

Los permisos de ubicación aproximada/precisa están declarados. La cámara usa la actividad nativa de Capacitor; no se solicita acceso general a archivos ni se guarda en la galería automáticamente. Las copias automáticas de los datos de demo están desactivadas en Android.

## iOS / iPhone

El proyecto nativo está en `ios/`. El target de Capacitor 8 requiere **iOS 15 o superior**. Para compilar y ejecutar se necesita **macOS y Xcode**; este proyecto se desarrolló en Windows y no se ha firmado ni ejecutado en un dispositivo Apple.

En el Mac:

```bash
npm ci
npm run cap:sync
npm run ios
```

Configura tu equipo de desarrollo, identificador definitivo y firma en Xcode. Se incluyen las descripciones de permisos de cámara, fotos y ubicación en español, y el manifiesto de privacidad para Preferences. Revisa las declaraciones de privacidad cuando se conecten servicios externos.

El script `scripts/native-post-sync.mjs` normaliza las rutas de Swift Package Manager generadas en Windows. Utiliza `npm run cap:sync` para mantenerlas portables. El identificador provisional es `co.barriored.app`.

**Validación nativa:** se generaron y sincronizaron ambos proyectos. La entrega no incluye un APK/IPA ni confirma una compilación Gradle/Xcode. Cámara, permisos del sistema, áreas seguras y comportamiento del botón Atrás deben probarse en dispositivos antes de publicar.

## Estructura y evolución

```text
src/
  domain/             Tipos y reglas puras: solicitudes, distancias, reseñas
  data/               Contrato de repositorio, persistencia local y datos demo
  platform/           Adaptadores de cámara, imágenes y geolocalización
  state/              ViewModel compartido y transacciones locales
  features/
    discover/         Directorio, mapa y perfil de técnico
    requests/         Crear, cotizar, gestionar y calificar
    profile/          Perfil del vecino/técnico
  ui/                 Componentes visuales reutilizables
  App.tsx             Composición de pantallas y navegación
  theme.css           Identidad visual y diseño adaptable
android/              Proyecto Android de Capacitor
ios/                  Proyecto iOS de Capacitor
tests/e2e/            Pruebas de los recorridos completos
docs/                 Arquitectura, alcance y contrato propuesto de backend
```

La lógica se separa de las vistas siguiendo la intención MVVM del documento. El mapa y las pantallas secundarias cargan bajo demanda. Las escrituras locales se serializan y la UI solo confirma una acción después de guardarla; un fallo de persistencia muestra un error. Las reseñas exigen un trabajo finalizado y una cotización aceptada.

Consulta [arquitectura y requisitos](docs/ARQUITECTURA.md) y [contrato de backend](docs/BACKEND.md) para ampliar la aplicación sin mezclar autenticación, reglas y componentes visuales.

## Base técnica consultada

- [Ionic React](https://ionicframework.com/docs/react/overview)
- [Capacitor: configuración del entorno](https://capacitorjs.com/docs/getting-started/environment-setup)
- [Geolocalización](https://capacitorjs.com/docs/apis/geolocation), [cámara](https://capacitorjs.com/docs/apis/camera) y [Preferences](https://capacitorjs.com/docs/apis/preferences)

No se implementan pagos, biometría, facturación ni agenda sincronizada, de acuerdo con las exclusiones del MVP del planteamiento.
