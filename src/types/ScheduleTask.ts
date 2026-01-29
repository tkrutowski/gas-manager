import type { TaskType } from '@/types/TaskType';

export interface ScheduleTask {
  id: number;
  referenceId: number; // ID przyłącza (GasConnection) lub innego obiektu
  referenceType: TaskType; // Typ zadania (wykorzysta istniejący TaskType)
  brigadeId: number; // ID brygady
  title: string; // Tytuł (wolny tekst np. "Budowa przyłącza")
  startDate: Date; // Data/godzina rozpoczęcia
  endDate: Date; // Data/godzina zakończenia
  notes: string; // Notatki/opis
  latitude?: number; // Współrzędne mapy Leaflet
  longitude?: number;
  // Pola audytu
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}
