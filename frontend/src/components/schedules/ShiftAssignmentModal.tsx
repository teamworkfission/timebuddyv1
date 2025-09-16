import { useState, useEffect } from 'react';
import { X, Clock, Plus, Edit2, Trash2, FileText } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AMPMTimeInput } from '../ui/AMPMTimeInput';
import { 
  Shift, 
  ShiftTemplate, 
  CreateShiftDto, 
  UpdateShiftDto, 
  formatShiftTime,
  formatTemplateTime
} from '../../lib/schedules-api';

interface ShiftAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  dayName: string;
  dayOfWeek: number;
  existingShifts: Shift[];
  shiftTemplates: ShiftTemplate[];
  onAssignShift: (shift: CreateShiftDto) => void;
  onUpdateShift: (shiftId: string, shift: UpdateShiftDto) => void;
  onDeleteShift: (shiftId: string) => void;
}

export function ShiftAssignmentModal({
  isOpen,
  onClose,
  employeeId,
  employeeName,
  dayName,
  dayOfWeek,
  existingShifts,
  shiftTemplates,
  onAssignShift,
  onUpdateShift,
  onDeleteShift
}: ShiftAssignmentModalProps) {
  const [mode, setMode] = useState<'template' | 'custom' | 'edit'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customTime, setCustomTime] = useState({ start: '', end: '' });
  const [notes, setNotes] = useState('');
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode('template');
      setSelectedTemplate('');
      setCustomTime({ start: '', end: '' });
      setNotes('');
      setEditingShift(null);
      setError(null);
    }
  }, [isOpen]);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    setError(null);
  };

  const handleCustomTimeChange = (field: 'start' | 'end', value: string) => {
    setCustomTime(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleAssignTemplate = () => {
    const template = shiftTemplates.find(t => t.id === selectedTemplate);
    if (!template) {
      setError('Please select a shift template');
      return;
    }

    const shift: CreateShiftDto = {
      employee_id: employeeId,
      day_of_week: dayOfWeek,
      // Use AM/PM labels if available, fallback to legacy format
      start_label: template.start_label,
      end_label: template.end_label,
      start_time: template.start_time, // Legacy fallback
      end_time: template.end_time,     // Legacy fallback
      shift_template_id: template.id,
      notes: notes.trim() || undefined
    };

    onAssignShift(shift);
  };

  const handleAssignCustom = () => {
    if (!customTime.start || !customTime.end) {
      setError('Please enter both start and end times');
      return;
    }

    // Create shift using AM/PM format (no Date object validation needed)
    const shift: CreateShiftDto = {
      employee_id: employeeId,
      day_of_week: dayOfWeek,
      // Primary: AM/PM labels
      start_label: customTime.start, // e.g., "9:00 AM"
      end_label: customTime.end,     // e.g., "5:00 PM"
      notes: notes.trim() || undefined
    };

    onAssignShift(shift);
  };

  const handleEditShift = (shift: Shift) => {
    setEditingShift(shift);
    setMode('edit');
    
    // Use AM/PM labels if available, fallback to converting legacy time
    const shiftTime = formatShiftTime(shift);
    setCustomTime({
      start: shiftTime.start,
      end: shiftTime.end
    });
    setNotes(shift.notes || '');
    
    // If shift has a template, select it
    if (shift.shift_template_id) {
      setSelectedTemplate(shift.shift_template_id);
    }
  };

  const handleUpdateShift = () => {
    if (!editingShift) return;

    if (!customTime.start || !customTime.end) {
      setError('Please enter both start and end times');
      return;
    }

    const update: UpdateShiftDto = {
      // Primary: AM/PM labels
      start_label: customTime.start, // e.g., "9:00 AM"
      end_label: customTime.end,     // e.g., "5:00 PM"
      notes: notes.trim() || undefined
    };

    onUpdateShift(editingShift.id, update);
    setEditingShift(null);
    setMode('template');
  };

  const handleDeleteShift = (shiftId: string) => {
    if (confirm('Are you sure you want to delete this shift?')) {
      onDeleteShift(shiftId);
      setEditingShift(null);
      setMode('template');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md" title="Assign Shift">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Manage Shifts
            </h2>
            <p className="text-sm text-gray-600">
              {employeeName} - {dayName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Existing Shifts */}
        {existingShifts.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Current Shifts</h3>
            <div className="space-y-2">
              {existingShifts.map((shift) => {
                const template = shiftTemplates.find(t => t.id === shift.shift_template_id);
                return (
                  <div
                    key={shift.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: template?.color || '#6B7280' }}
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {template?.name || 'Custom'}
                        </div>
                        <div className="text-xs text-gray-600 flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatShiftTime(shift).start} - {formatShiftTime(shift).end}
                          </span>
                          <span>({shift.duration_hours.toFixed(1)}h)</span>
                        </div>
                        {shift.notes && (
                          <div className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
                            <FileText className="h-3 w-3" />
                            <span>{shift.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditShift(shift)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteShift(shift.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Mode Selection */}
        {mode !== 'edit' && (
          <div className="mb-6">
            <div className="flex space-x-2">
              <button
                onClick={() => setMode('template')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  mode === 'template'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Use Template
              </button>
              <button
                onClick={() => setMode('custom')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  mode === 'custom'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Custom Time
              </button>
            </div>
          </div>
        )}

        {/* Template Selection */}
        {mode === 'template' && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Select Shift Template</h3>
            <div className="grid grid-cols-1 gap-2">
              {shiftTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  className={`p-3 text-left border rounded-md transition-colors ${
                    selectedTemplate === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: template.color }}
                    />
                    <div>
                      <div className="font-medium text-gray-900">{template.name}</div>
                      <div className="text-sm text-gray-600 flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatTemplateTime(template).start} - {formatTemplateTime(template).end}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom Time Selection */}
        {(mode === 'custom' || mode === 'edit') && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              {mode === 'edit' ? 'Edit Shift Time' : 'Set Custom Time'}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <AMPMTimeInput
                label="Start Time"
                value={customTime.start}
                onChange={(value) => handleCustomTimeChange('start', value)}
                placeholder="Select start time..."
                error={error && !customTime.start ? 'Start time required' : ''}
              />
              <AMPMTimeInput
                label="End Time"
                value={customTime.end}
                onChange={(value) => handleCustomTimeChange('end', value)}
                placeholder="Select end time..."
                error={error && !customTime.end ? 'End time required' : ''}
              />
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes for this shift..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          
          {mode === 'template' && (
            <Button 
              onClick={handleAssignTemplate}
              disabled={!selectedTemplate}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Assign Shift</span>
            </Button>
          )}
          
          {mode === 'custom' && (
            <Button 
              onClick={handleAssignCustom}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create Shift</span>
            </Button>
          )}
          
          {mode === 'edit' && (
            <Button 
              onClick={handleUpdateShift}
              className="flex items-center space-x-2"
            >
              <Edit2 className="h-4 w-4" />
              <span>Update Shift</span>
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
