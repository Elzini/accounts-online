/**
 * Module Registration
 * Auto-registers all industry modules on import
 */

import { ModuleRegistry } from '@/core/engine/moduleRegistry';
import { CarDealershipModule } from './carDealership';
import { RealEstateModule } from './realEstate';
import { ConstructionModule } from './construction';
import { GenericModule } from './generic';
import { RestaurantModule } from './restaurant';
import { ExportImportModule } from './exportImport';
import { MedicalModule } from './medical';
import { BookkeepingModule } from './bookkeeping';
import { ManufacturingModule } from './manufacturing';

// Register all modules — each handles its own supportedTypes
ModuleRegistry.register(GenericModule);
ModuleRegistry.register(CarDealershipModule);
ModuleRegistry.register(RealEstateModule);
ModuleRegistry.register(ConstructionModule);
ModuleRegistry.register(RestaurantModule);
ModuleRegistry.register(ExportImportModule);
ModuleRegistry.register(MedicalModule);
ModuleRegistry.register(BookkeepingModule);
ModuleRegistry.register(ManufacturingModule);

export {
  CarDealershipModule,
  RealEstateModule,
  ConstructionModule,
  GenericModule,
  RestaurantModule,
  ExportImportModule,
  MedicalModule,
  BookkeepingModule,
  ManufacturingModule,
};
