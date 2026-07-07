const { MercadoPagoConfig, Payment, MerchantOrder, Preference} = require('mercadopago'); 
const { sequelize, Reserva, Viaje } = require('../models/relaciones');

// Inicialización del cliente con Access Token usando variables de entorno (.env)
const clientQR = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN_QR });
const clientLink = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN_LINK });

const reservaCtrl = {};

const estadosReservaValidos = [
  'PENDIENTE',
  'CONFIRMADA',
  'CANCELADA',
  'UTILIZADA',
  'NO_PRESENTADO',
];

const cancelarReservaConTransaccion = async (idReserva, transaction) => {
  const reserva = await Reserva.findByPk(idReserva, {
    transaction,
    lock: true,
  });

  if (!reserva) {
    return { error: { status: 404, body: { mensaje: 'Reserva no encontrada' } } };
  }

  if (reserva.estadoReserva === 'CANCELADA') {
    return { error: { status: 400, body: { mensaje: 'La reserva ya se encuentra cancelada' } } };
  }

  const viaje = await Viaje.findByPk(reserva.idViaje, {
    transaction,
    lock: true,
  });

  if (!viaje) {
    return { error: { status: 404, body: { mensaje: 'Viaje de la reserva no encontrado' } } };
  }

  // Al cancelar se devuelven al viaje los asientos que tenia tomada la reserva.
  reserva.estadoReserva = 'CANCELADA';
  viaje.asientosDisponibles += reserva.cantidadAsientos;

  await reserva.save({ transaction });
  await viaje.save({ transaction });

  return { reserva, viaje };
};

const emitirReservaCreada = (req, reserva) => {
  if (!req.io) return;

  req.io.emit(`reserva_creada_viaje_${reserva.idViaje}`, {
    idReserva: reserva.idReserva,
    idViaje: reserva.idViaje,
    reserva,
  });
};

const emitirReservaCancelada = (req, reserva, viaje) => {
  if (!req.io) return;

  req.io.emit(`reserva_cancelada_${reserva.idReserva}`, {
    idReserva: reserva.idReserva,
    idViaje: reserva.idViaje,
    reserva,
    viaje,
  });

  req.io.emit(`asientos_actualizados_viaje_${viaje.idViaje}`, {
    idViaje: viaje.idViaje,
    asientosDisponibles: viaje.asientosDisponibles,
    viaje,
  });
};

