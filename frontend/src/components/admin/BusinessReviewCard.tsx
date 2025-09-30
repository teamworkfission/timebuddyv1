import { useState } from 'react';
import { Button } from '../ui/Button';
import { AdminBusiness, getGoogleMapsUrl, getDocumentUrl, approveBusiness, rejectBusiness } from '../../lib/admin-api';

interface BusinessReviewCardProps {
  business: AdminBusiness;
  onStatusChange: () => void;
}

export function BusinessReviewCard({ business, onStatusChange }: BusinessReviewCardProps) {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleApprove = async () => {
    try {
      setLoading(true);
      await approveBusiness(business.business_id, notes || undefined);
      onStatusChange();
    } catch (error) {
      console.error('Failed to approve business:', error);
      alert('Failed to approve business');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!notes.trim()) {
      setShowNotesInput(true);
      return;
    }

    try {
      setLoading(true);
      await rejectBusiness(business.business_id, notes);
      onStatusChange();
    } catch (error) {
      console.error('Failed to reject business:', error);
      alert('Failed to reject business');
    } finally {
      setLoading(false);
    }
  };

  const openGoogleMaps = () => {
    window.open(getGoogleMapsUrl(business.location), '_blank');
  };

  const openDocument = () => {
    const documentUrl = getDocumentUrl(business.document_url);
    if (documentUrl) {
      window.open(documentUrl, '_blank');
    } else {
      alert('No document uploaded for this business');
    }
  };

  const getStatusBadge = () => {
    switch (business.verification_status) {
      case 'approved':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">✅ Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">❌ Rejected</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">🟡 Pending</span>;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">{business.name}</h3>
            {getStatusBadge()}
          </div>
          <p className="text-sm text-gray-600 capitalize">
            {business.type.replace('_', ' ')} 
          </p>
        </div>
        <div className="text-right text-sm text-gray-500">
          <p>Applied: {formatDate(business.created_at)}</p>
          {business.verified_at && (
            <p>Verified: {formatDate(business.verified_at)}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <p><strong>Email:</strong> {business.email}</p>
          <p><strong>Phone:</strong> {business.phone}</p>
          <p><strong>Employer:</strong> {business.employer_email}</p>
        </div>
        <div>
          <p><strong>Location:</strong> {business.location}</p>
          {business.city && business.state && (
            <p><strong>City, State:</strong> {business.city}, {business.state}</p>
          )}
          {business.zip_code && (
            <p><strong>ZIP:</strong> {business.zip_code}</p>
          )}
        </div>
      </div>

      {business.verification_notes && (
        <div className="bg-gray-50 p-3 rounded border">
          <p className="text-sm"><strong>Admin Notes:</strong> {business.verification_notes}</p>
          {business.verified_by && (
            <p className="text-xs text-gray-500 mt-1">By: {business.verified_by}</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={openDocument}
          disabled={!business.document_url}
        >
          📄 View Document
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={openGoogleMaps}
        >
          🗺️ Check Location
        </Button>
      </div>

      {business.verification_status === 'pending' && (
        <>
          {showNotesInput && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Notes (required for rejection):
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="Enter verification notes..."
                rows={3}
                disabled={loading}
              />
            </div>
          )}

          <div className="flex gap-3 pt-2 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNotesInput(!showNotesInput)}
              disabled={loading}
            >
              💬 Add Notes
            </Button>
            
            <Button
              variant="primary"
              size="sm"
              onClick={handleApprove}
              disabled={loading}
              loading={loading}
            >
              ✅ Approve
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReject}
              disabled={loading}
              loading={loading}
            >
              ❌ Reject
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
