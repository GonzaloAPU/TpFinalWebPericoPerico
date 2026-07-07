# Informe tecnico - Perico-Perico

Este documento explica como esta organizada la aplicacion, que tecnologias usa y donde buscar cada parte importante del front y del back.

## 1. Vision general

Perico-Perico es una aplicacion web de viajes compartidos/taxi entre ciudades. Tiene tres roles principales:

- `PASAJERO`: busca viajes, reserva asientos, paga con Mercado Pago o efectivo, cancela reservas y ve ubicacion/ruta del chofer.
- `CHOFER`: publica viajes, administra autos, inicia/finaliza/cancela viajes, agrega pasajeros manuales, comparte ubicacion y cobra reservas.
- `ADMIN`: gestiona informacion general y tiene permisos ampliados.

La aplicacion se divide en:

- Backend: `PericoBack`
- Frontend Angular: `PericoFront/proyfrontendgrupo03`

## 2. Tecnologias del backend

El backend esta hecho con Node.js y Express.

- Express: servidor HTTP y rutas REST.
- Sequelize: ORM para trabajar con PostgreSQL usando modelos JavaScript.
- PostgreSQL: base de datos relacional.
- JWT: autenticacion por token para proteger rutas privadas.
- Socket.IO: eventos en tiempo real entre backend y frontend.
- Mercado Pago SDK/API: link de pago, QR de cobro y webhook de confirmacion.
- Swagger: documentacion visual de endpoints.
- qrcode: genera una imagen base64 del QR devuelto por Mercado Pago.

Archivos principales:

- `PericoBack/index.js`: arranca Express, Socket.IO, CORS, Swagger, rutas y sincronizacion Sequelize.
- `PericoBack/config/database.js`: conexion a PostgreSQL.
- `PericoBack/src/models/relaciones.js`: asociaciones Sequelize entre Usuario, Pasajero, Chofer, Auto, Viaje y Reserva.
- `PericoBack/src/controllers/*.controller.js`: logica de negocio.
- `PericoBack/src/routes/*.routes.js`: contrato HTTP de la API.

## 3. Backend: modelos y relaciones

Los modelos estan en `PericoBack/src/models`.

- `usuario.model.js`: datos comunes de una cuenta, como nombre, email, password y rol.
- `pasajero.model.js`: perfil de pasajero asociado a un usuario.
- `chofer.model.js`: perfil de chofer asociado a un usuario.
- `admin.model.js`: perfil de administrador.
- `auto.model.js`: vehiculos del sistema.
- `turnoChofer.js`: tabla intermedia que vincula choferes con autos.
- `viaje.model.js`: viaje publicado por un chofer con origen, destino, estado y asientos.
- `reserva.model.js`: reserva de un pasajero sobre un viaje.

Las asociaciones importantes estan en `relaciones.js`:

- Usuario tiene un perfil: pasajero, chofer o admin.
- Chofer tiene muchos viajes.
- Auto tiene muchos viajes.
- Pasajero tiene muchas reservas.
- Viaje tiene muchas reservas.
- Chofer y Auto se vinculan muchos-a-muchos mediante TurnoChofer.

## 4. Backend: autenticacion y roles

Archivo clave: `PericoBack/src/controllers/auth.controller.js`.

El front guarda el JWT en `sessionStorage`. En cada request, el interceptor Angular envia:

```http
Authorization: Bearer <token>
```

El backend usa:

- `verifyToken`: valida el JWT y carga `req.usuario`.
- `verificarRol(...)`: permite o bloquea la ruta segun rol.

Ejemplo:

```js
router.post('/', authCtrl.verifyToken, authCtrl.verificarRol('ADMIN', 'CHOFER'), viajeCtrl.createViaje);
```

Esto significa: primero debe estar logueado, y despues debe ser admin o chofer.

## 5. Backend: viajes

Archivo clave: `PericoBack/src/controllers/viaje.controller.js`.

Funciones principales:

- `getViajes`: lista todos los viajes con relaciones.
- `getViajesDisponibles`: devuelve viajes para el pasajero. Filtra por origen, destino, estados `ABIERTO` o `EN_CURSO`, y asientos disponibles mayores a cero.
- `createViaje`: crea un viaje desde el panel del chofer o admin.
- `changeEstado`: cambia el estado del viaje a `ABIERTO`, `EN_CURSO`, `FINALIZADO` o `CANCELADO`.
- `actualizarAsientosDisponibles`: actualiza cupos cuando se reserva, cancela o se agrega pasajero manual.

Estados usados:

