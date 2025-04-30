
'use client';

import {useState, useEffect, useMemo} from 'react';
import Image from 'next/image';
import Link from "next/link"; // Import Link
import {useToast} from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {Button} from '@/components/ui/button';
import {Calendar} from '@/components/ui/calendar';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {cn} from '@/lib/utils';
import {format} from 'date-fns';
import {CalendarIcon, ArrowLeft, Home, FileDown, FileText, Save} from 'lucide-react'; // Added Save icon
import {DateRange} from 'react-day-picker';
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
import * as XLSX from 'xlsx';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getEmployees } from '@/services/employee-service'; // Import the service function

// --- Interfaces ---
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

// Combined interface for wage input and calculated details
interface WageDetails {
    hoursWorked: string;
    mealAllowance: string; // Added meal allowance field
    otherDeductions: string;
    // Calculated fields (optional for initial state)
    grossPay?: number;
    fnpfDeduction?: number;
    netPay?: number;
}

interface WageRecord {
  employeeId: string;
  employeeName: string;
  hourlyWage: number;
  hoursWorked: number;
  mealAllowance: number; // Added meal allowance
  fnpfDeduction: number;
  otherDeductions: number;
  grossPay: number;
  netPay: number;
  dateFrom: Date;
  dateTo: Date;
}

