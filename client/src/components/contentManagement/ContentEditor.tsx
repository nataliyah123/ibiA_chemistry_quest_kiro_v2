import React, { useState, useEffect } from 'react';
import { ContentTemplate, ContentCreationRequest, ContentVersion, TemplateField } from '../../types/contentManagement';
import { contentManagementApi } from '../../services/contentManagementApi';
import { RichTextEditor } from './RichTextEditor';
import { CurriculumMappingForm } from './CurriculumMappingForm';
import './ContentEditor.css';

interface ContentEditorProps {
  templates: ContentTemplate[];
  onContentCreated: (content: ContentVersion) => void;
  editingContent?: ContentVersion;
  onContentUpdated?: (content: ContentVersion) => void;
}

export const ContentEditor: React.FC<ContentEditorProps> = ({
  templates,
  onContentCreated,
  editingContent,
  onContentUpdated
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [curriculumMappings, setCurriculumMappings] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [changeLog, setChangeLog] = useState('');

  useEffect(() => {
    if (editingContent) {
      // Load existing content for editing
      const template = templates.find(t => t.id === editingContent.data.templateId);
      setSelectedTemplate(template || null);
      setTitle(editingContent.data.title || '');
      setDescription(editingContent.data.description || '');
      setTags(editingContent.data.tags || []);
      setFormData(editingContent.data);
      loadCurriculumMappings(editingContent.contentId);
    }
  }, [editingContent, templates]);

  const loadCurriculumMappings = async (contentId: string) => {
    try {
      const mappings = await contentManagementApi.getCurriculumMappings(contentId);
      setCurriculumMappings(mappings);
    } catch (error) {
      console.error('Failed to load curriculum mappings:', error);
    }
  };

  const handleTemplateSelect = (template: ContentTemplate) => {
    setSelectedTemplate(template);
    setFormData({});
    setErrors({});
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));

    // Clear error for this field
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!selectedTemplate) {
      newErrors.template = 'Please select a template';
      setErrors(newErrors);
      return false;
    }

    // Validate template fields
    selectedTemplate.structure.forEach(field => {
      if (field.required && (!formData[field.id] || formData[field.id] === '')) {
        newErrors[field.id] = `${field.name} is required`;
      }

      if (field.validation && formData[field.id]) {
        const value = formData[field.id];
        const validation = field.validation;

        if (field.type === 'text' || field.type === 'rich_text') {
          if (validation.minLength && value.length < validation.minLength) {
            newErrors[field.id] = `${field.name} must be at least ${validation.minLength} characters`;
          }
          if (validation.maxLength && value.length > validation.maxLength) {
            newErrors[field.id] = `${field.name} must not exceed ${validation.maxLength} characters`;
          }
          if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
            newErrors[field.id] = `${field.name} format is invalid`;
          }
        }

        if (field.type === 'number') {
          const numValue = parseFloat(value);
          if (validation.min !== undefined && numValue < validation.min) {
            newErrors[field.id] = `${field.name} must be at least ${validation.min}`;
          }
          if (validation.max !== undefined && numValue > validation.max) {
            newErrors[field.id] = `${field.name} must not exceed ${validation.max}`;
          }
        }
      }
    });

    if (editingContent && !changeLog.trim()) {
      newErrors.changeLog = 'Change log is required for updates';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      if (editingContent) {
        // Update existing content
        const updateRequest = {
          title,
          description,
          data: formData,
          curriculumMappings,
          tags,
          changeLog
        };

        const updatedContent = await contentManagementApi.updateContent(
          editingContent.contentId,
          updateRequest
        );

        onContentUpdated?.(updatedContent);
      } else {
        // Create new content
        const createRequest: ContentCreationRequest = {
          templateId: selectedTemplate!.id,
          title,
          description,
          data: formData,
          curriculumMappings,
          tags
        };

        const newContent = await contentManagementApi.createContent(createRequest);
        onContentCreated(newContent);
      }

      // Reset form
      setSelectedTemplate(null);
      setFormData({});
      setTitle('');
      setDescription('');
      setTags([]);
      setCurriculumMappings([]);
      setChangeLog('');
      setErrors({});
    } catch (error) {
      console.error('Failed to save content:', error);
      setErrors({ submit: 'Failed to save content. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field: TemplateField) => {
    const value = formData[field.id] || '';
    const hasError = !!errors[field.id];

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={hasError ? 'error' : ''}
            placeholder={`Enter ${field.name.toLowerCase()}`}
          />
        );

      case 'rich_text':
        return (
          <RichTextEditor
            value={value}
            onChange={(content) => handleFieldChange(field.id, content)}
            placeholder={`Enter ${field.name.toLowerCase()}`}
            className={hasError ? 'error' : ''}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.id, parseFloat(e.target.value) || 0)}
            className={hasError ? 'error' : ''}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={hasError ? 'error' : ''}
          >
            <option value="">Select {field.name.toLowerCase()}</option>
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'multi_select':
        return (
          <div className="multi-select">
            {field.options?.map(option => (
              <label key={option} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(option)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      handleFieldChange(field.id, [...currentValues, option]);
                    } else {
                      handleFieldChange(field.id, currentValues.filter(v => v !== option));
                    }
                  }}
                />
                {option}
              </label>
            ))}
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={hasError ? 'error' : ''}
          />
        );
    }
  };

  return (
    <div className="content-editor">
      <h2>{editingContent ? 'Edit Content' : 'Create New Content'}</h2>

      <form onSubmit={handleSubmit} className="editor-form">
        {!editingContent && (
          <div className="form-section">
            <h3>Select Template</h3>
            <div className="template-grid">
              {templates.map(template => (
                <div
                  key={template.id}
                  className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <h4>{template.name}</h4>
                  <p>{template.description}</p>
                  <span className="template-type">{template.type}</span>
                </div>
              ))}
            </div>
            {errors.template && <div className="error-message">{errors.template}</div>}
          </div>
        )}

        {selectedTemplate && (
          <>
            <div className="form-section">
              <h3>Basic Information</h3>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={errors.title ? 'error' : ''}
                  placeholder="Enter content title"
                />
                {errors.title && <div className="error-message">{errors.title}</div>}
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={errors.description ? 'error' : ''}
                  placeholder="Enter content description"
                  rows={3}
                />
                {errors.description && <div className="error-message">{errors.description}</div>}
              </div>

              <div className="form-group">
                <label>Tags</label>
                <input
                  type="text"
                  value={tags.join(', ')}
                  onChange={(e) => setTags(e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
                  placeholder="Enter tags separated by commas"
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Content Fields</h3>
              {selectedTemplate.structure.map(field => (
                <div key={field.id} className="form-group">
                  <label>
                    {field.name}
                    {field.required && <span className="required">*</span>}
                  </label>
                  {renderField(field)}
                  {errors[field.id] && <div className="error-message">{errors[field.id]}</div>}
                </div>
              ))}
            </div>

            <div className="form-section">
              <h3>Curriculum Mapping</h3>
              <CurriculumMappingForm
                mappings={curriculumMappings}
                onChange={setCurriculumMappings}
              />
            </div>

            {editingContent && (
              <div className="form-section">
                <h3>Change Log</h3>
                <div className="form-group">
                  <label>Describe your changes *</label>
                  <textarea
                    value={changeLog}
                    onChange={(e) => setChangeLog(e.target.value)}
                    className={errors.changeLog ? 'error' : ''}
                    placeholder="Describe what changes you made and why"
                    rows={3}
                  />
                  {errors.changeLog && <div className="error-message">{errors.changeLog}</div>}
                </div>
              </div>
            )}

            {errors.submit && <div className="error-message">{errors.submit}</div>}

            <div className="form-actions">
              <button
                type="submit"
                disabled={saving}
                className="save-button"
              >
                {saving ? 'Saving...' : (editingContent ? 'Update Content' : 'Create Content')}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
};