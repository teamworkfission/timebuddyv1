import { useState } from 'react';
import { Plus } from 'lucide-react';
import { ScheduleCell } from './ScheduleCell';
import { ShiftAssignmentModal } from './ShiftAssignmentModal';
import { 
  ScheduleEmployee, 
  Shift, 
  ShiftTemplate, 
  CreateShiftDto, 
  UpdateShiftDto
} from '../../lib/schedules-api';
import { Business } from '../../lib/business-api';

interface WeeklyScheduleViewProps {
  businessId: string;
  weekStartDate: string;
  employees: ScheduleEmployee[];
  shifts: Shift[];
  shiftTemplates: ShiftTemplate[];
  mode: 'edit' | 'posted';
  business?: Business;
  onShiftCreate: (shift: CreateShiftDto) => void;
  onShiftUpdate: (shiftId: string, shift: UpdateShiftDto) => void;
  onShiftDelete: (shiftId: string) => void;
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

export function WeeklyScheduleView({
  businessId: _businessId,
  weekStartDate,
  employees,
  shifts,
  shiftTemplates,
  mode,
  business,
  onShiftCreate,
  onShiftUpdate,
  onShiftDelete
}: WeeklyScheduleViewProps) {
  const [selectedCell, setSelectedCell] = useState<{
    employeeId: string;
    employeeName: string;
    dayOfWeek: number;
    dayName: string;
  } | null>(null);

  const getShiftsForCell = (employeeId: string, dayOfWeek: number): Shift[] => {
    return shifts.filter(shift => 
      shift.employee_id === employeeId && shift.day_of_week === dayOfWeek
    );
  };

  const handleCellClick = (employeeId: string, employeeName: string, dayOfWeek: number, dayName: string) => {
    if (mode === 'edit') {
      setSelectedCell({ employeeId, employeeName, dayOfWeek, dayName });
    }
  };

  const handleModalClose = () => {
    setSelectedCell(null);
  };

  const handleShiftAssign = (shift: CreateShiftDto) => {
    onShiftCreate(shift);
    setSelectedCell(null);
  };

  const handleShiftUpdate = (shiftId: string, shift: UpdateShiftDto) => {
    onShiftUpdate(shiftId, shift);
    setSelectedCell(null); // Close modal after successful update
  };

  const handleShiftDelete = (shiftId: string) => {
    onShiftDelete(shiftId);
    setSelectedCell(null); // Close modal after successful delete
  };

  if (employees.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Plus className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Employees Found</h3>
          <p className="text-gray-600 mb-4">
            Add employees to your business to start creating schedules.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      {/* Desktop/Tablet View */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          {/* Header */}
          <div className="grid grid-cols-[180px_repeat(7,minmax(120px,1fr))] gap-2 px-3 py-3 bg-gray-50 border-b border-gray-200">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Employee
            </div>
            {DAYS.map((day) => (
              <div key={day.key} className="text-xs font-medium text-gray-500 uppercase tracking-wide text-center">
                <div className="font-semibold">{day.label}</div>
                <div className="text-gray-400 mt-1">
                  {new Date(new Date(weekStartDate + 'T00:00:00').getTime() + day.key * 24 * 60 * 60 * 1000).getDate()}
                </div>
              </div>
            ))}
          </div>

          {/* Rows */}
          {employees.map((employee) => (
            <div key={employee.id} className="grid grid-cols-[180px_repeat(7,minmax(120px,1fr))] gap-2 px-3 py-3 items-start border-b border-gray-200 hover:bg-gray-50">
              {/* Employee cell */}
              <div className="pr-3">
                <div className="font-medium text-gray-900 line-clamp-2 leading-snug">
                  {employee.full_name}
                </div>
                <div className="text-xs text-gray-400">
                  ID: {employee.employee_gid}
                </div>
              </div>

              {/* 7 day cells */}
              {DAYS.map((day) => (
                <div key={day.key} className="min-h-[88px]">
                  <ScheduleCell
                    employeeId={employee.id}
                    employeeName={employee.full_name}
                    dayOfWeek={day.key}
                    dayLabel={day.fullLabel}
                    shifts={getShiftsForCell(employee.id, day.key)}
                    shiftTemplates={shiftTemplates}
                    mode={mode}
                    business={business}
                    weekStartDate={weekStartDate}
                    onCellClick={() => handleCellClick(employee.id, employee.full_name, day.key, day.fullLabel)}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden">
        <div className="space-y-4 p-4">
          {employees.map((employee) => (
            <div key={employee.id} className="bg-gray-50 rounded-lg p-4">
              <div className="mb-3">
                <h3 className="font-medium text-gray-900">{employee.full_name}</h3>
                <p className="text-sm text-gray-500">ID: {employee.employee_gid}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {DAYS.map((day) => (
                  <div key={day.key} className="bg-white rounded p-2 border">
                    <div className="text-xs font-medium text-gray-500 mb-1">
                      {day.label} {new Date(new Date(weekStartDate + 'T00:00:00').getTime() + day.key * 24 * 60 * 60 * 1000).getDate()}
                    </div>
                    <ScheduleCell
                      employeeId={employee.id}
                      employeeName={employee.full_name}
                      dayOfWeek={day.key}
                      dayLabel={day.fullLabel}
                      shifts={getShiftsForCell(employee.id, day.key)}
                      shiftTemplates={shiftTemplates}
                      mode={mode}
                      business={business}
                      weekStartDate={weekStartDate}
                      onCellClick={() => handleCellClick(employee.id, employee.full_name, day.key, day.fullLabel)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shift Assignment Modal */}
      {selectedCell && (
        <ShiftAssignmentModal
          isOpen={true}
          onClose={handleModalClose}
          employeeId={selectedCell.employeeId}
          employeeName={selectedCell.employeeName}
          dayName={selectedCell.dayName}
          dayOfWeek={selectedCell.dayOfWeek}
          weekStartDate={weekStartDate}
          existingShifts={getShiftsForCell(selectedCell.employeeId, selectedCell.dayOfWeek)}
          shiftTemplates={shiftTemplates}
          onAssignShift={handleShiftAssign}
          onUpdateShift={handleShiftUpdate}
          onDeleteShift={handleShiftDelete}
        />
      )}
    </div>
  );
}
