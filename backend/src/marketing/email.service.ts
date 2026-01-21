import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailCampaign, CampaignStatus } from './entities/campaign.entity';
import { User } from '../users/user.entity';

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor(
        @InjectRepository(EmailCampaign)
        private campaignRepository: Repository<EmailCampaign>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private configService: ConfigService
    ) {
        this.initializeTransporter();
    }

    private initializeTransporter() {
        const host = this.configService.get('SMTP_HOST');
        const port = this.configService.get('SMTP_PORT');
        const user = this.configService.get('SMTP_USER');
        const pass = this.configService.get('SMTP_PASS');

        if (host && user && pass) {
            this.transporter = nodemailer.createTransport({
                host,
                port: Number(port) || 587,
                secure: false, // true for 465, false for other ports
                auth: { user, pass }
            });
            console.log('✅ Email Service initialized with SMTP');
        } else {
            console.warn('⚠️ SMTP Credentials missing. Email Service is in simplified mode (logging only).');
        }
    }

    async createCampaign(data: Partial<EmailCampaign>) {
        const campaign = this.campaignRepository.create(data);
        return this.campaignRepository.save(campaign);
    }

    async getAllCampaigns() {
        return this.campaignRepository.find({
            order: { createdAt: 'DESC' }
        });
    }

    async sendCampaign(id: string) {
        const campaign = await this.campaignRepository.findOne({ where: { id } });
        if (!campaign) throw new Error('Campaign not found');

        if (campaign.status === CampaignStatus.SENT || campaign.status === CampaignStatus.SENDING) {
            throw new Error('Campaign is already sent or sending');
        }

        // Update status to SENDING
        campaign.status = CampaignStatus.SENDING;
        await this.campaignRepository.save(campaign);

        // Fetch recipients (Simplification: sending to all users for now, or filtered)
        // In real app: Apply targetAudience filters
        const users = await this.userRepository.find({
            select: ['email', 'fullName'] // Optimize select
        });

        campaign.recipientCount = users.length;
        campaign.successCount = 0;
        campaign.failureCount = 0;
        await this.campaignRepository.save(campaign);

        // Background processing (Ideally use a Queue like BullMQ)
        this.processEmailBatch(campaign, users);

        return { message: 'Campaign sending started', campaignId: id, recipientCount: users.length };
    }

    private async processEmailBatch(campaign: EmailCampaign, users: User[]) {
        for (const user of users) {
            try {
                if (this.transporter) {
                    await this.transporter.sendMail({
                        from: this.configService.get('SMTP_FROM', '"eRankUp" <no-reply@erankup.com>'),
                        to: user.email,
                        subject: campaign.subject,
                        html: campaign.content
                    });
                    campaign.successCount++;
                } else {
                    // Simulation mode
                    console.log(`[SIMULATION] Sending email to ${user.email}: ${campaign.subject}`);
                    campaign.successCount++;
                    await new Promise(r => setTimeout(r, 100)); // Simulate network delay
                }
            } catch (error) {
                console.error(`Failed to email ${user.email}:`, error);
                campaign.failureCount++;
            }

            // Save progress periodically (e.g. every 10 users)
            if ((campaign.successCount + campaign.failureCount) % 10 === 0) {
                await this.campaignRepository.save(campaign);
            }
        }

        campaign.status = CampaignStatus.SENT;
        campaign.sentAt = new Date();
        await this.campaignRepository.save(campaign);
        console.log(`Campaign ${campaign.id} completed. Success: ${campaign.successCount}, Fail: ${campaign.failureCount}`);
    }

    async deleteCampaign(id: string) {
        return this.campaignRepository.delete(id);
    }

    async getStats() {
        const total = await this.campaignRepository.count();
        const sent = await this.campaignRepository.count({ where: { status: CampaignStatus.SENT } });
        return { total, sent };
    }
}
