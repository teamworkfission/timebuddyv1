import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { joinRequestsApi, JoinRequest } from '../../lib/join-requests-api';
import { supabase } from '../../lib/supabase';
import { clearViewedState } from '../../lib/notification-tracker';

interface JoinRequestsProps {
  onRequestsChange?: () => void;
}

export function JoinRequests({ onRequestsChange }: JoinRequestsProps) {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responding, setResponding] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');

  // Get current user ID
  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUserId();
  }, []);

  const loadJoinRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await joinRequestsApi.getEmployeeJoinRequests();
      setRequests(data);
      
      // If no requests left, clear the viewed state so new requests will show badge
      if (data.length === 0 && userId) {
        clearViewedState(userId, 'join_requests');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load join requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadJoinRequests();
    }
  }, [userId]);

  const handleResponse = async (requestId: string, status: 'accepted' | 'declined') => {
    try {
      setResponding(requestId);
      await joinRequestsApi.respondToJoinRequest(requestId, { status });
      
      // Remove the request from the list since it's no longer pending
      const updatedRequests = requests.filter(req => req.id !== requestId);
      setRequests(updatedRequests);
      
      // If no more requests, clear viewed state so new requests will show badge
      if (updatedRequests.length === 0 && userId) {
        clearViewedState(userId, 'join_requests');
      }
      
      // Notify parent component of changes
      onRequestsChange?.();
      
      // Show success message
      const action = status === 'accepted' ? 'accepted' : 'declined';
      alert(`Join request ${action} successfully!`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${status} join request`);
    } finally {
      setResponding(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading join requests...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Requests</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadJoinRequests} variant="secondary">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v1M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Join Requests</h3>
          <p className="text-gray-600">
            You don't have any pending business join requests at the moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Business Join Requests</h2>
            <p className="text-sm text-gray-600 mt-1">
              {requests.length} pending invitation{requests.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={loadJoinRequests} variant="secondary" size="sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {requests.map((request) => (
          <div key={request.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg">🏢</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {request.business_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Invited {new Date(request.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {request.message && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Message:</span> {request.message}
                    </p>
                  </div>
                )}

                <p className="text-sm text-gray-600 mb-4">
                  You've been invited to join this business as an employee. 
                  Accepting will allow the business owner to see your profile and contact you about job opportunities.
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={() => handleResponse(request.id, 'accepted')}
                disabled={responding === request.id}
                className="flex-1 sm:flex-none"
              >
                {responding === request.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Accepting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Accept
                  </>
                )}
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleResponse(request.id, 'declined')}
                disabled={responding === request.id}
                className="flex-1 sm:flex-none"
              >
                {responding === request.id ? (
                  'Processing...'
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Decline
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
