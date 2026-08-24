import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface CountdownTimerProps {
  expiresAt: string | Date;
  onExpire?: () => void;
  className?: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  expiresAt,
  onExpire,
  className = '',
}) => {
  const [timeLeft, setTimeLeft] = useState<{ minutes: number; seconds: number; isExpired: boolean }>({
    minutes: 5,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const calculateTime = () => {
      const targetTime = new Date(expiresAt).getTime();
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        setTimeLeft({ minutes: 0, seconds: 0, isExpired: true });
        if (onExpire) onExpire();
        return;
      }

      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ minutes, seconds, isExpired: false });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  if (timeLeft.isExpired) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold ${className}`}>
        <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
        <span>Hold Expired</span>
      </div>
    );
  }

  const isLowTime = timeLeft.minutes === 0 && timeLeft.seconds <= 60;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors duration-200 ${
        isLowTime
          ? 'bg-amber-50 border-amber-300 text-amber-800 animate-pulse'
          : 'bg-teal-50 border-teal-200 text-teal-800'
      } ${className}`}
    >
      <Clock className={`w-4 h-4 ${isLowTime ? 'text-amber-600' : 'text-teal-600'}`} />
      <span>
        Slot Reserved:{' '}
        <strong className="font-mono text-sm">
          {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
        </strong>
      </span>
    </div>
  );
};
