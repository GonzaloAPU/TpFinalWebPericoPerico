const { Reserva } = require('../models/relaciones');
const { MercadoPagoConfig, Payment, MerchantOrder, Preference} = require('mercadopago'); 

// Inicialización del cliente con Access Token usando variables de entorno (.env)
const clientQR = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN_QR });
const clientLink = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN_LINK });

const reservaCtrl = {};

reservaCtrl.registrarReserva = async (req, res) => {
  try {
    const { tipoCanal } = req.query;

    if (!tipoCanal || (tipoCanal !== 'QR' && tipoCanal !== 'LINK')) {
      return res.status(400).json({
        mensaje: 'Error de validación',
        error: "Es obligatorio enviar el parámetro 'tipoCanal' en la URL con el valor 'QR' o 'LINK'."
      });
    }

    const reserva = await Reserva.create(req.body);
    const cantidad = parseInt(reserva.cantidadAsientos) || 1;
    const total = parseFloat(reserva.importeTotal);
    const precioUnitario = total / cantidad;

    // OPCIÓN 1: Link de pago
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

      return res.status(201).json({
        mensaje: 'Reserva creada con éxito (Link)',
        reserva: reserva,
        tipoPago: 'ENLACE',
        url_pago: preferenceResponse.init_point,
        qr_data: null
      });
    }

    // OPCION 2: QR
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

    return res.status(201).json({
      mensaje: 'Reserva creada con éxito (QR)',
      reserva: reserva,
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
            // ─── CONTROL DE CONTROL: Si ya estaba pagada, la ignoramos de forma segura ───
            if (reservaLocal.estadoPago === 'PAGADO') {
              return; 
            }

            reservaLocal.estadoPago = 'PAGADO';
            reservaLocal.estadoReserva = 'CONFIRMADA';
            await reservaLocal.save();
            console.log(`[BACKEND] ÉXITO: Reserva #${idReservaLocal} marcada como PAGADA mediante Orden.`);
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
          console.log(`[BACKEND] ÉXITO: Reserva #${idReservaLocal} marcada como PAGADA mediante Payment.`);
        }
      }
    } else {
      console.log(`[BACKEND] Notificación ignorada: Tipo de evento no configurado.`);
    }
  } catch (error) {
    console.error('Error crítico en el Webhook:', error.message);
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

module.exports = reservaCtrl;