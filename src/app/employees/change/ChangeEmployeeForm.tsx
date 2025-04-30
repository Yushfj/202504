"use client"; // This directive is essential to make this a Client Component

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getEmployeeById, updateEmployee } from '@/services/employee-service'; // Import service functions
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';


// Define the Employee interface again if needed in this component
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

const ChangeEmployeeForm = () => {
  const searchParams = useSearchParams();
  const employeeId = searchParams.get('id'); // Get the employee ID from the URL
  const { toast } = useToast();
  const router = useRouter();

  // State to hold the fetched employee data and form inputs
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form input states, initialized with default values or fetched data
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [hourlyWage, setHourlyWage] = useState('');
  const [fnpfNo, setFnpfNo] = useState('');
  const [tinNo, setTinNo] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('cash');
  const [branch, setBranch] = useState<'labasa' | 'suva'>('labasa');
  const [fnpfEligible, setFnpfEligible] = useState(true);


  // Effect to fetch employee data when the employeeId changes
  useEffect(() => {
    const fetchEmployee = async () => {
      if (!employeeId) {
        setError('No employee ID provided in the URL.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // Call the service function to get employee data by ID
        const fetchedEmployee = await getEmployeeById(employeeId);
        if (fetchedEmployee) {
          setEmployee(fetchedEmployee);
          // Populate form states with fetched data
          setName(fetchedEmployee.name);
          setPosition(fetchedEmployee.position);
          setHourlyWage(fetchedEmployee.hourlyWage);
          setFnpfNo(fetchedEmployee.fnpfNo);
          setTinNo(fetchedEmployee.tinNo);
          setBankCode(fetchedEmployee.bankCode);
          setBankAccountNumber(fetchedEmployee.bankAccountNumber);
          setPaymentMethod(fetchedEmployee.paymentMethod);
          setBranch(fetchedEmployee.branch);
          setFnpfEligible(fetchedEmployee.fnpfEligible);
        } else {
          setError(`Employee with ID ${employeeId} not found.`);
        }
      } catch (err: any) {
        console.error("Error fetching employee:", err);
        setError('Failed to load employee data.');
        toast({
          title: 'Error',
          description: 'Failed to load employee data for editing.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [employeeId, toast]); // Re-run effect if employeeId or toast changes

  // Handle form submission for updating employee
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!employeeId) {
      toast({
        title: 'Error',
        description: 'Cannot update employee: ID is missing.',
        variant: 'destructive',
      });
      return;
    }

    // --- Input Validation (Keep or enhance) ---
    if (!name || !position || !hourlyWage) {
      toast({
        title: 'Error',
        description: 'Please fill in Name, Position, and Hourly Wage.',
        variant: 'destructive',
      });
      return;
    }
    if (fnpfEligible && !fnpfNo) {
      toast({
        title: 'Error',
        description: 'FNPF Number is required when employee is FNPF eligible.',
        variant: 'destructive',
      });
      return;
    }
    const wageAsNumber = parseFloat(hourlyWage);
    if (isNaN(wageAsNumber) || wageAsNumber < 0) {
      toast({
        title: 'Error',
        description: 'Hourly Wage must be a valid non-negative number.',
        variant: 'destructive',
      });
      return;
    }
    if (paymentMethod === 'online' && (!bankCode || !bankAccountNumber)) {
      toast({
        title: 'Error',
        description: 'Please fill in Bank Code and Account Number for online transfer.',
        variant: 'destructive',
      });
      return;
    }
    // --- End Validation ---


    try {
      // Construct the updated employee data object
      const updatedEmployeeData: Employee = {
        id: employeeId, // Include the ID for the update
        name,
        position,
        hourlyWage, // Keep as string for now, service layer might parse
        fnpfNo: fnpfEligible ? fnpfNo : '',
        tinNo,
        bankCode: paymentMethod === 'online' ? bankCode : '',
        bankAccountNumber: paymentMethod === 'online' ? bankAccountNumber : '',
        paymentMethod,
        branch,
        fnpfEligible,
      };

      console.log('Submitting updated employee data:', updatedEmployeeData);

      // Call the service function to update the employee
      await updateEmployee(updatedEmployeeData);

      toast({
        title: 'Success',
        description: 'Employee updated successfully!',
      });

      // Optionally redirect back to the information page after successful update
      router.push('/employees/information');

    } catch (err: any) {
      console.error('Error updating employee:', err);
      toast({
        title: 'Error Updating Employee',
        description: err.message || 'Failed to save employee data. Check console for details.',
        variant: 'destructive',
      });
    }
  };


  // Display loading, error, or the form
  if (loading) {
    return (
        <Card className="w-full max-w-md bg-transparent backdrop-blur-md shadow-lg rounded-lg border border-accent/40 z-10 text-white">
            <CardContent className="p-6 text-center">
                Loading employee data...
            </CardContent>
        </Card>
    );
  }

  if (error) {
    return (
        <Card className="w-full max-w-md bg-transparent backdrop-blur-md shadow-lg rounded-lg border border-accent/40 z-10 text-white">
            <CardContent className="p-6 text-center">
                Error: {error}
                {!employeeId && (
                    <p className="mt-4">Please ensure you are accessing this page with a valid employee ID in the URL, e.g., `/employees/change?id=some-employee-id`.</p>
                )}
            </CardContent>
        </Card>
    );
  }

  if (!employee) {
      // This case should ideally be covered by the error state if employeeId is present but employee not found
      // but as a fallback
      return (
          <Card className="w-full max-w-md bg-transparent backdrop-blur-md shadow-lg rounded-lg border border-accent/40 z-10 text-white">
              <CardContent className="p-6 text-center">
                  Employee data could not be loaded.
              </CardContent>
          </Card>
      );
  }


  // Render the form once employee data is loaded
  return (
    <div className="relative z-10 w-full max-w-md mx-auto"> {/* Container for the card */}
        <Card className="w-full bg-transparent backdrop-blur-md shadow-lg rounded-lg border border-accent/40">
            <CardHeader className="relative">
                <Link href="/employees/information" className="absolute top-4 left-4" aria-label="Back to Employee Information">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5 text-white" />
                    </Button>
                </Link>
                <CardTitle className="text-2xl text-white text-center pt-2">
                    Change Employee
                </CardTitle>
                 <Link href="/dashboard" className="absolute top-4 right-4" aria-label="Dashboard">
                    <Button variant="ghost" size="icon">
                        <Home className="h-5 w-5 text-white" />
                    </Button>
                </Link>
            </CardHeader>
            <CardContent className="grid gap-4">
                <form onSubmit={handleSubmit}>

                    {/* Branch Selection */}
                    <div className="grid gap-2">
                        <Label className="text-white font-semibold">Branch</Label>
                        <RadioGroup
                            onValueChange={(value) => setBranch(value === 'labasa' ? 'labasa' : 'suva')}
                            value={branch} // Use value prop to control checked state
                            className="grid grid-cols-2 gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="labasa" id="change-r3" className="border-white text-primary" />
                                <Label htmlFor="change-r3" className="text-white cursor-pointer">Labasa Branch</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="suva" id="change-r4" className="border-white text-primary" />
                                <Label htmlFor="change-r4" className="text-white cursor-pointer">Suva Branch</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Employee Name */}
                    <div className="grid gap-2">
                        <Label htmlFor="change-name" className="text-white">
                            Employee Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="change-name"
                            type="text"
                            placeholder="Enter full name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            className="bg-white/10 text-white placeholder-gray-400 border-white/20"
                        />
                    </div>

                    {/* Employee Position */}
                    <div className="grid gap-2">
                        <Label htmlFor="change-position" className="text-white">
                            Employee Position <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="change-position"
                            type="text"
                            placeholder="e.g., Sales Assistant"
                            value={position}
                            onChange={e => setPosition(e.target.value)}
                            required
                            className="bg-white/10 text-white placeholder-gray-400 border-white/20"
                        />
                    </div>

                    {/* Hourly Wage */}
                    <div className="grid gap-2">
                        <Label htmlFor="change-hourlyWage" className="text-white">
                            Hourly Wage ($) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="change-hourlyWage"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="e.g., 15.50"
                            value={hourlyWage}
                            onChange={e => setHourlyWage(e.target.value)}
                            required
                            className="bg-white/10 text-white placeholder-gray-400 border-white/20"
                        />
                    </div>

                    {/* TIN No */}
                    <div className="grid gap-2">
                        <Label htmlFor="change-tinNo" className="text-white">
                            TIN No
                        </Label>
                        <Input
                            id="change-tinNo"
                            type="text"
                            placeholder="Enter Tax ID Number"
                            value={tinNo}
                            onChange={e => setTinNo(e.target.value)}
                            className="bg-white/10 text-white placeholder-gray-400 border-white/20"
                        />
                    </div>

                    {/* FNPF Eligible Checkbox */}
                     <div className="flex items-center space-x-2 mt-4">
                        <Checkbox
                            id="change-fnpfEligible"
                            checked={fnpfEligible}
                            onCheckedChange={(checked) => setFnpfEligible(Boolean(checked))}
                            className="border-white text-primary"
                        />
                        <Label htmlFor="change-fnpfEligible" className="text-white cursor-pointer">Eligible for FNPF Deduction</Label>
                    </div>

                    {/* FNPF No (Conditional) */}
                    {fnpfEligible && (
                        <div className="grid gap-2">
                            <Label htmlFor="change-fnpfNo" className="text-white">
                                FNPF No <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="change-fnpfNo"
                                type="text"
                                placeholder="Enter FNPF Number"
                                value={fnpfNo}
                                onChange={e => setFnpfNo(e.target.value)}
                                required={fnpfEligible}
                                className="bg-white/10 text-white placeholder-gray-400 border-white/20"
                            />
                        </div>
                    )}

                    {/* Payment Method */}
                    <div className="grid gap-2">
                        <Label className="text-white font-semibold">Payment Method</Label>
                        <RadioGroup
                            onValueChange={(value) => setPaymentMethod(value === 'cash' ? 'cash' : 'online')}
                            value={paymentMethod} // Use value prop
                            className="grid grid-cols-2 gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="cash" id="change-r1" className="border-white text-primary" />
                                <Label htmlFor="change-r1" className="text-white cursor-pointer">Cash Wages</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="online" id="change-r2" className="border-white text-primary" />
                                <Label htmlFor="change-r2" className="text-white cursor-pointer">Online Transfer</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Bank Details (Conditional) */}
                    {paymentMethod === 'online' && (
                        <>
                            <div className="grid gap-2 mt-4">
                                <Label htmlFor="change-bankCode" className="text-white">Bank Code <span className="text-red-500">*</span></Label>
                                <Select onValueChange={setBankCode} value={bankCode} required={paymentMethod === 'online'}> {/* Use value prop */}
                                    <SelectTrigger className="bg-white/10 text-white placeholder-gray-400 border-white/20">
                                        <SelectValue placeholder="Select Bank Code" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ANZ">ANZ</SelectItem>
                                        <SelectItem value="BSP">BSP</SelectItem>
                                        <SelectItem value="BOB">BOB</SelectItem>
                                        <SelectItem value="HFC">HFC</SelectItem>
                                        <SelectItem value="BRED">BRED</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="change-bankAccountNumber" className="text-white">
                                    Bank Account Number <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="change-bankAccountNumber"
                                    type="text"
                                    placeholder="Enter account number"
                                    value={bankAccountNumber}
                                    onChange={e => setBankAccountNumber(e.target.value)}
                                    required={paymentMethod === 'online'}
                                    className="bg-white/10 text-white placeholder-gray-400 border-white/20"
                                />
                            </div>
                        </>
                    )}

                    {/* Submit Button */}
                    <Button className="w-full mt-6" type="submit" variant="gradient">
                        Update Employee
                    </Button>
                </form>
            </CardContent>
        </Card>
    </div>
  );
};

export default ChangeEmployeeForm;
