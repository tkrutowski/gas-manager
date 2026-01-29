import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import type { ScheduleTask } from '../types/ScheduleTask';
import type { TaskType } from '../types/TaskType';

// Klucz localStorage dla zadań terminarza
const STORAGE_KEY = 'gas-manager:scheduleTasks';

// Funkcja pomocnicza do ładowania danych z localStorage
function loadFromLocalStorage(): ScheduleTask[] | null {
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
    if (Array.isArray(parsed)) {
      return parsed.map(task => ({
        ...task,
        startDate: new Date(task.startDate),
        endDate: new Date(task.endDate),
      }));
    }
    return null;
  } catch (err) {
    console.warn('Błąd podczas ładowania zadań z localStorage:', err);
    return null;
  }
}

// Funkcja pomocnicza do zapisywania danych do localStorage
function saveToLocalStorage(data: ScheduleTask[]): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    // Konwersja dat na stringi przed zapisem
    const serialized = data.map(task => ({
      ...task,
      startDate: task.startDate.toISOString(),
      endDate: task.endDate.toISOString(),
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
  } catch (err) {
    console.warn('Błąd podczas zapisywania zadań do localStorage:', err);
  }
}

// Funkcja pomocnicza do generowania losowej daty w zakresie
function randomDateInRange(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
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

// Generowanie mockowanych zadań na styczeń i luty 2026
function generateMockScheduleTasks(): ScheduleTask[] {
  const tasks: ScheduleTask[] = [];
  const taskTitles = [
    'Budowa przyłącza',
    'Włączenie',
    'Czyszczenie',
    'Ustawienie próby',
    'Zdjęcie próby',
    'Kontrola instalacji',
    'Naprawa przyłącza',
    'Modernizacja',
  ];

  const brigades = [1, 2, 3];
  const months = [
    { month: 0, year: 2026, name: 'Styczeń' }, // styczeń 2026
    { month: 1, year: 2026, name: 'Luty' }, // luty 2026
  ];

  let taskId = 1;

  months.forEach(({ month, year }) => {
    brigades.forEach(brigadeId => {
      // Max 2 zadania na każdą brygadę w każdym miesiącu
      const tasksCount = Math.floor(Math.random() * 2) + 1; // 1-2 zadania

      for (let i = 0; i < tasksCount; i++) {
        // Losowa data w miesiącu
        const startDate = randomDateInRange(
          new Date(year, month, 1),
          new Date(year, month + 1, 0) // ostatni dzień miesiąca
        );

        // Losowa długość zadania: od kilku godzin do kilku dni
        const durationHours = Math.floor(Math.random() * 72) + 2; // 2-74 godziny
        const endDate = new Date(startDate.getTime() + durationHours * 60 * 60 * 1000);

        // Losowe współrzędne (Warszawa i okolice)
        const latitude = 52.2 + Math.random() * 0.3;
        const longitude = 21.0 + Math.random() * 0.3;

        const now = new Date().toISOString();

        tasks.push({
          id: taskId++,
          referenceId: Math.floor(Math.random() * 100) + 1, // Losowe ID przyłącza
          referenceType: generateTaskType(),
          brigadeId: brigadeId,
          title: taskTitles[Math.floor(Math.random() * taskTitles.length)],
          startDate: startDate,
          endDate: endDate,
          notes: `Notatki do zadania ${taskId - 1}. Zadanie wykonywane przez brygadę ${brigadeId} w ${months.find(m => m.month === month)?.name} ${year}.`,
          latitude: parseFloat(latitude.toFixed(6)),
          longitude: parseFloat(longitude.toFixed(6)),
          createdAt: now,
          updatedAt: now,
          createdBy: 'System',
          updatedBy: 'System',
        });
      }
    });
  });

  return tasks;
}

export const useScheduleTasksStore = defineStore('scheduleTasks', () => {
  // Ładowanie danych z localStorage lub generowanie nowych
  const loadedData = loadFromLocalStorage();
  const initialData = loadedData ?? generateMockScheduleTasks();
  const scheduleTasks = ref<ScheduleTask[]>(initialData);

  // Zapisanie wygenerowanych danych do localStorage jeśli nie były tam wcześniej
  if (!loadedData) {
    saveToLocalStorage(scheduleTasks.value);
  }

  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed properties
  const totalCount = computed(() => scheduleTasks.value.length);

  /**
   * Pobiera wszystkie zadania
   */
  function getAllTasks(): ScheduleTask[] {
    loading.value = true;
    error.value = null;

    try {
      return [...scheduleTasks.value];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas pobierania zadań';
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * Pobiera zadanie po ID
   */
  function getTask(id: number): ScheduleTask | undefined {
    loading.value = true;
    error.value = null;

    try {
      return scheduleTasks.value.find(t => t.id === id);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas pobierania zadania';
      return undefined;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Pobiera zadania dla danej brygady
   */
  function getTasksByBrigade(brigadeId: number): ScheduleTask[] {
    loading.value = true;
    error.value = null;

    try {
      return scheduleTasks.value.filter(t => t.brigadeId === brigadeId);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas pobierania zadań brygady';
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * Pobiera zadania w zakresie dat
   */
  function getTasksByDateRange(startDate: Date, endDate: Date): ScheduleTask[] {
    loading.value = true;
    error.value = null;

    try {
      return scheduleTasks.value.filter(task => {
        // Zadanie jest w zakresie jeśli jego okres przecina się z zakresem dat
        return task.startDate <= endDate && task.endDate >= startDate;
      });
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas pobierania zadań z zakresu dat';
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * Dodaje nowe zadanie
   */
  function addTask(task: Omit<ScheduleTask, 'id' | 'createdAt' | 'updatedAt'>): ScheduleTask {
    loading.value = true;
    error.value = null;

    try {
      const newId = Math.max(...scheduleTasks.value.map(t => t.id), 0) + 1;
      const now = new Date().toISOString();
      const newTask: ScheduleTask = {
        ...task,
        id: newId,
        createdAt: now,
        updatedAt: now,
      };

      scheduleTasks.value.push(newTask);
      saveToLocalStorage(scheduleTasks.value);
      return newTask;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas dodawania zadania';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Aktualizuje istniejące zadanie
   */
  function updateTask(id: number, updates: Partial<Omit<ScheduleTask, 'id' | 'createdAt'>>): ScheduleTask | null {
    loading.value = true;
    error.value = null;

    try {
      const index = scheduleTasks.value.findIndex(t => t.id === id);
      if (index === -1) {
        error.value = 'Zadanie nie zostało znalezione';
        return null;
      }

      scheduleTasks.value[index] = {
        ...scheduleTasks.value[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      saveToLocalStorage(scheduleTasks.value);
      return scheduleTasks.value[index];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas aktualizacji zadania';
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Usuwa zadanie
   */
  function deleteTask(id: number): boolean {
    loading.value = true;
    error.value = null;

    try {
      const index = scheduleTasks.value.findIndex(t => t.id === id);
      if (index === -1) {
        error.value = 'Zadanie nie zostało znalezione';
        return false;
      }

      scheduleTasks.value.splice(index, 1);
      saveToLocalStorage(scheduleTasks.value);
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas usuwania zadania';
      return false;
    } finally {
      loading.value = false;
    }
  }

  return {
    // State
    scheduleTasks,
    loading,
    error,
    // Computed
    totalCount,
    // Methods
    getAllTasks,
    getTask,
    getTasksByBrigade,
    getTasksByDateRange,
    addTask,
    updateTask,
    deleteTask,
  };
});
