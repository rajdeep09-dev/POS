import { toJpeg } from "html-to-image";
import jsPDF from "jspdf";
import { toast } from "sonner";

/**
 * Module 7: The Unified Client-Side Document Engine
 * Central utility for PDF generation and WhatsApp sharing.
 */
export const DocumentEngine = {
  /**
   * Generates a high-fidelity PDF from a hidden HTML template.
   */
  async downloadPDF(elementId: string, filename: string) {
    const element = document.getElementById(elementId);
    if (!element) {
      toast.error("Template not found");
      return;
    }

    toast.info("Authorising Digital Document...", { id: 'doc-gen' });
    
    try {
      // 1. Capture at 1.5x density with 0.8 quality for compression
      const url = await toJpeg(element, { 
        pixelRatio: 1.5, 
        quality: 0.8,
        backgroundColor: '#ffffff',
        style: {
          visibility: 'visible',
        }
      });

      // 2. Initialise A4 Canvas with compression
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      // 3. Inject Image
      pdf.addImage(url, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      
      // 4. Client-side Trigger
      pdf.save(`${filename}.pdf`);
      toast.success("Document Secured Locally", { id: 'doc-gen' });
    } catch (e) {
      console.error("PDF Engine Error:", e);
      toast.error("Encryption Failed", { id: 'doc-gen' });
    }
  },

  /**
   * Standardized WhatsApp sharing for business flow.
   */
  shareToWhatsApp(phone: string, message: string) {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    toast.success("Handoff to WhatsApp successful");
  }
};
