import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';

interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReject: (reason: string, notes?: string) => Promise<void>;
  employeeName?: string;
  hoursAmount?: number;
  weekRange?: string;
  loading?: boolean;
}

export function RejectionModal({
  isOpen,
  onClose,
  onReject,
  employeeName,
  hoursAmount,
  weekRange
}: RejectionModalProps) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Common rejection reasons
  const commonReasons = [
    'Hours do not match scheduled time',
    'Missing required documentation',
    'Incorrect break time calculations',
    'Overtime hours need approval',
    'Schedule conflict detected',
    'Time entries need correction',
    'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rejectionReason.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      await onReject(rejectionReason.trim(), notes.trim() || undefined);
      
      // Reset form and close modal
      setRejectionReason('');
      setNotes('');
      onClose();
    } catch (error) {
      console.error('Failed to reject hours:', error);
      // Error handling will be done by parent component
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setRejectionReason('');
      setNotes('');
      onClose();
    }
  };

  const selectReason = (reason: string) => {
    setRejectionReason(reason);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-red-50 border-b border-red-200 p-6 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-bold text-red-900">Reject Hours Submission</h2>
                {employeeName && (
                  <div className="mt-2 text-sm text-red-700">
                    <div><strong>Employee:</strong> {employeeName}</div>
                    {hoursAmount && <div><strong>Hours:</strong> {hoursAmount}h</div>}
                    {weekRange && <div><strong>Week:</strong> {weekRange}</div>}
                  </div>
                )}
              </div>
            </div>
            <button 
              onClick={handleClose}
              disabled={submitting}
              className="ml-4 text-red-600 hover:text-red-800 p-1 rounded-lg hover:bg-red-100 transition-colors flex-shrink-0 disabled:opacity-50"
              aria-label="Close modal"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="p-6 flex-1 overflow-y-auto">
            {/* Reason Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Reason for Rejection <span className="text-red-500">*</span>
              </label>
              
              <div className="space-y-2 mb-4">
                {commonReasons.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => selectReason(reason)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      rejectionReason === reason
                        ? 'border-red-500 bg-red-50 text-red-900'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    disabled={submitting}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{reason}</span>
                      {rejectionReason === reason && (
                        <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom reason input */}
              {(rejectionReason === 'Other' || !commonReasons.includes(rejectionReason)) && (
                <textarea
                  value={rejectionReason === 'Other' ? '' : rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please specify the reason for rejection..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                  rows={3}
                  maxLength={500}
                  disabled={submitting}
                  required
                />
              )}
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional context or instructions for the employee..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                rows={3}
                maxLength={1000}
                disabled={submitting}
              />
              <div className="text-xs text-gray-500 mt-1">
                {notes.length}/1000 characters
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              disabled={!rejectionReason.trim() || submitting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Reject Hours
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
