import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export enum DocumentType {
  RESUME = 'resume',
  COVER_LETTER = 'cover_letter',
}

export interface DocumentData {
  url: string;
  filename: string;
  type: DocumentType;
  uploadedAt: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export class DocumentsApi {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      throw new Error('User not authenticated');
    }

    return {
      'Content-Type': 'application/json',
      'X-User-Id': session.user.id,
    };
  }

  private async getFormDataAuthHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      throw new Error('User not authenticated');
    }

    return {
      'X-User-Id': session.user.id,
      // Don't set Content-Type for FormData - browser will set it with boundary
    };
  }

  async uploadDocument(
    file: File,
    type: DocumentType,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<DocumentData> {
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Only PDF, DOC, and DOCX files are allowed');
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File size must be less than 5MB');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      const headers = await this.getFormDataAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/documents/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(errorData.message || `Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Document upload error:', error);
      throw error instanceof Error ? error : new Error('Failed to upload document');
    }
  }

  async deleteDocument(type: DocumentType): Promise<{ success: boolean }> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/documents/${type}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Delete failed' }));
        throw new Error(errorData.message || `Delete failed with status ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Document delete error:', error);
      throw error instanceof Error ? error : new Error('Failed to delete document');
    }
  }

  async getDocument(type: DocumentType): Promise<DocumentData | null> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/documents/${type}`, {
        method: 'GET',
        headers,
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Get failed' }));
        throw new Error(errorData.message || `Get failed with status ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Document get error:', error);
      throw error instanceof Error ? error : new Error('Failed to get document');
    }
  }

  async listDocuments(): Promise<DocumentData[]> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/documents`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'List failed' }));
        throw new Error(errorData.message || `List failed with status ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Document list error:', error);
      throw error instanceof Error ? error : new Error('Failed to list documents');
    }
  }
}

export const documentsApi = new DocumentsApi();
