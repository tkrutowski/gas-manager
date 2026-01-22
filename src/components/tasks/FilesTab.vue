<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import type { GasConnection } from '@/types/GasConnection';
  import type { File, CategorizedFile, FileCategory, FileType } from '@/types/File';
  import { FileCategoryLabels } from '@/types/File';
  import { useFilesStore } from '@/stores/files';
  import { useConfirm } from 'primevue/useconfirm';
  import DataTable from 'primevue/datatable';
  import Column from 'primevue/column';
  import Card from 'primevue/card';
  import Button from 'primevue/button';
  import InputText from 'primevue/inputtext';
  import IconField from 'primevue/iconfield';
  import InputIcon from 'primevue/inputicon';
  import Tag from 'primevue/tag';
  import Avatar from 'primevue/avatar';
  import Menu from 'primevue/menu';
  import ConfirmPopup from 'primevue/confirmpopup';
  import {
    FolderIcon,
    MagnifyingGlassIcon,
    DocumentIcon,
    PhotoIcon,
    MapIcon,
    DocumentTextIcon,
    CircleStackIcon,
    ClipboardDocumentCheckIcon,
    BoltIcon,
  } from '@heroicons/vue/24/outline';

  interface Props {
    gasConnection: GasConnection | undefined;
    isReadonly: boolean;
  }

  const props = defineProps<Props>();
  const filesStore = useFilesStore();
  const confirm = useConfirm();

  // State
  const searchQuery = ref('');
  const generalFiles = ref<File[]>([]);
  const categorizedFiles = ref<CategorizedFile[]>([]);
  const showMoreGeneralFiles = ref(false);
  const displayedGeneralFilesCount = ref(5);
  const menuRefs = ref<Map<number, any>>(new Map());
  const menuItems = [
    {
      label: 'Otwórz',
      icon: 'pi pi-fw pi-external-link',
    },
    {
      label: 'Pobierz',
      icon: 'pi pi-fw pi-download',
    },
    {
      separator: true,
    },
    {
      label: 'Usuń',
      icon: 'pi pi-fw pi-trash',
    },
  ];

  // Computed
  const filteredGeneralFiles = computed(() => {
    if (!searchQuery.value.trim()) {
      return generalFiles.value;
    }
    const query = searchQuery.value.toLowerCase();
    return generalFiles.value.filter(
      f => f.name.toLowerCase().includes(query) || f.description?.toLowerCase().includes(query)
    );
  });

  const displayedGeneralFiles = computed(() => {
    if (showMoreGeneralFiles.value) {
      return filteredGeneralFiles.value;
    }
    return filteredGeneralFiles.value.slice(0, displayedGeneralFilesCount.value);
  });

  const filesByCategory = computed(() => {
    const categories: FileCategory[] = ['PERMITS_DECISIONS', 'TECHNICAL_PROJECT', 'ACCEPTANCE_PROTOCOLS'];
    return categories.map(category => ({
      category,
      files: categorizedFiles.value.filter(f => f.category === category),
    }));
  });

  // Functions
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  function formatDate(date: Date): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }

  function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Dzisiaj';
    if (diffDays === 1) return 'Wczoraj';
    if (diffDays < 7) return `${diffDays} dni temu`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'tydzień' : 'tygodnie'} temu`;
    }
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? 'miesiąc' : 'miesiące'} temu`;
  }

  function getFileIcon(type: string) {
    const iconMap: Record<string, any> = {
      PDF: DocumentTextIcon,
      DOCX: DocumentTextIcon,
      DOC: DocumentTextIcon,
      JPG: PhotoIcon,
      JPEG: PhotoIcon,
      PNG: PhotoIcon,
      DWG: MapIcon,
      DWF: MapIcon,
      XLSX: DocumentIcon,
      XLS: DocumentIcon,
      ZIP: DocumentIcon,
      RAR: DocumentIcon,
      TXT: DocumentTextIcon,
      OTHER: DocumentIcon,
    };
    return iconMap[type] || DocumentIcon;
  }

  function getCategoryIcon(category: FileCategory) {
    const iconMap: Record<FileCategory, any> = {
      PERMITS_DECISIONS: BoltIcon,
      TECHNICAL_PROJECT: CircleStackIcon,
      ACCEPTANCE_PROTOCOLS: ClipboardDocumentCheckIcon,
    };
    return iconMap[category];
  }

  function getFileTypeSeverity(type: FileType): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const severityMap: Record<FileType, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      PDF: 'danger', // Czerwony
      DOCX: 'info', // Niebieski
      DOC: 'info', // Niebieski
      JPG: 'success', // Zielony
      JPEG: 'success', // Zielony
      PNG: 'success', // Zielony
      DWG: 'warn', // Pomarańczowy
      DWF: 'warn', // Pomarańczowy
      XLSX: 'info', // Niebieski
      XLS: 'info', // Niebieski
      ZIP: 'secondary', // Szary
      RAR: 'secondary', // Szary
      TXT: 'secondary', // Szary
      OTHER: 'secondary', // Szary
    };
    return severityMap[type] || 'secondary';
  }

  function getUserInitials(user: any): string {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.name) {
      const parts = user.name.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return user.name[0].toUpperCase();
    }
    return 'U';
  }

  function handleAddGeneralFile() {
    // TODO: Implementacja dialogu dodawania pliku
    console.log('Dodaj plik ogólny');
  }

  function handleAddCategorizedFile(category: FileCategory) {
    // TODO: Implementacja dialogu dodawania pliku do kategorii
    console.log('Dodaj plik do kategorii', category);
  }

  function toggleMenu(event: Event, file: File | CategorizedFile) {
    const menu = menuRefs.value.get(file.id);
    if (menu) {
      menu.toggle(event);
    }
  }

  function handleOpenFile(file: File | CategorizedFile) {
    // TODO: Implementacja otwierania pliku
    console.log('Otwórz plik', file);
    if (file.fileUrl) {
      window.open(file.fileUrl, '_blank');
    }
  }

  function handleDownloadFile(file: File | CategorizedFile) {
    // TODO: Implementacja pobierania pliku
    console.log('Pobierz plik', file);
    if (file.fileUrl) {
      const link = document.createElement('a');
      link.href = file.fileUrl;
      link.download = file.name;
      link.click();
    }
  }

  function handleDeleteFile(file: File | CategorizedFile, event?: Event) {
    if (props.isReadonly) return;

    const target = (event?.currentTarget as HTMLElement) || (event?.target as HTMLElement);

    confirm.require({
      target: target || undefined,
      message: `Czy na pewno chcesz usunąć plik "${file.name}"?`,
      icon: 'pi pi-exclamation-triangle',
      rejectProps: {
        label: 'Anuluj',
        severity: 'secondary',
        outlined: true,
      },
      acceptProps: {
        label: 'Usuń',
        severity: 'danger',
      },
      accept: () => {
        const success = filesStore.deleteFile(file.id);
        if (success) {
          // Odśwież listy plików
          if (props.gasConnection) {
            const taskType = props.gasConnection.workRangeConnection?.taskType || {
              name: 'GAS_CONNECTION',
              viewName: 'przylacze',
            };
            generalFiles.value = filesStore.getGeneralFiles(props.gasConnection.id, taskType);
            categorizedFiles.value = filesStore.getCategorizedFiles(props.gasConnection.id, taskType);
          }
        }
      },
    });
  }

  function getMenuItems(file: File | CategorizedFile) {
    return menuItems.map(item => {
      if (item.separator) {
        return item;
      }
      return {
        ...item,
        command: (e: any) => {
          if (item.label === 'Otwórz') {
            handleOpenFile(file);
          } else if (item.label === 'Pobierz') {
            handleDownloadFile(file);
          } else if (item.label === 'Usuń') {
            // Używamy oryginalnego eventu z menu lub tworzymy nowy
            const event = e?.originalEvent || new Event('click');
            handleDeleteFile(file, event);
          }
        },
      };
    });
  }

  function setMenuRef(el: any, fileId: number) {
    if (el) {
      menuRefs.value.set(fileId, el);
    }
  }

  function handleShowMore() {
    showMoreGeneralFiles.value = true;
  }

  // Lifecycle
  onMounted(() => {
    if (props.gasConnection) {
      const taskType = props.gasConnection.workRangeConnection?.taskType || {
        name: 'GAS_CONNECTION',
        viewName: 'przylacze',
      };
      generalFiles.value = filesStore.getGeneralFiles(props.gasConnection.id, taskType);
      categorizedFiles.value = filesStore.getCategorizedFiles(props.gasConnection.id, taskType);
    }
  });
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- SEKCJA 1: PLIKI OGÓLNE PRZYŁĄCZA -->
    <Card class="border border-surface-200 dark:border-surface-700 overflow-hidden">
      <template #header>
        <div
          class="flex items-center justify-between px-6 py-4 bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700"
        >
          <div class="flex items-center gap-3">
            <FolderIcon class="w-6 h-6 text-primary-400" />
            <h2 class="text-lg font-bold text-surface-700 dark:text-surface-300 m-0">PLIKI OGÓLNE PRZYŁĄCZA</h2>
          </div>
          <div class="flex items-center gap-3">
            <!-- Wyszukiwarka -->
            <IconField>
              <InputIcon>
                <MagnifyingGlassIcon class="w-4 h-4" />
              </InputIcon>
              <InputText v-model="searchQuery" placeholder="Szukaj pliku..." class="w-64" />
            </IconField>
            <!-- Przycisk filtra -->
            <Button icon="pi pi-filter" text rounded severity="secondary" :disabled="isReadonly" />
            <!-- Przycisk Dodaj plik -->
            <Button
              label="Dodaj plik"
              icon="pi pi-plus"
              severity="warning"
              :disabled="isReadonly"
              @click="handleAddGeneralFile"
            />
          </div>
        </div>
      </template>

      <template #content>
        <div class="p-0">
          <DataTable :value="displayedGeneralFiles" :loading="filesStore.loading" class="w-full" :rowHover="true">
            <Column field="name" header="NAZWA PLIKU" style="min-width: 250px">
              <template #body="{ data }">
                <div class="flex items-center gap-3">
                  <component :is="getFileIcon(data.type)" class="w-5 h-5 text-yellow-400" />
                  <span class="text-surface-700 dark:text-surface-300">{{ data.name }}</span>
                </div>
              </template>
            </Column>
            <Column field="type" header="TYP" style="width: 100px">
              <template #body="{ data }">
                <Tag :value="data.type" :severity="getFileTypeSeverity(data.type)" />
              </template>
            </Column>
            <Column field="uploadDate" header="DATA DODANIA" style="width: 120px">
              <template #body="{ data }">
                <span class="text-surface-700 dark:text-surface-300">{{ formatDate(data.uploadDate) }}</span>
              </template>
            </Column>
            <Column field="size" header="ROZMIAR" style="width: 120px">
              <template #body="{ data }">
                <span class="text-surface-700 dark:text-surface-300">{{ formatFileSize(data.size) }}</span>
              </template>
            </Column>
            <Column field="uploadedBy" header="DODANO PRZEZ" style="width: 200px">
              <template #body="{ data }">
                <div class="flex items-center gap-2">
                  <Avatar
                    :label="getUserInitials(data.uploadedBy)"
                    shape="circle"
                    class="bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
                  />
                  <span class="text-surface-700 dark:text-surface-300">{{ data.uploadedBy.name }}</span>
                </div>
              </template>
            </Column>
            <Column field="description" header="OPIS" style="min-width: 200px">
              <template #body="{ data }">
                <span class="text-surface-600 dark:text-surface-400">{{ data.description || '-' }}</span>
              </template>
            </Column>
            <Column header="AKCJE" style="width: 60px" :exportable="false">
              <template #body="{ data }">
                <div class="relative">
                  <Button
                    icon="pi pi-ellipsis-v"
                    text
                    rounded
                    severity="secondary"
                    :disabled="isReadonly"
                    @click="e => toggleMenu(e, data)"
                  />
                  <Menu :ref="el => setMenuRef(el, data.id)" :model="getMenuItems(data)" :popup="true" />
                </div>
              </template>
            </Column>
          </DataTable>

          <!-- Przycisk Pokaż więcej -->
          <div
            v-if="!showMoreGeneralFiles && filteredGeneralFiles.length > displayedGeneralFilesCount"
            class="flex justify-center py-4 border-t border-surface-200 dark:border-surface-700"
          >
            <Button label="Pokaż więcej" icon="pi pi-chevron-down" text severity="secondary" @click="handleShowMore" />
          </div>
        </div>
      </template>
    </Card>

    <!-- SEKCJA 2: PLIKI PRZYPISANE DO ELEMENTÓW -->
    <Card class="border border-surface-200 dark:border-surface-700 overflow-hidden">
      <template #header>
        <div
          class="flex items-center gap-3 px-6 py-4 bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700"
        >
          <FolderIcon class="w-6 h-6 text-primary-400" />
          <h2 class="text-lg font-bold text-surface-700 dark:text-surface-300 m-0">PLIKI PRZYPISANE DO ELEMENTÓW</h2>
        </div>
      </template>

      <template #content>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              v-for="categoryData in filesByCategory"
              :key="categoryData.category"
              class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden flex flex-col"
            >
              <!-- Nagłówek kategorii -->
              <div
                class="flex items-center justify-between px-4 py-3 border-b border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800"
              >
                <div class="flex items-center gap-3">
                  <component :is="getCategoryIcon(categoryData.category)" class="w-5 h-5 text-primary-400" />
                  <h3 class="text-sm font-bold uppercase text-surface-700 dark:text-surface-300 m-0">
                    {{ FileCategoryLabels[categoryData.category] }}
                  </h3>
                </div>
                <Button
                  icon="pi pi-plus"
                  text
                  rounded
                  severity="secondary"
                  :disabled="isReadonly"
                  @click="handleAddCategorizedFile(categoryData.category)"
                />
              </div>

              <!-- Lista plików w kategorii -->
              <div class="flex-1 p-4 space-y-3">
                <div v-if="categoryData.files.length > 0" class="space-y-3">
                  <div
                    v-for="file in categoryData.files"
                    :key="file.id"
                    class="flex items-center gap-3 p-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-950"
                  >
                    <component :is="getFileIcon(file.type)" class="w-5 h-5 text-yellow-400 shrink-0" />
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-surface-700 dark:text-surface-300 m-0 truncate">
                        {{ file.name }}
                      </p>
                      <p class="text-xs text-surface-600 dark:text-surface-400 m-0">
                        {{ formatFileSize(file.size) }} • {{ getTimeAgo(file.uploadDate) }}
                      </p>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <Avatar
                        :label="getUserInitials(file.uploadedBy)"
                        shape="circle"
                        class="bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
                      />
                      <div class="relative">
                        <Button
                          icon="pi pi-ellipsis-v"
                          text
                          rounded
                          severity="secondary"
                          :disabled="isReadonly"
                          @click="e => toggleMenu(e, file)"
                        />
                        <Menu :ref="el => setMenuRef(el, file.id)" :model="getMenuItems(file)" :popup="true" />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Komunikat gdy brak plików -->
                <div
                  v-else
                  class="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-lg"
                >
                  <DocumentIcon class="w-12 h-12 text-surface-400 dark:text-surface-500 mb-3" />
                  <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">Brak plików w tej sekcji</p>
                  <Button
                    label="Dodaj pierwszy plik"
                    text
                    severity="secondary"
                    :disabled="isReadonly"
                    @click="handleAddCategorizedFile(categoryData.category)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- ConfirmPopup dla potwierdzeń -->
    <ConfirmPopup />
  </div>
</template>
