// Notification Tracker - Manages "viewed" state for employee notifications

const STORAGE_KEY_PREFIX = 'employee_notification_viewed_';

export type NotificationType = 'schedules' | 'join_requests';

interface ViewedState {
  lastViewedAt: string; // ISO timestamp
  weekViewed?: string; // For schedules, track which week was viewed
  schedulePostedAt?: string; // Track when the schedule was posted (to detect updates)
}

/**
 * Mark a notification type as viewed
 * @param schedulePostedAt - For schedules, the posted_at timestamp from the schedule
 */
export function markAsViewed(
  employeeGid: string, 
  type: NotificationType, 
  weekStart?: string, 
  schedulePostedAt?: string
): void {
  const key = `${STORAGE_KEY_PREFIX}${employeeGid}_${type}`;
  const state: ViewedState = {
    lastViewedAt: new Date().toISOString(),
    weekViewed: weekStart,
    schedulePostedAt: schedulePostedAt
  };
  localStorage.setItem(key, JSON.stringify(state));
}

/**
 * Check if notifications of this type have been viewed for the current data
 * @param schedulePostedAt - For schedules, the current posted_at timestamp to compare
 */
export function hasBeenViewed(
  employeeGid: string, 
  type: NotificationType, 
  weekStart?: string,
  schedulePostedAt?: string
): boolean {
  const key = `${STORAGE_KEY_PREFIX}${employeeGid}_${type}`;
  const stored = localStorage.getItem(key);
  
  console.log('🔍 TRACKER DEBUG: Checking if viewed:', {
    type,
    weekStart,
    schedulePostedAt,
    stored: !!stored
  });
  
  if (!stored) return false;
  
  try {
    const state: ViewedState = JSON.parse(stored);
    
    console.log('🔍 TRACKER DEBUG: Stored state:', state);
    
    // For schedules, check if the specific week has been viewed
    if (type === 'schedules' && weekStart) {
      // Week must match
      if (state.weekViewed !== weekStart) {
        console.log('🔍 TRACKER DEBUG: Week mismatch, not viewed');
        return false;
      }
      
      // If schedule has a posted_at timestamp, check if it's newer than last viewed
      if (schedulePostedAt && state.schedulePostedAt) {
        const currentPostedTime = new Date(schedulePostedAt).getTime();
        const viewedPostedTime = new Date(state.schedulePostedAt).getTime();
        
        console.log('🔍 TRACKER DEBUG: Timestamp comparison:', {
          current: schedulePostedAt,
          currentTime: currentPostedTime,
          viewed: state.schedulePostedAt,
          viewedTime: viewedPostedTime,
          isNewer: currentPostedTime > viewedPostedTime
        });
        
        // If current schedule is newer than the one we viewed, consider it not viewed
        if (currentPostedTime > viewedPostedTime) {
          console.log('🔍 TRACKER DEBUG: Schedule updated, showing badge');
          return false;
        }
      }
      
      console.log('🔍 TRACKER DEBUG: Schedule already viewed');
      return true;
    }
    
    // For join requests, just check if viewed recently (within last data fetch)
    return !!state.lastViewedAt;
  } catch {
    return false;
  }
}

/**
 * Clear viewed state for a notification type
 * Useful when new items arrive or when switching weeks
 */
export function clearViewedState(employeeGid: string, type: NotificationType): void {
  const key = `${STORAGE_KEY_PREFIX}${employeeGid}_${type}`;
  localStorage.removeItem(key);
}

/**
 * Clear all viewed states for an employee
 */
export function clearAllViewedStates(employeeGid: string): void {
  clearViewedState(employeeGid, 'schedules');
  clearViewedState(employeeGid, 'join_requests');
}

