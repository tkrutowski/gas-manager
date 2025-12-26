import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import type { Surveyor } from '../types/Surveyor';
import type { Address } from '../types/Address';

// Funkcja pomocnicza do generowania losowych adresów
function generateMockAddress(id: number): Address {
  const cities = [
    'Warszawa',
    'Kraków',
    'Gdańsk',
    'Wrocław',
    'Poznań',
    'Łódź',
    'Katowice',
    'Lublin',
    'Szczecin',
    'Bydgoszcz',
  ];
  const streets = [
    'ul. Główna',
    'ul. Słoneczna',
    'ul. Polna',
    'ul. Leśna',
    'ul. Kwiatowa',
    'ul. Parkowa',
    'ul. Ogrodowa',
    'ul. Spacerowa',
    'ul. Geodezyjna',
    'ul. Pomiarowa',
  ];
  const communes = ['Mokotów', 'Śródmieście', 'Praga', 'Żoliborz', 'Wola', 'Ochota', 'Bielany', 'Bemowo'];

  return {
    id: id,
    commune: communes[Math.floor(Math.random() * communes.length)],
    city: cities[Math.floor(Math.random() * cities.length)],
    street: `${streets[Math.floor(Math.random() * streets.length)]} ${Math.floor(Math.random() * 100) + 1}`,
    zip: `${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 900) + 100}`,
    coordinates: {
      id: id,
      latitude: (50 + Math.random() * 4).toFixed(6),
      longitude: (19 + Math.random() * 4).toFixed(6),
    },
  };
}

// Funkcja pomocnicza do generowania losowych numerów telefonów
function generatePhone(): string {
  return `+48 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 900) + 100}`;
}

// Funkcja pomocnicza do generowania losowych emaili
function generateEmail(firstName: string, lastName: string): string {
  const name = `${firstName}${lastName}`.toLowerCase().replace(/\s+/g, '');
  return `${name}@${['gmail.com', 'wp.pl', 'o2.pl', 'interia.pl', 'company.pl', 'survey.pl'][Math.floor(Math.random() * 6)]}`;
}

