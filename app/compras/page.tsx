'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Plus, Trash2, ShoppingCart, Calendar, Edit2, Pencil, Package, Check, X } from 'lucide-react';
import { Nav } from '@/components/layout/nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { listarTiendas } from '@/lib/api/tiendas';
import { listarProveedores } from '@/lib/api/proveedores';
import { comprasPorRango, crearCompra, eliminarCompra, editarDetalle } from '@/lib/api/compras';
import { Compra, Tienda, Proveedor, DetalleCompra } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function ComprasPage() {
  const { data: tiendas } = useSWR<Tienda[]>('tiendas', listarTiendas);
  const [selectedTienda, setSelectedTienda] = useState<number | null>(null);
  
  const { data: proveedores } = useSWR(
    selectedTienda ? `proveedores-${selectedTienda}` : null,
    () => selectedTienda ? listarProveedores(selectedTienda) : null
  );

  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [limit, setLimit] = useState(3);

  const { data: compras, mutate, isLoading } = useSWR(
    'compras',
    () => comprasPorRango(fechaInicio || undefined, fechaFin || undefined, limit),
    { refreshInterval: 5000 }
  );

  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedCompra, setSelectedCompra] = useState<Compra | null>(null);
  const [editingDetalle, setEditingDetalle] = useState<DetalleCompra | null>(null);
  
  const [proveedorId, setProveedorId] = useState<string>('');
  const [fechaCompra, setFechaCompra] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [inventarioAnterior, setInventarioAnterior] = useState('');
  const { toast } = useToast();
  const [inventario, setInventario] = useState<any[]>([]);
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const handleCreateCompra = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await crearCompra({
        proveedor_id: parseInt(proveedorId),
        fecha_compra: fechaCompra,
      });
      toast({
        title: 'Compra creada',
        description: 'La compra se creó correctamente con detalles en cero',
      });
      mutate();
      setOpenCreateDialog(false);
      setProveedorId('');
      setFechaCompra('');
      setSelectedTienda(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Hubo un error al crear la compra',
        variant: 'destructive',
      });
    }
  };

  const handleEditDetalle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDetalle?.id) return;
    
    try {
      await editarDetalle(editingDetalle.id, {
        cantidad: parseInt(cantidad),
        inventario_anterior: parseInt(inventarioAnterior),
      });
      toast({
        title: 'Detalle actualizado',
        description: 'El detalle se actualizó correctamente',
      });
      mutate();
      setOpenEditDialog(false);
      setEditingDetalle(null);
      setCantidad('');
      setInventarioAnterior('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Hubo un error al actualizar el detalle',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta compra?')) return;
    try {
      await eliminarCompra(id);
      mutate();
      toast({
        title: 'Compra eliminada',
        description: 'La compra se eliminó correctamente',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la compra',
        variant: 'destructive',
      });
    }
  };
  const openDetalleEdit = (detalle: DetalleCompra) => {
    setEditingDetalle(detalle);
    setCantidad(detalle.cantidad.toString());
    setInventarioAnterior(detalle.inventario_anterior.toString());
    setOpenEditDialog(true);
  };

  const getProveedorNombre = (proveedorId: number) => {
    const allProveedores = proveedores || [];
    return allProveedores.find((p) => p.id === proveedorId)?.nombre || 'Desconocido';
  };

  const handleFilter = () => {
    mutate();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  // Build inventory table from compras (use up to 3 latest compras)
  useEffect(() => {
    if (!compras || compras.length === 0) {
      setInventario([]);
      return;
    }

    const sorted = [...compras].sort((a, b) => (b.fecha_compra || '').localeCompare(a.fecha_compra || ''));
    const cols = sorted.slice(0, 3);

    const map = new Map<number, any>();

    cols.forEach((compra, colIdx) => {
      compra.detalles.forEach((detalle) => {
        const pid = detalle.producto;
        if (!map.has(pid)) {
          map.set(pid, {
            id: pid,
            producto: detalle.producto_nombre || `Producto ${pid}`,
          });
        }

        const item = map.get(pid);
        const idx = colIdx + 1;
        item[`fecha${idx}`] = compra.fecha_compra;
        item[`col${idx}Compra`] = detalle.cantidad;
        item[`col${idx}Anterior`] = detalle.inventario_anterior;
        item[`col${idx}Inv`] = detalle.inventario_anterior + detalle.cantidad;
        item[`col${idx}DetalleId`] = detalle.id;
      });
    });

    setInventario(Array.from(map.values()));
  }, [compras]);

  const handleCellClick = (id: number, field: string, currentValue: number) => {
    setEditingCell({ id, field });
    setEditValue(currentValue.toString());
  };

  const handleCellSave = async (itemId: number, field: string) => {
    const newValue = parseInt(editValue) || 0;
    const updated = inventario.map((it) => {
      if (it.id !== itemId) return it;
      return { ...it, [field]: newValue };
    });
    setInventario(updated);
    setEditingCell(null);

    // If this cell maps to a detalle id, call API to update
    const colMatch = field.match(/col(\d+)Compra/);
    if (colMatch) {
      const colIdx = colMatch[1];
      const item = inventario.find((i) => i.id === itemId);
      const detalleId = item?.[`col${colIdx}DetalleId`];
      const inventarioAnteriorVal = item?.[`col${colIdx}Anterior`] || 0;
      if (detalleId) {
        try {
          await editarDetalle(detalleId, {
            cantidad: newValue,
            inventario_anterior: inventarioAnteriorVal,
          });
          toast({ title: 'Actualizado', description: 'Detalle actualizado correctamente' });
          mutate();
        } catch (error) {
          toast({ title: 'Error', description: 'No fue posible actualizar detalle', variant: 'destructive' });
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto max-w-full px-0 py-2 sm:py-4">
        <div className="mb-2 sm:mb-4 flex items-center justify-between px-2 sm:px-4">
          <h1 className="text-lg sm:text-2xl font-semibold flex items-center gap-2">
            <Package className="h-5 w-5 sm:h-6 sm:w-6 text-chart-1" />
            <span className="hidden sm:inline">Inventario de Compras</span>
            <span className="sm:hidden">Inventario</span>
          </h1>
          <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
            <DialogTrigger asChild>
              <Button size="icon" className="h-8 w-8 sm:h-9 sm:w-9" title="Nueva Compra">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva Compra</DialogTitle>
                <DialogDescription>
                  Crea una nueva compra. Se generarán detalles automáticamente para cada producto del proveedor.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateCompra} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tienda-create">Tienda</Label>
                  <Select value={selectedTienda?.toString() || ''} onValueChange={(value) => setSelectedTienda(parseInt(value))} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una tienda" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiendas?.map((tienda) => (
                        <SelectItem key={tienda.id} value={tienda.id!.toString()}>
                          {tienda.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proveedor-create">Proveedor</Label>
                  <Select value={proveedorId} onValueChange={setProveedorId} required disabled={!selectedTienda}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {proveedores?.map((proveedor) => (
                        <SelectItem key={proveedor.id} value={proveedor.id!.toString()}>
                          {proveedor.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha-compra">Fecha de Compra</Label>
                  <Input
                    id="fecha-compra"
                    type="date"
                    value={fechaCompra}
                    onChange={(e) => setFechaCompra(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpenCreateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Crear</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="mb-3 sm:mb-4 mx-2 sm:mx-4">
          <CardContent className="pt-2 pb-2 sm:pt-3 sm:pb-2">
            <div className="grid gap-1.5 sm:gap-3 grid-cols-4">
              <div className="space-y-0.5">
                <Label htmlFor="fecha-inicio" className="text-[10px] sm:text-xs">Inicio</Label>
                <Input
                  id="fecha-inicio"
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="h-7 text-[10px] sm:text-xs px-1.5 sm:px-2"
                />
              </div>
              <div className="space-y-0.5">
                <Label htmlFor="fecha-fin" className="text-[10px] sm:text-xs">Fin</Label>
                <Input
                  id="fecha-fin"
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="h-7 text-[10px] sm:text-xs px-1.5 sm:px-2"
                />
              </div>
              <div className="space-y-0.5">
                <Label htmlFor="limit" className="text-[10px] sm:text-xs">Límite</Label>
                <Input
                  id="limit"
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value))}
                  min="1"
                  max="100"
                  className="h-7 text-[10px] sm:text-xs px-1.5 sm:px-2"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleFilter} size="sm" className="h-7 w-full text-[10px] sm:text-xs">
                  Filtrar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        

        {isLoading ? (
          <Card className="animate-pulse mt-6">
            <CardHeader>
              <div className="h-6 w-32 rounded bg-muted" />
            </CardHeader>
          </Card>
        ) : inventario && inventario.length > 0 ? (
          <div className="rounded-lg border bg-card overflow-x-auto shadow-sm mx-0 sm:mx-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 w-[50px] sm:w-16 text-center text-[10px] sm:text-xs p-0.5 sm:p-1">
                    {formatDate(inventario[0]?.fecha1)}
                  </TableHead>
                  <TableHead className="bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 w-[50px] sm:w-16 text-center text-[10px] sm:text-xs p-0.5 sm:p-1">
                    {formatDate(inventario[0]?.fecha2)}
                  </TableHead>
                  <TableHead className="bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 w-[50px] sm:w-16 text-center text-[10px] sm:text-xs p-0.5 sm:p-1">
                    {formatDate(inventario[0]?.fecha3)}
                  </TableHead>
                  <TableHead className="bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-200 text-center font-semibold text-[10px] sm:text-sm p-0.5 sm:p-1 min-w-[70px] sm:min-w-[100px]">
                    Producto
                  </TableHead>
                  <TableHead className="bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-200 w-[60px] sm:w-20 text-center text-[10px] sm:text-xs p-0.5 sm:p-1">
                    {formatDate(inventario[0]?.fecha1)}
                  </TableHead>
                  <TableHead className="bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-200 w-[60px] sm:w-20 text-center text-[10px] sm:text-xs p-0.5 sm:p-1">
                    {formatDate(inventario[0]?.fecha2)}
                  </TableHead>
                  <TableHead className="bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-200 w-[60px] sm:w-20 text-center text-[10px] sm:text-xs p-0.5 sm:p-1">
                    {formatDate(inventario[0]?.fecha3)}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventario.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="bg-blue-50/50 dark:bg-blue-950/20 text-center p-0.5 sm:p-1">
                      {editingCell?.id === item.id && editingCell?.field === 'col1Inv' ? (
                        <Input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleCellSave(item.id, 'col1Inv')}
                          onKeyDown={(e) => e.key === 'Enter' && handleCellSave(item.id, 'col1Inv')}
                          className="w-[45px] sm:w-12 h-5 sm:h-6 text-[10px] sm:text-xs mx-auto text-center p-0"
                          autoFocus
                        />
                      ) : (
                        <span 
                          onClick={() => handleCellClick(item.id, 'col1Inv', item.col1Inv || 0)}
                          className="text-blue-700 dark:text-blue-300 font-semibold text-[10px] sm:text-sm cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-900/30 px-0.5 py-0.5 rounded"
                        >
                          {item.col1Inv ?? 0}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="bg-blue-50/50 dark:bg-blue-950/20 text-center p-0.5 sm:p-1">
                      {editingCell?.id === item.id && editingCell?.field === 'col2Inv' ? (
                        <Input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleCellSave(item.id, 'col2Inv')}
                          onKeyDown={(e) => e.key === 'Enter' && handleCellSave(item.id, 'col2Inv')}
                          className="w-[45px] sm:w-12 h-5 sm:h-6 text-[10px] sm:text-xs mx-auto text-center p-0"
                          autoFocus
                        />
                      ) : (
                        <span 
                          onClick={() => handleCellClick(item.id, 'col2Inv', item.col2Inv || 0)}
                          className="text-blue-700 dark:text-blue-300 font-semibold text-[10px] sm:text-sm cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-900/30 px-0.5 py-0.5 rounded"
                        >
                          {item.col2Inv ?? 0}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="bg-blue-50/50 dark:bg-blue-950/20 text-center p-0.5 sm:p-1">
                      {editingCell?.id === item.id && editingCell?.field === 'col3Inv' ? (
                        <Input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleCellSave(item.id, 'col3Inv')}
                          onKeyDown={(e) => e.key === 'Enter' && handleCellSave(item.id, 'col3Inv')}
                          className="w-[45px] sm:w-12 h-5 sm:h-6 text-[10px] sm:text-xs mx-auto text-center p-0"
                          autoFocus
                        />
                      ) : (
                        <span 
                          onClick={() => handleCellClick(item.id, 'col3Inv', item.col3Inv || 0)}
                          className="text-blue-700 dark:text-blue-300 font-semibold text-[10px] sm:text-sm cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-900/30 px-0.5 py-0.5 rounded"
                        >
                          {item.col3Inv ?? 0}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="bg-green-50/60 dark:bg-green-950/30 font-medium text-center text-[10px] sm:text-sm p-0.5 sm:p-1">
                      {item.producto}
                    </TableCell>
                    <TableCell className="bg-red-50/50 dark:bg-red-950/20 text-center p-0.5 sm:p-1">
                      <div className="flex flex-col items-center gap-0">
                        {editingCell?.id === item.id && editingCell?.field === 'col1Compra' ? (
                          <Input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleCellSave(item.id, 'col1Compra')}
                            onKeyDown={(e) => e.key === 'Enter' && handleCellSave(item.id, 'col1Compra')}
                            className="w-[45px] sm:w-12 h-5 sm:h-6 text-[10px] sm:text-xs mx-auto text-center p-0"
                            autoFocus
                          />
                        ) : (
                          <>
                            <span 
                              onClick={() => handleCellClick(item.id, 'col1Compra', item.col1Compra || 0)}
                              className="font-semibold text-red-700 dark:text-red-300 text-[10px] sm:text-sm cursor-pointer hover:bg-red-100/50 dark:hover:bg-red-900/30 px-0.5 py-0.5 rounded"
                            >
                              {item.col1Compra ?? 0}
                            </span>
                            <span className="text-[7px] sm:text-[8px] text-muted-foreground">
                              ({(item.col1Anterior ?? 0) - (item.col1Inv ?? 0)})
                            </span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="bg-red-50/50 dark:bg-red-950/20 text-center p-0.5 sm:p-1">
                      <div className="flex flex-col items-center gap-0">
                        {editingCell?.id === item.id && editingCell?.field === 'col2Compra' ? (
                          <Input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleCellSave(item.id, 'col2Compra')}
                            onKeyDown={(e) => e.key === 'Enter' && handleCellSave(item.id, 'col2Compra')}
                            className="w-[45px] sm:w-12 h-5 sm:h-6 text-[10px] sm:text-xs mx-auto text-center p-0"
                            autoFocus
                          />
                        ) : (
                          <>
                            <span 
                              onClick={() => handleCellClick(item.id, 'col2Compra', item.col2Compra || 0)}
                              className="font-semibold text-red-700 dark:text-red-300 text-[10px] sm:text-sm cursor-pointer hover:bg-red-100/50 dark:hover:bg-red-900/30 px-0.5 py-0.5 rounded"
                            >
                              {item.col2Compra ?? 0}
                            </span>
                            <span className="text-[7px] sm:text-[8px] text-muted-foreground">
                              ({(item.col2Anterior ?? 0) - (item.col2Inv ?? 0)})
                            </span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="bg-red-50/50 dark:bg-red-950/20 text-center p-0.5 sm:p-1">
                      <div className="flex flex-col items-center gap-0">
                        {editingCell?.id === item.id && editingCell?.field === 'col3Compra' ? (
                          <Input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleCellSave(item.id, 'col3Compra')}
                            onKeyDown={(e) => e.key === 'Enter' && handleCellSave(item.id, 'col3Compra')}
                            className="w-[45px] sm:w-12 h-5 sm:h-6 text-[10px] sm:text-xs mx-auto text-center p-0"
                            autoFocus
                          />
                        ) : (
                          <>
                            <span 
                              onClick={() => handleCellClick(item.id, 'col3Compra', item.col3Compra || 0)}
                              className="font-semibold text-red-700 dark:text-red-300 text-[10px] sm:text-sm cursor-pointer hover:bg-red-100/50 dark:hover:bg-red-900/30 px-0.5 py-0.5 rounded"
                            >
                              {item.col3Compra ?? 0}
                            </span>
                            <span className="text-[7px] sm:text-[8px] text-muted-foreground">
                              ({(item.col3Anterior ?? 0) - (item.col3Inv ?? 0)})
                            </span>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Card className="mt-6">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <ShoppingCart className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground">No hay compras</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Comienza creando tu primera compra
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Detalle de Compra</DialogTitle>
            <DialogDescription>
              Modifica la cantidad y el inventario anterior del producto
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditDetalle} className="space-y-4">
            <div className="space-y-2">
              <Label>Producto</Label>
              <Input
                value={editingDetalle?.producto_nombre || `Producto ${editingDetalle?.producto}`}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cantidad">Cantidad</Label>
              <Input
                id="cantidad"
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                required
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inventario-anterior">Inventario Anterior</Label>
              <Input
                id="inventario-anterior"
                type="number"
                value={inventarioAnterior}
                onChange={(e) => setInventarioAnterior(e.target.value)}
                required
                min="0"
              />
            </div>
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">
                Inventario Nuevo:{' '}
                <span className="font-semibold text-primary">
                  {(parseInt(inventarioAnterior) || 0) + (parseInt(cantidad) || 0)}
                </span>
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpenEditDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit">Actualizar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
}
