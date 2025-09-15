import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { BusinessScheduleSelector } from './BusinessScheduleSelector';
import { ScheduleTabs } from './ScheduleTabs';
import { WeekNavigator } from './WeekNavigator';
import { WeeklyScheduleView } from './WeeklyScheduleView';
import { ShiftTemplateManager } from './ShiftTemplateManager';
import { PostedScheduleView } from './PostedScheduleView';
import { SchedulesApi, getCurrentWeekStart, WeeklySchedule, ShiftTemplate, CreateShiftDto, UpdateShiftDto } from '../../lib/schedules-api';
import { BusinessesApi, Business } from '../../lib/business-api';
import { Button } from '../ui/Button';

interface ScheduleManagementProps {
  onBack: () => void;
}

export function ScheduleManagement({ onBack }: ScheduleManagementProps) {
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
  const [currentWeek, setCurrentWeek] = useState<string>(getCurrentWeekStart());
  const [activeTab, setActiveTab] = useState<'edit' | 'posted'>('edit');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTemplateManager, setShowTemplateManager] = useState(false);

  // Load businesses on mount
  useEffect(() => {
    loadBusinesses();
  }, []);

  // Load schedule data when business or week changes
  useEffect(() => {
    if (selectedBusinessId) {
      loadScheduleData();
    }
  }, [selectedBusinessId, currentWeek]);

  const loadBusinesses = async () => {
    try {
      const businessData = await BusinessesApi.getBusinesses();
      setBusinesses(businessData);
    } catch (err) {
      setError('Failed to load businesses');
      console.error('Error loading businesses:', err);
    }
  };

  const loadScheduleData = async () => {
    if (!selectedBusinessId) return;

    setLoading(true);
    setError(null);

    try {
      // Load schedule and templates in parallel
      const [schedule, templates] = await Promise.all([
        SchedulesApi.getWeeklySchedule(selectedBusinessId, currentWeek),
        SchedulesApi.getShiftTemplates(selectedBusinessId)
      ]);

      setWeeklySchedule(schedule);
      setShiftTemplates(templates);

      // If no templates exist, create defaults
      if (templates.length === 0) {
        const defaultTemplates = await SchedulesApi.createDefaultShiftTemplates(selectedBusinessId);
        setShiftTemplates(defaultTemplates);
      }
    } catch (err) {
      setError('Failed to load schedule data');
      console.error('Error loading schedule data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShiftCreate = async (shift: CreateShiftDto) => {
    if (!weeklySchedule) return;

    try {
      const newShift = await SchedulesApi.createShift(weeklySchedule.id, shift);
      setWeeklySchedule(prev => prev ? {
        ...prev,
        shifts: [...prev.shifts, newShift]
      } : null);
    } catch (err) {
      setError('Failed to create shift');
      console.error('Error creating shift:', err);
    }
  };

  const handleShiftUpdate = async (shiftId: string, shift: UpdateShiftDto) => {
    try {
      const updatedShift = await SchedulesApi.updateShift(shiftId, shift);
      setWeeklySchedule(prev => prev ? {
        ...prev,
        shifts: prev.shifts.map(s => s.id === shiftId ? updatedShift : s)
      } : null);
    } catch (err) {
      setError('Failed to update shift');
      console.error('Error updating shift:', err);
    }
  };

  const handleShiftDelete = async (shiftId: string) => {
    try {
      await SchedulesApi.deleteShift(shiftId);
      setWeeklySchedule(prev => prev ? {
        ...prev,
        shifts: prev.shifts.filter(s => s.id !== shiftId)
      } : null);
    } catch (err) {
      setError('Failed to delete shift');
      console.error('Error deleting shift:', err);
    }
  };

  const handlePostSchedule = async () => {
    if (!weeklySchedule) return;

    try {
      const postedSchedule = await SchedulesApi.postSchedule(weeklySchedule.id);
      setWeeklySchedule(postedSchedule);
      setActiveTab('posted');
    } catch (err) {
      setError('Failed to post schedule');
      console.error('Error posting schedule:', err);
    }
  };

  const handleUnpostSchedule = async () => {
    if (!weeklySchedule) return;

    try {
      const draftSchedule = await SchedulesApi.unpostSchedule(weeklySchedule.id);
      setWeeklySchedule(draftSchedule);
      setActiveTab('edit');
    } catch (err) {
      setError('Failed to unpost schedule');
      console.error('Error unposting schedule:', err);
    }
  };

  const handleBusinessChange = (businessId: string) => {
    setSelectedBusinessId(businessId);
    setWeeklySchedule(null);
    setShiftTemplates([]);
    setError(null);
  };

  const handleWeekChange = (weekStart: string) => {
    setCurrentWeek(weekStart);
    // Save current week to localStorage for session memory
    localStorage.setItem('schedule_current_week', weekStart);
  };

  // Load saved week from localStorage on mount
  useEffect(() => {
    const savedWeek = localStorage.getItem('schedule_current_week');
    if (savedWeek) {
      setCurrentWeek(savedWeek);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                Schedule Management
              </h1>
            </div>
            
            {selectedBusinessId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplateManager(true)}
              >
                Manage Shift Templates
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Business Selection */}
        <div className="mb-6">
          <BusinessScheduleSelector
            businesses={businesses}
            selectedBusinessId={selectedBusinessId}
            onBusinessChange={handleBusinessChange}
            loading={loading}
          />
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {selectedBusinessId && (
          <>
            {/* Week Navigation */}
            <div className="mb-6">
              <WeekNavigator
                currentWeek={currentWeek}
                onWeekChange={handleWeekChange}
              />
            </div>

            {/* Schedule Tabs */}
            <div className="mb-6">
              <ScheduleTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                scheduleStatus={weeklySchedule?.status}
                onPostSchedule={handlePostSchedule}
                onUnpostSchedule={handleUnpostSchedule}
                loading={loading}
              />
            </div>

            {/* Schedule Content */}
            {loading ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading schedule...</p>
              </div>
            ) : weeklySchedule ? (
              <div className="bg-white rounded-lg shadow">
                {activeTab === 'edit' ? (
                  <WeeklyScheduleView
                    businessId={selectedBusinessId}
                    weekStartDate={currentWeek}
                    employees={weeklySchedule.employees}
                    shifts={weeklySchedule.shifts}
                    shiftTemplates={shiftTemplates}
                    mode="edit"
                    onShiftCreate={handleShiftCreate}
                    onShiftUpdate={handleShiftUpdate}
                    onShiftDelete={handleShiftDelete}
                  />
                ) : (
                  <PostedScheduleView
                    weeklySchedule={weeklySchedule}
                    shiftTemplates={shiftTemplates}
                  />
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600">Select a business to view schedules</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Shift Template Manager Modal */}
      {showTemplateManager && (
        <ShiftTemplateManager
          businessId={selectedBusinessId}
          templates={shiftTemplates}
          onClose={() => setShowTemplateManager(false)}
          onTemplatesUpdate={setShiftTemplates}
        />
      )}
    </div>
  );
}
