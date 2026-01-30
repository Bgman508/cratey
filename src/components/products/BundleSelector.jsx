import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

export default function BundleSelector({ artistId, currentProductId, selectedIds, onChange }) {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['artist-products-bundle', artistId],
    queryFn: () => base44.entities.Product.filter({ artist_id: artistId, status: 'live' }),
    enabled: !!artistId
  });

  const availableProducts = products.filter(p => p.id !== currentProductId);

  const handleToggle = (productId) => {
    if (selectedIds.includes(productId)) {
      onChange(selectedIds.filter(id => id !== productId));
    } else {
      onChange([...selectedIds, productId]);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (availableProducts.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        No other published products available for bundling
      </p>
    );
  }

  return (
    <div className="space-y-3 max-h-64 overflow-y-auto">
      {availableProducts.map(product => (
        <div key={product.id} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
          <Checkbox
            id={`bundle-${product.id}`}
            checked={selectedIds.includes(product.id)}
            onCheckedChange={() => handleToggle(product.id)}
          />
          <Label
            htmlFor={`bundle-${product.id}`}
            className="flex items-center gap-3 flex-1 cursor-pointer"
          >
            <img
              src={product.cover_url}
              alt={product.title}
              className="w-10 h-10 rounded object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{product.title}</p>
              <p className="text-xs text-neutral-500">
                ${(product.price_cents / 100).toFixed(2)}
              </p>
            </div>
          </Label>
        </div>
      ))}
    </div>
  );
}