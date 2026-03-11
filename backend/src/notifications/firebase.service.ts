import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class FirebaseService implements OnModuleInit {
    private readonly logger = new Logger(FirebaseService.name);
    private isInitialized = false;

    onModuleInit() {
        this.initializeFirebase();
    }

    private initializeFirebase() {
        try {
            const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');
            
            if (fs.existsSync(serviceAccountPath)) {
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccountPath),
                });
                this.isInitialized = true;
                this.logger.log('Firebase Admin initialized successfully');
            } else {
                this.logger.warn('Firebase service account file not found. Push notifications will be disabled.');
                this.logger.warn(`Expected path: ${serviceAccountPath}`);
            }
        } catch (error) {
            this.logger.error('Failed to initialize Firebase Admin', error.stack);
        }
    }

    async sendPushNotification(token: string, title: string, body: string, data?: any) {
        if (!this.isInitialized) {
            this.logger.warn('Push notification skipped: Firebase not initialized');
            return;
        }

        try {
            const message = {
                notification: { title, body },
                token: token,
                data: data || {},
            };

            const response = await admin.messaging().send(message);
            this.logger.log(`Successfully sent message: ${response}`);
            return response;
        } catch (error) {
            this.logger.error('Error sending push notification', error.stack);
            throw error;
        }
    }

    async sendToTopic(topic: string, title: string, body: string, data?: any) {
        if (!this.isInitialized) return;

        try {
            const message = {
                notification: { title, body },
                topic: topic,
                data: data || {},
            };

            await admin.messaging().send(message);
        } catch (error) {
            this.logger.error(`Error sending topic notification to ${topic}`, error.stack);
        }
    }
}
