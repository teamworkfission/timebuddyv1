import React from 'react';
import { Clock, User, Calendar } from 'lucide-react';
import { WeeklySchedule, ShiftTemplate, formatTime } from '../../lib/schedules-api';

interface PostedScheduleViewProps {
  weeklySchedule: WeeklySchedule;
  shiftTemplates: ShiftTemplate[];
}

// US Week Order: Sunday to Saturday (0-6)
const DAYS = [
  { key: 0, label: 'Sun', fullLabel: 'Sunday' },
  { key: 1, label: 'Mon', fullLabel: 'Monday' },
  { key: 2, label: 'Tue', fullLabel: 'Tuesday' },
  { key: 3, label: 'Wed', fullLabel: 'Wednesday' },
  { key: 4, label: 'Thu', fullLabel: 'Thursday' },
  { key: 5, label: 'Fri', fullLabel: 'Friday' },
  { key: 6, label: 'Sat', fullLabel: 'Saturday' }
];

export function PostedScheduleView({ weeklySchedule, shiftTemplates }: PostedScheduleViewProps) {
  const getShiftTemplate = (templateId?: string) => {
    return shiftTemplates.find(t => t.id === templateId);
  };

  const getShiftsForEmployee = (employeeId: string) => {
    return weeklySchedule.shifts.filter(shift => shift.employee_id === employeeId);
  };

  const getShiftsForDay = (dayOfWeek: number) => {
    return weeklySchedule.shifts.filter(shift => shift.day_of_week === dayOfWeek);
  };

  const totalScheduledHours = Object.values(weeklySchedule.total_hours_by_employee)
    .reduce((sum, hours) => sum + hours, 0);

  return (
    <div className="p-6">
      {/* Schedule Summary */}
      <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Calendar className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold text-green-900">
            Schedule Posted
          </h2>
        </div>
        <p className="text-green-800 text-sm">
          This schedule is live and visible to employees. Posted on{' '}
          {weeklySchedule.posted_at && new Date(weeklySchedule.posted_at).toLocaleDateString()}
        </p>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-900">
              {weeklySchedule.employees.length}
            </div>
            <div className="text-sm text-green-700">Employees</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-900">
              {weeklySchedule.shifts.length}
            </div>
            <div className="text-sm text-green-700">Total Shifts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-900">
              {totalScheduledHours.toFixed(1)}
            </div>
            <div className="text-sm text-green-700">Total Hours</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-900">
              {(totalScheduledHours / weeklySchedule.employees.length).toFixed(1)}
            </div>
            <div className="text-sm text-green-700">Avg Hours/Employee</div>
          </div>
        </div>
      </div>

      {/* Employee Hours Summary */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Hours Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {weeklySchedule.employees.map((employee) => {
            const employeeHours = weeklySchedule.total_hours_by_employee[employee.id] || 0;
            const employeeShifts = getShiftsForEmployee(employee.id);
            
            return (
              <div key={employee.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <User className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="font-medium text-gray-900">{employee.full_name}</div>
                    <div className="text-sm text-gray-500">ID: {employee.employee_gid}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-blue-600">
                    {employeeHours.toFixed(1)}h
                  </div>
                  <div className="text-sm text-gray-500">
                    {employeeShifts.length} shift{employeeShifts.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Schedule Breakdown */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Schedule Breakdown</h3>
        <div className="space-y-6">
          {DAYS.map((day) => {
            const dayShifts = getShiftsForDay(day.key);
            const dayDate = new Date(weeklySchedule.week_start_date + 'T00:00:00');
            dayDate.setDate(dayDate.getDate() + day.key); // Sunday=0, Monday=1, etc.
            
            return (
              <div key={day.key} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {day.fullLabel}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {dayDate.toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {dayShifts.length} shift{dayShifts.length !== 1 ? 's' : ''}
                    </div>
                    <div className="text-sm text-gray-500">
                      {dayShifts.reduce((sum, shift) => sum + shift.duration_hours, 0).toFixed(1)}h total
                    </div>
                  </div>
                </div>

                {dayShifts.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No shifts scheduled</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {dayShifts
                      .sort((a, b) => a.start_time.localeCompare(b.start_time))
                      .map((shift) => {
                        const employee = weeklySchedule.employees.find(e => e.id === shift.employee_id);
                        const template = getShiftTemplate(shift.shift_template_id);
                        
                        return (
                          <div
                            key={shift.id}
                            className="border border-gray-200 rounded-md p-3"
                            style={{ 
                              borderLeftColor: template?.color || '#6B7280',
                              borderLeftWidth: '4px'
                            }}
                          >
                            <div className="font-medium text-gray-900 mb-1">
                              {employee?.full_name}
                            </div>
                            <div className="flex items-center space-x-1 text-sm text-gray-600 mb-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {template?.name || 'Custom'} • {shift.duration_hours.toFixed(1)}h
                            </div>
                            {shift.notes && (
                              <div className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                                {shift.notes}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
