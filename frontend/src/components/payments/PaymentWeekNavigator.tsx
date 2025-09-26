import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '../ui/Button';
import { Business } from '../../lib/business-api';

interface PaymentWeekNavigatorProps {
  currentWeek: string;
  onWeekChange: (weekStart: string) => void;
  business?: Business;
}

// Utility functions for week navigation
const getWeekStart = (date: Date): string => {
  const sunday = new Date(date);
  sunday.setDate(date.getDate() - date.getDay());
  return sunday.toISOString().split('T')[0];
};

const getCurrentWeek = (): string => {
  return getWeekStart(new Date());
};

const getPreviousWeek = (weekStart: string): string => {
  const date = new Date(weekStart + 'T00:00:00');
  date.setDate(date.getDate() - 7);
  return getWeekStart(date);
};

const getNextWeek = (weekStart: string): string => {
  const date = new Date(weekStart + 'T00:00:00');
  date.setDate(date.getDate() + 7);
  return getWeekStart(date);
};

const formatWeekRange = (weekStart: string): string => {
  const start = new Date(weekStart + 'T00:00:00');
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  if (start.getMonth() === end.getMonth()) {
    return `${formatDate(start)} - ${formatDate(end)}`;
  } else {
    return `${formatDate(start)} - ${formatDate(end)}`;
  }
};

export function PaymentWeekNavigator({ currentWeek, onWeekChange, business }: PaymentWeekNavigatorProps) {
  const [isCurrentWeek, setIsCurrentWeek] = useState(false);

  useEffect(() => {
    setIsCurrentWeek(currentWeek === getCurrentWeek());
  }, [currentWeek]);

  const handlePreviousWeek = () => {
    onWeekChange(getPreviousWeek(currentWeek));
  };

  const handleNextWeek = () => {
    onWeekChange(getNextWeek(currentWeek));
  };

  const handleThisWeek = () => {
    onWeekChange(getCurrentWeek());
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousWeek}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous Week</span>
          </Button>
          
          {!isCurrentWeek && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleThisWeek}
              className="text-blue-600 hover:text-blue-700"
            >
              This Week
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-500" />
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Week of {formatWeekRange(currentWeek)}
            </h2>
            {business && (
              <p className="text-xs text-gray-500 mt-1">
                {business.name} • {business.location.split(',')[1]?.trim()} Time
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextWeek}
            className="flex items-center space-x-2"
          >
            <span className="hidden sm:inline">Next Week</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
