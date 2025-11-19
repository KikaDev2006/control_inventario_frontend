'use client';

import { useState } from 'react';
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

interface InventarioItem {
  id: number;
  producto: string;
  col1Inv: number;
  col1Compra: number;
  col1Anterior: number;
  col2Inv: number;
  col2Compra: number;
  col2Anterior: number;
  col3Inv: number;
  col3Compra: number;
  col3Anterior: number;
  fecha1: string;
  fecha2: string;
  fecha3: string;
}

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
  
  const mockInventario: InventarioItem[] = [
    { 
      id: 1, 
      producto: 'Producto A', 
      col1Inv: 50, col1Compra: 20, col1Anterior: 65, fecha1: '2024-01-15',
      col2Inv: 70, col2Compra: 15, col2Anterior: 85, fecha2: '2024-02-10',
      col3Inv: 85, col3Compra: 30, col3Anterior: 100, fecha3: '2024-03-05'
    },
    { 
      id: 2, 
      producto: 'Producto B', 
      col1Inv: 30, col1Compra: 15, col1Anterior: 42, fecha1: '2024-01-20',
      col2Inv: 45, col2Compra: 25, col2Anterior: 60, fecha2: '2024-02-15',
      col3Inv: 70, col3Compra: 20, col3Anterior: 85, fecha3: '2024-03-10'
    },
    { 
      id: 3, 
      producto: 'Producto C', 
      col1Inv: 100, col1Compra: 40, col1Anterior: 120, fecha1: '2024-01-25',
      col2Inv: 140, col2Compra: 50, col2Anterior: 170, fecha2: '2024-02-20',
      col3Inv: 190, col3Compra: 35, col3Anterior: 210, fecha3: '2024-03-15'
    },
    { 
      id: 4, 
      producto: 'Producto D', 
      col1Inv: 75, col1Compra: 25, col1Anterior: 90, fecha1: '2024-02-01',
      col2Inv: 100, col2Compra: 30, col2Anterior: 120, fecha2: '2024-02-25',
      col3Inv: 130, col3Compra: 40, col3Anterior: 160, fecha3: '2024-03-20'
    },
    { 
      id: 5, 
      producto: 'Producto E', 
      col1Inv: 60, col1Compra: 30, col1Anterior: 78, fecha1: '2024-02-05',
      col2Inv: 90, col2Compra: 35, col2Anterior: 113, fecha2: '2024-03-01',
      col3Inv: 125, col3Compra: 25, col3Anterior: 138, fecha3: '2024-03-25'
    },
  ];

  const [inventario, setInventario] = useState<InventarioItem[]>(mockInventario);
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const { toast } = useToast();

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

  const handleCellClick = (id: number, field: string, currentValue: number) => {
    setEditingCell({ id, field });
    setEditValue(currentValue.toString());
  };

  const handleCellSave = (id: number, field: string) => {
    setInventario(inventario.map(item =>
      item.id === id ? { 
        ...item, 
        [field]: parseInt(editValue) || 0
      } : item
    ));
    setEditingCell(null);
    toast({ title: 'Actualizado' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
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

        <div className="rounded-lg border bg-card overflow-x-auto shadow-sm mx-0 sm:mx-2">
          <Table>
            <TableHeader>
              <TableRow>
                {/* 3 inventario columns */}
                <TableHead className="bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 w-[50px] sm:w-16 text-center text-[10px] sm:text-xs p-0.5 sm:p-1">
                  {formatDate(inventario[0]?.fecha1)}
                </TableHead>
                <TableHead className="bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 w-[50px] sm:w-16 text-center text-[10px] sm:text-xs p-0.5 sm:p-1">
                  {formatDate(inventario[0]?.fecha2)}
                </TableHead>
                <TableHead className="bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 w-[50px] sm:w-16 text-center text-[10px] sm:text-xs p-0.5 sm:p-1">
                  {formatDate(inventario[0]?.fecha3)}
                </TableHead>
                {/* Product column */}
                <TableHead className="bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-200 text-center font-semibold text-[10px] sm:text-sm p-0.5 sm:p-1 min-w-[70px] sm:min-w-[100px]">
                  Producto
                </TableHead>
                {/* 3 compra columns */}
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
                        onClick={() => handleCellClick(item.id, 'col1Inv', item.col1Inv)}
                        className="text-blue-700 dark:text-blue-300 font-semibold text-[10px] sm:text-sm cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-900/30 px-0.5 py-0.5 rounded"
                      >
                        {item.col1Inv}
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
                        onClick={() => handleCellClick(item.id, 'col2Inv', item.col2Inv)}
                        className="text-blue-700 dark:text-blue-300 font-semibold text-[10px] sm:text-sm cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-900/30 px-0.5 py-0.5 rounded"
                      >
                        {item.col2Inv}
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
                        onClick={() => handleCellClick(item.id, 'col3Inv', item.col3Inv)}
                        className="text-blue-700 dark:text-blue-300 font-semibold text-[10px] sm:text-sm cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-900/30 px-0.5 py-0.5 rounded"
                      >
                        {item.col3Inv}
                      </span>
                    )}
                  </TableCell>
                  
                  {/* Product name */}
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
                            onClick={() => handleCellClick(item.id, 'col1Compra', item.col1Compra)}
                            className="font-semibold text-red-700 dark:text-red-300 text-[10px] sm:text-sm cursor-pointer hover:bg-red-100/50 dark:hover:bg-red-900/30 px-0.5 py-0.5 rounded"
                          >
                            {item.col1Compra}
                          </span>
                          <span className="text-[7px] sm:text-[8px] text-muted-foreground">
                            ({item.col1Anterior - item.col1Inv})
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
                            onClick={() => handleCellClick(item.id, 'col2Compra', item.col2Compra)}
                            className="font-semibold text-red-700 dark:text-red-300 text-[10px] sm:text-sm cursor-pointer hover:bg-red-100/50 dark:hover:bg-red-900/30 px-0.5 py-0.5 rounded"
                          >
                            {item.col2Compra}
                          </span>
                          <span className="text-[7px] sm:text-[8px] text-muted-foreground">
                            ({item.col2Anterior - item.col2Inv})
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
                            onClick={() => handleCellClick(item.id, 'col3Compra', item.col3Compra)}
                            className="font-semibold text-red-700 dark:text-red-300 text-[10px] sm:text-sm cursor-pointer hover:bg-red-100/50 dark:hover:bg-red-900/30 px-0.5 py-0.5 rounded"
                          >
                            {item.col3Compra}
                          </span>
                          <span className="text-[7px] sm:text-[8px] text-muted-foreground">
                            ({item.col3Anterior - item.col3Inv})
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

        <div className="mt-2 sm:mt-3 flex justify-end px-2 sm:px-4">
          <div className="rounded-lg bg-muted px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-sm">
            <span className="text-muted-foreground">Total: </span>
            <span className="font-semibold text-primary">
              {inventario.reduce((sum, item) => sum + item.col1Compra + item.col2Compra + item.col3Compra, 0)}
            </span>
          </div>
        </div>

        {isLoading ? (
          <Card className="animate-pulse mt-6">
            <CardHeader>
              <div className="h-6 w-32 rounded bg-muted" />
            </CardHeader>
          </Card>
        ) : compras && compras.length > 0 ? (
          <div className="space-y-6 mt-6">
            {compras.map((compra) => (
              <Card key={compra.id} className="overflow-hidden">
                <CardHeader className="bg-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-chart-1/20 p-2">
                        <ShoppingCart className="h-5 w-5 text-chart-1" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Compra #{compra.id}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {compra.fecha_compra}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => compra.id && handleDelete(compra.id)}
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="mr-2 h-3 w-3" />
                      Eliminar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                        <TableHead className="text-right">Inv. Anterior</TableHead>
                        <TableHead className="text-right">Inv. Nuevo</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {compra.detalles.map((detalle) => (
                        <TableRow key={detalle.id}>
                          <TableCell className="font-medium">
                            {detalle.producto_nombre || `Producto ${detalle.producto}`}
                          </TableCell>
                          <TableCell className="text-right">{detalle.cantidad}</TableCell>
                          <TableCell className="text-right">{detalle.inventario_anterior}</TableCell>
                          <TableCell className="text-right font-semibold text-primary">
                            {detalle.inventario_anterior + detalle.cantidad}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDetalleEdit(detalle)}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
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
