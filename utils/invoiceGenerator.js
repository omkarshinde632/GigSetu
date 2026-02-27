const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

function generateInvoice(plan, user, paymentId) {

  const invoiceId = "INV-" + Date.now();
  const fileName = invoiceId + ".pdf";
  const filePath = path.join(__dirname, "../invoices", fileName);

  if (!fs.existsSync(path.join(__dirname, "../invoices"))) {
    fs.mkdirSync(path.join(__dirname, "../invoices"));
  }

  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(22).text("GigSetu Invoice", { align: "center" });
  doc.moveDown();

  doc.fontSize(14).text(`Invoice ID: ${invoiceId}`);
  doc.text(`Payment ID: ${paymentId}`);
  doc.text(`Date: ${new Date().toDateString()}`);
  doc.moveDown();

  doc.text(`Customer Name: ${user.name}`);
  doc.text(`Email: ${user.email}`);
  doc.moveDown();

  doc.text(`Weekly Amount: ₹${plan.weeklyAmount}`);
  doc.text(`Processing Fee Paid: ₹${plan.processingFee}`);
  doc.moveDown();

  doc.text("Thank you for using GigSetu Instant Daily Payout Service.");
  doc.end();

  return {
    invoiceId,
    fileName
  };
}

module.exports = generateInvoice;