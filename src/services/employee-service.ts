'use server';

// This line imports your database connection/query functions from src/lib/db.ts.
// ENSURE src/lib/db.ts IS CORRECTLY IMPLEMENTED AND CONFIGURED FOR POSTGRESQL.
import { db, query } from '@/lib/db';

interface Employee {
  id: string;
  name: string;
  position: string;
  hourlyWage: string; // Stored as string from frontend, parse before DB insert/update
  fnpfNo: string;
  tinNo: string;
  bankCode: string;
  bankAccountNumber: string;
  paymentMethod: 'cash' | 'online';
  branch: 'labasa' | 'suva';
  fnpfEligible: boolean;
}

// --- Database Interaction Implementation (using src/lib/db.ts for PostgreSQL) ---

// Function to fetch all employees from the database
export const getEmployees = async (): Promise<Employee[]> => {
  try {
    // Executes the SQL query to get all employees from the 'employees' table.
    const result = await query('SELECT * FROM employees ORDER BY name ASC');
    // Returns the fetched rows.
    return result.rows as Employee[];
  } catch (error: any) {
    // Logs the error on the server side.
    console.error('Error fetching employees:', error);
    // Throws an error to the caller.
    throw new Error('Failed to load employee data.');
  }
};

// Function to add a new employee to the database
export const addEmployee = async (employee: Omit<Employee, 'id'>): Promise<string> => {
  const { name, position, hourlyWage, fnpfNo, tinNo, bankCode, bankAccountNumber, paymentMethod, branch, fnpfEligible } = employee;

  try {
    // Executes the SQL INSERT query to add a new employee.
    // Uses parameterized queries ($1, etc.) and gets the generated ID using RETURNING id.
    const result = await query(
      `INSERT INTO employees (name, position, hourly_wage, fnpf_no, tin_no, bank_code, bank_account_number, payment_method, branch, fnpf_eligible)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      // Provides the values for the placeholders. Parses hourlyWage to a number.
      [name, position, parseFloat(hourlyWage), fnpfNo, tinNo, bankCode, bankAccountNumber, paymentMethod, branch, fnpfEligible]
    );

    // Checks if an ID was returned after insertion.
    if (result.rows.length > 0) {
      const newEmployeeId = result.rows[0].id;
      return newEmployeeId; // Returns the generated ID.
    } else {
      console.error('Insert query succeeded but did not return ID.');
      throw new Error('Failed to retrieve ID after insertion.');
    }
  } catch (error: any) {
    console.error('Error adding employee:', error);
    throw new Error('Failed to save employee data.');
  }
};

// Function to update an existing employee in the database
export const updateEmployee = async (updatedEmployee: Employee): Promise<void> => {
  const { id, name, position, hourlyWage, fnpfNo, tinNo, bankCode, bankAccountNumber, paymentMethod, branch, fnpfEligible } = updatedEmployee;

  try {
    // Executes the SQL UPDATE query for a specific employee by ID.
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

// Function to delete an employee from the database by ID
export const deleteEmployee = async (employeeId: string): Promise<void> => {
  try {
    // Executes the SQL DELETE query for a specific employee by ID.
    await query('DELETE FROM employees WHERE id = $1', [employeeId]);
  } catch (error: any) {
    console.error('Error deleting employee:', error);
    throw new Error('Failed to delete employee.');
  }
};

// Function to get a single employee by ID
// This is useful for pages like /employees/change/[id] to load the employee's data.
export const getEmployeeById = async (id: string): Promise<Employee | null> => {
  try {
    // Executes the SQL query to fetch one employee by their ID.
    const result = await query('SELECT * FROM employees WHERE id = $1', [id]);
    if (result.rows.length > 0) {
      return result.rows[0] as Employee; // Returns the first row (the employee object) if found.
    } else {
      return null; // Returns null if no employee was found with that ID.
    }
  } catch (error: any) {
    console.error('Error fetching employee by ID:', error);
    throw new Error('Failed to load employee data.');
  }
};