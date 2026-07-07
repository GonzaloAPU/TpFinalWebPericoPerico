from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageBreak,
    PageTemplate,
    Paragraph,
    Preformatted,
    Spacer,
    Table,
    TableStyle,
)


OUTPUT = "output/pdf/informe_tecnico_perico_perico.pdf"


def on_page(canvas, doc):
    canvas.saveState()
    width, height = A4
    canvas.setFillColor(colors.HexColor("#0B5CAD"))
    canvas.rect(0, height - 1.05 * cm, width, 1.05 * cm, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 9)
    canvas.drawString(1.5 * cm, height - 0.65 * cm, "Perico-Perico - Informe tecnico")
    canvas.setFillColor(colors.HexColor("#666666"))
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(width - 1.5 * cm, 0.75 * cm, f"Pagina {doc.page}")
    canvas.restoreState()


def build_doc():
    doc = BaseDocTemplate(
        OUTPUT,
        pagesize=A4,
        leftMargin=1.45 * cm,
        rightMargin=1.45 * cm,
        topMargin=1.65 * cm,
        bottomMargin=1.25 * cm,
        title="Informe tecnico Perico-Perico",
        author="Codex",
    )
    frame = Frame(
        doc.leftMargin,
        doc.bottomMargin,
        doc.width,
        doc.height,
        id="normal",
    )
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=on_page)])
    return doc


styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="CoverTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=28,
        leading=34,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#073B70"),
        spaceAfter=16,
    )
)
styles.add(
    ParagraphStyle(
        name="CoverSub",
        parent=styles["BodyText"],
        fontSize=12,
        leading=17,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#333333"),
        spaceAfter=8,
    )
)
styles.add(
    ParagraphStyle(
        name="H1x",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=17,
        leading=21,
        textColor=colors.HexColor("#073B70"),
        spaceBefore=10,
        spaceAfter=8,
    )
)
styles.add(
    ParagraphStyle(
        name="H2x",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12.5,
        leading=16,
        textColor=colors.HexColor("#0B5CAD"),
        spaceBefore=8,
        spaceAfter=5,
    )
)
styles.add(
    ParagraphStyle(
        name="BodyX",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9.4,
        leading=13.5,
        textColor=colors.HexColor("#222222"),
        spaceAfter=6,
    )
)
styles.add(
    ParagraphStyle(
        name="SmallX",
        parent=styles["BodyText"],
        fontSize=8.3,
        leading=11.5,
        textColor=colors.HexColor("#555555"),
    )
)
styles.add(
    ParagraphStyle(
        name="CodeExplain",
        parent=styles["BodyText"],
        fontSize=8.8,
        leading=12.2,
        leftIndent=8,
        textColor=colors.HexColor("#333333"),
        spaceBefore=3,
        spaceAfter=8,
    )
)


def p(text, style="BodyX"):
    return Paragraph(text, styles[style])


def code_block(code):
    block = Preformatted(
        code.strip(),
        ParagraphStyle(
            name="Code",
            fontName="Courier",
            fontSize=7.2,
            leading=9,
            textColor=colors.HexColor("#1f2933"),
        ),
        maxLineLength=94,
    )
    table = Table([[block]], colWidths=[18.1 * cm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F4F7FB")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#C8D5E6")),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return table


def bullet(items):
    story = []
    for item in items:
        story.append(p(f"- {item}"))
    return story


story = []

story.append(Spacer(1, 3.2 * cm))
story.append(p("Perico-Perico", "CoverTitle"))
story.append(p("Informe tecnico del proyecto", "CoverSub"))
story.append(p("Backend, frontend, tecnologias aplicadas y fragmentos de codigo explicados", "CoverSub"))
story.append(Spacer(1, 1.2 * cm))
story.append(
    Table(
        [
            ["Rol", "Funciones principales"],
            ["Pasajero", "Busca viajes, reserva asientos, paga, cancela y consulta ubicacion/ruta."],
            ["Chofer", "Publica viajes, administra autos, cobra, comparte ubicacion y gestiona asientos."],
            ["Admin", "Gestiona usuarios, datos operativos y permisos ampliados."],
        ],
        colWidths=[3.2 * cm, 13.8 * cm],
    )
)
story[-1].setStyle(
    TableStyle(
        [
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0B5CAD")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CAD6E2")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#F8FBFF")),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("LEADING", (0, 0), (-1, -1), 12),
            ("PADDING", (0, 0), (-1, -1), 6),
        ]
    )
)
story.append(PageBreak())

