import React from 'react';
import { Clock, FileText } from 'lucide-react';
import { Shift, ShiftTemplate, formatTime } from '../../lib/schedules-api';

interface ShiftBlockProps {
  shift: Shift;
  template?: ShiftTemplate;
  mode: 'edit' | 'posted';
}

export function ShiftBlock({ shift, template, mode }: ShiftBlockProps) {
  const backgroundColor = template?.color || '#6B7280';
  const isLightColor = isColorLight(backgroundColor);
  const textColor = isLightColor ? '#1F2937' : '#FFFFFF';

  return (
    <div
      className="rounded px-2 py-1 text-xs transition-all hover:shadow-sm"
      style={{ 
        backgroundColor,
        color: textColor,
        border: `1px solid ${darkenColor(backgroundColor, 0.1)}`
      }}
    >
      {/* Template name or custom label */}
      <div className="font-medium truncate">
        {template?.name || 'Custom'}
      </div>
      
      {/* Time range */}
      <div className="flex items-center space-x-1 mt-0.5">
        <Clock className="h-3 w-3 opacity-75" />
        <span className="truncate">
          {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
        </span>
      </div>
      
      {/* Duration */}
      <div className="text-xs opacity-75 mt-0.5">
        {shift.duration_hours.toFixed(1)}h
      </div>
      
      {/* Notes indicator */}
      {shift.notes && (
        <div className="flex items-center space-x-1 mt-0.5">
          <FileText className="h-3 w-3 opacity-75" />
          <span className="text-xs opacity-75 truncate">Notes</span>
        </div>
      )}
    </div>
  );
}

// Utility functions for color manipulation
function isColorLight(color: string): boolean {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

function darkenColor(color: string, factor: number): string {
  const hex = color.replace('#', '');
  const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - factor));
  const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - factor));
  const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - factor));
  
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
}
