import { useState, useEffect } from 'react';
import { Plus, Lock } from 'lucide-react';
import { ShiftBlock } from './ShiftBlock';
import { Shift, ShiftTemplate, isWeekInEditableWindow } from '../../lib/schedules-api';
import { Business } from '../../lib/business-api';

interface ScheduleCellProps {
  employeeId: string;
  employeeName: string;
  dayOfWeek: number;
  dayLabel: string;
  shifts: Shift[];
  shiftTemplates: ShiftTemplate[];
  mode: 'edit' | 'posted';
  onCellClick: () => void;
  business?: Business;
  weekStartDate: string;
}

export function ScheduleCell({
  employeeId: _employeeId,
  employeeName: _employeeName,
  dayOfWeek: _dayOfWeek,
  dayLabel: _dayLabel,
  shifts,
  shiftTemplates,
  mode,
  onCellClick,
  business,
  weekStartDate
}: ScheduleCellProps) {
  const [isEditable, setIsEditable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Calculate total hours for potential future use (currently not displayed)
  // const totalHours = shifts.reduce((sum, shift) => sum + shift.duration_hours, 0);
  
  // Check if this week is editable (within 4-week window)
  useEffect(() => {
    setIsLoading(true);
    try {
      if (mode === 'edit' && business) {
        const editable = isWeekInEditableWindow(weekStartDate);
        setIsEditable(editable);
      } else {
        setIsEditable(false);
      }
    } catch (error) {
      console.error('Error checking week editability:', error);
      setIsEditable(false);
    } finally {
      setIsLoading(false);
    }
  }, [mode, business, weekStartDate]);

  const getShiftTemplate = (templateId?: string) => {
    return shiftTemplates.find(t => t.id === templateId);
  };

  return (
    <button 
      className={`w-full rounded-xl border border-gray-200 bg-white p-2 text-left min-h-[88px] transition-colors ${
        isEditable && !isLoading
          ? 'cursor-pointer hover:border-gray-300' 
          : mode === 'edit' && (!isEditable || isLoading)
          ? 'cursor-not-allowed bg-gray-50 border-gray-300'
          : 'cursor-default'
      }`}
      onClick={isEditable && !isLoading ? onCellClick : undefined}
      title={(!isEditable && mode === 'edit') ? 'Week is outside the 4-week scheduling window' : 
             (isLoading && mode === 'edit') ? 'Loading...' : undefined}
    >
      {shifts.length === 0 ? (
        // Empty cell
        <div className="flex h-16 items-center justify-center text-gray-400">
          {isLoading && mode === 'edit' ? (
            <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-transparent rounded-full"></div>
          ) : isEditable ? (
            <Plus className="h-5 w-5 transition-colors hover:text-blue-500" />
          ) : mode === 'edit' && !isEditable ? (
            <Lock className="h-4 w-4 text-gray-300" />
          ) : (
            <Plus className="h-5 w-5" />
          )}
        </div>
      ) : (
        // Shifts display
        <div className="space-y-2">
          {shifts.map((shift) => {
            const template = getShiftTemplate(shift.shift_template_id);
            return (
              <ShiftBlock
                key={shift.id}
                shift={shift}
                template={template}
                mode={mode}
              />
            );
          })}
        </div>
      )}
    </button>
  );
}
