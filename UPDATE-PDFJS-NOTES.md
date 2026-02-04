# PDF.js Version 4.2.67 Update Notes

## Security Vulnerability Fixed
Updated pdfjs-dist from 3.11.174 to 4.2.67 to fix CVE allowing arbitrary JavaScript execution when opening malicious PDFs.

## Breaking Changes in v4

### Import Path Changes
In PDF.js v4, the import paths have changed:
- Old: `pdfjs-dist/legacy/build/pdf.js`
- New: `pdfjs-dist` (main export)

### Worker Path Changes
- Old: `pdfjs-dist/legacy/build/pdf.worker.entry`
- New: `pdfjs-dist/build/pdf.worker.mjs`

### Files Requiring Updates
The following files use PDF.js and may need updates after npm install:

1. `app/(lib)/thumbnails.ts` - PDF thumbnail generation
2. `app/(lib)/thumbnails-real.ts` - Real PDF thumbnails
3. `app/(lib)/thumbnails-working.ts` - Working thumbnails
4. `app/(lib)/thumbnails-simple-pdf.ts` - Simple PDF thumbnails
5. `app/(lib)/pdf.worker.ts` - PDF worker configuration
6. `components/file-thumbnail.tsx` - File thumbnail component
7. `components/file-preview.tsx` - File preview component
8. `components/pdf-thumbnail.tsx` - PDF thumbnail component

### Recommended Migration Steps

1. **After npm install**, update import statements:
   ```typescript
   // Old
   import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
   import 'pdfjs-dist/legacy/build/pdf.worker.entry';
   
   // New
   import * as pdfjsLib from 'pdfjs-dist';
   pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
   ```

2. **Update worker configuration**:
   ```typescript
   pdfjsLib.GlobalWorkerOptions.workerSrc = 
     `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.worker.min.mjs`;
   ```

3. **Test PDF functionality**:
   - PDF thumbnail generation
   - PDF preview in file viewer
   - PDF upload and display

### Public Worker Files
The following public worker files may need to be replaced with v4.2.67 versions:
- `public/pdf.worker.min.js`
- `public/pdf.worker.min.mjs`

Download from: https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/

## Next Steps

1. Run `npm install` to update the package
2. Update import statements in the files listed above
3. Test PDF-related functionality
4. Update public worker files if needed

## References
- PDF.js Changelog: https://github.com/mozilla/pdf.js/releases
- PDF.js v4 Migration Guide: https://github.com/mozilla/pdf.js/wiki/Upgrading-to-v4
