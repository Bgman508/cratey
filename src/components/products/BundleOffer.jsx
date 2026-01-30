import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Package, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function BundleOffer({ product, onBundlePurchase }) {
  const { data: bundleProducts = [] } = useQuery({
    queryKey: ['bundle-products', product.id],
    queryFn: async () => {
      if (!product.bundle_enabled || !product.bundle_product_ids?.length) return [];
      const products = await Promise.all(
        product.bundle_product_ids.map(id => 
          base44.entities.Product.filter({ id }).then(p => p[0])
        )
      );
      return products.filter(Boolean);
    },
    enabled: !!product.bundle_enabled
  });

  if (!product.bundle_enabled || bundleProducts.length === 0) return null;

  const totalRegularPrice = product.price_cents + bundleProducts.reduce((sum, p) => sum + p.price_cents, 0);
  const bundleDiscount = totalRegularPrice * (product.bundle_discount_percent / 100);
  const bundlePrice = totalRegularPrice - bundleDiscount;

  return (
    <Card className="p-6 bg-gradient-to-br from-neutral-50 to-neutral-100 border-2 border-neutral-200">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center flex-shrink-0">
          <Package className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1">Bundle & Save {product.bundle_discount_percent}%</h3>
          <p className="text-sm text-neutral-600 mb-4">
            Get this with {bundleProducts.length} more release{bundleProducts.length !== 1 ? 's' : ''}
          </p>
          
          <div className="space-y-2 mb-4">
            {bundleProducts.slice(0, 2).map(p => (
              <Link 
                key={p.id}
                to={createPageUrl('ProductPage') + `?id=${p.id}`}
                className="flex items-center gap-2 text-sm hover:text-neutral-600"
              >
                <img src={p.cover_url} alt={p.title} className="w-8 h-8 rounded object-cover" />
                <span className="truncate">{p.title}</span>
              </Link>
            ))}
            {bundleProducts.length > 2 && (
              <p className="text-sm text-neutral-500">+ {bundleProducts.length - 2} more</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500 line-through">
                ${(totalRegularPrice / 100).toFixed(2)}
              </p>
              <p className="text-2xl font-bold">
                ${(bundlePrice / 100).toFixed(2)}
              </p>
            </div>
            <Button 
              className="bg-black text-white hover:bg-neutral-800"
              onClick={() => onBundlePurchase(bundleProducts, bundlePrice)}
            >
              Buy Bundle
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}