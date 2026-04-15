"use client";

import { formatCurrency, formatDateTime } from "@/lib/utils";
import { X, Download, ArrowDownLeft, ArrowUpRight, Plus, Minus, Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";

const typeLabels = { credit: "Credit", debit: "Debit", transfer_in: "Incoming Transfer", transfer_out: "Outgoing Transfer" };
const typeConfig = {
  credit: { icon: Plus, color: "text-success", bg: "bg-emerald-50", sign: "+" },
  debit: { icon: Minus, color: "text-danger", bg: "bg-red-50", sign: "-" },
  transfer_in: { icon: ArrowDownLeft, color: "text-success", bg: "bg-emerald-50", sign: "+" },
  transfer_out: { icon: ArrowUpRight, color: "text-danger", bg: "bg-red-50", sign: "-" },
};

export default function TransactionDetail({ transaction: tx, accountInfo, onClose }) {
  const [copied, setCopied] = useState("");
  const [generating, setGenerating] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  const close = () => { setVisible(false); setTimeout(onClose, 200); };

  const config = typeConfig[tx.type] || typeConfig.credit;
  const Icon = config.icon;

  const copyText = (text, key) => { navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(""), 2000); };
  const CopyBtn = ({ text, id }) => (
    <button onClick={() => copyText(text, id)} className="p-1 cursor-pointer ml-1 active:scale-90 transition-transform">
      {copied === id ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5 text-text-muted hover:text-text-secondary transition-colors" />}
    </button>
  );

  const generatePdf = async () => {
    setGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const w = doc.internal.pageSize.getWidth(); const margin = 20; let y = 20;
      const bankGreen = [12, 75, 62]; const darkText = [26, 43, 42]; const mutedText = [120, 140, 138]; const lineColor = [226, 232, 231];

      doc.setFillColor(...bankGreen); doc.rect(0, 0, w, 42, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(18); doc.setFont("helvetica", "bold"); doc.text("DNB", margin, 18);
      doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.text("Transaction Receipt", margin, 26);
      doc.setFontSize(8); doc.text(`Generated: ${new Date().toLocaleString("en-GB")}`, margin, 33);
      if (tx.transaction_ref) { doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.text(tx.transaction_ref, w - margin, 18, { align: "right" }); doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.text("Transaction Reference", w - margin, 25, { align: "right" }); }

      y = 55;
      doc.setTextColor(...darkText); doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.text(typeLabels[tx.type] || "Transaction", margin, y); y += 3;
      doc.setFontSize(28); doc.text(`${config.sign}${formatCurrency(tx.amount)}`, margin, y + 12); y += 22;
      doc.setFontSize(8); doc.setFont("helvetica", "normal");
      const statusText = (tx.status || "completed").toUpperCase(); const statusW = doc.getTextWidth(statusText) + 8;
      if (tx.status === "completed") { doc.setFillColor(240, 253, 244); doc.setDrawColor(187, 247, 208); } else { doc.setFillColor(255, 251, 235); doc.setDrawColor(253, 230, 138); }
      doc.roundedRect(margin, y, statusW, 7, 1.5, 1.5, "FD");
      doc.setTextColor(tx.status === "completed" ? 15 : 161, tx.status === "completed" ? 123 : 98, tx.status === "completed" ? 79 : 7);
      doc.text(statusText, margin + 4, y + 5); y += 16;

      doc.setDrawColor(...lineColor); doc.setLineWidth(0.3); doc.line(margin, y, w - margin, y); y += 10;

      const addRow = (label, value) => { if (!value) return; doc.setTextColor(...mutedText); doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.text(label, margin, y); doc.setTextColor(...darkText); doc.text(String(value), margin + 55, y); y += 8; };
      addRow("Date & Time", formatDateTime(tx.created_at)); addRow("Transaction ID", tx.transaction_ref || "—"); addRow("Type", typeLabels[tx.type] || tx.type); addRow("Amount", `${config.sign}${formatCurrency(tx.amount)}`); addRow("Currency", "EUR"); addRow("Balance Type", tx.balance_type === "reserve" ? "Reserve" : "Available");
      if (tx.reference) { y += 3; addRow("Reference", tx.reference); } if (tx.description) addRow("Description", tx.description);
      if (tx.counterparty_name || tx.counterparty_iban) { y += 5; doc.setDrawColor(...lineColor); doc.line(margin, y, w - margin, y); y += 10; doc.setTextColor(...bankGreen); doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.text(tx.type === "transfer_in" ? "Sender Details" : "Recipient Details", margin, y); y += 9; addRow("Name", tx.counterparty_name); addRow("IBAN", tx.counterparty_iban); }
      if (accountInfo) { y += 5; doc.setDrawColor(...lineColor); doc.line(margin, y, w - margin, y); y += 10; doc.setTextColor(...bankGreen); doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.text("Account Holder", margin, y); y += 9; addRow("Name", accountInfo.full_name); addRow("Account Number", accountInfo.account_number); if (accountInfo.iban) addRow("IBAN", accountInfo.iban); }

      const footerY = doc.internal.pageSize.getHeight() - 25;
      doc.setDrawColor(...lineColor); doc.line(margin, footerY, w - margin, footerY);
      doc.setFontSize(7); doc.setTextColor(...mutedText); doc.setFont("helvetica", "normal");
      doc.text("This document is an electronic transaction receipt generated by DNB.", margin, footerY + 6);
      doc.text("DNB — Secure, Reliable Banking. Valid without signature.", margin, footerY + 11);
      doc.setFillColor(...bankGreen); doc.rect(0, doc.internal.pageSize.getHeight() - 4, w, 4, "F");
      doc.save(`DNB_Receipt_${tx.transaction_ref || tx.id}.pdf`);
    } catch (err) { console.error("PDF error:", err); } finally { setGenerating(false); }
  };

  const rows = [
    { label: "Date & Time", value: formatDateTime(tx.created_at) },
    { label: "Transaction ID", value: tx.transaction_ref, copy: true },
    { label: "Type", value: typeLabels[tx.type] || tx.type },
    { label: "Status", value: tx.status, badge: true },
    { label: "Balance", value: tx.balance_type === "reserve" ? "Reserve" : "Available" },
    { label: "Reference", value: tx.reference },
    { label: "Description", value: tx.description },
    { label: "Counterparty", value: tx.counterparty_name },
    { label: "Counterparty IBAN", value: tx.counterparty_iban, copy: true },
  ].filter((r) => r.value);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${visible ? "bg-black/40" : "bg-black/0 pointer-events-none"}`} onClick={close}>
      <div className={`bg-white rounded-[var(--radius-xl)] w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl transition-all duration-200 ${visible ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-2"}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 pb-0">
          <h2 className="text-lg font-semibold text-text-primary">Transaction Details</h2>
          <button onClick={close} className="p-2 hover:bg-surface-hover rounded-full transition-all duration-200 cursor-pointer hover:rotate-90"><X className="w-5 h-5 text-text-muted" /></button>
        </div>
        <div className="p-5 space-y-5">
          <div className="flex items-center gap-4 py-3 animate-fade-in-up">
            <div className={`w-14 h-14 rounded-full ${config.bg} flex items-center justify-center`}><Icon className={`w-6 h-6 ${config.color}`} /></div>
            <div><p className={`text-2xl font-bold ${config.color}`}>{config.sign}{formatCurrency(tx.amount)}</p><p className="text-sm text-text-muted">{typeLabels[tx.type] || tx.type}</p></div>
          </div>
          <div className="space-y-0 bg-surface rounded-[var(--radius-lg)] overflow-hidden divide-y divide-border-light stagger-children">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between px-4 py-3">
                <span className="text-xs text-text-muted">{row.label}</span>
                <div className="flex items-center gap-1">
                  {row.badge ? (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${row.value === "completed" ? "bg-emerald-50 text-success" : row.value === "pending" ? "bg-amber-50 text-warning" : "bg-red-50 text-danger"}`}>{row.value}</span>
                  ) : (
                    <span className={`text-sm text-text-primary ${row.copy ? "font-mono text-xs" : ""}`}>{row.value}</span>
                  )}
                  {row.copy && <CopyBtn text={row.value} id={row.label} />}
                </div>
              </div>
            ))}
          </div>
          <button onClick={generatePdf} disabled={generating} className="btn-primary w-full flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />{generating ? "Generating PDF..." : "Download Receipt (PDF)"}
          </button>
        </div>
      </div>
    </div>
  );
}
