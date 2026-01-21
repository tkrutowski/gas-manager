import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { settingsService } from '@/services/settingsService';
import type { CompanySettings, AppInfoSettings } from '@/types/Settings';

function createDefaultCompanySettings(): CompanySettings {
  return {
    moduleName: 'companySettings',
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    company: {
      name: 'GasManager Sp. z o.o.',
      taxId: '1234567890',
      regon: '123456789',
      krs: '0000123456',
      address: {
        street: 'ul. Gazowa 10',
        zipCode: '00-001',
        city: 'Warszawa',
      },
      phones: ['+48 123 456 789', '+48 987 654 321'],
      emails: ['biuro@gasmanager.pl', 'kontakt@gasmanager.pl'],
      bankAccounts: [
        {
          name: 'Konto podstawowe',
          iban: 'PL00102030400000000000000000',
        },
        {
          name: 'Konto inwestycyjne',
          iban: 'PL00102030400000000000000001',
        },
      ],
    },
  };
}

function createDefaultAppInfoSettings(): AppInfoSettings {
  return {
    moduleName: 'appInfo',
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    appName: 'GasManager Pro',
    appVersion: '2.4.0',
  };
}

export const useCompanySettingsStore = defineStore('companySettings', () => {
  const loading = ref(false);
  const error = ref<string | null>(null);

  const companySettings = ref<CompanySettings | null>(null);
  const appInfoSettings = ref<AppInfoSettings | null>(null);

  function loadSettings() {
    try {
      loading.value = true;
      error.value = null;

      const existingCompany = settingsService.getModuleSettings<CompanySettings>('companySettings');
      const existingAppInfo = settingsService.getModuleSettings<AppInfoSettings>('appInfo');

      if (!existingCompany) {
        const defaults = createDefaultCompanySettings();
        settingsService.saveModuleSettings(defaults);
        companySettings.value = defaults;
      } else {
        companySettings.value = existingCompany;
      }

      if (!existingAppInfo) {
        const defaults = createDefaultAppInfoSettings();
        settingsService.saveModuleSettings(defaults);
        appInfoSettings.value = defaults;
      } else {
        appInfoSettings.value = existingAppInfo;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas wczytywania ustawień firmy';
    } finally {
      loading.value = false;
    }
  }

  function updateCompanySettings(payload: Partial<CompanySettings['company']>) {
    if (!companySettings.value) {
      companySettings.value = createDefaultCompanySettings();
    }

    const updated: CompanySettings = {
      ...companySettings.value,
      updatedAt: new Date().toISOString(),
      company: {
        ...companySettings.value.company,
        ...payload,
      },
    };

    settingsService.saveModuleSettings(updated);
    companySettings.value = updated;
  }

  function updateAppInfoSettings(payload: Partial<Pick<AppInfoSettings, 'appName' | 'appVersion'>>) {
    if (!appInfoSettings.value) {
      appInfoSettings.value = createDefaultAppInfoSettings();
    }

    const updated: AppInfoSettings = {
      ...appInfoSettings.value,
      updatedAt: new Date().toISOString(),
      ...payload,
    };

    settingsService.saveModuleSettings(updated);
    appInfoSettings.value = updated;
  }

  const company = computed(() => companySettings.value?.company ?? null);
  const appInfo = computed(() => appInfoSettings.value ?? null);

  // Automatyczne załadowanie przy pierwszym użyciu store
  if (typeof window !== 'undefined') {
    loadSettings();
  }

  return {
    // state
    loading,
    error,
    companySettings,
    appInfoSettings,
    // computed
    company,
    appInfo,
    // actions
    loadSettings,
    updateCompanySettings,
    updateAppInfoSettings,
  };
}
);

