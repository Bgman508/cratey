import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, RefreshCw, DollarSign, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminOrders() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refundingOrder, setRefundingOrder] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser || currentUser.role !== 'admin') {
          window.location.href = '/';
          return;
        }
        setUser(currentUser);
      } catch (e) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 500),
    enabled: !!user
  });

  const refundMutation = useMutation({
    mutationFn: async (order) => {
      // Update order status
      await base44.entities.Order.update(order.id, { status: 'refunded' });
      
      // Send refund notification email
      try {
        await base44.functions.invoke('sendStyledEmail', {
          to: order.buyer_email,
          subject: `Refund Processed: ${order.product_title}`,
          title: 'Refund Confirmation',
          bodyContent: `
            <p>Your purchase of <strong>${order.product_title}</strong> has been refunded.</p>
            <p>Amount refunded: <strong>$${(order.amount_cents / 100).toFixed(2)}</strong></p>
            <p>The refund will appear in your account within 5-10 business days.</p>
            <p style="margin-top: 20px; font-size: 14px; color: #666;">Order ID: ${order.id}</p>
          `,
          ctaText: null,
          ctaUrl: null
        });
      } catch (emailError) {
        console.warn('Refund email failed:', emailError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order refunded and customer notified');
      setRefundingOrder(null);
    },
    onError: () => {
      toast.error('Failed to refund order');
    }
  });

  const filteredOrders = orders.filter(order => 
    searchQuery === '' ||
    order.buyer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.product_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.id.includes(searchQuery)
  );

  const totalRevenue = orders.filter(o => o.status === 'paid').reduce((sum, o) => sum + (o.amount_cents || 0), 0);
  const totalRefunded = orders.filter(o => o.status === 'refunded').reduce((sum, o) => sum + (o.amount_cents || 0), 0);

  // Guard: Don't render until user is verified as admin
  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Order Management</h1>
            <p className="text-neutral-600">Admin panel for managing all orders</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-neutral-500">Total Orders</div>
              <div className="text-2xl font-bold">{orders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-neutral-500">Total Revenue</div>
              <div className="text-2xl font-bold">${(totalRevenue / 100).toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-neutral-500">Paid Orders</div>
              <div className="text-2xl font-bold">{orders.filter(o => o.status === 'paid').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-neutral-500">Refunded</div>
              <div className="text-2xl font-bold">${(totalRefunded / 100).toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder="Search by email, product, or order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-neutral-500">Loading orders...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">No orders found</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Downloads</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}...</TableCell>
                        <TableCell>{new Date(order.created_date).toLocaleDateString()}</TableCell>
                        <TableCell>{order.buyer_email}</TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate">{order.product_title}</div>
                          <div className="text-xs text-neutral-500">{order.artist_name}</div>
                        </TableCell>
                        <TableCell>${(order.amount_cents / 100).toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Download className="w-3 h-3" />
                            {order.download_count || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={order.status === 'paid' ? 'default' : order.status === 'refunded' ? 'destructive' : 'secondary'}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {order.status === 'paid' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRefundingOrder(order)}
                            >
                              Refund
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Refund Confirmation Dialog */}
      <AlertDialog open={!!refundingOrder} onOpenChange={() => setRefundingOrder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Refund</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to refund this order?
              <div className="mt-4 p-4 bg-neutral-50 rounded-lg">
                <p className="text-sm"><strong>Order ID:</strong> {refundingOrder?.id}</p>
                <p className="text-sm"><strong>Amount:</strong> ${(refundingOrder?.amount_cents / 100).toFixed(2)}</p>
                <p className="text-sm"><strong>Buyer:</strong> {refundingOrder?.buyer_email}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => refundMutation.mutate(refundingOrder)}
              disabled={refundMutation.isPending}
            >
              {refundMutation.isPending ? 'Processing...' : 'Process Refund'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}