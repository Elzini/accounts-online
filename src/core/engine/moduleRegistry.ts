/**
 * Core Engine - Module Registry
 * Manages industry-specific modules without hardcoded if/else
 */

import { IndustryModule } from './types';

class ModuleRegistryClass {
  private modules: Map<string, IndustryModule> = new Map();

  /** Register an industry module */
  register(module: IndustryModule): void {
    this.modules.set(module.id, module);
  }

  /** Get module for a company type */
  getForType(companyType: string): IndustryModule | null {
    for (const module of this.modules.values()) {
      if (module.supportedTypes.includes(companyType)) {
        return module;
      }
    }
    return null;
  }

  /** Get all registered modules */
  getAll(): IndustryModule[] {
    return Array.from(this.modules.values());
  }

  /** Check if a company type has a specialized module */
  hasModule(companyType: string): boolean {
    return this.getForType(companyType) !== null;
  }
}

/** Singleton module registry */
export const ModuleRegistry = new ModuleRegistryClass();
