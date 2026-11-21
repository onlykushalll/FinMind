import { jsPDF } from 'jspdf';
import type { DashboardSummary } from '@/api/dashboard';

interface WeeklyDigestData {
  period: string;
  netFlow: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  upcomingBillsTotal: number;
  upcomingBillsCount: number;
  recentTransactions: Array<{
    id: string;
    description: string;
    date: string;
    amount: number;
    currency: string;
    type: 'INCOME' | 'EXPENSE';
  }>;
  categoryBreakdown: Array<{
    category_id: string;
    amount: number;
  }>;
}

export function generateWeeklyDigestPDF(data: WeeklyDigestData): Uint8Array {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Weekly Financial Summary', margin, 30);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Period: ${data.period}`, margin, 45);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, 55);
  
  // Summary Section
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Financial Overview', margin, 80);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  // Summary metrics
  const summaryY = 95;
  const summarySpacing = 15;
  
  doc.text(`Net Flow: $${data.netFlow.toFixed(2)}`, margin, summaryY);
  doc.text(`Monthly Income: $${data.monthlyIncome.toFixed(2)}`, margin, summaryY + summarySpacing);
  doc.text(`Monthly Expenses: $${data.monthlyExpenses.toFixed(2)}`, margin, summaryY + summarySpacing * 2);
  doc.text(`Upcoming Bills: $${data.upcomingBillsTotal.toFixed(2)} (${data.upcomingBillsCount} bills)`, margin, summaryY + summarySpacing * 3);
  
  // Recent Transactions
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Recent Transactions', margin, 180);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  let transactionY = 195;
  const transactionSpacing = 12;
  
  // Table headers
  doc.text('Description', margin, transactionY);
  doc.text('Date', margin + 100, transactionY);
  doc.text('Amount', margin + 140, transactionY);
  
  transactionY += 10;
  
  // Transaction rows
  data.recentTransactions.slice(0, 10).forEach(transaction => {
    if (transactionY > pageHeight - 20) {
      doc.addPage();
      transactionY = 30;
    }
    
    doc.text(transaction.description, margin, transactionY);
    doc.text(new Date(transaction.date).toLocaleDateString(), margin + 100, transactionY);
    doc.text(
      `${transaction.type === 'INCOME' ? '+' : '-'}$${Math.abs(transaction.amount).toFixed(2)}`,
      margin + 140,
      transactionY
    );
    
    transactionY += transactionSpacing;
  });
  
  // Category Breakdown
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Category Breakdown', margin, transactionY + 10);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  let categoryY = transactionY + 25;
  const categorySpacing = 12;
  
  // Category rows
  data.categoryBreakdown.forEach(category => {
    if (categoryY > pageHeight - 20) {
      doc.addPage();
      categoryY = 30;
    }
    
    doc.text(category.category_id, margin, categoryY);
    doc.text(`$${category.amount.toFixed(2)}`, margin + 100, categoryY);
    
    categoryY += categorySpacing;
  });
  
  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('FinMind - Weekly Financial Summary', margin, pageHeight - 10);
  
  return doc.output('arraybuffer') as Uint8Array;
}
