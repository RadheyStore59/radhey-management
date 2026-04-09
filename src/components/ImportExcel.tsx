import React, { useState } from 'react';
import { LocalStorageDB } from '../utils/localStorage';
import * as XLSX from 'xlsx';

export default function ImportExcel() {
  const [activeTab, setActiveTab] = useState<'sales' | 'inventory'>('sales');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    records?: number;
  } | null>(null);

  const salesColumns = [
    { key: 'sr_no', label: 'Sr.no.', required: false },
    { key: 'invoice_number', label: 'Invoice No.', required: false },
    { key: 'radhey_invoice', label: 'Radhey Invoice', required: false },
    { key: 'order_date', label: 'Order date', required: false },
    { key: 'order_taken_date', label: 'Order Taken Date', required: false },
    { key: 'order_ready_date', label: 'Order Ready Date', required: false },
    { key: 'product_name', label: 'Product name', required: false },
    { key: 'customer_name', label: 'Customer name', required: false },
    { key: 'reference', label: 'Reference', required: false },
    { key: 'deal', label: 'Deal', required: false },
    { key: 'dispatch_date', label: 'Dispatch date', required: false },
    { key: 'quantity', label: 'Qauntity', required: false },
    { key: 'buy_price', label: 'Buy price', required: false },
    { key: 'sell_price', label: 'Sell price', required: false },
    { key: 'profit', label: 'Profit', required: false },
    { key: 'payment_by', label: 'Payment By', required: false },
    { key: 'payment_through', label: 'Payment Through', required: false },
    { key: 'received_through_client', label: 'We Received Through Clinet', required: false },
    { key: 'profit_given', label: 'Profit Given', required: false },
    { key: 'dealer_name', label: 'Dealer Name', required: false },
    { key: 'remarks', label: 'Remarks', required: false },
    { key: 'phone_no', label: 'Phone No.', required: false },
  ];

  const inventoryColumns = [
    { key: 'product_name', label: 'Product Name', required: true },
    { key: 'product_code', label: 'Product Code', required: true },
    { key: 'category', label: 'Category', required: true },
    { key: 'purchase_price', label: 'Purchase Price', required: true },
    { key: 'selling_price', label: 'Selling Price', required: true },
    { key: 'stock_quantity', label: 'Stock Quantity', required: true },
    { key: 'minimum_stock_level', label: 'Minimum Stock Level', required: false },
    { key: 'supplier_name', label: 'Supplier Name', required: false },
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);

    try {
      const data = new Uint8Array(await file.arrayBuffer());
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Use raw: false to get formatted strings as seen in Excel, avoiding locale conversion issues
      const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' });

      if (rawData.length === 0) {
        throw new Error('No data found in the file');
      }

      const columns = activeTab === 'sales' ? salesColumns : inventoryColumns;
      
      // Find header row
      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(rawData.length, 10); i++) {
        const row = rawData[i].map(c => String(c).toLowerCase().trim());
        if (row.some(c => c.includes('invoice') || c.includes('product') || c.includes('customer') || c.includes('sr.no'))) {
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex === -1) {
        headerRowIndex = 0; // Fallback to first row
      }

      const headers = rawData[headerRowIndex].map(h => String(h).trim());
      const dataRows = rawData.slice(headerRowIndex + 1);

      // Map and validate data
      const mappedData = dataRows
        .filter(rowArray => {
          // Skip empty rows
          if (!rowArray.some(cell => cell !== '' && cell !== null && cell !== undefined)) return false;
          
          // Skip template rows (containing "Required" or "Optional")
          const rowText = rowArray.join(' ');
          if (rowText.includes('Required ') || rowText.includes('Optional ')) return false;
          
          return true;
        })
        .map((rowArray: any[]) => {
          const mapped: any = {};
          const rowObj: any = {};
          headers.forEach((h, i) => {
            rowObj[h] = rowArray[i];
            rowObj[h.toLowerCase()] = rowArray[i];
          });
          
          columns.forEach(col => {
            if (col.key === 'sr_no') return; // Skip Sr.no mapping to object

            let possibleKeys = [col.label, col.key, col.label.toLowerCase(), col.key.toLowerCase()];
            if (col.key === 'quantity') possibleKeys.push('Quantity', 'quantity', 'Qty');
            if (col.key === 'received_through_client') possibleKeys.push('We Received Through Client', 'received_through_client');
            if (col.key === 'phone_no') possibleKeys.push('Phone No.', 'Mobile Number', 'Phone Number', 'phone_no');
            if (col.key === 'dealer_name') possibleKeys.push('Dealer Name', 'Dealer name', 'Dealer');
            
            let value = '';
            for (let pkey of possibleKeys) {
              if (rowObj[pkey] !== undefined && rowObj[pkey] !== '') {
                value = rowObj[pkey];
                break;
              }
            }
            
            if (col.required && !value) {
              throw new Error(`Missing required field: ${col.label}`);
            }

            // Convert numeric fields based on key
            if (['quantity', 'buy_price', 'sell_price', 'profit', 'profit_given', 'purchase_price', 'stock_quantity', 'minimum_stock_level'].includes(col.key)) {
              // Handle currency symbols and commas
              if (typeof value === 'string') {
                value = value.replace(/[₹,]/g, '');
              }
              mapped[col.key] = parseFloat(value as any) || 0;
            } else if (['order_date', 'order_taken_date', 'order_ready_date', 'dispatch_date', 'last_updated_date'].includes(col.key)) {
               // Handle dates
               if (value) {
                 try {
                    // Normalize DD/MM/YYYY strings strictly (e.g., 03/04/2026 = 3rd April)
                    if (typeof value === 'string' && value.includes('/')) {
                       const parts = value.split('/');
                       if (parts.length === 3) {
                          const d = parts[0].trim().padStart(2, '0');
                          const m = parts[1].trim().padStart(2, '0');
                          let y = parts[2].trim();
                          if (y.length === 2) y = `20${y}`;
                          // ALWAYS store internally as YYYY-MM-DD (e.g., 2026-04-03)
                          mapped[col.key] = `${y}-${m}-${d}`;
                       } else {
                          mapped[col.key] = value;
                       }
                    } else if (typeof value === 'number') {
                      // Just in case it's still a number
                      const date = XLSX.SSF.parse_date_code(value);
                      mapped[col.key] = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
                    } else {
                      const d = new Date(value);
                      if (!isNaN(d.getTime())) {
                        mapped[col.key] = d.toISOString().split('T')[0];
                      } else {
                        mapped[col.key] = value;
                      }
                    }
                 } catch (e) {
                   mapped[col.key] = value;
                 }
               } else {
                 mapped[col.key] = new Date().toISOString().split('T')[0];
               }
            } else {
               // ensure strings
              mapped[col.key] = (value !== null && value !== undefined) ? String(value) : '';
            }
          });

          // Ensure profit is calculated correctly if missing
          if (activeTab === 'sales') {
             const buy = mapped.buy_price || 0;
             const sell = mapped.sell_price || 0;
             if (!mapped.profit) {
                mapped.profit = sell - buy;
             }
          }

          return mapped;
        });

      if (mappedData.length === 0) {
        throw new Error('No valid data rows found to import.');
      }

      // Insert data in BULK instead of calling addSale sequentially which re-fetches storage each time
      if (activeTab === 'sales') {
        const existingSales = LocalStorageDB.getSales();
        const newSales = mappedData.map((sale: any) => ({
           ...sale,
           id: crypto.randomUUID(),
           created_at: new Date().toISOString()
        }));
        LocalStorageDB.saveSales([...existingSales, ...newSales]);
      } else {
        const existingInv = LocalStorageDB.getInventory();
        const newInv = mappedData.map((item: any) => ({
           ...item,
           id: crypto.randomUUID(),
           created_at: new Date().toISOString()
        }));
        LocalStorageDB.saveInventory([...existingInv, ...newInv]);
      }

      setUploadResult({
        success: true,
        message: `Successfully bulk imported ${mappedData.length} records.`,
        records: mappedData.length,
      });

      // Clear file input
      e.target.value = '';
    } catch (error: any) {
      setUploadResult({
        success: false,
        message: error.message || 'Error importing file',
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const columns = activeTab === 'sales' ? salesColumns : inventoryColumns;
    const templateData: any = [{}];
    
    columns.forEach(col => {
      templateData[0][col.label] = col.required ? `Required ${col.label}` : `Optional ${col.label}`;
    });

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, `${activeTab}_import_template.xlsx`);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Import Excel</h1>
        <p className="text-gray-600 mt-2">Import your existing data from Excel files</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('sales')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'sales'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Import Sales
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'inventory'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Import Inventory
            </button>
          </nav>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Upload {activeTab === 'sales' ? 'Sales' : 'Inventory'} Data
          </h3>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Excel File (.xlsx, .xls, .csv)
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                disabled={uploading}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {uploading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                  <div className="text-blue-600">Uploading...</div>
                </div>
              )}
            </div>
          </div>

          {uploadResult && (
            <div
              className={`p-4 rounded-lg mb-4 flex items-center gap-3 ${
                uploadResult.success
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              {uploadResult.success ? (
                <span className="text-xl">✅</span>
              ) : (
                <span className="text-xl">❌</span>
              )}
              <div>
                <p className="font-medium">
                  {uploadResult.success ? 'Success!' : 'Error!'}
                </p>
                <p className="text-sm">{uploadResult.message}</p>
              </div>
              <button
                onClick={() => setUploadResult(null)}
                className="ml-auto"
              >
                <span className="text-lg">✕</span>
              </button>
            </div>
          )}

          <button
            onClick={downloadTemplate}
            className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
          >
            <span className="text-lg">⬇️</span>
            Download Template
          </button>
        </div>

        {/* Instructions Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Import Instructions
          </h3>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Step 1: Download Template</h4>
              <p className="text-sm text-gray-600">
                Click the "Download Template" button to get a pre-formatted Excel file with the correct column headers.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">Step 2: Fill Your Data</h4>
              <p className="text-sm text-gray-600">
                Open the template and fill in your data. Make sure all required fields are completed.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">Step 3: Upload File</h4>
              <p className="text-sm text-gray-600">
                Select your completed file and click upload. The system will validate and import your data.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Required Columns:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                {(activeTab === 'sales' ? salesColumns : inventoryColumns)
                  .filter(col => col.required)
                  .map(col => (
                    <li key={col.key} className="flex items-center gap-2">
                      <span>✓</span>
                      {col.label}
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Column Reference */}
      <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Column Reference
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Column Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Required
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Example
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(activeTab === 'sales' ? salesColumns : inventoryColumns).map((col) => (
                <tr key={col.key}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {col.label}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {col.required ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Required
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Optional
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {getColumnDescription(col.key, activeTab)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getColumnExample(col.key, activeTab)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  function getColumnDescription(key: string, type: 'sales' | 'inventory'): string {
    const descriptions: Record<string, string> = {
      invoice_number: 'Unique invoice number for the sale',
      customer_name: 'Name of the customer',
      mobile_number: 'Customer mobile number',
      product_name: 'Name of the product sold',
      quantity: 'Number of units sold',
      rate: 'Price per unit',
      total_amount: 'Total amount for the sale (quantity × rate)',
      payment_mode: 'Payment method used',
      sales_date: 'Date of the sale',
      sales_person: 'Name of the sales person',
      notes: 'Additional notes about the sale',
      product_code: 'Unique product identifier',
      category: 'Product category',
      purchase_price: 'Cost price per unit',
      selling_price: 'Selling price per unit',
      stock_quantity: 'Current stock quantity',
      minimum_stock_level: 'Minimum stock level before reorder',
      supplier_name: 'Name of the supplier',
    };
    return descriptions[key] || '';
  }

  function getColumnExample(key: string, type: 'sales' | 'inventory'): string {
    const examples: Record<string, string> = {
      invoice_number: 'INV-001',
      customer_name: 'John Doe',
      mobile_number: '+1234567890',
      product_name: 'Product A',
      quantity: '10',
      rate: '100',
      total_amount: '1000',
      payment_mode: 'Cash',
      sales_date: '2024-01-01',
      sales_person: 'Jane Smith',
      notes: 'Urgent delivery',
      product_code: 'PROD-001',
      category: 'Electronics',
      purchase_price: '50',
      selling_price: '100',
      stock_quantity: '50',
      minimum_stock_level: '10',
      supplier_name: 'ABC Suppliers',
    };
    return examples[key] || '';
  }
}
