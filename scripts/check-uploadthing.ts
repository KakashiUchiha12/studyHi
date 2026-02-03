
import { UploadButton } from "../lib/uploadthing.ts";

console.log('Checking UploadButton export...');
if (UploadButton) {
    console.log('✅ UploadButton is defined:', typeof UploadButton);
} else {
    console.error('❌ UploadButton is UNDEFINED.');
    process.exit(1);
}
