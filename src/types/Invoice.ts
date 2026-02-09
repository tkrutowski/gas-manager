import type { TaskType } from '@/types/TaskType.ts';
import type { Customer } from '@/types/Customer.ts';

export interface Invoice {
    idInvoiceNumber: number;
    idInvoiceYear: number;
    customer:Customer;
    paymentMethod:PaymentMethod;
    sellDate: undefined | Date;
    paymentDate: undefined | Date;
    amountNet: number;
    amountVat: number;
    amountGross: number;
    paid: boolean;
    contractNo?: string;
    invoiceDate: undefined | Date;
    taskType: TaskType;
    idTask?: number;
    invoiceItems: InvoiceItem[];
}

export interface PaymentMethod {
    id: number;
    name: string;
}

export interface Vat {
    id: number;
    rate: string;
    multiplier: number;
}

export interface InvoiceItem {
    idInvoiceItem: number;
    idInvoiceNumber: number;
    idInvoiceYear: number;
    name: string;
    pkwiu: string;
    unit: string;
    quantity: number;
    priceNet: number;
    amountNet: number;
    amountVat: number;
    amountGross: number;
    vat: Vat;
}
