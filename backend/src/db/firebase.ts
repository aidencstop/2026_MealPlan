import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 서비스 계정 키 파일 경로
const serviceAccountPath = join(__dirname, '../../firebase-service-account.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

// Firebase Admin 초기화
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Firestore 인스턴스
export const db = admin.firestore();

// Auth 인스턴스
export const auth = admin.auth();

console.log('✅ Firebase Admin 초기화 완료');

export default admin;
