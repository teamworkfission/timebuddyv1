import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* Main Navigation - Single horizontal line */}
      <div className="flex items-center justify-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousWeek}
          disabled={!canGoPrevious || loading}
          className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Previous Week"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </Button>
        
        {/* Week Display */}
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900">
            {formatWeekRange(currentWeek)}
          </h2>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextWeek}
          disabled={!canGoNext || loading}
          className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Next Week"
        >
          <span>Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      {/* This Week Button - Centered below main navigation */}
      {!isCurrentWeek && !loading && (
        <div className="flex justify-center mt-3 pt-3 border-t border-gray-100">
          <Button
            variant="outline"
            size="sm"
            onClick={handleThisWeek}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-blue-500 hover:border-blue-600 text-white hover:text-white font-semibold shadow-md hover:shadow-lg px-6 py-2 rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            This Week
          </Button>
        </div>
      )}
    </div>
  );
}
