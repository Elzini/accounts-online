
import ExcelJS from 'exceljs';

interface COAAccount {
  code: string;
  name: string;
  parentCode: string;
  type: string;
  nature: string; // مدين أو دائن
  level: number;
}

const realEstateCOA: COAAccount[] = [
  // ==================== 1000 الأصول (مدين) ====================
  { code: '1000', name: 'الأصول', parentCode: '', type: 'أصول', nature: 'مدين', level: 0 },
  { code: '1100', name: 'الأصول المتداولة', parentCode: '1000', type: 'أصول', nature: 'مدين', level: 1 },
  { code: '1110', name: 'الصندوق', parentCode: '1100', type: 'أصول', nature: 'مدين', level: 2 },
  { code: '1111', name: 'صندوق رئيسي', parentCode: '1110', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1112', name: 'صندوق الموقع', parentCode: '1110', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1120', name: 'البنوك', parentCode: '1100', type: 'أصول', nature: 'مدين', level: 2 },
  { code: '1121', name: 'بنك – حساب جاري', parentCode: '1120', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1122', name: 'بنك – حساب المشاريع', parentCode: '1120', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1123', name: 'بنك – حساب الضمانات', parentCode: '1120', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1124', name: 'بنك – حساب الدفعات المقدمة', parentCode: '1120', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1125', name: 'بنك – حساب وافي (Escrow)', parentCode: '1120', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1130', name: 'العملاء', parentCode: '1100', type: 'أصول', nature: 'مدين', level: 2 },
  { code: '1131', name: 'عملاء بيع شقق', parentCode: '1130', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1132', name: 'عملاء بيع فلل', parentCode: '1130', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1133', name: 'عملاء بيع أراضي', parentCode: '1130', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1134', name: 'عملاء حجز وحدات', parentCode: '1130', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1135', name: 'عملاء بيع تجاري', parentCode: '1130', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1136', name: 'عملاء بيع عمائر', parentCode: '1130', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1140', name: 'أوراق قبض', parentCode: '1100', type: 'أصول', nature: 'مدين', level: 2 },
  { code: '1141', name: 'شيكات تحت التحصيل', parentCode: '1140', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1142', name: 'كمبيالات', parentCode: '1140', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1143', name: 'ضمانات بنكية مقدمة', parentCode: '1140', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1150', name: 'دفعات مقدمة للموردين', parentCode: '1100', type: 'أصول', nature: 'مدين', level: 2 },
  { code: '1151', name: 'دفعات مقدمة لمقاولين', parentCode: '1150', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1152', name: 'دفعات مقدمة لموردي مواد', parentCode: '1150', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1160', name: 'عهد موظفين', parentCode: '1100', type: 'أصول', nature: 'مدين', level: 2 },
  { code: '1170', name: 'ذمم موظفين', parentCode: '1100', type: 'أصول', nature: 'مدين', level: 2 },
  { code: '1180', name: 'ضريبة قيمة مضافة قابلة للاسترداد', parentCode: '1100', type: 'أصول', nature: 'مدين', level: 2 },
  { code: '1181', name: 'ضريبة مدخلات مشاريع', parentCode: '1180', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1182', name: 'ضريبة مدخلات إدارية', parentCode: '1180', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1183', name: 'ضريبة مدخلات مقاولين', parentCode: '1180', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1184', name: 'ضريبة تصرفات عقارية مدفوعة', parentCode: '1180', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1185', name: 'ضريبة مدخلات أصول ثابتة', parentCode: '1180', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1190', name: 'مصروفات مدفوعة مقدماً', parentCode: '1100', type: 'أصول', nature: 'مدين', level: 2 },
  { code: '1191', name: 'إيجار مدفوع مقدماً', parentCode: '1190', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1192', name: 'تأمين مدفوع مقدماً', parentCode: '1190', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1193', name: 'رخص تجارية مدفوعة مقدماً', parentCode: '1190', type: 'أصول', nature: 'مدين', level: 3 },

  // المخزون العقاري
  { code: '1200', name: 'المخزون العقاري', parentCode: '1000', type: 'أصول', nature: 'مدين', level: 1 },
  { code: '1210', name: 'أراضي مشاريع', parentCode: '1200', type: 'أصول', nature: 'مدين', level: 2 },
  { code: '1211', name: 'أرض مشروع 1', parentCode: '1210', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1212', name: 'أرض مشروع 2', parentCode: '1210', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1220', name: 'مشاريع تحت التطوير', parentCode: '1200', type: 'أصول', nature: 'مدين', level: 2 },
  { code: '1221', name: 'تكلفة الأرض', parentCode: '1220', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1222', name: 'أعمال الحفر', parentCode: '1220', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1223', name: 'أعمال الأساسات', parentCode: '1220', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1224', name: 'الهيكل الإنشائي', parentCode: '1220', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1225', name: 'أعمال الخرسانة', parentCode: '1220', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1226', name: 'أعمال البناء', parentCode: '1220', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1227', name: 'الكهرباء', parentCode: '1220', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1228', name: 'السباكة', parentCode: '1220', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1229', name: 'التكييف', parentCode: '1220', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1230', name: 'التشطيبات', parentCode: '1220', type: 'أصول', nature: 'مدين', level: 2 },
  { code: '1231', name: 'تشطيبات داخلية', parentCode: '1230', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1232', name: 'تشطيبات خارجية', parentCode: '1230', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1233', name: 'دهانات', parentCode: '1230', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1234', name: 'أعمال ألمنيوم وزجاج', parentCode: '1230', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1240', name: 'المصاعد', parentCode: '1220', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1241', name: 'أنظمة السلامة', parentCode: '1220', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1242', name: 'أنظمة الحريق', parentCode: '1220', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1243', name: 'تنسيق حدائق ومسطحات خضراء', parentCode: '1220', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1244', name: 'أنظمة ذكية وأتمتة المباني', parentCode: '1220', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1245', name: 'أعمال البنية التحتية', parentCode: '1220', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1246', name: 'شبكات الصرف الصحي والأمطار', parentCode: '1220', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1250', name: 'الإشراف الهندسي', parentCode: '1220', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1251', name: 'استشارات هندسية', parentCode: '1220', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1252', name: 'مخططات وتصميم', parentCode: '1220', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1253', name: 'فحوصات تربة واختبارات', parentCode: '1220', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1260', name: 'تراخيص البلدية', parentCode: '1220', type: 'أصول', nature: 'مدين', level: 2 },
  { code: '1261', name: 'رسوم رخص البناء', parentCode: '1260', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1262', name: 'رسوم الخدمات', parentCode: '1260', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1263', name: 'رسوم إيصال كهرباء', parentCode: '1260', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1264', name: 'رسوم إيصال مياه وصرف', parentCode: '1260', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1270', name: 'مواد بناء للمشاريع', parentCode: '1200', type: 'أصول', nature: 'مدين', level: 2 },
  { code: '1271', name: 'حديد', parentCode: '1270', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1272', name: 'أسمنت', parentCode: '1270', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1273', name: 'مواد كهرباء', parentCode: '1270', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1274', name: 'مواد سباكة', parentCode: '1270', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1275', name: 'خرسانة جاهزة', parentCode: '1270', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1276', name: 'مواد تشطيب', parentCode: '1270', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1280', name: 'وحدات جاهزة للبيع', parentCode: '1200', type: 'أصول', nature: 'مدين', level: 2 },
  { code: '1281', name: 'شقق جاهزة للبيع', parentCode: '1280', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1282', name: 'فلل جاهزة للبيع', parentCode: '1280', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1283', name: 'أراضي جاهزة للبيع', parentCode: '1280', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1284', name: 'وحدات تجارية جاهزة للبيع', parentCode: '1280', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1285', name: 'عمائر جاهزة للبيع', parentCode: '1280', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1290', name: 'وحدات محجوزة للعملاء', parentCode: '1200', type: 'أصول', nature: 'مدين', level: 2 },

  // الأصول الثابتة
  { code: '1300', name: 'الأصول الثابتة', parentCode: '1000', type: 'أصول', nature: 'مدين', level: 1 },
  { code: '1310', name: 'مباني إدارية', parentCode: '1300', type: 'أصول', nature: 'مدين', level: 2 },
  { code: '1320', name: 'سيارات', parentCode: '1300', type: 'أصول', nature: 'مدين', level: 2 },
  { code: '1330', name: 'أثاث مكتبي', parentCode: '1300', type: 'أصول', nature: 'مدين', level: 2 },
  { code: '1340', name: 'أجهزة كمبيوتر', parentCode: '1300', type: 'أصول', nature: 'مدين', level: 2 },
  { code: '1350', name: 'معدات مواقع', parentCode: '1300', type: 'أصول', nature: 'مدين', level: 2 },
  { code: '1360', name: 'مجمع الإهلاك', parentCode: '1300', type: 'أصول', nature: 'دائن', level: 2 },
  { code: '1361', name: 'مجمع إهلاك مباني', parentCode: '1360', type: 'أصول', nature: 'دائن', level: 3 },
  { code: '1362', name: 'مجمع إهلاك سيارات', parentCode: '1360', type: 'أصول', nature: 'دائن', level: 3 },
  { code: '1363', name: 'مجمع إهلاك أثاث', parentCode: '1360', type: 'أصول', nature: 'دائن', level: 3 },
  { code: '1364', name: 'مجمع إهلاك أجهزة', parentCode: '1360', type: 'أصول', nature: 'دائن', level: 3 },
  { code: '1365', name: 'مجمع إهلاك معدات', parentCode: '1360', type: 'أصول', nature: 'دائن', level: 3 },
  { code: '1370', name: 'أصول غير ملموسة', parentCode: '1300', type: 'أصول', nature: 'مدين', level: 2 },
  { code: '1371', name: 'برمجيات وأنظمة', parentCode: '1370', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1372', name: 'حقوق انتفاع', parentCode: '1370', type: 'أصول', nature: 'مدين', level: 3 },

  // أصول أخرى
  { code: '1400', name: 'أصول أخرى', parentCode: '1000', type: 'أصول', nature: 'مدين', level: 1 },
  { code: '1410', name: 'تأمينات مستردة', parentCode: '1400', type: 'أصول', nature: 'مدين', level: 2 },
  { code: '1420', name: 'استثمارات طويلة الأجل', parentCode: '1400', type: 'أصول', nature: 'مدين', level: 2 },
  { code: '1421', name: 'استثمارات في شركات تابعة', parentCode: '1420', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1422', name: 'استثمارات في مشاريع مشتركة', parentCode: '1420', type: 'أصول', nature: 'مدين', level: 3 },
  { code: '1430', name: 'مصروفات تأسيس', parentCode: '1400', type: 'أصول', nature: 'مدين', level: 2 },
  { code: '1440', name: 'شهرة محل', parentCode: '1400', type: 'أصول', nature: 'مدين', level: 2 },

  // ==================== 2000 الخصوم (دائن) ====================
  { code: '2000', name: 'الخصوم', parentCode: '', type: 'خصوم', nature: 'دائن', level: 0 },
  { code: '2100', name: 'الخصوم المتداولة', parentCode: '2000', type: 'خصوم', nature: 'دائن', level: 1 },
  { code: '2110', name: 'الموردون', parentCode: '2100', type: 'خصوم', nature: 'دائن', level: 2 },
  { code: '2111', name: 'موردو مواد البناء', parentCode: '2110', type: 'خصوم', nature: 'دائن', level: 3 },
  { code: '2112', name: 'مقاولون', parentCode: '2110', type: 'خصوم', nature: 'دائن', level: 3 },
  { code: '2113', name: 'موردو خدمات هندسية', parentCode: '2110', type: 'خصوم', nature: 'دائن', level: 3 },
  { code: '2114', name: 'مقاولو باطن', parentCode: '2110', type: 'خصوم', nature: 'دائن', level: 3 },
  { code: '2115', name: 'محتجزات ضمان مقاولين', parentCode: '2110', type: 'خصوم', nature: 'دائن', level: 3 },
  { code: '2120', name: 'دفعات مقدمة من العملاء', parentCode: '2100', type: 'خصوم', nature: 'دائن', level: 2 },
  { code: '2121', name: 'دفعات حجز وحدات', parentCode: '2120', type: 'خصوم', nature: 'دائن', level: 3 },
  { code: '2122', name: 'دفعات بيع على الخارطة (وافي)', parentCode: '2120', type: 'خصوم', nature: 'دائن', level: 3 },
  { code: '2123', name: 'أقساط عملاء مقدمة', parentCode: '2120', type: 'خصوم', nature: 'دائن', level: 3 },
  { code: '2130', name: 'رواتب مستحقة', parentCode: '2100', type: 'خصوم', nature: 'دائن', level: 2 },
  { code: '2140', name: 'مصروفات مستحقة', parentCode: '2100', type: 'خصوم', nature: 'دائن', level: 2 },
  { code: '2145', name: 'أوراق دفع', parentCode: '2100', type: 'خصوم', nature: 'دائن', level: 2 },
  { code: '2146', name: 'شيكات مؤجلة للموردين', parentCode: '2145', type: 'خصوم', nature: 'دائن', level: 3 },
  { code: '2150', name: 'ضريبة القيمة المضافة المستحقة', parentCode: '2100', type: 'خصوم', nature: 'دائن', level: 2 },
  { code: '2155', name: 'حساب تسوية ضريبة القيمة المضافة', parentCode: '2100', type: 'خصوم', nature: 'دائن', level: 2 },
  { code: '2156', name: 'ضريبة التصرفات العقارية المستحقة', parentCode: '2100', type: 'خصوم', nature: 'دائن', level: 2 },
  { code: '2157', name: 'إعفاء المسكن الأول - وزارة الإسكان', parentCode: '2100', type: 'خصوم', nature: 'دائن', level: 2 },
  { code: '2160', name: 'التأمينات الاجتماعية', parentCode: '2100', type: 'خصوم', nature: 'دائن', level: 2 },
  { code: '2170', name: 'جاري الشركاء', parentCode: '2100', type: 'خصوم', nature: 'دائن', level: 2 },
  { code: '2180', name: 'مخصص الزكاة', parentCode: '2100', type: 'خصوم', nature: 'دائن', level: 2 },
  { code: '2190', name: 'مخصص مكافأة نهاية الخدمة', parentCode: '2100', type: 'خصوم', nature: 'دائن', level: 2 },
  { code: '2191', name: 'مخصص ضمان صيانة', parentCode: '2100', type: 'خصوم', nature: 'دائن', level: 2 },
  { code: '2192', name: 'مخصص خسائر متوقعة', parentCode: '2100', type: 'خصوم', nature: 'دائن', level: 2 },
  { code: '2200', name: 'خصوم طويلة الأجل', parentCode: '2000', type: 'خصوم', nature: 'دائن', level: 1 },
  { code: '2210', name: 'قروض بنكية طويلة الأجل', parentCode: '2200', type: 'خصوم', nature: 'دائن', level: 2 },
  { code: '2220', name: 'تمويل مشاريع', parentCode: '2200', type: 'خصوم', nature: 'دائن', level: 2 },
  { code: '2225', name: 'مرابحة عقارية', parentCode: '2200', type: 'خصوم', nature: 'دائن', level: 2 },
  { code: '2230', name: 'التزامات عقود التمويل', parentCode: '2200', type: 'خصوم', nature: 'دائن', level: 2 },
  { code: '2235', name: 'تمويل صندوق التنمية العقاري', parentCode: '2200', type: 'خصوم', nature: 'دائن', level: 2 },
  { code: '2240', name: 'صكوك تمويل', parentCode: '2200', type: 'خصوم', nature: 'دائن', level: 2 },

  // ==================== 3000 حقوق الملكية (دائن) ====================
  { code: '3000', name: 'حقوق الملكية', parentCode: '', type: 'حقوق ملكية', nature: 'دائن', level: 0 },
  { code: '3100', name: 'رأس المال', parentCode: '3000', type: 'حقوق ملكية', nature: 'دائن', level: 1 },
  { code: '3110', name: 'احتياطي نظامي', parentCode: '3000', type: 'حقوق ملكية', nature: 'دائن', level: 1 },
  { code: '3120', name: 'احتياطي اختياري', parentCode: '3000', type: 'حقوق ملكية', nature: 'دائن', level: 1 },
  { code: '3130', name: 'الأرباح المبقاة', parentCode: '3000', type: 'حقوق ملكية', nature: 'دائن', level: 1 },
  { code: '3140', name: 'صافي الربح أو الخسارة', parentCode: '3000', type: 'حقوق ملكية', nature: 'دائن', level: 1 },
  { code: '3150', name: 'جاري المالك', parentCode: '3000', type: 'حقوق ملكية', nature: 'دائن', level: 1 },
  { code: '3160', name: 'أرباح موزعة', parentCode: '3000', type: 'حقوق ملكية', nature: 'مدين', level: 1 },

  // ==================== 4000 الإيرادات (دائن) ====================
  { code: '4000', name: 'الإيرادات', parentCode: '', type: 'إيرادات', nature: 'دائن', level: 0 },
  { code: '4100', name: 'إيرادات بيع أراضي', parentCode: '4000', type: 'إيرادات', nature: 'دائن', level: 1 },
  { code: '4110', name: 'إيرادات بيع شقق', parentCode: '4000', type: 'إيرادات', nature: 'دائن', level: 1 },
  { code: '4120', name: 'إيرادات بيع فلل', parentCode: '4000', type: 'إيرادات', nature: 'دائن', level: 1 },
  { code: '4130', name: 'إيرادات بيع عمائر', parentCode: '4000', type: 'إيرادات', nature: 'دائن', level: 1 },
  { code: '4140', name: 'إيرادات خدمات تطوير', parentCode: '4000', type: 'إيرادات', nature: 'دائن', level: 1 },
  { code: '4150', name: 'إيرادات إيجار مؤقت', parentCode: '4000', type: 'إيرادات', nature: 'دائن', level: 1 },
  { code: '4160', name: 'إيرادات أخرى', parentCode: '4000', type: 'إيرادات', nature: 'دائن', level: 1 },
  { code: '4170', name: 'إيرادات إدارة أملاك', parentCode: '4000', type: 'إيرادات', nature: 'دائن', level: 1 },
  { code: '4180', name: 'إيرادات وساطة عقارية', parentCode: '4000', type: 'إيرادات', nature: 'دائن', level: 1 },
  { code: '4190', name: 'إيرادات بيع وحدات تجارية', parentCode: '4000', type: 'إيرادات', nature: 'دائن', level: 1 },
  { code: '4200', name: 'إيرادات استثمارية', parentCode: '4000', type: 'إيرادات', nature: 'دائن', level: 1 },
  { code: '4210', name: 'إيرادات مرابحات تمويلية', parentCode: '4000', type: 'إيرادات', nature: 'دائن', level: 1 },
  { code: '4900', name: 'خصومات مبيعات', parentCode: '4000', type: 'إيرادات', nature: 'مدين', level: 1 },
  { code: '4910', name: 'مردودات مبيعات', parentCode: '4000', type: 'إيرادات', nature: 'مدين', level: 1 },

  // ==================== 5000 تكلفة المبيعات (مدين) ====================
  { code: '5000', name: 'تكلفة المبيعات', parentCode: '', type: 'مصروفات', nature: 'مدين', level: 0 },
  { code: '5100', name: 'تكلفة أراضي مباعة', parentCode: '5000', type: 'مصروفات', nature: 'مدين', level: 1 },
  { code: '5110', name: 'تكلفة البناء', parentCode: '5000', type: 'مصروفات', nature: 'مدين', level: 1 },
  { code: '5120', name: 'تكلفة مواد البناء', parentCode: '5000', type: 'مصروفات', nature: 'مدين', level: 1 },
  { code: '5130', name: 'تكلفة المقاولين', parentCode: '5000', type: 'مصروفات', nature: 'مدين', level: 1 },
  { code: '5140', name: 'تكلفة التصميم الهندسي', parentCode: '5000', type: 'مصروفات', nature: 'مدين', level: 1 },
  { code: '5150', name: 'تكلفة التراخيص', parentCode: '5000', type: 'مصروفات', nature: 'مدين', level: 1 },
  { code: '5160', name: 'تكلفة الإشراف الهندسي', parentCode: '5000', type: 'مصروفات', nature: 'مدين', level: 1 },
  { code: '5170', name: 'تكلفة إيصال الخدمات', parentCode: '5000', type: 'مصروفات', nature: 'مدين', level: 1 },
  { code: '5180', name: 'تكلفة تمويل رأسمالية (IAS 23)', parentCode: '5000', type: 'مصروفات', nature: 'مدين', level: 1 },
  { code: '5190', name: 'تكلفة ضريبة التصرفات العقارية', parentCode: '5000', type: 'مصروفات', nature: 'مدين', level: 1 },

  // ==================== 6000 المصروفات التشغيلية (مدين) ====================
  { code: '6000', name: 'المصروفات التشغيلية', parentCode: '', type: 'مصروفات', nature: 'مدين', level: 0 },
  { code: '6100', name: 'مصروفات إدارية', parentCode: '6000', type: 'مصروفات', nature: 'مدين', level: 1 },
  { code: '6110', name: 'رواتب الموظفين', parentCode: '6100', type: 'مصروفات', nature: 'مدين', level: 2 },
  { code: '6111', name: 'بدلات سكن ونقل', parentCode: '6100', type: 'مصروفات', nature: 'مدين', level: 2 },
  { code: '6112', name: 'تأمين طبي', parentCode: '6100', type: 'مصروفات', nature: 'مدين', level: 2 },
  { code: '6113', name: 'حصة الشركة في التأمينات', parentCode: '6100', type: 'مصروفات', nature: 'مدين', level: 2 },
  { code: '6120', name: 'إيجار المكتب', parentCode: '6100', type: 'مصروفات', nature: 'مدين', level: 2 },
  { code: '6130', name: 'كهرباء ومياه', parentCode: '6100', type: 'مصروفات', nature: 'مدين', level: 2 },
  { code: '6140', name: 'إنترنت واتصالات', parentCode: '6100', type: 'مصروفات', nature: 'مدين', level: 2 },
  { code: '6150', name: 'قرطاسية', parentCode: '6100', type: 'مصروفات', nature: 'مدين', level: 2 },
  { code: '6155', name: 'رسوم حكومية وتراخيص', parentCode: '6100', type: 'مصروفات', nature: 'مدين', level: 2 },
  { code: '6160', name: 'استشارات قانونية', parentCode: '6100', type: 'مصروفات', nature: 'مدين', level: 2 },
  { code: '6170', name: 'محاسبة ومراجعة', parentCode: '6100', type: 'مصروفات', nature: 'مدين', level: 2 },
  { code: '6180', name: 'تدريب وتطوير موظفين', parentCode: '6100', type: 'مصروفات', nature: 'مدين', level: 2 },
  { code: '6200', name: 'مصروفات تسويق', parentCode: '6000', type: 'مصروفات', nature: 'مدين', level: 1 },
  { code: '6210', name: 'إعلانات عقارية', parentCode: '6200', type: 'مصروفات', nature: 'مدين', level: 2 },
  { code: '6220', name: 'عمولات بيع', parentCode: '6200', type: 'مصروفات', nature: 'مدين', level: 2 },
  { code: '6230', name: 'تسويق إلكتروني', parentCode: '6200', type: 'مصروفات', nature: 'مدين', level: 2 },
  { code: '6240', name: 'معارض عقارية', parentCode: '6200', type: 'مصروفات', nature: 'مدين', level: 2 },
  { code: '6250', name: 'عمولات وسطاء عقاريين', parentCode: '6200', type: 'مصروفات', nature: 'مدين', level: 2 },
  { code: '6300', name: 'مصروفات تشغيلية أخرى', parentCode: '6000', type: 'مصروفات', nature: 'مدين', level: 1 },
  { code: '6310', name: 'صيانة', parentCode: '6300', type: 'مصروفات', nature: 'مدين', level: 2 },
  { code: '6320', name: 'نقل', parentCode: '6300', type: 'مصروفات', nature: 'مدين', level: 2 },
  { code: '6330', name: 'تأمين', parentCode: '6300', type: 'مصروفات', nature: 'مدين', level: 2 },
  { code: '6340', name: 'مصروف الإهلاك', parentCode: '6300', type: 'مصروفات', nature: 'مدين', level: 2 },
  { code: '6350', name: 'مصروف مكافأة نهاية الخدمة', parentCode: '6300', type: 'مصروفات', nature: 'مدين', level: 2 },
  { code: '6355', name: 'سفر وإقامة', parentCode: '6300', type: 'مصروفات', nature: 'مدين', level: 2 },
  { code: '6360', name: 'ضيافة واستقبال', parentCode: '6300', type: 'مصروفات', nature: 'مدين', level: 2 },
  { code: '6370', name: 'اشتراكات مهنية', parentCode: '6300', type: 'مصروفات', nature: 'مدين', level: 2 },
  { code: '6380', name: 'مصروف الزكاة', parentCode: '6300', type: 'مصروفات', nature: 'مدين', level: 2 },
  { code: '6400', name: 'مصروفات مالية', parentCode: '6000', type: 'مصروفات', nature: 'مدين', level: 1 },
  { code: '6410', name: 'فوائد القروض', parentCode: '6400', type: 'مصروفات', nature: 'مدين', level: 2 },
  { code: '6420', name: 'رسوم بنكية', parentCode: '6400', type: 'مصروفات', nature: 'مدين', level: 2 },
  { code: '6430', name: 'غرامات وجزاءات ضريبية', parentCode: '6400', type: 'مصروفات', nature: 'مدين', level: 2 },
  { code: '6440', name: 'فروقات عملة', parentCode: '6400', type: 'مصروفات', nature: 'مدين', level: 2 },
  { code: '6500', name: 'خسائر انخفاض قيمة', parentCode: '6000', type: 'مصروفات', nature: 'مدين', level: 1 },
  { code: '6510', name: 'خسائر انخفاض قيمة أصول عقارية', parentCode: '6500', type: 'مصروفات', nature: 'مدين', level: 2 },
  { code: '6520', name: 'خسائر انخفاض قيمة ذمم عملاء', parentCode: '6500', type: 'مصروفات', nature: 'مدين', level: 2 },
];

export function exportRealEstateCOAToExcel() {
  const data = realEstateCOA.map(account => {
    const indent = '  '.repeat(account.level);
    return {
      'رقم الحساب': account.code,
      'اسم الحساب': indent + account.name,
      'الحساب الرئيسي': account.parentCode,
      'التصنيف': account.type,
      'الطبيعة (مدين/دائن)': account.nature,
      'المستوى': account.level,
    };
  });

  const ws = XLSX.utils.json_to_sheet(data, { header: [
    'رقم الحساب',
    'اسم الحساب', 
    'الحساب الرئيسي',
    'التصنيف',
    'الطبيعة (مدين/دائن)',
    'المستوى',
  ]});

  // تعديل عرض الأعمدة
  ws['!cols'] = [
    { wch: 15 },  // رقم الحساب
    { wch: 45 },  // اسم الحساب
    { wch: 15 },  // الحساب الرئيسي
    { wch: 15 },  // التصنيف
    { wch: 18 },  // الطبيعة
    { wch: 10 },  // المستوى
  ];

  // RTL
  ws['!dir'] = 'rtl';

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'شجرة الحسابات');

  XLSX.writeFile(wb, 'شجرة_حسابات_التطوير_العقاري.xlsx');
}
