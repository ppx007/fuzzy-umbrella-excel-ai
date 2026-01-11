/**
 * API Preset Management Service
 * Manages storage and switching of API configurations
 */

import {
  ApiPreset,
  CreateApiPresetRequest,
  UpdateApiPresetRequest,
  ApiPresetResponse,
  ApiPresetListResponse,
  SwitchApiPresetRequest,
  SwitchApiPresetResponse,
  ApiPresetValidationResult,
  PROVIDER_TEMPLATES,
  DEFAULT_PRESETS,
} from '@/types/api-preset';
import { v4 as uuidv4 } from 'uuid';

/**
 * API Preset Service
 * Handles CRUD operations for API presets and active preset management
 */
export class ApiPresetService {
  private static readonly STORAGE_KEY = 'excel-addin-api-presets';
  private static readonly ACTIVE_PRESET_KEY = 'excel-addin-active-preset';

  private presets: ApiPreset[] = [];
  private activePresetId: string | null = null;

  constructor() {
    this.loadPresets();
  }

  /**
   * Load presets from localStorage
   */
  private loadPresets(): void {
    try {
      const stored = localStorage.getItem(ApiPresetService.STORAGE_KEY);
      if (stored) {
        this.presets = JSON.parse(stored) as ApiPreset[];
      } else {
        // Initialize with default presets
        this.initializeDefaultPresets();
      }

      const activeId = localStorage.getItem(ApiPresetService.ACTIVE_PRESET_KEY);
      this.activePresetId = activeId || this.getDefaultActivePresetId();
    } catch (error) {
      console.error('[ApiPresetService] Failed to load presets:', error);
      this.initializeDefaultPresets();
    }
  }

  /**
   * Save presets to localStorage
   */
  private savePresets(): void {
    try {
      localStorage.setItem(ApiPresetService.STORAGE_KEY, JSON.stringify(this.presets));
      if (this.activePresetId) {
        localStorage.setItem(ApiPresetService.ACTIVE_PRESET_KEY, this.activePresetId);
      }
    } catch (error) {
      console.error('[ApiPresetService] Failed to save presets:', error);
      throw new Error('Failed to save API presets');
    }
  }

  /**
   * Initialize default presets
   */
  private initializeDefaultPresets(): void {
    this.presets = DEFAULT_PRESETS.map((preset, index) => ({
      ...preset,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Make the first preset active by default
      isActive: index === 0,
    }));

    this.activePresetId = this.presets[0]?.id || null;
    this.savePresets();
  }

  /**
   * Get default active preset ID
   */
  private getDefaultActivePresetId(): string | null {
    const activePreset = this.presets.find(preset => preset.isActive);
    return activePreset?.id || this.presets[0]?.id || null;
  }

  /**
   * Get all presets
   */
  getAllPresets(): ApiPreset[] {
    return [...this.presets];
  }

  /**
   * Get active preset
   */
  getActivePreset(): ApiPreset | null {
    if (!this.activePresetId) return null;
    return this.presets.find(preset => preset.id === this.activePresetId) || null;
  }

  /**
   * Create a new preset
   */
  createPreset(request: CreateApiPresetRequest): ApiPresetResponse {
    try {
      // Validate the request
      const validation = this.validatePresetRequest(request);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join('; '),
        };
      }

      // Create new preset
      const newPreset: ApiPreset = {
        id: uuidv4(),
        name: request.name,
        provider: request.provider,
        baseUrl: request.baseUrl,
        apiKey: request.apiKey, // Note: In production, this should be encrypted
        model: request.model,
        description: request.description,
        isActive: false, // New presets are not active by default
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        customHeaders: request.customHeaders,
        timeout: request.timeout || 180000,
        maxRetries: request.maxRetries || 3,
        useProxy: request.useProxy !== false, // Default to true
        providerConfig: request.providerConfig,
      };

      this.presets.push(newPreset);
      this.savePresets();

