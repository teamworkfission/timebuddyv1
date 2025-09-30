import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { BusinessForm } from './BusinessForm';
import { BusinessTile } from './BusinessTile';
import { AddEmployeeModal } from './AddEmployeeModal';
import { EmployeeList } from './EmployeeList';
import { PaymentsReportsModal } from '../payments/PaymentsReportsModal';
import { Business, getBusinesses } from '../../lib/business-api';
import { joinRequestsApi } from '../../lib/join-requests-api';

interface BusinessManagementProps {
  onBack?: () => void;
}

export function BusinessManagement({ onBack }: BusinessManagementProps) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [addingEmployee, setAddingEmployee] = useState(false);
  const [showEmployeeList, setShowEmployeeList] = useState(false);
  const [employeeListBusiness, setEmployeeListBusiness] = useState<Business | null>(null);
  const [showPaymentsModal, setShowPaymentsModal] = useState(false);
  const [paymentsModalBusiness, setPaymentsModalBusiness] = useState<Business | null>(null);

  const loadBusinesses = async () => {
    try {
      setLoading(true);
      const data = await getBusinesses();
      setBusinesses(data);
      
      // If no businesses exist, show the form automatically
      if (data.length === 0) {
        setShowForm(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load businesses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBusinesses();
  }, []);

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingBusiness(null);
    loadBusinesses();
  };

  const handleAddBusiness = () => {
    setEditingBusiness(null);
    setShowForm(true);
  };

  const handleEditBusiness = (business: Business) => {
    setEditingBusiness(business);
    setShowForm(true);
  };


  const handleAddEmployee = (business: Business) => {
    setSelectedBusiness(business);
    setShowAddEmployeeModal(true);
  };

  const handleAddEmployeeSubmit = async (gid: string, message?: string) => {
    if (!selectedBusiness) return;

    try {
      setAddingEmployee(true);
      await joinRequestsApi.sendJoinRequest({
        business_id: selectedBusiness.business_id,
        employee_gid: gid,
        message,
      });
      
      // Show success message (you might want to add a toast notification here)
      alert('Join request sent successfully! The employee will receive a notification.');
      
    } catch (err) {
      throw err; // Let the modal handle the error display
    } finally {
      setAddingEmployee(false);
    }
  };

  const handleCloseAddEmployeeModal = () => {
    setShowAddEmployeeModal(false);
    setSelectedBusiness(null);
  };

  const handleViewEmployees = (business: Business) => {
    setEmployeeListBusiness(business);
    setShowEmployeeList(true);
  };

  const handleBackFromEmployeeList = () => {
    setShowEmployeeList(false);
    setEmployeeListBusiness(null);
    // Reload businesses to get updated employee counts
    loadBusinesses();
  };

  const handlePaymentsReports = (business: Business) => {
    setPaymentsModalBusiness(business);
    setShowPaymentsModal(true);
  };

  const handleClosePaymentsModal = () => {
    setShowPaymentsModal(false);
    setPaymentsModalBusiness(null);
  };

  // Show employee list view
  if (showEmployeeList && employeeListBusiness) {
    return (
      <EmployeeList
        businessId={employeeListBusiness.business_id}
        businessName={employeeListBusiness.name}
        onBack={handleBackFromEmployeeList}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600">Loading businesses...</p>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Optimized Mobile Header */}
          <div className="mb-4 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              {onBack && (
                <Button 
                  variant="outline" 
                  onClick={onBack}
                  className="w-full sm:w-auto order-2 sm:order-1"
                  size="sm"
                >
                  ← Back to Dashboard
                </Button>
              )}
              {businesses.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowForm(false);
                    setEditingBusiness(null);
                  }}
                  className="w-full sm:w-auto order-1 sm:order-2"
                  size="sm"
                >
                  ← Back to Businesses
                </Button>
              )}
            </div>
          </div>

          <BusinessForm 
            onSuccess={handleFormSuccess}
            onCancel={businesses.length > 0 ? () => {
              setShowForm(false);
              setEditingBusiness(null);
            } : undefined}
            initialData={editingBusiness || undefined}
            mode={editingBusiness ? 'edit' : 'create'}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Optimized Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-0 sm:h-16">
            <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-0">
              {onBack && (
                <Button 
                  variant="outline" 
                  onClick={onBack}
                  size="sm"
                  className="flex-shrink-0"
                >
                  ← Dashboard
                </Button>
              )}
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                Business Management
              </h1>
            </div>
            
            {/* Mobile Add Button */}
            {businesses.length > 0 && (
              <Button 
                onClick={handleAddBusiness}
                size="sm"
                className="w-full sm:w-auto"
              >
                + Add Business
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {businesses.length === 0 ? (
          <div className="text-center py-8 sm:py-12 px-4">
            <div className="mb-4 sm:mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full mb-4">
                <span className="text-xl sm:text-2xl">🏢</span>
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">No Businesses Yet</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto leading-relaxed">
              Get started by adding your first business location to begin managing your gig workers.
            </p>
            <Button onClick={handleAddBusiness} className="w-full sm:w-auto">
              Add Your First Business
            </Button>
          </div>
        ) : (
          <>
            {/* Summary Stats - Mobile Optimized */}
            <div className="mb-6 sm:mb-8 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">{businesses.length}</div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">Business Location{businesses.length !== 1 ? 's' : ''}</div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1">
                  {businesses.reduce((sum, b) => sum + b.total_employees, 0)}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">Employee Slots</div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 text-center col-span-2 sm:col-span-1">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1">
                  {new Set(businesses.map(b => b.type)).size}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">Business Type{new Set(businesses.map(b => b.type)).size !== 1 ? 's' : ''}</div>
              </div>
            </div>

            {/* Approved Businesses Section */}
            {(() => {
              const approvedBusinesses = businesses.filter(b => b.verification_status === 'approved');
              const pendingBusinesses = businesses.filter(b => !b.verification_status || b.verification_status === 'pending');
              const rejectedBusinesses = businesses.filter(b => b.verification_status === 'rejected');

              return (
                <>
                  {/* Approved Businesses Grid */}
                  {approvedBusinesses.length > 0 && (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                          <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                          <span>Active Businesses</span>
                          <span className="text-sm font-normal text-gray-500">({approvedBusinesses.length})</span>
                        </h2>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-8">
                        {approvedBusinesses.map((business) => (
                          <BusinessTile 
                            key={business.business_id}
                            business={business}
                            onEdit={handleEditBusiness}
                            onAddEmployee={handleAddEmployee}
                            onViewEmployees={handleViewEmployees}
                            onPaymentsReports={handlePaymentsReports}
                          />
                        ))}
                        
                        {/* Add Business Button Card - Mobile Optimized */}
                        <div 
                          onClick={handleAddBusiness}
                          className="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 hover:border-blue-400 hover:shadow-md active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center min-h-[280px] sm:min-h-[320px] group touch-manipulation"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleAddBusiness();
                            }
                          }}
                          aria-label="Add new business"
                        >
                          <div className="text-center p-4 sm:p-6">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:bg-blue-200 transition-colors">
                              <span className="text-lg sm:text-2xl text-blue-600">➕</span>
                            </div>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                              Add Business
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                              Add another business location
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Pending Businesses Section */}
                  {pendingBusinesses.length > 0 && (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                          <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                          <span>Pending Approval</span>
                          <span className="text-sm font-normal text-gray-500">({pendingBusinesses.length})</span>
                        </h2>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <p className="text-sm text-amber-800">
                            <strong>These businesses are awaiting admin approval.</strong> Once approved, you'll be able to manage employees and access all business features.
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-8">
                        {pendingBusinesses.map((business) => (
                          <BusinessTile 
                            key={business.business_id}
                            business={business}
                            onEdit={handleEditBusiness}
                            onAddEmployee={handleAddEmployee}
                            onViewEmployees={handleViewEmployees}
                            onPaymentsReports={handlePaymentsReports}
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {/* Rejected Businesses Section */}
                  {rejectedBusinesses.length > 0 && (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                          <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                          <span>Rejected Applications</span>
                          <span className="text-sm font-normal text-gray-500">({rejectedBusinesses.length})</span>
                        </h2>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          <p className="text-sm text-red-800">
                            <strong>These business applications have been rejected.</strong> See the admin comment below for details, or contact support for more information about reapplying.
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                        {rejectedBusinesses.map((business) => (
                          <BusinessTile 
                            key={business.business_id}
                            business={business}
                            onEdit={handleEditBusiness}
                            onAddEmployee={handleAddEmployee}
                            onViewEmployees={handleViewEmployees}
                            onPaymentsReports={handlePaymentsReports}
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {/* Show Add Business Card only if no approved businesses or as part of approved section */}
                  {approvedBusinesses.length === 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                      <div 
                        onClick={handleAddBusiness}
                        className="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 hover:border-blue-400 hover:shadow-md active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center min-h-[280px] sm:min-h-[320px] group touch-manipulation"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleAddBusiness();
                          }
                        }}
                        aria-label="Add new business"
                      >
                        <div className="text-center p-4 sm:p-6">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:bg-blue-200 transition-colors">
                            <span className="text-lg sm:text-2xl text-blue-600">➕</span>
                          </div>
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                            Add Business
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                            Add another business location
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </>
        )}
      </div>

      {/* Add Employee Modal */}
      <AddEmployeeModal
        isOpen={showAddEmployeeModal}
        onClose={handleCloseAddEmployeeModal}
        onSubmit={handleAddEmployeeSubmit}
        businessName={selectedBusiness?.name || ''}
        loading={addingEmployee}
      />

      {/* Payments & Reports Modal */}
      {showPaymentsModal && paymentsModalBusiness && (
        <PaymentsReportsModal
          business={paymentsModalBusiness}
          onClose={handleClosePaymentsModal}
        />
      )}
    </div>
  );
}
