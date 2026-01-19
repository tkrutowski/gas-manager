import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import type { File, CategorizedFile, FileType, FileCategory } from '../types/File';
import type { TaskType } from '../types/TaskType';
import type { User } from '../types/User';

// Klucz localStorage dla plików
const STORAGE_KEY = 'gas-manager:files';

// Funkcja pomocnicza do generowania daty w przeszłości
function randomPastDate(daysAgo: number = 365): Date {
  return new Date(Date.now() - Math.random() * daysAgo * 24 * 60 * 60 * 1000);
}

// Funkcja pomocnicza do generowania losowego TaskType
function generateTaskType(): TaskType {
  const types: TaskType[] = [
    { name: 'GAS_CONNECTION', viewName: 'przylacze' },
    { name: 'GAS_PIPELINE', viewName: 'gazociag' },
    { name: 'GAS_INTERNAL', viewName: 'wewnetrzna' },
  ];
  return types[Math.floor(Math.random() * types.length)];
}

// Mockowani użytkownicy
const mockUsers: User[] = [
  {
    id: 1,
    login: 'jkowalski',
    email: 'jan.kowalski@example.com',
    name: 'Jan Kowalski',
    firstName: 'Jan',
    lastName: 'Kowalski',
    role: 'Projektant',
    isActive: true,
  },
  {
    id: 2,
    login: 'anowak',
    email: 'anna.nowak@example.com',
    name: 'Anna Nowak',
    firstName: 'Anna',
    lastName: 'Nowak',
    role: 'Koordynator',
    isActive: true,
  },
  {
    id: 3,
    login: 'mzajac',
    email: 'marek.zajac@example.com',
    name: 'Marek Zając',
    firstName: 'Marek',
    lastName: 'Zając',
    role: 'Geodeta',
    isActive: true,
  },
  {
    id: 4,
    login: 'pnowak',
    email: 'piotr.nowak@example.com',
    name: 'Piotr Nowak',
    firstName: 'Piotr',
    lastName: 'Nowak',
    role: 'Projektant',
    isActive: true,
  },
];

// Funkcja pomocnicza do generowania losowego użytkownika
function getRandomUser(): User {
  return mockUsers[Math.floor(Math.random() * mockUsers.length)];
}

// Funkcja pomocnicza do formatowania rozmiaru pliku
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Funkcja pomocnicza do generowania losowego typu pliku
function getRandomFileType(): FileType {
  const types: FileType[] = ['PDF', 'DOCX', 'JPG', 'PNG', 'DWG', 'XLSX', 'ZIP'];
  return types[Math.floor(Math.random() * types.length)];
}

// Funkcja pomocnicza do generowania nazwy pliku
function generateFileName(type: FileType, index: number): string {
  const prefixes: Record<FileType, string[]> = {
    PDF: ['Mapa_zasadnicza', 'Specyfikacja_Techniczna', 'Decyzja_WZ', 'Zgoda_Właściciela_Grunt', 'Protokół_Odbioru'],
    DOCX: ['Specyfikacja_Techniczna', 'Raport', 'Sprawozdanie', 'Notatka_Serwisowa'],
    JPG: ['Foto_Wykop', 'Zdjęcie_Stanu', 'Foto_Instalacji', 'Dokumentacja_Fotograficzna'],
    PNG: ['Schemat', 'Rysunek', 'Wykres'],
    DWG: ['Rzut_piwnic', 'Schemat_aksonometryczny', 'Plan_Sytuacyjny'],
    XLSX: ['Kalkulacja', 'Tabela_Kosztów', 'Wykaz_Materiałów'],
    ZIP: ['Archiwum', 'Backup', 'Kopia_Zapasowa'],
    DOC: [],
    JPEG: [],
    DWF: [],
    RAR: [],
    TXT: [],
    OTHER: [],
  };

  const names = prefixes[type] || ['Plik'];
  const baseName = names[Math.floor(Math.random() * names.length)];
  const version = index > 0 ? `_v${index + 1}` : '';
  return `${baseName}${version}.${type.toLowerCase()}`;
}