      return {
        success: true,
        data: newPreset,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create preset',
      };
    }
  }

  /**
   * Update an existing preset
   */
  updatePreset(request: UpdateApiPresetRequest): ApiPresetResponse {
    try {
      const presetIndex = this.presets.findIndex(preset => preset.id === request.id);
      if (presetIndex === -1) {
        return {
          success: false,
          error: 'Preset not found',
        };
      }

      const existingPreset = this.presets[presetIndex];
      const updatedPreset: ApiPreset = {
        ...existingPreset,
        ...request,
        id: existingPreset.id, // Keep original ID
        updatedAt: new Date().toISOString(),
      };

      // Validate the updated preset
      const validation = this.validatePresetRequest(updatedPreset);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join('; '),
        };
      }

      this.presets[presetIndex] = updatedPreset;
      this.savePresets();

      return {
        success: true,
        data: updatedPreset,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update preset',
      };
    }
  }

  /**
   * Delete a preset
   */
  deletePreset(presetId: string): ApiPresetResponse {
    try {
      const presetIndex = this.presets.findIndex(preset => preset.id === presetId);
      if (presetIndex === -1) {
        return {
          success: false,
          error: 'Preset not found',
        };
      }

      const preset = this.presets[presetIndex];

      // Don't allow deleting the last preset
      if (this.presets.length <= 1) {
        return {
          success: false,
          error: 'Cannot delete the last preset',
        };
      }

      // Don't allow deleting the active preset
      if (preset.isActive) {
        return {
          success: false,
          error: 'Cannot delete the active preset. Please switch to another preset first.',
        };
      }

      this.presets.splice(presetIndex, 1);
      this.savePresets();

      return {
        success: true,
        data: preset,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete preset',
      };
    }
  }

  /**
   * Switch to a different preset
   */
  switchPreset(request: SwitchApiPresetRequest): SwitchApiPresetResponse {
    try {
      const newPreset = this.presets.find(preset => preset.id === request.presetId);
      if (!newPreset) {
        return {
          success: false,
          error: 'Preset not found',
        };
      }

      const previousActivePreset = this.getActivePreset();
      const previousPresetId = previousActivePreset?.id;

      // Deactivate all presets
      this.presets.forEach(preset => {
        preset.isActive = false;
      });

      // Activate the selected preset
      newPreset.isActive = true;
      this.activePresetId = newPreset.id;
      this.savePresets();

      return {
        success: true,
        data: {
          previousPresetId,
          currentPreset: newPreset,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to switch preset',
      };
    }
  }

  /**
   * Validate preset request
   */
  private validatePresetRequest(
    request: CreateApiPresetRequest | ApiPreset
  ): ApiPresetValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate name
    if (!request.name || request.name.trim().length === 0) {
      errors.push('Preset name is required');
    } else if (request.name.length > 50) {
      errors.push('Preset name must be 50 characters or less');
    }

    // Validate provider
    if (!request.provider) {
      errors.push('Provider is required');
    } else if (!PROVIDER_TEMPLATES[request.provider]) {
      errors.push('Invalid provider');
    }

    // Validate base URL
    if (!request.baseUrl || request.baseUrl.trim().length === 0) {
      errors.push('Base URL is required');
    } else {
      try {
        new URL(request.baseUrl);
      } catch {
        errors.push('Invalid base URL format');
      }
    }

    // Validate API key
    if (!request.apiKey || request.apiKey.trim().length === 0) {
      warnings.push('API key is empty - this preset cannot be used until configured');
    }

    // Validate model
    if (!request.model || request.model.trim().length === 0) {
      errors.push('Model is required');
    }

    // Validate timeout
    if (request.timeout && (request.timeout < 1000 || request.timeout > 600000)) {
      errors.push('Timeout must be between 1 second and 10 minutes');
    }

    // Validate max retries
    if (request.maxRetries && (request.maxRetries < 0 || request.maxRetries > 10)) {
      errors.push('Max retries must be between 0 and 10');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Get provider template
   */
  getProviderTemplate(
    provider: keyof typeof PROVIDER_TEMPLATES
  ): (typeof PROVIDER_TEMPLATES)[keyof typeof PROVIDER_TEMPLATES] {
    return PROVIDER_TEMPLATES[provider];
  }

  /**
   * Create preset from provider template
   */
  createPresetFromTemplate(
    provider: keyof typeof PROVIDER_TEMPLATES,
    name: string,
    apiKey: string
  ): ApiPresetResponse {
    const template = this.getProviderTemplate(provider);

    return this.createPreset({
      name,
      provider,
      baseUrl: template.baseUrl,
      apiKey,
      model: template.model,
      description: template.description,
      customHeaders: template.customHeaders,
      timeout: template.timeout,
      maxRetries: template.maxRetries,
      useProxy: true,
      providerConfig: template.providerConfig,
    });
  }

  /**
   * Reset to default presets
   */
  resetToDefaults(): ApiPresetListResponse {
    try {
      this.presets = [];
      this.initializeDefaultPresets();

      return {
        success: true,
        data: this.presets,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reset presets',
      };
    }
  }

  /**
   * Export presets (for backup)
   */
  exportPresets(): string {
    return JSON.stringify(this.presets, null, 2);
  }

  /**
   * Import presets (from backup)
   */
  importPresets(jsonString: string): ApiPresetListResponse {
    try {
      const importedPresets = JSON.parse(jsonString) as ApiPreset[];

      // Validate imported presets
      for (const preset of importedPresets) {
        const validation = this.validatePresetRequest(preset);
        if (!validation.isValid) {
          return {
            success: false,
            error: `Invalid preset "${preset.name}": ${validation.errors.join(', ')}`,
          };
        }
      }

      // Ensure only one active preset
      const activePresets = importedPresets.filter(p => p.isActive);
      if (activePresets.length > 1) {
        importedPresets.forEach(p => (p.isActive = false));
        if (activePresets.length > 0) {
          activePresets[0].isActive = true;
        }
      }

      this.presets = importedPresets;
      this.activePresetId = this.getDefaultActivePresetId();
      this.savePresets();

      return {
        success: true,
        data: this.presets,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import presets',
      };
    }
  }
}

/**
 * Default API Preset Service Instance
 */
export const apiPresetService = new ApiPresetService();

/**
 * Convenience functions
 */
export async function createApiPreset(request: CreateApiPresetRequest): Promise<ApiPresetResponse> {
  return apiPresetService.createPreset(request);
}

export async function updateApiPreset(request: UpdateApiPresetRequest): Promise<ApiPresetResponse> {
  return apiPresetService.updatePreset(request);
}

export async function deleteApiPreset(presetId: string): Promise<ApiPresetResponse> {
  return apiPresetService.deletePreset(presetId);
}

export async function switchApiPreset(presetId: string): Promise<SwitchApiPresetResponse> {
  return apiPresetService.switchPreset({ presetId });
}

export function getApiPresets(): ApiPreset[] {
  return apiPresetService.getAllPresets();
}

export function getActiveApiPreset(): ApiPreset | null {
  return apiPresetService.getActivePreset();
}
