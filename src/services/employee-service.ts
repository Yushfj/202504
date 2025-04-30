
'use server';

import { db, query } from '@/lib/db';

interface Employee {
  id: string;
  name: string;
  position: string;
  hourlyWage: string;
  fnpfNo: string;
  tinNo: string;
  bankCode: string;
  bankAccountNumber: string;
  paymentMethod: 'cash' | 'online';
  branch: 'labasa' | 'suva';
  fnpfEligible: boolean;
}

export const getEmployees = async (): Promise<Employee[]> => {
  try {
    const result = await query('SELECT * FROM employees ORDER BY name ASC');
    return result.rows as Employee[];
  } catch (error: any) {
    console.error('Error fetching employees:', error);
    throw new Error('Failed to fetch employees.');
  }
};

export const addEmployee = async (employee: Omit<Employee, 'id'>): Promise<string> => {
  const { name, position, hourlyWage, fnpfNo, tinNo, bankCode, bankAccountNumber, paymentMethod, branch, fnpfEligible } = employee;
  try {
    const result = await query(
      `INSERT INTO employees (name, position, hourly_wage, fnpf_no, tin_no, bank_code, bank_account_number, payment_method, branch, fnpf_eligible)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [name, position, parseFloat(hourlyWage), fnpfNo, tinNo, bankCode, bankAccountNumber, paymentMethod, branch, fnpfEligible]
    );
    if (result.rows.length > 0) {
      return result.rows[0].id;
    } else {
      throw new Error('Failed to retrieve ID after insertion.');
    }
  } catch (error: any) {
    console.error('Error adding employee:', error);
    throw new Error('Failed to add employee.');
  }
};

export const updateEmployee = async (updatedEmployee: Employee): Promise<void> => {
  const { id, name, position, hourlyWage, fnpfNo, tinNo, bankCode, bankAccountNumber, paymentMethod, branch, fnpfEligible } = updatedEmployee;
  try {
    await query(
      `UPDATE employees SET
         name = $1, position = $2, hourly_wage = $3, fnpf_no = $4, tin_no = $5,
         bank_code = $6, bank_account_number = $7, payment_method = $8, branch = $9, fnpf_eligible = $10
       WHERE id = $11`,
      [name, position, parseFloat(hourlyWage), fnpfNo, tinNo, bankCode, bankAccountNumber, paymentMethod, branch, fnpfEligible, id]
    );
  } catch (error: any) {
    console.error('Error updating employee:', error);
    throw new Error('Failed to update employee.');
  }
};

export const deleteEmployee = async (employeeId: string): Promise<void> => {
  try {
    await query('DELETE FROM employees WHERE id = $1', [employeeId]);
  } catch (error: any) {
    console.error('Error deleting employee:', error);
    throw new Error('Failed to delete employee.');
  }
};

// Example function to get a single employee by ID (uncomment and use if needed)
/*
export const getEmployeeById = async (id: string): Promise<Employee | null> => {
  try {
    const result = await query('SELECT * FROM employees WHERE id = $1', [id]);
    if (result.rows.length > 0) {
      return result.rows[0] as Employee;
    } else {
      return null;
    }
  } catch (error: any) {
    console.error('Error fetching employee by ID:', error);
    throw new Error('Failed to fetch employee.');
  }
};
*/