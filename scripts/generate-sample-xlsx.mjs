// Generate a sample upload template (sample-sales-template.xlsx) demonstrating
// the exact column format the dashboard expects.
//   Usage: node scripts/generate-sample-xlsx.mjs
import * as XLSX from "xlsx";
import { mkdirSync } from "node:fs";

const rows = [
  { Date: "2026-01-05", Invoice_No: "INV-9001", Customer_Name: "Apex Retail", Company_Name: "Siam Group", Salesperson: "Somchai P.", Product_Code: "P-1001", Product_Name: "Premium Coffee Beans 1kg", Category: "Beverages", Quantity: 10, Unit_Price: 850, Sales_Amount: 8500, Province: "Bangkok" },
  { Date: "2026-01-05", Invoice_No: "INV-9001", Customer_Name: "Apex Retail", Company_Name: "Siam Group", Salesperson: "Somchai P.", Product_Code: "P-3001", Product_Name: "Wireless Earbuds Pro", Category: "Electronics", Quantity: 3, Unit_Price: 2490, Sales_Amount: 7470, Province: "Bangkok" },
  { Date: "2026-01-06", Invoice_No: "INV-9002", Customer_Name: "Bright Living", Company_Name: "Bangkok Holdings", Salesperson: "Wanida K.", Product_Code: "P-2002", Product_Name: "Ceramic Dinner Set", Category: "Homeware", Quantity: 5, Unit_Price: 1290, Sales_Amount: 6450, Province: "Chiang Mai" },
  { Date: "2026-01-07", Invoice_No: "INV-9003", Customer_Name: "Crystal Mart", Company_Name: "Andaman Industries", Salesperson: "Anan T.", Product_Code: "P-5001", Product_Name: "Vitamin C Serum", Category: "Beauty", Quantity: 12, Unit_Price: 690, Sales_Amount: 8280, Province: "Phuket" },
  { Date: "2026-01-08", Invoice_No: "INV-9004", Customer_Name: "Delta Foods", Company_Name: "Mekong Partners", Salesperson: "Ploy S.", Product_Code: "P-4002", Product_Name: "Denim Jacket", Category: "Apparel", Quantity: 4, Unit_Price: 1490, Sales_Amount: 5960, Province: "Khon Kaen" },
];

const ws = XLSX.utils.json_to_sheet(rows);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Sales");
mkdirSync("public", { recursive: true });
XLSX.writeFile(wb, "public/sample-sales-template.xlsx");
console.log("Wrote public/sample-sales-template.xlsx");
