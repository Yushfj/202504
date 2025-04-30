
'use client';

import {useState, useEffect} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import Image from 'next/image';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {useToast} from '@/hooks/use-toast';
import {useRouter, useSearchParams} from 'next/navigation';
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link";
import {ArrowLeft, Home} from "lucide-react";
import { getEmployees, updateEmployee } from '@/services/employee-service'; // Import service functions

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

const ChangeEmployeeInfoPage = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
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
  const {toast} = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

    useEffect(() => {
        const employeeIdFromParams = searchParams.get('id');
        if (employeeIdFromParams) {
            setSelectedEmployeeId(employeeIdFromParams);
        }
    }, [searchParams]);


  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const fetchedEmployees = await getEmployees(); // Use service function
      setEmployees(fetchedEmployees);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch employees.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (selectedEmployeeId) {
      const employeeToChange = employees.find(emp => emp.id === selectedEmployeeId);
      if (employeeToChange) {
        setName(employeeToChange.name);
        setPosition(employeeToChange.position);
        setHourlyWage(employeeToChange.hourlyWage);
        setFnpfNo(employeeToChange.fnpfNo || ''); // Ensure fnpfNo is not undefined
        setTinNo(employeeToChange.tinNo || ''); // Ensure tinNo is not undefined
        setBankCode(employeeToChange.bankCode || ''); // Ensure bankCode is not undefined
        setBankAccountNumber(employeeToChange.bankAccountNumber || ''); // Ensure bankAccountNumber is not undefined
        setPaymentMethod(employeeToChange.paymentMethod || 'cash'); // Default if undefined
        setBranch(employeeToChange.branch || 'labasa'); // Default if undefined
        setFnpfEligible(employeeToChange.fnpfEligible === true); // Default if undefined
      }
    } else {
      // Reset fields if no employee is selected
      setName('');
      setPosition('');
      setHourlyWage('');
      setFnpfNo('');
      setTinNo('');
      setBankCode('');
      setBankAccountNumber('');
      setPaymentMethod('cash');
      setBranch('labasa');
      setFnpfEligible(true);
    }
  }, [selectedEmployeeId, employees]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedEmployeeId) {
      toast({
        title: 'Error',
        description: 'Please select an employee to update.',
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
            description: 'Please fill in FNPF No when FNPF Eligible is checked.',
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
   const wageAsNumber = parseFloat(hourlyWage);
    if (isNaN(wageAsNumber) || wageAsNumber < 0) {
         toast({
           title: 'Error',
           description: 'Hourly Wage must be a valid non-negative number.',
           variant: 'destructive',
         });
         return;
    }
    // --- End Validation ---

    try {
      const updatedEmployeeData: Employee = {
        id: selectedEmployeeId,
        name,
        position,
        hourlyWage, // Keep as string, service might parse
        fnpfNo: fnpfEligible ? fnpfNo : '',
        tinNo,
        bankCode: paymentMethod === 'online' ? bankCode : '',
        bankAccountNumber: paymentMethod === 'online' ? bankAccountNumber : '',
        paymentMethod,
        branch,
        fnpfEligible,
      };

      // Call the service function to update the employee
      await updateEmployee(updatedEmployeeData);

      toast({
        title: 'Success',
        description: 'Employee information updated successfully!',
      });

      // Reset selection and form fields
      setSelectedEmployeeId('');
      // Optionally clear form fields here or rely on useEffect to reset

      // Navigate back to the employee information page
      router.push('/employees/information');

    } catch (error: any) {
      toast({
        title: 'Error Updating Employee',
        description: error.message || 'Failed to update employee information.',
        variant: 'destructive',
      });
    }
  };

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

       {/* Content Area - Centered with padding */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col flex-grow items-center justify-center">

          <Card className="w-full max-w-md bg-transparent backdrop-blur-md shadow-lg rounded-lg border border-accent/40">
            <CardHeader className="relative">
                <Link href="/employees" className="absolute top-4 left-4">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5 text-white" />
                        <span className="sr-only">Back</span>
                    </Button>
                </Link>
              <CardTitle className="text-2xl text-white text-center pt-2">
                Change Employee Information
              </CardTitle>
                 <Link href="/dashboard" className="absolute top-4 right-4">
                    <Button variant="ghost" size="icon">
                        <Home className="h-5 w-5 text-white" />
                        <span className="sr-only">Home</span>
                    </Button>
                </Link>
            </CardHeader>
            <CardContent className="grid gap-4">
              <form onSubmit={handleSubmit}>
                <div className="grid gap-2">
                  <Label htmlFor="employee" className="text-white">
                    Select Employee
                  </Label>
                  <Select
                    onValueChange={setSelectedEmployeeId}
                      value={selectedEmployeeId} // Use value instead of defaultValue
                      required // Make employee selection required
                  >
                    <SelectTrigger className="w-full bg-white/10 text-white placeholder-gray-400 border-white/20">
                      <SelectValue placeholder="Select an employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.length > 0 ? (
                        employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.name} ({employee.branch === 'labasa' ? 'Labasa' : 'Suva'})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-employees" disabled>
                          No employees found
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {selectedEmployeeId && (
                    <>
                    <div className="grid gap-2 mt-4">
                      <Label className="text-white font-semibold">Select Branch</Label>
                      <RadioGroup
                        onValueChange={(value) => setBranch(value === 'labasa' ? 'labasa' : 'suva')}
                        value={branch}
                        className="grid grid-cols-2 gap-4"
                      >
                          <div className="flex items-center space-x-2">
                              <RadioGroupItem value="labasa" id="r3" className="border-white text-primary" />
                              <Label htmlFor="r3" className="text-white cursor-pointer">Labasa Branch</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                              <RadioGroupItem value="suva" id="r4" className="border-white text-primary" />
                              <Label htmlFor="r4" className="text-white cursor-pointer">Suva Branch</Label>
                          </div>
                      </RadioGroup>
                  </div>

                    <div className="grid gap-2 mt-4"> {/* Added mt-4 for spacing */}
                      <Label htmlFor="name" className="text-white">
                          Employee Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                          id="name"
                          type="text"
                          placeholder="Enter full name"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          required
                          className="bg-white/10 text-white placeholder-gray-400 border-white/20"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="position" className="text-white">
                          Employee Position <span className="text-red-500">*</span>
                      </Label>
                      <Input
                          id="position"
                          type="text"
                          placeholder="e.g., Sales Assistant"
                          value={position}
                          onChange={e => setPosition(e.target.value)}
                          required
                          className="bg-white/10 text-white placeholder-gray-400 border-white/20"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="hourlyWage" className="text-white">
                          Hourly Wage ($) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                          id="hourlyWage"
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

                    <div className="grid gap-2">
                      <Label htmlFor="tinNo" className="text-white">
                          TIN No
                      </Label>
                      <Input
                          id="tinNo"
                          type="text"
                          placeholder="Enter Tax ID Number"
                          value={tinNo}
                          onChange={e => setTinNo(e.target.value)}
                          className="bg-white/10 text-white placeholder-gray-400 border-white/20"
                      />
                  </div>

                  <div className="flex items-center space-x-2 mt-4">
                      <Checkbox
                          id="fnpfEligible"
                          checked={fnpfEligible}
                          onCheckedChange={(checked) => setFnpfEligible(Boolean(checked))} // Ensure boolean conversion
                          className="border-white text-primary"
                      />
                      <Label htmlFor="fnpfEligible" className="text-white cursor-pointer">Eligible for FNPF Deduction</Label>
                  </div>

                    {fnpfEligible && (
                      <div className="grid gap-2">
                          <Label htmlFor="fnpfNo" className="text-white">
                              FNPF No <span className="text-red-500">*</span>
                          </Label>
                          <Input
                              id="fnpfNo"
                              type="text"
                              placeholder="Enter FNPF Number"
                              value={fnpfNo}
                              onChange={e => setFnpfNo(e.target.value)}
                              required={fnpfEligible} // Make required only if FNPF is eligible
                              className="bg-white/10 text-white placeholder-gray-400 border-white/20"
                          />
                      </div>
                    )}

                    <div className="grid gap-2 mt-4"> {/* Added mt-4 */}
                      <Label className="text-white font-semibold">Payment Method</Label>
                      <RadioGroup
                          onValueChange={(value) => setPaymentMethod(value === 'cash' ? 'cash' : 'online')}
                          value={paymentMethod}
                          className="grid grid-cols-2 gap-4"
                      >
                          <div className="flex items-center space-x-2">
                          <RadioGroupItem value="cash" id="r1" className="border-white text-primary" />
                          <Label htmlFor="r1" className="text-white cursor-pointer">Cash Wages</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                          <RadioGroupItem value="online" id="r2" className="border-white text-primary" />
                          <Label htmlFor="r2" className="text-white cursor-pointer">Online Transfer</Label>
                          </div>
                      </RadioGroup>
                    </div>

                    {paymentMethod === 'online' && (
                    <>
                        <div className="grid gap-2 mt-4">
                        <Label htmlFor="bankCode" className="text-white">Bank Code <span className="text-red-500">*</span></Label>
                            <Select onValueChange={setBankCode} value={bankCode} required={paymentMethod === 'online'}>
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
                          <Label htmlFor="bankAccountNumber" className="text-white">
                              Bank Account Number <span className="text-red-500">*</span>
                          </Label>
                          <Input
                              id="bankAccountNumber"
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

                <Button className="w-full mt-6" type="submit" variant="gradient">
                Update Employee Information
                </Button>
                </>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
        <footer className="w-full text-center py-4 text-xs text-white mt-auto relative z-10">
            © {new Date().getFullYear()} Aayush Atishay Lal 北京化工大学
          </footer>
    </div>
  );
};

export default ChangeEmployeeInfoPage;
