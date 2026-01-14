# Product Catalog System - User Guide

## Overview
Your POS system now includes a comprehensive **Catalog Manager** that allows you to organize products with multiple variants and track inventory using lot numbers.

## Features

### 1. **Variant Management**
- Create multiple variants for a single product (e.g., different sizes, colors, models)
- Each variant has its own:
  - **SKU** - Unique identifier for the variant
  - **Price** - Retail price for this variant
  - **Cost Price** - Cost of goods for this variant
  - **Stock** - Current quantity available

### 2. **Lot Number Tracking**
- Assign lot numbers to track inventory in batches
- For each lot, you can record:
  - **Lot Number** - Unique identifier (e.g., LOT-2024-001)
  - **Quantity** - Number of units in this lot
  - **Cost Price** - Acquisition cost per unit
  - **Manufacturing Date** - When the items were produced
  - **Expiry Date** - When items expire (optional)
  - **Status** - Active, Expired, or Archived

### 3. **Inventory Summary**
- Real-time stock totals across all variants
- Total inventory value calculation
- Visual status badges for lot tracking

## How to Use

### Adding a Variant

1. Go to **Inventory & Stock** section
2. Find your product and click the **Boxes icon** (📦) to open Catalog Manager
3. Click **"Add Variant"** button
4. Fill in:
   - Variant Name (e.g., "Red XL", "Size 10")
   - Variant SKU (unique identifier)
   - Price (retail price for this variant)
   - Cost Price
   - Initial Stock
5. Click **"Create Variant"**

### Adding a Lot to a Variant

1. Open the Catalog Manager for your product
2. Click on a variant to select it and see its details
3. Click **"Add Lot"** button
4. Enter:
   - **Lot Number** - e.g., "LOT-2024-001"
   - **Quantity** - e.g., "50"
   - **Cost Price** - Cost per unit for this lot
   - **Manufacturing Date** (optional)
   - **Expiry Date** (optional)
5. Click **"Add Lot"**

### Editing Lot Quantities

- Click on the quantity field in the lot table
- Enter the new quantity and it will auto-save
- Stock totals update automatically

### Deleting Items

- **Delete Variant**: Click the trash icon on a variant row
- **Delete Lot**: Click the trash icon in the lot's action column

## Data Flow

```
Product
  ├── Variant 1 (Size S)
  │   ├── Lot 1 (LOT-001) - 50 units
  │   └── Lot 2 (LOT-002) - 30 units
  │   └── Total Stock: 80 units
  │
  └── Variant 2 (Size M)
      ├── Lot 1 (LOT-001) - 40 units
      └── Total Stock: 40 units

Total Product Stock: 120 units
```

## Key Benefits

✅ **Track Expiry Dates** - Know which batches expire when
✅ **Batch Pricing** - Different costs for different purchase batches
✅ **FIFO Management** - Organize lots by date for first-in-first-out selling
✅ **Variant Flexibility** - Handle products in different sizes, colors, or configurations
✅ **Real-time Valuation** - Automatic cost calculations based on lot information

## Tips

- Use consistent naming for variants (e.g., always use "Color Size" format)
- Enter lot numbers from your purchase orders for easy reconciliation
- Set expiry dates for perishable or time-sensitive items
- Archive old lots to keep the interface clean while maintaining records
- Update stock manually when inventory is received

## Integration with Other Modules

- **POS System**: Variants and lots are available for selection at checkout
- **Inventory Reports**: Track stock by lot for better reporting
- **Purchase Orders**: Link received items to their corresponding lots
