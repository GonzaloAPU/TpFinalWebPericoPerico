const { Reserva } = require('../models/relaciones');
const { MercadoPagoConfig, QRCode, Payment } = require('mercadopago'); //Importacion de la librería de Mercado Pago

// Inicializacion del cliente con Access Token de prueba usando variables de entorno (.env)
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN 
});

const qrCodeInstance = new QRCode(client);
const paymentInstance = new Payment(client);
const reservaCtrl = {};

reservaCtrl.registrarReserva = async (req, res) => {
  try {
    const reserva = await Reserva.create(req.body);

    // Estructura de la petición del QR dinámico para Mercado Pago
    const qrData = {
      external_reference: reserva.idReserva.toString(), // ID de tu base de datos, puente con la base de datos
      title: `Reserva de Viaje #${reserva.idReserva}`,
      description: `Pago por ${reserva.cantidadAsientos} asientos en taxi compartido.`,
      total_amount: parseFloat(reserva.importeTotal), // Debe ser tipo Number/Float
      items: [
        {
          sku_number: `RES-${reserva.idReserva}`,
          category: 'marketplace',
          title: 'Reserva Taxi Compartido',
          description: `Reserva de viaje id: ${reserva.idViaje}`,
          unit_price: parseFloat(reserva.importeTotal),
          quantity: 1,
          unit_measure: 'unit',
          total_amount: parseFloat(reserva.importeTotal)
        }
      ]
    };

    // Parámetros de Mercado Pago para generar el QR 
    const user_id = '3513568686'; 
    const external_store_id = 'TAXISC001';  //id de la sucursal
    const external_pos_id = 'CAJA001';  //id de la caja

    // Solicitud del QR a la API
    const responseMp = await qrCodeInstance.create({
      body: qrData,
      requestOptions: {
        // En estos campos pasamos la sucursal y la caja ficticia asignada
        userId: user_id,
        externalStoreId: external_store_id,
        externalPosId: external_pos_id
      }
    });

    res.status(201).json({
      mensaje: 'Reserva creada',
      reserva: reserva,
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
    // Mercado Pago envía información en la Query cuando impacta un evento
    const { topic, type } = req.query;
    res.status(200).send('OK');

    // Validacion si la notificación recibida es efectivamente un "payment" (pago)
    if (topic === 'payment' || type === 'payment') {
      const paymentId = req.query['data.id'] || req.body.data?.id;
      if (paymentId) {
        const pagoInfo = await paymentInstance.get({ id: paymentId });  // Consultamos a Mercado Pago los detalles de ese pago
        if (pagoInfo.status === 'approved') {  //pago aprobado
          const idReservaLocal = pagoInfo.external_reference;  // Recuperacion del ID de nuestra reserva que guardamos en 'external_reference'
       
          const reservaLocal = await Reserva.findByPk(idReservaLocal);
          if (reservaLocal) {
            reservaLocal.estadoPago = 'PAGADO';
            reservaLocal.estadoReserva = 'CONFIRMADA';
            await reservaLocal.save();

            console.log(`[BACKEND] Reserva #${idReservaLocal} marcada como PAGADA con éxito.`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error al procesar el Webhook de Mercado Pago:', error.message);
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
