
'use client';

import {useEffect, useState, useMemo} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
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
import {CalendarIcon, Home, ArrowLeft, Power, Trash2, FileText, FileDown} from 'lucide-react'; // Added relevant icons
import {DateRange} from 'react-day-picker';
import {useToast} from '@/hooks/use-toast';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {useRouter} from 'next/navigation';
import * as XLSX from 'xlsx';
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

interface GroupedWageRecord {
  records: WageRecord[];
  totalWages: number;
  dateFrom: Date;
  dateTo: Date;
  payPeriodKey: string; // Added key for easier identification
}

// --- Component ---
const WagesRecordsPage = () => {
  // --- State ---
  const [allWageRecords, setAllWageRecords] = useState<WageRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedPayPeriodKey, setSelectedPayPeriodKey] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const {toast} = useToast();
  const router = useRouter();
  const ADMIN_PASSWORD = 'admin01'; // Store securely in real app

  // --- Data Fetching ---
  useEffect(() => {
    const fetchInitialData = async () => { // Make async
      // Fetch Employees using the service
      try {
        const fetchedEmployees = await getEmployees();
        setEmployees(fetchedEmployees);
      } catch (error) {
        console.error("Error fetching employees:", error);
        setEmployees([]);
        toast({ title: "Error", description: "Failed to load employee data.", variant: "destructive" });
      }

      // Fetch Wage Records from local storage (keep this for now or adapt to DB)
      const storedWageRecords = localStorage.getItem('wageRecords');
      if (storedWageRecords) {
        try {
          const parsedRecords = JSON.parse(storedWageRecords).map((record: any) => {
            // Ensure dateFrom and dateTo are properly converted to Date objects
            const dateFrom = record.dateFrom ? new Date(record.dateFrom) : null;
            const dateTo = record.dateTo ? new Date(record.dateTo) : null;

            if (!dateFrom || isNaN(dateFrom.getTime()) || !dateTo || isNaN(dateTo.getTime())) {
              console.warn("Skipping record with invalid date during load:", record);
              return null; // Skip records with invalid dates
            }

            return {
              ...record,
              dateFrom,
              dateTo,
              // Safely parse numbers, default to 0 if invalid
              hourlyWage: Number(record.hourlyWage) || 0,
              hoursWorked: Number(record.hoursWorked) || 0,
              mealAllowance: Number(record.mealAllowance) || 0, // Add meal allowance
              fnpfDeduction: Number(record.fnpfDeduction) || 0,
              otherDeductions: Number(record.otherDeductions) || 0,
              grossPay: Number(record.grossPay) || 0,
              netPay: Number(record.netPay) || 0,
            };
          }).filter((record: WageRecord | null): record is WageRecord => record !== null); // Filter out null records

          setAllWageRecords(Array.isArray(parsedRecords) ? parsedRecords : []);
        } catch (error) {
          console.error("Error parsing wage records:", error);
          setAllWageRecords([]);
          toast({ title: "Error", description: "Failed to load wage records.", variant: "destructive" });
        }
      } else {
        setAllWageRecords([]);
      }
    };
    fetchInitialData();
  }, [toast]);

  // --- Data Processing (Grouping & Filtering) ---
  const groupedWageRecords = useMemo(() => {
    const recordsToGroup = dateRange?.from && dateRange.to
      ? allWageRecords.filter(record => {
        if (!(record.dateFrom instanceof Date) || isNaN(record.dateFrom.getTime()) ||
            !(record.dateTo instanceof Date) || isNaN(record.dateTo.getTime())) {
             console.warn("Skipping record with invalid date during grouping filter:", record);
            return false;
        }
        const recordStart = record.dateFrom.getTime();
        const recordEnd = record.dateTo.getTime();
        const rangeStart = dateRange.from!.getTime();
        const rangeEnd = dateRange.to!.getTime();
        return recordStart >= rangeStart && recordEnd <= rangeEnd;
      })
      : allWageRecords;

    const grouped = recordsToGroup.reduce((acc: {[key: string]: GroupedWageRecord}, record) => {
      if (!(record.dateFrom instanceof Date) || isNaN(record.dateFrom.getTime()) || !(record.dateTo instanceof Date) || isNaN(record.dateTo.getTime())) {
          return acc; // Skip invalid records
      }
      const payPeriodKey = `${format(record.dateFrom, 'yyyy-MM-dd')}_${format(record.dateTo, 'yyyy-MM-dd')}`;

      if (!acc[payPeriodKey]) {
        acc[payPeriodKey] = {
          records: [],
          totalWages: 0,
          dateFrom: record.dateFrom,
          dateTo: record.dateTo,
          payPeriodKey: payPeriodKey
        };
      }
      acc[payPeriodKey].records.push(record);
      acc[payPeriodKey].totalWages += (typeof record.netPay === 'number' ? record.netPay : 0);
      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => b.dateFrom.getTime() - a.dateFrom.getTime());
  }, [allWageRecords, dateRange]);

  // Get records for the selected period
  const selectedPeriodRecords = useMemo(() => {
    if (!selectedPayPeriodKey) return [];
    const selectedGroup = groupedWageRecords.find(group => group.payPeriodKey === selectedPayPeriodKey);
    return selectedGroup ? selectedGroup.records : [];
  }, [selectedPayPeriodKey, groupedWageRecords]);

  // --- Event Handlers ---
  const handlePeriodSelect = (key: string) => {
    setSelectedPayPeriodKey(key);
  };

  const handleLogout = () => {
    // Implement logout logic if needed (e.g., clearing tokens)
    router.push("/");
  };

  const handleDeleteRecords = () => {
    if (deletePassword !== ADMIN_PASSWORD) {
      toast({ title: 'Error', description: 'Incorrect password.', variant: 'destructive' });
      setDeletePassword('');
      return;
    }

    if (!selectedPayPeriodKey) {
      toast({ title: 'Error', description: 'Please select a pay period to delete.', variant: 'destructive' });
      return;
    }

    const selectedGroup = groupedWageRecords.find(group => group.payPeriodKey === selectedPayPeriodKey);
    if (!selectedGroup) {
        toast({ title: 'Error', description: 'Selected pay period not found.', variant: 'destructive' });
        return;
    }

    const { dateFrom: dateFromToDelete, dateTo: dateToToDelete } = selectedGroup;

    const updatedWageRecords = allWageRecords.filter(record => {
        if (!(record.dateFrom instanceof Date) || isNaN(record.dateFrom.getTime()) ||
            !(record.dateTo instanceof Date) || isNaN(record.dateTo.getTime())) {
            return true; // Keep potentially invalid records for now
        }
        return !(record.dateFrom.getTime() === dateFromToDelete.getTime() && record.dateTo.getTime() === dateToToDelete.getTime());
    });

    localStorage.setItem('wageRecords', JSON.stringify(updatedWageRecords));
    setAllWageRecords(updatedWageRecords);
    setSelectedPayPeriodKey(null); // Deselect the period
    setDeletePassword(''); // Clear password

    toast({ title: 'Success', description: 'Wage records deleted successfully!' });

    // Manually close the dialog if needed
     const cancelBtn = document.getElementById('deleteDialogCancel') as HTMLElement | null;
     if (cancelBtn) {
         cancelBtn.click();
     }
  };

  // --- Export Functions ---
  const exportToCSV = (type: 'BSP' | 'BRED') => {
    if (!selectedPayPeriodKey) {
      toast({ title: 'Error', description: 'Please select a pay period to export.', variant: 'destructive' });
      return;
    }

    const recordsToExport = selectedPeriodRecords;

    if (recordsToExport.length === 0) {
      toast({ title: 'Info', description: 'No records to export for this period.', variant: 'default' });
      return;
    }

    const onlineTransferRecords = recordsToExport.filter(record => {
      const employee = employees.find(emp => emp.id === record.employeeId);
      return employee?.paymentMethod === 'online';
    });

    if (onlineTransferRecords.length === 0) {
         toast({ title: 'Info', description: `No online transfer employees found for this period.`, variant: 'default' });
         return;
    }

    let csvData: string = '';
    let fileName = `wage_records_${type}_${selectedPayPeriodKey}.csv`;

    if (type === 'BSP') {
        // No header row for BSP
        const csvRows: string[] = [];
        onlineTransferRecords.forEach(record => {
            const employeeDetails = employees.find(emp => emp.id === record.employeeId);
            csvRows.push([
                employeeDetails?.bankCode || '',
                employeeDetails?.bankAccountNumber || '',
                record.netPay.toFixed(2),
                'Salary', // Fourth column: Salary
                record.employeeName, // Fifth column: Employee Name
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
                '', // Empty Employee 2 Column
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

    const handleExportToBSPCsv = () => {
        exportToCSV('BSP');
    };

    const handleExportToBREDCsv = () => {
        exportToCSV('BRED');
    };


  const exportToExcel = () => {
    if (!selectedPayPeriodKey) {
      toast({ title: 'Error', description: 'Please select a pay period to export.', variant: 'destructive' });
      return;
    }

    const recordsToExport = selectedPeriodRecords;

    if (recordsToExport.length === 0) {
      toast({ title: 'Info', description: 'No records to export for this period.', variant: 'default' });
      return;
    }

    const excelData = [
      [
        'Employee Name', 'Hourly Wage', 'Hours Worked', 'Meal Allowance', // Added Meal Allowance Header
        'FNPF Deduction', 'Other Deductions', 'Gross Pay', 'Net Pay',
        'Date From', 'Date To',
      ],
      ...recordsToExport.map(record => [
        record.employeeName, record.hourlyWage.toFixed(2), record.hoursWorked.toFixed(2),
        record.mealAllowance.toFixed(2), // Added Meal Allowance Data
        record.fnpfDeduction.toFixed(2), record.otherDeductions.toFixed(2),
        record.grossPay.toFixed(2), record.netPay.toFixed(2),
        format(record.dateFrom, 'yyyy-MM-dd'), format(record.dateTo, 'yyyy-MM-dd'),
      ]),
      [ // Totals row
        'Totals', '', '', '', // Adjusted colspan for Meal Allowance
        recordsToExport.reduce((sum, r) => sum + r.fnpfDeduction, 0).toFixed(2),
        recordsToExport.reduce((sum, r) => sum + r.otherDeductions, 0).toFixed(2),
        recordsToExport.reduce((sum, r) => sum + r.grossPay, 0).toFixed(2),
        recordsToExport.reduce((sum, r) => sum + r.netPay, 0).toFixed(2),
        '', '',
      ],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    ws['!cols'] = [ // Adjusted widths if necessary
      {wch: 20}, {wch: 12}, {wch: 12}, {wch: 15}, {wch: 15},
      {wch: 15}, {wch: 12}, {wch: 12}, {wch: 12}, {wch: 12}
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Wage Records');
    XLSX.writeFile(wb, `wage_records_${selectedPayPeriodKey}.xlsx`);

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
      {/* Dark Overlay */}
      <div className="absolute inset-0 w-full h-full bg-black/70 -z-9" />

      {/* Content Area */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col flex-grow">
        {/* Header */}
        <header className="w-full py-4 flex justify-between items-center border-b border-white/20 mb-6">
          <Link href="/wages" passHref>
            <Button variant="ghost" size="icon" className="text-gray-200 hover:bg-white/10">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to Wages Management</span>
            </Button>
          </Link>
          <h1 className="text-xl sm:text-2xl font-semibold text-center text-gray-100 flex-grow px-4">
            Wage Records
          </h1>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" passHref>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <Home className="h-5 w-5" />
                <span className="sr-only">Dashboard</span>
              </Button>
            </Link>
            <Button
              variant="ghost" size="icon" onClick={handleLogout}
              className="text-red-400 hover:bg-white/10 hover:text-red-300" aria-label="Logout"
            >
              <Power className="h-5 w-5" />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </header>

        {/* Main Content Card */}
        <Card className="w-full bg-black/50 backdrop-blur-sm border border-white/20 rounded-xl shadow-xl mb-8 flex-grow">
          <CardHeader>
            <CardTitle className="text-white text-center text-lg sm:text-xl">Wage Records Summary</CardTitle>
            {/* Date Range Picker */}
            <div className="flex justify-center mt-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date" variant={'outline'}
                    className={cn(
                      'w-[240px] sm:w-[300px] justify-start text-left font-normal text-gray-900 bg-white hover:bg-gray-100',
                      !dateRange && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>{format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}</>
                      ) : (
                        format(dateRange.from, 'LLL dd, y')
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white text-black" align="center">
                  <Calendar
                    initialFocus mode="range" defaultMonth={dateRange?.from}
                    selected={dateRange} onSelect={setDateRange} numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>

          <CardContent>
            {/* Pay Period Summary Table */}
            <div className="border border-white/20 rounded-lg overflow-hidden max-h-[300px] overflow-y-auto mb-6">
              <Table>
                <TableHeader className="bg-white/10 sticky top-0 z-10">
                  <TableRow className="hover:bg-transparent">{/* Prevent hover on header */}
                    <TableHead className="text-white border-r border-white/20">Pay Period</TableHead>
                    <TableHead className="text-white">Total Wages</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedWageRecords.length > 0 ? (
                    groupedWageRecords.map((group) => (
                      <TableRow
                        key={group.payPeriodKey}
                        onClick={() => handlePeriodSelect(group.payPeriodKey)}
                        className={cn(
                          "cursor-pointer border-t border-white/10 hover:bg-white/15",
                          selectedPayPeriodKey === group.payPeriodKey && "bg-white/25 font-semibold" // Highlight selected
                        )}
                      >
                        <TableCell className="font-medium text-white border-r border-white/20">{`${format(group.dateFrom, 'MMM dd, yyyy')} - ${format(group.dateTo, 'MMM dd, yyyy')}`}</TableCell>
                        <TableCell className="text-white">${group.totalWages.toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-gray-400 py-4">
                        No wage records found{dateRange?.from ? " for the selected period" : "."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Wage Details Section (Visible when a period is selected) */}
            {selectedPayPeriodKey && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-white mb-4 text-center">
                  Wage Details for {
                      groupedWageRecords.find(g => g.payPeriodKey === selectedPayPeriodKey) ?
                      `${format(groupedWageRecords.find(g => g.payPeriodKey === selectedPayPeriodKey)!.dateFrom, 'MMM dd, yyyy')} - ${format(groupedWageRecords.find(g => g.payPeriodKey === selectedPayPeriodKey)!.dateTo, 'MMM dd, yyyy')}`
                      : 'Selected Period'
                  }
                </h3>
                <div className="border border-white/20 rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-white/10 sticky top-0 z-10">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-white border-r border-white/20">Employee</TableHead>
                        <TableHead className="text-white border-r border-white/20">Bank</TableHead>{/* Combined Bank Info */}
                        <TableHead className="text-white border-r border-white/20">Account #</TableHead>
                        <TableHead className="text-white border-r border-white/20">Wage</TableHead>
                        <TableHead className="text-white border-r border-white/20">Hours</TableHead>
                        <TableHead className="text-white border-r border-white/20">Meal</TableHead>
                        <TableHead className="text-white border-r border-white/20">FNPF</TableHead>
                        <TableHead className="text-white border-r border-white/20">Deduct</TableHead>
                        <TableHead className="text-white border-r border-white/20">Gross</TableHead>
                        <TableHead className="text-white">Net</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPeriodRecords.map((record) => {
                        const employee = employees.find(emp => emp.id === record.employeeId);
                        return (
                          <TableRow key={record.employeeId + record.dateFrom.toISOString()} className="border-t border-white/10 hover:bg-white/5">
                            <TableCell className="text-white border-r border-white/20">{record.employeeName}</TableCell>
                             <TableCell className="text-white border-r border-white/20">{employee?.paymentMethod === 'online' ? employee.bankCode : 'Cash'}</TableCell>
                            <TableCell className="text-white border-r border-white/20">{employee?.paymentMethod === 'online' ? employee.bankAccountNumber : 'N/A'}</TableCell>
                            <TableCell className="text-white border-r border-white/20">${record.hourlyWage?.toFixed(2)}</TableCell>
                            <TableCell className="text-white border-r border-white/20">{record.hoursWorked?.toFixed(2)}</TableCell>
                            <TableCell className="text-white border-r border-white/20">${record.mealAllowance?.toFixed(2)}</TableCell>
                            <TableCell className="text-white border-r border-white/20">{employee?.fnpfEligible ? `$${record.fnpfDeduction?.toFixed(2)}` : 'N/A'}</TableCell>
                            <TableCell className="text-white border-r border-white/20">${record.otherDeductions?.toFixed(2)}</TableCell>
                            <TableCell className="text-white border-r border-white/20">${record.grossPay?.toFixed(2)}</TableCell>
                            <TableCell className="text-white">${record.netPay?.toFixed(2)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Action Buttons for Selected Period */}
                <div className="flex flex-wrap gap-3 mt-6 justify-center">
                  <Button variant="secondary" onClick={handleExportToBSPCsv} className="min-w-[140px] hover:bg-gray-700/80" disabled={!selectedPayPeriodKey}>
                    <FileDown className="mr-2 h-4 w-4" /> BSP CSV
                  </Button>
                  <Button variant="secondary" onClick={handleExportToBREDCsv} className="min-w-[140px] hover:bg-gray-700/80" disabled={!selectedPayPeriodKey}>
                    <FileDown className="mr-2 h-4 w-4" /> BRED CSV
                  </Button>
                  <Button variant="secondary" onClick={exportToExcel} className="min-w-[140px] hover:bg-gray-700/80" disabled={!selectedPayPeriodKey}>
                    <FileText className="mr-2 h-4 w-4" /> Excel
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="min-w-[140px]" disabled={!selectedPayPeriodKey}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Records
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-gray-900 border-white/20 text-white">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-300">
                          Delete wage records for the selected period? This cannot be undone. Enter admin password.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="grid gap-2">
                        <Label htmlFor="password-delete" className="text-gray-300">Admin Password</Label>
                        <Input
                          id="password-delete" type="password" value={deletePassword}
                          onChange={e => setDeletePassword(e.target.value)}
                          className="bg-gray-800 border-white/20 text-white"
                          onKeyPress={(e) => { if (e.key === 'Enter') handleDeleteRecords(); }}
                        />
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel id="deleteDialogCancel" onClick={() => setDeletePassword('')} className="border-white/20 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteRecords} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="w-full text-center py-4 text-xs text-white mt-auto relative z-10">
          © {new Date().getFullYear()} Aayush Atishay Lal 北京化工大学
        </footer>
      </div>
    </div>
  );
};

export default WagesRecordsPage;
