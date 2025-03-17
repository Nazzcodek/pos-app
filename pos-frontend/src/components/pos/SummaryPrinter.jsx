import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Button } from "@mui/material";
import { Receipt } from "@mui/icons-material";
import { getSettings } from "../../routes/Settings";
import { getCurrentSession } from "../../routes/POSSales";
import API_URL from "../common/envCall";
import { useAuth } from "../../contexts/AuthContext";

const formatDateTime = (dateTimeString) => {
  const date = new Date(dateTimeString);
  const formattedDate = date.toLocaleDateString();
  const formattedTime = date.toLocaleTimeString();
  return `${formattedDate} ${formattedTime}`;
};

const PrintButton = forwardRef(({ sessionSummary, children }, ref) => {
  const { user } = useAuth();

  const [username] = useState(user?.username || "");
  const [session, setSession] = useState(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const sessionData = await getCurrentSession();
        setSession(sessionData);
      } catch (error) {
        console.error("Failed to fetch current session:", error);
      }
    };

    fetchSession();
  }, []);

  const handlePrint = async () => {
    const totalSales = parseFloat(sessionSummary.totalSales) || 0;
    const totalTransactions = sessionSummary.totalTransactions || 0;
    const loginTime = session ? formatDateTime(session.login_time) : "";
    const logoutTime = session ? formatDateTime(session.logout_time) : "";
    const settings = await getSettings();

    const logoUrl = settings.image ? `${API_URL}/${settings.image}` : "";

    const logoHTML = settings.image
      ? `<img src="${logoUrl}" alt="Logo" width="80" height="50" onerror="this.style.display='none'" />`
      : "";

    const printContent = `
      <html>
        <head>
          <title>Session Summary</title>
          <style>
            body {
              font-family: 'Courier New', Courier, monospace;
              width: 80mm;
              margin: 0;
              padding: 10px;
            }
            .summary {
              text-align: center;
            }
            .summary h2 {
              margin: 0;
              font-size: 18px;
            }
            .summary p {
              margin: 5px 0;
              font-size: 14px;
            }
            .summary .line {
              border-top: 1px dashed #000;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="summary">
            <h2>Session Summary</h2>
            <div class="logo">
            ${logoHTML}
            <h2>${settings.restaurant_name || "RESTAURANT NAME"}</h2>
          </div>
          <div class="header">
            Address: ${settings.street}, ${settings.city}, ${settings.state}, ${
      settings.zip_code || ""
    } ${settings.country}<br/>
            Phone: ${settings.phone}<br/>
            Email: ${settings.email}<br/>
            </div>
            <p>Date: ${new Date().toLocaleDateString()}</p>
            <p>Time: ${new Date().toLocaleTimeString()}</p>
            <p>Username: ${username}</p>
            <div class="line"></div>
            <p>Total Sales: ₦${totalSales.toFixed(2)}</p>
            <p>Total Transactions: ${totalTransactions}</p>
            <div class="line"></div>
            <p>Login Time: ${loginTime}</p>
            <p>Logout Time: ${logoutTime}</p>
            <div class="line"></div>
            <p>Thank you!</p>
          </div>
        </body>
      </html>
    `;

    const printFrame = document.createElement("iframe");
    printFrame.style.position = "absolute";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "none";
    document.body.appendChild(printFrame);

    const printDocument = printFrame.contentWindow.document;
    printDocument.open();
    printDocument.write(printContent);
    printDocument.close();

    printFrame.contentWindow.focus();
    printFrame.contentWindow.print();

    document.body.removeChild(printFrame);
  };

  // Expose the handlePrint method to parent components
  useImperativeHandle(ref, () => ({
    handlePrint,
  }));

  return (
    <Button
      color="inherit"
      startIcon={<Receipt />}
      onClick={handlePrint}
      sx={{ mr: 1 }}
    >
      {children || "Print Session"}
    </Button>
  );
});

export default PrintButton;
