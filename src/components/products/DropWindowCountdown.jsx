import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function DropWindowCountdown({ product }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!product?.drop_window_enabled || !product?.drop_window_end) {
      return;
    }

    const calculateTimeLeft = () => {
      const end = new Date(product.drop_window_end);
      const now = new Date();
      const difference = end - now;

      if (difference <= 0) {
        setIsExpired(true);
        return null;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      return { days, hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [product]);

  if (!product?.drop_window_enabled || !product?.drop_window_end) {
    return null;
  }

  if (isExpired) {
    return (
      <Badge variant="destructive" className="gap-2">
        <AlertCircle className="w-3 h-3" />
        Drop Window Ended
      </Badge>
    );
  }

  if (!timeLeft) return null;

  const isUrgent = timeLeft.days === 0 && timeLeft.hours < 6;

  return (
    <div className={`rounded-lg p-4 ${isUrgent ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Clock className={`w-4 h-4 ${isUrgent ? 'text-red-600' : 'text-amber-600'}`} />
        <span className={`font-medium text-sm ${isUrgent ? 'text-red-900' : 'text-amber-900'}`}>
          {isUrgent ? 'Ending Soon!' : 'Limited Time Release'}
        </span>
      </div>
      
      <div className="flex items-center gap-3">
        {timeLeft.days > 0 && (
          <div className="text-center">
            <div className="text-2xl font-bold">{timeLeft.days}</div>
            <div className="text-xs text-neutral-600">days</div>
          </div>
        )}
        <div className="text-center">
          <div className="text-2xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</div>
          <div className="text-xs text-neutral-600">hrs</div>
        </div>
        <div className="text-2xl font-bold">:</div>
        <div className="text-center">
          <div className="text-2xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</div>
          <div className="text-xs text-neutral-600">min</div>
        </div>
        <div className="text-2xl font-bold">:</div>
        <div className="text-center">
          <div className="text-2xl font-bold">{String(timeLeft.seconds).padStart(2, '0')}</div>
          <div className="text-xs text-neutral-600">sec</div>
        </div>
      </div>
    </div>
  );
}