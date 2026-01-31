import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import BundleSelector from '@/components/products/BundleSelector';
import { toast } from 'sonner';

export default function DashboardEditProduct() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  
  const [formData, setFormData] = useState({
    title: '',
    type: 'single',
    description: '',
    price: '',
    archive_price: '',
    track_names: [],
    edition_type: 'unlimited',
    edition_limit: '',
    edition_name: '',
    drop_window_enabled: false,
    drop_window_end: '',
    bundle_enabled: false,
    bundle_product_ids: [],
    bundle_discount_percent: ''
  });

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

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const products = await base44.entities.Product.filter({ id: productId });
      return products[0] || null;
    },
    enabled: !!productId
  });

  useEffect(() => {
    if (product) {
      setFormData({
        title: product.title || '',
        type: product.type || 'single',
        description: product.description || '',
        price: (product.price_cents / 100).toFixed(2),
        archive_price: product.archive_price_cents ? (product.archive_price_cents / 100).toFixed(2) : '',
        track_names: product.track_names || [],
        edition_type: product.edition_type || 'unlimited',
        edition_limit: product.edition_limit || '',
        edition_name: product.edition_name || '',
        drop_window_enabled: product.drop_window_enabled || false,
        drop_window_end: product.drop_window_end || '',
        bundle_enabled: product.bundle_enabled || false,
        bundle_product_ids: product.bundle_product_ids || [],
        bundle_discount_percent: product.bundle_discount_percent || ''
      });
    }
  }, [product]);

  const handleSubmit = async () => {
    if (!formData.title) {
      toast.error('Please enter a title');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    setSaving(true);

    try {
      const updateData = {
        title: formData.title,
        type: formData.type,
        description: formData.description,
        price_cents: Math.round(parseFloat(formData.price) * 100),
        track_names: formData.track_names,
      };

      if (formData.edition_type === 'limited') {
        updateData.edition_type = 'limited';
        updateData.edition_limit = parseInt(formData.edition_limit);
        updateData.edition_name = formData.edition_name || 'Limited Edition';
      } else {
        updateData.edition_type = 'unlimited';
      }

      if (formData.drop_window_enabled && formData.drop_window_end) {
        updateData.drop_window_enabled = true;
        updateData.drop_window_end = formData.drop_window_end;
        updateData.archive_price_cents = formData.archive_price ? Math.round(parseFloat(formData.archive_price) * 100) : null;
      } else {
        updateData.drop_window_enabled = false;
      }

      if (formData.bundle_enabled) {
        updateData.bundle_enabled = true;
        updateData.bundle_product_ids = formData.bundle_product_ids;
        updateData.bundle_discount_percent = parseFloat(formData.bundle_discount_percent) || 0;
      } else {
        updateData.bundle_enabled = false;
      }

      await base44.entities.Product.update(productId, updateData);

      setSaving(false);
      toast.success('Product updated!');
      navigate(createPageUrl('DashboardProducts'));
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update product');
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout currentPage="DashboardProducts" artist={artist}>
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        </div>
      </DashboardLayout>
    );
  }

  if (!product) {
    return (
      <DashboardLayout currentPage="DashboardProducts" artist={artist}>
        <div className="text-center py-16">
          <p className="text-neutral-500">Product not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPage="DashboardProducts" artist={artist}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link 
            to={createPageUrl('DashboardProducts')}
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-black mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </Link>
          <h1 className="text-3xl font-bold">Edit Product</h1>
          <p className="text-neutral-600">Update your product details</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="ep">EP</SelectItem>
                      <SelectItem value="album">Album</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="max-w-[200px]">
                <Label htmlFor="price">Price (USD)</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="pl-7"
                  />
                </div>
              </div>

              <div>
                <Label>Track Names</Label>
                <div className="space-y-2 mt-2">
                  {formData.track_names.map((name, i) => (
                    <Input
                      key={i}
                      value={name}
                      onChange={(e) => {
                        const newNames = [...formData.track_names];
                        newNames[i] = e.target.value;
                        setFormData({ ...formData, track_names: newNames });
                      }}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Edition Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Limited Edition</Label>
                <Switch
                  checked={formData.edition_type === 'limited'}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, edition_type: checked ? 'limited' : 'unlimited' })
                  }
                />
              </div>

              {formData.edition_type === 'limited' && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <Label>Copy Limit</Label>
                    <Input
                      type="number"
                      value={formData.edition_limit}
                      onChange={(e) => setFormData({ ...formData, edition_limit: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Edition Name</Label>
                    <Input
                      value={formData.edition_name}
                      onChange={(e) => setFormData({ ...formData, edition_name: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bundle Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable Bundle</Label>
                <Switch
                  checked={formData.bundle_enabled}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, bundle_enabled: checked })
                  }
                />
              </div>

              {formData.bundle_enabled && (
                <div className="pt-4 border-t space-y-4">
                  <div>
                    <Label>Bundle Discount (%)</Label>
                    <Input
                      type="number"
                      value={formData.bundle_discount_percent}
                      onChange={(e) => setFormData({ ...formData, bundle_discount_percent: e.target.value })}
                      className="mt-1 max-w-[200px]"
                    />
                  </div>
                  
                  <div>
                    <Label>Select Products to Bundle</Label>
                    <div className="mt-2">
                      <BundleSelector
                        artistId={artist.id}
                        currentProductId={productId}
                        selectedIds={formData.bundle_product_ids}
                        onChange={(ids) => setFormData({ ...formData, bundle_product_ids: ids })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between pt-4">
            <Button variant="outline" onClick={() => navigate(createPageUrl('DashboardProducts'))}>
              Cancel
            </Button>
            <Button 
              className="bg-black text-white hover:bg-neutral-800"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}