reservaCtrl.registrarReserva = async (req, res) => {
  try {
    const { tipoCanal } = req.query;

    if (!tipoCanal || !['QR', 'LINK', 'EFECTIVO'].includes(tipoCanal)) {
      return res.status(400).json({
        mensaje: 'Error de validación',
        error: "Es obligatorio enviar el parámetro 'tipoCanal' en la URL con el valor 'QR', 'LINK' o 'EFECTIVO'."
      });
    }

    const transaction = await sequelize.transaction();
    let reserva;
    let viaje;

    try {
      const cantidadSolicitada = Number(req.body.cantidadAsientos) || 1;

      viaje = await Viaje.findByPk(req.body.idViaje, {
        transaction,
        lock: true,
      });

      if (!viaje) {
        await transaction.rollback();
        return res.status(404).json({
          mensaje: 'Viaje no encontrado',
        });
      }

      if (viaje.estadoViaje !== 'ABIERTO') {
        await transaction.rollback();
        return res.status(400).json({
          mensaje: 'El viaje no esta disponible para reservas',
        });
      }

      if (viaje.asientosDisponibles < cantidadSolicitada) {
        await transaction.rollback();
        return res.status(400).json({
          mensaje: 'No hay suficientes asientos disponibles',
        });
      }

      reserva = await Reserva.create(req.body, { transaction });
      viaje.asientosDisponibles -= cantidadSolicitada;
      await viaje.save({ transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      return res.status(400).json({
        mensaje: 'Error al crear reserva',
        error: error.message,
      });
    }

    if (req.io) {
      req.io.emit(`asientos_actualizados_viaje_${viaje.idViaje}`, {
        idViaje: viaje.idViaje,
        asientosDisponibles: viaje.asientosDisponibles,
        viaje,
      });
    }

    const cantidad = parseInt(reserva.cantidadAsientos) || 1;
    const total = parseFloat(reserva.importeTotal);
    const precioUnitario = total / cantidad;

    // OPCION 1: Pago en efectivo
    if (tipoCanal === 'EFECTIVO') {
      emitirReservaCreada(req, reserva);

      return res.status(201).json({
        mensaje: 'Reserva creada con éxito para pago en efectivo',
        reserva: reserva,
        asientosDisponibles: viaje.asientosDisponibles,
        tipoPago: 'EFECTIVO',
        url_pago: null,
        qr_data: null
      });
    }

    // OPCIÓN 2: Link de pago
    if (tipoCanal === 'LINK') {
      const baseUrl = process.env.NGROK_URL || 'https://grunge-altitude-gratified.ngrok-free.dev';
      const preferenceInstance = new Preference(clientLink);
      const preferenceData = {
        body: {
          external_reference: String(reserva.idReserva),
          items: [
            {
              title: `Reserva de ${cantidad} asiento(s) - Viaje #${reserva.idViaje}`,
              quantity: cantidad,
              unit_price: parseFloat(precioUnitario.toFixed(2)),
              currency_id: 'ARS'
            }
          ],
          notification_url: `${baseUrl}/api/reservas/webhook`,
          back_urls: {
            success: `${baseUrl}/api/reservas/success`,
            failure: `${baseUrl}/api/reservas/failure`,
            pending: `${baseUrl}/api/reservas/pending`
          },
          auto_return: "approved"
        }
      };

      const preferenceResponse = await preferenceInstance.create(preferenceData);
      emitirReservaCreada(req, reserva);

      return res.status(201).json({
        mensaje: 'Reserva creada con éxito (Link)',
        reserva: reserva,
        asientosDisponibles: viaje.asientosDisponibles,
        tipoPago: 'ENLACE',
        url_pago: preferenceResponse.init_point,
        qr_data: null
      });
    }

    // OPCION 3: QR
    const qrData = {
      external_reference: String(reserva.idReserva),
      title: `Taxi Viaje #${reserva.idViaje} - Reserva #${reserva.idReserva}`,
      description: `Pago de reserva de taxi - Viaje ID: ${reserva.idViaje}`, 
      total_amount: total, 
      items: [
        {
          title: `Reserva de ${cantidad} asiento(s) - Taxi`, 
          description: `Reserva de ${cantidad} asiento(s) para el viaje #${reserva.idViaje}`, 
          unit_price: parseFloat(precioUnitario.toFixed(2)), 
          quantity: cantidad, 
          unit_measure: 'unit',
          total_amount: total
        }
      ]
    };

    const user_id = '258168003'; // ID de usuario
    const external_pos_id = 'CAJA001';  // ID de la caja 

    const response = await fetch(`https://api.mercadopago.com/instore/orders/qr/seller/collectors/${user_id}/pos/${external_pos_id}/qrs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN_QR}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(qrData)
    });

    const responseMp = await response.json();
    if (!response.ok) {
      return res.status(400).json({
        mensaje: 'Error en la petición a Mercado Pago',
        error: responseMp.message || 'Error desconocido'
      });
    }

    emitirReservaCreada(req, reserva);

    return res.status(201).json({
      mensaje: 'Reserva creada con éxito (QR)',
      reserva: reserva,
      asientosDisponibles: viaje.asientosDisponibles,
      tipoPago: 'QR',
      url_pago: null,
      qr_data: responseMp.qr_data 
    });
  } catch (error) {
    res.status(400).json({
      mensaje: 'Error al crear reserva',
      error: error.message
    });
  }
};


reservaCtrl.recibirNotificacionPago = async (req, res) => {
  try {
    const { topic, type } = req.query;
    
    res.status(200).send('OK');  // Respuesta rapida a MercadoPago

    const tipoNotificacion = type || topic || req.body.type; 
    const resourceId = req.query['data.id'] || req.body.data?.id || req.query.id || req.body.id;  

    // Si llega la orden de compra ( QR In-Store / QR Fijo / QR Dinámico)
    if (tipoNotificacion === 'topic_merchant_order_wh' || tipoNotificacion === 'merchant_order') {
      const merchantOrderInstance = new MerchantOrder(clientQR);
      let ordenInfo;
      try {
        ordenInfo = await merchantOrderInstance.get({ merchantOrderId: resourceId });
      } catch (err) {
        console.error(`[BACKEND] Error al consultar la Orden en MP:`, err.message);
        return;
      }

      if (ordenInfo && (ordenInfo.status === 'closed' || ordenInfo.order_status === 'paid')) {
        const idReservaLocal = ordenInfo.external_reference;

        if (idReservaLocal) {
          const reservaLocal = await Reserva.findByPk(idReservaLocal);
          if (reservaLocal) {
            if (reservaLocal.estadoPago === 'PAGADO') {
              return; 
            }

            reservaLocal.estadoPago = 'PAGADO';
            reservaLocal.estadoReserva = 'CONFIRMADA';
            await reservaLocal.save();
            await reservaLocal.reload();
            console.log(`[BACKEND] ÉXITO: Reserva #${idReservaLocal} marcada como PAGADA mediante Orden.`);

            // Emision en tiempo real via WEBSOCKEt al chofer (CANAL QR)
            req.io.emit(`pago_confirmado_reserva_${idReservaLocal}`, {
              idReserva: idReservaLocal,
              estadoPago: 'PAGADO',
              estadoReserva: 'CONFIRMADA'
            });
          } else {
            console.log(`[BACKEND] No se encontró la reserva #${idReservaLocal} en la BD.`);
          }
        }
      }
    } 
    
    // Estructura para pagos directos (Links de Pago)
    else if (tipoNotificacion === 'payment') {
      const paymentInstanceOnline = new Payment(clientLink); 
      let pagoInfo;
      try {
        pagoInfo = await paymentInstanceOnline.get({ id: resourceId });
      } catch (err) {
        console.error(`[BACKEND] Error al consultar el Pago en MP:`, err.message);
        return;
      }

      if (pagoInfo && pagoInfo.status === 'approved') {
        const idReservaLocal = pagoInfo.external_reference;
        const reservaLocal = await Reserva.findByPk(idReservaLocal);
        if (reservaLocal) {
          if (reservaLocal.estadoPago === 'PAGADO') {
            return; 
          }
          reservaLocal.estadoPago = 'PAGADO';
          reservaLocal.estadoReserva = 'CONFIRMADA';
          await reservaLocal.save();
          await reservaLocal.reload();
          console.log(`[BACKEND] ÉXITO: Reserva #${idReservaLocal} marcada como PAGADA mediante Payment.`);

          // Emision en tiempo real via WEBSOCKEt al chofer (CANAL LINK)
          req.io.emit(`pago_confirmado_reserva_${idReservaLocal}`, {
            idReserva: idReservaLocal,
            estadoPago: 'PAGADO',
            estadoReserva: 'CONFIRMADA'
          });
        }
      }
    } else {
      console.log(`[BACKEND] Notificación ignorada: Tipo de evento no configurado.`);
    }
  } catch (error) {
    console.error('Error crítico en el Webhook:', error.message);
  }
};


