import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { PublicJobPost } from '../../lib/public-job-api';
import { Employee, employeesApi } from '../../lib/employees-api';
import { createJobApplication, JobApplicationData } from '../../lib/job-applications-api';
import { removeJobFromSavedAfterApplication } from '../../lib/saved-jobs-utils';

interface JobApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: PublicJobPost;
  onSuccess?: () => void;
}

export function JobApplicationModal({ isOpen, onClose, job, onSuccess }: JobApplicationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [employeeProfile, setEmployeeProfile] = useState<Employee | null>(null);
  const [fillFromProfile, setFillFromProfile] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState<JobApplicationData>({
    job_post_id: job.id,
    full_name: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    short_bio: '',
    availability: '',
    skills: [],
    transportation: undefined,
    languages: [],
    resume_url: '',
    show_phone: true,
    show_email: true,
    cover_message: '',
    safety_disclaimer_accepted: false,
  });

  // Load employee profile on mount
  useEffect(() => {
    if (isOpen) {
      loadEmployeeProfile();
    }
  }, [isOpen]);

  // Auto-fill from profile when toggle is enabled
  useEffect(() => {
    if (fillFromProfile && employeeProfile) {
      setFormData(prev => ({
        ...prev,
        full_name: employeeProfile.full_name || '',
        email: employeeProfile.email || '',
        phone: employeeProfile.phone || '',
        city: employeeProfile.city || '',
        state: employeeProfile.state || '',
        short_bio: employeeProfile.short_bio || '',
        availability: employeeProfile.availability || '',
        skills: employeeProfile.skills || [],
        transportation: employeeProfile.transportation,
        languages: employeeProfile.languages || [],
        resume_url: employeeProfile.resume_url || '',
      }));
    } else if (!fillFromProfile) {
      // Clear all fields when toggle is turned off
      setFormData(prev => ({
        ...prev,
        full_name: '',
        email: '',
        phone: '',
        city: '',
        state: '',
        short_bio: '',
        availability: '',
        skills: [],
        transportation: undefined,
        languages: [],
        resume_url: '',
      }));
    }
  }, [fillFromProfile, employeeProfile]);

  const loadEmployeeProfile = async () => {
    try {
      const profile = await employeesApi.getProfile();
      setEmployeeProfile(profile);
    } catch (error) {
      console.error('Failed to load employee profile:', error);
      // Profile might not exist yet, which is fine
      setEmployeeProfile(null);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      setSuccess(false);
      setFillFromProfile(false);
      setFormData({
        job_post_id: job.id,
        full_name: '',
        email: '',
        phone: '',
        city: '',
        state: '',
        short_bio: '',
        availability: '',
        skills: [],
        transportation: undefined,
        languages: [],
        resume_url: '',
        show_phone: true,
        show_email: true,
        cover_message: '',
        safety_disclaimer_accepted: false,
      });
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validation
      if (!formData.full_name.trim()) {
        throw new Error('Full name is required');
      }
      if (!formData.email.trim()) {
        throw new Error('Email is required');
      }
      if (!formData.safety_disclaimer_accepted) {
        throw new Error('You must accept the safety disclaimer to continue');
      }

      await createJobApplication(formData);
      setSuccess(true);
      
      // Remove job from saved jobs if it was previously saved
      removeJobFromSavedAfterApplication(job.id);
      
      // Notify other components that a new application was submitted
      window.dispatchEvent(new CustomEvent('jobApplicationSubmitted'));
      
      // Auto-close after success
      setTimeout(() => {
        handleClose();
        onSuccess?.();
      }, 2000);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof JobApplicationData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSkillsChange = (value: string) => {
    // Convert comma-separated string to array
    const skillsArray = value.split(',').map(skill => skill.trim()).filter(Boolean);
    handleInputChange('skills', skillsArray);
  };

  const handleLanguagesChange = (value: string) => {
    // Convert comma-separated string to array
    const languagesArray = value.split(',').map(lang => lang.trim()).filter(Boolean);
    handleInputChange('languages', languagesArray);
  };

  if (success) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Application Submitted!" maxWidth="lg">
        <div className="text-center py-8">
          <div className="text-green-500 text-6xl mb-6">✅</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            Your application has been submitted successfully!
          </h3>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 mb-2 font-medium">
              Application sent to: {job.business_name}
            </p>
            <p className="text-green-700 text-sm">
              Position: {job.job_title} • Location: {job.location}
            </p>
          </div>
          <p className="text-gray-600 mb-4">
            The employer will review your application and may contact you using the information you chose to share.
          </p>
          <p className="text-sm text-gray-500">
            You can track your application status in your employee dashboard.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Apply to ${job.job_title}`} maxWidth="4xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Job Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900">{job.job_title}</h3>
          <p className="text-gray-600">{job.business_name} • {job.location}</p>
        </div>

        {/* Profile Toggle */}
        {employeeProfile && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={fillFromProfile}
                onChange={(e) => setFillFromProfile(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-blue-900">
                Fill from Job Profile
              </span>
            </label>
            <p className="text-xs text-blue-700 mt-1">
              Auto-populate form fields with your saved profile information
            </p>
          </div>
        )}

        {/* Two-column layout for desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Basic Information */}
          <div className="space-y-6">
            <h4 className="font-medium text-gray-900 text-lg border-b pb-2">Basic Information</h4>
            
            <Input
              label="Full Name *"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              required
            />
            
            <div>
              <Input
                label="Email *"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
              <label className="flex items-center space-x-2 mt-2">
                <input
                  type="checkbox"
                  checked={formData.show_email}
                  onChange={(e) => handleInputChange('show_email', e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">📧 Show email to employer</span>
              </label>
            </div>
            
            <div>
              <Input
                label="Phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
              <label className="flex items-center space-x-2 mt-2">
                <input
                  type="checkbox"
                  checked={formData.show_phone}
                  onChange={(e) => handleInputChange('show_phone', e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">📱 Show phone to employer</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="City"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
              />
              <Input
                label="State"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
              />
            </div>

            {/* Resume Section */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Resume</label>
              {formData.resume_url ? (
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">📄</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Resume attached</p>
                      <a 
                        href={formData.resume_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        View Resume
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleInputChange('resume_url', '')}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <span className="text-4xl text-gray-400">📄</span>
                  <p className="text-sm text-gray-600 mt-2">
                    No resume on file. You can upload one in your profile settings.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Additional Information */}
          <div className="space-y-6">
            <h4 className="font-medium text-gray-900 text-lg border-b pb-2">Additional Information</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short Bio
              </label>
              <textarea
                value={formData.short_bio}
                onChange={(e) => handleInputChange('short_bio', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Tell the employer about yourself..."
              />
            </div>

            <Input
              label="Availability"
              value={formData.availability}
              onChange={(e) => handleInputChange('availability', e.target.value)}
              placeholder="e.g., Weekends, evenings, flexible"
            />

            <Input
              label="Skills"
              value={formData.skills?.join(', ') || ''}
              onChange={(e) => handleSkillsChange(e.target.value)}
              placeholder="e.g., Customer service, cash handling, teamwork"
            />

            <Input
              label="Languages"
              value={formData.languages?.join(', ') || ''}
              onChange={(e) => handleLanguagesChange(e.target.value)}
              placeholder="e.g., English, Spanish, French"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Transportation
              </label>
              <div className="space-y-3">
                {[
                  { value: 'own_car', label: 'Own Car', icon: '🚗' },
                  { value: 'public_transit', label: 'Public Transit', icon: '🚌' },
                  { value: 'not_needed', label: 'Not Needed', icon: '🚶' }
                ].map(option => (
                  <label key={option.value} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="transportation"
                      value={option.value}
                      checked={formData.transportation === option.value}
                      onChange={(e) => handleInputChange('transportation', e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-lg">{option.icon}</span>
                    <span className="text-sm text-gray-700 flex-1">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Cover Message - Full width */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 text-lg border-b pb-2">Cover Message</h4>
          <textarea
            value={formData.cover_message}
            onChange={(e) => handleInputChange('cover_message', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Why are you interested in this position? What makes you a great fit? (Optional)"
          />
        </div>

        {/* Safety Disclaimer */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-2">Safety Notice</h4>
          <p className="text-sm text-yellow-800 mb-3">
            Protect your information. Verify the employer's details before sharing personal info. 
            PTimeBuddy is a gig platform—use caution and report suspicious posts.
          </p>
          <label className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={formData.safety_disclaimer_accepted}
              onChange={(e) => handleInputChange('safety_disclaimer_accepted', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 mt-0.5"
              required
            />
            <span className="text-sm text-yellow-900">
              I agree and understand the safety guidelines *
            </span>
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={loading}
            size="lg"
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={loading || !formData.safety_disclaimer_accepted}
            className="min-w-[150px]"
            size="lg"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                Submitting...
              </>
            ) : (
              '📝 Submit Application'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
