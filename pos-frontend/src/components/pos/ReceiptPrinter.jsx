import { message } from "antd";
import { getSettings } from "../../routes/Settings";
import API_URL from "../common/envCall";

export const printReceipt = async (receiptData, currentSale) => {
  if (!receiptData || !currentSale) {
    message.error("Receipt data is missing");
    return;
  }

  const itemsWithTotals = receiptData.items.map((item) => ({
    name: item.product,
    quantity: Number(item.quantity),
    price: Number(item.unit_price),
    total: Number(item.total),
  }));

  const settings = await getSettings();

  // Construct the full image URL
  const logoUrl = settings.image ? `${API_URL}/${settings.image}` : "";

  // Add print-specific styles to hide the print dialog if possible
  const printStyles = `
      @media print {
        body { 
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
        
        .item {
          page-break-inside: avoid;
        }
  
        @page {
          size: 58mm auto;
          margin: 0;
        }
      }
    `;

  // Handle missing logo gracefully
  const logoHTML = settings.image
    ? `<img src="${logoUrl}" alt="Logo" width="80" height="50" onerror="this.style.display='none'" />`
    : "";

  const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt #${receiptData.receipt_number}</title>
          <style>
            ${printStyles}
            body {
              font-family: 'Arial', sans-serif;
              width: 52mm;
              padding: 2mm 4mm;
              margin: 0;
              font-size: 12px;
            }
  
            /* Rest of your existing styles... */
            .logo {
              text-align: center;
              margin-bottom: 3mm;
            }
            
            .logo h2 {
              margin: 0;
              font-size: 14px;
              font-weight: bold;
            }
  
            .header {
              text-align: center;
              margin-bottom: 3mm;
              font-size: 11px;
              line-height: 1.2;
            }
  
            .receipt-number {
              text-align: center;
              font-weight: bold;
              margin: 2mm 0;
              font-size: 12px;
            }
  
            .items-header {
              display: grid;
              grid-template-columns: 3fr 1fr 1.5fr 1.5fr;
              border-top: 1px solid black;
              border-bottom: 1px solid black;
              padding: 1mm 0;
              font-size: 11px;
              font-weight: bold;
            }
  
            .items {
              margin: 2mm 0;
            }
  
            .item {
              display: grid;
              grid-template-columns: 3fr 1fr 1.5fr 1.5fr;
              padding: 1mm 0;
              font-size: 11px;
            }
  
            .total {
              border-top: 1px solid black;
              padding: 2mm 0;
              text-align: right;
              font-weight: bold;
              font-size: 12px;
            }
  
            .footer {
              text-align: center;
              margin-top: 3mm;
              padding-top: 2mm;
              border-top: 1px dotted black;
              font-size: 11px;
            }
  
            .footer p {
              margin: 1mm 0;
            }
          </style>
        </head>
        <body>
          <div class="logo">
            ${logoHTML}
            <h2>${settings.restaurant_name || "RESTAURANT NAME"}</h2>
          </div>
          <div class="receipt-number">
            Receipt #: ${receiptData.receipt_number}
          </div>
          <div class="header">
            Address: ${settings.street}, ${settings.city}, ${settings.state}, ${
    settings.zip_code || ""
  } ${settings.country}<br/>
            Phone: ${settings.phone}<br/>
            Email: ${settings.email}<br/>
            ${new Date(receiptData.date_time).toLocaleString()}
          </div>
          
          <div class="items-header">
            <div>Item</div>
            <div>Qty</div>
            <div>(₦) Price</div>
            <div>(₦) Total</div>
          </div>
          
          <div class="items">
            ${itemsWithTotals
              .map(
                (item) => `
              <div class="item">
                <div>${item.name || "Unknown Product"}</div>
                <div>${item.quantity}</div>
                <div>${item.price.toFixed(2)}</div>
                <div>${item.total.toFixed(2)}</div>
              </div>
            `
              )
              .join("")}
          </div>
          
          <div class="total">
            Total: ₦${Number(receiptData.total_amount).toFixed(2)}
          </div>
          
          <div class="footer">
            <p>Served by: ${receiptData.cashier || "Cashier"}</p>
            <p>Thank you for dining with us!</p>
            <p>Please come again!</p>
            <p>Sale ID: ${currentSale.id}</p>
            <p>Powered by: TechGuys POS System</p>
            <p>+2349150984229</p>
          </div>
        </body>
      </html>
    `;

  try {
    // Create a hidden iframe to handle printing
    const iframe = document.createElement("iframe");
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.position = "absolute";
    iframe.style.left = "-9999px";
    document.body.appendChild(iframe);

    // Write the content to the iframe
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(receiptHTML);
    doc.close();

    return new Promise((resolve, reject) => {
      // Wait for the iframe content to load before printing
      iframe.onload = () => {
        try {
          // Directly trigger the print dialog
          iframe.contentWindow.focus();
          iframe.contentWindow.print();

          // Remove the iframe after printing (or after a delay)
          setTimeout(() => {
            document.body.removeChild(iframe);
            resolve();
          }, 1000);
        } catch (error) {
          console.error("Print error:", error);
          document.body.removeChild(iframe);
          message.error("Failed to print receipt");
          reject(error);
        }
      };
    });
  } catch (error) {
    console.error("Print error:", error);
    message.error("Failed to print receipt");
    throw error;
  }
};