// --- Component ---
const CreateWagesPage = () => {
  // --- State ---
  const [employees, setEmployees] = useState<Employee[]>([]);
  // Use a single state object for wage details, keyed by employee ID
  const [wageDetailsMap, setWageDetailsMap] = useState<{ [employeeId: string]: WageDetails }>({});
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined); // Initialize as undefined
  const [deletePassword, setDeletePassword] = useState('');
  const {toast} = useToast();
  const ADMIN_PASSWORD = 'admin01'; // Store securely in real app

  // --- Data Fetching ---
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const fetchedEmployees = await getEmployees(); // Use service function
        if (Array.isArray(fetchedEmployees)) {
          setEmployees(fetchedEmployees);
          // Initialize wageDetailsMap based on fetched employees
          const initialWageData: { [employeeId: string]: WageDetails } = {};
          fetchedEmployees.forEach((emp: Employee) => {
            // Initialize with default values or empty strings
             initialWageData[emp.id] = { hoursWorked: '', mealAllowance: '', otherDeductions: '' };
          });
          setWageDetailsMap(initialWageData);
        } else {
            console.error("Fetched employee data is not an array:", fetchedEmployees);
            setEmployees([]);
            setWageDetailsMap({});
        }
      } catch (error: any) {
        console.error("Error fetching employees:", error);
        toast({
          title: 'Error',
          description: 'Failed to load employee data.',
          variant: 'destructive',
        });
        setEmployees([]);
        setWageDetailsMap({});
      }
    };
    fetchEmployees();
  }, [toast]); // Added toast dependency

  // --- Input Handlers ---
  const handleWageInputChange = (employeeId: string, field: keyof Omit<WageDetails, 'grossPay' | 'fnpfDeduction' | 'netPay'>, value: string) => {
    setWageDetailsMap(prev => ({
      ...prev,
      [employeeId]: { ...prev[employeeId], [field]: value },
    }));
    // Note: Calculations are now done memoized below, not directly in the handler
  };

  // --- Calculations (Memoized) ---
  const calculatedWageData = useMemo(() => {
    const calculatedMap: { [employeeId: string]: WageDetails & { grossPay: number; fnpfDeduction: number; netPay: number } } = {};
    let totalNet = 0;
    let totalFnpf = 0;
    let totalSuva = 0;
    let totalLabasa = 0;
    let totalCash = 0;

    employees.forEach(employee => {
      const details = wageDetailsMap[employee.id] || { hoursWorked: '0', mealAllowance: '0', otherDeductions: '0' };
      const hourlyWage = parseFloat(employee.hourlyWage || '0');
      const hoursWorked = parseFloat(details.hoursWorked || '0');
      const mealAllowance = parseFloat(details.mealAllowance || '0');
      const otherDeductions = parseFloat(details.otherDeductions || '0');

      const grossPay = (hourlyWage * hoursWorked) + mealAllowance;
      let fnpfDeduction = 0;
      if (employee.fnpfEligible && !isNaN(grossPay) && grossPay > 0) {
        fnpfDeduction = grossPay * 0.08; // Calculate FNPF only if eligible and grossPay is valid
      }
      const netPay = Math.max(0, grossPay - fnpfDeduction - otherDeductions);

      calculatedMap[employee.id] = {
        ...details,
        grossPay,
        fnpfDeduction,
        netPay,
      };

      // Accumulate totals
      totalNet += netPay;
      totalFnpf += fnpfDeduction;
      if (employee.branch === 'suva') totalSuva += netPay;
      if (employee.branch === 'labasa') totalLabasa += netPay;
      if (employee.paymentMethod === 'cash') totalCash += netPay;
    });

    return { calculatedMap, totals: { totalNet, totalFnpf, totalSuva, totalLabasa, totalCash } };
  }, [employees, wageDetailsMap]);

  // --- Helper Functions ---
  const getCurrentWageRecords = (): WageRecord[] => {
    if (!dateRange?.from || !dateRange?.to) {
      toast({ title: 'Error', description: 'Date range missing.', variant: 'destructive' });
      return [];
    }
    const records: WageRecord[] = [];
    employees.forEach(employee => {
      const calculatedDetails = calculatedWageData.calculatedMap[employee.id];
      if (calculatedDetails) {
        records.push({
          employeeId: employee.id,
          employeeName: employee.name,
          hourlyWage: parseFloat(employee.hourlyWage || '0'),
          hoursWorked: parseFloat(calculatedDetails.hoursWorked || '0'),
          mealAllowance: parseFloat(calculatedDetails.mealAllowance || '0'), // Added meal allowance
          otherDeductions: parseFloat(calculatedDetails.otherDeductions || '0'),
          grossPay: calculatedDetails.grossPay,
          fnpfDeduction: calculatedDetails.fnpfDeduction,
          netPay: calculatedDetails.netPay,
          dateFrom: dateRange.from!,
          dateTo: dateRange.to!,
        });
      }
    });
    return records;
  };

  const resetForm = () => {
       setDateRange(undefined); // Reset date range
       const initialWageData: { [employeeId: string]: WageDetails } = {};
       employees.forEach(emp => {
           initialWageData[emp.id] = { hoursWorked: '', mealAllowance: '', otherDeductions: '' };
       });
       setWageDetailsMap(initialWageData); // Reset inputs
       setDeletePassword(''); // Clear password
   };


  const saveWageRecordsToStorage = (recordsToSave: WageRecord[], existingRecords: WageRecord[]) => {
    // Remove potential duplicates before saving - this assumes 'dateFrom' and 'dateTo' are primary keys for a period
    const recordsToSaveMap = new Map(recordsToSave.map(r => [`${r.employeeId}-${r.dateFrom.toISOString()}-${r.dateTo.toISOString()}`, r]));
    const updatedExistingRecords = existingRecords.filter(er => !recordsToSaveMap.has(`${er.employeeId}-${er.dateFrom.toISOString()}-${er.dateTo.toISOString()}`));

    const updatedWageRecords = [...updatedExistingRecords, ...recordsToSave];
    localStorage.setItem('wageRecords', JSON.stringify(updatedWageRecords));
    toast({ title: 'Success', description: 'Wages calculated and recorded successfully!' });
    resetForm(); // Clear inputs after successful save
  };

  // --- Event Handlers (Save, Export) ---
  const handleSaveWages = () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast({ title: 'Error', description: 'Please select a date range.', variant: 'destructive' });
      return;
    }

    const recordsToSave = getCurrentWageRecords();
    if (recordsToSave.length === 0) {
      toast({ title: 'Info', description: 'No wage data calculated to save.', variant: 'default' });
      return;
    }

    const storedWageRecords = localStorage.getItem('wageRecords');
    let existingWageRecords: WageRecord[] = [];
    if (storedWageRecords) {
         try {
             existingWageRecords = JSON.parse(storedWageRecords).map((record: any) => ({
                ...record,
                 // Safely parse dates, handle potential invalid date strings
                 dateFrom: record.dateFrom ? new Date(record.dateFrom) : new Date(0), // Use epoch or handle error
                 dateTo: record.dateTo ? new Date(record.dateTo) : new Date(0),
              })).filter((r: WageRecord) => !isNaN(r.dateFrom.getTime()) && !isNaN(r.dateTo.getTime())); // Filter out invalid dates
         } catch (e) {
             console.error("Error parsing existing wage records:", e);
             toast({ title: 'Error', description: 'Could not load existing wage records.', variant: 'destructive' });
             existingWageRecords = [];
         }
    }


    const existingRecordsForDateRange = existingWageRecords.filter(record => {
      // Ensure dates are valid before comparing
      if (!(record.dateFrom instanceof Date) || isNaN(record.dateFrom.getTime()) ||
          !(record.dateTo instanceof Date) || isNaN(record.dateTo.getTime())) {
        return false;
      }
      return record.dateFrom.getTime() === dateRange.from!.getTime() && record.dateTo.getTime() === dateRange.to!.getTime();
    });

    if (existingRecordsForDateRange.length > 0) {
      document.getElementById('adminPasswordDialog')?.click(); // Trigger confirmation dialog
    } else {
      saveWageRecordsToStorage(recordsToSave, existingWageRecords);
    }
  };

  const confirmSaveWages = () => {
    if (deletePassword !== ADMIN_PASSWORD) {
      toast({ title: 'Error', description: 'Incorrect password.', variant: 'destructive' });
      return;
    }
    if (!dateRange?.from || !dateRange?.to) {
      toast({ title: 'Error', description: 'Date range missing for update.', variant: 'destructive' });
      return;
    }

    const recordsToSave = getCurrentWageRecords();
    if (recordsToSave.length === 0) {
      toast({ title: 'Info', description: 'No wage data available to update.', variant: 'default' });
      document.getElementById('adminPasswordDialogCancel')?.click(); // Close dialog
      return;
    }

    const storedWageRecords = localStorage.getItem('wageRecords');
    let existingWageRecords: WageRecord[] = [];
     if (storedWageRecords) {
          try {
              existingWageRecords = JSON.parse(storedWageRecords).map((record: any) => ({
                 ...record,
                  dateFrom: record.dateFrom ? new Date(record.dateFrom) : new Date(0),
                  dateTo: record.dateTo ? new Date(record.dateTo) : new Date(0),
               })).filter((r: WageRecord) => !isNaN(r.dateFrom.getTime()) && !isNaN(r.dateTo.getTime()));
          } catch (e) {
              console.error("Error parsing existing wage records during update:", e);
              toast({ title: 'Error', description: 'Could not load existing wage records for update.', variant: 'destructive' });
              existingWageRecords = [];
          }
     }


    // Filter out records matching the selected date range
    const updatedWageRecords = existingWageRecords.filter(record => {
        if (!(record.dateFrom instanceof Date) || isNaN(record.dateFrom.getTime()) ||
            !(record.dateTo instanceof Date) || isNaN(record.dateTo.getTime())) {
             // Keep records with invalid dates during this filter? Or discard them?
             // Let's keep them for now, assuming they might be corrected later.
            return true;
        }
        return !(record.dateFrom.getTime() === dateRange.from!.getTime() &&
                 record.dateTo.getTime() === dateRange.to!.getTime());
    });

    const finalWageRecords = [...updatedWageRecords, ...recordsToSave];
    localStorage.setItem('wageRecords', JSON.stringify(finalWageRecords));
    toast({ title: 'Success', description: 'Wage records updated successfully!' });
    resetForm(); // Reset form after update
     // Manually close the dialog if needed (might depend on exact ShadCN implementation)
     const cancelBtn = document.getElementById('adminPasswordDialogCancel') as HTMLElement | null;
     if (cancelBtn) {
         cancelBtn.click();
     }

  };

  const exportToCSV = (type: 'BSP' | 'BRED') => {
    if (!dateRange?.from || !dateRange?.to) {
      toast({ title: 'Error', description: 'Please select a date range before exporting.', variant: 'destructive' });
      return;
    }

    const recordsToExport = getCurrentWageRecords();
    if (recordsToExport.length === 0) {
      toast({ title: 'Error', description: 'No wage records calculated to export.', variant: 'destructive' });
      return;
    }

    const onlineTransferRecords = recordsToExport.filter(record => {
      const employee = employees.find(emp => emp.id === record.employeeId);
      return employee?.paymentMethod === 'online';
    });

    if (onlineTransferRecords.length === 0) {
      toast({ title: 'Info', description: `No online transfer employees for ${type} export.`, variant: 'default' });
      return;
    }

    let csvData = '';
    let fileName = `wage_records_${type}_${format(dateRange.from!, 'yyyyMMdd')}_${format(dateRange.to!, 'yyyyMMdd')}.csv`;

    if (type === 'BSP') {
       // No header row for BSP as per requirement
      const csvRows: string[] = [];
      onlineTransferRecords.forEach(record => {
        const employeeDetails = employees.find(emp => emp.id === record.employeeId);
        csvRows.push([
          employeeDetails?.bankCode || '',
          employeeDetails?.bankAccountNumber || '',
          record.netPay.toFixed(2),
          'Salary',
          record.employeeName,
        ].join(','));
      });
      csvData = csvRows.join('\n');
    } else if (type === 'BRED') {
      const csvRows = [
        ['BIC', 'Employee', 'Employee', 'Account N', 'Amount', 'Purpose of Note (optional)'].join(',')
      ];
      onlineTransferRecords.forEach(record => {
        const employeeDetails = employees.find(emp => emp.id === record.employeeId);
        csvRows.push([
          employeeDetails?.bankCode || '',
          record.employeeName,
          '',
          employeeDetails?.bankAccountNumber || '',
          record.netPay.toFixed(2),
          'Salary',
        ].join(','));
      });
      csvData = csvRows.join('\n');
    }

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: 'Success', description: `Wage records exported to CSV (${type}) successfully!` });
  };

  const handleExportAndSave = (type: 'BSP' | 'BRED') => {
    exportToCSV(type); // Export first
    handleSaveWages(); // Then attempt to save (which might trigger confirmation)
  };

  const handleExportToExcel = () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast({ title: 'Error', description: 'Please select a date range before exporting.', variant: 'destructive' });
      return;
    }

    const recordsToExport = getCurrentWageRecords();
    if (recordsToExport.length === 0) {
      toast({ title: 'Error', description: 'No wage records calculated to export.', variant: 'destructive' });
      return;
    }

    const excelData = [
      [
        'Employee Name', 'Hourly Wage', 'Hours Worked', 'Meal Allowance',
        'FNPF Deduction', 'Other Deductions', 'Gross Pay', 'Net Pay',
        'Date From', 'Date To',
      ],
      ...recordsToExport.map(record => [
        record.employeeName, record.hourlyWage.toFixed(2), record.hoursWorked.toFixed(2),
        record.mealAllowance.toFixed(2), record.fnpfDeduction.toFixed(2),
        record.otherDeductions.toFixed(2), record.grossPay.toFixed(2), record.netPay.toFixed(2),
        format(record.dateFrom, 'yyyy-MM-dd'), format(record.dateTo, 'yyyy-MM-dd'),
      ]),
      [ // Totals row
        'Totals', '', '', '',
        calculatedWageData.totals.totalFnpf.toFixed(2),
        recordsToExport.reduce((sum, r) => sum + r.otherDeductions, 0).toFixed(2),
        recordsToExport.reduce((sum, r) => sum + r.grossPay, 0).toFixed(2),
        calculatedWageData.totals.totalNet.toFixed(2),
        '', '',
      ],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    ws['!cols'] = [
      {wch: 20}, {wch: 12}, {wch: 12}, {wch: 15}, {wch: 15},
      {wch: 15}, {wch: 12}, {wch: 12}, {wch: 12}, {wch: 12}
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Wage Records');
    XLSX.writeFile(wb, `wage_records_${format(dateRange.from, 'yyyyMMdd')}_${format(dateRange.to, 'yyyyMMdd')}.xlsx`);
    toast({ title: 'Success', description: 'Wage records exported to Excel successfully!' });
  };

  // --- Render ---
  return (
    <div className="relative flex flex-col items-center min-h-screen text-white font-sans">
      {/* Background Image */}
      <Image
        src="/red-and-black-gaming-wallpapers-top-red-and-black-lightning-dark-gamer.jpg"
        alt="Background Image"
        fill // Use fill layout
        style={{objectFit: 'cover'}} // Use style for objectFit
        className="absolute inset-0 w-full h-full -z-10"
        priority
      />
      {/* Overlay */}
      <div className="absolute inset-0 w-full h-full bg-black/60 -z-9" />

      {/* Content Area */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col flex-grow items-center">
        {/* Header */}
        <header className="w-full py-4 flex justify-between items-center border-b border-white/20 mb-8 sm:mb-10 md:mb-12">
          <Link href="/wages" passHref>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to Wages Management</span>
            </Button>
          </Link>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-center text-gray-100">
            Calculate Wages
          </h1>
          <Link href="/dashboard" passHref>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <Home className="h-5 w-5" />
              <span className="sr-only">Dashboard</span>
            </Button>
          </Link>
        </header>

        {/* Main Content */}
        <main className="flex flex-col items-center flex-grow w-full pb-16">
          <Card className="w-full max-w-6xl bg-transparent backdrop-blur-md shadow-lg rounded-lg border border-accent/40 p-4">
            <CardHeader className="pb-2">
                {/* Date Picker inside CardHeader */}
                <div className="flex justify-center mb-4">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={'outline'}
                                className={cn(
                                    'w-[240px] sm:w-[300px] justify-start text-left font-normal text-gray-900 bg-white hover:bg-gray-100',
                                    !dateRange?.from && 'text-muted-foreground'
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        `${format(dateRange.from, 'LLL dd, yyyy')} - ${format(dateRange.to, 'LLL dd, yyyy')}`
                                    ) : (
                                        format(dateRange.from, 'LLL dd, yyyy')
                                    )
                                ) : (
                                    <span>Pick a date range</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-white text-black" align="center">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={1} // Simplified to one month view
                                disabled={{ after: new Date() }} // Disable future dates
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </CardHeader>
            <CardContent>
                {/* Wage Calculation Table */}
                <div className="overflow-x-auto mb-6 border border-white/20 rounded-lg">
                  <Table>
                    <TableHeader className="bg-white/10">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-white border-r border-white/20">Employee</TableHead>
                        <TableHead className="text-white border-r border-white/20">Bank Code</TableHead>
                        <TableHead className="text-white border-r border-white/20">Account #</TableHead>
                        <TableHead className="text-white border-r border-white/20">Hourly Wage</TableHead>
                        <TableHead className="text-white border-r border-white/20">Hours Worked</TableHead>
                        <TableHead className="text-white border-r border-white/20">Meal Allow.</TableHead>
                        <TableHead className="text-white border-r border-white/20">Other Deduct.</TableHead>
                        <TableHead className="text-white border-r border-white/20">FNPF Deduct.</TableHead>
                        <TableHead className="text-white">Net Pay</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                       {employees.map(employee => {
                            const wageDetails = calculatedWageData.calculatedMap[employee.id] || { hoursWorked: '', mealAllowance: '', otherDeductions: '', fnpfDeduction: 0, netPay: 0 };
                            return (
                                <TableRow key={employee.id} className="hover:bg-white/5 border-t border-white/10">
                                    <TableCell className="text-white border-r border-white/20">{employee.name}</TableCell>
                                    <TableCell className="text-white border-r border-white/20">{employee.bankCode || 'N/A'}</TableCell>
                                    <TableCell className="text-white border-r border-white/20">{employee.bankAccountNumber || 'N/A'}</TableCell>
                                    <TableCell className="text-white border-r border-white/20">${parseFloat(employee.hourlyWage || '0').toFixed(2)}</TableCell>
                                    <TableCell className="border-r border-white/20">
                                        <Input
                                            type="number"
                                            placeholder="Hrs"
                                            value={wageDetailsMap[employee.id]?.hoursWorked || ''}
                                            onChange={e => handleWageInputChange(employee.id, 'hoursWorked', e.target.value)}
                                            className="w-20 p-1 text-sm border rounded text-gray-900 bg-white/90"
                                            min="0"
                                            step="0.25"
                                        />
                                    </TableCell>
                                     <TableCell className="border-r border-white/20">
                                        <Input
                                            type="number"
                                            placeholder="Amt"
                                            value={wageDetailsMap[employee.id]?.mealAllowance || ''}
                                            onChange={e => handleWageInputChange(employee.id, 'mealAllowance', e.target.value)}
                                            className="w-20 p-1 text-sm border rounded text-gray-900 bg-white/90"
                                            min="0"
                                            step="0.01"
                                        />
                                    </TableCell>
                                    <TableCell className="border-r border-white/20">
                                        <Input
                                            type="number"
                                            placeholder="Amt"
                                            value={wageDetailsMap[employee.id]?.otherDeductions || ''}
                                            onChange={e => handleWageInputChange(employee.id, 'otherDeductions', e.target.value)}
                                            className="w-20 p-1 text-sm border rounded text-gray-900 bg-white/90"
                                            min="0"
                                            step="0.01"
                                        />
                                    </TableCell>
                                    <TableCell className="text-white border-r border-white/20">
                                         {employee.fnpfEligible ? `$${wageDetails.fnpfDeduction?.toFixed(2) ?? '0.00'}` : 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-white font-medium">
                                        ${wageDetails.netPay?.toFixed(2) ?? '0.00'}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {/* Total Row */}
                        <TableRow className="font-bold bg-white/15 border-t-2 border-white/30">
                          <TableCell colSpan={7} className="text-right text-white pr-4">
                            Totals:
                          </TableCell>
                          <TableCell className="text-white border-l border-r border-white/20">
                            ${calculatedWageData.totals.totalFnpf.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-white">
                            ${calculatedWageData.totals.totalNet.toFixed(2)}
                          </TableCell>
                        </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap justify-center gap-3 mt-6">
                  <Button variant="secondary" size="lg" onClick={handleSaveWages} className="min-w-[150px] hover:bg-gray-700/80">
                    <Save className="mr-2 h-4 w-4" /> Save Wages
                  </Button>
                  <Button variant="secondary" size="lg" onClick={() => handleExportAndSave('BSP')} className="min-w-[150px] hover:bg-gray-700/80">
                     <FileDown className="mr-2 h-4 w-4" /> Export CSV (BSP)
                  </Button>
                  <Button variant="secondary" size="lg" onClick={() => handleExportAndSave('BRED')} className="min-w-[150px] hover:bg-gray-700/80">
                     <FileDown className="mr-2 h-4 w-4" /> Export CSV (BRED)
                  </Button>
                   <Button variant="secondary" size="lg" onClick={handleExportToExcel} className="min-w-[150px] hover:bg-gray-700/80">
                     <FileText className="mr-2 h-4 w-4" /> Export to Excel
                  </Button>
                </div>

                {/* Branch/Cash Total Display */}
                <div className="mt-6 pt-4 border-t border-white/20 text-center space-y-1">
                  <div className="text-md text-gray-300">
                    Total Suva Branch Wages: <span className="font-semibold text-white">${calculatedWageData.totals.totalSuva.toFixed(2)}</span>
                  </div>
                  <div className="text-md text-gray-300">
                    Total Labasa Branch Wages: <span className="font-semibold text-white">${calculatedWageData.totals.totalLabasa.toFixed(2)}</span>
                  </div>
                  <div className="text-md text-gray-300">
                    Total Cash Wages: <span className="font-semibold text-white">${calculatedWageData.totals.totalCash.toFixed(2)}</span>
                  </div>
                </div>
            </CardContent>
          </Card>
        </main>

        {/* AlertDialog for admin password */}
        <AlertDialog>
          <AlertDialogTrigger id="adminPasswordDialog" asChild>
            <Button variant="ghost" style={{display:"none"}}>Show Dialog</Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-gray-900 border-white/20 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Save/Update</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                Wage records already exist for this period. Enter admin password to overwrite.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-2">
              <Label htmlFor="password-confirm" className="text-gray-300">Admin Password</Label>
              <Input
                id="password-confirm"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="bg-gray-800 border-white/20 text-white"
                onKeyPress={(e) => { if (e.key === 'Enter') confirmSaveWages(); }}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel id="adminPasswordDialogCancel" onClick={() => setDeletePassword('')} className="border-white/20 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmSaveWages} className="bg-blue-600 hover:bg-blue-700">
                Confirm Update
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
        {/* Footer */}
        <footer className="w-full text-center py-4 text-xs text-white mt-auto relative z-10">
            © {new Date().getFullYear()} Aayush Atishay Lal 北京化工大学
        </footer>
    </div>
  );
};

export default CreateWagesPage;