// Funkcja pomocnicza do generowania losowego rozmiaru pliku (w bajtach)
function generateFileSize(type: FileType): number {
  const sizeRanges: Record<FileType, [number, number]> = {
    PDF: [500000, 5000000], // 0.5 - 5 MB
    DOCX: [100000, 2000000], // 0.1 - 2 MB
    JPG: [500000, 5000000], // 0.5 - 5 MB
    PNG: [200000, 3000000], // 0.2 - 3 MB
    DWG: [1000000, 20000000], // 1 - 20 MB
    XLSX: [50000, 1000000], // 0.05 - 1 MB
    ZIP: [1000000, 10000000], // 1 - 10 MB
    DOC: [100000, 2000000],
    JPEG: [500000, 5000000],
    DWF: [500000, 5000000],
    RAR: [1000000, 10000000],
    TXT: [1000, 100000],
    OTHER: [100000, 2000000],
  };

  const [min, max] = sizeRanges[type] || [100000, 2000000];
  return Math.floor(Math.random() * (max - min) + min);
}

// Funkcja pomocnicza do generowania opisu pliku
function generateDescription(type: FileType, name: string): string {
  const descriptions: Record<FileType, string[]> = {
    PDF: [
      'Zaktualizowany podkład geodezyjny',
      'Pełna specyfikacja materiałowa dla realizacji',
      'Dokumentacja techniczna projektu',
      'Mapa sytuacyjna z naniesionymi zmianami',
    ],
    DOCX: [
      'Pełna specyfikacja materiałowa dla realizacji',
      'Raport z postępów prac',
      'Sprawozdanie techniczne',
      'Notatka serwisowa z wizytacji',
    ],
    JPG: [
      'Dokumentacja fotograficzna stanu zerowego',
      'Zdjęcia wykonanych prac',
      'Fotografie instalacji gazowej',
      'Dokumentacja wizualna terenu',
    ],
    PNG: [
      'Schemat techniczny instalacji',
      'Rysunek poglądowy',
      'Wykres zależności',
    ],
    DWG: [
      'Rysunek techniczny w formacie CAD',
      'Plan sytuacyjny z warstwami',
      'Schemat instalacji gazowej',
    ],
    XLSX: [
      'Kalkulacja kosztów materiałów',
      'Tabela z wykazem elementów',
      'Wykaz materiałów i ilości',
    ],
    ZIP: [
      'Archiwum z dokumentacją',
      'Kopia zapasowa plików',
      'Komplet dokumentów projektu',
    ],
    DOC: [],
    JPEG: [],
    DWF: [],
    RAR: [],
    TXT: [],
    OTHER: [],
  };

  const descs = descriptions[type] || ['Plik dokumentacyjny'];
  return descs[Math.floor(Math.random() * descs.length)];
}

// Funkcja pomocnicza do ładowania danych z localStorage
function loadFromLocalStorage(): { generalFiles: File[]; categorizedFiles: CategorizedFile[] } | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }
    const parsed = JSON.parse(stored);
    // Konwersja dat z stringów na obiekty Date
    if (parsed.generalFiles) {
      parsed.generalFiles = parsed.generalFiles.map((f: any) => ({
        ...f,
        uploadDate: new Date(f.uploadDate),
      }));
    }
    if (parsed.categorizedFiles) {
      parsed.categorizedFiles = parsed.categorizedFiles.map((f: any) => ({
        ...f,
        uploadDate: new Date(f.uploadDate),
      }));
    }
    return parsed;
  } catch (err) {
    console.warn('Błąd podczas ładowania plików z localStorage:', err);
    return null;
  }
}

// Funkcja pomocnicza do zapisywania danych do localStorage
function saveToLocalStorage(data: { generalFiles: File[]; categorizedFiles: CategorizedFile[] }): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Błąd podczas zapisywania plików do localStorage:', err);
  }
}

// Generowanie mockowanych plików ogólnych
function generateMockGeneralFiles(idTask: number, taskType: TaskType): File[] {
  const files: File[] = [];
  const fileCount = Math.floor(Math.random() * 5) + 3; // 3-7 plików

  for (let i = 0; i < fileCount; i++) {
    const type = getRandomFileType();
    const fileName = generateFileName(type, i);
    const size = generateFileSize(type);
    const uploadDate = randomPastDate(90);
    const uploadedBy = getRandomUser();
    const description = generateDescription(type, fileName);

    files.push({
      id: Date.now() + i,
      idTask,
      taskType,
      name: fileName,
      type,
      size,
      uploadDate,
      uploadedBy,
      description,
      fileUrl: `https://example.com/files/${fileName}`,
    });
  }

  return files;
}

