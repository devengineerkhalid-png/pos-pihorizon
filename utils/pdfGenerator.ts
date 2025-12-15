
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Invoice, AppSettings, Purchase, CartItem, LedgerEntry, Expense } from "../types";

// Helper to format currency
const formatCurrency = (amount: number, symbol: string) => {
    return `${symbol}${amount.toFixed(2)}`;
};

export const generateInvoicePDF = (invoice: Invoice, settings: AppSettings) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // --- Header ---
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(settings.shopName, pageWidth / 2, 15, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(settings.address, pageWidth / 2, 22, { align: "center" });
    doc.text(`Tel: ${settings.phone} | Email: ${settings.email}`, pageWidth / 2, 27, { align: "center" });

    doc.line(10, 30, pageWidth - 10, 30);

    // --- Invoice Details ---
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    let title = "INVOICE";
    if (invoice.status === 'Paid') title = "SALES RECEIPT";
    if (invoice.status === 'Returned') title = "REFUND RECEIPT";
    doc.text(title, 14, 40);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    // Left Side
    doc.text(`Invoice No: ${invoice.id}`, 14, 48);
    doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`, 14, 53);
    
    // Right Side
    doc.text(`Customer: ${invoice.customerName}`, pageWidth - 14, 48, { align: "right" });
    doc.text(`Payment: ${invoice.paymentMethod || 'N/A'}`, pageWidth - 14, 53, { align: "right" });

    // --- Items Table ---
    const tableColumn = ["Item", "Qty", "Price", "Total"];
    const tableRows: any[] = [];

    invoice.items?.forEach((item) => {
        const itemTotal = item.price * item.quantity;
        const itemName = item.variantName ? `${item.name} (${item.variantName})` : item.name;
        tableRows.push([
            itemName,
            item.quantity.toString(),
            formatCurrency(item.price, settings.currencySymbol),
            formatCurrency(itemTotal, settings.currencySymbol),
        ]);
    });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 60,
        theme: 'grid',
        headStyles: { fillColor: [40, 40, 40], textColor: 255 },
        styles: { fontSize: 9 },
        margin: { top: 60 },
    });

    // @ts-ignore
    let finalY = doc.lastAutoTable.finalY + 10;

    // --- Returns Section (if any) ---
    const totalReturned = (invoice.returns || []).reduce((acc, r) => acc + r.totalRefund, 0);

    if (invoice.returns && invoice.returns.length > 0) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(185, 28, 28); // Red-700
        doc.text("Returns / Refunds", 14, finalY);
        doc.setTextColor(0, 0, 0); // Reset

        const returnRows: any[] = [];
        invoice.returns.forEach(ret => {
            ret.items.forEach(item => {
                returnRows.push([
                    `${new Date(ret.date).toLocaleDateString()} - ${item.reason}`,
                    item.productName,
                    `-${item.quantity}`,
                    `-${formatCurrency(item.refundAmount, settings.currencySymbol)}`
                ]);
            });
        });

        autoTable(doc, {
            head: [["Date / Reason", "Item", "Qty", "Refund Amount"]],
            body: returnRows,
            startY: finalY + 5,
            theme: 'plain',
            headStyles: { fillColor: [254, 226, 226], textColor: 185 }, // Light red bg
            styles: { fontSize: 8, textColor: [185, 28, 28] }, // Red text
        });

        // @ts-ignore
        finalY = doc.lastAutoTable.finalY + 10;
    }

    // --- Totals ---
    const rightMargin = pageWidth - 14;
    const subtotal = invoice.items?.reduce((acc, i) => acc + (i.price * i.quantity), 0) || 0;
    const taxAmt = subtotal * (settings.taxRate / 100);
    const grossTotal = subtotal + taxAmt; // Before loyalty

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    // Subtotal
    doc.text(`Subtotal:`, rightMargin - 40, finalY);
    doc.text(formatCurrency(subtotal, settings.currencySymbol), rightMargin, finalY, { align: "right" });

    // Tax
    doc.text(`Tax (${settings.taxRate}%):`, rightMargin - 40, finalY + 5);
    doc.text(formatCurrency(taxAmt, settings.currencySymbol), rightMargin, finalY + 5, { align: "right" });

    let currentY = finalY + 10;

    // Loyalty
    if (invoice.loyaltyPointsUsed) {
        doc.text(`Loyalty Disc:`, rightMargin - 40, currentY);
        doc.text(`-${formatCurrency(invoice.loyaltyPointsUsed / 10, settings.currencySymbol)}`, rightMargin, currentY, { align: "right" });
        currentY += 5;
    }

    // Original Total
    doc.setFont("helvetica", "bold");
    doc.text(`Original Total:`, rightMargin - 40, currentY);
    doc.text(formatCurrency(invoice.total, settings.currencySymbol), rightMargin, currentY, { align: "right" });
    currentY += 8;

    // Refunded deduction
    if (totalReturned > 0) {
        doc.setTextColor(185, 28, 28);
        doc.text(`Refunded:`, rightMargin - 40, currentY);
        doc.text(`-${formatCurrency(totalReturned, settings.currencySymbol)}`, rightMargin, currentY, { align: "right" });
        doc.setTextColor(0, 0, 0);
        currentY += 8;

        doc.setFontSize(12);
        doc.text(`Net Paid:`, rightMargin - 40, currentY);
        doc.text(formatCurrency(invoice.total - totalReturned, settings.currencySymbol), rightMargin, currentY, { align: "right" });
    }

    // --- Footer ---
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Thank you for your business!", pageWidth / 2, doc.internal.pageSize.height - 20, { align: "center" });
    doc.text("Generated by POS System", pageWidth / 2, doc.internal.pageSize.height - 15, { align: "center" });

    doc.save(`Invoice_${invoice.id}.pdf`);
};

export const generatePurchaseOrderPDF = (purchase: Purchase, settings: AppSettings) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(purchase.type === 'ORDER' ? "PURCHASE ORDER" : "PURCHASE INVOICE", pageWidth - 14, 20, { align: "right" });

    // Buyer Info (Us)
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(settings.shopName, 14, 20);
    doc.setFont("helvetica", "normal");
    doc.text(settings.address, 14, 25);
    doc.text(settings.phone, 14, 30);
    doc.text(settings.email, 14, 35);

    doc.line(10, 45, pageWidth - 10, 45);

    // Vendor
    doc.text("Vendor / Supplier:", 14, 55);
    doc.setFont("helvetica", "bold");
    doc.text(purchase.supplierName, 14, 60);
    doc.setFont("helvetica", "normal");
    
    doc.text(`PO Number:`, pageWidth - 60, 55);
    doc.text(purchase.invoiceNumber, pageWidth - 14, 55, { align: "right" });
    doc.text(`Date:`, pageWidth - 60, 60);
    doc.text(new Date(purchase.date).toLocaleDateString(), pageWidth - 14, 60, { align: "right" });
    doc.text(`Status:`, pageWidth - 60, 65);
    doc.text(purchase.status, pageWidth - 14, 65, { align: "right" });

    const tableColumn = ["Product / Description", "Qty Ordered", "Received", "Unit Cost", "Total"];
    const tableRows: any[] = [];

    purchase.items.forEach((item) => {
        const total = item.quantity * item.cost;
        tableRows.push([
            item.productName,
            item.quantity,
            item.receivedQuantity,
            formatCurrency(item.cost, settings.currencySymbol),
            formatCurrency(total, settings.currencySymbol),
        ]);
    });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 75,
        theme: 'striped',
        headStyles: { fillColor: [66, 66, 66] },
    });

    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY + 10;
    
    doc.setFont("helvetica", "bold");
    doc.text(`Total Amount: ${formatCurrency(purchase.total, settings.currencySymbol)}`, pageWidth - 14, finalY, { align: "right" });

    doc.save(`PO_${purchase.invoiceNumber}.pdf`);
};

export const generateLedgerPDF = (entries: LedgerEntry[], settings: AppSettings, title: string = "General Ledger") => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header
    doc.setFontSize(18);
    doc.text(title, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
    doc.text(settings.shopName, pageWidth - 14, 15, { align: "right" });

    const tableColumn = ["Date", "Account", "Description", "Ref", "Debit (Out)", "Credit (In)"];
    const tableRows: any[] = [];

    let totalDebit = 0;
    let totalCredit = 0;

    entries.forEach(entry => {
        const isDebit = entry.type === 'DEBIT';
        if (isDebit) totalDebit += entry.amount;
        else totalCredit += entry.amount;

        tableRows.push([
            entry.date,
            entry.accountName,
            entry.description,
            entry.referenceId || '-',
            isDebit ? formatCurrency(entry.amount, settings.currencySymbol) : '',
            !isDebit ? formatCurrency(entry.amount, settings.currencySymbol) : ''
        ]);
    });

    // Totals Row
    tableRows.push([
        '', '', 'TOTALS', '',
        formatCurrency(totalDebit, settings.currencySymbol),
        formatCurrency(totalCredit, settings.currencySymbol)
    ]);

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 30,
        theme: 'grid',
        headStyles: { fillColor: [55, 65, 81] }, // Slate-700
        styles: { fontSize: 8 },
        columnStyles: {
            4: { textColor: [220, 38, 38], fontStyle: 'bold', halign: 'right' }, // Debit Red
            5: { textColor: [5, 150, 105], fontStyle: 'bold', halign: 'right' }  // Credit Green
        },
        didParseCell: (data) => {
            // Bold the totals row
            if (data.row.index === tableRows.length - 1) {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fillColor = [243, 244, 246]; // Gray bg
            }
        }
    });

    doc.save(`Ledger_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateExpenseReportPDF = (expenses: Expense[], settings: AppSettings) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    doc.setFontSize(18);
    doc.text("Expense Report", 14, 15);
    doc.setFontSize(10);
    doc.text(settings.shopName, 14, 22);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 14, 15, { align: "right" });

    const tableColumn = ["Date", "Expense Title", "Category", "Status", "Amount"];
    const tableRows: any[] = [];
    let totalAmount = 0;

    expenses.forEach(exp => {
        totalAmount += exp.amount;
        tableRows.push([
            exp.date,
            exp.title,
            exp.category.toUpperCase(),
            exp.status,
            formatCurrency(exp.amount, settings.currencySymbol)
        ]);
    });

    tableRows.push(['', '', '', 'TOTAL', formatCurrency(totalAmount, settings.currencySymbol)]);

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 30,
        theme: 'striped',
        headStyles: { fillColor: [234, 88, 12] }, // Orange-600
        columnStyles: {
            4: { halign: 'right', fontStyle: 'bold' }
        },
        didParseCell: (data) => {
            if (data.row.index === tableRows.length - 1) {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fillColor = [255, 237, 213]; // Orange-100
            }
        }
    });

    doc.save(`Expense_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};
