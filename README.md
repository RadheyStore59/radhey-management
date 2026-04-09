# Radhey Management System

A comprehensive business management system built with React.js and Supabase for managing leads, sales, inventory, and reporting.

## Features

### Core Modules
- **Dashboard**: Real-time statistics with charts and business insights
- **Leads Management**: Complete lead tracking and conversion system
- **Sales Management**: Sales transactions with Excel import/export
- **Inventory Management**: Stock control with low-stock alerts
- **Reports**: Comprehensive business reporting with export options
- **Import Excel**: Bulk data import from Excel files
- **Settings**: User management and system configuration

### Key Features
- **Modern UI**: Professional dashboard with collapsible sidebar
- **Authentication**: Secure multi-user system with role-based access
- **Excel Integration**: Import/export data for Sales and Inventory
- **Real-time Updates**: Auto-refreshing dashboard and statistics
- **Mobile Responsive**: Works seamlessly on all devices
- **Data Visualization**: Interactive charts and graphs
- **Low Stock Alerts**: Automatic notifications for inventory management

## Tech Stack

- **Frontend**: React.js with TypeScript
- **Backend**: Supabase (Database + Auth + Storage)
- **Styling**: Tailwind CSS with modern design
- **Charts**: Chart.js for data visualization
- **Excel Processing**: xlsx library for file handling
- **Icons**: Lucide React for modern iconography
- **State Management**: React Context API

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd radhey-management
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Navigate to Settings > API to get your URL and anon key
3. Create a `.env` file in the root directory:

```
REACT_APP_SUPABASE_URL=your_supabase_url_here
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. Create Database Schema

Go to the Supabase SQL Editor and run the SQL from `database_schema.sql` file, or copy the complete schema provided in the file.

### 4. Run the Application

```bash
npm start
```

The application will be available at `http://localhost:3000`

## Module Details

### Dashboard
- **Summary Cards**: Total Leads, Sales, Revenue, Inventory, Low Stock
- **Charts**: Monthly Sales, Revenue Trends, Sales vs Inventory
- **Recent Activity**: Latest sales, leads, and low stock items
- **Real-time Updates**: Auto-refresh when new data is added

### Leads Management
- **Fields**: Lead Name, Mobile, Email, Address, Source, Status, Notes, Date
- **Status Tracking**: New, Contacted, Converted, Lost
- **Actions**: Add, Edit, Delete, Convert to Sale
- **Search & Filter**: By name, status, source, date

### Sales Management
- **Fields**: Invoice Number, Customer, Product, Quantity, Rate, Total Amount
- **Auto Calculation**: Total amount automatically calculated
- **Payment Modes**: Cash, UPI, Bank
- **Excel Integration**: Import/export sales data
- **Search & Filter**: By customer, invoice, date, product

### Inventory Management
- **Fields**: Product Name, Code, Category, Purchase/Selling Price, Stock
- **Stock Control**: Increase/decrease stock with reason tracking
- **Low Stock Alerts**: Automatic notifications when stock is low
- **Excel Integration**: Import/export inventory data
- **Supplier Management**: Track supplier information

### Reports Module
- **Daily Sales Report**: Day-wise sales breakdown
- **Monthly Sales Report**: Monthly performance analysis
- **Inventory Report**: Complete stock status
- **Low Stock Report**: Items needing restocking
- **Export Options**: Excel and PDF formats

### Import Excel
- **Template Download**: Pre-formatted Excel templates
- **Column Mapping**: Automatic field mapping
- **Validation**: Data validation before import
- **Bulk Import**: Handle large Excel files
- **Error Handling**: Detailed error reporting

### Settings
- **User Management**: Add/edit users with role-based access
- **Profile Settings**: User account management
- **Data Export**: Backup all system data
- **System Information**: Application details and status

## User Roles

### Admin
- Full access to all modules
- User management capabilities
- Data export and system settings
- Can delete/clear data

### Staff
- Access to all modules except user management
- Can add/edit/delete their own data
- Limited system settings access

## Color Coding

### Lead Status
- **New** → Blue
- **Contacted** → Yellow
- **Converted** → Green
- **Lost** → Red

### Payment Modes
- **Cash** → Green
- **UPI** → Blue
- **Bank** → Purple

## Project Structure

```
src/
├── components/
│   ├── Sidebar.tsx           # Navigation sidebar
│   ├── NewDashboard.tsx      # Main dashboard with charts
│   ├── LeadsManagement.tsx   # Lead management module
│   ├── SalesManagement.tsx    # Sales management module
│   ├── InventoryManagement.tsx # Inventory management module
│   ├── Reports.tsx           # Reports module
│   ├── ImportExcel.tsx       # Excel import module
│   ├── Settings.tsx          # Settings module
│   └── Login.tsx            # Authentication
├── contexts/
│   └── AuthContext.tsx       # Authentication context
├── types/
│   └── index.ts             # TypeScript interfaces
├── utils/
│   └── supabase.ts          # Supabase client
├── App.tsx                  # Main application
├── index.tsx                # React entry point
└── index.css                # Tailwind CSS imports
```

## Environment Variables

Create a `.env` file with your Supabase credentials:

```
REACT_APP_SUPABASE_URL=your_supabase_url_here
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Default Admin Account

After setting up the database:
1. Sign up with email: `admin@radhey.com`
2. The system will automatically create an admin profile
3. Use this account to manage other users and system settings

## Excel Import Format

### Sales Import Template
- Invoice Number (Required)
- Customer Name (Required)
- Mobile Number (Required)
- Product Name (Required)
- Quantity (Required)
- Rate (Required)
- Total Amount (Required)
- Payment Mode (Optional)
- Sales Date (Optional)
- Sales Person (Optional)
- Notes (Optional)

### Inventory Import Template
- Product Name (Required)
- Product Code (Required)
- Category (Required)
- Purchase Price (Required)
- Selling Price (Required)
- Stock Quantity (Required)
- Minimum Stock Level (Optional)
- Supplier Name (Optional)

## Performance Features

- **Optimized Queries**: Database indexes for fast performance
- **Lazy Loading**: Components load data as needed
- **Caching**: Efficient data caching strategies
- **Responsive Design**: Mobile-first approach
- **Error Handling**: Comprehensive error management

## Security Features

- **Row Level Security**: Users can only access their own data
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Input sanitization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
