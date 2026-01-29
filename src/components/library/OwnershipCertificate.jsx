import React from 'react';
import { format } from 'date-fns';
import { Award, Calendar, Music, Hash } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function OwnershipCertificate({ item, order }) {
  return (
    <Card className="bg-gradient-to-br from-neutral-50 to-white border-2 border-neutral-200">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Certificate of Ownership</h3>
            <p className="text-sm text-neutral-500">Proof of Purchase</p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3 py-2 border-b border-neutral-100">
            <Music className="w-4 h-4 text-neutral-400" />
            <div className="flex-1">
              <p className="text-xs text-neutral-500">Release</p>
              <p className="font-medium">{item.product_title}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 py-2 border-b border-neutral-100">
            <Music className="w-4 h-4 text-neutral-400" />
            <div className="flex-1">
              <p className="text-xs text-neutral-500">Artist</p>
              <p className="font-medium">{item.artist_name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 py-2 border-b border-neutral-100">
            <Calendar className="w-4 h-4 text-neutral-400" />
            <div className="flex-1">
              <p className="text-xs text-neutral-500">Purchased</p>
              <p className="font-medium">
                {format(new Date(item.purchase_date || item.created_date), 'MMMM d, yyyy')}
              </p>
            </div>
          </div>

          {item.edition_name && (
            <div className="flex items-center gap-3 py-2 border-b border-neutral-100">
              <Hash className="w-4 h-4 text-neutral-400" />
              <div className="flex-1">
                <p className="text-xs text-neutral-500">Edition</p>
                <p className="font-medium">
                  {item.edition_name}
                  {item.edition_number && ` #${item.edition_number}`}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-black text-white text-center py-3 rounded-lg">
          <p className="text-sm font-medium">Permanently Owned</p>
          <p className="text-xs text-neutral-400 mt-1">Download anytime, forever</p>
        </div>
      </CardContent>
    </Card>
  );
}