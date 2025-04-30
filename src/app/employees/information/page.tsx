
'use client';

import Image from 'next/image';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {useEffect, useState} from 'react';
import {Trash2, Edit, Home, ArrowLeft} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useToast} from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getEmployees, deleteEmployee } from '@/services/employee-service'; // Import service functions

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

const EmployeeInformationPage = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const {toast} = useToast();
  const [deletePassword, setDeletePassword] = useState('');
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null); // Store ID of employee to delete
  const ADMIN_PASSWORD = 'admin01'; // Store this securely in a real application
  const router = useRouter();

  // Fetch employees when the component mounts
  useEffect(() => {
    fetchEmployees();
  }, []); // Empty dependency array ensures this runs only once on mount

  const fetchEmployees = async () => {
      try {
        const fetchedEmployees = await getEmployees(); // Fetch from service
        setEmployees(fetchedEmployees);
      } catch (error: any) {
        console.error("Error fetching employees:", error);
        toast({
          title: 'Error',
          description: 'Failed to load employee data.',
          variant: 'destructive',
        });
      }
    };


  const handleDeleteEmployee = async () => { // Make async
    if (deletePassword !== ADMIN_PASSWORD) {
      toast({
        title: 'Error',
        description: 'Incorrect password. Please try again.',
        variant: 'destructive',
      });
      setDeletePassword(''); // Clear password input
      return;
    }

    if (!employeeToDelete) return; // Safety check

    try {
      await deleteEmployee(employeeToDelete); // Call service to delete
      setEmployees(prevEmployees => prevEmployees.filter(emp => emp.id !== employeeToDelete)); // Update state immediately

      toast({
        title: 'Success',
        description: 'Employee deleted successfully!',
      });
    } catch (error: any) {
      console.error('Error deleting employee:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete employee.',
        variant: 'destructive',
      });
    } finally {
      setEmployeeToDelete(null); // Reset employee to delete
      setDeletePassword(''); // Clear password
      // Close the dialog manually - Assuming AlertDialog closes itself on action
      const cancelBtn = document.getElementById(`cancel-delete-${employeeToDelete}`) as HTMLElement | null;
      if (cancelBtn) {
         cancelBtn.click(); // Simulate click to close
      }
    }
  };


  const labasaEmployees = employees.filter(employee => employee.branch === 'labasa');
  const suvaEmployees = employees.filter(employee => employee.branch === 'suva');

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen font-sans text-white">
      {/* Background Image */}
      <Image
        src="/red-and-black-gaming-wallpapers-top-red-and-black-lightning-dark-gamer.jpg" // Path to your image
        alt="Background Image"
        fill // Use fill layout
        style={{objectFit: 'cover'}} // Use style for objectFit
        className="absolute top-0 left-0 w-full h-full -z-10"
        priority
      />

      {/* Overlay for better readability */}
      <div className="absolute top-0 left-0 w-full h-full bg-black opacity-50 -z-9" />

      {/* Content */}
       <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col flex-grow items-center">

         {/* Header */}
         <header className="w-full py-4 flex justify-between items-center border-b border-white/20 mb-8 sm:mb-10">
            <Link href="/employees" passHref>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                    <ArrowLeft className="h-5 w-5" />
                    <span className="sr-only">Back to Employee Management</span>
                </Button>
            </Link>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-center text-gray-100 flex-grow">
                Employee Information
            </h1>
            <Link href="/dashboard" passHref>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                    <Home className="h-5 w-5" />
                    <span className="sr-only">Dashboard</span>
                </Button>
            </Link>
        </header>

        {/* Main Content Area */}
        <main className="w-full flex-grow overflow-y-auto pb-16">
            {employees.length === 0 ? (
                <Card className="w-full max-w-md mx-auto mt-10 bg-transparent backdrop-blur-md shadow-lg rounded-lg border border-accent/40">
                     <CardContent className="p-6">
                        <p className="text-white text-center">No employee information available. Please add employees first.</p>
                         <div className="mt-4 text-center">
                            <Button asChild variant="gradient">
                                <Link href="/employees/create">Add New Employee</Link>
                            </Button>
                         </div>
                    </CardContent>
                </Card>
            ) : (
                 <div className="space-y-8">
                    {/* Labasa Branch Employees */}
                    {labasaEmployees.length > 0 && (
                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4 text-center bg-black/30 backdrop-blur-sm py-2 rounded-md border border-white/15">Labasa Branch Employees</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {labasaEmployees.map((employee) => (
                                    <Card key={employee.id} className="bg-secondary/30 backdrop-blur-sm border border-white/10 rounded-lg text-white shadow-md relative overflow-hidden">
                                         <CardHeader className="pt-4 pb-2 px-4 flex flex-row justify-end items-center space-x-1 absolute top-1 right-1 z-10">
                                              <Link href={`/employees/change?id=${employee.id}`} className="mr-1">
                                                 <Button
                                                     variant="ghost"
                                                     size="icon"
                                                     className="text-blue-300 hover:text-blue-100 hover:bg-white/20 h-7 w-7"
                                                     aria-label={`Edit ${employee.name}`}
                                                 >
                                                     <Edit className="h-4 w-4" />
                                                 </Button>
                                             </Link>
                                             <AlertDialog>
                                                 <AlertDialogTrigger asChild>
                                                     <Button
                                                         variant="ghost"
                                                         size="icon"
                                                         onClick={() => setEmployeeToDelete(employee.id)} // Set the employee to delete on trigger click
                                                         className="text-red-400 hover:text-red-200 hover:bg-white/20 h-7 w-7"
                                                         aria-label={`Delete ${employee.name}`}
                                                     >
                                                         <Trash2 className="h-4 w-4" />
                                                     </Button>
                                                 </AlertDialogTrigger>
                                                 <AlertDialogContent className="bg-gray-900 border-white/20 text-white">
                                                     <AlertDialogHeader>
                                                         <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                                                         <AlertDialogDescription className="text-gray-300">
                                                             Are you sure you want to delete {employee.name}?
                                                             This action cannot be undone.
                                                             Please enter the admin password to confirm.
                                                         </AlertDialogDescription>
                                                     </AlertDialogHeader>
                                                     <div className="grid gap-2">
                                                         <Label htmlFor={`password-${employee.id}`} className="text-gray-300">Admin Password</Label>
                                                         <Input
                                                             id={`password-${employee.id}`}
                                                             type="password"
                                                             value={deletePassword}
                                                             onChange={(e) => setDeletePassword(e.target.value)}
                                                             className="bg-gray-800 border-white/20 text-white"
                                                         />
                                                     </div>
                                                     <AlertDialogFooter>
                                                         <AlertDialogCancel
                                                            id={`cancel-delete-${employee.id}`} // Add ID for closing
                                                            className="border-white/20 text-white hover:bg-white/10"
                                                            onClick={() => { setDeletePassword(''); setEmployeeToDelete(null); }}> {/* Clear password and employee ID on cancel */}
                                                            Cancel
                                                            </AlertDialogCancel>
                                                         <AlertDialogAction
                                                            onClick={handleDeleteEmployee} // Use the async handler
                                                            className="bg-red-600 hover:bg-red-700">
                                                             Delete
                                                         </AlertDialogAction>
                                                     </AlertDialogFooter>
                                                 </AlertDialogContent>
                                             </AlertDialog>
                                         </CardHeader>
                                        <CardContent className="p-4 pt-10 space-y-1 text-sm">
                                            <h3 className="text-lg font-semibold truncate mb-2">{employee.name}</h3>
                                            <p><span className="font-medium text-gray-300">Position:</span> {employee.position}</p>
                                            <p><span className="font-medium text-gray-300">Hourly Wage:</span> ${employee.hourlyWage}</p>
                                            <p><span className="font-medium text-gray-300">TIN No:</span> {employee.tinNo || 'N/A'}</p>
                                            <p><span className="font-medium text-gray-300">FNPF Eligible:</span> {employee.fnpfEligible ? 'Yes' : 'No'}</p>
                                            {employee.fnpfEligible && <p><span className="font-medium text-gray-300">FNPF No:</span> {employee.fnpfNo || 'N/A'}</p>}
                                            {employee.paymentMethod === 'online' ? (
                                                <>
                                                    <p><span className="font-medium text-gray-300">Bank Code:</span> {employee.bankCode}</p>
                                                    <p><span className="font-medium text-gray-300">Account No:</span> {employee.bankAccountNumber}</p>
                                                    <p><span className="font-medium text-gray-300">Payment:</span> Online</p>
                                                </>
                                            ) : (
                                                <p><span className="font-medium text-gray-300">Payment:</span> Cash Wages</p>
                                            )}
                                            <p><span className="font-medium text-gray-300">Branch:</span> {employee.branch === 'labasa' ? 'Labasa' : 'Suva'}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </section>
                    )}

                     {/* Suva Branch Employees */}
                    {suvaEmployees.length > 0 && (
                         <section>
                            <h2 className="text-xl font-semibold text-white mb-4 text-center bg-black/30 backdrop-blur-sm py-2 rounded-md border border-white/15">Suva Branch Employees</h2>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {suvaEmployees.map((employee) => (
                                    <Card key={employee.id} className="bg-secondary/30 backdrop-blur-sm border border-white/10 rounded-lg text-white shadow-md relative overflow-hidden">
                                          <CardHeader className="pt-4 pb-2 px-4 flex flex-row justify-end items-center space-x-1 absolute top-1 right-1 z-10">
                                               <Link href={`/employees/change?id=${employee.id}`} className="mr-1">
                                                  <Button
                                                      variant="ghost"
                                                      size="icon"
                                                      className="text-blue-300 hover:text-blue-100 hover:bg-white/20 h-7 w-7"
                                                      aria-label={`Edit ${employee.name}`}
                                                  >
                                                      <Edit className="h-4 w-4" />
                                                  </Button>
                                              </Link>
                                              <AlertDialog>
                                                  <AlertDialogTrigger asChild>
                                                      <Button
                                                          variant="ghost"
                                                          size="icon"
                                                          onClick={() => setEmployeeToDelete(employee.id)} // Set employee to delete
                                                          className="text-red-400 hover:text-red-200 hover:bg-white/20 h-7 w-7"
                                                          aria-label={`Delete ${employee.name}`}
                                                      >
                                                          <Trash2 className="h-4 w-4" />
                                                      </Button>
                                                  </AlertDialogTrigger>
                                                   <AlertDialogContent className="bg-gray-900 border-white/20 text-white">
                                                      <AlertDialogHeader>
                                                          <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                                                          <AlertDialogDescription className="text-gray-300">
                                                              Are you sure you want to delete {employee.name}?
                                                              This action cannot be undone.
                                                              Please enter the admin password to confirm.
                                                          </AlertDialogDescription>
                                                      </AlertDialogHeader>
                                                      <div className="grid gap-2">
                                                          <Label htmlFor={`password-${employee.id}`} className="text-gray-300">Admin Password</Label>
                                                          <Input
                                                              id={`password-${employee.id}`}
                                                              type="password"
                                                              value={deletePassword}
                                                              onChange={(e) => setDeletePassword(e.target.value)}
                                                              className="bg-gray-800 border-white/20 text-white"
                                                          />
                                                      </div>
                                                      <AlertDialogFooter>
                                                          <AlertDialogCancel
                                                            id={`cancel-delete-${employee.id}`} // Add ID
                                                            className="border-white/20 text-white hover:bg-white/10"
                                                             onClick={() => { setDeletePassword(''); setEmployeeToDelete(null); }}> {/* Clear password and employee ID on cancel */}
                                                             Cancel
                                                            </AlertDialogCancel>
                                                          <AlertDialogAction
                                                             onClick={handleDeleteEmployee} // Use async handler
                                                            className="bg-red-600 hover:bg-red-700">
                                                              Delete
                                                          </AlertDialogAction>
                                                      </AlertDialogFooter>
                                                  </AlertDialogContent>
                                              </AlertDialog>
                                          </CardHeader>
                                         <CardContent className="p-4 pt-10 space-y-1 text-sm">
                                             <h3 className="text-lg font-semibold truncate mb-2">{employee.name}</h3>
                                             <p><span className="font-medium text-gray-300">Position:</span> {employee.position}</p>
                                             <p><span className="font-medium text-gray-300">Hourly Wage:</span> ${employee.hourlyWage}</p>
                                            <p><span className="font-medium text-gray-300">TIN No:</span> {employee.tinNo || 'N/A'}</p>
                                             <p><span className="font-medium text-gray-300">FNPF Eligible:</span> {employee.fnpfEligible ? 'Yes' : 'No'}</p>
                                             {employee.fnpfEligible && <p><span className="font-medium text-gray-300">FNPF No:</span> {employee.fnpfNo || 'N/A'}</p>}
                                             {employee.paymentMethod === 'online' ? (
                                                 <>
                                                     <p><span className="font-medium text-gray-300">Bank Code:</span> {employee.bankCode}</p>
                                                     <p><span className="font-medium text-gray-300">Account No:</span> {employee.bankAccountNumber}</p>
                                                     <p><span className="font-medium text-gray-300">Payment:</span> Online</p>
                                                 </>
                                             ) : (
                                                 <p><span className="font-medium text-gray-300">Payment:</span> Cash Wages</p>
                                             )}
                                              <p><span className="font-medium text-gray-300">Branch:</span> {employee.branch === 'labasa' ? 'Labasa' : 'Suva'}</p>
                                         </CardContent>
                                     </Card>
                                ))}
                            </div>
                        </section>
                    )}
                 </div>
            )}
         </main>
        </div>
         <footer className="w-full text-center py-4 text-xs text-white mt-auto relative z-10">
            © {new Date().getFullYear()} Aayush Atishay Lal 北京化工大学
          </footer>
    </div>
  );
};

export default EmployeeInformationPage;
