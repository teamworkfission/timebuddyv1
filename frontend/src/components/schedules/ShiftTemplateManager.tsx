import { useState, useCallback } from 'react';
import { X, Plus, Edit2, Trash2, Clock, Palette } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { AMPMTimeInput } from '../ui/AMPMTimeInput';
import { 
  ShiftTemplate, 
  CreateShiftTemplateDto, 
  SchedulesApi, 
  formatTemplateTime 
} from '../../lib/schedules-api';

interface ShiftTemplateManagerProps {
  businessId: string;
  templates: ShiftTemplate[];
  onClose: () => void;
  onTemplatesUpdate: (templates: ShiftTemplate[]) => void;
}

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#8B5CF6', // Purple
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
];

export function ShiftTemplateManager({
  businessId,
  templates,
  onClose,
  onTemplatesUpdate
}: ShiftTemplateManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ShiftTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    start_time: '',
    end_time: '',
    color: '#3B82F6'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoized onChange callbacks to prevent infinite re-renders
  const handleStartTimeChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, start_time: value }));
  }, []);

  const handleEndTimeChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, end_time: value }));
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      start_time: '',
      end_time: '',
      color: '#3B82F6'
    });
    setError(null);
  };

  const handleCreate = () => {
    setShowCreateForm(true);
    setEditingTemplate(null);
    resetForm();
  };

  const handleEdit = (template: ShiftTemplate) => {
    setEditingTemplate(template);
    setShowCreateForm(true);
    
    // Convert template times to format expected by AMPMTimeInput (24-hour HH:MM)
    const convertTimeToInput = (timeString: string): string => {
      // Handle HH:MM:SS format from backend
      if (timeString.match(/^\d{1,2}:\d{2}:\d{2}$/)) {
        return timeString.substring(0, 5); // Remove seconds, keep HH:MM
      }
      // Handle HH:MM format
      if (timeString.match(/^\d{1,2}:\d{2}$/)) {
        return timeString;
      }
      // Handle AM/PM format - convert to 24-hour
      const ampmMatch = timeString.match(/^(\d{1,2})(?::(\d{2}))?\s?(AM|PM)$/i);
      if (ampmMatch) {
        let hour = parseInt(ampmMatch[1]);
        const minute = ampmMatch[2] || '00';
        const period = ampmMatch[3].toUpperCase();
        
        if (period === 'AM' && hour === 12) hour = 0;
        else if (period === 'PM' && hour !== 12) hour += 12;
        
        return `${hour.toString().padStart(2, '0')}:${minute}`;
      }
      return timeString;
    };

    setFormData({
      name: template.name,
      start_time: convertTimeToInput(template.start_time),
      end_time: convertTimeToInput(template.end_time),
      color: template.color
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.start_time || !formData.end_time) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const templateData: CreateShiftTemplateDto = {
        name: formData.name.trim(),
        start_time: formData.start_time.includes(':') ? `${formData.start_time}:00` : `${formData.start_time}:00:00`,
        end_time: formData.end_time.includes(':') ? `${formData.end_time}:00` : `${formData.end_time}:00:00`,
        color: formData.color
      };

      let updatedTemplate: ShiftTemplate;

      if (editingTemplate) {
        updatedTemplate = await SchedulesApi.updateShiftTemplate(editingTemplate.id, templateData);
        const updatedTemplates = templates.map(t => 
          t.id === editingTemplate.id ? updatedTemplate : t
        );
        onTemplatesUpdate(updatedTemplates);
      } else {
        updatedTemplate = await SchedulesApi.createShiftTemplate(businessId, templateData);
        onTemplatesUpdate([...templates, updatedTemplate]);
      }

      setShowCreateForm(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this shift template?')) {
      return;
    }

    setLoading(true);
    try {
      await SchedulesApi.deleteShiftTemplate(templateId);
      const updatedTemplates = templates.filter(t => t.id !== templateId);
      onTemplatesUpdate(updatedTemplates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} maxWidth="lg" title="Manage Shift Templates">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Manage Shift Templates
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Create/Edit Form */}
        {showCreateForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <h3 className="text-md font-medium text-gray-900 mb-4">
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Morning, Afternoon, Night"
                  className="w-full"
                  required
                />
              </div>

              {/* Time Selection - Vertical Layout */}
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-900 mb-4 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Shift Duration
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <AMPMTimeInput
                        label="From (Start Time) *"
                        value={formData.start_time}
                        onChange={handleStartTimeChange}
                        placeholder="Select when this shift begins..."
                      />
                    </div>
                    
                    {/* Visual Connector */}
                    <div className="flex justify-center">
                      <div className="flex items-center text-gray-400">
                        <div className="h-0.5 w-8 bg-gray-300"></div>
                        <span className="mx-2 text-sm font-medium">to</span>
                        <div className="h-0.5 w-8 bg-gray-300"></div>
                      </div>
                    </div>
                    
                    <div>
                      <AMPMTimeInput
                        label="To (End Time) *"
                        value={formData.end_time}
                        onChange={handleEndTimeChange}
                        placeholder="Select when this shift ends..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          formData.color === color 
                            ? 'border-gray-400 scale-110' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-12 h-8 p-0 border-0"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : editingTemplate ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Templates List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-medium text-gray-900">
              Current Templates ({templates.length})
            </h3>
            {!showCreateForm && (
              <Button
                onClick={handleCreate}
                size="sm"
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Template</span>
              </Button>
            )}
          </div>

          {templates.length === 0 ? (
            <div className="text-center py-8">
              <Palette className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No shift templates created yet.</p>
              <p className="text-sm text-gray-500 mt-1">
                Create templates to quickly assign common shifts.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: template.color }}
                    />
                    <div>
                      <div className="font-medium text-gray-900">
                        {template.name}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatTemplateTime(template).start} - {formatTemplateTime(template).end}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(template)}
                      disabled={loading}
                      className="text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
