import React from 'react';
import { Plus } from 'lucide-react';
import { ShiftBlock } from './ShiftBlock';
import { Shift, ShiftTemplate, formatTime } from '../../lib/schedules-api';

interface ScheduleCellProps {
  employeeId: string;
  employeeName: string;
  dayOfWeek: number;
  dayLabel: string;
  shifts: Shift[];
  shiftTemplates: ShiftTemplate[];
  mode: 'edit' | 'posted';
  onCellClick: () => void;
}

export function ScheduleCell({
  employeeId,
  employeeName,
  dayOfWeek,
  dayLabel,
  shifts,
  shiftTemplates,
  mode,
  onCellClick
}: ScheduleCellProps) {
  const totalHours = shifts.reduce((sum, shift) => sum + shift.duration_hours, 0);

  const getShiftTemplate = (templateId?: string) => {
    return shiftTemplates.find(t => t.id === templateId);
  };

  return (
    <div 
      className={`min-h-[80px] w-full border border-gray-200 rounded-md p-2 transition-colors ${
        mode === 'edit' 
          ? 'cursor-pointer hover:bg-blue-50 hover:border-blue-300' 
          : 'cursor-default'
      }`}
      onClick={onCellClick}
    >
      {shifts.length === 0 ? (
        // Empty cell
        <div className="h-full flex items-center justify-center">
          {mode === 'edit' && (
            <div className="text-gray-400 hover:text-blue-500 transition-colors">
              <Plus className="h-5 w-5" />
            </div>
          )}
        </div>
      ) : (
        // Shifts display
        <div className="space-y-1">
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
          
          {/* Total hours for the day */}
          {totalHours > 0 && (
            <div className="text-xs text-gray-500 mt-2 pt-1 border-t border-gray-100">
              {totalHours.toFixed(1)}h total
            </div>
          )}
        </div>
      )}
    </div>
  );
}