- `ABIERTO`: publicado y disponible.
- `EN_CURSO`: iniciado por el chofer, pero todavia puede mostrarse si quedan asientos.
- `FINALIZADO`: terminado.
- `CANCELADO`: cancelado.

## 6. Backend: reservas y pagos

Archivo clave: `PericoBack/src/controllers/reserva.controller.js`.

Funciones principales:

- `registrarReserva`: crea una reserva y descuenta asientos dentro de una transaccion.
- `recibirNotificacionPago`: webhook publico de Mercado Pago.
- `generarQrReserva`: genera QR para cobrar una reserva pendiente.
- `registrarPagoEfectivo`: marca manualmente una reserva como pagada.
- `cancelarReserva`: cancela reserva y devuelve asientos.

Canales de pago:

- `LINK`: genera link de Mercado Pago para el pasajero.
- `QR`: genera QR para que cobre el chofer.
- `EFECTIVO`: reserva queda pendiente de pago hasta que el chofer registre el cobro.

El pago se confirma asi:

1. Se crea la reserva con `estadoPago: PENDIENTE`.
2. Mercado Pago avisa al endpoint `/api/reservas/webhook`.
3. El backend consulta Mercado Pago.
4. Si el pago esta aprobado, la reserva pasa a `PAGADO`.
5. El backend emite eventos Socket.IO para actualizar chofer y pasajero.

## 7. Socket.IO en el backend

Archivo clave: `PericoBack/index.js`.

Socket.IO permite actualizar pantallas sin recargar. Los controladores usan:

```js
req.io.emit('nombre_evento', data);
```

Eventos importantes:

- `reserva_creada_viaje_<idViaje>`
- `asientos_actualizados_viaje_<idViaje>`
- `viaje_actualizado_<idViaje>`
- `pago_confirmado_reserva_<idReserva>`
- `pago_actualizado_viaje_<idViaje>`
- `qr_generado_reserva_<idReserva>`
- `ubicacion_chofer_viaje_<idViaje>`

## 8. Tecnologias del frontend

El frontend esta hecho con Angular.

- Angular standalone components: componentes sin modulos tradicionales.
- Angular Router: navegacion por paginas.
- HttpClient: consumo de la API Express.
- Interceptor HTTP: agrega JWT automaticamente.
- Auth Guard: protege rutas por rol.
- Signals: estado reactivo de sesion en `LoginService`.
- Bootstrap: componentes visuales y modales.
- ngx-toastr: notificaciones tipo toast.
- Socket.IO client: escucha eventos en vivo.
- Leaflet: mapa interactivo.
- OpenStreetMap: tiles del mapa.
- OSRM: calculo de ruta entre chofer y pasajero.
- ng2-charts: graficos del panel admin.

## 9. Frontend: rutas y seguridad

Archivo clave: `PericoFront/proyfrontendgrupo03/src/app/app.routes.ts`.

Rutas importantes:

- `/login`: login.
- `/registro`: registro.
- `/chofer`: panel del chofer, protegido para `CHOFER` y `ADMIN`.
- `/pasajero`: panel del pasajero, protegido para `PASAJERO` y `ADMIN`.
- `/admin`: panel admin, protegido para `ADMIN`.

Archivo clave: `services/Interceptor/auth.guard.ts`.

El guard revisa:

1. Si hay usuario logueado.
2. Si el rol del usuario esta permitido para la ruta.

Archivo clave: `services/Interceptor/auth.interceptor.ts`.

El interceptor toma el token desde `LoginService` y lo agrega a cada request.

## 10. Frontend: services

Los services son la capa que habla con el backend.

- `services/login-service.ts`: login tradicional, Google login, guardar/cerrar sesion.
- `services/pasajero.service.ts`: viajes disponibles, reservas, cancelacion e historial.
- `services/chofer.service.ts`: datos del chofer, autos, viajes, QR, pagos y ubicacion.
- `services/socket.service.ts`: conexion Socket.IO.
- `services/geolocalizacion.service.ts`: API nativa del navegador para ubicacion.
- `services/ruta.service.ts`: llamada a OSRM para calcular ruta.

Idea clave: los componentes no deberian construir URLs directamente. Para eso estan los services.

## 11. Frontend: panel del pasajero

Archivo clave: `pages/pasajero/pasajero.ts`.

Responsabilidades:

- Cargar datos del pasajero.
- Detectar reserva activa.
- Buscar viajes disponibles.
- Crear reserva con Mercado Pago o efectivo.
- Cancelar reserva con modal.
- Escuchar sockets de pago, cancelacion, estado de viaje y asientos.
- Mostrar mapa y calcular ruta hacia el chofer.

