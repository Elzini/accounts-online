/**
 * ZATCA XML Export - تصدير تقرير ضريبي بتنسيق XML الرسمي
 * يتوافق مع متطلبات هيئة الزكاة والضريبة والجمارك
 */

interface VATReturnData {
  companyName: string;
  vatNumber: string;
  commercialRegister?: string;
  nationalAddress?: string;
  periodStart: string;
  periodEnd: string;
  taxRate: number;
  sales: {
    standardRatedAmount: number;
    standardRatedVAT: number;
    citizenServicesAmount: number;
    citizenServicesVAT: number;
    zeroRatedAmount: number;
    exportsAmount: number;
    exemptAmount: number;
    totalAmount: number;
    totalVAT: number;
  };
  purchases: {
    standardRatedAmount: number;
    standardRatedVAT: number;
    importsAmount: number;
    importsVAT: number;
    zeroRatedAmount: number;
    exemptAmount: number;
    totalAmount: number;
    totalVAT: number;
  };
  netVAT: number;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

export function generateZatcaVATReturnXML(data: VATReturnData): string {
  const now = new Date().toISOString();
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<VATReturn xmlns="urn:zatca:vat:return:1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Header>
    <DocumentType>VAT_RETURN</DocumentType>
    <DocumentVersion>1.0</DocumentVersion>
    <GeneratedAt>${now}</GeneratedAt>
    <Language>ar</Language>
  </Header>
  
  <TaxpayerInfo>
    <TaxpayerName>${escapeXml(data.companyName)}</TaxpayerName>
    <TaxIdentificationNumber>${escapeXml(data.vatNumber)}</TaxIdentificationNumber>
    ${data.commercialRegister ? `<CommercialRegistrationNumber>${escapeXml(data.commercialRegister)}</CommercialRegistrationNumber>` : ''}
    ${data.nationalAddress ? `<NationalAddress>${escapeXml(data.nationalAddress)}</NationalAddress>` : ''}
  </TaxpayerInfo>
  
  <ReportingPeriod>
    <StartDate>${data.periodStart}</StartDate>
    <EndDate>${data.periodEnd}</EndDate>
  </ReportingPeriod>
  
  <VATDeclaration>
    <Sales>
      <Box id="1" description="المبيعات الخاضعة للنسبة الأساسية">
        <TaxableAmount>${formatAmount(data.sales.standardRatedAmount)}</TaxableAmount>
        <VATAmount>${formatAmount(data.sales.standardRatedVAT)}</VATAmount>
        <TaxRate>${data.taxRate}</TaxRate>
      </Box>
      <Box id="2" description="المبيعات للمواطنين (الخدمات الصحية والتعليمية)">
        <TaxableAmount>${formatAmount(data.sales.citizenServicesAmount)}</TaxableAmount>
        <VATAmount>${formatAmount(data.sales.citizenServicesVAT)}</VATAmount>
      </Box>
      <Box id="3" description="المبيعات الخاضعة لنسبة الصفر">
        <TaxableAmount>${formatAmount(data.sales.zeroRatedAmount)}</TaxableAmount>
        <VATAmount>0.00</VATAmount>
      </Box>
      <Box id="4" description="الصادرات">
        <TaxableAmount>${formatAmount(data.sales.exportsAmount)}</TaxableAmount>
        <VATAmount>0.00</VATAmount>
      </Box>
      <Box id="5" description="المبيعات المعفاة">
        <TaxableAmount>${formatAmount(data.sales.exemptAmount)}</TaxableAmount>
        <VATAmount>0.00</VATAmount>
      </Box>
      <Box id="6" description="إجمالي المبيعات">
        <TaxableAmount>${formatAmount(data.sales.totalAmount)}</TaxableAmount>
        <VATAmount>${formatAmount(data.sales.totalVAT)}</VATAmount>
      </Box>
    </Sales>
    
    <Purchases>
      <Box id="7" description="المشتريات الخاضعة للنسبة الأساسية">
        <TaxableAmount>${formatAmount(data.purchases.standardRatedAmount)}</TaxableAmount>
        <VATAmount>${formatAmount(data.purchases.standardRatedVAT)}</VATAmount>
        <TaxRate>${data.taxRate}</TaxRate>
      </Box>
      <Box id="8" description="الاستيرادات الخاضعة للضريبة (الجمارك)">
        <TaxableAmount>${formatAmount(data.purchases.importsAmount)}</TaxableAmount>
        <VATAmount>${formatAmount(data.purchases.importsVAT)}</VATAmount>
      </Box>
      <Box id="9" description="الاستيرادات الخاضعة للاحتساب العكسي">
        <TaxableAmount>0.00</TaxableAmount>
        <VATAmount>0.00</VATAmount>
      </Box>
      <Box id="10" description="المشتريات الخاضعة لنسبة الصفر">
        <TaxableAmount>${formatAmount(data.purchases.zeroRatedAmount)}</TaxableAmount>
        <VATAmount>0.00</VATAmount>
      </Box>
      <Box id="11" description="المشتريات المعفاة">
        <TaxableAmount>${formatAmount(data.purchases.exemptAmount)}</TaxableAmount>
        <VATAmount>0.00</VATAmount>
      </Box>
      <Box id="12" description="إجمالي المشتريات">
        <TaxableAmount>${formatAmount(data.purchases.totalAmount)}</TaxableAmount>
        <VATAmount>${formatAmount(data.purchases.totalVAT)}</VATAmount>
      </Box>
    </Purchases>
    
    <NetVAT>
      <Box id="13" description="إجمالي ضريبة القيمة المضافة على المبيعات">
        <VATAmount>${formatAmount(data.sales.totalVAT)}</VATAmount>
      </Box>
      <Box id="14" description="إجمالي ضريبة القيمة المضافة على المشتريات">
        <VATAmount>${formatAmount(data.purchases.totalVAT)}</VATAmount>
      </Box>
      <Box id="15" description="تصحيحات من فترات سابقة">
        <VATAmount>0.00</VATAmount>
      </Box>
      <Box id="16" description="صافي ضريبة القيمة المضافة ${data.netVAT >= 0 ? '(مستحقة)' : '(مستردة)'}">
        <VATAmount>${formatAmount(Math.abs(data.netVAT))}</VATAmount>
        <Status>${data.netVAT >= 0 ? 'PAYABLE' : 'REFUNDABLE'}</Status>
      </Box>
    </NetVAT>
  </VATDeclaration>
  
  <Summary>
    <TotalSalesAmount>${formatAmount(data.sales.totalAmount)}</TotalSalesAmount>
    <TotalSalesVAT>${formatAmount(data.sales.totalVAT)}</TotalSalesVAT>
    <TotalPurchasesAmount>${formatAmount(data.purchases.totalAmount)}</TotalPurchasesAmount>
    <TotalPurchasesVAT>${formatAmount(data.purchases.totalVAT)}</TotalPurchasesVAT>
    <NetVATDue>${formatAmount(Math.abs(data.netVAT))}</NetVATDue>
    <VATStatus>${data.netVAT >= 0 ? 'PAYABLE' : 'REFUNDABLE'}</VATStatus>
    <Currency>SAR</Currency>
  </Summary>
</VATReturn>`;

  return xml;
}

export function downloadZatcaXML(xml: string, periodStart: string, periodEnd: string) {
  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ZATCA-VAT-Return-${periodStart}-${periodEnd}.xml`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
