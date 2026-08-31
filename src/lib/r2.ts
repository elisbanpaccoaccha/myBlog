import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

/**
 * Cliente Cloudflare R2 usando la API compatible con AWS S3.
 * Las credenciales se leen en tiempo de servidor desde las variables de entorno.
 */
const getEnv = (key: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key]!;
  }
  const metaEnv = import.meta.env as Record<string, any>;
  return metaEnv?.[key] || '';
};

export function getR2Client(): S3Client {
  const endpoint = (getEnv('R2_ENDPOINT') || import.meta.env.R2_ENDPOINT || '').trim();
  const accessKeyId = getEnv('R2_ACCESS_KEY_ID') || import.meta.env.R2_ACCESS_KEY_ID || '';
  const secretAccessKey = getEnv('R2_SECRET_ACCESS_KEY') || import.meta.env.R2_SECRET_ACCESS_KEY || '';

  return new S3Client({
    region: 'auto',
    endpoint: endpoint || undefined,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export const r2 = getR2Client();

export const R2_BUCKET  = getEnv('R2_BUCKET_NAME')  || 'myblog';
export const R2_BASE_URL = (getEnv('R2_PUBLIC_URL') || '').replace(/\/+$/, '');

/**
 * Sube un buffer al bucket R2 y devuelve la URL pública.
 */
export async function uploadToR2(
  key:         string,
  body:        Buffer | Uint8Array,
  contentType: string,
): Promise<string> {
  const bucket = (getEnv('R2_BUCKET_NAME') || import.meta.env.R2_BUCKET_NAME || 'myblog').trim();
  const baseUrl = (getEnv('R2_PUBLIC_URL') || import.meta.env.R2_PUBLIC_URL || '').trim().replace(/\/+$/, '');

  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket:      bucket,
      Key:         key,
      Body:        body,
      ContentType: contentType,
    }),
  );
  return `${baseUrl}/${key}`;
}