// Generowanie mockowanych plików przypisanych do kategorii
function generateMockCategorizedFiles(idTask: number, taskType: TaskType): CategorizedFile[] {
  const files: CategorizedFile[] = [];
  const categories: FileCategory[] = ['PERMITS_DECISIONS', 'TECHNICAL_PROJECT', 'ACCEPTANCE_PROTOCOLS'];

  categories.forEach(category => {
    const fileCount = Math.floor(Math.random() * 3) + (category === 'PERMITS_DECISIONS' ? 1 : 0); // 1-3 pliki

    for (let i = 0; i < fileCount; i++) {
      let type: FileType;
      let fileName: string;

      // Specyficzne typy plików dla kategorii
      if (category === 'PERMITS_DECISIONS') {
        type = 'PDF';
        const names = ['Decyzja_WZ', 'Zgoda_Właściciela_Grunt', 'Pozwolenie_Budowlane'];
        fileName = `${names[Math.floor(Math.random() * names.length)]}_${Math.floor(Math.random() * 9999)}.pdf`;
      } else if (category === 'TECHNICAL_PROJECT') {
        type = Math.random() > 0.5 ? 'DWG' : 'PDF';
        const names = type === 'DWG' ? ['Rzut_piwnic', 'Schemat_aksonometryczny'] : ['Schemat_aksonometryczny'];
        fileName = `${names[Math.floor(Math.random() * names.length)]}_V${Math.floor(Math.random() * 5) + 1}.${type.toLowerCase()}`;
      } else {
        type = 'PDF';
        fileName = `Protokół_Odbioru_${Math.floor(Math.random() * 999)}.pdf`;
      }

      const size = generateFileSize(type);
      const uploadDate = randomPastDate(30);
      const uploadedBy = getRandomUser();

      files.push({
        id: Date.now() + Math.random() * 10000 + i,
        idTask,
        taskType,
        name: fileName,
        type,
        size,
        uploadDate,
        uploadedBy,
        category,
        fileUrl: `https://example.com/files/${fileName}`,
      });
    }
  });

  return files;
}

