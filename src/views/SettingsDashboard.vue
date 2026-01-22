<script setup lang="ts">
  import { computed, ref, watch } from 'vue';
  import SidebarMenu from '@/components/tasks/SidebarMenu.vue';
  import PrimaryButton from '@/components/PrimaryButton.vue';
  import { useCompanySettingsStore } from '@/stores/companySettings';
  import {
    BuildingOffice2Icon,
    MapPinIcon,
    PhoneIcon,
    EnvelopeIcon,
    BanknotesIcon,
    Cog6ToothIcon,
    Squares2X2Icon,
    TrashIcon,
  } from '@heroicons/vue/24/outline';

  const companySettingsStore = useCompanySettingsStore();

  const company = computed(() => companySettingsStore.company);
  const appInfo = computed(() => companySettingsStore.appInfo);

  const settingsMenuItems = [
    {
      id: 'modules-dashboard',
      label: 'Moduły',
      icon: Squares2X2Icon,
      route: '/',
      children: null,
    },
    {
      id: 'settings',
      label: 'Ustawienia systemu',
      icon: Cog6ToothIcon,
      route: '/settings',
      children: null,
    },
  ];

  const formCompany = ref({
    name: '',
    taxId: '',
    regon: '',
    krs: '',
    address: {
      street: '',
      zipCode: '',
      city: '',
    },
    phones: [] as string[],
    emails: [] as string[],
    bankAccounts: [] as { name?: string; iban: string }[],
  });

  const formAppInfo = ref({
    appName: '',
    appVersion: '',
  });

  watch(
    company,
    value => {
      if (!value) {
        return;
      }
      formCompany.value = {
        name: value.name,
        taxId: value.taxId,
        regon: value.regon || '',
        krs: value.krs || '',
        address: {
          street: value.address.street,
          zipCode: value.address.zipCode,
          city: value.address.city,
        },
        phones: [...(value.phones || [])],
        emails: [...(value.emails || [])],
        bankAccounts: [...(value.bankAccounts || [])],
      };
    },
    { immediate: true }
  );

  watch(
    appInfo,
    value => {
      if (!value) {
        return;
      }
      formAppInfo.value = {
        appName: value.appName,
        appVersion: value.appVersion,
      };
    },
    { immediate: true }
  );

  const handleAddPhone = () => {
    // Sprawdź czy ostatni telefon nie jest pusty
    const lastPhone = formCompany.value.phones[formCompany.value.phones.length - 1];
    if (lastPhone && lastPhone.trim() !== '') {
      formCompany.value.phones.push('');
    }
  };

  const handleRemovePhone = (index: number) => {
    formCompany.value.phones.splice(index, 1);
  };

  const handleAddEmail = () => {
    // Sprawdź czy ostatni email nie jest pusty
    const lastEmail = formCompany.value.emails[formCompany.value.emails.length - 1];
    if (lastEmail && lastEmail.trim() !== '') {
      formCompany.value.emails.push('');
    }
  };

  const handleRemoveEmail = (index: number) => {
    formCompany.value.emails.splice(index, 1);
  };

  const handleAddBankAccount = () => {
    formCompany.value.bankAccounts.push({ name: '', iban: '' });
  };

  const handleRemoveBankAccount = (index: number) => {
    formCompany.value.bankAccounts.splice(index, 1);
  };

  const handleSaveCompany = () => {
    // Usuń puste telefony i emaile przed zapisem
    const cleanedCompany = {
      ...formCompany.value,
      phones: formCompany.value.phones.filter(phone => phone.trim() !== ''),
      emails: formCompany.value.emails.filter(email => email.trim() !== ''),
    };
    companySettingsStore.updateCompanySettings(cleanedCompany);
  };

  const handleSaveAppInfo = () => {
    // Obetnij nazwę aplikacji do maksymalnie 14 znaków
    const trimmedAppName = formAppInfo.value.appName.slice(0, 14);
    companySettingsStore.updateAppInfoSettings({
      appName: trimmedAppName,
      appVersion: formAppInfo.value.appVersion,
    });
  };

  const normalizedCompany = computed(() => {
    if (!company.value) {
      return null;
    }

    return {
      name: company.value.name,
      taxId: company.value.taxId,
      regon: company.value.regon || '',
      krs: company.value.krs || '',
      address: {
        street: company.value.address.street,
        zipCode: company.value.address.zipCode,
        city: company.value.address.city,
      },
      phones: [...(company.value.phones || [])],
      emails: [...(company.value.emails || [])],
      bankAccounts: [...(company.value.bankAccounts || [])],
    };
  });

  const isCompanyDirty = computed(() => {
    if (!normalizedCompany.value) {
      return false;
    }
    return JSON.stringify(formCompany.value) !== JSON.stringify(normalizedCompany.value);
  });

  const normalizedAppInfo = computed(() => {
    if (!appInfo.value) {
      return null;
    }

    return {
      appName: appInfo.value.appName,
      appVersion: appInfo.value.appVersion,
    };
  });

  const isAppInfoDirty = computed(() => {
    if (!normalizedAppInfo.value) {
      return false;
    }
    return JSON.stringify(formAppInfo.value) !== JSON.stringify(normalizedAppInfo.value);
  });
