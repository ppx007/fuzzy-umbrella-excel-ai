/**
 * API Preset Management Types
 * Defines the structure for storing and managing API configurations
 */

/**
 * API Provider Type
 */
export type ApiProvider = 'openai' | 'azure' | 'claude' | 'gemini' | 'custom';

/**
 * API Preset Configuration
 */
export interface ApiPreset {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Provider type */
  provider: ApiProvider;
  /** API base URL */
  baseUrl: string;
  /** API key (encrypted) */
  apiKey: string;
  /** Model name */
  model: string;
  /** Optional description */
  description?: string;
  /** Whether this is the active preset */
  isActive: boolean;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Custom headers for special providers */
  customHeaders?: Record<string, string>;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Whether to use proxy (for CORS issues) */
  useProxy?: boolean;
  /** Provider-specific configuration */
  providerConfig?: Record<string, any>;
}

/**
 * API Preset Creation Request
 */
export interface CreateApiPresetRequest {
  name: string;
  provider: ApiProvider;
  baseUrl: string;
  apiKey: string;
  model: string;
  description?: string;
  customHeaders?: Record<string, string>;
  timeout?: number;
  maxRetries?: number;
  useProxy?: boolean;
  providerConfig?: Record<string, any>;
}

/**
 * API Preset Update Request
 */
export interface UpdateApiPresetRequest extends Partial<CreateApiPresetRequest> {
  id: string;
}

/**
 * API Preset Response
 */
export interface ApiPresetResponse {
  success: boolean;
  data?: ApiPreset;
  error?: string;
}

/**
 * API Preset List Response
 */
export interface ApiPresetListResponse {
  success: boolean;
  data?: ApiPreset[];
  error?: string;
}

/**
 * API Preset Switch Request
 */
export interface SwitchApiPresetRequest {
  presetId: string;
}

/**
 * API Preset Switch Response
 */
export interface SwitchApiPresetResponse {
  success: boolean;
  data?: {
    previousPresetId?: string;
    currentPreset: ApiPreset;
  };
  error?: string;
}

/**
 * API Preset Validation Result
 */
export interface ApiPresetValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Provider Configuration Templates
 */
export interface ProviderTemplate {
  name: string;
  baseUrl: string;
  model: string;
  description: string;
  customHeaders?: Record<string, string>;
  timeout?: number;
  maxRetries?: number;
  providerConfig?: Record<string, any>;
}

/**
 * Provider Templates Map
 */
export const PROVIDER_TEMPLATES: Record<ApiProvider, ProviderTemplate> = {
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-3.5-turbo',
    description: 'OpenAI GPT models',
    timeout: 180000,
    maxRetries: 3,
  },
  azure: {
    name: 'Azure OpenAI',
    baseUrl: 'https://YOUR_RESOURCE_NAME.openai.azure.com/openai/deployments/YOUR_DEPLOYMENT_NAME',
    model: 'gpt-35-turbo',
    description: 'Azure OpenAI Service',
    timeout: 180000,
    maxRetries: 3,
    customHeaders: {
      'api-key': 'YOUR_API_KEY',
    },
    providerConfig: {
      apiVersion: '2023-05-15',
    },
  },
  claude: {
    name: 'Claude (Anthropic)',
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-3-sonnet-20240229',
    description: 'Anthropic Claude models',
    timeout: 180000,
    maxRetries: 3,
    customHeaders: {
      'anthropic-version': '2023-06-01',
    },
  },
  gemini: {
    name: 'Gemini (Google)',
    baseUrl: 'https://generativelanguage.googleapis.com/v1',
    model: 'gemini-pro',
    description: 'Google Gemini models',
    timeout: 180000,
    maxRetries: 3,
    providerConfig: {
      apiVersion: 'v1',
    },
  },
  custom: {
    name: 'Custom Provider',
    baseUrl: 'https://your-api-endpoint.com/v1',
    model: 'your-model',
    description: 'Custom API provider',
    timeout: 180000,
    maxRetries: 3,
  },
};

/**
 * Default Presets
 */
export const DEFAULT_PRESETS: Omit<ApiPreset, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'OpenAI GPT-3.5',
    provider: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-3.5-turbo',
    description: 'OpenAI GPT-3.5 Turbo - Fast and cost-effective',
    isActive: false,
    timeout: 180000,
    maxRetries: 3,
    useProxy: true,
  },
  {
    name: 'OpenAI GPT-4',
    provider: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4',
    description: 'OpenAI GPT-4 - Most capable model',
    isActive: false,
    timeout: 180000,
    maxRetries: 3,
    useProxy: true,
  },
  {
    name: 'Claude 3 Sonnet',
    provider: 'claude',
    baseUrl: 'https://api.anthropic.com/v1',
    apiKey: '',
    model: 'claude-3-sonnet-20240229',
    description: 'Anthropic Claude 3 Sonnet - Balanced performance',
    isActive: false,
    timeout: 180000,
    maxRetries: 3,
    useProxy: true,
  },
];
