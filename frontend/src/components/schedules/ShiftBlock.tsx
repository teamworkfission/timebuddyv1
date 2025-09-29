import { Shift, ShiftTemplate, formatShiftTime } from '../../lib/schedules-api';

interface ShiftBlockProps {
  shift: Shift;
  template?: ShiftTemplate;
  mode: 'edit' | 'posted';
}

export function ShiftBlock({ shift, template }: ShiftBlockProps) {
  const shiftTime = formatShiftTime(shift);

  return (
    <div
      className="rounded-lg px-3 py-2 text-white"
      style={{ backgroundColor: template?.color || '#3B82F6' }}
    >
      {/* Template name */}
      <div className="text-xs font-semibold">
        {template?.name || 'Shift'}
      </div>
      
      {/* Time range */}
      <div className="text-[11px] opacity-90">
        {shiftTime.start} – {shiftTime.end}
      </div>
    </div>
  );
}

