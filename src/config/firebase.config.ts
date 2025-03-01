import * as admin from 'firebase-admin';
import * as firebaseConfig from '../../firebase.config.json';

export function initFirebaseAdmin(): void {
  admin.initializeApp({
    credential: admin.credential.cert({
      privateKey: firebaseConfig.private_key, // .replace(/\\n/g, '\n')
      clientEmail: firebaseConfig.client_email,
      projectId: firebaseConfig.project_id,
    } as Partial<admin.ServiceAccount>),
    storageBucket: `${firebaseConfig.project_id}.appspot.com`, // can different by location
  });
}
