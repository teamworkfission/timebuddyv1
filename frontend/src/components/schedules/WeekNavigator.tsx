import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, AlertCircle } from 'lucide-react';
import { 
  formatWeekRange, 
  getNextWeek, 
  getPreviousWeek, 
  getCurrentWeekStart,
  canNavigateToNextWeek,
  isWeekInPast,
  getScheduleWindowStart,
  getScheduleWindowEnd 
} from '../../lib/schedules-api';
import { Button } from '../ui/Button';
import { Business } from '../../lib/business-api';

interface WeekNavigatorProps {
  currentWeek: string;
  onWeekChange: (weekStart: string) => void;
  business?: Business; // For timezone-aware calculations
}

export function WeekNavigator({ currentWeek, onWeekChange, business }: WeekNavigatorProps) {
  const [navigationState, setNavigationState] = useState({
    canGoPrevious: false,
    canGoNext: false,
    isCurrentWeek: false,
    loading: true
  });

  // Update navigation state when currentWeek or business changes
  useEffect(() => {
    const updateNavigationState = async () => {
      try {
        setNavigationState(prev => ({ ...prev, loading: true }));
        
        const previousWeek = getPreviousWeek(currentWeek);
        const windowStart = await getScheduleWindowStart(business);
        const canGoPrevious = previousWeek >= windowStart;
        
        const canGoNext = await canNavigateToNextWeek(currentWeek, business);
        const isCurrentWeek = currentWeek === windowStart;

        setNavigationState({
          canGoPrevious,
          canGoNext,
          isCurrentWeek,
          loading: false
        });
      } catch (error) {
        console.error('Error updating navigation state:', error);
        setNavigationState({
          canGoPrevious: false,
          canGoNext: false,
          isCurrentWeek: false,
          loading: false
        });
      }
    };

    updateNavigationState();
  }, [currentWeek, business]);

  const handlePreviousWeek = () => {
    if (navigationState.canGoPrevious) {
      onWeekChange(getPreviousWeek(currentWeek));
    }
  };

  const handleNextWeek = () => {
    if (navigationState.canGoNext) {
      onWeekChange(getNextWeek(currentWeek));
    }
  };

  const handleThisWeek = async () => {
    try {
      const thisWeek = await getScheduleWindowStart(business);
      onWeekChange(thisWeek);
    } catch (error) {
      console.error('Error getting current week:', error);
    }
  };

  const { canGoPrevious, canGoNext, isCurrentWeek, loading } = navigationState;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousWeek}
            disabled={!canGoPrevious || loading}
            className="flex items-center space-x-2"
            title={!canGoPrevious ? "Cannot go beyond current 4-week scheduling window" : "Previous Week"}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous Week</span>
          </Button>
          
          {!isCurrentWeek && !loading && (
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
            {business && (
              <p className="text-xs text-gray-500 mt-1">
                Sun-Sat • {business.location.split(',')[1]?.trim()} Time
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextWeek}
            disabled={!canGoNext || loading}
            className="flex items-center space-x-2"
            title={!canGoNext ? "Cannot schedule beyond 4-week window" : "Next Week"}
          >
            <span className="hidden sm:inline">Next Week</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          {business && (!canGoNext || !canGoPrevious) && !loading && (
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
