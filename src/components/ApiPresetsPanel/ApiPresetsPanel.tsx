/**
 * API Presets Panel Component
 * Provides UI for managing API presets with provider templates
 */

import { useState } from 'react';
import { useApiPresets } from '@/hooks/useApiPresets';
import { ApiPreset, ApiProvider } from '@/types/api-preset';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Modal } from '@/components/common/Modal';
import { Loading } from '@/components/common/Loading';

/**
 * API Presets Panel Props
 */
export interface ApiPresetsPanelProps {
  className?: string;
  onClose?: () => void;
}

/**
 * API Presets Panel Component
 */
export const ApiPresetsPanel: React.FC<ApiPresetsPanelProps> = ({ className = '', onClose }) => {
  const {
    presets,
    isLoading,
    error,
    createPreset,
    updatePreset,
    deletePreset,
    switchPreset,
    refreshPresets,
    exportPresets,
    importPresets,
    createPresetFromTemplate,
    getProviderTemplate,
    validatePreset,
  } = useApiPresets();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<ApiPreset | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    provider: 'openai' as ApiProvider,
    apiKey: '',
    model: '',
    baseUrl: '',
    description: '',
    isActive: false,
  });

  // Provider options
  const providerOptions = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'azure', label: 'Azure OpenAI' },
    { value: 'claude', label: 'Claude' },
    { value: 'gemini', label: 'Gemini' },
    { value: 'custom', label: 'Custom' },
  ];

  // Model options by provider
  const modelOptions = {
    openai: [
      { value: 'gpt-4', label: 'GPT-4' },
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    ],
    azure: [
      { value: 'gpt-4', label: 'GPT-4' },
      { value: 'gpt-4-32k', label: 'GPT-4 32K' },
      { value: 'gpt-35-turbo', label: 'GPT-3.5 Turbo' },
    ],
    claude: [
      { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
      { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
      { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
    ],
    gemini: [
      { value: 'gemini-pro', label: 'Gemini Pro' },
      { value: 'gemini-pro-vision', label: 'Gemini Pro Vision' },
    ],
    custom: [{ value: 'custom-model', label: 'Custom Model' }],
  };

  /**
   * Handle provider change
   */
  const handleProviderChange = (provider: ApiProvider) => {
    setFormData(prev => ({
      ...prev,
      provider,
      model: modelOptions[provider]?.[0]?.value || '',
      baseUrl: getProviderTemplate(provider).baseUrl || '',
    }));
  };

  /**
   * Handle create preset
   */
  const handleCreatePreset = async () => {
    const validation = validatePreset(formData);
    if (!validation.isValid) {
      alert(`Validation errors:\n${validation.errors.join('\n')}`);
      return;
    }

    const response = await createPreset(formData);
    if (response.success) {
      setIsCreateModalOpen(false);
      resetForm();
    } else {
      alert(`Failed to create preset: ${response.error}`);
    }
  };

  /**
   * Handle update preset
   */
  const handleUpdatePreset = async () => {
    if (!editingPreset) return;

    const response = await updatePreset({
      id: editingPreset.id,
      ...formData,
    });

    if (response.success) {
      setIsEditModalOpen(false);
      setEditingPreset(null);
      resetForm();
    } else {
      alert(`Failed to update preset: ${response.error}`);
    }
  };

  /**
   * Handle delete preset
   */
  const handleDeletePreset = async (presetId: string) => {
    if (confirm('Are you sure you want to delete this preset?')) {
      const response = await deletePreset(presetId);
      if (!response.success) {
        alert(`Failed to delete preset: ${response.error}`);
      }
    }
  };

  /**
   * Handle switch preset
   */
  const handleSwitchPreset = async (presetId: string) => {
    const response = await switchPreset(presetId);
    if (!response.success) {
      alert(`Failed to switch preset: ${response.error}`);
    }
  };

  /**
   * Handle import presets
   */
  const handleImportPresets = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        const response = await importPresets(text);
        if (!response.success) {
          alert(`Failed to import presets: ${response.error}`);
        }
      }
    };

    input.click();
  };

  /**
   * Handle export presets
   */
  const handleExportPresets = () => {
    const jsonString = exportPresets();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-presets-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Open edit modal
   */
  const openEditModal = (preset: ApiPreset) => {
    setEditingPreset(preset);
    setFormData({
      name: preset.name,
      provider: preset.provider,
      apiKey: preset.apiKey,
      model: preset.model,
      baseUrl: preset.baseUrl || '',
      description: preset.description || '',
      isActive: preset.isActive,
    });
    setIsEditModalOpen(true);
  };

  /**
   * Reset form
   */
  const resetForm = () => {
    setFormData({
      name: '',
      provider: 'openai',
      apiKey: '',
      model: 'gpt-4',
      baseUrl: '',
      description: '',
      isActive: false,
    });
  };

  /**
   * Create preset from template
   */
  const handleCreateFromTemplate = async (provider: ApiProvider) => {
    const name = prompt(`Enter a name for the ${provider} preset:`);
    if (!name) return;

    const apiKey = prompt(`Enter your ${provider} API key:`);
    if (!apiKey) return;

    const response = await createPresetFromTemplate(provider, name, apiKey);
    if (!response.success) {
      alert(`Failed to create preset: ${response.error}`);
    }
  };

  if (isLoading && presets.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <Loading size="medium" />
          <span className="ml-2">Loading presets...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">API Presets</h2>
        <div className="flex items-center space-x-2">
          <Button variant="secondary" size="small" onClick={refreshPresets} disabled={isLoading}>
            ↻ Refresh
          </Button>
          <Button variant="secondary" size="small" onClick={handleExportPresets}>
            ↓ Export
          </Button>
          <Button variant="secondary" size="small" onClick={handleImportPresets}>
            ↑ Import
          </Button>
          <Button variant="primary" size="small" onClick={() => setIsCreateModalOpen(true)}>
            + New Preset
          </Button>
          {onClose && (
            <Button variant="text" size="small" onClick={onClose}>
              ✕ Close
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}

      {/* Provider Templates */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Setup</h3>
        <div className="flex flex-wrap gap-2">
          {providerOptions.map(({ value, label }) => (
            <Button
              key={value}
              variant="outline"
              size="small"
              onClick={() => handleCreateFromTemplate(value as ApiProvider)}
              className="text-xs"
            >
              + {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Presets List */}
      <div className="space-y-3">
        {presets.map(preset => (
          <div
            key={preset.id}
            className={`p-4 border rounded-lg ${
              preset.isActive ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium text-gray-900">{preset.name}</h3>
                  {preset.isActive && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <span className="mr-1">✓</span>
                      Active
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {preset.provider} • {preset.model}
                </p>
                {preset.description && (
                  <p className="text-sm text-gray-500 mt-1">{preset.description}</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {!preset.isActive && (
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => handleSwitchPreset(preset.id)}
                  >
                    Activate
                  </Button>
                )}
                <Button variant="text" size="small" onClick={() => openEditModal(preset)}>
                  ✎ Edit
                </Button>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => handleDeletePreset(preset.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  🗑 Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {presets.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-4">⚙</div>
          <p>No API presets configured</p>
          <p className="text-sm mt-1">Create your first preset to get started</p>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        title="Create API Preset"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder="My OpenAI Preset"
            required
          />

          <Select
            label="Provider"
            value={formData.provider}
            onChange={(value: string) => handleProviderChange(value as ApiProvider)}
            options={providerOptions}
            required
          />

          <Input
            label="API Key"
            type="password"
            value={formData.apiKey}
            onChange={e => setFormData({ ...formData, apiKey: e.target.value })}
            placeholder="sk-..."
            required
          />

          <Select
            label="Model"
            value={formData.model}
            onChange={(value: string) => setFormData({ ...formData, model: value })}
            options={modelOptions[formData.provider] || []}
            required
          />

          <Input
            label="Base URL (Optional)"
            value={formData.baseUrl}
            onChange={e => setFormData({ ...formData, baseUrl: e.target.value })}
            placeholder={getProviderTemplate(formData.provider).baseUrl}
          />

          <Input
            label="Description (Optional)"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            placeholder="A brief description of this preset"
          />
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button
            variant="secondary"
            onClick={() => {
              setIsCreateModalOpen(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreatePreset}>
            Create Preset
          </Button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPreset(null);
          resetForm();
        }}
        title="Edit API Preset"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder="My OpenAI Preset"
            required
          />

          <Select
            label="Provider"
            value={formData.provider}
            onChange={(value: string) => handleProviderChange(value as ApiProvider)}
            options={providerOptions}
            required
            disabled
          />

          <Input
            label="API Key"
            type="password"
            value={formData.apiKey}
            onChange={e => setFormData({ ...formData, apiKey: e.target.value })}
            placeholder="sk-..."
            required
          />

          <Select
            label="Model"
            value={formData.model}
            onChange={(value: string) => setFormData({ ...formData, model: value })}
            options={modelOptions[formData.provider] || []}
            required
          />

          <Input
            label="Base URL (Optional)"
            value={formData.baseUrl}
            onChange={e => setFormData({ ...formData, baseUrl: e.target.value })}
            placeholder={getProviderTemplate(formData.provider).baseUrl}
          />

          <Input
            label="Description (Optional)"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            placeholder="A brief description of this preset"
          />
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button
            variant="secondary"
            onClick={() => {
              setIsEditModalOpen(false);
              setEditingPreset(null);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdatePreset}>
            Update Preset
          </Button>
        </div>
      </Modal>
    </Card>
  );
};
