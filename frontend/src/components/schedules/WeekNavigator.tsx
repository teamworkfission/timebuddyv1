import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { formatWeekRange, getNextWeek, getPreviousWeek } from '../../lib/schedules-api';
import { Button } from '../ui/Button';

interface WeekNavigatorProps {
  currentWeek: string;
  onWeekChange: (weekStart: string) => void;
}

export function WeekNavigator({ currentWeek, onWeekChange }: WeekNavigatorProps) {
  const handlePreviousWeek = () => {
    onWeekChange(getPreviousWeek(currentWeek));
  };

  const handleNextWeek = () => {
    onWeekChange(getNextWeek(currentWeek));
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousWeek}
          className="flex items-center space-x-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous Week</span>
        </Button>

        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">
            Week of {formatWeekRange(currentWeek)}
          </h2>
        </div>

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
  );
}
