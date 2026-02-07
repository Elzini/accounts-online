/**
 * ZATCA JSON Invoice Generator
 * توليد فواتير JSON متوافقة مع هيئة الزكاة والضريبة والجمارك
 * 
 * يدعم تصدير بيانات الفاتورة بصيغة JSON المعتمدة
 * مع جميع الحقول المطلوبة للمرحلة الأولى والثانية
 */

import type { ZatcaXMLInvoiceData, ZatcaXMLItem } from './zatcaXML';

export interface ZatcaJSONInvoice {
  // Invoice metadata
  invoiceMetadata: {
    uuid: string;
    invoiceNumber: string;
    issueDate: string;
    issueTime: string;
    invoiceTypeCode: string;
    invoiceSubType: string;
    documentCurrencyCode: string;
    taxCurrencyCode: string;
    profileID: string;
    note?: string;
  };

  // Document references
  documentReferences: {
    invoiceCounterValue: string;
    previousInvoiceHash: string;
  };

  // Seller (Supplier)
  accountingSupplierParty: {
    partyIdentification: {
      id: string;
      schemeID: string;
    };
    postalAddress: {
      streetName: string;
      buildingNumber: string;
      citySubdivisionName: string;
      cityName: string;
      postalZone: string;
      countryCode: string;
    };
    partyTaxScheme: {
      companyID: string;
      taxSchemeID: string;
    };
    partyLegalEntity: {
      registrationName: string;
    };
  };

  // Buyer (Customer)
  accountingCustomerParty: {
    partyIdentification?: {
      id: string;
      schemeID: string;
    };
    postalAddress: {
      streetName: string;
      cityName: string;
      postalZone: string;
      countryCode: string;
    };
    partyTaxScheme?: {
      companyID: string;
      taxSchemeID: string;
    };
    partyLegalEntity: {
      registrationName: string;
    };
  };

  // Payment
  paymentMeans?: {
    paymentMeansCode: string;
  };

  // Tax totals
  taxTotal: {
    taxAmount: number;
    taxSubtotal: {
      taxableAmount: number;
      taxAmount: number;
      taxCategory: {
        id: string;
        percent: number;
        taxSchemeID: string;
      };
    };
  };

  // Legal monetary total
  legalMonetaryTotal: {
    lineExtensionAmount: number;
    taxExclusiveAmount: number;
    taxInclusiveAmount: number;
    payableAmount: number;
  };

  // Invoice lines
  invoiceLines: ZatcaJSONLineItem[];

  // Digital signature info (Phase 2)
  digitalSignature?: {
    invoiceHash: string;
    signatureValue?: string;
    publicKey?: string;
    certificateSignature?: string;
    signingTime?: string;
  };
}

export interface ZatcaJSONLineItem {
  id: number;
  invoicedQuantity: {
    value: number;
    unitCode: string;
  };
  lineExtensionAmount: number;
  taxTotal: {
    taxAmount: number;
    roundingAmount: number;
  };
  item: {
    name: string;
    classifiedTaxCategory: {
      id: string;
      percent: number;
      taxSchemeID: string;
    };
  };
  price: {
    priceAmount: number;
  };
}

/**
 * Format date to ZATCA format (yyyy-MM-dd)
 */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format time to ZATCA format (HH:mm:ss)
 */
function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Round to 2 decimal places
 */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Generate ZATCA-compliant JSON invoice from invoice data
 */
