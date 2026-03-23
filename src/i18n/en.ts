import { TranslationKeys } from './types';
import { en_core } from './modules/en_core';
import { en_dashboard } from './modules/en_dashboard';
import { en_sales } from './modules/en_sales';
import { en_reports } from './modules/en_reports';
import { en_accounting } from './modules/en_accounting';
import { en_settings } from './modules/en_settings';
import { en_modules } from './modules/en_modules';
import { en_hr } from './modules/en_hr';
import { en_finance } from './modules/en_finance';

export const en: TranslationKeys = {
  ...en_core,
  ...en_dashboard,
  ...en_sales,
  ...en_reports,
  ...en_accounting,
  ...en_settings,
  ...en_modules,
  ...en_hr,
  ...en_finance,
};
