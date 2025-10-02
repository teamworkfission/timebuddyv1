// Notification Tracker - Manages "viewed" state for employee notifications

const STORAGE_KEY_PREFIX = 'employee_notification_viewed_';

export type NotificationType = 'schedules' | 'join_requests';

interface ViewedState {
  lastViewedAt: string; // ISO timestamp
  weekViewed?: string; // For schedules, track which week was viewed
}

/**
 * Mark a notification type as viewed
 */
export function markAsViewed(employeeGid: string, type: NotificationType, weekStart?: string): void {
  const key = `${STORAGE_KEY_PREFIX}${employeeGid}_${type}`;
  const state: ViewedState = {
    lastViewedAt: new Date().toISOString(),
    weekViewed: weekStart
  };
  localStorage.setItem(key, JSON.stringify(state));
}

/**
 * Check if notifications of this type have been viewed for the current data
 */
export function hasBeenViewed(employeeGid: string, type: NotificationType, weekStart?: string): boolean {
  const key = `${STORAGE_KEY_PREFIX}${employeeGid}_${type}`;
  const stored = localStorage.getItem(key);
  
  if (!stored) return false;
  
  try {
    const state: ViewedState = JSON.parse(stored);
    
    // For schedules, check if the specific week has been viewed
    if (type === 'schedules' && weekStart) {
      return state.weekViewed === weekStart;
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

