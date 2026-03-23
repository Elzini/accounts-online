/**
 * Payroll Service - Facade (backward compatibility)
 * All implementations moved to src/services/payroll/ modules.
 */
export type { Employee, EmployeeAdvance, PayrollRecord, PayrollItem } from './payroll/types';
export {
  fetchEmployees, addEmployee, updateEmployee, deleteEmployee,
  fetchEmployeeAdvances, fetchPendingAdvances, addEmployeeAdvance, updateAdvanceDeducted,
} from './payroll/employees';
export {
  fetchPayrollRecords, fetchPayrollWithItems, createPayrollRecord,
  generatePayrollItems, refreshPayrollAdvances, updatePayrollItem,
  updatePayrollTotals, approvePayroll, deletePayroll,
} from './payroll/payrollOperations';
