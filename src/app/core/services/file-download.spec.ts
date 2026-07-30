import { TestBed } from '@angular/core/testing';

import { FileDownload } from './file-download';

describe('FileDownload', () => {
  let service: FileDownload;
  let createObjectURLSpy: ReturnType<typeof vi.fn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>;
  let clickSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileDownload);

    createObjectURLSpy = vi.fn().mockReturnValue('blob:mock-url');
    revokeObjectURLSpy = vi.fn();
    URL.createObjectURL = createObjectURLSpy as typeof URL.createObjectURL;
    URL.revokeObjectURL = revokeObjectURLSpy as typeof URL.revokeObjectURL;

    clickSpy = vi.fn();
    HTMLAnchorElement.prototype.click = clickSpy as typeof HTMLAnchorElement.prototype.click;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create a Blob with the given content and mime type', () => {
    const blobSpy = vi.spyOn(globalThis, 'Blob');

    service.downloadTextFile('cars.csv', 'a,b,c', 'text/csv');

    expect(blobSpy).toHaveBeenCalledWith(['a,b,c'], { type: 'text/csv' });
  });

  it('should trigger a click on an anchor with the correct filename', () => {
    service.downloadTextFile('cars.csv', 'a,b,c', 'text/csv');

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('should revoke the object URL after triggering the download', () => {
    service.downloadTextFile('cars.csv', 'a,b,c', 'text/csv');

    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
  });

  it('should not leave the anchor attached to the document', () => {
    service.downloadTextFile('cars.csv', 'a,b,c', 'text/csv');

    expect(document.querySelector('a[download="cars.csv"]')).toBeNull();
  });
});
