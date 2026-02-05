// تحويل الأرقام إلى كلمات عربية

const ones = [
  '', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 
  'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة',
  'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر',
  'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'
];

const tens = [
  '', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون',
  'ستون', 'سبعون', 'ثمانون', 'تسعون'
];

const hundreds = [
  '', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة',
  'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'
];

function convertHundreds(num: number): string {
  if (num === 0) return '';
  
  const h = Math.floor(num / 100);
  const remainder = num % 100;
  
  let result = '';
  
  if (h > 0) {
    result = hundreds[h];
  }
  
  if (remainder > 0) {
    if (result) result += ' و';
    
    if (remainder < 20) {
      result += ones[remainder];
    } else {
      const t = Math.floor(remainder / 10);
      const o = remainder % 10;
      
      if (o > 0) {
        result += ones[o] + ' و' + tens[t];
      } else {
        result += tens[t];
      }
    }
  }
  
  return result;
}

export function numberToArabicWords(num: number): string {
  if (num === 0) return 'صفر';
  if (num < 0) return 'سالب ' + numberToArabicWords(Math.abs(num));
  
  // Round to nearest integer for currency
  num = Math.round(num);
  
  const parts: string[] = [];
  
  // مليارات
  const billions = Math.floor(num / 1000000000);
  if (billions > 0) {
    if (billions === 1) {
      parts.push('مليار');
    } else if (billions === 2) {
      parts.push('ملياران');
    } else if (billions >= 3 && billions <= 10) {
      parts.push(convertHundreds(billions) + ' مليارات');
    } else {
      parts.push(convertHundreds(billions) + ' مليار');
    }
    num %= 1000000000;
  }
  
  // ملايين
  const millions = Math.floor(num / 1000000);
  if (millions > 0) {
    if (millions === 1) {
      parts.push('مليون');
    } else if (millions === 2) {
      parts.push('مليونان');
    } else if (millions >= 3 && millions <= 10) {
      parts.push(convertHundreds(millions) + ' ملايين');
    } else {
      parts.push(convertHundreds(millions) + ' مليون');
    }
    num %= 1000000;
  }
  
  // آلاف
  const thousands = Math.floor(num / 1000);
  if (thousands > 0) {
    if (thousands === 1) {
      parts.push('ألف');
    } else if (thousands === 2) {
      parts.push('ألفان');
    } else if (thousands >= 3 && thousands <= 10) {
      parts.push(convertHundreds(thousands) + ' آلاف');
    } else {
      parts.push(convertHundreds(thousands) + ' ألف');
    }
    num %= 1000;
  }
  
  // مئات وعشرات وآحاد
  if (num > 0) {
    parts.push(convertHundreds(num));
  }
  
  return parts.join(' و');
}

export function numberToArabicCurrency(num: number, currency: string = 'ريال'): string {
  const words = numberToArabicWords(num);
  return `${words} ${currency}`;
}

// نسخة مختصرة للأرقام الكبيرة
export function numberToArabicWordsShort(num: number): string {
  if (num === 0) return 'صفر';
  if (num < 0) return 'سالب ' + numberToArabicWordsShort(Math.abs(num));
  
  num = Math.round(num);
  
  // مليارات
  if (num >= 1000000000) {
    const billions = num / 1000000000;
    const rounded = Math.floor(billions * 10) / 10;
    if (rounded === 1) return 'مليار';
    if (rounded === 2) return 'ملياران';
    return convertHundreds(Math.floor(rounded)) + (rounded >= 3 && rounded <= 10 ? ' مليارات' : ' مليار');
  }
  
  // ملايين
  if (num >= 1000000) {
    const millions = num / 1000000;
    const wholePart = Math.floor(millions);
    const remainder = Math.round((millions - wholePart) * 1000) * 1000;
    
    let result = '';
    if (wholePart === 1) {
      result = 'مليون';
    } else if (wholePart === 2) {
      result = 'مليونان';
    } else if (wholePart >= 3 && wholePart <= 10) {
      result = convertHundreds(wholePart) + ' ملايين';
    } else if (wholePart > 0) {
      result = convertHundreds(wholePart) + ' مليون';
    }
    
    // Add thousands if significant
    if (remainder >= 100000) {
      const thousands = Math.floor(remainder / 1000);
      if (result) result += ' و';
      if (thousands === 100) {
        result += 'مائة ألف';
      } else if (thousands === 200) {
        result += 'مائتا ألف';
      } else if (thousands >= 300 && thousands <= 900 && thousands % 100 === 0) {
        result += hundreds[thousands / 100] + ' ألف';
      } else {
        result += convertHundreds(thousands) + ' ألف';
      }
    }
    
    return result;
  }
  
  // آلاف
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    
    let result = '';
    if (thousands === 1) {
      result = 'ألف';
    } else if (thousands === 2) {
      result = 'ألفان';
    } else if (thousands >= 3 && thousands <= 10) {
      result = convertHundreds(thousands) + ' آلاف';
    } else {
      result = convertHundreds(thousands) + ' ألف';
    }
    
    if (remainder >= 100) {
      result += ' و' + convertHundreds(remainder);
    }
    
    return result;
  }
  
  return convertHundreds(num);
}
