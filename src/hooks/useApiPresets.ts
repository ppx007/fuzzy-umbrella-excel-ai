/**
 * API Presets Hook
 * Manages API preset state and operations for React components
 */

import { useState, useEffect, useCallback } from 'react';
import {
  ApiPreset,
  CreateApiPresetRequest,
  UpdateApiPresetRequest,
  ApiPresetResponse,
  ApiPresetListResponse,
  SwitchApiPresetResponse,
  ApiProvider,
} from '@/types/api-preset';
import { apiPresetService } from '@/services/api-preset-service';

/**
 * API Presets Hook Return Type
 */
export interface UseApiPresetsReturn {
  // State
  presets: ApiPreset[];
  activePreset: ApiPreset | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  createPreset: (request: CreateApiPresetRequest) => Promise<ApiPresetResponse>;
  updatePreset: (request: UpdateApiPresetRequest) => Promise<ApiPresetResponse>;
  deletePreset: (presetId: string) => Promise<ApiPresetResponse>;
  switchPreset: (presetId: string) => Promise<SwitchApiPresetResponse>;
  refreshPresets: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
  exportPresets: () => string;
  importPresets: (jsonString: string) => Promise<ApiPresetListResponse>;
  createPresetFromTemplate: (
    provider: string,
    name: string,
    apiKey: string
  ) => Promise<ApiPresetResponse>;

  // Utilities
  getProviderTemplate: (provider: string) => any;
  validatePreset: (preset: CreateApiPresetRequest) => any;
}

/**
 * API Presets Hook
 */
export function useApiPresets(): UseApiPresetsReturn {
  const [presets, setPresets] = useState<ApiPreset[]>([]);
  const [activePreset, setActivePreset] = useState<ApiPreset | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load presets from service
   */
  const loadPresets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const allPresets = apiPresetService.getAllPresets();
      const active = apiPresetService.getActivePreset();

      setPresets(allPresets);
      setActivePreset(active);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load presets');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create a new preset
   */
  const createPreset = useCallback(
    async (request: CreateApiPresetRequest): Promise<ApiPresetResponse> => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiPresetService.createPreset(request);

        if (response.success && response.data) {
          await loadPresets(); // Refresh the list
        }

        return response;
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Failed to create preset';
        setError(error);
        return { success: false, error };
      } finally {
        setIsLoading(false);
      }
    },
    [loadPresets]
  );

  /**
   * Update an existing preset
   */
  const updatePreset = useCallback(
    async (request: UpdateApiPresetRequest): Promise<ApiPresetResponse> => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiPresetService.updatePreset(request);

        if (response.success && response.data) {
          await loadPresets(); // Refresh the list
        }

        return response;
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Failed to update preset';
        setError(error);
        return { success: false, error };
      } finally {
        setIsLoading(false);
      }
    },
    [loadPresets]
  );

  /**
   * Delete a preset
   */
  const deletePreset = useCallback(
    async (presetId: string): Promise<ApiPresetResponse> => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiPresetService.deletePreset(presetId);

        if (response.success) {
          await loadPresets(); // Refresh the list
        }

        return response;
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Failed to delete preset';
        setError(error);
        return { success: false, error };
      } finally {
        setIsLoading(false);
      }
    },
    [loadPresets]
  );

  /**
   * Switch to a different preset
   */
  const switchPreset = useCallback(
    async (presetId: string): Promise<SwitchApiPresetResponse> => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiPresetService.switchPreset({ presetId });

        if (response.success && response.data) {
          await loadPresets(); // Refresh the list and update active preset
        }

        return response;
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Failed to switch preset';
        setError(error);
        return { success: false, error };
      } finally {
        setIsLoading(false);
      }
    },
    [loadPresets]
  );

  /**
   * Refresh presets from storage
   */
  const refreshPresets = useCallback(async (): Promise<void> => {
    await loadPresets();
  }, [loadPresets]);

  /**
   * Reset to default presets
   */
  const resetToDefaults = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      await apiPresetService.resetToDefaults();
      await loadPresets();
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to reset presets';
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [loadPresets]);

  /**
   * Export presets as JSON
   */
  const exportPresets = useCallback((): string => {
    return apiPresetService.exportPresets();
  }, []);

  /**
   * Import presets from JSON
   */
  const importPresets = useCallback(
    async (jsonString: string): Promise<ApiPresetListResponse> => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiPresetService.importPresets(jsonString);

        if (response.success) {
          await loadPresets();
        }

        return response;
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Failed to import presets';
        setError(error);
        return { success: false, error };
      } finally {
        setIsLoading(false);
      }
    },
    [loadPresets]
  );

  /**
   * Create preset from provider template
   */
  const createPresetFromTemplate = useCallback(
    async (provider: string, name: string, apiKey: string): Promise<ApiPresetResponse> => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiPresetService.createPresetFromTemplate(
          provider as ApiProvider,
          name,
          apiKey
        );

        if (response.success && response.data) {
          await loadPresets();
        }

        return response;
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Failed to create preset from template';
        setError(error);
        return { success: false, error };
      } finally {
        setIsLoading(false);
      }
    },
    [loadPresets]
  );

  /**
   * Get provider template
   */
  const getProviderTemplate = useCallback((provider: string) => {
    return apiPresetService.getProviderTemplate(provider as any);
  }, []);

  /**
   * Validate preset
   */
  const validatePreset = useCallback((preset: CreateApiPresetRequest) => {
    // Basic validation - check required fields
    const errors: string[] = [];

    if (!preset.name?.trim()) {
      errors.push('Name is required');
    }

    if (!preset.provider) {
      errors.push('Provider is required');
    }

    if (!preset.apiKey?.trim()) {
      errors.push('API key is required');
    }

    if (!preset.model?.trim()) {
      errors.push('Model is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, []);

  // Load presets on mount
  useEffect(() => {
    loadPresets();
  }, []);

  return {
    // State
    presets,
    activePreset,
    isLoading,
    error,

    // Actions
    createPreset,
    updatePreset,
    deletePreset,
    switchPreset,
    refreshPresets,
    resetToDefaults,
    exportPresets,
    importPresets,
    createPresetFromTemplate,

    // Utilities
    getProviderTemplate,
    validatePreset,
  };
}
