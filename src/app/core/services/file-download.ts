import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FileDownload {
  /**
   * Triggers a browser download of a URL (e.g. the backend's CSV export endpoint) via a plain
   * anchor click — a real navigation, not an XHR/fetch, so it works cross-origin without needing
   * CORS to read the response body, and streams straight to disk instead of buffering the whole
   * file in memory first.
   */
  downloadFromUrl(url: string): void {
    const anchor = document.createElement('a');
    anchor.href = url;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }

  /**
   * Triggers a browser download of in-memory text as a file — for content generated client-side
   * (e.g. a CSV built from data already fetched) rather than streamed from a backend URL.
   */
  downloadText(filename: string, content: string, mimeType = 'text/csv;charset=utf-8'): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }
}
