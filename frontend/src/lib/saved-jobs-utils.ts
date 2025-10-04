import { PublicJobPost } from './public-job-api';

export interface SavedJob extends PublicJobPost {
  saved_at: string;
}

/**
 * Get all saved jobs from localStorage
 */
export function getSavedJobs(): SavedJob[] {
  try {
    return JSON.parse(localStorage.getItem('savedJobs') || '[]');
  } catch (error) {
    console.error('Failed to load saved jobs:', error);
    return [];
  }
}

/**
 * Check if a job is currently saved
 */
export function isJobSaved(jobId: string): boolean {
  try {
    const savedJobs = getSavedJobs();
    return savedJobs.some(savedJob => savedJob.id === jobId);
  } catch (error) {
    console.error('Failed to check if job is saved:', error);
    return false;
  }
}

/**
 * Add a job to saved jobs
 */
export function saveJob(job: PublicJobPost): void {
  try {
    const savedJobs = getSavedJobs();
    
    // Check if job is already saved to avoid duplicates
    if (!savedJobs.some(savedJob => savedJob.id === job.id)) {
      const jobWithSavedDate: SavedJob = {
        ...job,
        saved_at: new Date().toISOString()
      };
      
      savedJobs.push(jobWithSavedDate);
      localStorage.setItem('savedJobs', JSON.stringify(savedJobs));
      
      // Trigger event to notify other components
      window.dispatchEvent(new CustomEvent('savedJobsChanged'));
    }
  } catch (error) {
    console.error('Failed to save job:', error);
    throw error;
  }
}

/**
 * Remove a job from saved jobs
 */
export function unsaveJob(jobId: string): void {
  try {
    const savedJobs = getSavedJobs();
    const filteredJobs = savedJobs.filter(savedJob => savedJob.id !== jobId);
    
    localStorage.setItem('savedJobs', JSON.stringify(filteredJobs));
    
    // Trigger event to notify other components
    window.dispatchEvent(new CustomEvent('savedJobsChanged'));
  } catch (error) {
    console.error('Failed to unsave job:', error);
    throw error;
  }
}

/**
 * Remove a job from saved jobs after applying (silent failure)
 * This version doesn't throw errors to avoid breaking the application process
 */
export function removeJobFromSavedAfterApplication(jobId: string): void {
  try {
    if (isJobSaved(jobId)) {
      unsaveJob(jobId);
    }
  } catch (error) {
    // Log error but don't throw to avoid breaking application submission
    console.error('Failed to remove job from saved jobs after application:', error);
  }
}

/**
 * Toggle save status of a job
 */
export function toggleJobSaved(job: PublicJobPost): boolean {
  try {
    const currentlySaved = isJobSaved(job.id);
    
    if (currentlySaved) {
      unsaveJob(job.id);
      return false;
    } else {
      saveJob(job);
      return true;
    }
  } catch (error) {
    console.error('Failed to toggle job save status:', error);
    throw error;
  }
}