story.append(p("1. Arquitectura general", "H1x"))
story.append(
    p(
        "La aplicacion esta separada en dos capas: <b>PericoBack</b>, que expone una API REST con Express y guarda datos en PostgreSQL usando Sequelize, y <b>PericoFront/proyfrontendgrupo03</b>, que muestra la interfaz Angular para pasajero, chofer y admin."
    )
)
story.extend(
    bullet(
        [
            "<b>Backend:</b> Express, Sequelize, PostgreSQL, JWT, Socket.IO, Mercado Pago, Swagger.",
            "<b>Frontend:</b> Angular standalone components, Router, HttpClient, guards, interceptors, Toastr, Leaflet, OSRM, Socket.IO client.",
            "<b>Comunicacion:</b> el front consume endpoints HTTP y recibe actualizaciones en vivo por Socket.IO.",
        ]
    )
)

story.append(p("2. Estructura de carpetas", "H1x"))
story.append(p("<b>Backend:</b>"))
story.extend(
    bullet(
        [
            "<b>PericoBack/index.js:</b> arranque del servidor, CORS, Socket.IO, Swagger y rutas.",
            "<b>PericoBack/config/database.js:</b> conexion Sequelize a PostgreSQL.",
            "<b>PericoBack/src/models:</b> modelos de base de datos.",
            "<b>PericoBack/src/models/relaciones.js:</b> asociaciones entre modelos.",
            "<b>PericoBack/src/routes:</b> rutas HTTP.",
            "<b>PericoBack/src/controllers:</b> logica de negocio.",
        ]
    )
)
story.append(p("<b>Frontend:</b>"))
story.extend(
    bullet(
        [
            "<b>src/app/app.routes.ts:</b> rutas Angular y roles permitidos.",
            "<b>src/app/services:</b> capa de consumo de API y utilidades.",
            "<b>src/app/pages/chofer:</b> panel del chofer.",
            "<b>src/app/pages/pasajero:</b> panel del pasajero.",
            "<b>src/app/components/mapa-ruta:</b> mapa con Leaflet y ruta OSRM.",
        ]
    )
)

story.append(p("3. Autenticacion JWT y roles", "H1x"))
story.append(
    p(
        "El backend protege rutas privadas con JWT. El front guarda el token en sessionStorage y lo envia en el header Authorization. El middleware <b>verifyToken</b> valida el token y deja los datos del usuario en <b>req.usuario</b>. Despues, <b>verificarRol</b> decide si el rol puede usar esa ruta."
    )
)
story.append(
    code_block(
        """
authCtrl.verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'Unauthorized request: No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized request: Invalid or expired token.' });
    }
}
        """
    )
)
story.append(
    p(
        "<b>Explicacion:</b> si el token es valido, el controlador siguiente puede saber quien esta logueado y que rol tiene. Esto evita que un chofer cree viajes para otro chofer o que un pasajero cancele reservas ajenas.",
        "CodeExplain",
    )
)

story.append(p("4. Interceptor Angular", "H1x"))
story.append(
    p(
        "El interceptor evita repetir codigo en cada service. Antes de cada request HTTP, busca el token y clona la peticion agregando Authorization: Bearer."
    )
)
story.append(
    code_block(
        """
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const loginService = inject(LoginService);
  const token = loginService.obtenerToken();

  if (token) {
    const peticionClonada = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(peticionClonada);
  }
  return next(req);
};
        """
    )
)
story.append(
    p(
        "<b>Explicacion:</b> por esto los services no tienen que agregar el JWT manualmente. Si hay sesion, todas las llamadas a la API ya salen autenticadas.",
        "CodeExplain",
    )
)

story.append(PageBreak())
story.append(p("5. Busqueda de viajes disponibles", "H1x"))
story.append(
    p(
        "El pasajero consulta /api/viajes/disponibles. El backend filtra por origen, destino, estado y cupos. Se permiten viajes ABIERTO y EN_CURSO porque un chofer puede estar trabajando y todavia tener asientos libres."
    )
)
story.append(
    code_block(
        """
const viajes = await Viaje.findAll({
    where: {
        origen: { [Op.iLike]: origenNormalizado },
        destino: { [Op.iLike]: destinoNormalizado },
        estadoViaje: { [Op.in]: ['ABIERTO', 'EN_CURSO'] },
        asientosDisponibles: { [Op.gt]: 0 }
    },
    include: [
        { association: 'chofer', include: [{ association: 'usuario' }] },
        { association: 'auto' },
        { association: 'reservas' }
    ]
});
        """
    )
)
story.append(
    p(
        "<b>Explicacion:</b> iLike evita errores por mayusculas/minusculas. Op.in permite varios estados. Op.gt asegura que solo aparezcan viajes con al menos un asiento.",
        "CodeExplain",
    )
)

