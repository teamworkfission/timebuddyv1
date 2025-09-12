import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { 
  CreateJobData, 
  BusinessOption, 
  JobType, 
  PayType, 
  SupplementalPayOption, 
  BenefitsOption,
  createJobPost,
  updateJobPost,
  getEmployerBusinesses,
  JOB_TYPE_LABELS,
  PAY_TYPE_LABELS,
  SUPPLEMENTAL_PAY_LABELS,
  BENEFITS_LABELS
} from '../../lib/jobs-api';

interface CreateJobPostProps {
  editingJob?: any; // For future edit functionality
  onSuccess?: () => void;
}

export function CreateJobPost({ editingJob, onSuccess }: CreateJobPostProps) {
  // Validation helper functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    // Remove all non-digit characters for validation
    const cleaned = phone.replace(/\D/g, '');
    // US phone number: 10 or 11 digits (with or without country code)
    return cleaned.length >= 10 && cleaned.length <= 11;
  };

  const formatPhone = (phone: string): string => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (cleaned.length >= 6) {
      if (cleaned.length <= 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
      } else {
        // Handle 11 digit with country code
        return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
      }
    } else if (cleaned.length >= 3) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else if (cleaned.length > 0) {
      return cleaned;
    }
    return phone;
  };

  const [businesses, setBusinesses] = useState<BusinessOption[]>([]);
  const [businessesLoading, setBusinessesLoading] = useState(true);
  const [formData, setFormData] = useState<CreateJobData>({
    business_id: '',
    job_title: '',
    job_type: 'full-time',
    status: 'draft',
    business_name: '',
    location: '',
    business_type: '',
    phone: '',
    email: '',
    expected_hours_per_week: 40,
    schedule: '',
    pay_type: 'hourly',
    pay_min: undefined,
    pay_max: undefined,
    pay_currency: 'USD',
    supplemental_pay: [],
    benefits: [],
    job_description: '',
    language_preference: '',
    transportation_requirement: '',
  });
  const [payRange, setPayRange] = useState<'single' | 'range'>('single');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load businesses on component mount
  useEffect(() => {
    loadBusinesses();
  }, []);

  // Pre-fill form if editing
  useEffect(() => {
    if (editingJob) {
      setFormData(editingJob);
      setPayRange(editingJob.pay_max ? 'range' : 'single');
    }
  }, [editingJob]);

  const loadBusinesses = async () => {
    try {
      setBusinessesLoading(true);
      const businessData = await getEmployerBusinesses();
      setBusinesses(businessData);
      
      // Auto-select first business if only one exists
      if (businessData.length === 1 && !formData.business_id) {
        handleBusinessSelect(businessData[0].business_id);
      }
    } catch (error) {
      console.error('Failed to load businesses:', error);
      setError('Failed to load your businesses. Please try again.');
    } finally {
      setBusinessesLoading(false);
    }
  };

  const handleBusinessSelect = (businessId: string) => {
    const selectedBusiness = businesses.find(b => b.business_id === businessId);
    if (selectedBusiness) {
      setFormData(prev => ({
        ...prev,
        business_id: businessId,
        business_name: selectedBusiness.name,
        location: selectedBusiness.location,
        business_type: selectedBusiness.type,
        phone: selectedBusiness.phone,
        email: selectedBusiness.email || '',
      }));
    }
  };

  const handleInputChange = (field: keyof CreateJobData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSupplementalPayChange = (option: SupplementalPayOption, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      supplemental_pay: checked 
        ? [...(prev.supplemental_pay || []), option]
        : (prev.supplemental_pay || []).filter(item => item !== option),
    }));
  };

  const handleBenefitsChange = (option: BenefitsOption, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      benefits: checked 
        ? [...(prev.benefits || []), option]
        : (prev.benefits || []).filter(item => item !== option),
    }));
  };

  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'published' = 'draft') => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validation
      if (!formData.business_id) {
        throw new Error('Please select a business');
      }
      if (!formData.job_title.trim()) {
        throw new Error('Job title is required');
      }
      if (!formData.phone.trim()) {
        throw new Error('Phone number is required');
      }
      if (!validatePhone(formData.phone)) {
        throw new Error('Please enter a valid phone number');
      }
      if (formData.email && formData.email.trim() && !validateEmail(formData.email)) {
        throw new Error('Please enter a valid email address');
      }
      if (!formData.expected_hours_per_week || formData.expected_hours_per_week <= 0) {
        throw new Error('Expected hours per week is required and must be greater than 0');
      }
      if (!formData.schedule || !formData.schedule.trim()) {
        throw new Error('Schedule is required');
      }
      if (!formData.job_description.trim()) {
        throw new Error('Job description is required');
      }
      if (!formData.pay_min || formData.pay_min <= 0) {
        throw new Error('Pay must be greater than 0');
      }
      if (formData.pay_min < 0) {
        throw new Error('Pay cannot be negative');
      }
      if (formData.pay_max && formData.pay_max < 0) {
        throw new Error('Maximum pay cannot be negative');
      }
      if (payRange === 'range' && formData.pay_max && formData.pay_max < formData.pay_min) {
        throw new Error('Maximum pay cannot be less than minimum pay');
      }

      const submitData: CreateJobData = {
        ...formData,
        status,
        pay_max: payRange === 'single' ? undefined : formData.pay_max,
        expected_hours_per_week: formData.expected_hours_per_week || 0,
      };

      if (editingJob) {
        await updateJobPost(editingJob.id, submitData);
        setSuccess(`Job post ${status === 'published' ? 'published' : 'saved'} successfully!`);
      } else {
        await createJobPost(submitData);
        setSuccess(`Job post ${status === 'published' ? 'published' : 'saved'} successfully!`);
        
        // Reset form for new post
        setFormData(prev => ({
          ...prev,
          job_title: '',
          expected_hours_per_week: 40,
          schedule: '',
          pay_min: undefined,
          pay_max: undefined,
          job_description: '',
          language_preference: '',
          transportation_requirement: '',
          supplemental_pay: [],
          benefits: [],
        }));
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (businessesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading businesses...</span>
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Businesses Found</h3>
        <p className="text-yellow-700 mb-4">
          You need to create a business before posting jobs. 
        </p>
        <Button variant="primary" onClick={() => window.history.back()}>
          Go to Business Management
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">
          {editingJob ? 'Edit Job Post' : 'Create New Job Post'}
        </h2>
        <p className="text-gray-600 mt-1">
          Fill out the details below to create a job posting
        </p>
      </div>

      <form className="p-6 space-y-8">
        {/* Business Selection */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <span>🏢</span>
            <span>Business Information</span>
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose Business <span className="text-red-500 text-lg font-bold">*</span>
            </label>
            <select
              value={formData.business_id}
              onChange={(e) => handleBusinessSelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select a business...</option>
              {businesses.map((business) => (
                <option key={business.business_id} value={business.business_id}>
                  {business.name} - {business.location}
                </option>
              ))}
            </select>
          </div>

          {formData.business_id && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Business Name"
                value={formData.business_name}
                onChange={(e) => handleInputChange('business_name', e.target.value)}
                required
              />
              <Input
                label="Business Type"
                value={formData.business_type}
                onChange={(e) => handleInputChange('business_type', e.target.value)}
                required
              />
              <div className="md:col-span-2">
                <Input
                  label="Location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  required
                />
              </div>
            </div>
          )}
        </div>

        {/* Job Details */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <span>💼</span>
            <span>Job Details</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title <span className="text-red-500 text-lg font-bold">*</span>
              </label>
              <input
                type="text"
                value={formData.job_title}
                onChange={(e) => handleInputChange('job_title', e.target.value)}
                placeholder="e.g., Cashier, Server, Sales Associate"
                className="w-full px-4 py-3 text-base rounded-lg border min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-300"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Type <span className="text-red-500 text-lg font-bold">*</span>
              </label>
              <select
                value={formData.job_type}
                onChange={(e) => handleInputChange('job_type', e.target.value as JobType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {Object.entries(JOB_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-red-500 text-lg font-bold">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value);
                  handleInputChange('phone', formatted);
                }}
                placeholder="(555) 123-4567"
                maxLength={17}
                className="w-full px-4 py-3 text-base rounded-lg border min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-300"
                required
              />
            </div>
            <Input
              label="Email (Optional)"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="jobs@company.com"
              pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
              title="Please enter a valid email address"
            />
          </div>
        </div>

        {/* Schedule & Hours */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <span>📅</span>
            <span>Schedule & Hours</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Hours per Week <span className="text-red-500 text-lg font-bold">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="80"
                value={formData.expected_hours_per_week || ''}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value > 0) {
                    handleInputChange('expected_hours_per_week', value);
                  }
                }}
                placeholder="40"
                className="w-full px-4 py-3 text-base rounded-lg border min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-300"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule <span className="text-red-500 text-lg font-bold">*</span>
              </label>
              <input
                type="text"
                value={formData.schedule || ''}
                onChange={(e) => handleInputChange('schedule', e.target.value)}
                placeholder="e.g., Mon–Fri, 9 AM–5 PM"
                className="w-full px-4 py-3 text-base rounded-lg border min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-300"
                required
              />
            </div>
          </div>
        </div>

        {/* Compensation */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <span>💰</span>
            <span>Compensation</span>
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pay Type <span className="text-red-500 text-lg font-bold">*</span>
            </label>
            <select
              value={formData.pay_type}
              onChange={(e) => handleInputChange('pay_type', e.target.value as PayType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {Object.entries(PAY_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pay Structure
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="single"
                  checked={payRange === 'single'}
                  onChange={(e) => setPayRange(e.target.value as 'single' | 'range')}
                  className="mr-2"
                />
                Single Value
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="range"
                  checked={payRange === 'range'}
                  onChange={(e) => setPayRange(e.target.value as 'single' | 'range')}
                  className="mr-2"
                />
                Pay Range
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {payRange === 'single' ? 'Pay Amount' : 'Minimum Pay'} <span className="text-red-500 text-lg font-bold">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.pay_min || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    handleInputChange('pay_min', undefined);
                  } else {
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue) && numValue >= 0) {
                      handleInputChange('pay_min', numValue);
                    }
                  }
                }}
                placeholder="15.00"
                className="w-full px-4 py-3 text-base rounded-lg border min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-300"
                required
              />
            </div>
            {payRange === 'range' && (
              <Input
                label="Maximum Pay"
                type="number"
                min="0"
                step="0.01"
                value={formData.pay_max || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    handleInputChange('pay_max', undefined);
                  } else {
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue) && numValue >= 0) {
                      handleInputChange('pay_max', numValue);
                    }
                  }
                }}
                placeholder="20.00"
              />
            )}
          </div>

          {/* Supplemental Pay */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Supplemental Pay Options
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(SUPPLEMENTAL_PAY_LABELS).map(([value, label]) => (
                <label key={value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={(formData.supplemental_pay || []).includes(value as SupplementalPayOption)}
                    onChange={(e) => handleSupplementalPayChange(value as SupplementalPayOption, e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Benefits Options
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(BENEFITS_LABELS).map(([value, label]) => (
                <label key={value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={(formData.benefits || []).includes(value as BenefitsOption)}
                    onChange={(e) => handleBenefitsChange(value as BenefitsOption, e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Job Description */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <span>📝</span>
            <span>Job Description & Requirements</span>
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Description <span className="text-red-500 text-lg font-bold">*</span>
            </label>
            <textarea
              value={formData.job_description}
              onChange={(e) => handleInputChange('job_description', e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the job responsibilities, requirements, and what makes this position great..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Language Preference (Optional)"
              value={formData.language_preference || ''}
              onChange={(e) => handleInputChange('language_preference', e.target.value)}
              placeholder="e.g., English, Spanish"
            />
            <Input
              label="Transportation Requirement (Optional)"
              value={formData.transportation_requirement || ''}
              onChange={(e) => handleInputChange('transportation_requirement', e.target.value)}
              placeholder="e.g., Car required, Transportation provided"
            />
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-green-400">✅</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={(e) => handleSubmit(e, 'draft')}
              disabled={loading}
              loading={loading}
              className="flex-1 sm:flex-none"
            >
              Save as Draft
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={(e) => handleSubmit(e, 'published')}
              disabled={loading}
              loading={loading}
              className="flex-1 sm:flex-none"
            >
              Publish Job Post
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            * Required fields must be completed to publish
          </p>
        </div>
      </form>
    </div>
  );
}