export const useFilesStore = defineStore('files', () => {
  // Ładowanie danych z localStorage lub generowanie nowych
  const loadedData = loadFromLocalStorage();
  const initialGeneralFiles = loadedData?.generalFiles ?? [];
  const initialCategorizedFiles = loadedData?.categorizedFiles ?? [];

  const generalFiles = ref<File[]>(initialGeneralFiles);
  const categorizedFiles = ref<CategorizedFile[]>(initialCategorizedFiles);

  // Zapisanie wygenerowanych danych do localStorage jeśli nie były tam wcześniej
  if (!loadedData) {
    saveToLocalStorage({
      generalFiles: generalFiles.value,
      categorizedFiles: categorizedFiles.value,
    });
  }

  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Pobiera pliki ogólne dla zadania
   */
  function getGeneralFiles(idTask: number, taskType?: TaskType): File[] {
    loading.value = true;
    error.value = null;

    try {
      let files = generalFiles.value.filter(f => f.idTask === idTask);

      // Jeśli brak plików, generuj mockowane
      if (files.length === 0) {
        const defaultTaskType: TaskType = taskType || { name: 'GAS_CONNECTION', viewName: 'przylacze' };
        const mockFiles = generateMockGeneralFiles(idTask, defaultTaskType);
        files = mockFiles;
        generalFiles.value.push(...mockFiles);
        saveToLocalStorage({
          generalFiles: generalFiles.value,
          categorizedFiles: categorizedFiles.value,
        });
      }

      return files;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas pobierania plików ogólnych';
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * Pobiera pliki przypisane do kategorii dla zadania
   */
  function getCategorizedFiles(idTask: number, taskType?: TaskType, category?: FileCategory): CategorizedFile[] {
    loading.value = true;
    error.value = null;

    try {
      let files = categorizedFiles.value.filter(f => f.idTask === idTask);
      if (category) {
        files = files.filter(f => f.category === category);
      }

      // Jeśli brak plików, generuj mockowane
      if (files.length === 0 && !category) {
        const defaultTaskType: TaskType = taskType || { name: 'GAS_CONNECTION', viewName: 'przylacze' };
        const mockFiles = generateMockCategorizedFiles(idTask, defaultTaskType);
        files = mockFiles;
        categorizedFiles.value.push(...mockFiles);
        saveToLocalStorage({
          generalFiles: generalFiles.value,
          categorizedFiles: categorizedFiles.value,
        });
      }

      return files;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas pobierania plików przypisanych';
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * Dodaje plik ogólny
   */
  function addGeneralFile(idTask: number, taskType: TaskType, file: Omit<File, 'id' | 'idTask' | 'taskType'>): File {
    loading.value = true;
    error.value = null;

    try {
      const newId = Math.max(...generalFiles.value.map(f => f.id), 0) + 1;
      const newFile: File = {
        ...file,
        id: newId,
        idTask,
        taskType,
      };

      generalFiles.value.push(newFile);
      saveToLocalStorage({
        generalFiles: generalFiles.value,
        categorizedFiles: categorizedFiles.value,
      });
      return newFile;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas dodawania pliku ogólnego';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Dodaje plik do kategorii
   */
  function addCategorizedFile(
    idTask: number,
    taskType: TaskType,
    category: FileCategory,
    file: Omit<File, 'id' | 'idTask' | 'taskType'>
  ): CategorizedFile {
    loading.value = true;
    error.value = null;

    try {
      const newId = Math.max(...categorizedFiles.value.map(f => f.id), 0) + 1;
      const newFile: CategorizedFile = {
        ...file,
        id: newId,
        idTask,
        taskType,
        category,
      };

      categorizedFiles.value.push(newFile);
      saveToLocalStorage({
        generalFiles: generalFiles.value,
        categorizedFiles: categorizedFiles.value,
      });
      return newFile;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas dodawania pliku do kategorii';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Usuwa plik (ogólny lub przypisany)
   */
  function deleteFile(id: number): boolean {
    loading.value = true;
    error.value = null;

    try {
      // Usuń z plików ogólnych
      const generalIndex = generalFiles.value.findIndex(f => f.id === id);
      if (generalIndex !== -1) {
        generalFiles.value.splice(generalIndex, 1);
        saveToLocalStorage({
          generalFiles: generalFiles.value,
          categorizedFiles: categorizedFiles.value,
        });
        return true;
      }

      // Usuń z plików przypisanych
      const categorizedIndex = categorizedFiles.value.findIndex(f => f.id === id);
      if (categorizedIndex !== -1) {
        categorizedFiles.value.splice(categorizedIndex, 1);
        saveToLocalStorage({
          generalFiles: generalFiles.value,
          categorizedFiles: categorizedFiles.value,
        });
        return true;
      }

      error.value = 'Plik nie został znaleziony';
      return false;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas usuwania pliku';
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Wyszukuje pliki dla zadania
   */
  function searchFiles(idTask: number, query: string): { general: File[]; categorized: CategorizedFile[] } {
    if (!query.trim()) {
      return {
        general: getGeneralFiles(idTask),
        categorized: getCategorizedFiles(idTask),
      };
    }

    const lowerQuery = query.toLowerCase();
    const general = generalFiles.value.filter(
      f => f.idTask === idTask && (f.name.toLowerCase().includes(lowerQuery) || f.description?.toLowerCase().includes(lowerQuery))
    );
    const categorized = categorizedFiles.value.filter(
      f => f.idTask === idTask && (f.name.toLowerCase().includes(lowerQuery) || f.description?.toLowerCase().includes(lowerQuery))
    );

    return { general, categorized };
  }

  return {
    // State
    generalFiles,
    categorizedFiles,
    loading,
    error,
    // Methods
    getGeneralFiles,
    getCategorizedFiles,
    addGeneralFile,
    addCategorizedFile,
    deleteFile,
    searchFiles,
  };
});