story.append(p("6. Creacion de reservas con transaccion", "H1x"))
story.append(
    p(
        "La reserva y el descuento de asientos se hacen dentro de una transaccion. Esto es importante porque evita que dos pasajeros tomen el ultimo asiento al mismo tiempo."
    )
)
story.append(
    code_block(
        """
viaje = await Viaje.findByPk(req.body.idViaje, {
  transaction,
  lock: true,
});

if (!['ABIERTO', 'EN_CURSO'].includes(viaje.estadoViaje)) {
  await transaction.rollback();
  return res.status(400).json({ mensaje: 'El viaje no esta disponible para reservas' });
}

if (viaje.asientosDisponibles < cantidadSolicitada) {
  await transaction.rollback();
  return res.status(400).json({ mensaje: 'No hay suficientes asientos disponibles' });
}

reserva = await Reserva.create(req.body, { transaction });
viaje.asientosDisponibles -= cantidadSolicitada;
await viaje.save({ transaction });
await transaction.commit();
        """
    )
)
story.append(
    p(
        "<b>Explicacion:</b> se bloquea el viaje mientras se valida y actualiza. Si algo falla, rollback deja la base como estaba. Si todo sale bien, commit confirma reserva y cupos.",
        "CodeExplain",
    )
)

story.append(p("7. Eventos Socket.IO", "H1x"))
story.append(
    p(
        "Socket.IO mantiene sincronizadas las pantallas. Cuando cambia un viaje, reserva, pago o ubicacion, el backend emite un evento con un nombre que incluye el id afectado."
    )
)
story.append(
    code_block(
        """
req.io.emit(`asientos_actualizados_viaje_${viaje.idViaje}`, {
  idViaje: viaje.idViaje,
  asientosDisponibles: viaje.asientosDisponibles,
  viaje,
});
        """
    )
)
story.append(
    p(
        "<b>Explicacion:</b> el id en el nombre del evento evita mezclar actualizaciones entre viajes. El front escucha solo los eventos de las reservas o viajes que esta mostrando.",
        "CodeExplain",
    )
)

story.append(PageBreak())
story.append(p("8. Frontend del pasajero", "H1x"))
story.append(
    p(
        "El componente del pasajero carga su perfil, detecta reserva activa, busca viajes, crea reservas y escucha cambios en vivo."
    )
)
story.append(
    code_block(
        """
this._pasajeroService.getViajesDisponibles(this.origen, this.destino).subscribe({
  next: (data) => {
    this.viajesDisponibles = data as ViajeCard[];
    this.registrarEventosDeViajesDisponibles();
    this.buscando = false;
    this._changeDetectorRef.detectChanges();
  },
  error: (err) => {
    this.buscando = false;
    this.mensaje = 'No se pudieron cargar los viajes disponibles.';
  }
});
        """
    )
)
story.append(
    p(
        "<b>Explicacion:</b> el componente no arma la URL de la API; delega eso al PasajeroService. Despues registra eventos Socket.IO para actualizar tarjetas cuando cambian asientos o estado.",
        "CodeExplain",
    )
)

story.append(p("9. Frontend del chofer", "H1x"))
story.append(
    p(
        "El componente del chofer carga auto, viaje actual y reservas. Tambien crea viajes, inicia/finaliza, comparte ubicacion y cobra con QR o efectivo."
    )
)
story.append(
    code_block(
        """
get reservasPendientesPago(): any[] {
  return (this.viajeActual?.reservas || []).filter((reserva) =>
    reserva.estadoPago !== 'PAGADO' &&
    reserva.estadoReserva !== 'CANCELADA' &&
    reserva.estadoReserva !== 'UTILIZADA'
  );
}
        """
    )
)
story.append(
    p(
        "<b>Explicacion:</b> este getter alimenta la seccion Cobros pendientes. Solo muestra reservas que todavia necesitan cobro y siguen activas.",
        "CodeExplain",
    )
)

