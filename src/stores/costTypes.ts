import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import type { CostType } from '../types/GasConnection';

// Klucz localStorage dla typów kosztów
const STORAGE_KEY = 'gas-manager:costTypes';

// Domyślne typy kosztów
const DEFAULT_COST_TYPES: CostType[] = [
  { id: 1, name: 'geodezja' },
  { id: 2, name: 'piasek' },
  { id: 3, name: 'proj org ruchu' },
  { id: 4, name: 'zajęcie pasa' },
  { id: 5, name: 'paliwo' },
  { id: 6, name: 'dieta pracownicza' },
  { id: 7, name: 'posiłki' },
  { id: 8, name: 'naprawy' },
  { id: 9, name: 'materiał główny' },
  { id: 10, name: 'Nocleg' },
  { id: 11, name: 'przecisk' },
  { id: 12, name: 'Projekt' },
  { id: 13, name: 'Mapa do celów projektowych' },
  { id: 14, name: 'Inwentaryzacja geodezyjna' },
  { id: 15, name: 'wynajem maszyn' },
  { id: 16, name: 'robocizna' },
  { id: 17, name: 'odtworzenie nawierzchni' },
  { id: 18, name: 'materiały naprawcze' },
  { id: 19, name: 'nadzór' },
  { id: 20, name: 'transport' },
  { id: 22, name: 'podwykonawstwo' },
  { id: 23, name: 'inne' },
  { id: 24, name: 'Kara umowna' },
  { id: 25, name: 'ZUD' },
  { id: 26, name: 'badania geotechniczne' },
  { id: 27, name: 'projekt odtw nawierzchni' },
  { id: 28, name: 'nadzór archeologiczny' },
  { id: 29, name: 'Przewiert' },
  { id: 30, name: 'Uzgodnienia' },
  { id: 31, name: 'WC' },
];

// Funkcja pomocnicza do ładowania danych z localStorage
function loadFromLocalStorage(): CostType[] | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : null;
  } catch (err) {
    console.warn('Błąd podczas ładowania typów kosztów z localStorage:', err);
    return null;
  }
}

// Funkcja pomocnicza do zapisywania danych do localStorage
function saveToLocalStorage(data: CostType[]): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Błąd podczas zapisywania typów kosztów do localStorage:', err);
  }
}

// Inicjalizacja danych
function initializeData(): CostType[] {
  const stored = loadFromLocalStorage();
  if (stored && stored.length > 0) {
    return stored;
  }
  // Jeśli nie ma danych w localStorage, zapisz domyślne
  saveToLocalStorage(DEFAULT_COST_TYPES);
  return DEFAULT_COST_TYPES;
}

export const useCostTypesStore = defineStore('costTypes', () => {
  const costTypes = ref<CostType[]>(initializeData());

  // Pobierz wszystkie typy kosztów
  const getAllCostTypes = (): CostType[] => {
    return costTypes.value;
  };

  // Dodaj nowy typ kosztu
  const addCostType = (name: string): CostType => {
    // Sprawdź, czy typ o tej nazwie już istnieje
    const existing = costTypes.value.find(ct => ct.name.toLowerCase() === name.trim().toLowerCase());
    if (existing) {
      throw new Error('Typ kosztu o tej nazwie już istnieje');
    }

    // Znajdź maksymalne ID
    const maxId = Math.max(...costTypes.value.map(ct => ct.id), 0);
    const newCostType: CostType = {
      id: maxId + 1,
      name: name.trim(),
    };

    costTypes.value.push(newCostType);
    saveToLocalStorage(costTypes.value);
    return newCostType;
  };

  // Pobierz typ kosztu po ID (dla generowania danych)
  const getCostTypeById = (id: number): CostType | undefined => {
    return costTypes.value.find(ct => ct.id === id);
  };

  // Pobierz losowy typ kosztu (dla generowania danych)
  const getRandomCostType = (): CostType => {
    const types = costTypes.value;
    return types[Math.floor(Math.random() * types.length)];
  };

  return {
    costTypes,
    getAllCostTypes,
    addCostType,
    getCostTypeById,
    getRandomCostType,
  };
});
