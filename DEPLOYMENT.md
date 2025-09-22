# DigitalOcean VPS Deployment Guide

This guide explains how to deploy the Laboratorio Celular POS application on a DigitalOcean VPS with Cloudflare configuration.

## Prerequisites

- DigitalOcean VPS (minimum 2GB RAM recommended)
- Domain name configured with Cloudflare
- SSH access to your VPS

## 1. VPS Setup

### Install Docker and Docker Compose

```bash
# Update the system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to the docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Log out and log back in for group changes to take effect
```

### Install Git and other tools

```bash
sudo apt install git nginx-utils htop -y
```

## 2. Clone and Setup the Application

```bash
# Clone the repository
git clone https://github.com/MauLom/laboratorioCelular-POS.git
cd laboratorioCelular-POS

# Make deploy script executable
chmod +x deploy.sh
```

## 3. Configure Environment Variables

### Set production environment variables

```bash
# Create a .env file for production secrets
nano .env.prod
```

Add the following content to `.env.prod`:

```env
# MongoDB Configuration
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your-very-strong-mongodb-password-here

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secure-jwt-secret-key-minimum-32-characters

# Domain Configuration
FRONTEND_URL=https://your-domain.com
REACT_APP_API_URL=https://your-domain.com/api
```

### Update domain configuration

```bash
# Update nginx configuration with your domain
sed -i 's/your-domain.com/yourdomain.com/g' nginx/conf.d/default.conf
```

## 4. SSL Certificate Setup

### Option A: Let's Encrypt (Recommended)

```bash
# Install certbot
sudo apt install certbot -y

# Generate SSL certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Create SSL directory and copy certificates
mkdir -p ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/your-domain.crt
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/your-domain.key
sudo chown $USER:$USER ssl/*
```

### Option B: Cloudflare Origin Certificate

1. Go to Cloudflare Dashboard → SSL/TLS → Origin Certificates
2. Create a new certificate for your domain
3. Save the certificate as `ssl/your-domain.crt`
4. Save the private key as `ssl/your-domain.key`

## 5. Cloudflare Configuration

### DNS Settings
- Add A record pointing to your VPS IP address
- Add CNAME record for www pointing to your domain
- Enable "Proxied" (orange cloud) for both records

### SSL/TLS Settings
- Set encryption mode to "Full (strict)"
- Enable "Always Use HTTPS"
- Enable "HTTP Strict Transport Security (HSTS)"

### Security Settings
- Enable "Web Application Firewall (WAF)"
- Set security level to "Medium" or "High"
- Enable "DDoS Protection"

## 6. Deploy the Application

```bash
# Load environment variables
source .env.prod

# Deploy in production mode
./deploy.sh production
```

## 7. Verify Deployment

### Check service status
```bash
# Check if all containers are running
./deploy.sh status

# Check logs if there are issues
./deploy.sh logs
```

### Test endpoints
```bash
# Test backend health
curl https://yourdomain.com/api/health

# Test frontend
curl https://yourdomain.com
```

## 8. Monitoring and Maintenance

### Setup automatic SSL renewal (if using Let's Encrypt)
```bash
# Add cron job for certificate renewal
sudo crontab -e

# Add this line:
0 3 * * 1 certbot renew --post-hook "systemctl reload nginx"
```

### Setup log rotation
```bash
# Docker logs can grow large, setup log rotation
sudo nano /etc/logrotate.d/docker

# Add this content:
/var/lib/docker/containers/*/*.log {
  rotate 5
  daily
  compress
  size=50M
  missingok
  delaycompress
  copytruncate
}
```

### Backup MongoDB data
```bash
# Create backup script
nano backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/$USER/backups"
mkdir -p $BACKUP_DIR

# Backup MongoDB
docker exec laboratorioCelular_mongo_prod mongodump --archive=/dump/laboratorioCelular_$DATE.gz --gzip --authenticationDatabase admin -u admin -p your-mongodb-password

# Copy from container to host
docker cp laboratorioCelular_mongo_prod:/dump/laboratorioCelular_$DATE.gz $BACKUP_DIR/

# Keep only last 7 backups
find $BACKUP_DIR -name "laboratorioCelular_*.gz" -mtime +7 -delete
```

```bash
chmod +x backup.sh

# Schedule daily backups
crontab -e
# Add: 0 2 * * * /home/$USER/laboratorioCelular-POS/backup.sh
```

## 9. Troubleshooting

### Common Issues

1. **Permission denied errors**
   ```bash
   sudo chown -R $USER:$USER /home/$USER/laboratorioCelular-POS
   ```

2. **MongoDB connection issues**
   - Check if MongoDB container is running: `docker ps`
   - Check logs: `docker logs laboratorioCelular_mongo_prod`

3. **SSL certificate issues**
   - Verify certificate files exist: `ls -la ssl/`
   - Check nginx configuration: `nginx -t`

4. **Cloudflare connectivity issues**
   - Ensure DNS records are properly configured
   - Check if SSL mode is set to "Full (strict)"

### Useful Commands

```bash
# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend

# View real-time logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Update application (deploy new version)
git pull origin main
./deploy.sh production

# Emergency stop all services
./deploy.sh stop
```

## 10. Performance Optimization

### Enable Cloudflare optimizations
- Enable "Auto Minify" for HTML, CSS, JS
- Enable "Brotli" compression
- Set browser cache TTL appropriately
- Enable "Development Mode" when testing changes

### VPS optimizations
```bash
# Increase VM limits if needed
echo 'vm.max_map_count=262144' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## Security Checklist

- [ ] Strong passwords for all services
- [ ] JWT secret is cryptographically secure
- [ ] SSH keys are used instead of passwords
- [ ] Firewall is configured (only ports 80, 443, 22 open)
- [ ] Regular security updates are applied
- [ ] MongoDB is not exposed to the internet
- [ ] SSL certificates are valid and auto-renewing
- [ ] Cloudflare security features are enabled
- [ ] Application logs are monitored
- [ ] Regular backups are created and tested

## Support

For issues specific to this deployment:
1. Check the application logs: `./deploy.sh logs`
2. Verify all environment variables are set correctly
3. Ensure all services are running: `./deploy.sh status`
4. Check Cloudflare dashboard for any security blocks