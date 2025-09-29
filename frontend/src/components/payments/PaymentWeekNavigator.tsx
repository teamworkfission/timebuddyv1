import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Business } from '../../lib/business-api';
import { getCurrentWeekStart, getNextWeek, getPreviousWeek, formatWeekRange } from '../../lib/date-utils';

interface PaymentWeekNavigatorProps {
  currentWeek: string;
  onWeekChange: (weekStart: string) => void;
  business?: Business;
}

// All utility functions now imported from date-utils.ts for consistency

export function PaymentWeekNavigator({ currentWeek, onWeekChange, business }: PaymentWeekNavigatorProps) {
  const [isCurrentWeek, setIsCurrentWeek] = useState(false);

  useEffect(() => {
    setIsCurrentWeek(currentWeek === getCurrentWeekStart());
  }, [currentWeek]);

  const handlePreviousWeek = () => {
    onWeekChange(getPreviousWeek(currentWeek));
  };

  const handleNextWeek = () => {
    onWeekChange(getNextWeek(currentWeek));
  };

  const handleThisWeek = () => {
    onWeekChange(getCurrentWeekStart());
  };

  return (
    <div className="bg-white rounded-lg shadow p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousWeek}
            className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous Week</span>
          </Button>
          
          {!isCurrentWeek && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleThisWeek}
              className="text-blue-600 hover:text-blue-700 px-2 sm:px-3 text-xs sm:text-sm"
            >
              <span className="hidden xs:inline">This Week</span>
              <span className="xs:hidden">Now</span>
            </Button>
          )}
        </div>

        <div className="flex-1 text-center px-2">
          <h2 className="text-sm sm:text-lg font-semibold text-gray-900 leading-tight">
            Week of {formatWeekRange(currentWeek)}
          </h2>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextWeek}
            className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3"
          >
            <span className="hidden sm:inline">Next Week</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
