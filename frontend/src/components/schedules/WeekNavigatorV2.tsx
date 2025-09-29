import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { 
  formatWeekRange, 
  getNextWeek, 
  getPreviousWeek,
  canNavigateToNextWeek,
  getCurrentWeekStart
} from '../../lib/schedules-api';
import { Button } from '../ui/Button';
import { Business } from '../../lib/business-api';

interface WeekNavigatorProps {
  currentWeek: string;
  onWeekChange: (weekStart: string) => void;
  business: Business; // Required for timezone-aware calculations
}

export function WeekNavigatorV2({ currentWeek, onWeekChange, business }: WeekNavigatorProps) {
  const canGoPrevious = () => {
    const previousWeek = getPreviousWeek(currentWeek);
    const windowStart = getCurrentWeekStart();
    return previousWeek >= windowStart;
  };

  const canGoNext = () => {
    return canNavigateToNextWeek(currentWeek);
  };

  const handlePreviousWeek = () => {
    if (canGoPrevious()) {
      onWeekChange(getPreviousWeek(currentWeek));
    }
  };

  const handleNextWeek = () => {
    if (canGoNext()) {
      onWeekChange(getNextWeek(currentWeek));
    }
  };

  const handleThisWeek = () => {
    const thisWeek = getCurrentWeekStart();
    onWeekChange(thisWeek);
  };

  const isCurrentWeek = currentWeek === getCurrentWeekStart();

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousWeek}
            disabled={!canGoPrevious()}
            className="flex items-center space-x-2"
            title="Previous Week"
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
            <div className="flex items-center justify-center space-x-1 text-xs text-gray-500 mt-1">
              <span>Sun-Sat • US Schedule</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextWeek}
            disabled={!canGoNext()}
            className="flex items-center space-x-2"
            title="Next Week"
          >
            <span className="hidden sm:inline">Next Week</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
