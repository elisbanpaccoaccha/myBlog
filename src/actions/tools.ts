import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

export const toolsActions = {
  parseDocument: defineAction({
    accept: 'form',
    input: z.object({
      file: z.any(),
    }),
    handler: async ({ file }) => {
      if (!(file instanceof File)) {
        throw new Error('No se recibió un archivo válido.');
      }

      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      if (file.size > MAX_SIZE) {
        throw new Error('El archivo excede el límite de 5MB.');
      }

      const validTypes = ['application/pdf', 'text/plain', 'text/markdown', 'image/png', 'image/jpeg', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Tipo de archivo no permitido. Solo PDF, TXT, MD, PNG, JPG.');
      }

      try {
        if (file.type === 'application/pdf') {
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          const data = await pdfParse(buffer, { max: 10 }); 
          
          if (!data.text || data.text.trim().length === 0) {
            throw new Error('El PDF parece estar vacío o ser solo imágenes (escaneado).');
          }
          
          return { type: 'text', content: data.text, filename: file.name };
          
        } else if (file.type.startsWith('text/')) {
          const text = await file.text();
          const MAX_CHARS = 100000;
          return { type: 'text', content: text.substring(0, MAX_CHARS), filename: file.name };
          
        } else if (file.type.startsWith('image/')) {
          const arrayBuffer = await file.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          const dataUrl = `data:${file.type};base64,${base64}`;
          return { type: 'image', content: dataUrl, filename: file.name };
        }
        
        throw new Error('Formato no soportado.');
      } catch (err: any) {
        throw new Error('Error al procesar el archivo: ' + err.message);
      }
    }
  }),
};
