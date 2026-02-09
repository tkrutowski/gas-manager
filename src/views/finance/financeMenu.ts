import {
  HomeIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  PlusIcon,
  ListBulletIcon,
  Squares2X2Icon,
} from '@heroicons/vue/24/outline';

export interface SidebarChildItem {
  id: string;
  label: string;
  route: string;
  icon: any;
}

export interface SidebarItem {
  id: string;
  label: string;
  icon: any;
  route: string | null;
  children: SidebarChildItem[] | null;
}

export const financeMenuItems: SidebarItem[] = [
  { id: 'modules-dashboard', label: 'Moduły', icon: HomeIcon, route: '/', children: null },
  { id: 'finance-dashboard', label: 'Pulpit', icon: CurrencyDollarIcon, route: '/finance', children: null },
  {
    id: 'invoices',
    label: 'Faktury',
    icon: DocumentTextIcon,
    route: null,
    children: [
      { id: 'invoices-new', label: 'Nowa', route: '/finance/invoices/new', icon: PlusIcon },
      { id: 'invoices-list', label: 'Lista', route: '/finance/invoices/list', icon: ListBulletIcon },
      { id: 'invoices-grid', label: 'Kafelki', route: '/finance/invoices/grid', icon: Squares2X2Icon },
    ],
  },
  {
    id: 'corrections',
    label: 'Korekty',
    icon: DocumentTextIcon,
    route: null,
    children: [
      { id: 'corrections-new', label: 'Nowa', route: '/finance/corrections/new', icon: PlusIcon },
      { id: 'corrections-list', label: 'Lista', route: '/finance/corrections/list', icon: ListBulletIcon },
      { id: 'corrections-grid', label: 'Kafelki', route: '/finance/corrections/grid', icon: Squares2X2Icon },
    ],
  },
  {
    id: 'offers',
    label: 'Oferty',
    icon: DocumentTextIcon,
    route: null,
    children: [
      { id: 'offers-new', label: 'Nowa', route: '/finance/offers/new', icon: PlusIcon },
      { id: 'offers-list', label: 'Lista', route: '/finance/offers/list', icon: ListBulletIcon },
      { id: 'offers-grid', label: 'Kafelki', route: '/finance/offers/grid', icon: Squares2X2Icon },
    ],
  },
];
