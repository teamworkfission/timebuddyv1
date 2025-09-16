import { Shift, ShiftTemplate, formatTime } from '../../lib/schedules-api';

interface ShiftBlockProps {
  shift: Shift;
  template?: ShiftTemplate;
  mode: 'edit' | 'posted';
}

export function ShiftBlock({ shift, template }: ShiftBlockProps) {

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
        {formatTime(shift.start_time)} – {formatTime(shift.end_time)}
      </div>
    </div>
  );
}

