# WP Optimizer Pro v30.0 - Deployment Guide

## Production Deployment

### Prerequisites

- Kubernetes 1.24+
- Docker 20.10+
- Terraform 1.0+
- Kubectl configured

### Docker Build

```bash
docker build -t wp-optimizer-pro:30.0 .
docker tag wp-optimizer-pro:30.0 your-registry/wp-optimizer-pro:30.0
docker push your-registry/wp-optimizer-pro:30.0
```

### Kubernetes Deployment

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

### Infrastructure as Code

```bash
cd terraform/
terraform init
terraform plan -var-file="production.tfvars"
terraform apply -var-file="production.tfvars"
```

## Multi-Region Deployment

### Primary Region (US-East)
```bash
terraform workspace new us-east
terraform apply -var-file="us-east.tfvars"
```

### Secondary Region (EU-West)
```bash
terraform workspace new eu-west
terraform apply -var-file="eu-west.tfvars"
```

## Database Migration

```bash
npm run migrate:latest
npm run seed:production
```

## Health Checks

```bash
kubectl get pods -n wp-optimizer
kubectl logs -f deployment/wp-optimizer-api
kubectl describe pod <pod-name>
```

## Monitoring

### Prometheus Scraping
```
metrics_path: '/metrics'
scrape_interval: 15s
```

### Alert Rules
```bash
kubectl apply -f monitoring/prometheus-rules.yaml
```

## Scaling

### Horizontal Scaling
```bash
kubectl autoscale deployment wp-optimizer-api \
  --min=3 --max=10 --cpu-percent=80
```

## Rollback Procedure

```bash
kubectl rollout history deployment/wp-optimizer-api
kubectl rollout undo deployment/wp-optimizer-api
```

## Troubleshooting

- Check logs: `kubectl logs -f <pod>`
- Port forward: `kubectl port-forward <pod> 3000:3000`
- Shell access: `kubectl exec -it <pod> -- /bin/sh`

**Deployment Guide Version**: 1.0
