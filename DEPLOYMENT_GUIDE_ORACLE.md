# 🎓 eRankUp: Oracle Cloud Production Deployment Guide (2026)

This guide provides step-by-step instructions to deploy the eRankUp application on the **Oracle Cloud ** (ARM Ampere A1, 24GB RAM).

---

## 🏗️ Phase 1: Oracle Cloud Infrastructure Setup

### 1. Create your Account
- Go to [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/).
- **CRITICAL**: Select **India (Mumbai)** or **India (Hyderabad)** as your "Home Region".
- Complete the credit card verification (approx. ₹85, will be refunded).

#### 💳 Important Note on Card Verification (India 🇮🇳)
Oracle requires a card to verify your identity. Most Indian users face issues here. Follow these tips:
- **Enable International Transactions**: Ensure your card has "International Usage" enabled in your bank app.
- **Banks that work**: HDFC, ICICI, Kotak, Axis, and Standard Chartered (Visa/Mastercard).
- **Banks that often fail**: SBI, PNB, and most Government banks.
- **Rupay Cards**: These are **not supported**. Use Visa or Mastercard.
- **Verification**: Oracle will place a temporary hold of ~₹85 ($1). This is **not a charge** and will be released/refunded shortly.
- **No Hidden Costs**: As long as you stay within the "Always Free" limits (which we have configured), your monthly bill will stay **₹0**.

### 2. Provision the Compute Instance
- Navigate to **Compute** -> **Instances** -> **Create Instance**.
- **Name**: `erankup-prod-vps`
- **Image**: `Canonical Ubuntu 22.04` (or latest).
- **Shape**: Click "Change Shape" -> **Ampere (ARM)**.
    - OCPUs: **4**
    - RAM: **24 GB**
- **Networking**: Ensure "Assign a public IPv4 address" is set to Yes.
- **SSH Keys**: Download both the **Private Key** and **Public Key**. Keep them safe!

### 3. Open Network Ports (VCN Setup)
Oracle's default firewall blocks all traffic. You must open the ports:
1. Click on your **Subnet** in the Instance details.
2. Click on the **Default Security List**.
3. Add **Ingress Rules**:
    - **Port 80/443**: (HTTP/HTTPS for users)
    - **Port 3001**: (Backend API)
    - **Port 3000**: (Web App Frontend)
    - **Source CIDR**: `0.0.0.0/0`

---

## 🛠️ Phase 2: Server Environment Preparation

Connect to your server via SSH:
```bash
ssh -i your_private_key.key ubuntu@<YOUR_INSTANCE_IP>
```

### 1. Update and Install Docker
Run these commands to install Docker and Node.js on your server:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install docker.io -y
sudo systemctl enable --now docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Node.js (for npm management)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## 🚀 Phase 3: Application Deployment

### 1. Clone the Production Branch
```bash
git clone -b Main-109 https://github.com/SimhaDadi/eRankUp.git
cd eRankUp
```

### 2. Configure Environment Variables
Create a production `.env` file in the root directory:
```bash
nano .env
```
Paste and fill in your secrets:
```env
# Database (Auto-configured for Docker)
DB_USER=admin
DB_PASSWORD=choose_a_strong_password
DB_NAME=erankup_db

# AI & APIs
GOOGLE_AI_API_KEY=your_gemini_api_key
JWT_SECRET=your_super_secret_jwt_key

# Payments
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret

# Google login (Sign-in)
GOOGLE_CLIENT_ID=your_id_here
GOOGLE_CLIENT_SECRET=your_secret_here
GOOGLE_CALLBACK_URL=http://your_domain_or_ip:3001/auth/google/callback
```

### 3. Fire up the Stack
Run the production deployment script:
```bash
# This will build and start: Postgres, Redis, Kafka, Zookeeper, Backend, and AI Engine
npm run deploy:prod
```

### 4. Run Initial Migrations
Wait for the database to be healthy (approx 30s), then run:
```bash
docker exec -it erankup-backend npm run migration:run
```

---

## 📊 Phase 4: Monitoring & Maintenance

### 📺 View Logs
To see what your services are doing (especially Kafka and the AI Engine):
```bash
npm run logs:prod
```

### 🔍 Check Resource Usage
With 24GB of RAM, you can check how much Kafka is using:
```bash
docker stats
```

### 🛑 Important Note on Idleness
Oracle might stop "Always Free" instances if they stay below 10% CPU for long periods.
**Strategy**: Once you have active users, this won't be an issue. During testing, you can upgrade your account to **Pay-As-You-Go** (you will still be billed ₹0 if you stay under limits) to "lock" your instance forever.

---

## 🆘 Troubleshooting
- **Kafka connection fail?**: Wait 1 minute. Kafka needs more time to start than the API.
- **Port unreachable?**: Double check the "Ingress Rules" in the Oracle Cloud Console.
- **ARM Architecture errors?**: Our `docker-compose.prod.yml` uses Bitnami images which are ARM-compatible by default.

---

## 🔐 Security & API Key Recovery

To protect your business, **never** push your real API keys to GitHub. Follow these steps to prepare your keys for the Oracle server:

### 1. Where to find your keys locally
If you have forgotten your keys, check these locations on your development machine:
- **Gemini AI**: Visit [Google AI Studio](https://aistudio.google.com/app/apikey).
- **Google Login (OAuth)**: Visit [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
- **Razorpay**: Log in to the [Razorpay Dashboard](https://dashboard.razorpay.com/) -> Settings -> API Keys.
- **Local Search**: Run this command in your local project folder to see where you last used the keys:
  ```powershell
  # Search for Razorpay keys
  Get-ChildItem -Recurse | Select-String "rzp_"
  # Search for Gemini keys
  Get-ChildItem -Recurse | Select-String "AIza"
  # Search for Google Client ID
  Get-ChildItem -Recurse | Select-String ".apps.googleusercontent.com"
  ```

### 2. Setting Keys on the Server
When you reach **Phase 3, Step 2** of this guide on your Oracle VPS:
1. Open the file: `nano .env`
2. Replace the placeholders with your **Live** keys.
3. Save and Exit (`Ctrl+O`, `Enter`, `Ctrl+X`).

---
**Deployment Guide Authored by Antigravity AI for eRankUp.**
