import { useState } from 'react';
import { Button } from '../ui/Button';
import { SupportTicket } from '../../lib/admin-api';
import { TicketStatusUpdateModal } from './TicketStatusUpdateModal';

interface SupportTicketCardProps {
  ticket: SupportTicket;
  onStatusChange: () => void;
}

export function SupportTicketCard({ ticket, onStatusChange }: SupportTicketCardProps) {
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsUpdateModalOpen(true)}
              >
                Update Status
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Update Status Modal */}
      {isUpdateModalOpen && (
        <TicketStatusUpdateModal
          ticket={ticket}
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          onUpdate={onStatusChange}
        />
      )}
    </>
  );
}
