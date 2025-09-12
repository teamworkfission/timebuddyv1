import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { BusinessForm } from './BusinessForm';
import { BusinessTile } from './BusinessTile';
import { Business, getBusinesses, deleteBusiness } from '../../lib/business-api';

interface BusinessManagementProps {
  onBack?: () => void;
}

export function BusinessManagement({ onBack }: BusinessManagementProps) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

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

  const handleDeleteBusiness = async (business: Business) => {
    if (!confirm(`Are you sure you want to delete "${business.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(business.business_id);
      await deleteBusiness(business.business_id);
      await loadBusinesses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete business');
    } finally {
      setDeleting(null);
    }
  };

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

            {/* Business Grid - Mobile First Design */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {businesses.map((business) => (
                <div key={business.business_id} className="relative">
                  <BusinessTile 
                    business={business}
                    onEdit={handleEditBusiness}
                    onDelete={deleting === business.business_id ? undefined : handleDeleteBusiness}
                  />
                  {deleting === business.business_id && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-xl">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Deleting...</p>
                      </div>
                    </div>
                  )}
                </div>
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
      </div>
    </div>
  );
}
