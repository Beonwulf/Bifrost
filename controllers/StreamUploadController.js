import fs from 'node:fs';
import { BBController } from '../src/routing/BBController.js';

export default class StreamUploadController extends BBController {
    static path = '/api/upload-stream';
    static methods = ['put'];

    async put() {
        // 1. Gesamte Dateigröße aus den Headern auslesen (Fallback auf 0)
        const totalBytes = parseInt(this.req.headers['content-length'] || '0', 10);
        let receivedBytes = 0;

        const stream = fs.createWriteStream('./gigantic-upload.tmp');
        
        // 2. Den Fortschritt direkt am Request-Stream messen
        this.req.on('data', (chunk) => {
            receivedBytes += chunk.length;
            
            if (totalBytes > 0) {
                const progress = ((receivedBytes / totalBytes) * 100).toFixed(2);
                
                // Optional: Da Bifröst Socket.io integriert hat, könntest du den 
                // Fortschritt hier live an das Frontend senden!
                // this.app.io.emit('upload-progress', { progress, receivedBytes, totalBytes });
                console.log(`Fortschritt: ${progress}%`);
            }
        });
        
        // 3. Den Stream gleichzeitig in die Datei leiten
        this.req.pipe(stream);
        
        await new Promise(resolve => stream.on('finish', resolve));
        this.json({ success: true, message: 'Upload abgeschlossen!' });
    }
}