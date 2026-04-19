"use client";

import React, { useRef, useState } from "react";
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
  QrCode,
  Barcode as BarcodeIcon,
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
import { ProductSearch } from "@/components/ProductSearch";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { toast } from "sonner";

interface EWayBillModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EWayBillModal({ isOpen, onClose }: EWayBillModalProps) {
  const ewayRef = useRef<HTMLDivElement>(null);
  const [details, setDetails] = useState({
    no: "7615 9627 7617",
    date: "19/01/2026 04:49 PM",
    fromName: "JOY RAM STEEL",
    fromGstin: "16ENCPD2885R1ZE",
    toName: "",
    toGstin: "",
    transporter: "Vikash Steel Logistics",
    vehicleNo: "TR03L1621",
    itemName: "STEEL KITCHEN WARE ITEMS",
    itemHsn: "7323",
    itemQty: "1.00",
    itemAmount: "10,000.00"
  });

  const handleProductSelect = (p: any) => {
    setDetails({
      ...details,
      itemName: `${p.productName} - ${p.size}`.toUpperCase(),
      itemHsn: "7323",
      itemQty: "1.00",
      itemAmount: p.base_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })
    });
  };

  const downloadAsImage = async () => {
    if (!ewayRef.current) return;
    try {
      const dataUrl = await toPng(ewayRef.current, { cacheBust: true, backgroundColor: '#ffffff', width: 794, height: 1123 });
      const link = document.createElement('a');
      link.download = `EWayBill-${details.no.replace(/\s/g, '')}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Downloaded");
    } catch (err) {
      toast.error("Error");
    }
  };

  const downloadAsPDF = async () => {
    if (!ewayRef.current) return;
    try {
      const dataUrl = await toPng(ewayRef.current, { cacheBust: true, backgroundColor: '#ffffff', width: 794, height: 1123 });
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(dataUrl, 'PNG', 0, 0, 210, 297);
      pdf.save(`EWayBill-${details.no.replace(/\s/g, '')}.pdf`);
      toast.success("Downloaded");
    } catch (err) {
      toast.error("Error");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[100vw] w-full h-[100dvh] m-0 p-0 border-none bg-zinc-950/40 backdrop-blur-xl flex flex-col md:flex-row overflow-hidden rounded-none text-left">
        
        {/* Form Panel */}
        <div className="w-full md:w-[400px] h-full bg-white border-r border-zinc-200 overflow-y-auto p-8 flex flex-col gap-8 shadow-2xl z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black uppercase tracking-tight">eWay Bill Generator</h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full"><X className="h-5 w-5" /></Button>
          </div>

          <div className="space-y-4 text-left">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">e-Way Bill Number</Label>
              <Input value={details.no} onChange={e => setDetails({...details, no: e.target.value})} className="h-12 rounded-xl font-bold" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Receiver GSTIN</Label>
                <Input value={details.toGstin} onChange={e => setDetails({...details, toGstin: e.target.value})} placeholder="Customer GSTIN" className="h-12 rounded-xl uppercase" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Receiver Name</Label>
                <Input value={details.toName} onChange={e => setDetails({...details, toName: e.target.value})} placeholder="Customer Name" className="h-12 rounded-xl" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Transporter</Label>
                <Input value={details.transporter} onChange={e => setDetails({...details, transporter: e.target.value})} className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Vehicle No.</Label>
                <Input value={details.vehicleNo} onChange={e => setDetails({...details, vehicleNo: e.target.value})} className="h-12 rounded-xl uppercase" />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-100">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 pl-1">Goods Details</Label>
              <ProductSearch onSelect={handleProductSelect} placeholder="Search product to bill..." />
              
              <div className="space-y-3 p-4 bg-zinc-50 rounded-2xl">
                <Input value={details.itemName} onChange={e => setDetails({...details, itemName: e.target.value})} placeholder="Product Name" className="h-10 bg-white font-bold text-xs rounded-xl" />
                <div className="grid grid-cols-3 gap-2">
                  <Input value={details.itemHsn} onChange={e => setDetails({...details, itemHsn: e.target.value})} placeholder="HSN" className="h-10 bg-white text-xs rounded-xl" />
                  <Input value={details.itemQty} onChange={e => setDetails({...details, itemQty: e.target.value})} placeholder="Qty" className="h-10 bg-white text-xs rounded-xl" />
                  <Input value={details.itemAmount} onChange={e => setDetails({...details, itemAmount: e.target.value})} placeholder="Amount" className="h-10 bg-white text-xs rounded-xl font-black" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-6 flex gap-2">
            <Button onClick={() => window.print()} variant="outline" className="flex-1 rounded-xl h-12 font-bold text-xs"><Printer className="h-4 w-4 mr-2" /> PRINT</Button>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button className="flex-1 rounded-xl h-12 bg-zinc-900 text-white font-bold text-xs" />} >
                <Download className="h-4 w-4 mr-2" /> SAVE
              </DropdownMenuTrigger>
              <DropdownMenuContent className="rounded-xl p-2 border-none shadow-2xl">
                <DropdownMenuItem onClick={downloadAsImage} className="rounded-lg h-10 flex gap-2 font-bold cursor-pointer"><ImageIcon className="h-4 w-4 text-blue-500" /> Image</DropdownMenuItem>
                <DropdownMenuItem onClick={downloadAsPDF} className="rounded-lg h-10 flex gap-2 font-bold cursor-pointer"><FileText className="h-4 w-4 text-red-500" /> PDF</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Strict A4 Preview Panel */}
        <div className="flex-1 h-full overflow-auto overflow-x-auto p-4 md:p-12 flex justify-start md:justify-center items-start bg-zinc-100/50">
          <div className="min-w-[800px] shrink-0 flex justify-center">
            <div 
              ref={ewayRef}
              className="bg-white shadow-[0_0_50px_rgba(0,0,0,0.1)] flex flex-col p-[15mm] shrink-0"
              style={{ width: '210mm', minHeight: '297mm', color: '#000', fontFamily: 'sans-serif' }}
            >
            <div className="flex justify-between items-start mb-10">
              <h1 className="text-[24pt] font-black tracking-tight border-b-4 border-black pb-2">e-Way Bill</h1>
              <div className="border-4 border-black p-2">
                <QrCode className="h-20 w-20 text-zinc-900" />
              </div>
            </div>

            <div className="space-y-8">
              <section>
                <div className="font-black border-b-2 border-black pb-1 mb-4 text-[12pt] uppercase bg-zinc-100 px-2 py-1">1. E-WAY BILL Details</div>
                <div className="grid grid-cols-2 gap-y-3 text-[11pt] px-2">
                  <div>eWay Bill No: <span className="font-black">{details.no}</span></div>
                  <div>Generated Date: <span className="font-bold">{details.date}</span></div>
                  <div>Mode: <span className="font-black uppercase">Road</span></div>
                  <div>Type: <span className="font-black">Outward - Supply</span></div>
                  <div>Approx Distance: <span className="font-bold">2476km</span></div>
                  <div>Transaction Type: <span className="font-bold">Regular</span></div>
                </div>
              </section>

              <section>
                <div className="font-black border-b-2 border-black pb-1 mb-4 text-[12pt] uppercase bg-zinc-100 px-2 py-1">2. Address Details</div>
                <div className="grid grid-cols-2 gap-12 px-2">
                  <div className="space-y-2">
                    <div className="font-black text-[10pt] uppercase text-zinc-500 underline">From</div>
                    <div className="font-black text-[14pt] text-blue-700 tracking-wider leading-none">{details.fromGstin}</div>
                    <div className="font-black text-[13pt] uppercase italic leading-none">{details.fromName}</div>
                    <div className="text-[10pt] font-bold text-zinc-400">Dhajanagar, Udaipur, Tripura-799114</div>
                  </div>
                  <div className="space-y-2">
                    <div className="font-black text-[10pt] uppercase text-zinc-500 underline">To</div>
                    <div className="font-black text-[14pt] text-blue-700 tracking-wider leading-none">{details.toGstin || "URP"}</div>
                    <div className="font-black text-[13pt] uppercase italic leading-none">{details.toName || "WALK-IN CUSTOMER"}</div>
                    <div className="text-[10pt] font-bold text-zinc-400 uppercase">TRIPURA - 799114</div>
                  </div>
                </div>
              </section>

              <section>
                <div className="font-black border-b-2 border-black pb-1 mb-4 text-[12pt] uppercase bg-zinc-100 px-2 py-1">3. Goods Details</div>
                <table className="w-full border-collapse border-2 border-black text-[10pt]">
                  <thead className="bg-zinc-50 font-black uppercase border-b-2 border-black">
                    <tr>
                      <th className="border-r-2 border-black p-2 w-[30mm]">HSN Code</th>
                      <th className="border-r-2 border-black p-2 text-left">Product Name & Desc.</th>
                      <th className="border-r-2 border-black p-2 w-[30mm]">Qty</th>
                      <th className="p-2 w-[40mm]">Amount Rs.</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="h-[12mm] border-b border-zinc-200">
                      <td className="border-r-2 border-black text-center font-bold">{details.itemHsn}</td>
                      <td className="border-r-2 border-black p-2 font-black uppercase italic">{details.itemName}</td>
                      <td className="border-r-2 border-black text-center font-bold">{details.itemQty}</td>
                      <td className="text-right pr-2 font-black">{details.itemAmount}</td>
                    </tr>
                  </tbody>
                </table>
              </section>

              <section>
                <div className="font-black border-b-2 border-black pb-1 mb-4 text-[12pt] uppercase bg-zinc-100 px-2 py-1">4. Transportation Details</div>
                <div className="px-2 text-[11pt]">
                  <div className="text-zinc-600 uppercase font-bold tracking-tight">Transporter ID & Name: <span className="text-zinc-900 font-black">16BFOPD3349R1ZT & {details.transporter}</span></div>
                </div>
              </section>

              <section>
                <div className="font-black border-b-2 border-black pb-1 mb-4 text-[12pt] uppercase bg-zinc-100 px-2 py-1">5. Vehicle Details</div>
                <table className="w-full border-collapse border-2 border-black text-[10pt]">
                  <thead className="bg-zinc-50 font-black border-b-2 border-black">
                    <tr>
                      <th className="border-r-2 border-black p-2">Mode</th>
                      <th className="border-r-2 border-black p-2">Vehicle / Trans Doc No.</th>
                      <th className="border-r-2 border-black p-2">From</th>
                      <th className="p-2">Entered Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="h-[12mm]">
                      <td className="border-r-2 border-black text-center uppercase font-bold italic">Road</td>
                      <td className="border-r-2 border-black text-center font-black uppercase text-[14pt] tracking-tighter">{details.vehicleNo}</td>
                      <td className="border-r-2 border-black text-center uppercase font-bold italic">AGARTALA</td>
                      <td className="text-center font-bold">{details.date.split(' ')[0]}</td>
                    </tr>
                  </tbody>
                </table>
              </section>
            </div>

            <div className="mt-auto pt-12 flex flex-col items-center gap-4">
              <div className="w-[120mm] h-[15mm] border-2 border-black flex items-center justify-center relative bg-white">
                <BarcodeIcon className="h-full w-full px-8 text-zinc-900" />
                <div className="absolute -bottom-6 font-black tracking-[1.2em] text-[10pt] pl-4">{details.no.replace(/\s/g, '')}</div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