// Generowanie 25 mockowanych geodetów
function generateMockSurveyors(): Surveyor[] {
  const surveyors: Surveyor[] = [];
  const firstNames = [
    'Jan',
    'Anna',
    'Piotr',
    'Maria',
    'Krzysztof',
    'Katarzyna',
    'Tomasz',
    'Magdalena',
    'Paweł',
    'Agnieszka',
    'Marcin',
    'Joanna',
    'Michał',
    'Ewa',
    'Łukasz',
    'Monika',
    'Robert',
    'Barbara',
    'Andrzej',
    'Aleksandra',
    'Wojciech',
    'Natalia',
    'Jakub',
    'Karolina',
    'Mateusz',
  ];
  const lastNames = [
    'Kowalski',
    'Nowak',
    'Wiśniewski',
    'Wójcik',
    'Kowalczyk',
    'Kamiński',
    'Lewandowski',
    'Zieliński',
    'Szymański',
    'Woźniak',
    'Dąbrowski',
    'Kozłowski',
    'Jankowski',
    'Mazur',
    'Kwiatkowski',
    'Krawczyk',
    'Piotrowski',
    'Grabowski',
    'Nowakowski',
    'Pawłowski',
    'Michalski',
    'Nowicki',
    'Adamczyk',
    'Dudek',
    'Zając',
  ];
  const infoOptions = [
    'Geodeta z wieloletnim doświadczeniem',
    'Specjalizuje się w pomiarach terenowych',
    'Ekspert w zakresie geodezji inżynieryjnej',
    'Doświadczenie w pomiarach dla projektów gazowych',
    'Specjalista od pomiarów katastralnych',
    'Geodeta z uprawnieniami zawodowymi',
    'Ekspert w zakresie tyczenia obiektów',
    'Doświadczenie w zarządzaniu projektami geodezyjnymi',
    undefined, // część bez dodatkowych informacji
    undefined,
  ];

  let id = 1;
  let addressId = 1;

  for (let i = 0; i < 25; i++) {
    const name = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const phone = generatePhone();
    const phone2 = Math.random() > 0.4 ? generatePhone() : undefined; // 60% ma drugi telefon
    const email = generateEmail(name, lastName);
    const info = infoOptions[Math.floor(Math.random() * infoOptions.length)];
    const address = generateMockAddress(addressId++);

    surveyors.push({
      id: id++,
      name,
      lastName,
      phone,
      phone2,
      email,
      info,
      address,
      status: Math.random() > 0.15, // 85% aktywnych
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  return surveyors;
}

export const useSurveyorsStore = defineStore('surveyors', () => {
  const surveyors = ref<Surveyor[]>(generateMockSurveyors());
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed properties
  const activeSurveyors = computed(() => surveyors.value.filter(s => s.status));
  const inactiveSurveyors = computed(() => surveyors.value.filter(s => !s.status));
  const totalCount = computed(() => surveyors.value.length);

  // Funkcje CRUD (na razie z mockowaniem, później będą używać API)

  /**
   * Pobiera wszystkich geodetów
   * @param filters - opcjonalne filtry (status)
   */
  function getAllSurveyors(filters?: { status?: boolean }): Surveyor[] {
    loading.value = true;
    error.value = null;

    try {
      let result = [...surveyors.value];

      if (filters?.status !== undefined) {
        result = result.filter(s => s.status === filters.status);
      }

      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas pobierania geodetów';
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * Pobiera geodetę po ID
   */
  function getSurveyor(id: number): Surveyor | undefined {
    loading.value = true;
    error.value = null;

    try {
      return surveyors.value.find(s => s.id === id);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas pobierania geodety';
      return undefined;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Dodaje nowego geodetę
   */
  function addSurveyor(surveyor: Omit<Surveyor, 'id' | 'createdAt' | 'updatedAt'>): Surveyor {
    loading.value = true;
    error.value = null;

    try {
      const newId = Math.max(...surveyors.value.map(s => s.id), 0) + 1;
      const newSurveyor: Surveyor = {
        ...surveyor,
        id: newId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      surveyors.value.push(newSurveyor);
      return newSurveyor;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas dodawania geodety';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Aktualizuje istniejącego geodetę
   */
  function updateSurveyor(id: number, updates: Partial<Omit<Surveyor, 'id' | 'createdAt'>>): Surveyor | null {
    loading.value = true;
    error.value = null;

    try {
      const index = surveyors.value.findIndex(s => s.id === id);
      if (index === -1) {
        error.value = 'Geodeta nie został znaleziony';
        return null;
      }

      surveyors.value[index] = {
        ...surveyors.value[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      return surveyors.value[index];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas aktualizacji geodety';
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Usuwa geodetę (lub oznacza jako nieaktywnego)
   */
  function deleteSurveyor(id: number, hardDelete: boolean = false): boolean {
    loading.value = true;
    error.value = null;

    try {
      const index = surveyors.value.findIndex(s => s.id === id);
      if (index === -1) {
        error.value = 'Geodeta nie został znaleziony';
        return false;
      }

      if (hardDelete) {
        surveyors.value.splice(index, 1);
      } else {
        // Soft delete - tylko zmiana statusu
        surveyors.value[index].status = false;
        surveyors.value[index].updatedAt = new Date().toISOString();
      }

      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas usuwania geodety';
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Wyszukuje geodetów po frazie (imię, nazwisko, email, telefon, miasto, ulica)
   */
  function searchSurveyors(query: string): Surveyor[] {
    if (!query.trim()) {
      return getAllSurveyors();
    }

    const lowerQuery = query.toLowerCase();
    return surveyors.value.filter(s => {
      return (
        s.name.toLowerCase().includes(lowerQuery) ||
        s.lastName.toLowerCase().includes(lowerQuery) ||
        s.email.toLowerCase().includes(lowerQuery) ||
        s.phone.includes(query) ||
        s.phone2?.includes(query) ||
        s.address.city.toLowerCase().includes(lowerQuery) ||
        s.address.street.toLowerCase().includes(lowerQuery) ||
        s.address.commune.toLowerCase().includes(lowerQuery)
      );
    });
  }

  return {
    // State
    surveyors,
    loading,
    error,
    // Computed
    activeSurveyors,
    inactiveSurveyors,
    totalCount,
    // Methods
    getAllSurveyors,
    getSurveyor,
    addSurveyor,
    updateSurveyor,
    deleteSurveyor,
    searchSurveyors,
  };
});
