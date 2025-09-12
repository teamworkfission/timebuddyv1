import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { GooglePlacesAutocomplete } from '../ui/GooglePlacesAutocomplete';
import { DocumentManager } from './DocumentManager';
import { employeesApi, Employee, CreateEmployeeData, TRANSPORTATION_OPTIONS, COMMON_SKILLS, COMMON_LANGUAGES } from '../../lib/employees-api';
import { useAuth } from '../../contexts/AuthProvider';

interface EmployeeProfileProps {
  onBack: () => void;
}

export function EmployeeProfile({ onBack }: EmployeeProfileProps) {
  const { profile } = useAuth();
  const [employeeProfile, setEmployeeProfile] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateEmployeeData>({
    full_name: '',
    phone: '',
    email: profile?.email || '',
    state: '',
    city: '',
    short_bio: '',
    availability: '',
    skills: [],
    transportation: undefined,
    languages: [],
    resume_url: ''
  });

  // Document URLs from DocumentManager
  const [documentUrls, setDocumentUrls] = useState<{
    resume?: string;
  }>({});

  // Address lookup state
  const [addressLookup, setAddressLookup] = useState('');

  // Skills and languages UI state
  const [skillInput, setSkillInput] = useState('');
  const [languageInput, setLanguageInput] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await employeesApi.getProfile();
      setEmployeeProfile(data);
      setFormData({
        full_name: data.full_name,
        phone: data.phone,
        email: data.email,
        state: data.state,
        city: data.city,
        short_bio: data.short_bio || '',
        availability: data.availability || '',
        skills: data.skills || [],
        transportation: data.transportation,
        languages: data.languages || [],
        resume_url: data.resume_url || ''
      });
      // Set address lookup field with combined city, state
      setAddressLookup(`${data.city}, ${data.state}`);
    } catch (err) {
      // Profile doesn't exist yet - use defaults with prefilled email
      setEmployeeProfile(null);
      setFormData(prev => ({
        ...prev,
        email: profile?.email || ''
      }));
    } finally {
      setLoading(false);
    }
  };

  // Handle place selection from Google Places
  const handlePlaceSelect = (place: { address: string; city?: string; state?: string; county?: string; postalCode?: string }) => {
    setAddressLookup(place.address);
    
    // Extract state and city from the selected place
    setFormData(prev => ({
      ...prev,
      state: place.state || prev.state,
      city: place.city || prev.city,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate required fields
    if (!formData.full_name || !formData.phone || !formData.email || !formData.state || !formData.city) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate short bio minimum length
    if (formData.short_bio && formData.short_bio.length < 20) {
      setError('Short bio must be at least 20 characters long');
      return;
    }

    // Validate required availability
    if (!formData.availability || formData.availability.trim().length === 0) {
      setError('Availability is required');
      return;
    }

    setSaving(true);

    try {
      // Include document URL from uploaded document
      const profileData = {
        ...formData,
        resume_url: documentUrls.resume || formData.resume_url,
      };

      const savedProfile = await employeesApi.createOrUpdateProfile(profileData);
      setEmployeeProfile(savedProfile);
      setSuccess(employeeProfile ? 'Profile updated successfully!' : 'Profile created successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const addSkill = (skill: string) => {
    if (skill && !formData.skills?.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...(prev.skills || []), skill]
      }));
    }
    setSkillInput('');
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: (prev.skills || []).filter(skill => skill !== skillToRemove)
    }));
  };

  const addLanguage = (language: string) => {
    if (language && !formData.languages?.includes(language)) {
      setFormData(prev => ({
        ...prev,
        languages: [...(prev.languages || []), language]
      }));
    }
    setLanguageInput('');
  };

  const removeLanguage = (languageToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      languages: (prev.languages || []).filter(lang => lang !== languageToRemove)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={onBack}
                className="flex items-center space-x-2"
              >
                <span>←</span>
                <span>Back to Dashboard</span>
              </Button>
              <h1 className="text-2xl font-bold text-gray-800">Job Profile</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-800">Your Worker Profile</h2>
            <p className="text-sm text-gray-600 mt-1 font-bold">
            Complete your profile once and apply faster—no more filling forms every time
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}


          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Required Fields */}
            <div>
              <h3 className="text-lg font-medium text-red-700 mb-4 flex items-center">
                <span className="text-red-500 mr-2">*</span>
                Required Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-50"
                    placeholder="your.email@example.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">Prefilled from your account</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transportation
                  </label>
                  <select
                    value={formData.transportation || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      transportation: e.target.value as any || undefined 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Select transportation...</option>
                    {TRANSPORTATION_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location Lookup */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location <span className="text-red-500">*</span>
                </label>
                <GooglePlacesAutocomplete
                  onPlaceSelect={handlePlaceSelect}
                  value={addressLookup}
                  placeholder="Type your nearest location (we collect only state and city/town)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  🛡️ Never share your exact location - we collect only state and city/town for job matching
                </p>
              </div>

              {/* Manual State/City Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="California"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City/Town <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Los Angeles"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">
                Work Experience & Preferences
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Short Bio (2-3 lines)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.short_bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, short_bio: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Tell employers about your experience..."
                    maxLength={500}
                    minLength={20}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.short_bio?.length || 0}/500 characters
                    {formData.short_bio && formData.short_bio.length < 20 && (
                      <span className="text-red-500 ml-2">(minimum 20 characters)</span>
                    )}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Availability (days/time) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.availability}
                    onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="e.g., Mon-Fri 9AM-5PM, Weekends available"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    This helps employers know when you're available to work
                  </p>
                </div>

                {/* Skills Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skills/Certifications
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.skills?.map((skill, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800 border border-red-200"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-2 text-red-600 hover:text-red-800 text-lg leading-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill(skillInput))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Type a skill and press Enter"
                    />
                    <Button 
                      type="button" 
                      onClick={() => addSkill(skillInput)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2"
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {COMMON_SKILLS.map(skill => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => addSkill(skill)}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-red-100 hover:text-red-700 border border-gray-200"
                      >
                        + {skill}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Languages Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Languages
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.languages?.map((language, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800 border border-red-200"
                      >
                        {language}
                        <button
                          type="button"
                          onClick={() => removeLanguage(language)}
                          className="ml-2 text-red-600 hover:text-red-800 text-lg leading-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={languageInput}
                      onChange={(e) => setLanguageInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage(languageInput))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Type a language and press Enter"
                    />
                    <Button 
                      type="button" 
                      onClick={() => addLanguage(languageInput)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2"
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {COMMON_LANGUAGES.map(language => (
                      <button
                        key={language}
                        type="button"
                        onClick={() => addLanguage(language)}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-red-100 hover:text-red-700 border border-gray-200"
                      >
                        + {language}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Document Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resume / Cover Letter (PDF/DOC)
                  </label>
                  <p className="text-xs text-gray-600 mb-3">
                    Upload your resume or cover letter - you can use either document type
                  </p>
                  <DocumentManager onDocumentsChange={setDocumentUrls} />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              {/* Success Message */}
              <div className="flex-1">
                {success && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md max-w-md">
                    <p className="text-sm text-green-700">{success}</p>
                  </div>
                )}
              </div>
              
              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={saving}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-2 font-medium ml-4"
              >
                {saving ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  employeeProfile ? 'Update Profile' : 'Create Profile'
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
