import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { SupportTicket, updateTicketStatus } from '../../lib/admin-api';

interface SupportTicketCardProps {
  ticket: SupportTicket;
  onStatusChange: () => void;
}

export function SupportTicketCard({ ticket, onStatusChange }: SupportTicketCardProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Status options
  const statusOptions = [
    { value: 'open', label: 'Open', color: 'bg-red-500', description: 'Ticket is new and needs attention' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-500', description: 'Currently being worked on' },
    { value: 'resolved', label: 'Resolved', color: 'bg-green-500', description: 'Issue has been fixed' },
    { value: 'closed', label: 'Closed', color: 'bg-gray-500', description: 'Ticket is completed and closed' },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setShowNotesInput(false);
        setAdminNotes('');
        setPendingStatus(null);
      }
    }

    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
        setShowNotesInput(false);
        setAdminNotes('');
        setPendingStatus(null);
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

  // Handle status update
  const handleStatusUpdate = async (newStatus: string, notes?: string) => {
    if (newStatus === ticket.status && !notes) {
      setIsDropdownOpen(false);
      setShowNotesInput(false);
      setAdminNotes('');
      return;
    }

    setIsUpdating(true);

    try {
      await updateTicketStatus(
        ticket.id,
        newStatus,
        notes || undefined
      );
      
      onStatusChange(); // Refresh the tickets list
      setIsDropdownOpen(false);
      setShowNotesInput(false);
      setAdminNotes('');
      setPendingStatus(null);
    } catch (error) {
      console.error('Failed to update ticket status:', error);
      // Could add toast notification here
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    if (role === 'employer') {
      return (
        <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H7m5 0v-5a2 2 0 00-2-2H7v7m8-7h2a2 2 0 012 2v5m-2 0h2" />
        </svg>
      );
    } else {
      return (
        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                  {ticket.subject}
                </h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                  {ticket.status.replace('_', ' ')}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  {getRoleIcon(ticket.user_role)}
                  <span className="capitalize">{ticket.user_role}</span>
                </div>
                <span>#{ticket.id.slice(0, 8)}</span>
                <span>{formatDateTime(ticket.created_at)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                {ticket.priority}
              </span>
            </div>
          </div>

          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{ticket.user_email}</p>
                <p className="text-xs text-gray-600">Issue Type: {ticket.issue_type}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
            <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
              {ticket.description}
            </div>
          </div>

          {/* Screenshot */}
          {ticket.screenshot_url && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Screenshot</h4>
              <div className="relative">
                <img 
                  src={ticket.screenshot_url} 
                  alt="Support ticket screenshot"
                  className="rounded-lg border border-gray-200 max-h-48 w-auto cursor-pointer hover:opacity-90"
                  onClick={() => window.open(ticket.screenshot_url, '_blank')}
                />
              </div>
            </div>
          )}

          {/* Admin Notes */}
          {ticket.admin_notes && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Admin Notes</h4>
              <div className="text-sm text-gray-700 bg-blue-50 rounded-lg p-3 border border-blue-200">
                {ticket.admin_notes}
              </div>
            </div>
          )}

          {/* Resolution Info */}
          {ticket.resolved_at && (
            <div className="mb-4">
              <div className="text-xs text-gray-600">
                Resolved by {ticket.resolved_by} on {formatDateTime(ticket.resolved_at)}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Last updated: {ticket.updated_at ? formatDateTime(ticket.updated_at) : 'Never'}
            </div>
            
            {/* Status Update Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                disabled={isUpdating}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <span className={`w-2 h-2 rounded-full mr-2 ${
                      ticket.status === 'open' ? 'bg-red-500' :
                      ticket.status === 'in_progress' ? 'bg-yellow-500' :
                      ticket.status === 'resolved' ? 'bg-green-500' : 'bg-gray-500'
                    }`}></span>
                Update Status
                    <svg className={`ml-2 w-4 h-4 transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 z-50 w-72 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="py-2">
                    {statusOptions.map((option) => (
                      <div key={option.value}>
                        <button
                          type="button"
                          onClick={() => {
                            if (option.value === 'resolved' || option.value === 'closed') {
                              setPendingStatus(option.value);
                              setShowNotesInput(true);
                            } else {
                              handleStatusUpdate(option.value);
                            }
                          }}
                          className={`w-full flex items-start px-4 py-3 hover:bg-gray-50 focus:outline-none focus:bg-gray-50 ${
                            ticket.status === option.value ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className={`w-3 h-3 rounded-full mr-3 mt-1 ${option.color}`}></div>
                          <div className="flex-1 text-left">
                            <div className={`font-medium text-gray-900 ${
                              ticket.status === option.value ? 'text-blue-800' : ''
                            }`}>
                              {option.label}
                              {ticket.status === option.value && (
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
                      </div>
                    ))}

                    {/* Admin Notes Input */}
                    {showNotesInput && (
                      <div className="border-t border-gray-200 p-4 bg-gray-50">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Admin Notes (optional)
                        </label>
                        <textarea
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Add notes about the resolution..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <div className="flex justify-end gap-2 mt-3">
                          <button
                            type="button"
                            onClick={() => {
                              setShowNotesInput(false);
                              setAdminNotes('');
                              setPendingStatus(null);
                            }}
                            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (pendingStatus) {
                                handleStatusUpdate(pendingStatus, adminNotes.trim());
                              }
                            }}
                            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            Update
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </>
  );
}