reservaCtrl.generarQrReserva= async (req, res) => {
  try {
    const { idReserva } = req.params; 

    // Busqueda de la reserva solicitada 
    const reserva = await Reserva.findByPk(idReserva);
    if (!reserva) {
      return res.status(404).json({
        mensaje: 'Error de búsqueda',
        error: `No se encontró ninguna reserva con el ID #${idReserva}`
      });
    }

    // Validamos que no intenten cobrar algo que ya se pagó
    if (reserva.estadoPago === 'PAGADO') {
      return res.status(400).json({
        mensaje: 'Validación de pago fallida',
        error: 'Esta reserva ya ha sido abonada previamente.'
      });
    }

    const cantidad = parseInt(reserva.cantidadAsientos) || 1;
    const total = parseFloat(reserva.importeTotal);
    const precioUnitario = total / cantidad;

    const qrData = {
      external_reference: String(reserva.idReserva),
      title: `Taxi Viaje #${reserva.idViaje} - Reserva #${reserva.idReserva}`,
      description: `Pago en viaje de reserva existente - Viaje ID: ${reserva.idViaje}`, 
      total_amount: total, 
      items: [
        {
          title: `Reserva de ${cantidad} asiento(s) - Taxi`, 
          description: `Reserva de ${cantidad} asiento(s) para el viaje #${reserva.idViaje}`, 
          unit_price: parseFloat(precioUnitario.toFixed(2)), 
          quantity: cantidad, 
          unit_measure: 'unit',
          total_amount: total
        }
      ]
    };

    const user_id = '258168003'; 
    const external_pos_id = 'CAJA001';  

    const response = await fetch(`https://api.mercadopago.com/instore/orders/qr/seller/collectors/${user_id}/pos/${external_pos_id}/qrs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN_QR}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(qrData)
    });

    const responseMp = await response.json();
    if (!response.ok) {
      return res.status(400).json({
        mensaje: 'Error en la petición a Mercado Pago',
        error: responseMp.message || 'Error desconocido'
      });
    }

    return res.status(200).json({
      mensaje: 'Código QR generado con éxito para el chofer',
      idReserva: reserva.idReserva,
      tipoPago: 'QR',
      qr_data: responseMp.qr_data 
    });

  } catch (error) {
    res.status(500).json({ 
      mensaje: 'Error al generar QR para reserva existente', 
      error: error.message 
    });
  }
};



reservaCtrl.registrarPagoEfectivo = async (req, res) => {
  try {
    const { idReserva } = req.params; 

    const reserva = await Reserva.findByPk(idReserva);

    if (!reserva) {
      return res.status(404).json({
        mensaje: 'Error de búsqueda',
        error: `No se encontró ninguna reserva con el ID #${idReserva}`
      });
    }

    if (reserva.estadoPago === 'PAGADO') {  // Validacion  que no se intente marcar como pagado algo que YA está pagado
      return res.status(400).json({
        mensaje: 'Validación de pago fallida',
        error: 'Esta reserva ya figura como PAGADA en el sistema.'
      });
    }

    reserva.estadoPago = 'PAGADO';
    
    await reserva.save();

    return res.status(200).json({
      mensaje: 'El pago en efectivo fue registrado con éxito por el chofer',
      idReserva: reserva.idReserva,
      estadoPago: reserva.estadoPago,
    });

  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al registrar el pago en efectivo',
      error: error.message
    });
  }
};



