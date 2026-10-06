# Contrato propuesto para la versión conectada

Este documento es un diseño de integración. **No hay un servidor desplegado ni un cliente remoto conectado en esta entrega.** Las operaciones siguientes evitan que el snapshot local se convierta en una escritura insegura de toda la base.

## Transporte y autenticación

API versionada `/v1`, HTTPS obligatorio fuera del desarrollo local. Sesiones emitidas por un proveedor de autenticación (correo u OAuth). El servidor identifica al usuario desde un token validado. Claves administrativas y credenciales FCM/APNs permanecen únicamente en el servidor.

No enviar contraseñas a Preferences. En nativo, usar almacenamiento seguro para secretos de sesión según el proveedor; en web, preferir cookies seguras HttpOnly si la arquitectura lo permite.

## Operaciones

| Método/ruta                                                         | Autorización                                         | Resultado                                          |
| ------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------- |
| `GET /me`                                                           | Sesión válida                                        | Perfil propio                                      |
| `PATCH /me`                                                         | Propietario                                          | Actualiza datos permitidos, nunca reputación       |
| `GET /technicians?lat=&lng=&radiusKm=&category=&minRating=&cursor=` | Sesión según política de producto                    | Perfiles públicos paginados y distancia aproximada |
| `GET /technicians/:id`                                              | Lectura pública autorizada                           | Biografía, oficio, portafolio público y reseñas    |
| `POST /uploads`                                                     | Sesión y límites por usuario                         | URL temporal y límite de tamaño/MIME               |
| `POST /requests`                                                    | Vecino autenticado, clave de idempotencia            | Solicitud con zona pública aproximada              |
| `GET /requests`                                                     | Vecino: propias; técnico: área/categoría autorizadas | Página de solicitudes sin domicilio exacto         |
| `POST /requests/:id/quotes`                                         | Técnico autorizado, solicitud abierta                | Cotización única por técnico y solicitud           |
| `POST /requests/:id/accept`                                         | Dueño de solicitud, estado abierto                   | Acepta una cotización en transacción               |
| `POST /requests/:id/complete`                                       | Dueño, estado aceptado                               | Finaliza el trabajo                                |
| `POST /requests/:id/cancel`                                         | Dueño, estado abierto                                | Cancela con comprobación de versión                |
| `POST /requests/:id/review`                                         | Dueño, estado finalizado                             | Una reseña; agrega reputación en servidor          |
| `PUT /favorites/:technicianId` / `DELETE`                           | Sesión válida                                        | Favoritos propios                                  |
| `PUT /devices/:installationId`                                      | Sesión válida                                        | Token push, plataforma y consentimiento            |
| `DELETE /devices/:installationId`                                   | Propietario                                          | Revoca dispositivo al cerrar sesión                |

## Modelo persistente

- `profiles`: ID de autenticación, nombre, roles, correo privado, zona pública, teléfono con consentimiento.
- `technicians`: FK de perfil, oficio, biografía, área de cobertura, disponibilidad.
- `portfolio_items`: FK de técnico, referencia de archivo, orden y visibilidad.
- `requests`: FK de cliente, categoría, título, descripción, punto público aproximado, urgencia, estado, versión.
- `quotes`: FK de solicitud/técnico, monto entero en COP, mensaje y fecha. Índice único por solicitud/técnico.
- `reviews`: FK de solicitud y técnico, puntuación y comentario. Índice único por solicitud.
- `favorites`: clave compuesta usuario/técnico.
- `device_tokens`: token push privado, instalación, consentimiento y último uso.
- `outbox`: eventos a entregar una vez confirmada la transacción.

La ubicación exacta, si más adelante se necesita, debe estar separada y restringida al cliente y al técnico contratado. No incluir coordenadas o domicilio exacto en notificaciones, logs públicos o respuestas del directorio.

## Notificaciones

Al crear una solicitud, una transacción inserta la solicitud y un evento en `outbox`. Un worker filtra técnicos disponibles por oficio y radio con una consulta geoespacial indexada, y envía un aviso genérico por FCM/APNs. No enviar una notificación a todos los usuarios y dejar que la aplicación filtre después.

Al enviar una cotización, avisar solo al dueño de la solicitud. Los reintentos se deduplican por evento/dispositivo; los tokens revocados o inválidos se eliminan. La app pedirá permiso cuando el usuario active las alertas, no al primer arranque.

## Reglas que deben comprobarse en servidor

- Sesión, propiedad, rol y alcance geográfico en cada operación.
- Validación de estados y exclusión mutua al aceptar cotizaciones.
- Reseñas ligadas a servicios reales finalizados y prevención de duplicados.
- Tamaño/MIME de imágenes, eliminación de metadatos y acceso por visibilidad.
- Cuotas de solicitudes/mensajes y protección contra spam.
- Respuestas de error estructuradas (`code`, `message`, `fieldErrors`, `requestId`), sin datos privados.
- Acceso a contactos solo con consentimiento y política de producto definida.

Para pruebas de aceptación reales se necesitan al menos dos cuentas y dos dispositivos: publicar como vecino, recibir la notificación como técnico, cotizar, aceptar y comprobar que un tercero no puede leer o modificar datos privados.
