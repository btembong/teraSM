import { S3Client } from '@aws-sdk/client-s3'

export const r2Configured =
  !!process.env.R2_ACCOUNT_ID &&
  !!process.env.R2_ACCESS_KEY_ID &&
  !!process.env.R2_SECRET_ACCESS_KEY &&
  !!process.env.R2_BUCKET_NAME

export const r2 = r2Configured
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })
  : null

export const R2_BUCKET = process.env.R2_BUCKET_NAME ?? ''

/**
 * Public base URL for R2 files.
 * Set NEXT_PUBLIC_R2_PUBLIC_URL to a custom domain (e.g. https://files.terasms.com)
 * or use the R2 dev URL (https://pub-xxx.r2.dev).
 */
export const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? ''