reservaCtrl.obtenerReservas = async (req, res) => {
  try {
    const reservas = await Reserva.findAll({
      include: [
        {
          association: 'pasajero',
          include: ['usuario']
        },
        {
          association: 'viaje',
          include: ['chofer', 'auto']
        }
      ]
    });

    res.status(200).json(reservas);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener reservas',
      error: error.message
    });
  }
};


reservaCtrl.cambiarEstadoReserva = async (req, res) => {
  const estado = req.body.estado || req.body.estadoReserva;

  if (!estadosReservaValidos.includes(estado)) {
    return res.status(400).json({
      mensaje: 'Estado de reserva no valido',
      estadosValidos: estadosReservaValidos,
    });
  }

  const transaction = await sequelize.transaction();

  try {
    if (estado === 'CANCELADA') {
      const resultado = await cancelarReservaConTransaccion(req.params.idReserva, transaction);

      if (resultado.error) {
        await transaction.rollback();
        return res.status(resultado.error.status).json(resultado.error.body);
      }

      await transaction.commit();
      emitirReservaCancelada(req, resultado.reserva, resultado.viaje);

      return res.status(200).json({
        mensaje: 'Reserva cancelada correctamente y asientos devueltos al viaje',
        reserva: resultado.reserva,
        viaje: resultado.viaje,
      });
    }

    const reserva = await Reserva.findByPk(req.params.idReserva, { transaction });
    if (!reserva) {
      await transaction.rollback();
      return res.status(404).json({
        mensaje: 'Reserva no encontrada',
      });
    }

    reserva.estadoReserva = estado;
    await reserva.save({ transaction });
    await transaction.commit();

    return res.status(200).json({
      mensaje: 'Estado de reserva actualizado correctamente',
      reserva,
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      mensaje: 'Error al cambiar el estado de la reserva',
      error: error.message,
    });
  }
};


reservaCtrl.cancelarReserva = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const resultado = await cancelarReservaConTransaccion(req.params.idReserva, transaction);

    if (resultado.error) {
      await transaction.rollback();
      return res.status(resultado.error.status).json(resultado.error.body);
    }

    await transaction.commit();
    emitirReservaCancelada(req, resultado.reserva, resultado.viaje);

    return res.status(200).json({
      mensaje: 'Reserva cancelada correctamente y asientos devueltos al viaje',
      reserva: resultado.reserva,
      viaje: resultado.viaje,
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      mensaje: 'Error al cancelar la reserva',
      error: error.message,
    });
  }
};

module.exports = reservaCtrl;
