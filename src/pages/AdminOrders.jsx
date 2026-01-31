import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, RefreshCw, DollarSign, Download } from 'lucide-react';
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
        if (currentUser.role !== 'admin') {
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
    queryFn: () => base44.entities.Order.list('-created_date', 100),
    enabled: !!user
  });

  const refundMutation = useMutation({
    mutationFn: async (orderId) => {
      await base44.entities.Order.update(orderId, { status: 'refunded' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order refunded successfully');
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

  if (!user) return null;

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
            <AlertDialogAction onClick={() => refundMutation.mutate(refundingOrder.id)}>
              Process Refund
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}