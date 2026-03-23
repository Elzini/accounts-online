/**
 * Module Registration
 * Auto-registers all industry modules on import
 */

import { ModuleRegistry } from '@/core/engine/moduleRegistry';
import { CarDealershipModule } from './carDealership';
import { RealEstateModule } from './realEstate';
import { GenericModule } from './generic';

// Register all modules
ModuleRegistry.register(GenericModule);
ModuleRegistry.register(CarDealershipModule);
ModuleRegistry.register(RealEstateModule);

export { CarDealershipModule, RealEstateModule, GenericModule };
