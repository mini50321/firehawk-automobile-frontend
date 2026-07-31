import { TestBed } from '@angular/core/testing';

import { FileDownload } from './file-download';

describe('FileDownload', () => {
  let service: FileDownload;
  let clickSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileDownload);

    clickSpy = vi.fn();
    HTMLAnchorElement.prototype.click = clickSpy as typeof HTMLAnchorElement.prototype.click;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set the anchor href to the given URL and click it', () => {
    const createElementSpy = vi.spyOn(document, 'createElement');

    service.downloadFromUrl('https://api.example.com/cars/export?fuelType=gas');

    expect(clickSpy).toHaveBeenCalledTimes(1);

    const anchorResult = createElementSpy.mock.results.find(
      (result) => result.value instanceof HTMLAnchorElement,
    );
    const anchor = anchorResult?.value as HTMLAnchorElement;
    expect(anchor.href).toBe('https://api.example.com/cars/export?fuelType=gas');
  });

  it('should not leave the anchor attached to the document', () => {
    service.downloadFromUrl('https://api.example.com/cars/export');

    expect(document.querySelector('a[href*="cars/export"]')).toBeNull();
  });

  describe('downloadText', () => {
    it('should create a blob URL, set it as the anchor download target, and click it', () => {
      const createObjectURLSpy = vi
        .spyOn(URL, 'createObjectURL')
        .mockReturnValue('blob:mock-url');
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      service.downloadText('automobiles.csv', 'id,name\n1,toyota');

      expect(createObjectURLSpy).toHaveBeenCalledWith(expect.any(Blob));
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should not leave the anchor attached to the document', () => {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      service.downloadText('automobiles.csv', 'id,name\n1,toyota');

      expect(document.querySelector('a[download="automobiles.csv"]')).toBeNull();
    });
  });
});
