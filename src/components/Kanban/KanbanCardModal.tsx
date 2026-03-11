/**
 * KanbanCardModal Component
 * Full-screen modal for editing Kanban card details
 */

import { useState, useEffect, useRef } from 'react';
import { X, Calendar, Tag, Flag, CheckSquare, Paperclip, Image as ImageIcon, Trash2, Plus, Download, Upload } from 'lucide-react';
import { generateId } from '../../utils/uuid';
import { useKanbanCardStore } from '../../store/kanbanStore';
import type { KanbanCard, KanbanPriority, ChecklistItem, Attachment } from '../../types';

interface KanbanCardModalProps {
  card: KanbanCard;
  isOpen: boolean;
  onClose: () => void;
}

const PRIORITY_OPTIONS: { value: KanbanPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Basse', color: 'bg-gray-100 text-gray-700 dark:bg-[#252B32] dark:text-[#B1B9C4]' },
  { value: 'medium', label: 'Moyenne', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  { value: 'high', label: 'Haute', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
  { value: 'urgent', label: 'Urgente', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' }
];

// Checklist Item Component
function ChecklistItemRow({
  item,
  onToggle,
  onDelete,
  onUpdate
}: {
  item: ChecklistItem;
  onToggle: () => void;
  onDelete: () => void;
  onUpdate: (text: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);

  const handleSave = () => {
    if (editText.trim()) {
      onUpdate(editText.trim());
      setIsEditing(false);
    }
  };

  return (
    <div className="flex items-center gap-2 group">
      <input
        type="checkbox"
        checked={item.completed}
        onChange={onToggle}
        className="w-4 h-4 rounded border-gray-300 dark:border-[#3D444D] text-primary-600 focus:ring-primary-500"
      />
      {isEditing ? (
        <input
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') {
              setIsEditing(false);
              setEditText(item.text);
            }
          }}
          onBlur={handleSave}
          className="flex-1 px-2 py-1 text-sm border border-primary-500 rounded bg-white dark:bg-[#252B32] text-gray-900 dark:text-[#E0E6ED] focus:outline-none"
          autoFocus
        />
      ) : (
        <span
          onClick={() => setIsEditing(true)}
          className={`flex-1 text-sm cursor-pointer ${
            item.completed
              ? 'line-through text-gray-500 dark:text-[#B1B9C4]'
              : 'text-gray-900 dark:text-[#E0E6ED]'
          }`}
        >
          {item.text}
        </span>
      )}
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
      >
        <Trash2 className="w-3 h-3 text-gray-500 dark:text-[#B1B9C4] hover:text-red-600 dark:hover:text-red-400" />
      </button>
    </div>
  );
}

export default function KanbanCardModal({ card, isOpen, onClose }: KanbanCardModalProps) {
  // Actions accessed via getState() since they're only used in event handlers

  // Local state for editing
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [priority, setPriority] = useState<KanbanPriority>(card.priority);
  const [tags, setTags] = useState<string[]>(card.tags);
  const [newTag, setNewTag] = useState('');
  const [startDate, setStartDate] = useState(card.startDate ? new Date(card.startDate).toISOString().slice(0, 10) : '');
  const [dueDate, setDueDate] = useState(card.dueDate ? new Date(card.dueDate).toISOString().slice(0, 10) : '');
  const [checklist, setChecklist] = useState<ChecklistItem[]>(card.checklist);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>(card.attachments);
  const [coverImage, setCoverImage] = useState(card.coverImage || '');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);

  // Update local state when card changes
  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description);
      setPriority(card.priority);
      setTags(card.tags);
      setStartDate(card.startDate ? new Date(card.startDate).toISOString().slice(0, 10) : '');
      setDueDate(card.dueDate ? new Date(card.dueDate).toISOString().slice(0, 10) : '');
      setChecklist(card.checklist);
      setAttachments(card.attachments);
      setCoverImage(card.coverImage || '');
    }
  }, [card]);

  if (!isOpen) return null;

  const handleSave = async () => {
    await useKanbanCardStore.getState().updateCard(card.id, {
      title,
      description,
      priority,
      tags,
      startDate: startDate ? new Date(startDate) : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      checklist,
      attachments,
      coverImage
    });
    onClose();
  };

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette carte ?')) {
      await useKanbanCardStore.getState().deleteCard(card.id);
      onClose();
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // Checklist handlers
  const handleAddChecklistItem = () => {
    if (newChecklistItem.trim()) {
      const newItem: ChecklistItem = {
        id: generateId(),
        text: newChecklistItem.trim(),
        completed: false
      };
      setChecklist([...checklist, newItem]);
      setNewChecklistItem('');
    }
  };

  const handleToggleChecklistItem = (itemId: string) => {
    setChecklist(checklist.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    ));
  };

  const handleDeleteChecklistItem = (itemId: string) => {
    setChecklist(checklist.filter(item => item.id !== itemId));
  };

  const handleUpdateChecklistItem = (itemId: string, newText: string) => {
    setChecklist(checklist.map(item =>
      item.id === itemId ? { ...item, text: newText } : item
    ));
  };

  // Attachment handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      // In a real app, upload to server/storage
      // For now, create a mock attachment with blob URL
      const newAttachment: Attachment = {
        id: generateId(),
        name: file.name,
        url: URL.createObjectURL(file),
        size: file.size,
        type: file.type,
        uploadedAt: new Date()
      };
      setAttachments([...attachments, newAttachment]);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    setAttachments(attachments.filter(a => a.id !== attachmentId));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Cover image handlers
  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // In a real app, upload to server/storage
    // For now, use blob URL
    const imageUrl = URL.createObjectURL(file);
    setCoverImage(imageUrl);

    // Reset input
    if (coverImageInputRef.current) {
      coverImageInputRef.current.value = '';
    }
  };

  const handleRemoveCoverImage = () => {
    setCoverImage('');
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1E252B] rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-[#1E252B] border-b border-gray-200 dark:border-[#30363D] p-6 flex items-center justify-between z-10">
          <div className="flex-1">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-2xl font-bold bg-transparent border-none focus:outline-none text-gray-900 dark:text-[#E0E6ED]"
              placeholder="Titre de la carte"
            />
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#252B32] rounded-lg transition-colors ml-4"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-[#B1B9C4]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-[#B1B9C4] mb-2">
              <CheckSquare className="w-4 h-4" />
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ajouter une description..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-[#3D444D] bg-white dark:bg-[#252B32] text-gray-900 dark:text-[#E0E6ED] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              rows={6}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-[#B1B9C4] mb-2">
              <Tag className="w-4 h-4" />
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-[#252B32] text-gray-700 dark:text-[#B1B9C4] rounded-full text-sm"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-600 dark:hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Nouveau tag..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-[#3D444D] bg-white dark:bg-[#252B32] text-gray-900 dark:text-[#E0E6ED] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={handleAddTag}
                className="px-4 py-2 bg-gray-100 dark:bg-[#252B32] text-gray-700 dark:text-[#B1B9C4] rounded-lg hover:bg-gray-200 dark:hover:bg-[#2C333A] transition-colors"
              >
                Ajouter
              </button>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-[#B1B9C4] mb-2">
              <Flag className="w-4 h-4" />
              Priorité
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRIORITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPriority(option.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    priority === option.value
                      ? `${option.color} ring-2 ring-primary-500`
                      : `${option.color} opacity-50 hover:opacity-100`
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Start Date */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-[#B1B9C4] mb-2">
                <Calendar className="w-4 h-4" />
                Date de début
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#3D444D] bg-white dark:bg-[#252B32] text-gray-900 dark:text-[#E0E6ED] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-[#B1B9C4] mb-2">
                <Calendar className="w-4 h-4" />
                Date d'échéance
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#3D444D] bg-white dark:bg-[#252B32] text-gray-900 dark:text-[#E0E6ED] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Checklist */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-[#B1B9C4] mb-2">
              <CheckSquare className="w-4 h-4" />
              Checklist
              {checklist.length > 0 && (
                <span className="text-xs font-normal text-gray-500 dark:text-[#B1B9C4]">
                  ({checklist.filter(item => item.completed).length}/{checklist.length})
                </span>
              )}
            </label>

            {/* Checklist items */}
            <div className="space-y-2 mb-2">
              {checklist.map((item, _index) => (
                <ChecklistItemRow
                  key={item.id}
                  item={item}
                  onToggle={() => handleToggleChecklistItem(item.id)}
                  onDelete={() => handleDeleteChecklistItem(item.id)}
                  onUpdate={(newText) => handleUpdateChecklistItem(item.id, newText)}
                />
              ))}
            </div>

            {/* Add new item */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                placeholder="Ajouter un élément..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-[#3D444D] bg-white dark:bg-[#252B32] text-gray-900 dark:text-[#E0E6ED] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={handleAddChecklistItem}
                className="px-4 py-2 bg-gray-100 dark:bg-[#252B32] text-gray-700 dark:text-[#B1B9C4] rounded-lg hover:bg-gray-200 dark:hover:bg-[#2C333A] transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Attachments */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-[#B1B9C4] mb-2">
              <Paperclip className="w-4 h-4" />
              Pièces jointes
              {attachments.length > 0 && (
                <span className="text-xs font-normal text-gray-500 dark:text-[#B1B9C4]">
                  ({attachments.length})
                </span>
              )}
            </label>

            {/* Attachments list */}
            {attachments.length > 0 && (
              <div className="space-y-2 mb-2">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-[#252B32]/50 rounded border border-gray-200 dark:border-[#3D444D] group"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Paperclip className="w-4 h-4 text-gray-500 dark:text-[#B1B9C4] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-[#E0E6ED] truncate">
                          {attachment.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-[#B1B9C4]">
                          {formatFileSize(attachment.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <a
                        href={attachment.url}
                        download={attachment.name}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-[#2C333A] rounded transition-colors"
                        title="Télécharger"
                      >
                        <Download className="w-4 h-4 text-gray-600 dark:text-[#B1B9C4]" />
                      </a>
                      <button
                        onClick={() => handleDeleteAttachment(attachment.id)}
                        className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4 text-gray-500 dark:text-[#B1B9C4] hover:text-red-600 dark:hover:text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload button */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-[#252B32] text-gray-700 dark:text-[#B1B9C4] rounded-lg hover:bg-gray-200 dark:hover:bg-[#2C333A] transition-colors"
            >
              <Upload className="w-4 h-4" />
              Ajouter un fichier
            </button>
          </div>

          {/* Cover Image */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-[#B1B9C4] mb-2">
              <ImageIcon className="w-4 h-4" />
              Image de couverture
            </label>

            {coverImage ? (
              <div className="relative group">
                <img
                  src={coverImage}
                  alt="Cover"
                  className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-[#3D444D]"
                />
                <button
                  onClick={handleRemoveCoverImage}
                  className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <input
                  ref={coverImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => coverImageInputRef.current?.click()}
                  className="w-full h-32 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-[#3D444D] rounded-lg hover:border-primary-400 dark:hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-[#252B32]/50 transition-colors"
                >
                  <ImageIcon className="w-8 h-8 text-gray-400 dark:text-[#6B7280]" />
                  <span className="text-sm text-gray-600 dark:text-[#B1B9C4]">
                    Cliquer pour ajouter une image
                  </span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-[#1E252B] border-t border-gray-200 dark:border-[#30363D] p-6 flex items-center justify-between">
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer la carte
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-[#B1B9C4] hover:bg-gray-100 dark:hover:bg-[#252B32] rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-500 transition-colors"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
