import { ChevronLeft, ChevronRight, Calendar, AlertCircle } from 'lucide-react';
import { 
  formatWeekRange, 
  getNextWeek, 
  getPreviousWeek,
  canNavigateToNextWeek,
  getCurrentWeekStartForBusiness,
  hasResolvedTimezone,
  getTimezoneDisplayInfo
} from '../../lib/simplified-timezone';
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
    const windowStart = getCurrentWeekStartForBusiness(business);
    return previousWeek >= windowStart;
  };

  const canGoNext = () => {
    return canNavigateToNextWeek(currentWeek, business);
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
    const thisWeek = getCurrentWeekStartForBusiness(business);
    onWeekChange(thisWeek);
  };

  const isCurrentWeek = currentWeek === getCurrentWeekStartForBusiness(business);
  const timezoneInfo = getTimezoneDisplayInfo(business);
  
  // Show warning if timezone is not resolved
  const showTimezoneWarning = !hasResolvedTimezone(business);

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
            title={!canGoPrevious() ? "Cannot go beyond current 4-week scheduling window" : "Previous Week"}
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
              Week of {formatWeekRange(currentWeek, business)}
            </h2>
            <div className="flex items-center justify-center space-x-1 text-xs text-gray-500 mt-1">
              <span>Sun-Sat • {timezoneInfo.abbreviation} Time</span>
              {showTimezoneWarning && (
                <div className="flex items-center text-amber-600 ml-1" title="Timezone not resolved - using UTC fallback">
                  <AlertCircle className="h-3 w-3" />
                </div>
              )}
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
            title={!canGoNext() ? "Cannot schedule beyond 4-week window" : "Next Week"}
          >
            <span className="hidden sm:inline">Next Week</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          {(!canGoNext() || !canGoPrevious()) && (
            <div className="flex items-center text-amber-600 text-sm" title="4-week scheduling window">
              <AlertCircle className="h-4 w-4 mr-1" />
              <span className="hidden md:inline">4-week limit</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
