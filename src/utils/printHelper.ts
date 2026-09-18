/**
 * Dedicated Printer Helper for Max Executive Tires
 * Provides multiple resilient printing pathways:
 * 1. Isolated Hidden Iframe Print (bypasses modal overflow, fixed positioning, and dark theme issues)
 * 2. Fallback to Window.print() with clean body class
 * 3. Safe fallback detection if browser iframe sandbox blocks direct modal print dialogs
 */

export function printHtmlViaIframe(
  contentHtml: string,
  docTitle: string = 'Max Executive Tires - Barcode Labels'
): Promise<{ success: boolean; reason?: string }> {
  return new Promise((resolve) => {
    try {
      let printFrame = document.getElementById('barcode-label-print-frame') as HTMLIFrameElement;
      if (printFrame) {
        printFrame.remove();
      }

      printFrame = document.createElement('iframe');
      printFrame.id = 'barcode-label-print-frame';
      printFrame.style.position = 'fixed';
      printFrame.style.right = '-9999px';
      printFrame.style.bottom = '-9999px';
      printFrame.style.width = '1000px';
      printFrame.style.height = '1200px';
      printFrame.style.border = '0';
      printFrame.style.opacity = '0';
      printFrame.style.pointerEvents = 'none';
      document.body.appendChild(printFrame);

      const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
      if (!frameDoc) {
        resolve({ success: false, reason: 'No iframe document' });
        return;
      }

      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${docTitle}</title>
            <style>
              @page {
                size: 8.5in 11in portrait;
                margin: 0 !important;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #000000 !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              * {
                box-sizing: border-box !important;
              }
              .avery-5163-sheet {
                width: 8.5in !important;
                height: 11.0in !important;
                min-height: 11.0in !important;
                max-width: 8.5in !important;
                max-height: 11.0in !important;
                padding: 0.5in 0.156in !important;
                display: grid !important;
                grid-template-columns: 4.0in 4.0in !important;
                grid-template-rows: repeat(5, 2.0in) !important;
                column-gap: 0.188in !important;
                row-gap: 0in !important;
                background: #ffffff !important;
                box-sizing: border-box !important;
                page-break-after: always !important;
                break-after: page !important;
                margin: 0 auto !important;
              }
              .avery-5163-sheet:last-of-type {
                page-break-after: auto !important;
                break-after: auto !important;
              }
              .grid-2x4-sheet {
                width: 8.5in !important;
                height: 11.0in !important;
                min-height: 11.0in !important;
                max-width: 8.5in !important;
                max-height: 11.0in !important;
                padding: 0.5in 0.156in !important;
                display: grid !important;
                grid-template-columns: 4.0in 4.0in !important;
                grid-template-rows: repeat(4, 2.5in) !important;
                column-gap: 0.188in !important;
                row-gap: 0in !important;
                background: #ffffff !important;
                box-sizing: border-box !important;
                page-break-after: always !important;
                break-after: page !important;
                margin: 0 auto !important;
              }
              .grid-2x4-sheet:last-of-type {
                page-break-after: auto !important;
                break-after: auto !important;
              }
              .avery-2x4-label,
              .large-2x4-label {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                background: #ffffff !important;
                overflow: hidden !important;
              }
              .no-print {
                display: none !important;
              }
            </style>
          </head>
          <body>
            ${contentHtml}
          </body>
        </html>
      `);
      frameDoc.close();

      setTimeout(() => {
        try {
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();
          resolve({ success: true });
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.warn('Iframe printing triggered exception (e.g. sandbox restriction):', errMsg);
          resolve({ success: false, reason: errMsg });
        }
      }, 350);
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      resolve({ success: false, reason: errMsg });
    }
  });
}
