import { useState } from 'react';
import { Button } from '../ui/Button';

interface EmployeeRateEditorProps {
  employeeId: string;
  employeeName: string;
  currentRate?: number;
  onSaveRate: (employeeId: string, rate: number) => Promise<void>;
  disabled?: boolean;
}

export function EmployeeRateEditor({ 
  employeeId, 
  currentRate, 
  onSaveRate, 
  disabled = false 
}: EmployeeRateEditorProps) {
  const [isEditing, setIsEditing] = useState(!currentRate || currentRate === 0);
  const [rate, setRate] = useState(currentRate?.toString() || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const rateValue = parseFloat(rate);
    
    if (isNaN(rateValue) || rateValue < 0) {
      setError('Please enter a valid hourly rate');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onSaveRate(employeeId, rateValue);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save rate');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setRate(currentRate?.toString() || '');
    setError(null);
    // Only allow cancel if there's an existing rate
    if (currentRate && currentRate > 0) {
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <span>💰</span>
          <span className="text-sm font-medium text-gray-700">Set Rate:</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">$</span>
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="15.50"
            step="0.01"
            min="0"
            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={saving || disabled}
            autoFocus
          />
          <span className="text-sm text-gray-600">/hr</span>
          
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || disabled || !rate}
            className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 text-xs"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
            ) : (
              'Save'
            )}
          </Button>
          
          {currentRate && currentRate > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={saving || disabled}
              className="px-2 py-1 text-xs"
            >
              Cancel
            </Button>
          )}
        </div>
        
        {error && (
          <div className="text-xs text-red-600">{error}</div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center space-x-2 group">
        <span>💰</span>
        <span className="text-sm font-medium text-gray-900">
          {currentRate && currentRate > 0 
            ? `$${currentRate.toFixed(2)}/hr`
            : 'Rate not set'
          }
        </span>
        <button
          onClick={() => setIsEditing(true)}
          disabled={disabled}
          className="opacity-0 group-hover:opacity-100 text-blue-600 hover:text-blue-800 text-xs font-medium transition-opacity disabled:opacity-50"
        >
          {currentRate && currentRate > 0 ? 'Edit' : 'Set Rate'}
        </button>
      </div>
      
      {currentRate && currentRate > 0 && (
        <div className="text-xs text-gray-500">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
