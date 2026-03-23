/**
 * Module Registration
 * Auto-registers all industry modules on import
 */

import { ModuleRegistry } from '@/core/engine/moduleRegistry';
import { CarDealershipModule } from './carDealership';
import { RealEstateModule } from './realEstate';
import { ConstructionModule } from './construction';
import { GenericModule } from './generic';

// Register all modules
ModuleRegistry.register(GenericModule);
ModuleRegistry.register(CarDealershipModule);
ModuleRegistry.register(RealEstateModule);
ModuleRegistry.register(ConstructionModule);

export { CarDealershipModule, RealEstateModule, ConstructionModule, GenericModule };
