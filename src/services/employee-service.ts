'use server';

// This line imports your database connection/query functions.
// ENSURE src/lib/db.ts IS CORRECTLY IMPLEMENTED AND CONFIGURATED TO CONNECT TO YOUR DATABASE.
import { db, query } from '@/lib/db';

interface Employee {
  id: string;
  name: string;
  position: string;
  hourlyWage: string; // Stored as string from frontend, parse before DB insert/update if needed
  fnpfNo: string;
  tinNo: string;
  bankCode: string;
  bankAccountNumber: string;
  paymentMethod: 'cash' | 'online';
  branch: 'labasa' | 'suva';
  fnpfEligible: boolean;
}

// --- Database Interaction Implementation ---

// Function to fetch all employees from the database
export const getEmployees = async (): Promise<Employee[]> => {
  try {
    // This executes the SQL query to get all employees.
    const result = await query('SELECT * FROM employees ORDER BY name ASC');
    // Assuming result.rows contains the employee data array.
    return result.rows as Employee[];
  } catch (error: any) {
    // Log the actual database error on the server.
    console.error('Error fetching employees:', error);
    // Throw a client-friendly error.
    throw new Error('Failed to load employee data.');
  }
};

// Function to add a new employee to the database
export const addEmployee = async (employee: Omit<Employee, 'id'>): Promise<string> => {
  // Destructure employee data for the query.
  const { name, position, hourlyWage, fnpfNo, tinNo, bankCode, bankAccountNumber, paymentMethod, branch, fnpfEligible } = employee;

  try {
    // This executes the SQL INSERT query.
    // It uses parameterized queries ($1, $2, etc.) for safety.
    // RETURNING id gets the database-generated ID for the new row.
    const result = await query(
      `INSERT INTO employees (name, position, hourly_wage, fnpf_no, tin_no, bank_code, bank_account_number, payment_method, branch, fnpf_eligible)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      // The array provides the values corresponding to the placeholders ($1 is name, $2 is position, etc.)
      // parseFloat(hourlyWage) converts the string wage to a number for the database.
      [name, position, parseFloat(hourlyWage), fnpfNo, tinNo, bankCode, bankAccountNumber, paymentMethod, branch, fnpfEligible]
    );

    // Check if the insert was successful and returned an ID.
    if (result.rows.length > 0) {
      const newEmployeeId = result.rows[0].id;
      // Return the generated ID.
      return newEmployeeId;
    } else {
      // If insert worked but didn't return an ID (unexpected for RETURNING).
      console.error('Insert query succeeded but did not return ID.');
      throw new Error('Failed to retrieve ID after insertion.');
    }
  } catch (error: any) {
    // Log the actual database error on the server.
    console.error('Error adding employee:', error);
    // Throw a client-friendly error.
    throw new Error('Failed to save employee data.');
  }
};

// Function to update an existing employee in the database
export const updateEmployee = async (updatedEmployee: Employee): Promise<void> => {
  // Destructure updated employee data.
  const { id, name, position, hourlyWage, fnpfNo, tinNo, bankCode, bankAccountNumber, paymentMethod, branch, fnpfEligible } = updatedEmployee;

  try {
    // This executes the SQL UPDATE query.
    // It updates the row where the ID matches the provided ID.
    await query(
      `UPDATE employees SET
         name = $1, position = $2, hourly_wage = $3, fnpf_no = $4, tin_no = $5,
         bank_code = $6, bank_account_number = $7, payment_method = $8, branch = $9, fnpf_eligible = $10
       WHERE id = $11`,
      // Values array matching the placeholders ($1 is name, ..., $11 is id)
      [name, position, parseFloat(hourlyWage), fnpfNo, tinNo, bankCode, bankAccountNumber, paymentMethod, branch, fnpfEligible, id]
    );
    // If the query completes without error, the update was successful.
  } catch (error: any) {
    // Log the actual database error on the server.
    console.error('Error updating employee:', error);
    // Throw a client-friendly error.
    throw new Error('Failed to update employee.');
  }
};

// Function to delete an employee from the database by ID
export const deleteEmployee = async (employeeId: string): Promise<void> => {
  try {
    // This executes the SQL DELETE query by ID.
    await query('DELETE FROM employees WHERE id = $1', [employeeId]);
    // If the query completes without error, the deletion was successful.
  } catch (error: any) {
    // Log the actual database error on the server.
    console.error('Error deleting employee:', error);
    // Throw a client-friendly error.
    throw new Error('Failed to delete employee.');
  }
};

// Function to get a single employee by ID
// This is useful for pages like /employees/change/[id] to load the employee's data.
export const getEmployeeById = async (id: string): Promise<Employee | null> => {
  try {
    // This executes the SQL query to fetch one employee by their ID.
    const result = await query('SELECT * FROM employees WHERE id = $1', [id]);
    // Check if any row was returned.
    if (result.rows.length > 0) {
      return result.rows[0] as Employee; // Return the first row (the employee object)
    } else {
      return null; // Return null if no employee was found with that ID
    }
  } catch (error: any) {
    // Log the actual database error on the server.
    console.error('Error fetching employee by ID:', error);
    // Throw a client-friendly error.
    throw new Error('Failed to load employee data.');
  }
};