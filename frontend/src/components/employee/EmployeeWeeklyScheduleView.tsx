import { Shift, formatShiftTime } from '../../lib/schedules-api';

interface Business {
  business_id: string;
  name: string;
}

interface EmployeeWeeklyScheduleViewProps {
  weekStartDate: string;
  allShifts: Array<Shift & { business_name: string; business_id?: string }>;
  businesses: Business[];
  selectedBusinessId: string | null;
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

// Color palette for different employers (consistent across shifts)
const EMPLOYER_COLORS = [
  'bg-blue-500',
  'bg-green-500', 
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-orange-500',
  'bg-red-500',
  'bg-teal-500'
];

export function EmployeeWeeklyScheduleView({
  weekStartDate,
  allShifts,
  businesses,
  selectedBusinessId
}: EmployeeWeeklyScheduleViewProps) {

  // Filter shifts based on selected business
  const filteredShifts = selectedBusinessId 
    ? allShifts.filter(shift => shift.business_id === selectedBusinessId)
    : allShifts;

  const getShiftsForDay = (dayOfWeek: number): Array<Shift & { business_name: string; business_id?: string }> => {
    return filteredShifts
      .filter(shift => shift.day_of_week === dayOfWeek)
      .sort((a, b) => a.start_min - b.start_min);
  };

  const getBusinessForShift = (shift: Shift & { business_name: string; business_id?: string }): Business | undefined => {
    return businesses.find(b => b.business_id === shift.business_id) || {
      business_id: shift.business_id || '',
      name: shift.business_name
    };
  };

  const getBusinessColor = (businessId: string): string => {
    const index = businesses.findIndex(b => b.business_id === businessId);
    return EMPLOYER_COLORS[index % EMPLOYER_COLORS.length];
  };


  const calculateWeekTotal = (): number => {
    return filteredShifts.reduce((total, shift) => total + (shift.duration_hours || 0), 0);
  };

  const getDateForDay = (dayOfWeek: number): Date => {
    const date = new Date(weekStartDate + 'T00:00:00');
    date.setDate(date.getDate() + dayOfWeek);
    return date;
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Mobile-First Header with Week Total */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">My Schedule</h3>
          <div className="text-sm text-gray-600">
            <span className="font-medium">{calculateWeekTotal()}h</span> this week
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredShifts.length === 0 && (
        <div className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <span className="text-2xl">📅</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No shifts scheduled</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            {selectedBusinessId 
              ? "No shifts scheduled with this employer for this week."
              : "You don't have any shifts scheduled for this week."}
          </p>
        </div>
      )}

      {/* Desktop View - Hidden on Mobile */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                {DAYS.map((day) => (
                  <th key={day.key} className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider w-1/7">
                    <div className="flex flex-col">
                      <span>{day.fullLabel}</span>
                      <span className="text-xs text-gray-400 font-normal">
                        {getDateForDay(day.key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                {DAYS.map((day) => (
                  <td key={day.key} className="px-4 py-4 align-top">
                    <div className="space-y-2">
                      {getShiftsForDay(day.key).map((shift) => {
                        const business = getBusinessForShift(shift);
                        const businessColor = business ? getBusinessColor(business.business_id) : 'bg-gray-500';
                        
                        return (
                          <div
                            key={shift.id}
                            className={`${businessColor} text-white p-2 rounded text-xs`}
                          >
                            <div className="font-medium">
                              {formatShiftTime(shift).start} - {formatShiftTime(shift).end}
                            </div>
                            {!selectedBusinessId && business && (
                              <div className="text-xs opacity-90 mt-1">
                                {business.name}
                              </div>
                            )}
                            <div className="text-xs opacity-90">
                              {shift.duration_hours}h
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View - Card Layout */}
      <div className="md:hidden">
        <div className="divide-y divide-gray-200">
          {DAYS.map((day) => {
            const dayShifts = getShiftsForDay(day.key);
            const dayDate = getDateForDay(day.key);
            
            return (
              <div key={day.key} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{day.fullLabel}</h4>
                    <p className="text-xs text-gray-500">
                      {dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {dayShifts.reduce((total, shift) => total + (shift.duration_hours || 0), 0)}h
                  </div>
                </div>

                {dayShifts.length === 0 ? (
                  <div className="text-sm text-gray-400 italic">No shifts</div>
                ) : (
                  <div className="space-y-2">
                    {dayShifts.map((shift) => {
                      const business = getBusinessForShift(shift);
                      const businessColor = business ? getBusinessColor(business.business_id) : 'bg-gray-500';
                      
                      return (
                        <div
                          key={shift.id}
                          className={`${businessColor} text-white p-3 rounded-lg`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-medium">
                              {formatShiftTime(shift).start} - {formatShiftTime(shift).end}
                            </div>
                            <div className="text-sm opacity-90">
                              {shift.duration_hours}h
                            </div>
                          </div>
                          {!selectedBusinessId && business && (
                            <div className="text-sm opacity-90 mt-1">
                              📍 {business.name}
                            </div>
                          )}
                          {shift.notes && (
                            <div className="text-sm opacity-90 mt-1">
                              💡 {shift.notes}
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

      {/* Multi-Employer Legend (only when showing all employers) */}
      {!selectedBusinessId && businesses.length > 1 && (
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {businesses.map((business, index) => (
              <div key={business.business_id} className="flex items-center text-sm">
                <div className={`w-3 h-3 ${EMPLOYER_COLORS[index % EMPLOYER_COLORS.length]} rounded mr-2`}></div>
                <span className="text-gray-700">{business.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
