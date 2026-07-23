import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

/**
 * Cliente Cloudflare R2 usando la API compatible con AWS S3.
 * Las credenciales se leen en tiempo de servidor desde las variables de entorno.
 */
const getEnv = (key: string) => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return (import.meta.env as Record<string, any>)[key];
};

export const r2 = new S3Client({
  region: 'auto',
  endpoint: getEnv('R2_ENDPOINT'),
  credentials: {
    accessKeyId:     getEnv('R2_ACCESS_KEY_ID') || '',
    secretAccessKey: getEnv('R2_SECRET_ACCESS_KEY') || '',
  },
});

export const R2_BUCKET  = getEnv('R2_BUCKET_NAME')  || 'myblog-media';
export const R2_BASE_URL = getEnv('R2_PUBLIC_URL')  || '';

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