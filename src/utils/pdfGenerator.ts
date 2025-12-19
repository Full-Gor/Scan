import jsPDF from 'jspdf';
import type { Document } from '../types';
import { applyFilter } from './imageProcessing';

export async function generatePDF(document: Document): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;

  for (let i = 0; i < document.pages.length; i++) {
    const page = document.pages[i];

    if (i > 0) {
      pdf.addPage();
    }

    // Apply filter and get the processed image
    const processedImage = await applyFilter(page.originalImage, page.filter);

    // Get image dimensions
    const img = await loadImage(processedImage);
    const imgAspect = img.width / img.height;
    const pageAspect = (pageWidth - 2 * margin) / (pageHeight - 2 * margin);

    let imgWidth: number;
    let imgHeight: number;

    if (imgAspect > pageAspect) {
      imgWidth = pageWidth - 2 * margin;
      imgHeight = imgWidth / imgAspect;
    } else {
      imgHeight = pageHeight - 2 * margin;
      imgWidth = imgHeight * imgAspect;
    }

    const x = (pageWidth - imgWidth) / 2;
    const y = (pageHeight - imgHeight) / 2;

    pdf.addImage(processedImage, 'JPEG', x, y, imgWidth, imgHeight);
  }

  return pdf.output('blob');
}

export async function downloadPDF(document: Document): Promise<void> {
  const blob = await generatePDF(document);
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  link.href = url;
  link.download = `${document.name}.pdf`;
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function sharePDF(document: Document): Promise<void> {
  const blob = await generatePDF(document);
  const file = new File([blob], `${document.name}.pdf`, { type: 'application/pdf' });

  if (navigator.share && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: document.name,
        files: [file],
      });
    } catch (error) {
      // User cancelled or share failed, fall back to download
      downloadPDF(document);
    }
  } else {
    // Fallback to download
    downloadPDF(document);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
