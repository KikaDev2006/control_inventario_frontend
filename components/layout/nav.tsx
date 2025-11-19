'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Store, Package, ShoppingCart, Users } from 'lucide-react';

const navigation = [
  { name: 'Tiendas', href: '/', icon: Store },
  { name: 'Proveedores', href: '/proveedores', icon: Users },
  { name: 'Productos', href: '/productos', icon: Package },
  { name: 'Compras', href: '/compras', icon: ShoppingCart },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
              <Store className="h-6 w-6 text-primary" />
              <span className="hidden sm:inline text-foreground">Control Inventario</span>
            </Link>
            <div className="flex gap-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-secondary text-foreground'
                        : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
