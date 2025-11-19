'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Package, Check, X } from 'lucide-react';
import { Nav } from '@/components/layout/nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Producto, Tienda, Proveedor } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function ProductosPage() {
  const mockTiendas: Tienda[] = [
    { id: 1, nombre: 'Tienda Centro' },
    { id: 2, nombre: 'Tienda Norte' },
  ];

  const mockProveedores: Proveedor[] = [
    { id: 1, nombre: 'Proveedor ABC', tienda: 1 },
    { id: 2, nombre: 'Proveedor XYZ', tienda: 1 },
    { id: 3, nombre: 'Proveedor 123', tienda: 2 },
  ];

  const mockProductos: Producto[] = [
    { id: 1, nombre: 'Producto A', proveedor: 1 },
    { id: 2, nombre: 'Producto B', proveedor: 1 },
    { id: 3, nombre: 'Producto C', proveedor: 2 },
    { id: 4, nombre: 'Producto D', proveedor: 3 },
  ];

  const [productos, setProductos] = useState<Producto[]>(mockProductos);
  const [selectedTienda, setSelectedTienda] = useState<number | null>(null);
  const [selectedProveedor, setSelectedProveedor] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingNombre, setEditingNombre] = useState('');
  const [creatingNew, setCreatingNew] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const { toast } = useToast();

  const filteredProveedores = selectedTienda
    ? mockProveedores.filter(p => p.tienda === selectedTienda)
    : mockProveedores;

  const filteredProductos = selectedProveedor
    ? productos.filter(p => p.proveedor === selectedProveedor)
    : productos;

  const handleEdit = (producto: Producto) => {
    setEditingId(producto.id!);
    setEditingNombre(producto.nombre);
  };

  const handleSaveEdit = () => {
    if (!editingNombre.trim()) return;
    setProductos(productos.map(p => 
      p.id === editingId ? { ...p, nombre: editingNombre } : p
    ));
    setEditingId(null);
    toast({ title: 'Producto actualizado' });
  };

  const handleCreate = () => {
    if (!newNombre.trim() || !selectedProveedor) return;
    const newId = Math.max(...productos.map(p => p.id || 0)) + 1;
    setProductos([...productos, { id: newId, nombre: newNombre, proveedor: selectedProveedor }]);
    setNewNombre('');
    setCreatingNew(false);
    toast({ title: 'Producto creado' });
  };

  const handleDelete = (id: number) => {
    if (!confirm('¿Eliminar este producto?')) return;
    setProductos(productos.filter(p => p.id !== id));
    toast({ title: 'Producto eliminado' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto max-w-7xl px-4 py-4 sm:py-8 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-semibold">Productos</h1>
          <Button size="sm" onClick={() => setCreatingNew(true)} disabled={!selectedProveedor} title="Nuevo Producto">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          <Select
            value={selectedTienda?.toString() || ''}
            onValueChange={(value) => {
              setSelectedTienda(parseInt(value));
              setSelectedProveedor(null);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filtrar tienda" />
            </SelectTrigger>
            <SelectContent>
              {mockTiendas.map((tienda) => (
                <SelectItem key={tienda.id} value={tienda.id!.toString()}>
                  {tienda.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedProveedor?.toString() || ''}
            onValueChange={(value) => setSelectedProveedor(parseInt(value))}
            disabled={!selectedTienda}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filtrar proveedor" />
            </SelectTrigger>
            <SelectContent>
              {filteredProveedores.map((proveedor) => (
                <SelectItem key={proveedor.id} value={proveedor.id!.toString()}>
                  {proveedor.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {creatingNew && (
          <Card className="mb-4 border-primary">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-chart-3" />
                <Input
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  placeholder="Nombre del producto"
                  className="flex-1"
                  autoFocus
                />
                <Button size="icon" onClick={handleCreate} title="Guardar">
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" onClick={() => setCreatingNew(false)} title="Cancelar">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          {filteredProductos.map((producto) => (
            <Card key={producto.id}>
              <CardContent className="pt-4">
                {editingId === producto.id ? (
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-chart-3" />
                    <Input
                      value={editingNombre}
                      onChange={(e) => setEditingNombre(e.target.value)}
                      className="flex-1"
                      autoFocus
                    />
                    <Button size="icon" onClick={handleSaveEdit} title="Guardar">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" onClick={() => setEditingId(null)} title="Cancelar">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-chart-3" />
                      <div>
                        <div className="font-medium">{producto.nombre}</div>
                        <div className="text-xs text-muted-foreground">
                          {mockProveedores.find(p => p.id === producto.proveedor)?.nombre}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(producto)} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => producto.id && handleDelete(producto.id)}
                        className="text-destructive hover:bg-destructive/10"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <Toaster />
    </div>
  );
}
