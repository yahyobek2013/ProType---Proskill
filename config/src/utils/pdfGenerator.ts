import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';

export interface CertificateData {
  id: string;
  user_id: string;
  user_name: string;
  login: string;
  user_avatar?: string;
  wpm: number;
  net_wpm: number;
  accuracy: number;
  errors?: number;
  test_type: string;
  date: string;
  created_at?: string;
}

export async function generateQRCodeDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 240,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Error generating QR Code:', err);
    return '';
  }
}

/**
 * Pre-processes images in the element to ensure cross-origin/external image sources
 * are fully loaded or converted to data URLs before html2canvas rendering.
 */
export async function inlineImagesForCanvas(element: HTMLElement): Promise<void> {
  const imgs = Array.from(element.querySelectorAll('img'));
  const promises = imgs.map(async (img) => {
    if (!img.complete) {
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    }

    if (img.src && !img.src.startsWith('data:')) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.clientWidth || 200;
        canvas.height = img.naturalHeight || img.clientHeight || 200;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/png');
          img.setAttribute('data-original-src', img.src);
          img.src = dataUrl;
        }
      } catch (err) {
        // Fallback: html2canvas useCORS will handle standard CORS images
      }
    }
  });

  await Promise.all(promises);
}

/**
 * Helper to convert any modern CSS color functions (oklch, lab, lch, color-mix, color)
 * to standard CSS colors (hex, rgb, rgba).
 */
export function convertColorToStandard(colorStr: string): string {
  if (!colorStr) return '';
  if (
    !colorStr.includes('oklch') &&
    !colorStr.includes('lab') &&
    !colorStr.includes('lch') &&
    !colorStr.includes('color-mix') &&
    !colorStr.includes('color(')
  ) {
    return colorStr;
  }

  // 1. Try canvas context fillStyle resolution
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0f172a';
      ctx.fillStyle = colorStr;
      const resolved = ctx.fillStyle;
      if (resolved && !resolved.includes('oklch') && !resolved.includes('color-mix')) {
        return resolved;
      }
    }
  } catch (e) {
    // Canvas resolution fallback
  }

  // 2. Regex fallback replacement for modern CSS colors
  return colorStr
    .replace(/oklch\(\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)(?:\s*\/\s*([0-9.]+))?\)/gi, (m, l, c, h, a) => {
      const numL = parseFloat(l);
      const alpha = a !== undefined ? parseFloat(a) : 1;
      if (numL < 0.25) return alpha < 1 ? `rgba(9, 13, 22, ${alpha})` : '#090d16';
      if (numL < 0.4) return alpha < 1 ? `rgba(15, 23, 42, ${alpha})` : '#0f172a';
      if (numL > 0.85) return alpha < 1 ? `rgba(248, 250, 252, ${alpha})` : '#f8fafc';
      if (numL > 0.7) return alpha < 1 ? `rgba(245, 158, 11, ${alpha})` : '#f59e0b';
      return alpha < 1 ? `rgba(56, 189, 248, ${alpha})` : '#38bdf8';
    })
    .replace(/oklch\([^)]+\)/gi, '#f59e0b')
    .replace(/color-mix\([^)]+\)/gi, 'rgba(255, 255, 255, 0.1)')
    .replace(/lab\([^)]+\)/gi, '#0f172a')
    .replace(/lch\([^)]+\)/gi, '#0f172a')
    .replace(/color\([^)]+\)/gi, '#0f172a');
}

/**
 * Sanitizes the cloned document to remove or convert any oklch or unsupported CSS color functions
 * from style tags, inline styles, and element computed styles.
 */
export function sanitizeClonedDocForExport(clonedDoc: Document, certificateId: string): void {
  // 1. Sanitize all <style> elements in cloned document
  const styleEls = Array.from(clonedDoc.querySelectorAll('style'));
  styleEls.forEach((styleEl) => {
    if (
      styleEl.textContent &&
      (styleEl.textContent.includes('oklch') ||
        styleEl.textContent.includes('color-mix') ||
        styleEl.textContent.includes('lab') ||
        styleEl.textContent.includes('lch'))
    ) {
      styleEl.textContent = styleEl.textContent
        .replace(/oklch\([^)]+\)/gi, '#f59e0b')
        .replace(/color-mix\([^)]+\)/gi, 'rgba(255, 255, 255, 0.1)')
        .replace(/lab\([^)]+\)/gi, '#0f172a')
        .replace(/lch\([^)]+\)/gi, '#0f172a');
    }
  });

  // 2. Target certificate element and all its children
  const clonedEl = clonedDoc.querySelector(`[data-certificate-id="${certificateId}"]`) as HTMLElement;
  if (clonedEl) {
    clonedEl.style.transform = 'none';
    clonedEl.style.borderRadius = '24px';
    clonedEl.classList.add('certificate-export-canvas', 'certificate-export-card');

    const elements = [clonedEl, ...Array.from(clonedEl.querySelectorAll('*'))] as HTMLElement[];
    elements.forEach((node) => {
      // Inline styles attribute check
      const inlineStyle = node.getAttribute('style');
      if (
        inlineStyle &&
        (inlineStyle.includes('oklch') ||
          inlineStyle.includes('color-mix') ||
          inlineStyle.includes('lab') ||
          inlineStyle.includes('lch'))
      ) {
        node.setAttribute('style', convertColorToStandard(inlineStyle));
      }

      // Computed styles check & convert
      if (node.style) {
        try {
          const comp = window.getComputedStyle(node);
          const colorProps = [
            'color',
            'backgroundColor',
            'borderColor',
            'borderTopColor',
            'borderRightColor',
            'borderBottomColor',
            'borderLeftColor',
            'boxShadow',
            'textShadow',
            'fill',
            'stroke',
          ];
          colorProps.forEach((prop) => {
            const val = comp.getPropertyValue(prop);
            if (
              val &&
              (val.includes('oklch') ||
                val.includes('color-mix') ||
                val.includes('lab') ||
                val.includes('lch'))
            ) {
              node.style.setProperty(prop, convertColorToStandard(val), 'important');
            }
          });
        } catch (e) {
          // Ignore computed style errors
        }
      }
    });
  }
}

