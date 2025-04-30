
// src/app/employees/change/page.tsx
import { Suspense } from 'react';
// Assuming you put the component that uses useSearchParams in this file:
import ChangeEmployeeForm from './ChangeEmployeeForm';

// You can keep any Server Component logic or data fetching here

export default function ChangeEmployeePage() {
  return (
    <div>
      <h1>Change Employee</h1>
      {/* Wrap the component that uses useSearchParams in Suspense */}
      {/* Add a fallback element to display while the client component loads */}
      <Suspense fallback={<div>Loading employee details...</div>}>
        <ChangeEmployeeForm />
      </Suspense>
    </div>
  );
}