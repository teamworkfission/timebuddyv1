import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { BusinessScheduleSelector } from './BusinessScheduleSelector';
import { ScheduleTabs } from './ScheduleTabs';
import { WeekNavigator } from './WeekNavigator';
import { WeeklyScheduleView } from './WeeklyScheduleView';
import { ShiftTemplateManager } from './ShiftTemplateManager';
import { PostedScheduleView } from './PostedScheduleView';
import { 
  SchedulesApi, 
  getCurrentWeekStart, 
  isWeekInEditableWindow,
  WeeklySchedule, 
  ShiftTemplate, 
  CreateShiftDto, 
  UpdateShiftDto 
} from '../../lib/schedules-api';
import { BusinessesApi, Business, BusinessEmployee } from '../../lib/business-api';
import { Button } from '../ui/Button';

interface ScheduleManagementProps {
  onBack: () => void;
}

export function ScheduleManagement({ onBack }: ScheduleManagementProps) {
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
  const [currentWeek, setCurrentWeek] = useState<string>(getCurrentWeekStart());
  const [activeTab, setActiveTab] = useState<'edit' | 'posted'>('edit');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [hasPostedVersion, setHasPostedVersion] = useState(false);

  // Helper function to convert BusinessEmployee to ScheduleEmployee format
  const convertToScheduleEmployees = (businessEmployees: BusinessEmployee[]) => {
    return businessEmployees.map(emp => ({
      id: emp.employee.id,
      full_name: emp.employee.full_name,
      employee_gid: emp.employee.employee_gid,
    }));
  };

  // Helper function to create empty schedule structure for current/future weeks
  const createEmptySchedule = (businessId: string, weekStart: string, employees: BusinessEmployee[]): WeeklySchedule => {
    return {
      id: '', // No actual schedule exists yet
      business_id: businessId,
      week_start_date: weekStart,
      status: 'draft' as const,
      shifts: [],
      employees: convertToScheduleEmployees(employees),
      total_hours_by_employee: {},
    };
  };

  // Load businesses on mount
  useEffect(() => {
    loadBusinesses();
  }, []);

  // Load schedule data when business, week, or active tab changes
  useEffect(() => {
    if (selectedBusinessId) {
      loadScheduleData();
    }
  }, [selectedBusinessId, currentWeek, activeTab]);

  const loadBusinesses = async () => {
    try {
      const businessData = await BusinessesApi.getBusinesses();
      setBusinesses(businessData);
    } catch (err) {
      setError('Failed to load businesses');
      console.error('Error loading businesses:', err);
    }
  };

  const loadScheduleData = async () => {
    if (!selectedBusinessId) return;

    setLoading(true);
    setError(null);

    try {
      console.log('Loading schedule data for business:', selectedBusinessId);
      console.log('Current week:', currentWeek);
      console.log('Active tab:', activeTab);
      
      // Check what day of the week this is (using local time to avoid timezone issues)
      const weekDate = new Date(currentWeek + 'T00:00:00');
      console.log('Week start date day of week:', weekDate.getDay(), '(0=Sun, 6=Sat)');
      
      // Load schedule based on active tab and templates with improved error handling
      const targetStatus = activeTab === 'edit' ? 'draft' : 'posted';
      let schedule: WeeklySchedule | null = null;
      let templates: ShiftTemplate[] = [];
      
      try {
        // Load templates first - they're needed regardless
        templates = await SchedulesApi.getShiftTemplates(selectedBusinessId);
      } catch (templatesError) {
        console.warn('Failed to load templates, will try to create defaults:', templatesError);
        // Templates will be handled after schedule loading
      }
      
      try {
        // Load the primary schedule for the target status
        console.log(`📅 API Request: business=${selectedBusinessId}, week=${currentWeek}, status=${targetStatus}`);
        schedule = await SchedulesApi.getWeeklyScheduleByStatus(selectedBusinessId, currentWeek, targetStatus);
        console.log(`✅ Loaded ${targetStatus} schedule for week ${currentWeek}:`, schedule ? 'Found' : 'Not found');
        if (schedule) {
          console.log(`📊 Schedule details:`, {
            id: schedule.id,
            week_start_date: schedule.week_start_date,
            status: schedule.status,
            shift_count: schedule.shifts.length
          });
        }
      } catch (scheduleError) {
        console.warn(`Failed to load ${targetStatus} schedule:`, scheduleError);
        
        // For certain errors (like JSON parsing), try the fallback approach
        const errorMessage = scheduleError instanceof Error ? scheduleError.message : String(scheduleError);
        if (errorMessage.includes('JSON') || errorMessage.includes('SyntaxError')) {
          console.log('JSON parsing error detected, attempting fallback approach');
          
          // Try the general schedule endpoint as fallback
          try {
            const fallbackSchedule = await SchedulesApi.getWeeklySchedule(selectedBusinessId, currentWeek);
            if (fallbackSchedule && fallbackSchedule.status === targetStatus) {
              schedule = fallbackSchedule;
              console.log('Successfully loaded schedule using fallback method');
            }
          } catch (fallbackError) {
            console.warn('Fallback method also failed:', fallbackError);
          }
        }
      }
      
      // Handle proper draft/posted separation
      if (!schedule && activeTab === 'edit') {
        // No draft exists - check if there's a posted schedule user might want to edit
        try {
          const postedSchedule = await SchedulesApi.getWeeklyScheduleByStatus(selectedBusinessId, currentWeek, 'posted');
          if (postedSchedule) {
            console.log('Found posted schedule but no draft exists - user can unpost to edit');
            // Store reference to posted schedule for potential unposting
            setWeeklySchedule({ ...postedSchedule, __isPostedReference: true } as any);
            setHasPostedVersion(false); // Will be "Post Schedule" after they unpost to edit
          } else {
            // No schedule at all - check if this week is editable
            if (isWeekInEditableWindow(currentWeek)) {
              console.log('No schedule found for editable week - creating empty schedule view');
              try {
                // Fetch employees for empty schedule
                const businessEmployees = await BusinessesApi.getBusinessEmployees(selectedBusinessId);
                const emptySchedule = createEmptySchedule(selectedBusinessId, currentWeek, businessEmployees);
                setWeeklySchedule(emptySchedule);
                console.log('Created empty schedule with', businessEmployees.length, 'employees');
              } catch (employeeError) {
                console.warn('Failed to load employees for empty schedule:', employeeError);
                // Create completely empty schedule if employees fail to load
                const emptySchedule = createEmptySchedule(selectedBusinessId, currentWeek, []);
                setWeeklySchedule(emptySchedule);
              }
              setHasPostedVersion(false);
            } else {
              // Week is not editable (past) - show error
              console.log('No schedule found for non-editable week');
              setWeeklySchedule(null);
              setHasPostedVersion(false);
            }
          }
        } catch (postedError) {
          console.warn('Failed to check for posted schedule:', postedError);
          // Still try to create empty schedule if week is editable
          if (isWeekInEditableWindow(currentWeek)) {
            try {
              const businessEmployees = await BusinessesApi.getBusinessEmployees(selectedBusinessId);
              const emptySchedule = createEmptySchedule(selectedBusinessId, currentWeek, businessEmployees);
              setWeeklySchedule(emptySchedule);
              console.log('Created empty schedule after posted check failed');
            } catch (employeeError) {
              console.warn('Failed to load employees after posted check failed:', employeeError);
              setWeeklySchedule(null);
            }
          } else {
            setWeeklySchedule(null);
          }
          setHasPostedVersion(false);
        }
      } else if (!schedule && activeTab === 'posted') {
        // No posted schedule - check if week is editable for better UX
        if (isWeekInEditableWindow(currentWeek)) {
          console.log('No posted schedule found for editable week');
          // For posted tab with no schedule, we still show null (user should switch to edit tab)
          setWeeklySchedule(null);
        } else {
          console.log('No posted schedule found for non-editable week');
          setWeeklySchedule(null);
        }
        setHasPostedVersion(false);
      } else {
        console.log(`🎯 Setting weekly schedule for week ${currentWeek}:`, schedule ? `Schedule ID: ${schedule.id}` : 'null');
        setWeeklySchedule(schedule);
        setHasPostedVersion(false);
      }
      
      setShiftTemplates(templates);

      // If no templates exist, create defaults
      if (templates.length === 0) {
        try {
          const defaultTemplates = await SchedulesApi.createDefaultShiftTemplates(selectedBusinessId);
          setShiftTemplates(defaultTemplates);
        } catch (defaultError) {
          console.warn('Failed to create default templates:', defaultError);
          // Continue without templates - user can create them manually
        }
      }
      
      // Clear any previous errors on successful load
      setError(null);
      
    } catch (err) {
      // This catch block handles truly unexpected errors
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error loading schedule data:', err);
      
      if (errorMessage.includes('JSON') || errorMessage.includes('SyntaxError')) {
        setError('Failed to load schedule data due to server communication issue. Please refresh the page.');
      } else {
        setError('Failed to load schedule data. Please try refreshing the page or contact support if the issue persists.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShiftCreate = async (shift: CreateShiftDto) => {
    let targetSchedule = weeklySchedule;

    // If no schedule exists or if it's an empty schedule placeholder, create a new one
    if (!weeklySchedule || !weeklySchedule.id) {
      try {
        console.log('No real schedule exists, creating new draft schedule...');
        targetSchedule = await SchedulesApi.createWeeklySchedule(selectedBusinessId, currentWeek);
        setWeeklySchedule(targetSchedule);
        console.log('Successfully created new draft schedule:', targetSchedule.id);
      } catch (err) {
        setError('Failed to create schedule');
        console.error('Error creating schedule:', err);
        return;
      }
    }
    // If user is trying to edit a posted schedule reference, unpost it first
    else if ((weeklySchedule as any).__isPostedReference) {
      const draftSchedule = await handleCreateDraftFromPosted();
      if (!draftSchedule) return; // Failed to convert to draft
      targetSchedule = draftSchedule;
    }

    try {
      const newShift = await SchedulesApi.createShift(targetSchedule.id, shift);
      setWeeklySchedule(prev => prev ? {
        ...prev,
        shifts: [...prev.shifts, newShift]
      } : null);
    } catch (err) {
      setError('Failed to create shift');
      console.error('Error creating shift:', err);
    }
  };

  const handleShiftUpdate = async (shiftId: string, shift: UpdateShiftDto) => {
    if (!weeklySchedule || !weeklySchedule.id) return; // Cannot update shifts in empty schedule

    let targetSchedule = weeklySchedule;

    // If user is trying to edit a posted schedule reference, unpost it first
    if ((weeklySchedule as any).__isPostedReference) {
      const draftSchedule = await handleCreateDraftFromPosted();
      if (!draftSchedule) return; // Failed to convert to draft
      targetSchedule = draftSchedule;
    }

    try {
      const updatedShift = await SchedulesApi.updateShift(shiftId, shift);
      setWeeklySchedule(prev => prev ? {
        ...prev,
        shifts: prev.shifts.map(s => s.id === shiftId ? updatedShift : s)
      } : null);
    } catch (err) {
      setError('Failed to update shift');
      console.error('Error updating shift:', err);
    }
  };

  const handleShiftDelete = async (shiftId: string) => {
    if (!weeklySchedule || !weeklySchedule.id) return; // Cannot delete shifts in empty schedule

    let targetSchedule = weeklySchedule;

    // If user is trying to edit a posted schedule reference, unpost it first
    if ((weeklySchedule as any).__isPostedReference) {
      const draftSchedule = await handleCreateDraftFromPosted();
      if (!draftSchedule) return; // Failed to convert to draft
      targetSchedule = draftSchedule;
    }

    try {
      await SchedulesApi.deleteShift(shiftId);
      setWeeklySchedule(prev => prev ? {
        ...prev,
        shifts: prev.shifts.filter(s => s.id !== shiftId)
      } : null);
    } catch (err) {
      setError('Failed to delete shift');
      console.error('Error deleting shift:', err);
    }
  };

  const handlePostSchedule = async () => {
    if (!weeklySchedule) return;

    try {
      const postedSchedule = await SchedulesApi.postSchedule(weeklySchedule.id);
      setWeeklySchedule(postedSchedule);
      setActiveTab('posted');
    } catch (err) {
      setError('Failed to post schedule');
      console.error('Error posting schedule:', err);
    }
  };

  const handleUnpostSchedule = async () => {
    if (!weeklySchedule) return;

    try {
      const draftSchedule = await SchedulesApi.unpostSchedule(weeklySchedule.id);
      setWeeklySchedule(draftSchedule);
      setActiveTab('edit');
    } catch (err) {
      setError('Failed to unpost schedule');
      console.error('Error unposting schedule:', err);
    }
  };

  const handleCreateDraftFromPosted = async (): Promise<WeeklySchedule | null> => {
    if (!weeklySchedule || !(weeklySchedule as any).__isPostedReference) return null;

    try {
      console.log('Converting posted schedule to draft for editing...');
      // Instead of creating new schedule, unpost the existing one to make it editable
      const draftSchedule = await SchedulesApi.unpostSchedule(weeklySchedule.id);
      setWeeklySchedule(draftSchedule);
      setHasPostedVersion(false); // No longer a posted version after unposting
      console.log('Successfully converted to draft schedule:', draftSchedule.id);
      return draftSchedule;
    } catch (err) {
      setError('Failed to convert schedule to draft mode');
      console.error('Error converting to draft:', err);
      return null;
    }
  };

  const handleBusinessChange = (businessId: string) => {
    setSelectedBusinessId(businessId);
    setWeeklySchedule(null);
    setShiftTemplates([]);
    setError(null);
  };

  const handleWeekChange = async (weekStart: string) => {
    console.log(`🗓️ Week change requested: ${currentWeek} → ${weekStart}`);
    const selectedBusiness = businesses.find(b => b.business_id === selectedBusinessId);
    
    // Only allow navigation within the 4-week window
    try {
      if (selectedBusiness && !isWeekInEditableWindow(weekStart)) {
        console.warn('Cannot navigate to week outside the 4-week scheduling window');
        return;
      }
    } catch (error) {
      console.error('Error checking week editability:', error);
      return;
    }
    
    console.log(`🔄 Changing current week state to: ${weekStart}`);
    
    // Clear previous schedule data when changing weeks to prevent duplication
    console.log('🧹 Clearing previous schedule data to prevent persistence');
    setWeeklySchedule(null);
    setError(null);
    
    setCurrentWeek(weekStart);
    // Save current week to localStorage for session memory (with error handling)
    try {
      localStorage.setItem('schedule_current_week', weekStart);
    } catch (error) {
      console.warn('Failed to save week to localStorage:', error);
    }
  };

  // Load saved week from localStorage on mount, ensuring it's within window
  useEffect(() => {
    const loadSavedWeek = async () => {
      if (selectedBusinessId) {
        try {
          const savedWeek = localStorage.getItem('schedule_current_week');
          if (savedWeek) {
            const selectedBusiness = businesses.find(b => b.business_id === selectedBusinessId);
            if (selectedBusiness && isWeekInEditableWindow(savedWeek)) {
              setCurrentWeek(savedWeek);
            } else if (selectedBusiness) {
              // If saved week is outside window, use current week
              const currentWeekForBusiness = getCurrentWeekStart();
              setCurrentWeek(currentWeekForBusiness);
              localStorage.setItem('schedule_current_week', currentWeekForBusiness);
            }
          }
        } catch (error) {
          console.warn('Failed to read from localStorage:', error);
          // Clear potentially corrupted localStorage data
          try {
            localStorage.removeItem('schedule_current_week');
          } catch (clearError) {
            console.warn('Failed to clear corrupted localStorage:', clearError);
          }
        }
      }
    };
    
    loadSavedWeek();
  }, [selectedBusinessId, businesses]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                Schedule Management
              </h1>
            </div>
            
            {selectedBusinessId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplateManager(true)}
              >
                Manage Shift Templates
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Business Selection */}
        <div className="mb-6">
          <BusinessScheduleSelector
            businesses={businesses}
            selectedBusinessId={selectedBusinessId}
            onBusinessChange={handleBusinessChange}
            loading={loading}
          />
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {selectedBusinessId && (
          <>
            {/* Week Navigation */}
            <div className="mb-6">
              <WeekNavigator
                currentWeek={currentWeek}
                onWeekChange={handleWeekChange}
                business={businesses.find(b => b.business_id === selectedBusinessId)}
              />
            </div>

            {/* Schedule Tabs */}
            <div className="mb-6">
              <ScheduleTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                scheduleStatus={weeklySchedule?.status}
                onPostSchedule={handlePostSchedule}
                onUnpostSchedule={handleUnpostSchedule}
                loading={loading}
                shiftCount={weeklySchedule?.shifts?.length || 0}
                hasPostedVersion={hasPostedVersion}
              />
            </div>

            {/* Schedule Content */}
            {loading ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading schedule...</p>
              </div>
            ) : weeklySchedule ? (
              <div className="bg-white rounded-lg shadow">
                {activeTab === 'edit' ? (
                  <WeeklyScheduleView
                    businessId={selectedBusinessId}
                    weekStartDate={currentWeek}
                    employees={weeklySchedule.employees}
                    shifts={weeklySchedule.shifts}
                    shiftTemplates={shiftTemplates}
                    mode="edit"
                    business={businesses.find(b => b.business_id === selectedBusinessId)}
                    onShiftCreate={handleShiftCreate}
                    onShiftUpdate={handleShiftUpdate}
                    onShiftDelete={handleShiftDelete}
                  />
                ) : (
                  <PostedScheduleView
                    weeklySchedule={weeklySchedule}
                    shiftTemplates={shiftTemplates}
                  />
                )}
              </div>
            ) : !selectedBusinessId ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600">Select a business to view schedules</p>
              </div>
            ) : activeTab === 'posted' ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="max-w-md mx-auto">
                  <div className="text-gray-400 mb-4">
                    <span className="text-6xl">📅</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Posted Schedule</h3>
                  <p className="text-gray-600 mb-4">
                    No schedule has been posted for this week yet. Switch to the Edit Schedule tab to create one.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab('edit')}
                  >
                    Create Schedule
                  </Button>
                </div>
              </div>
            ) : !isWeekInEditableWindow(currentWeek) ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="max-w-md mx-auto">
                  <div className="text-amber-400 mb-4">
                    <span className="text-6xl">🔒</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Week Not Editable</h3>
                  <p className="text-gray-600">
                    This week is outside the current 4-week scheduling window and cannot be edited.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600">
                  Failed to load schedule data. Please try refreshing the page or contact support if the issue persists.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Shift Template Manager Modal */}
      {showTemplateManager && (
        <ShiftTemplateManager
          businessId={selectedBusinessId}
          templates={shiftTemplates}
          onClose={() => setShowTemplateManager(false)}
          onTemplatesUpdate={setShiftTemplates}
        />
      )}
    </div>
  );
}
