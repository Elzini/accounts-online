import { TranslationKeys } from './types';
import { ar_core } from './modules/ar_core';
import { ar_dashboard } from './modules/ar_dashboard';
import { ar_sales } from './modules/ar_sales';
import { ar_reports } from './modules/ar_reports';
import { ar_accounting } from './modules/ar_accounting';
import { ar_settings } from './modules/ar_settings';
import { ar_modules } from './modules/ar_modules';
import { ar_hr } from './modules/ar_hr';
import { ar_finance } from './modules/ar_finance';

export const ar: TranslationKeys = {
  ...ar_core,
  ...ar_dashboard,
  ...ar_sales,
  ...ar_reports,
  ...ar_accounting,
  ...ar_settings,
  ...ar_modules,
  ...ar_hr,
  ...ar_finance,
};