story.append(p("10. Cobro QR con Mercado Pago", "H1x"))
story.append(
    p(
        "El chofer puede generar un QR para una reserva pendiente. El backend llama a Mercado Pago y tambien convierte qr_data en una imagen base64 para mostrarla en Angular."
    )
)
story.append(
    code_block(
        """
const qrImage = responseMp.qr_data
  ? await QRCode.toDataURL(responseMp.qr_data)
  : null;

req.io.emit(`qr_generado_reserva_${reserva.idReserva}`, {
  idReserva: reserva.idReserva,
  idViaje: reserva.idViaje,
  qr_data: responseMp.qr_data,
  qr_image: qrImage
});
        """
    )
)
story.append(
    p(
        "<b>Explicacion:</b> qr_data es la informacion de pago. qr_image permite que el front muestre directamente un QR escaneable sin instalar otra libreria.",
        "CodeExplain",
    )
)

story.append(PageBreak())
story.append(p("11. Webhook de Mercado Pago", "H1x"))
story.append(
    p(
        "Mercado Pago avisa al backend cuando un pago se aprueba. Para link de pago llega como payment; para QR puede llegar como merchant_order. El backend marca la reserva como PAGADO y emite eventos."
    )
)
story.append(
    code_block(
        """
if (pagoInfo && pagoInfo.status === 'approved') {
  const idReservaLocal = pagoInfo.external_reference;
  const reservaLocal = await Reserva.findByPk(idReservaLocal);

  reservaLocal.estadoPago = 'PAGADO';
  reservaLocal.estadoReserva = 'CONFIRMADA';
  await reservaLocal.save();

  req.io.emit(`pago_confirmado_reserva_${idReservaLocal}`, {
    idReserva: idReservaLocal,
    estadoPago: 'PAGADO',
    estadoReserva: 'CONFIRMADA'
  });
}
        """
    )
)
story.append(
    p(
        "<b>Explicacion:</b> external_reference conecta el pago de Mercado Pago con la reserva local. El evento permite que pasajero y chofer vean el pago confirmado con toast o actualizacion de pantalla.",
        "CodeExplain",
    )
)

story.append(p("12. Mapa, ubicacion y ruta", "H1x"))
story.append(
    p(
        "La ubicacion usa la API nativa del navegador. El mapa usa Leaflet con tiles de OpenStreetMap. Para calcular como llegar, el front consulta OSRM y dibuja el GeoJSON en el mapa."
    )
)
story.append(
    code_block(
        """
obtenerRuta(origen: CoordenadaMapa, destino: CoordenadaMapa): Observable<any> {
  const coordenadas = `${origen.longitud},${origen.latitud};${destino.longitud},${destino.latitud}`;

  return this._http.get<any>(`${this.osrmUrl}/${coordenadas}`, {
    params: {
      overview: 'full',
      geometries: 'geojson',
      steps: 'true'
    }
  });
}
        """
    )
)
story.append(
    p(
        "<b>Explicacion:</b> OSRM espera coordenadas como longitud,latitud. La respuesta incluye una geometria GeoJSON que el componente de mapa puede dibujar como linea.",
        "CodeExplain",
    )
)

story.append(p("13. Guia rapida para debug", "H1x"))
story.extend(
    bullet(
        [
            "<b>No entra a una pagina:</b> revisar app.routes.ts, auth.guard.ts y el rol guardado en sessionStorage.",
            "<b>API devuelve 401/403:</b> revisar auth.interceptor.ts, JWT y roles en routes.",
            "<b>Viaje no aparece:</b> revisar origen, destino, estado ABIERTO/EN_CURSO y asientosDisponibles.",
            "<b>Pago no impacta:</b> revisar NGROK_URL, webhook /api/reservas/webhook y tokens Mercado Pago.",
            "<b>Mapa no muestra ruta:</b> revisar permisos de ubicacion, RutaService y respuesta de OSRM.",
        ]
    )
)

story.append(p("14. Archivos recomendados para estudiar primero", "H1x"))
story.extend(
    bullet(
        [
            "Frontend: app.routes.ts, login-service.ts, pasajero.service.ts, chofer.service.ts.",
            "Frontend: pages/pasajero/pasajero.ts y pages/chofer/chofer.ts.",
            "Backend: routes/viaje.routes.js, routes/reserva.routes.js.",
            "Backend: controllers/viaje.controller.js, controllers/reserva.controller.js, controllers/auth.controller.js.",
            "Base de datos: models/relaciones.js.",
        ]
    )
)


if __name__ == "__main__":
    doc = build_doc()
    doc.build(story)