/**
 * Downloads the certificate as a high-quality PDF document.
 */
export async function downloadCertificatePDF(
  element: HTMLElement,
  certificateId: string,
  userName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await inlineImagesForCanvas(element);

    const canvas = await html2canvas(element, {
      scale: 3, // High DPI (300+ DPI equivalent for crisp text & print)
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#090d16',
      logging: false,
      imageTimeout: 15000,
      onclone: (clonedDoc) => {
        sanitizeClonedDocForExport(clonedDoc, certificateId);
      },
    });

    const imgData = canvas.toDataURL('image/png', 1.0);

    // Create standard A4 Landscape PDF (297mm x 210mm)
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 297mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 210mm

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const ratio = canvasWidth / canvasHeight;

    let printWidth = pdfWidth;
    let printHeight = pdfWidth / ratio;

    if (printHeight > pdfHeight) {
      printHeight = pdfHeight;
      printWidth = pdfHeight * ratio;
    }

    const marginX = (pdfWidth - printWidth) / 2;
    const marginY = (pdfHeight - printHeight) / 2;

    pdf.addImage(imgData, 'PNG', marginX, marginY, printWidth, printHeight, undefined, 'FAST');

    const safeName = (userName || 'Foydalanuvchi').replace(/[^a-zA-Z0-9_]/g, '_');
    const fileName = `ProType_Sertifikat_${certificateId}_${safeName}.pdf`;

    pdf.save(fileName);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to generate PDF:', error);
    return {
      success: false,
      error: error?.message || 'PDF faylini yaratishda xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.',
    };
  }
}

/**
 * Downloads the competition result report as a high-quality PDF document.
 */
export async function downloadCompetitionResultPDF(
  element: HTMLElement,
  competitionId: string,
  userName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await inlineImagesForCanvas(element);

    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#090d16',
      logging: false,
      imageTimeout: 15000,
      onclone: (clonedDoc) => {
        sanitizeClonedDocForExport(clonedDoc, competitionId);
      },
    });

    const imgData = canvas.toDataURL('image/png', 1.0);

    // Create A4 Portrait PDF (210mm x 297mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const ratio = canvasWidth / canvasHeight;

    let printWidth = pdfWidth - 20; // 10mm margins on sides
    let printHeight = printWidth / ratio;

    if (printHeight > pdfHeight - 20) {
      printHeight = pdfHeight - 20;
      printWidth = printHeight * ratio;
    }

    const marginX = (pdfWidth - printWidth) / 2;
    const marginY = (pdfHeight - printHeight) / 2;

    pdf.addImage(imgData, 'PNG', marginX, marginY, printWidth, printHeight, undefined, 'FAST');

    const safeName = (userName || 'Foydalanuvchi').replace(/[^a-zA-Z0-9_]/g, '_');
    const fileName = `ProType_Musobaqa_Natijasi_${safeName}.pdf`;

    pdf.save(fileName);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to generate Competition Result PDF:', error);
    return {
      success: false,
      error: error?.message || 'Natija hisobotini PDF formatida yaratishda xatolik yuz berdi.',
    };
  }
}

/**
 * Downloads the certificate as a high-resolution PNG image.
 */
export async function downloadCertificatePNG(
  element: HTMLElement,
  certificateId: string,
  userName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await inlineImagesForCanvas(element);

    const canvas = await html2canvas(element, {
      scale: 3, // High DPI for crisp printing and sharing
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#090d16',
      logging: false,
      imageTimeout: 15000,
      onclone: (clonedDoc) => {
        sanitizeClonedDocForExport(clonedDoc, certificateId);
      },
    });

    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    const safeName = (userName || 'Foydalanuvchi').replace(/[^a-zA-Z0-9_]/g, '_');
    link.download = `ProType_Sertifikat_${certificateId}_${safeName}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true };
  } catch (error: any) {
    console.error('Failed to generate PNG:', error);
    return {
      success: false,
      error: error?.message || 'Rasm faylini yaratishda xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.',
    };
  }
}
