import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

/**
 * Cliente Cloudflare R2 usando la API compatible con AWS S3.
 * Las credenciales se leen en tiempo de servidor desde las variables de entorno.
 */
export const r2 = new S3Client({
  region: 'auto',                                        // R2 no necesita región real
  endpoint: import.meta.env.R2_ENDPOINT,                 // https://<account_id>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId:     import.meta.env.R2_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.R2_SECRET_ACCESS_KEY,
  },
});

export const R2_BUCKET  = import.meta.env.R2_BUCKET_NAME  || 'myblog-media';
export const R2_BASE_URL = import.meta.env.R2_PUBLIC_URL  || '';

/**
 * Sube un buffer al bucket R2 y devuelve la URL pública.
 */
export async function uploadToR2(
  key:         string,
  body:        Buffer | Uint8Array,
  contentType: string,
): Promise<string> {
  await r2.send(
    new PutObjectCommand({
      Bucket:      R2_BUCKET,
      Key:         key,
      Body:        body,
      ContentType: contentType,
    }),
  );
  return `${R2_BASE_URL}/${key}`;
}