import { useState } from 'react';
import { SupportTicket, updateTicketStatus } from '../../lib/admin-api';

interface SupportTicketCardProps {
  ticket: SupportTicket;
  onStatusChange: () => void;
}

export function SupportTicketCard({ ticket, onStatusChange }: SupportTicketCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === ticket.status) return;

    setIsUpdating(true);
    try {
      await updateTicketStatus(ticket.id, newStatus);
      onStatusChange(); // Refresh the tickets list
    } catch (error) {
      console.error('Failed to update ticket status:', error);
      alert('Failed to update ticket status. Please try again.');
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
    switch (role) {
      case 'employer':
        return '👔';
      case 'employee':
        return '👤';
      default:
        return '❓';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{getRoleIcon(ticket.user_role)}</span>
            <span className="font-medium text-gray-900">{ticket.user_email}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                {ticket.priority}
              </span>
            </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{ticket.subject}</h3>
          <p className="text-sm text-gray-600 mb-2">
            {ticket.issue_type.replace('_', ' ').toUpperCase()}
          </p>
          </div>

        <div className="ml-4">
          <select
            value={ticket.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={isUpdating}
            className={`px-3 py-1 rounded-full text-sm font-medium border cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${getStatusColor(ticket.status)}`}
          >
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          {isUpdating && (
            <div className="mt-1 text-xs text-gray-500">Updating...</div>
          )}
            </div>
          </div>

          <div className="mb-4">
        <p className="text-gray-700">{ticket.description}</p>
          </div>

          {ticket.screenshot_url && (
            <div className="mb-4">
                <img 
                  src={ticket.screenshot_url} 
                  alt="Support ticket screenshot"
            className="max-w-full h-auto rounded border border-gray-200"
            style={{ maxHeight: '300px' }}
                />
            </div>
          )}

          {ticket.admin_notes && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-medium text-blue-900 mb-1">Admin Notes:</h4>
          <p className="text-sm text-blue-800">{ticket.admin_notes}</p>
            </div>
          )}

      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>Created: {formatDateTime(ticket.created_at)}</span>
          {ticket.resolved_at && (
          <span>Resolved: {formatDateTime(ticket.resolved_at)}</span>
              )}
            </div>
          </div>
  );
}