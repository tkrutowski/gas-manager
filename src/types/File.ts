import type { User } from './User';
import type { TaskType } from './TaskType';

/**
 * Typ pliku (rozszerzenie)
 */
export type FileType =
  | 'PDF'
  | 'DOCX'
  | 'DOC'
  | 'XLSX'
  | 'XLS'
  | 'JPG'
  | 'JPEG'
  | 'PNG'
  | 'DWG'
  | 'DWF'
  | 'ZIP'
  | 'RAR'
  | 'TXT'
  | 'OTHER';

/**
 * Kategoria plików przypisanych do elementów
 */
export type FileCategory = 'PERMITS_DECISIONS' | 'TECHNICAL_PROJECT' | 'ACCEPTANCE_PROTOCOLS';

/**
 * Podstawowy interfejs pliku
 */
export interface File {
  id: number;
  idTask: number;
  taskType: TaskType;
  name: string;
  type: FileType;
  size: number; // w bajtach
  uploadDate: Date;
  uploadedBy: User;
  description?: string;
  fileUrl?: string;
}

/**
 * Plik przypisany do kategorii (rozszerzenie File)
 */
export interface CategorizedFile extends File {
  category: FileCategory;
}

/**
 * Mapowanie kategorii na nazwy wyświetlane
 */
export const FileCategoryLabels: Record<FileCategory, string> = {
  PERMITS_DECISIONS: 'Pozwolenia i Decyzje',
  TECHNICAL_PROJECT: 'Projekt Techniczny',
  ACCEPTANCE_PROTOCOLS: 'Protokoły Odbioru',
};

/**
 * Mapowanie kategorii na ikony (nazwy ikon Heroicons)
 */
export const FileCategoryIcons: Record<FileCategory, string> = {
  PERMITS_DECISIONS: 'BoltIcon',
  TECHNICAL_PROJECT: 'CircleStackIcon',
  ACCEPTANCE_PROTOCOLS: 'ClipboardDocumentCheckIcon',
};
