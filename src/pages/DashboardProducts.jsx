import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  MoreVertical, 
  Eye, 
  EyeOff, 
  Pencil, 
  Trash2,
  ExternalLink 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export default function DashboardProducts() {
  const [user, setUser] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: artist } = useQuery({
    queryKey: ['my-artist', user?.email],
    queryFn: async () => {
      const artists = await base44.entities.Artist.filter({ owner_email: user.email });
      return artists[0] || null;
    },
    enabled: !!user?.email
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['my-products', artist?.id],
    queryFn: () => base44.entities.Product.filter({ artist_id: artist.id }, '-created_date'),
    enabled: !!artist?.id
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (product) => {
      const newStatus = product.status === 'live' ? 'draft' : 'live';
      await base44.entities.Product.update(product.id, { status: newStatus });
      return newStatus;
    },
    onSuccess: (newStatus) => {
      queryClient.invalidateQueries(['my-products']);
      toast.success(`Product ${newStatus === 'live' ? 'published' : 'unpublished'}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId) => {
      await base44.entities.Product.delete(productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-products']);
      toast.success('Product deleted');
      setDeleteProduct(null);
    }
  });

  return (
    <DashboardLayout currentPage="DashboardProducts" artist={artist}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Products</h1>
            <p className="text-neutral-600">Manage your music catalog</p>
          </div>
          <Link to={createPageUrl('DashboardNewProduct')}>
            <Button className="bg-black text-white hover:bg-neutral-800">
              <Plus className="w-4 h-4 mr-2" />
              New Release
            </Button>
          </Link>
        </div>

        {/* Products List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="space-y-4">
            {products.map(product => (
              <Card key={product.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center gap-4 p-4">
                    <img 
                      src={product.cover_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100'} 
                      alt={product.title}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg truncate">{product.title}</h3>
                      <p className="text-neutral-600 capitalize">{product.type}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="font-medium">${(product.price_cents / 100).toFixed(2)}</span>
                        <Badge variant={product.status === 'live' ? 'default' : 'secondary'}>
                          {product.status}
                        </Badge>
                        <span className="text-sm text-neutral-500">
                          {product.total_sales || 0} sales
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link 
                        to={createPageUrl('ProductPage') + `?id=${product.id}`}
                        target="_blank"
                      >
                        <Button variant="outline" size="sm">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => window.location.href = createPageUrl('DashboardEditProduct') + `?id=${product.id}`}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleStatusMutation.mutate(product)}>
                            {product.status === 'live' ? (
                              <>
                                <EyeOff className="w-4 h-4 mr-2" />
                                Unpublish
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4 mr-2" />
                                Publish
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setDeleteProduct(product)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-16">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">No products yet</h3>
              <p className="text-neutral-500 mb-6">Create your first release to start selling</p>
              <Link to={createPageUrl('DashboardNewProduct')}>
                <Button className="bg-black text-white hover:bg-neutral-800">
                  Create Your First Release
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteProduct} onOpenChange={() => setDeleteProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteProduct?.title}"? This action cannot be undone.
              Existing purchases will still be accessible to buyers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteMutation.mutate(deleteProduct.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}