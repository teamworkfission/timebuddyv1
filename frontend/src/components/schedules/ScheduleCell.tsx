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
  
  const totalHours = shifts.reduce((sum, shift) => sum + shift.duration_hours, 0);
  
  // Check if this week is editable (within 4-week window)
  useEffect(() => {
    const checkEditability = async () => {
      setIsLoading(true);
      try {
        if (mode === 'edit' && business) {
          const editable = await isWeekInEditableWindow(weekStartDate, business);
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
    };

    checkEditability();
  }, [mode, business, weekStartDate]);

  const getShiftTemplate = (templateId?: string) => {
    return shiftTemplates.find(t => t.id === templateId);
  };

  return (
    <div 
      className={`min-h-[80px] w-full border border-gray-200 rounded-md p-2 transition-colors ${
        isEditable && !isLoading
          ? 'cursor-pointer hover:bg-blue-50 hover:border-blue-300' 
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
        <div className="h-full flex items-center justify-center">
          {isLoading && mode === 'edit' ? (
            <div className="text-gray-300" title="Loading...">
              <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-transparent rounded-full"></div>
            </div>
          ) : isEditable ? (
            <div className="text-gray-400 hover:text-blue-500 transition-colors">
              <Plus className="h-5 w-5" />
            </div>
          ) : mode === 'edit' && !isEditable ? (
            <div className="text-gray-300" title="Outside scheduling window">
              <Lock className="h-4 w-4" />
            </div>
          ) : null}
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
