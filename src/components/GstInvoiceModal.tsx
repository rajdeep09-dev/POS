"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Printer, 
  Download, 
  Image as ImageIcon, 
  FileText, 
  Plus,
  Trash2,
  X
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { toast } from "sonner";

interface GstInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GstInvoiceModal({ isOpen, onClose }: GstInvoiceModalProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState([{ desc: "", hsn: "", qty: "1", finalRate: "", taxableValue: 0, cgst: 0, sgst: 0, total: 0 }]);
  const [receiver, setReceiver] = useState({ name: "", address: "", gstin: "" });
  const [invoiceDetails, setInvoiceDetails] = useState({ no: "", date: new Date().toISOString().split('T')[0] });

  const addItem = () => {
    setItems([...items, { desc: "", hsn: "", qty: "1", finalRate: "", taxableValue: 0, cgst: 0, sgst: 0, total: 0 }]);
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    
    // Calculate Backward GST (Inclusive to Exclusive)
    // Formula: Taxable Value = Total / (1 + GST_Rate)
    // Assuming 18% GST (9% CGST + 9% SGST)
    const qty = parseFloat(newItems[index].qty) || 0;
    const finalRate = parseFloat(newItems[index].finalRate) || 0;
    const totalAmount = qty * finalRate;
    
    if (totalAmount > 0) {
      const taxable = totalAmount / 1.18;
      const gstAmount = totalAmount - taxable;
      
      newItems[index].taxableValue = parseFloat(taxable.toFixed(2));
      newItems[index].cgst = parseFloat((gstAmount / 2).toFixed(2));
      newItems[index].sgst = parseFloat((gstAmount / 2).toFixed(2));
      newItems[index].total = totalAmount;
    } else {
      newItems[index].taxableValue = 0;
      newItems[index].cgst = 0;
      newItems[index].sgst = 0;
      newItems[index].total = 0;
    }
    
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const totalTaxable = items.reduce((acc, item) => acc + item.taxableValue, 0);
  const totalCgst = items.reduce((acc, item) => acc + item.cgst, 0);
  const totalSgst = items.reduce((acc, item) => acc + item.sgst, 0);
  const grandTotal = items.reduce((acc, item) => acc + item.total, 0);

  const exportOptions = {
    cacheBust: true,
    backgroundColor: '#ffffff',
    width: 794, // A4 pixels at 96 DPI
    height: 1123,
    style: {
      transform: 'scale(1)',
      margin: '0',
    }
  };

  const downloadAsImage = async () => {
    if (!invoiceRef.current) return;
    toast.info("Generating A4 Image...");
    try {
      // Use a slightly lower pixel ratio and quality to bring size under 1MB
      const dataUrl = await toPng(invoiceRef.current, { 
        pixelRatio: 2,
        quality: 0.8,
        cacheBust: true,
        backgroundColor: '#ffffff'
      });
      const link = document.createElement('a');
      link.download = `JoyRam-GST-${invoiceDetails.no || 'Invoice'}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Image Saved (<1MB)");
    } catch (err) {
      toast.error("Export failed");
    }
  };

  const downloadAsPDF = async () => {
    if (!invoiceRef.current) return;
    toast.info("Generating Compact PDF...");
    try {
      const dataUrl = await toPng(invoiceRef.current, { 
        pixelRatio: 2,
        quality: 0.7, // Compress for PDF
        cacheBust: true,
        backgroundColor: '#ffffff'
      });
      
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true // Enable internal PDF compression
      });

      pdf.addImage(dataUrl, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      pdf.save(`JoyRam-GST-${invoiceDetails.no || 'Invoice'}.pdf`);
      toast.success("PDF Saved (<1MB)");
    } catch (err) {
      toast.error("Export failed");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[100vw] w-full h-[100dvh] m-0 p-0 border-none bg-zinc-900/90 backdrop-blur-2xl flex flex-col md:flex-row overflow-hidden rounded-none shadow-none ring-0">
        
        {/* Input Form Panel */}
        <div className="w-full md:w-[450px] h-full bg-white overflow-y-auto p-8 flex flex-col gap-8 shadow-2xl relative z-20">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black italic tracking-tight text-zinc-900">GST GEN</h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-zinc-100"><X className="h-6 w-6 text-zinc-400" /></Button>
          </div>

          <div className="space-y-5">
            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 pl-1">Billed To (Receiver)</Label>
              <Input value={receiver.name} onChange={e => setReceiver({...receiver, name: e.target.value})} placeholder="M/s. Customer Name" className="h-14 rounded-2xl bg-zinc-50 border-zinc-100 font-bold" />
              <Input value={receiver.address} onChange={e => setReceiver({...receiver, address: e.target.value})} placeholder="Full Address" className="h-14 rounded-2xl bg-zinc-50 border-zinc-100 font-bold" />
              <Input value={receiver.gstin} onChange={e => setReceiver({...receiver, gstin: e.target.value})} placeholder="Receiver GSTIN" className="h-14 rounded-2xl bg-zinc-50 border-zinc-100 font-black uppercase" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 text-left">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 pl-1">Invoice No.</Label>
                <Input value={invoiceDetails.no} onChange={e => setInvoiceDetails({...invoiceDetails, no: e.target.value})} placeholder="JR/24-25/001" className="h-14 rounded-2xl bg-zinc-50 border-zinc-100 font-black" />
              </div>
              <div className="space-y-2 text-left">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 pl-1">Date</Label>
                <Input type="date" value={invoiceDetails.date} onChange={e => setInvoiceDetails({...invoiceDetails, date: e.target.value})} className="h-14 rounded-2xl bg-zinc-50 border-zinc-100 font-bold" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 pl-1">Inventory Items (Inclusive GST)</Label>
              <Button onClick={addItem} size="sm" className="rounded-xl h-10 px-4 bg-zinc-900 text-white font-black text-[10px] tracking-widest">ADD ITEM</Button>
            </div>
            
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="bg-zinc-50 p-5 rounded-[1.5rem] border border-zinc-100 space-y-3 relative group">
                  <Input value={item.desc} onChange={e => updateItem(index, 'desc', e.target.value)} placeholder="Description of Goods" className="h-10 bg-white border-zinc-200 font-bold text-xs rounded-xl" />
                  <div className="grid grid-cols-3 gap-3">
                    <Input value={item.hsn} onChange={e => updateItem(index, 'hsn', e.target.value)} placeholder="HSN" className="h-10 bg-white border-zinc-200 text-xs rounded-xl" />
                    <Input type="number" value={item.qty} onChange={e => updateItem(index, 'qty', e.target.value)} placeholder="Qty" className="h-10 bg-white border-zinc-200 text-xs rounded-xl font-bold" />
                    <Input type="number" value={item.finalRate} onChange={e => updateItem(index, 'finalRate', e.target.value)} placeholder="Price/Unit" className="h-10 bg-white border-zinc-200 text-xs rounded-xl font-black text-blue-600" />
                  </div>
                  {items.length > 1 && (
                    <Button onClick={() => removeItem(index)} variant="ghost" size="icon" className="absolute -top-2 -right-2 bg-white shadow-md rounded-full h-8 w-8 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-8 flex gap-3">
            <Button onClick={() => window.print()} variant="outline" className="flex-1 rounded-2xl h-16 border-2 border-zinc-100 font-black tracking-widest text-xs"><Printer className="h-5 w-5 mr-2" /> PRINT</Button>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button className="flex-1 rounded-2xl h-16 bg-zinc-900 text-white font-black tracking-widest text-xs shadow-2xl" />} >
                <Download className="h-5 w-5 mr-2" /> EXPORT
              </DropdownMenuTrigger>
              <DropdownMenuContent className="rounded-2xl p-2 border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] min-w-[200px] bg-white/95 backdrop-blur-xl">
                <DropdownMenuItem onClick={downloadAsImage} className="rounded-xl h-14 flex gap-3 font-black text-xs uppercase tracking-widest cursor-pointer hover:bg-zinc-50"><ImageIcon className="h-5 w-5 text-blue-600" /> Save as Image</DropdownMenuItem>
                <DropdownMenuItem onClick={downloadAsPDF} className="rounded-xl h-14 flex gap-3 font-black text-xs uppercase tracking-widest cursor-pointer hover:bg-zinc-50"><FileText className="h-5 w-5 text-red-600" /> Save as PDF</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Real-Time A4 Mirror Preview */}
        <div className="flex-1 h-full overflow-auto bg-zinc-900/20 p-4 md:p-12 flex items-start justify-center scrollbar-hide">
          <div className="origin-top scale-[0.45] sm:scale-[0.8] lg:scale-[1.0]">
            <div 
              ref={invoiceRef}
              className="bg-white shadow-[0_40px_100px_rgba(0,0,0,0.4)] flex flex-col p-[15mm] text-black"
              style={{ width: '210mm', minHeight: '297mm', fontFamily: "'Times New Roman', serif" }}
            >
              {/* EXACT HEADER REPLICA FROM gst.jpg */}
              <div className="flex justify-between items-start mb-6 text-[10.5pt]">
                <div className="font-bold tracking-tight">GSTIN : 16ENCPD2885R1ZE</div>
                <div className="text-center">
                  <div className="font-bold border-b-2 border-black px-8 pb-0.5 text-[12pt] tracking-widest uppercase">TAX INVOICE</div>
                </div>
                <div className="text-[9pt] border-2 border-black p-2 space-y-1.5 font-bold min-w-[140px]">
                  <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 border-2 border-black rounded-sm" /><span>Original Copy</span></div>
                  <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 border-2 border-black rounded-sm" /><span>Duplicate Copy</span></div>
                  <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 border-2 border-black rounded-sm" /><span>Triplicate Copy</span></div>
                </div>
              </div>

              {/* SHOP BRANDING */}
              <div className="text-center mb-10 mt-4">
                <h1 className="text-[48pt] font-black tracking-tighter uppercase italic leading-[0.9] border-black inline-block">JOY RAM STEEL</h1>
                <p className="text-[13pt] font-bold mt-3 tracking-wide">Dhajanagar, Udaipur, Gomati Tripura, Pin - 799114</p>
              </div>

              {/* RECEIVER & INVOICE DETAILS */}
              <div className="flex justify-between mb-8 border-t-2 border-black pt-5 text-[11pt] leading-relaxed">
                <div className="flex-1 space-y-2.5">
                  <div className="font-bold uppercase underline tracking-wider">Details of Receiver :</div>
                  <div className="flex gap-2"><span>M/s.</span> <span className="font-black text-[13pt]">{receiver.name || "_________________________________"}</span></div>
                  <div className="flex gap-2"><span>Address :</span> <span className="font-bold italic flex-1">{receiver.address || "______________________________________________________"}</span></div>
                  <div className="flex gap-2 mt-4"><span>GSTIN / Unique ID :</span> <span className="font-black uppercase tracking-widest text-[12pt]">{receiver.gstin || "____________________"}</span></div>
                </div>
                <div className="w-[75mm] space-y-3 pl-6 border-l-2 border-black">
                  <div className="flex justify-between items-center"><span>Invoice No. :</span> <span className="font-black text-[12pt]">{invoiceDetails.no || "N/A"}</span></div>
                  <div className="flex justify-between items-center border-b border-zinc-300 pb-1"><span>Date :</span> <span className="font-black text-[12pt]">{invoiceDetails.date ? new Date(invoiceDetails.date).toLocaleDateString('en-GB') : ""}</span></div>
                  <div className="text-[9pt] mt-4 font-black uppercase leading-tight italic text-zinc-500 text-right">Supply of Goods under GST<br/>(Fill in the State Code)</div>
                </div>
              </div>

              {/* GOODS TABLE (EXACT RATIOS) */}
              <table className="w-full border-collapse border-2 border-black mb-8 text-[11pt]">
                <thead>
                  <tr className="border-b-2 border-black font-black uppercase bg-zinc-50 text-[10pt]">
                    <th className="border-r-2 border-black py-2 w-[12mm]">Sl. No.</th>
                    <th className="border-r-2 border-black py-2 text-left px-4">Description of Goods</th>
                    <th className="border-r-2 border-black py-2 w-[25mm]">HSN Code</th>
                    <th className="border-r-2 border-black py-2 w-[30mm]">Quantity Unit</th>
                    <th className="border-r-2 border-black py-2 w-[28mm]">Rate</th>
                    <th className="py-2 w-[40mm]">Amount Rs.</th>
                  </tr>
                </thead>
                <tbody className="font-bold">
                  {items.map((item, i) => (
                    <tr key={i} className="border-b border-zinc-200 h-[10mm] text-center italic">
                      <td className="border-r-2 border-black">{i+1}</td>
                      <td className="border-r-2 border-black text-left px-4 font-black uppercase not-italic text-[10.5pt]">{item.desc}</td>
                      <td className="border-r-2 border-black">{item.hsn}</td>
                      <td className="border-r-2 border-black">{item.qty} PCS</td>
                      <td className="border-r-2 border-black">{item.taxableValue > 0 ? (item.taxableValue / (parseFloat(item.qty)||1)).toFixed(2) : ""}</td>
                      <td className="text-right pr-2 text-[12pt] font-black">{item.taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                  {[...Array(Math.max(0, 12 - items.length))].map((_, i) => (
                    <tr key={`empty-${i}`} className="border-b border-zinc-100 h-[10mm]">
                      <td className="border-r-2 border-black"></td><td className="border-r-2 border-black"></td><td className="border-r-2 border-black"></td><td className="border-r-2 border-black"></td><td className="border-r-2 border-black"></td><td></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* TAX SUMMARY BLOCK */}
              <div className="flex gap-8 mt-auto pt-4">
                <div className="flex-1">
                  <table className="w-full border-2 border-black text-[9.5pt] font-black">
                    <thead>
                      <tr className="border-b-2 border-black uppercase bg-zinc-50">
                        <th className="border-r-2 border-black py-1">HSN Code</th>
                        <th className="border-r-2 border-black py-1">Taxable Value</th>
                        <th className="border-r-2 border-black py-1">Rate</th>
                        <th className="border-r-2 border-black py-1">CGST</th>
                        <th className="border-r-2 border-black py-1">SGST</th>
                        <th className="py-1">IGST</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="h-[10mm] border-b-2 border-black text-right pr-2">
                        <td className="border-r-2 border-black text-center">-</td>
                        <td className="border-r-2 border-black pr-2">{totalTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="border-r-2 border-black text-center">18%</td>
                        <td className="border-r-2 border-black pr-2">{totalCgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="border-r-2 border-black pr-2">{totalSgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="pr-2">0.00</td>
                      </tr>
                      <tr className="uppercase bg-zinc-50">
                        <td className="border-r-2 border-black text-center py-1.5">TOTAL</td>
                        <td className="border-r-2 border-black pr-2">{totalTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="border-r-2 border-black"></td>
                        <td className="border-r-2 border-black pr-2">{totalCgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="border-r-2 border-black pr-2">{totalSgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="pr-2">0.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="w-[80mm] border-2 border-black p-5 space-y-3 bg-zinc-50/50">
                  <div className="flex justify-between font-bold text-[10.5pt]"><span>Total Taxable Value</span> <span className="font-black">₹{totalTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                  <div className="flex justify-between text-zinc-600 text-[10pt]"><span>Add : CGST @ 9%</span> <span className="font-bold">₹{totalCgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                  <div className="flex justify-between text-zinc-600 text-[10pt] border-b-2 border-black pb-3"><span>Add : SGST @ 9%</span> <span className="font-bold">₹{totalSgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                  <div className="flex justify-between pt-3 font-black text-[18pt] tracking-tighter text-blue-800 italic underline underline-offset-4 decoration-2">
                    <span>GRAND TOTAL</span> 
                    <span>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* FOOTER AREA */}
              <div className="mt-12 border-t-2 border-black flex justify-between items-end pb-4 pt-10">
                <div className="flex-1 pr-14">
                  <div className="font-black uppercase text-[10pt] mb-3 underline decoration-black decoration-1 underline-offset-4">Total Invoice Value (In words) :</div>
                  <div className="border-b-2 border-dotted border-zinc-500 w-full h-[12mm] italic text-zinc-800 text-[14pt] font-black pt-1 uppercase flex items-center justify-center text-center">
                    Rupees {grandTotal > 0 ? "_____________________" : ""} Only
                  </div>
                </div>
                <div className="text-center min-w-[65mm]">
                  <div className="font-black uppercase text-[10pt] mb-16 tracking-tight">For JOY RAM STEEL</div>
                  <div className="font-black uppercase text-[11pt] border-t-2 border-black pt-2 tracking-[0.2em] italic">Proprietor</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