</script>

<template>
  <div class="flex h-screen bg-surface-0 dark:bg-surface-950 overflow-hidden">
    <!-- Sidebar taki jak w zadaniach -->
    <SidebarMenu :menu-items="settingsMenuItems" />

    <!-- Główna część ustawień -->
    <div class="flex-1 overflow-y-auto p-6">
      <main class="max-w-6xl mx-auto text-surface-700 dark:text-surface-300">
        <header class="mb-8 md:mb-10">
          <h1
            class="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2 text-surface-700 dark:text-surface-300"
          >
            <Cog6ToothIcon class="w-7 h-7 text-primary-400" />
            Ustawienia systemu
          </h1>
          <p class="text-sm md:text-base text-surface-600 dark:text-surface-400">
            Zarządzaj danymi firmy oraz podstawowymi informacjami o aplikacji.
          </p>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Środkowa kolumna: Dane firmy -->
          <div class="lg:col-span-2 space-y-6">
            <!-- INFORMACJE PODSTAWOWE O FIRMIE -->
            <section
              id="company-basic"
              class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6"
            >
              <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
                <BuildingOffice2Icon class="w-5 h-5 text-primary-400" />
                Dane firmy
              </h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                    Nazwa firmy
                  </label>
                  <InputText
                    v-model="formCompany.name"
                    class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1"> NIP </label>
                  <InputText
                    v-model="formCompany.taxId"
                    class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1"> REGON </label>
                  <InputText
                    v-model="formCompany.regon"
                    class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1"> KRS </label>
                  <InputText
                    v-model="formCompany.krs"
                    class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200"
                  />
                </div>
              </div>
            </section>

            <!-- ADRES SIEDZIBY -->
            <section
              id="company-address"
              class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6"
            >
              <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPinIcon class="w-5 h-5 text-primary-400" />
                Adres siedziby
              </h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                    Ulica i numer
                  </label>
                  <InputText
                    v-model="formCompany.address.street"
                    class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                    Kod pocztowy
                  </label>
                  <InputText
                    v-model="formCompany.address.zipCode"
                    class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1"> Miasto </label>
                  <InputText
                    v-model="formCompany.address.city"
                    class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200"
                  />
                </div>
              </div>
            </section>

            <!-- KONTAKT -->
            <section
              id="company-contact"
              class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6"
            >
              <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
                <PhoneIcon class="w-5 h-5 text-primary-400" />
                Dane kontaktowe
              </h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 class="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Telefony</h3>
                  <div class="space-y-2">
                    <div v-for="(phone, index) in formCompany.phones" :key="index" class="flex items-center gap-2">
                      <PhoneIcon class="w-4 h-4 text-primary-400" />
                      <InputText
                        v-model="formCompany.phones[index]"
                        class="flex-1 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200"
                      />
                      <button
                        type="button"
                        class="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Usuń numer telefonu"
                        @click="handleRemovePhone(index)"
                      >
                        <TrashIcon class="w-4 h-4" />
                      </button>
                    </div>
                    <p v-if="!formCompany.phones.length" class="text-sm text-surface-500 dark:text-surface-400">
                      Brak zdefiniowanych numerów telefonów.
                    </p>
                    <button
                      type="button"
                      class="text-xs text-primary-500 hover:text-primary-400"
                      @click="handleAddPhone"
                    >
                      + Dodaj numer telefonu
                    </button>
                  </div>
                </div>
                <div>
                  <h3 class="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Adresy e-mail</h3>
                  <div class="space-y-2">
                    <div v-for="(email, index) in formCompany.emails" :key="index" class="flex items-center gap-2">
                      <EnvelopeIcon class="w-4 h-4 text-primary-400" />
                      <InputText
                        v-model="formCompany.emails[index]"
                        class="flex-1 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200"
                      />
                      <button
                        type="button"
                        class="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Usuń adres e-mail"
                        @click="handleRemoveEmail(index)"
                      >
                        <TrashIcon class="w-4 h-4" />
                      </button>
                    </div>
                    <p v-if="!formCompany.emails.length" class="text-sm text-surface-500 dark:text-surface-400">
                      Brak zdefiniowanych adresów e-mail.
                    </p>
                    <button
                      type="button"
                      class="text-xs text-primary-500 hover:text-primary-400"
                      @click="handleAddEmail"
                    >
                      + Dodaj adres e-mail
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <!-- KONTA BANKOWE -->
            <section
              id="company-bank"
              class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6"
            >
              <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
                <BanknotesIcon class="w-5 h-5 text-primary-400" />
                Konta bankowe
              </h2>
              <div class="space-y-3">
                <div
                  v-for="(account, index) in formCompany.bankAccounts"
                  :key="index"
                  class="border border-surface-200 dark:border-surface-700 rounded-lg px-4 py-3 flex flex-col gap-1"
                >
                  <div class="flex flex-col md:flex-row md:items-center gap-2">
                    <InputText
                      v-model="account.name"
                      placeholder="Nazwa konta"
                      class="md:w-1/3 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200"
                    />
                    <InputText
                      v-model="account.iban"
                      placeholder="Numer IBAN"
                      class="flex-1 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200"
                    />
                    <button
                      type="button"
                      class="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Usuń konto bankowe"
                      @click="handleRemoveBankAccount(index)"
                    >
                      <TrashIcon class="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p v-if="!formCompany.bankAccounts.length" class="text-sm text-surface-500 dark:text-surface-400">
                  Brak zdefiniowanych kont bankowych.
                </p>
                <button
                  type="button"
                  class="text-xs text-primary-500 hover:text-primary-400"
                  @click="handleAddBankAccount"
                >
                  + Dodaj konto bankowe
                </button>
              </div>
            </section>

            <div class="flex justify-end">
              <PrimaryButton
                type="button"
                size="lg"
                text="Zapisz dane firmy"
                :disabled="!isCompanyDirty"
                @click="handleSaveCompany"
              />
            </div>
          </div>

          <!-- Prawa kolumna: Ustawienia aplikacji -->
          <div class="space-y-6">
            <section
              id="app-settings"
              class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6"
            >
              <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
                <Cog6ToothIcon class="w-5 h-5 text-primary-400" />
                Ustawienia aplikacji
              </h2>
              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                    Nazwa aplikacji
                    <span class="text-xs text-surface-500 dark:text-surface-400 ml-1">
                      (max {{ formAppInfo.appName.length }}/14)
                    </span>
                  </label>
                  <InputText
                    v-model="formAppInfo.appName"
                    :maxlength="14"
                    class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                    Wersja aplikacji
                  </label>
                  <InputText
                    v-model="formAppInfo.appVersion"
                    class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200"
                  />
                </div>
              </div>

              <div class="mt-4 flex justify-end">
                <PrimaryButton
                  type="button"
                  size="lg"
                  text="Zapisz ustawienia aplikacji"
                  :disabled="!isAppInfoDirty"
                  @click="handleSaveAppInfo"
                />
              </div>
            </section>

            <section
              class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6"
            >
              <h2 class="text-lg font-semibold mb-3">Informacje techniczne</h2>
              <p class="text-xs md:text-sm text-surface-600 dark:text-surface-400">
                Ustawienia są obecnie przechowywane lokalnie w przeglądarce (localStorage) i służą jako konfiguracja
                domyślna. W przyszłości mogą zostać zastąpione ustawieniami z API.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