export function generateZatcaJSON(data: ZatcaXMLInvoiceData): ZatcaJSONInvoice {
  const currency = data.currency || 'SAR';
  const invoiceDate = formatDate(data.invoiceDate);
  const invoiceTime = data.invoiceTime || formatTime(data.invoiceDate);
  const typeCode = data.invoiceTypeCode || '388';
  const invoiceSubType = data.buyerTaxNumber ? '0100000' : '0200000';

  const json: ZatcaJSONInvoice = {
    invoiceMetadata: {
      uuid: data.uuid,
      invoiceNumber: String(data.invoiceNumber),
      issueDate: invoiceDate,
      issueTime: invoiceTime,
      invoiceTypeCode: typeCode,
      invoiceSubType,
      documentCurrencyCode: currency,
      taxCurrencyCode: currency,
      profileID: 'reporting:1.0',
      ...(data.notes && { note: data.notes }),
    },

    documentReferences: {
      invoiceCounterValue: String(data.invoiceNumber),
      previousInvoiceHash: 'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==',
    },

    accountingSupplierParty: {
      partyIdentification: {
        id: data.sellerCommercialRegister || '',
        schemeID: 'CRN',
      },
      postalAddress: {
        streetName: data.sellerStreet || data.sellerAddress || '',
        buildingNumber: data.sellerBuildingNumber || '',
        citySubdivisionName: data.sellerDistrict || '',
        cityName: data.sellerCity || '',
        postalZone: data.sellerPostalCode || '',
        countryCode: data.sellerCountry || 'SA',
      },
      partyTaxScheme: {
        companyID: data.sellerTaxNumber,
        taxSchemeID: 'VAT',
      },
      partyLegalEntity: {
        registrationName: data.sellerName,
      },
    },

    accountingCustomerParty: {
      ...(data.buyerTaxNumber && {
        partyIdentification: {
          id: data.buyerTaxNumber,
          schemeID: 'VAT',
        },
      }),
      ...(!data.buyerTaxNumber && data.buyerIdNumber && {
        partyIdentification: {
          id: data.buyerIdNumber,
          schemeID: 'NAT',
        },
      }),
      postalAddress: {
        streetName: data.buyerAddress || '',
        cityName: data.buyerCity || '',
        postalZone: data.buyerPostalCode || '',
        countryCode: data.buyerCountry || 'SA',
      },
      ...(data.buyerTaxNumber && {
        partyTaxScheme: {
          companyID: data.buyerTaxNumber,
          taxSchemeID: 'VAT',
        },
      }),
      partyLegalEntity: {
        registrationName: data.buyerName,
      },
    },

    ...(data.paymentMethod && {
      paymentMeans: {
        paymentMeansCode: data.paymentMethod === 'cash' ? '10' : data.paymentMethod === 'transfer' ? '42' : '30',
      },
    }),

    taxTotal: {
      taxAmount: round2(data.taxAmount),
      taxSubtotal: {
        taxableAmount: round2(data.subtotal),
        taxAmount: round2(data.taxAmount),
        taxCategory: {
          id: 'S',
          percent: round2(data.taxRate),
          taxSchemeID: 'VAT',
        },
      },
    },

    legalMonetaryTotal: {
      lineExtensionAmount: round2(data.subtotal),
      taxExclusiveAmount: round2(data.subtotal),
      taxInclusiveAmount: round2(data.total),
      payableAmount: round2(data.total),
    },

    invoiceLines: data.items.map((item, index) => ({
      id: index + 1,
      invoicedQuantity: {
        value: item.quantity,
        unitCode: item.unitCode || 'PCE',
      },
      lineExtensionAmount: round2(item.unitPrice * item.quantity),
      taxTotal: {
        taxAmount: round2(item.taxAmount),
        roundingAmount: round2(item.total),
      },
      item: {
        name: item.description,
        classifiedTaxCategory: {
          id: 'S',
          percent: round2(item.taxRate),
          taxSchemeID: 'VAT',
        },
      },
      price: {
        priceAmount: round2(item.unitPrice),
      },
    })),
  };

  return json;
}

/**
 * Generate JSON string with pretty formatting
 */
export function generateZatcaJSONString(data: ZatcaXMLInvoiceData): string {
  const json = generateZatcaJSON(data);
  return JSON.stringify(json, null, 2);
}

/**
 * Download JSON invoice as file
 */
export function downloadJSONInvoice(jsonContent: string, fileName: string): void {
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
