import { useState } from 'react';
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
    
    // Use AM/PM labels if available, fallback to converting legacy time
    const templateTime = formatTemplateTime(template);
    setFormData({
      name: template.name,
      start_time: templateTime.start,
      end_time: templateTime.end,
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
        start_time: `${formData.start_time}:00`,
        end_time: `${formData.end_time}:00`,
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

              <div className="grid grid-cols-2 gap-4">
                <AMPMTimeInput
                  label="Start Time *"
                  value={formData.start_time}
                  onChange={(value) => setFormData(prev => ({ ...prev, start_time: value }))}
                  placeholder="Select start time..."
                />
                <AMPMTimeInput
                  label="End Time *"
                  value={formData.end_time}
                  onChange={(value) => setFormData(prev => ({ ...prev, end_time: value }))}
                  placeholder="Select end time..."
                />
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
