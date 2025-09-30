import { useState, useRef, useEffect } from 'react';
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [isDropdownOpen]);

  const handleStatusSelect = (status: string) => {
    setSelectedStatus(status);
    setIsDropdownOpen(false);
  };

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

        {/* Status Selection Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Update Status
          </label>
          <div className="relative" ref={dropdownRef}>
            {/* Dropdown Trigger */}
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  selectedStatus === 'open' ? 'bg-red-500' :
                  selectedStatus === 'in_progress' ? 'bg-yellow-500' :
                  selectedStatus === 'resolved' ? 'bg-green-500' : 'bg-gray-500'
                }`}></div>
                <div>
                  <div className={`font-medium ${newStatusInfo?.color}`}>
                    {newStatusInfo?.label}
                  </div>
                  <div className="text-sm text-gray-600 text-left">
                    {newStatusInfo?.description}
                  </div>
                </div>
              </div>
              <div className={`transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
                <div className="py-1">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleStatusSelect(option.value)}
                      className={`w-full flex items-start px-4 py-3 hover:bg-gray-50 focus:outline-none focus:bg-gray-50 ${
                        selectedStatus === option.value ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full mr-3 mt-1 ${
                        option.value === 'open' ? 'bg-red-500' :
                        option.value === 'in_progress' ? 'bg-yellow-500' :
                        option.value === 'resolved' ? 'bg-green-500' : 'bg-gray-500'
                      }`}></div>
                      <div className="flex-1 text-left">
                        <div className={`font-medium ${option.color} ${
                          selectedStatus === option.value ? 'text-blue-800' : ''
                        }`}>
                          {option.label}
                          {selectedStatus === option.value && (
                            <span className="ml-2 text-blue-600">
                              <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {option.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
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
