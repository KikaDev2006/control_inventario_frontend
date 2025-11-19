'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Users, Check, X } from 'lucide-react';
import { Nav } from '@/components/layout/nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Proveedor, Tienda } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function ProveedoresPage() {
  const mockTiendas: Tienda[] = [
    { id: 1, nombre: 'Tienda Centro' },
    { id: 2, nombre: 'Tienda Norte' },
  ];

  const mockProveedores: Proveedor[] = [
    { id: 1, nombre: 'Proveedor ABC', tienda: 1 },
    { id: 2, nombre: 'Proveedor XYZ', tienda: 1 },
    { id: 3, nombre: 'Proveedor 123', tienda: 2 },
  ];

  const [proveedores, setProveedores] = useState<Proveedor[]>(mockProveedores);
  const [selectedTienda, setSelectedTienda] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingNombre, setEditingNombre] = useState('');
  const [creatingNew, setCreatingNew] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const { toast } = useToast();

  const filteredProveedores = selectedTienda 
    ? proveedores.filter(p => p.tienda === selectedTienda)
    : proveedores;

  const handleEdit = (proveedor: Proveedor) => {
    setEditingId(proveedor.id!);
    setEditingNombre(proveedor.nombre);
  };

  const handleSaveEdit = () => {
    if (!editingNombre.trim()) return;
    setProveedores(proveedores.map(p => 
      p.id === editingId ? { ...p, nombre: editingNombre } : p
    ));
    setEditingId(null);
    toast({ title: 'Proveedor actualizado' });
  };

  const handleCreate = () => {
    if (!newNombre.trim() || !selectedTienda) return;
    const newId = Math.max(...proveedores.map(p => p.id || 0)) + 1;
    setProveedores([...proveedores, { id: newId, nombre: newNombre, tienda: selectedTienda }]);
    setNewNombre('');
    setCreatingNew(false);
    toast({ title: 'Proveedor creado' });
  };

  const handleDelete = (id: number) => {
    if (!confirm('¿Eliminar este proveedor?')) return;
    setProveedores(proveedores.filter(p => p.id !== id));
    toast({ title: 'Proveedor eliminado' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto max-w-7xl px-4 py-4 sm:py-8 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-semibold">Proveedores</h1>
          <Button size="sm" onClick={() => setCreatingNew(true)} disabled={!selectedTienda} title="Nuevo Proveedor">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-4">
          <Select
            value={selectedTienda?.toString() || ''}
            onValueChange={(value) => setSelectedTienda(parseInt(value))}
          >
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Filtrar por tienda" />
            </SelectTrigger>
            <SelectContent>
              {mockTiendas.map((tienda) => (
                <SelectItem key={tienda.id} value={tienda.id!.toString()}>
                  {tienda.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {creatingNew && (
          <Card className="mb-4 border-primary">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                <Input
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  placeholder="Nombre del proveedor"
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
          {filteredProveedores.map((proveedor) => (
            <Card key={proveedor.id}>
              <CardContent className="pt-4">
                {editingId === proveedor.id ? (
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-accent" />
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
                      <Users className="h-5 w-5 text-accent" />
                      <div>
                        <div className="font-medium">{proveedor.nombre}</div>
                        <div className="text-xs text-muted-foreground">
                          {mockTiendas.find(t => t.id === proveedor.tienda)?.nombre}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(proveedor)} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => proveedor.id && handleDelete(proveedor.id)}
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
