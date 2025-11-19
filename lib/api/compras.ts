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

export async function crearDetalle(compraId: number, data: { producto_id: number; cantidad: number; inventario_anterior: number; }): Promise<DetalleCompra> {
  return apiRequest<DetalleCompra>(`/api/compra/detalle/crear/${compraId}/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function eliminarDetalle(detalleId: number): Promise<void> {
  return apiRequest<void>(`/api/compra/detalle/eliminar/${detalleId}/`, {
    method: 'DELETE',
  });
}

export async function comprasPorRango(
  fechaInicio?: string,
  fechaFin?: string,
  limit: number = 3,
  tiendaId?: number,
  proveedorId?: number,
  order: string = 'asc'
): Promise<Compra[]> {
  const params = new URLSearchParams();
  if (fechaInicio) params.append('fecha_inicio', fechaInicio);
  if (fechaFin) params.append('fecha_fin', fechaFin);
  params.append('limit', limit.toString());
  if (order) params.append('order', order);

  // If both tiendaId and proveedorId are provided, call the path with both
  if (typeof tiendaId === 'number' && typeof proveedorId === 'number') {
    return apiRequest<Compra[]>(`/api/compra/rango/${tiendaId}/${proveedorId}/?${params.toString()}`);
  }

  // Fallback to generic rango endpoint
  return apiRequest<Compra[]>(`/api/compra/rango/?${params.toString()}`);
}

export async function eliminarCompra(compraId: number): Promise<void> {
  return apiRequest<void>(`/api/compra/eliminar/${compraId}/`, {
    method: 'DELETE',
  });
}
