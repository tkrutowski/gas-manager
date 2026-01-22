import type { Designer, DesignerTraffic } from '@/types/Designer';
import type { Coordinator } from '@/types/Coordinator';
import type { Customer } from '@/types/Customer';
import type { WorkRangeGasConnection, WorkRangeGasStation, WorkRangeConnection } from '@/types/WorkRange';
import { Phase } from '@/types/GasConnection';

/**
 * Formatuje datę do formatu yyyy-mm-dd (łatwiejsze sortowanie)
 */
export function formatDate(date: Date | undefined | null): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formatuje kwotę pieniężną w formacie polskim
 */
export function formatMoney(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return '';
  return (
    new Intl.NumberFormat('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + ' PLN'
  );
}

/**
 * Formatuje fazę projektu jako tekst polski
 */
export function formatPhase(phase: Phase | undefined | null): string {
  if (!phase) return 'Brak';
  switch (phase) {
    case Phase.PREPARATION:
      return 'W przygotowaniu';
    case Phase.PROJECT:
      return 'Projektowanie';
    case Phase.WORK:
      return 'Budowa';
    case Phase.FINANSE:
      return 'Finanse';
    case Phase.COMPLETED:
      return 'Zakończone';
    case Phase.CANCELED:
      return 'Anulowane';
    default:
      return 'Brak';
  }
}

/**
 * Formatuje listę workRangeGasConnections
 */
export function formatWorkRangeGasConnections(items: WorkRangeGasConnection[] | undefined | null): string {
  if (!items || items.length === 0) return '';
  return items
    .map(item => {
      const diameter = item.diameter || '';
      const material = item.material || '';
      const length = item.lengthWar || 0;
      return `${diameter}${material} ${length}m`;
    })
    .join(', ');
}

/**
 * Formatuje listę workRangeGasStations
 */
export function formatWorkRangeGasStations(items: WorkRangeGasStation[] | undefined | null): string {
  if (!items || items.length === 0) return '';
  return items
    .map(item => {
      const capacity = item.capacity || 0;
      const stationType = item.stationType?.name || '';
      const amount = item.amount || 0;
      return `${capacity} m3/h ${stationType} ${amount} szt.`;
    })
    .join(', ');
}

/**
 * Formatuje workRangeConnection
 */
export function formatWorkRangeConnection(item: WorkRangeConnection | undefined | null): string {
  if (!item) return '';
  const diameter = item.diameter || '';
  const material = item.material || '';
  const pressure = item.pressure?.viewValue || item.pressure?.name || '';
  return `${diameter}${material} ${pressure}`.trim();
}

/**
 * Pobiera wyświetlaną nazwę osoby (Designer, Coordinator, Customer)
 */
export function getPersonDisplayName(
  person: Designer | Coordinator | Customer | DesignerTraffic | undefined | null
): string {
  if (!person) return '';

  // Customer może być osobą lub firmą
  if ('customerType' in person) {
    if (person.customerType === 'person') {
      return `${person.firstName || ''} ${person.lastName || ''}`.trim();
    }
    return person.companyName || '';
  }

  // Designer, Coordinator, DesignerTraffic mają name i lastName
  if ('name' in person && 'lastName' in person) {
    return `${person.name || ''} ${person.lastName || ''}`.trim();
  }

  return '';
}
