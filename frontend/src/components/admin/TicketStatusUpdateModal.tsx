import { useState } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { SupportTicket, updateTicketStatus } from '../../lib/admin-api';

interface TicketStatusUpdateModalProps {
  ticket: SupportTicket;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function TicketStatusUpdateModal({ ticket, isOpen, onClose, onUpdate }: TicketStatusUpdateModalProps) {
  const [selectedStatus, setSelectedStatus] = useState(ticket.status);
  const [adminNotes, setAdminNotes] = useState(ticket.admin_notes || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusOptions = [
    { value: 'open', label: 'Open', color: 'text-red-600', description: 'Ticket is new and needs attention' },
    { value: 'in_progress', label: 'In Progress', color: 'text-yellow-600', description: 'Currently being worked on' },
    { value: 'resolved', label: 'Resolved', color: 'text-green-600', description: 'Issue has been fixed' },
    { value: 'closed', label: 'Closed', color: 'text-gray-600', description: 'Ticket is completed and closed' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedStatus === ticket.status && adminNotes === (ticket.admin_notes || '')) {
      onClose();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await updateTicketStatus(
        ticket.id,
        selectedStatus,
        adminNotes.trim() || undefined
      );
      
      onUpdate(); // Refresh the tickets list
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update ticket');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    return statusOptions.find(option => option.value === status);
  };

  const currentStatusInfo = getStatusInfo(ticket.status);
  const newStatusInfo = getStatusInfo(selectedStatus);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Ticket Status">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Ticket Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">Ticket #{ticket.id.slice(0, 8)}</h3>
          <p className="text-sm text-gray-700 mb-1"><strong>Subject:</strong> {ticket.subject}</p>
          <p className="text-sm text-gray-700 mb-1"><strong>User:</strong> {ticket.user_email} ({ticket.user_role})</p>
          <p className="text-sm text-gray-700 mb-1"><strong>Priority:</strong> {ticket.priority}</p>
          <p className="text-sm text-gray-700">
            <strong>Current Status:</strong> 
            <span className={`ml-1 ${currentStatusInfo?.color}`}>
              {currentStatusInfo?.label}
            </span>
          </p>
        </div>

        {/* Status Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Update Status
          </label>
          <div className="space-y-2">
            {statusOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-start p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="radio"
                  name="status"
                  value={option.value}
                  checked={selectedStatus === option.value}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="mt-1 mr-3 text-blue-600"
                />
                <div className="flex-1">
                  <div className={`font-medium ${option.color}`}>
                    {option.label}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {option.description}
                  </div>
                </div>
                {selectedStatus === option.value && (
                  <div className="text-blue-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Admin Notes */}
        <div>
          <label htmlFor="adminNotes" className="block text-sm font-medium text-gray-700 mb-2">
            Admin Notes
          </label>
          <textarea
            id="adminNotes"
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Add internal notes about the resolution or status change..."
          />
          <p className="text-xs text-gray-600 mt-1">
            These notes are visible to other admins but not to the user.
          </p>
        </div>

        {/* Status Change Summary */}
        {selectedStatus !== ticket.status && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm">
                <span className="font-medium text-blue-900">Status Change: </span>
                <span className={currentStatusInfo?.color}>{currentStatusInfo?.label}</span>
                <span className="text-gray-600"> → </span>
                <span className={newStatusInfo?.color}>{newStatusInfo?.label}</span>
              </div>
            </div>
            {(selectedStatus === 'resolved' || selectedStatus === 'closed') && (
              <p className="text-xs text-blue-700 mt-2">
                ✓ This will set the resolved timestamp and mark you as the resolver.
              </p>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || (selectedStatus === ticket.status && adminNotes === (ticket.admin_notes || ''))}
          >
            {isLoading ? 'Updating...' : 'Update Ticket'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
