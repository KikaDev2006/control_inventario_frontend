import { apiRequest } from '../api-client';
import { Compra, CompraIn, DetalleCompra, DetalleCompraUpdate } from '../types';

export async function crearCompra(data: CompraIn): Promise<Compra> {
  return apiRequest<Compra>('/api/compra/crear/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function editarDetalle(detalleId: number, data: DetalleCompraUpdate): Promise<DetalleCompra> {
  return apiRequest<DetalleCompra>(`/api/compra/detalle/editar/${detalleId}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function comprasPorRango(
  fechaInicio?: string,
  fechaFin?: string,
  limit: number = 3
): Promise<Compra[]> {
  const params = new URLSearchParams();
  if (fechaInicio) params.append('fecha_inicio', fechaInicio);
  if (fechaFin) params.append('fecha_fin', fechaFin);
  params.append('limit', limit.toString());

  return apiRequest<Compra[]>(`/api/compra/rango/?${params.toString()}`);
}

export async function eliminarCompra(compraId: number): Promise<void> {
  return apiRequest<void>(`/api/compra/eliminar/${compraId}/`, {
    method: 'DELETE',
  });
}
