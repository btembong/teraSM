import * as admin from 'firebase-admin'

const configured =
  !!process.env.FIREBASE_PROJECT_ID &&
  !!process.env.FIREBASE_CLIENT_EMAIL &&
  !!process.env.FIREBASE_PRIVATE_KEY

let app: admin.app.App | null = null

if (configured) {
  app = admin.apps.length
    ? admin.apps[0]!
    : admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID!,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
          privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        }),
      })
}

export const fcmConfigured = configured

export async function sendPushNotification(opts: {
  token: string
  title: string
  body: string
  link?: string
}) {
  if (!configured || !app) {
    console.log(`[PUSH] ${opts.title}: ${opts.body}`)
    return
  }
  try {
    await admin.messaging(app).send({
      token: opts.token,
      notification: { title: opts.title, body: opts.body },
      webpush: opts.link
        ? { fcmOptions: { link: opts.link } }
        : undefined,
    })
  } catch (err) {
    console.error('[FCM] push failed:', err)
  }
}
