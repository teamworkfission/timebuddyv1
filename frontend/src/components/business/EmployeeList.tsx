import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { BusinessEmployee, getBusinessEmployees, removeBusinessEmployee, updateEmployeeRole } from '../../lib/business-api';

interface EmployeeListProps {
  businessId: string;
  businessName: string;
  onBack: () => void;
}

export function EmployeeList({ businessId, businessName, onBack }: EmployeeListProps) {
  const [employees, setEmployees] = useState<BusinessEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBusinessEmployees(businessId);
      setEmployees(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [businessId]);

  const handleRemoveEmployee = async (employee: BusinessEmployee) => {
    if (!confirm(`Are you sure you want to remove ${employee.employee.full_name} from ${businessName}?`)) {
      return;
    }

    try {
      setRemoving(employee.employee.id);
      await removeBusinessEmployee(businessId, employee.employee.id);
      setEmployees(prev => prev.filter(emp => emp.employee.id !== employee.employee.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove employee');
    } finally {
      setRemoving(null);
    }
  };

  const handleRoleChange = async (employee: BusinessEmployee, newRole: string) => {
    try {
      setUpdatingRole(employee.employee.id);
      await updateEmployeeRole(businessId, employee.employee.id, newRole);
      setEmployees(prev => prev.map(emp => 
        emp.employee.id === employee.employee.id 
          ? { ...emp, role: newRole }
          : emp
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update employee role');
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleCopyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(`${type} copied!`);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const getTransportationIcon = (transportation: string) => {
    switch (transportation) {
      case 'own_car': return '🚗';
      case 'public_transit': return '🚌';
      case 'not_needed': return '🚶';
      default: return '❓';
    }
  };

  const getTransportationLabel = (transportation: string) => {
    switch (transportation) {
      case 'own_car': return 'Own Car';
      case 'public_transit': return 'Public Transit';
      case 'not_needed': return 'Not Needed';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Copy Success Toast */}
      {copySuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-300">
          ✅ {copySuccess}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={onBack}
                className="flex items-center space-x-2"
              >
                <span>←</span>
                <span>Back to Businesses</span>
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{businessName}</h1>
                <p className="text-sm text-gray-500">Employee Management</p>
              </div>
            </div>
            <Button onClick={loadEmployees} variant="secondary" size="sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="text-red-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {employees.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Employees Yet</h3>
              <p className="text-gray-600 mb-6">
                You haven't added any employees to this business yet. Use the "Add Employee" button on your business card to invite employees.
              </p>
              <Button onClick={onBack}>
                Back to Business Management
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Employees ({employees.length})
              </h2>
            </div>

            <div className="divide-y divide-gray-200">
              {employees.map((employee) => (
                <div key={employee.employee.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-lg font-medium text-blue-600">
                            {employee.employee.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {employee.employee.full_name}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>GID: {employee.employee.employee_gid}</span>
                            <span>•</span>
                            <span>Joined {new Date(employee.joined_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Contact Information</h4>
                          <div className="space-y-2 text-sm">
                            {/* Email - Clickable mailto link */}
                            <div className="flex items-center space-x-2 group">
                              <span>📧</span>
                              <a 
                                href={`mailto:${employee.employee.email}`}
                                className="text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer"
                                title="Send email"
                              >
                                {employee.employee.email}
                              </a>
                              <button
                                onClick={() => handleCopyToClipboard(employee.employee.email, 'Email')}
                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity"
                                title="Copy email"
                              >
                                📋
                              </button>
                            </div>
                            
                            {/* Phone - Clickable tel link */}
                            <div className="flex items-center space-x-2 group">
                              <span>📞</span>
                              <a 
                                href={`tel:${employee.employee.phone}`}
                                className="text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer"
                                title="Call phone number"
                              >
                                {employee.employee.phone}
                              </a>
                              <button
                                onClick={() => handleCopyToClipboard(employee.employee.phone, 'Phone')}
                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity"
                                title="Copy phone number"
                              >
                                📋
                              </button>
                            </div>
                            
                            {/* Location - Clickable Google Maps link */}
                            <div className="flex items-center space-x-2 group">
                              <span>📍</span>
                              <a 
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${employee.employee.city}, ${employee.employee.state}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer"
                                title="View on Google Maps"
                              >
                                {employee.employee.city}, {employee.employee.state}
                              </a>
                              <button
                                onClick={() => handleCopyToClipboard(`${employee.employee.city}, ${employee.employee.state}`, 'Location')}
                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity"
                                title="Copy location"
                              >
                                📋
                              </button>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Work Details</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <span>{getTransportationIcon(employee.employee.transportation)}</span>
                              <span>{getTransportationLabel(employee.employee.transportation)}</span>
                            </div>
                            {employee.employee.skills && employee.employee.skills.length > 0 && (
                              <div>
                                <span className="font-medium">Skills:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {employee.employee.skills.map((skill, index) => (
                                    <span
                                      key={index}
                                      className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <label className="text-sm font-medium text-gray-700">Role:</label>
                          <select
                            value={employee.role}
                            onChange={(e) => handleRoleChange(employee, e.target.value)}
                            disabled={updatingRole === employee.employee.id}
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="employee">Employee</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="manager">Manager</option>
                          </select>
                          {updatingRole === employee.employee.id && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="ml-6">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRemoveEmployee(employee)}
                        disabled={removing === employee.employee.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {removing === employee.employee.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                            Removing...
                          </>
                        ) : (
                          'Remove'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
