// Re-export everything for backward compatibility
export type { Employee, EmployeeAdvance, PayrollRecord, PayrollItem } from './types';
export { fetchEmployees, addEmployee, updateEmployee, deleteEmployee, fetchEmployeeAdvances, fetchPendingAdvances, addEmployeeAdvance, updateAdvanceDeducted } from './employees';
export { fetchPayrollRecords, fetchPayrollWithItems, createPayrollRecord, generatePayrollItems, refreshPayrollAdvances, updatePayrollItem, updatePayrollTotals, approvePayroll, deletePayroll } from './payrollOperations';
