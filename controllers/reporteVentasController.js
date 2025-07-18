const ReporteVentas = require('../models/ReporteVentas');

exports.ventasPorDia = async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;
  const data = await ReporteVentas.ventasPorDia(fechaInicio, fechaFin);
  res.json({ success: true, data });
};

exports.productosMasVendidos = async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;
  const data = await ReporteVentas.productosMasVendidos(fechaInicio, fechaFin);
  res.json({ success: true, data });
};

exports.rendimientoPorEmpleado = async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;
  const data = await ReporteVentas.rendimientoPorEmpleado(fechaInicio, fechaFin);
  res.json({ success: true, data });
};

exports.ingresosPorDia = async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;
  const data = await ReporteVentas.ingresosPorDia(fechaInicio, fechaFin);
  res.json({ success: true, data });
};

exports.productosMasVendidosGeneral = async (req, res) => {
  try {
    const data = await ReporteVentas.productosMasVendidosGeneral();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener productos más vendidos' });
  }
};