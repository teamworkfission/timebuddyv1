import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, AlertCircle } from 'lucide-react';
import { 
  formatWeekRange, 
  getNextWeek, 
  getPreviousWeek,
  canNavigateToNextWeek,
  getScheduleWindowStart
} from '../../lib/schedules-api';
import { Button } from '../ui/Button';
import { Business } from '../../lib/business-api';

interface WeekNavigatorProps {
  currentWeek: string;
  onWeekChange: (weekStart: string) => void;
  business?: Business; // Optional for display purposes only
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
        const windowStart = getScheduleWindowStart();
        const canGoPrevious = previousWeek >= windowStart;
        
        const canGoNext = canNavigateToNextWeek(currentWeek);
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
      const thisWeek = getScheduleWindowStart();
      onWeekChange(thisWeek);
    } catch (error) {
      console.error('Error getting current week:', error);
    }
  };

  const { canGoPrevious, canGoNext, isCurrentWeek, loading } = navigationState;

  return (
    <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
      {/* Mobile-first layout */}
      <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
        
        {/* Week Title - Mobile first */}
        <div className="order-1 sm:order-2 text-center">
          <h2 className="text-xl sm:text-lg font-bold text-gray-900 mb-2 sm:mb-0">
            {formatWeekRange(currentWeek)}
          </h2>
        </div>

        {/* Navigation Buttons - Mobile optimized */}
        <div className="order-2 sm:order-1 flex items-center justify-center sm:justify-start space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousWeek}
            disabled={!canGoPrevious || loading}
            className="flex items-center space-x-1 sm:space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-blue-500 text-white hover:text-white font-semibold shadow-lg px-3 py-2 sm:px-4 transition-all duration-200 hover:shadow-xl disabled:from-gray-400 disabled:to-gray-500 disabled:border-gray-400"
            title={!canGoPrevious ? "Cannot schedule in past weeks" : "Previous Week"}
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-xs sm:text-sm">Previous</span>
          </Button>
          
          {!isCurrentWeek && !loading && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleThisWeek}
              className="text-blue-600 hover:text-white hover:bg-blue-600 font-medium px-2 sm:px-3 py-2 rounded-md transition-all duration-200"
            >
              <span className="text-xs sm:text-sm">This Week</span>
            </Button>
          )}
        </div>

        {/* Next Button and Warning */}
        <div className="order-3 sm:order-3 flex items-center justify-center sm:justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextWeek}
            disabled={!canGoNext || loading}
            className="flex items-center space-x-1 sm:space-x-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border-green-500 text-white hover:text-white font-semibold shadow-lg px-3 py-2 sm:px-4 transition-all duration-200 hover:shadow-xl disabled:from-gray-400 disabled:to-gray-500 disabled:border-gray-400"
            title="Next Week"
          >
            <span className="text-xs sm:text-sm">Next</span>
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          
          {business && !canGoPrevious && !loading && (
            <div className="flex items-center text-amber-600 text-xs sm:text-sm" title="Cannot schedule in past weeks">
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">Past week</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