Archivo visual:

- `pages/pasajero/pasajero.html`
- `pages/pasajero/pasajero.scss`

Flujo de reserva:

1. Usuario elige origen, destino y asientos.
2. Click en Mercado Pago o Efectivo.
3. `crearReserva` arma el DTO.
4. `PasajeroService.crearReserva` llama al backend.
5. Backend descuenta asientos y responde.
6. Front actualiza listado y reserva activa.
7. Si es Mercado Pago, abre el link.

## 12. Frontend: panel del chofer

Archivo clave: `pages/chofer/chofer.ts`.

Responsabilidades:

- Cargar chofer, autos y viajes.
- Cambiar disponibilidad.
- Crear viaje.
- Iniciar, finalizar o cancelar viaje.
- Agregar pasajero manual.
- Gestionar autos.
- Generar QR de cobro.
- Registrar pago en efectivo.
- Compartir ubicacion.
- Escuchar sockets de reservas, pagos y cambios de asientos.

Archivo visual:

- `pages/chofer/chofer.html`
- `pages/chofer/chofer.scss`

Flujo de viaje:

1. Chofer debe tener auto asignado/disponible.
2. Elige origen y destino.
3. Crea viaje.
4. El viaje queda `ABIERTO`.
5. Pasajeros lo encuentran si el recorrido coincide y quedan asientos.
6. Chofer puede iniciar viaje: pasa a `EN_CURSO`.
7. Chofer puede finalizar: reservas asociadas se actualizan y el viaje deja de estar activo.

## 13. Frontend: mapa y ubicacion

Archivos clave:

- `components/mapa-ruta/mapa-ruta.ts`
- `services/geolocalizacion.service.ts`
- `services/ruta.service.ts`

Como funciona:

1. El chofer comparte su ubicacion con la API nativa `navigator.geolocation`.
2. Backend guarda latitud/longitud y emite evento por Socket.IO.
3. Pasajero recibe la ubicacion del chofer.
4. Pasajero puede pedir "Como llegar".
5. `RutaService` consulta OSRM.
6. `MapaRutaComponent` dibuja chofer, pasajero y ruta usando Leaflet.

## 14. Flujo completo de datos

Ejemplo: pasajero reserva un viaje.

1. Front pasajero llama a `PasajeroService.crearReserva`.
2. Backend `reserva.controller.registrarReserva` valida viaje y asientos.
3. Sequelize crea reserva y actualiza asientos en PostgreSQL.
4. Backend emite `asientos_actualizados_viaje_<idViaje>`.
5. Chofer y pasajero reciben el evento por Socket.IO.
6. Las pantallas actualizan los cupos.
7. Si hay pago Mercado Pago, el webhook completa `estadoPago`.

## 15. Donde buscar cuando algo falla

- No entra a una pagina: revisar `auth.guard.ts`, rol del usuario y `app.routes.ts`.
- API responde 401/403: revisar JWT, `auth.interceptor.ts`, `auth.controller.js` y roles en routes.
- Viaje no aparece al pasajero: revisar `getViajesDisponibles`, estado del viaje, origen/destino y asientos.
- Reserva no descuenta asientos: revisar `registrarReserva` y eventos `asientos_actualizados_viaje_*`.
- Pago no impacta: revisar `.env`, token de Mercado Pago, `notification_url`, ngrok y `recibirNotificacionPago`.
- QR no aparece: revisar `generarQrReserva`, `ChoferService.generarQrCobro` y `qr_generado_reserva_*`.
- Mapa no carga: revisar permisos de ubicacion, `GeolocationService`, `RutaService` y `MapaRutaComponent`.

## 16. Comandos utiles

Backend:

```bash
cd PericoBack
npm install
npm start
```

Frontend:

```bash
cd PericoFront/proyfrontendgrupo03
npm install
npm start
```

Validaciones usadas durante correcciones:

```bash
npx tsc --noEmit
node --check PericoBack/src/controllers/viaje.controller.js
node --check PericoBack/src/controllers/reserva.controller.js
git diff --check
```

## 17. Recomendaciones para seguir el proyecto

- Empezar leyendo `app.routes.ts` para entender pantallas.
- Luego leer los services del front para saber que endpoint consume cada pantalla.
- En backend, revisar primero routes y despues controller.
- Si un controller usa `include`, revisar el alias en `models/relaciones.js`.
- Si hay un cambio que debe verse en vivo, buscar el evento Socket.IO emitido y escuchado.
- Si se agrega un endpoint nuevo, agregar ruta, controller, service Angular y comentario breve.
