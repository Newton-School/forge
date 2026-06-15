# Infrastructure — AWS ECS Production Design (Forge)

> **Scope:** Production deployment of the Profile Building Drive Management Platform (Forge) as a split **client (Next.js SSR) + server (Express API)** platform on **AWS ECS Fargate**.
> **Companion docs:** [architecture-v2.md](./architecture-v2.md) (the client/server split that supersedes the Vercel monolith in [architecture.md](./architecture.md)) · [security-rbac.md](./security-rbac.md) (referred to below as **security.md** — auth, RBAC, data isolation) · [integration-setup.md](./integration-setup.md) (GitHub / Discord / Google / Groq credentials).
> **Source-of-truth artifacts:** `infra/terraform/` (IaC), `infra/ecs/` (task-def templates), `infra/aws/` (IAM policy JSON), `docker/` (Dockerfiles + nginx), `.github/workflows/deploy.yml` (CI/CD).

> **App identifier used everywhere in this doc:** `app=forge`. Every ARN, tag, secret prefix, log group, and IAM condition below is bound to this identifier. **This is deliberate** — see §2.

---

## Table of Contents

1. [Architecture topology](#1-architecture-topology)
2. [Account isolation & blast-radius containment](#2-account-isolation--blast-radius-containment-)
3. [VPC & networking](#3-vpc--networking)
4. [ECS cluster (Fargate)](#4-ecs-cluster-fargate)
5. [Task definitions](#5-task-definitions)
6. [ECS services](#6-ecs-services)
7. [Application Load Balancer](#7-application-load-balancer)
8. [Security groups](#8-security-groups-least-privilege)
9. [Secrets Manager](#9-secrets-manager)
10. [IAM](#10-iam)
11. [RDS for PostgreSQL](#11-rds-for-postgresql)
12. [ElastiCache Redis (optional)](#12-elasticache-redis-optional)
13. [ECR](#13-ecr)
14. [CloudWatch](#14-cloudwatch)
15. [Deployment flow](#15-deployment-flow)
16. [Scaling strategy](#16-scaling-strategy)
17. [Environments](#17-environments)
18. [Cost & tagging](#18-cost--tagging)

---

## 1. Architecture topology

```
                              Internet
                                 │
                                 ▼
                    ┌────────────────────────────┐
                    │  Cloudflare                 │  DNS proxy (orange-cloud),
                    │  WAF · DDoS L3/4/7 · TLS    │  bot mgmt, rate limiting
                    └──────────────┬──────────────┘
                                   │  (only Cloudflare egress IPs)
                                   ▼
                    ┌────────────────────────────┐
                    │  Route 53 (apex + ALIAS)    │  forge.example.com → ALB
                    └──────────────┬──────────────┘
                                   ▼
   ══════════════════════ AWS Account (SHARED with other apps) ══════════════════════
   ┌──────────────────────── Dedicated VPC  10.40.0.0/16  (app=forge) ───────────────┐
   │                                                                                  │
   │   PUBLIC subnets (AZ-a, AZ-b)                                                     │
   │   ┌──────────────────────────────────────────────────────────────────────┐      │
   │   │  Application Load Balancer  (internet-facing)                          │      │
   │   │  :443 ACM TLS  ·  :80 → redirect 443  ·  optional AWS WAF              │      │
   │   │  listener rules:   /api/*  → server TG       *  → client TG            │      │
   │   └───────────────┬───────────────────────────────────┬───────────────────┘      │
   │     NAT GW (a)    │                                    │     NAT GW (b)           │
   │                   ▼                                    ▼                          │
   │   PRIVATE-APP subnets (AZ-a, AZ-b)   — assignPublicIp=DISABLED                    │
   │   ┌─────────────────────────────┐      ┌─────────────────────────────┐           │
   │   │ ECS Fargate svc: client     │      │ ECS Fargate svc: server     │           │
   │   │ Next.js SSR  :3000          │◀────▶│ Express API  :4000          │           │
   │   │ TG health GET /healthz      │ Cloud│ TG health GET /api/health   │           │
   │   └─────────────────────────────┘  Map └──────────────┬──────────────┘           │
   │                                                        │ :5432 / :6379            │
   │   PRIVATE-DATA subnets (AZ-a, AZ-b)                    ▼                          │
   │   ┌─────────────────────────────┐      ┌─────────────────────────────┐           │
   │   │ RDS PostgreSQL (Multi-AZ)   │      │ ElastiCache Redis (optional)│           │
   │   │ not publicly accessible     │      │ sessions / cache / jobs     │           │
   │   │ KMS CMK encrypted           │      │                             │           │
   │   └─────────────────────────────┘      └─────────────────────────────┘           │
   │                                                                                  │
   │   Supporting (regional, all scoped app=forge):                                   │
   │   ECR repos · Secrets Manager /forge/* · CloudWatch /ecs/forge/* · KMS CMK       │
   └──────────────────────────────────────────────────────────────────────────────────┘
        ▲ NO peering / NO transit gateway / NO shared SG with any other app's VPC ▲

   External APIs (server egress via NAT only):
   GitHub REST/Webhooks · Discord REST/Bot · Google Calendar · Groq · SES/SMTP
```

### Component inventory

| Component | AWS service | Purpose | Placement | Isolation tag |
|---|---|---|---|---|
| Edge / WAF / DNS | Cloudflare (3rd-party) | DNS proxy, WAF, DDoS, TLS termination at edge | Internet | n/a |
| Authoritative DNS | Route 53 | ALIAS apex → ALB | Account-global | `app=forge` |
| Load balancer | ALB (ELBv2) | TLS, path routing, health checks | Public subnets | `app=forge` |
| Optional WAF | AWS WAFv2 | L7 rules on ALB (defense-in-depth) | Attached to ALB | `app=forge` |
| Container orchestration | ECS Fargate | Run `client` + `server` tasks | Private-app subnets | `app=forge` |
| Image registry | ECR | `forge/client`, `forge/server` | Regional | `app=forge` |
| Database | RDS PostgreSQL | Primary datastore (Prisma) | Private-data subnets | `app=forge` |
| Cache / sessions / jobs | ElastiCache Redis (opt) | Server-side sessions, cache, queue | Private-data subnets | `app=forge` |
| Secrets | Secrets Manager | DB creds, OAuth, tokens, AI keys | Regional `/forge/*` | `app=forge` |
| Encryption | KMS CMK | RDS + Secrets + logs encryption | Regional | `app=forge` |
| Observability | CloudWatch | Logs `/ecs/forge/*`, metrics, alarms | Regional | `app=forge` |
| Networking | VPC, NAT, subnets, RT, NACL | Dedicated, isolated network fabric | `10.40.0.0/16` | `app=forge` |
| CI/CD | GitHub Actions | Build → push → deploy | n/a | n/a |

---

## 2. Account isolation & blast-radius containment ★

> **Forge runs in a SHARED AWS account alongside other, unrelated services.** The number-one design objective is that **a full compromise of Forge cannot reach, read, or affect any other service in the account** — and vice versa. Isolation is not a feature here; it is the architecture.

### 2.1 The principle

> **Zero blast radius.** Every Forge resource lives in a dedicated network and is governed by IAM that can name *only* Forge resources. There is no network path, no IAM grant, and no shared key that lets a Forge credential touch another app's data, or another app's credential touch Forge. Compromise is contained to Forge.

### 2.2 Isolation controls (the full checklist)

| Dimension | Control | Anti-pattern explicitly avoided |
|---|---|---|
| **Network** | Dedicated VPC `10.40.0.0/16` — **NOT** the default VPC, **NOT** shared with any other app | Reusing default VPC or a "platform" VPC |
| **Network reachability** | **No** VPC peering, **no** Transit Gateway attachment, **no** shared VPC, **no** PrivateLink to other apps | Convenience peering "so services can talk" |
| **Compute** | Dedicated ECS cluster `forge-prod` (no other app's tasks) | Multi-tenant shared cluster |
| **Data** | Dedicated RDS instance + dedicated ElastiCache; no shared DB server | Shared "company-db" instance |
| **Registry** | Dedicated ECR repos `forge/*` | Shared monorepo registry path |
| **Firewall** | Dedicated security groups; SG references are by SG-ID **within this VPC only** | Referencing a shared/global SG |
| **NACL** | Deny-by-default subnet NACLs; only required ports allowed | Default allow-all NACL |
| **IAM** | Roles scoped to **resource-level ARNs** + **ABAC** tag conditions; **no** `Resource: "*"` | `Resource: "*"`, account-admin roles |
| **IAM separation** | Separate **task-execution role** vs **task role**, *per service* (4 distinct roles) | One shared role for everything |
| **Secrets** | Namespaced `/forge/*`; IAM `secretsmanager:GetSecretValue` limited to that prefix | Account-wide secrets read |
| **Logs** | Log groups `/ecs/forge/*`; IAM limited to that prefix | `logs:*` on `*` |
| **Encryption** | Dedicated **KMS CMK**; key policy grants **only** Forge roles; used for RDS + Secrets + logs | Shared/AWS-managed key reachable by all |
| **Tagging** | Every resource tagged `app=forge,env=<env>`; ABAC enforces it | Untagged resources |

### 2.3 ABAC — the tag condition pattern

Every Forge IAM policy statement that touches a taggable resource carries a condition binding it to Forge's tag. A leaked Forge credential, replayed against another app's resource, is denied because that resource is not tagged `app=forge`:

```json
{
  "Effect": "Allow",
  "Action": ["secretsmanager:GetSecretValue"],
  "Resource": "arn:aws:secretsmanager:us-east-1:111122223333:secret:/forge/prod/*",
  "Condition": {
    "StringEquals": { "aws:ResourceTag/app": "forge" }
  }
}
```

> **Rule enforced in review:** any policy under `infra/aws/` containing `"Resource": "*"` or lacking an `aws:ResourceTag/app=forge` condition (where the action supports it) **fails CI**. See [security-rbac.md](./security-rbac.md) for the application-layer counterpart (RBAC × Scope).

### 2.4 KMS CMK key policy (only Forge roles)

```json
{
  "Version": "2012-10-17",
  "Id": "forge-cmk",
  "Statement": [
    {
      "Sid": "RootKeyAdmin",
      "Effect": "Allow",
      "Principal": { "AWS": "arn:aws:iam::111122223333:root" },
      "Action": ["kms:Create*","kms:Describe*","kms:List*","kms:Put*","kms:Update*","kms:Revoke*","kms:Disable*","kms:Enable*","kms:ScheduleKeyDeletion","kms:CancelKeyDeletion"],
      "Resource": "*"
    },
    {
      "Sid": "PbdmpUseOnly",
      "Effect": "Allow",
      "Principal": {
        "AWS": [
          "arn:aws:iam::111122223333:role/forge-prod-server-task",
          "arn:aws:iam::111122223333:role/forge-prod-exec",
          "arn:aws:iam::111122223333:role/forge-prod-rds-monitoring"
        ]
      },
      "Action": ["kms:Decrypt","kms:GenerateDataKey","kms:DescribeKey"],
      "Resource": "*"
    }
  ]
}
```

No other app's role is a principal. RDS storage, Secrets Manager secrets, and CloudWatch log groups for Forge all reference this CMK — a non-Forge principal cannot decrypt them.

---

## 3. VPC & networking

Dedicated VPC, 2 AZs, three subnet tiers. CIDR chosen to **not collide** with other apps in the account (verify against the account's IPAM / existing VPC CIDRs before applying — other apps commonly sit in `10.0.0.0/16` or `172.31.0.0/16`).

### CIDR plan (example — `10.40.0.0/16`)

| Tier | AZ-a | AZ-b | Route | Public IP |
|---|---|---|---|---|
| **public** (ALB, NAT GW) | `10.40.0.0/24` | `10.40.1.0/24` | → IGW | yes (ALB/NAT only) |
| **private-app** (ECS tasks) | `10.40.10.0/24` | `10.40.11.0/24` | → NAT GW | **no** |
| **private-data** (RDS, Redis) | `10.40.20.0/24` | `10.40.21.0/24` | local only (+ NAT optional) | **no** |

```
                    ┌──────────── VPC 10.40.0.0/16 ────────────┐
  Internet ── IGW ──┤  public  10.40.0.0/24  10.40.1.0/24      │  RT-public:  0.0.0.0/0 → IGW
                    │     (ALB, NAT-a, NAT-b)                   │
                    │  private-app 10.40.10.0/24 .11.0/24       │  RT-app-a:   0.0.0.0/0 → NAT-a
                    │     (ECS client + server tasks)           │  RT-app-b:   0.0.0.0/0 → NAT-b
                    │  private-data 10.40.20.0/24 .21.0/24      │  RT-data:    local only
                    │     (RDS Multi-AZ, ElastiCache)           │  (+ NAT for patching if needed)
                    └──────────────────────────────────────────┘
```

- **NAT:** one NAT gateway per AZ (HA; avoids cross-AZ NAT charges and single-AZ failure). Private-app tasks egress to ECR, Secrets Manager, external integration APIs through NAT. *(Cost-down option for non-prod: single NAT GW.)*
- **VPC endpoints (recommended):** Interface endpoints for `ecr.api`, `ecr.dkr`, `secretsmanager`, `logs`, `kms`, `sts` + a Gateway endpoint for `s3`. Keeps ECR pulls / secret fetches / logging **on the AWS backbone**, reduces NAT cost, and shrinks the egress surface — reinforcing isolation.
- **NACLs (deny-by-default):** private-data subnet NACL allows inbound `5432`/`6379` only from private-app CIDRs and ephemeral return traffic; denies everything else. Public subnet NACL allows `80`/`443` in, ephemeral out.
- IaC: `infra/terraform/network.tf`.

---

## 4. ECS cluster (Fargate)

- **Cluster:** `forge-prod` — dedicated; runs *only* Forge tasks. No other app may register tasks here.
- **Launch type:** Fargate (no EC2 to patch — smaller blast surface, no shared host kernel with other apps).
- **Capacity providers:** `FARGATE` (baseline) + `FARGATE_SPOT` (optional for non-critical/non-prod). Prod default capacity-provider strategy weights `FARGATE` for stability; Spot only for the `client` SSR tier if interruption-tolerant.
- **Platform version:** `LATEST` (pinned in IaC; currently `1.4.0`) for ENI trunking + EFS support.
- **Container Insights:** enabled (see §14).

```bash
aws ecs create-cluster \
  --cluster-name forge-prod \
  --capacity-providers FARGATE FARGATE_SPOT \
  --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1,base=2 \
  --settings name=containerInsights,value=enabled \
  --tags key=app,value=forge key=env,value=prod
```

---

## 5. Task definitions

Two families: `forge-prod-client` and `forge-prod-server`. Both `networkMode=awsvpc`, Fargate. Templates live in **`infra/ecs/`** (`client.taskdef.json`, `server.taskdef.json`) and are rendered at deploy time by `.github/workflows/deploy.yml` (image tag injected).

**Two roles per task:**
- `executionRoleArn` — used by the ECS agent to **pull the image, fetch the secrets, write logs** (infra-plane).
- `taskRoleArn` — assumed by the **running container** for AWS API calls it makes (app-plane). Server and client get *different* task roles (server needs SES + secrets; client needs almost nothing).

### 5.1 server task definition (`infra/ecs/server.taskdef.json`)

```json
{
  "family": "forge-prod-server",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "runtimePlatform": { "cpuArchitecture": "ARM64", "operatingSystemFamily": "LINUX" },
  "executionRoleArn": "arn:aws:iam::111122223333:role/forge-prod-exec",
  "taskRoleArn": "arn:aws:iam::111122223333:role/forge-prod-server-task",
  "containerDefinitions": [
    {
      "name": "server",
      "image": "111122223333.dkr.ecr.us-east-1.amazonaws.com/forge/server:GIT_SHA",
      "essential": true,
      "portMappings": [{ "containerPort": 4000, "protocol": "tcp" }],
      "environment": [
        { "name": "NODE_ENV", "value": "production" },
        { "name": "PORT", "value": "4000" },
        { "name": "APP_BASE_URL", "value": "https://forge.example.com" }
      ],
      "secrets": [
        { "name": "DATABASE_URL",         "valueFrom": "arn:aws:secretsmanager:us-east-1:111122223333:secret:/forge/prod/database-url" },
        { "name": "DIRECT_URL",           "valueFrom": "arn:aws:secretsmanager:us-east-1:111122223333:secret:/forge/prod/database-direct-url" },
        { "name": "SESSION_SECRET",       "valueFrom": "arn:aws:secretsmanager:us-east-1:111122223333:secret:/forge/prod/session-secret" },
        { "name": "GITHUB_CLIENT_SECRET", "valueFrom": "arn:aws:secretsmanager:us-east-1:111122223333:secret:/forge/prod/github-client-secret" },
        { "name": "GITHUB_WEBHOOK_SECRET","valueFrom": "arn:aws:secretsmanager:us-east-1:111122223333:secret:/forge/prod/github-webhook-secret" },
        { "name": "DISCORD_BOT_TOKEN",    "valueFrom": "arn:aws:secretsmanager:us-east-1:111122223333:secret:/forge/prod/discord-bot-token" },
        { "name": "GOOGLE_CLIENT_SECRET", "valueFrom": "arn:aws:secretsmanager:us-east-1:111122223333:secret:/forge/prod/google-client-secret" },
        { "name": "GROQ_API_KEY",         "valueFrom": "arn:aws:secretsmanager:us-east-1:111122223333:secret:/forge/prod/groq-api-key" },
        { "name": "REDIS_URL",            "valueFrom": "arn:aws:secretsmanager:us-east-1:111122223333:secret:/forge/prod/redis-url" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/forge/prod/server",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "server"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "wget -qO- http://localhost:4000/api/health || exit 1"],
        "interval": 30, "timeout": 5, "retries": 3, "startPeriod": 30
      }
    }
  ],
  "tags": [{ "key": "app", "value": "forge" }, { "key": "env", "value": "prod" }]
}
```

### 5.2 client task definition (`infra/ecs/client.taskdef.json`)

Same shape; key differences below (full file in `infra/ecs/`):

```json
{
  "family": "forge-prod-client",
  "cpu": "512", "memory": "1024",
  "executionRoleArn": "arn:aws:iam::111122223333:role/forge-prod-exec",
  "taskRoleArn": "arn:aws:iam::111122223333:role/forge-prod-client-task",
  "containerDefinitions": [
    {
      "name": "client",
      "image": "111122223333.dkr.ecr.us-east-1.amazonaws.com/forge/client:GIT_SHA",
      "portMappings": [{ "containerPort": 3000, "protocol": "tcp" }],
      "environment": [
        { "name": "NODE_ENV", "value": "production" },
        { "name": "PORT", "value": "3000" },
        { "name": "NEXT_PUBLIC_API_BASE", "value": "https://forge.example.com/api" },
        { "name": "INTERNAL_API_BASE", "value": "http://server.forge.internal:4000" }
      ],
      "secrets": [
        { "name": "NEXTAUTH_SECRET", "valueFrom": "arn:aws:secretsmanager:us-east-1:111122223333:secret:/forge/prod/nextauth-secret" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/forge/prod/client",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "client"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "wget -qO- http://localhost:3000/healthz || exit 1"],
        "interval": 30, "timeout": 5, "retries": 3, "startPeriod": 45
      }
    }
  ],
  "tags": [{ "key": "app", "value": "forge" }, { "key": "env", "value": "prod" }]
}
```

> The Next.js client SSR can reach the server **either** through the ALB (`NEXT_PUBLIC_API_BASE`, public path) **or** internally via Cloud Map (`INTERNAL_API_BASE`, `server.forge.internal`) to skip the public hop for server-to-server SSR fetches. Dockerfiles: `docker/client.Dockerfile`, `docker/server.Dockerfile` (multi-stage, distroless/`node:slim` runtime, non-root user).

---

## 6. ECS services

Two services in cluster `forge-prod`, both in **private-app subnets**, `assignPublicIp=DISABLED`, each wired to its ALB target group.

| Setting | client | server |
|---|---|---|
| Desired count (prod) | 2 | 2 |
| Subnets | private-app a/b | private-app a/b |
| `assignPublicIp` | **DISABLED** | **DISABLED** |
| Security group | `forge-prod-client-sg` | `forge-prod-server-sg` |
| Target group | `forge-client-tg` :3000 | `forge-server-tg` :4000 |
| Deployment controller | ECS rolling | ECS rolling |
| Circuit breaker | enabled + **rollback** | enabled + **rollback** |
| Min / max healthy % | 100 / 200 | 100 / 200 |
| Cloud Map | (consumer) | `server.forge.internal` |

### 6.1 Deployment configuration (rolling + circuit breaker)

```bash
aws ecs create-service \
  --cluster forge-prod --service-name forge-prod-server \
  --task-definition forge-prod-server \
  --desired-count 2 --launch-type FARGATE --platform-version 1.4.0 \
  --deployment-configuration '{
      "maximumPercent": 200, "minimumHealthyPercent": 100,
      "deploymentCircuitBreaker": { "enable": true, "rollback": true }
  }' \
  --network-configuration '{ "awsvpcConfiguration": {
      "subnets": ["subnet-app-a","subnet-app-b"],
      "securityGroups": ["sg-forge-prod-server"],
      "assignPublicIp": "DISABLED" } }' \
  --load-balancers '[{ "targetGroupArn":"arn:...:targetgroup/forge-server-tg/...",
      "containerName":"server", "containerPort":4000 }]' \
  --health-check-grace-period-seconds 60 \
  --service-registries '[{ "registryArn":"arn:...:service/srv-server" }]' \
  --tags key=app,value=forge key=env,value=prod
```

> **Circuit breaker** auto-rolls-back a deploy that cannot stabilize (tasks fail health checks) — bad images never replace a healthy fleet. **Blue/green alternative:** CodeDeploy `ECSDeploymentGroup` with two TGs per service and traffic shifting (`Canary10Percent5Minutes`) for zero-downtime cutover + instant rollback; switchable in `infra/terraform/ecs_services.tf`.

### 6.2 Service auto-scaling (target tracking)

```bash
# register both services as scalable targets (min 2, max 10)
aws application-autoscaling register-scalable-target \
  --service-namespace ecs --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/forge-prod/forge-prod-server --min-capacity 2 --max-capacity 10

# CPU target tracking 60%
aws application-autoscaling put-scaling-policy \
  --policy-name forge-server-cpu --policy-type TargetTrackingScaling \
  --service-namespace ecs --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/forge-prod/forge-prod-server \
  --target-tracking-scaling-policy-configuration '{
     "TargetValue": 60.0,
     "PredefinedMetricSpecification": { "PredefinedMetricType": "ECSServiceAverageCPUUtilization" },
     "ScaleInCooldown": 120, "ScaleOutCooldown": 60 }'

# ALB request-count target tracking (1000 req/target)
aws application-autoscaling put-scaling-policy \
  --policy-name forge-server-rcpt --policy-type TargetTrackingScaling \
  --service-namespace ecs --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/forge-prod/forge-prod-server \
  --target-tracking-scaling-policy-configuration '{
     "TargetValue": 1000.0,
     "PredefinedMetricSpecification": {
        "PredefinedMetricType": "ALBRequestCountPerTarget",
        "ResourceLabel": "app/forge-alb/abc.../targetgroup/forge-server-tg/def..." },
     "ScaleInCooldown": 120, "ScaleOutCooldown": 60 }'
```

- **Service discovery (Cloud Map):** namespace `forge.internal` (private DNS in this VPC only). `server` registers `server.forge.internal`; the client's SSR layer resolves it for internal calls. The namespace is private to Forge's VPC — not resolvable from other apps.

---

## 7. Application Load Balancer

Internet-facing ALB in public subnets. Single ALB, two listeners, two target groups.

```
Listener :80   →  redirect HTTP_301 to :443 (same host/path/query)
Listener :443  →  ACM cert (forge.example.com), TLS policy ELBSecurityPolicy-TLS13-1-2-2021-06
                  rules (in order):
                    1. path-pattern  /api/*   → forward forge-server-tg
                    2. default        *       → forward forge-client-tg
```

| Target group | Port | Protocol | Health check | Healthy/Unhealthy | Deregistration delay |
|---|---|---|---|---|---|
| `forge-client-tg` | 3000 | HTTP (target-type `ip`) | `GET /healthz` (200) | 2 / 3 | 30s |
| `forge-server-tg` | 4000 | HTTP (target-type `ip`) | `GET /api/health` (200) | 2 / 3 | 30s |

```bash
aws elbv2 create-rule --listener-arn $L443 --priority 10 \
  --conditions '[{"Field":"path-pattern","Values":["/api/*"]}]' \
  --actions     '[{"Type":"forward","TargetGroupArn":"'$SERVER_TG'"}]'
# default action on the listener forwards to client TG
```

- **Stickiness:** **off**. Sessions are server-side (JWT cookie validated per request, or Redis-backed — see security-rbac.md §1) so any task can serve any request.
- **Idle timeout:** 60s (raise toward 120s if long SSE/streaming AI responses from Groq are proxied).
- **Access logs:** enabled → S3 `s3://forge-prod-alb-logs/` (bucket policy restricted, SSE-KMS with the Forge CMK, lifecycle to Glacier at 90d).
- **Optional AWS WAFv2** web ACL on the ALB: AWS managed rule groups (Common, KnownBadInputs, SQLi) + rate-based rule. Defense-in-depth *behind* Cloudflare; Cloudflare is the primary L7 filter.

---

## 8. Security groups (least privilege)

Strict, SG-to-SG references (by SG-ID, all within Forge's VPC). **No `0.0.0.0/0` ingress anywhere except ALB:443, and that is restricted to Cloudflare's published IP ranges.**

| SG | Direction | Port | Source / Dest | Notes |
|---|---|---|---|---|
| **forge-prod-alb-sg** | ingress | 443 | **Cloudflare IPv4/IPv6 ranges** | NOT `0.0.0.0/0` — only Cloudflare edge |
| | ingress | 80 | Cloudflare ranges | for the 80→443 redirect |
| | egress | 3000 | → client-sg | to client tasks |
| | egress | 4000 | → server-sg | to server tasks |
| **forge-prod-client-sg** | ingress | 3000 | **alb-sg only** | no other source |
| | egress | 443 | → 0.0.0.0/0 (NAT) | outbound (ECR/secrets via endpoints) |
| **forge-prod-server-sg** | ingress | 4000 | **alb-sg only** | (+ client-sg if Cloud Map internal calls used) |
| | egress | 5432 | → rds-sg | DB |
| | egress | 6379 | → redis-sg | cache/sessions |
| | egress | 443 | → 0.0.0.0/0 (NAT) | GitHub/Discord/Google/Groq/SES |
| **forge-prod-rds-sg** | ingress | 5432 | **server-sg only** | nothing else reaches the DB |
| | egress | — | none | (default deny-out or minimal) |
| **forge-prod-redis-sg** | ingress | 6379 | **server-sg only** | sessions/cache/jobs |

> Cloudflare IP ranges are maintained as a managed prefix list (`forge-cloudflare-ipv4/ipv6`) and refreshed by a small scheduled Lambda so the ALB ingress stays current. This makes "only Cloudflare can reach the ALB" enforceable, preventing direct-to-origin attacks that bypass the WAF. Defined in `infra/terraform/security_groups.tf`.

---

## 9. Secrets Manager

All secrets namespaced under `/forge/<env>/*`. IAM (see §10) limits read to that exact prefix — no Forge role can read another app's secrets, and no other app's role can read `/forge/*`.

| Secret (`/forge/prod/...`) | Contents | Consumer | Rotation |
|---|---|---|---|
| `database-url` | pooled Postgres URL (PgBouncer/RDS Proxy) | server | via RDS-managed rotation Lambda |
| `database-direct-url` | direct URL (Prisma migrations) | CI / migrate task | with above |
| `session-secret` / `nextauth-secret` | session/JWT signing keys | server / client | manual, 90d, dual-key overlap |
| `github-client-secret` | GitHub OAuth App secret | server | manual (provider-bound) |
| `github-webhook-secret` | HMAC for `X-Hub-Signature-256` | server | manual |
| `github-app-private-key` | GitHub App PEM (if App used) | server | manual |
| `discord-bot-token` | Discord bot token (highly sensitive) | server | manual |
| `discord-client-secret` / `discord-public-key` | Discord OAuth / Ed25519 verify | server | manual |
| `google-client-secret` | Google OAuth (Calendar) | server | manual |
| `groq-api-key` | Groq AI inference key | server | manual |
| `redis-url` | ElastiCache connection (with auth token) | server | with Redis auth rotation |
| `smtp-credentials` / SES | outbound email creds | server | manual / IAM-based for SES |

- **Injection:** task-def `secrets[]` (§5) maps each ARN to an env var; the **execution role** fetches at task start (decrypted via the Forge CMK) — secrets never sit in the image, repo, or task-def plaintext.
- **Rotation:** DB credentials use Secrets Manager managed rotation (Lambda in Forge's VPC + rds-sg). Provider-bound secrets (OAuth/bot tokens) rotate manually with brief dual-validity windows.
- Secret env-var names mirror `.env.example` and [integration-setup.md](./integration-setup.md) so app code is unchanged between local and ECS.

```bash
aws secretsmanager create-secret \
  --name /forge/prod/groq-api-key --secret-string '{"GROQ_API_KEY":"gsk_..."}' \
  --kms-key-id arn:aws:kms:us-east-1:111122223333:key/Forge-CMK \
  --tags Key=app,Value=forge Key=env,Value=prod
```

---

## 10. IAM

Four roles, all least-privilege, **resource-level ARNs + tag conditions, zero wildcards on `Resource`**. JSON policies live in **`infra/aws/`**.

| Role | Type | Grants (scoped) |
|---|---|---|
| `forge-prod-exec` | task-execution (shared by both services) | pull `forge/*` ECR, read `/forge/prod/*` secrets, `kms:Decrypt` Forge CMK, write `/ecs/forge/*` logs |
| `forge-prod-server-task` | task role — server | read `/forge/prod/*` secrets, `ses:SendEmail` (from-domain restricted), CloudWatch PutMetric (namespace `Forge`) |
| `forge-prod-client-task` | task role — client | minimal (read `/forge/prod/nextauth-secret` only; metrics) |
| `forge-prod-rds-monitoring` | RDS enhanced monitoring | service-linked, scoped |

### 10.1 Execution role policy (`infra/aws/exec-role.policy.json`)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EcrPullPbdmpOnly",
      "Effect": "Allow",
      "Action": ["ecr:GetDownloadUrlForLayer","ecr:BatchGetImage","ecr:BatchCheckLayerAvailability"],
      "Resource": [
        "arn:aws:ecr:us-east-1:111122223333:repository/forge/client",
        "arn:aws:ecr:us-east-1:111122223333:repository/forge/server"
      ]
    },
    { "Sid": "EcrAuth", "Effect": "Allow", "Action": ["ecr:GetAuthorizationToken"], "Resource": "*" },
    {
      "Sid": "ReadPbdmpSecretsOnly",
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": "arn:aws:secretsmanager:us-east-1:111122223333:secret:/forge/prod/*",
      "Condition": { "StringEquals": { "aws:ResourceTag/app": "forge" } }
    },
    {
      "Sid": "DecryptWithPbdmpCmk",
      "Effect": "Allow",
      "Action": ["kms:Decrypt"],
      "Resource": "arn:aws:kms:us-east-1:111122223333:key/Forge-CMK"
    },
    {
      "Sid": "WritePbdmpLogsOnly",
      "Effect": "Allow",
      "Action": ["logs:CreateLogStream","logs:PutLogEvents"],
      "Resource": "arn:aws:logs:us-east-1:111122223333:log-group:/ecs/forge/*:*"
    }
  ]
}
```

> `ecr:GetAuthorizationToken` is the one action AWS requires on `Resource: "*"` (it returns an account-scoped token, grants no data access) — every data-bearing action is ARN-scoped. The server task role's `ses:SendEmail` is conditioned on `ses:FromAddress` matching the Forge sending domain. Reviewed against the §2.3 rule in CI.

---

## 11. RDS for PostgreSQL

Dedicated instance — **not** shared with any other app.

| Setting | Value |
|---|---|
| Engine | PostgreSQL 16.x |
| Deployment | **Multi-AZ** (prod) — synchronous standby in AZ-b |
| Instance class | start `db.r6g.large` (Graviton); right-size from CloudWatch. Non-prod `db.t4g.medium` |
| Storage | gp3, autoscaling enabled, **encrypted with Forge CMK** |
| DB subnet group | **private-data** subnets only |
| Publicly accessible | **NO** |
| Parameter group | custom: `rds.force_ssl=1` (TLS required), tuned `max_connections`, `log_min_duration_statement` |
| Backups | automated, 7–35 day retention, **PITR** enabled |
| Snapshots | manual pre-migration snapshots (in deploy pipeline); copied/encrypted with CMK |
| Read replica | add when read-heavy (analytics/rollup reads) — see [architecture.md §9](./architecture.md) |
| Connection pooling | **RDS Proxy** (or PgBouncer sidecar) — Fargate scale-out multiplies connections; pool to protect `max_connections` |
| Deletion protection | enabled (prod) |

- Reachable only from `forge-prod-server-sg` on 5432 (§8). Schema/migrations via Prisma (`DIRECT_URL`) run as a one-off ECS migrate task in the pipeline, not from the long-running service.
- IaC: `infra/terraform/rds.tf`.

---

## 12. ElastiCache Redis (optional)

Enable when moving from stateless JWT-only to server-side sessions / shared cache / a job queue (the natural evolution off the Vercel monolith — see [architecture.md §1.2](./architecture.md) and [security-rbac.md §1](./security-rbac.md)).

| Setting | Value |
|---|---|
| Engine | Redis 7.x (cluster-mode off to start; on for shard scale) |
| Placement | **private-data** subnets, Multi-AZ with automatic failover |
| Security group | `forge-prod-redis-sg`, ingress 6379 **from server-sg only** |
| Encryption | at-rest (CMK) + in-transit TLS; **AUTH token** required |
| Use | sessions, response/cache, BullMQ-style job queue for webhook/sync work |

---

## 13. ECR

One repo per app, both under the `forge/` prefix; nothing else may push here (repo policy scoped to Forge CI role + exec role).

| Repo | Scan-on-push | Tag mutability | Lifecycle |
|---|---|---|---|
| `forge/client` | enabled | **IMMUTABLE** | keep last 20 tagged; expire untagged > 7d |
| `forge/server` | enabled | **IMMUTABLE** | keep last 20 tagged; expire untagged > 7d |

```bash
aws ecr create-repository --repository-name forge/server \
  --image-scanning-configuration scanOnPush=true \
  --image-tag-mutability IMMUTABLE \
  --encryption-configuration encryptionType=KMS,kmsKey=arn:aws:kms:...:key/Forge-CMK \
  --tags Key=app,Value=forge Key=env,Value=prod
```

- **Immutable tags** = a deployed `:GIT_SHA` can never be silently overwritten (supply-chain integrity + reliable rollback). CI fails the pipeline on HIGH/CRITICAL scan findings.

---

## 14. CloudWatch

- **Log groups (namespaced, CMK-encrypted, retention 30–90d):** `/ecs/forge/prod/client`, `/ecs/forge/prod/server`, `/ecs/forge/prod/migrate`, plus `/aws/rds/.../forge-prod`.
- **Container Insights:** enabled on `forge-prod` for per-task CPU/mem/network.
- **Metrics namespace:** `Forge` (app-emitted) + AWS/ECS, AWS/ApplicationELB, AWS/RDS.

### Alarms

| Alarm | Metric | Threshold |
|---|---|---|
| Service CPU high | ECS `CPUUtilization` (per service) | > 75% for 5m |
| Service memory high | ECS `MemoryUtilization` | > 80% for 5m |
| ALB 5xx | `HTTPCode_Target_5XX_Count` | > 1% of requests / 5m |
| Unhealthy hosts | `UnHealthyHostCount` (per TG) | ≥ 1 for 3m |
| ALB latency | `TargetResponseTime` p99 | > 2s for 5m |
| RDS connections | `DatabaseConnections` | > 80% of `max_connections` |
| RDS CPU | `CPUUtilization` | > 80% for 10m |
| RDS storage | `FreeStorageSpace` | < 15% |
| RDS replica lag | `ReplicaLag` | > 30s |

Alarms → SNS `forge-prod-alerts` → PagerDuty/Slack. A **CloudWatch dashboard** `forge-prod` panels request rate, 5xx, latency, ECS task counts, RDS metrics. IaC: `infra/terraform/observability.tf`.

---

## 15. Deployment flow

CI/CD: **GitHub Actions** (`.github/workflows/deploy.yml`), OIDC into a least-privilege deploy role (no static keys).

```
push to main / tag
   │
   ├─ build client image  ──┐
   ├─ build server image  ──┤  docker buildx (ARM64), from docker/*.Dockerfile
   │                        ▼
   ├─ trivy scan ──── fail on HIGH/CRITICAL
   │
   ├─ push :GIT_SHA → ECR  (forge/client, forge/server)
   │
   ├─ run DB migrate task  (one-off ECS RunTask, DIRECT_URL) + pre-deploy snapshot
   │
   ├─ render task defs  (aws-actions/amazon-ecs-render-task-definition, inject :GIT_SHA
   │                     into infra/ecs/*.taskdef.json)
   │
   ├─ aws ecs update-service --force-new-deployment   (or CodeDeploy blue/green)
   │
   ├─ health-checked rollout  (ALB TG health + ECS deployment circuit breaker)
   │
   └─ circuit breaker trips ⇒ AUTOMATIC ROLLBACK to last stable task-def revision
```

```yaml
# .github/workflows/deploy.yml (excerpt)
- uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::111122223333:role/forge-prod-deploy   # OIDC, scoped
    aws-region: us-east-1
- uses: aws-actions/amazon-ecs-render-task-definition@v1
  with:
    task-definition: infra/ecs/server.taskdef.json
    container-name: server
    image: 111122223333.dkr.ecr.us-east-1.amazonaws.com/forge/server:${{ github.sha }}
- uses: aws-actions/amazon-ecs-deploy-task-definition@v2
  with:
    task-definition: ${{ steps.render-server.outputs.task-definition }}
    service: forge-prod-server
    cluster: forge-prod
    wait-for-service-stability: true
```

- The deploy role can act **only** on `forge-prod` cluster / `forge/*` ECR / `forge-prod-*` services (ARN-scoped + tag-conditioned) — CI itself cannot touch other apps.

---

## 16. Scaling strategy

| Layer | Mechanism |
|---|---|
| **ECS services** | Target-tracking auto-scaling on CPU 60% **and** ALB `RequestCountPerTarget` 1000 (§6.2); min 2 / max 10 per service, multi-AZ task spread |
| **ALB** | Scales automatically; one ALB fronts both TGs |
| **RDS** | Vertical (instance class) first; **read replicas** for read-heavy analytics; **RDS Proxy** pooling so task scale-out doesn't exhaust connections; storage autoscaling |
| **Redis** | Replicas for read scale; cluster-mode shards for capacity; offloads sessions/cache/hot reads from RDS |
| **Static/SSR** | client tier scales independently of server; CDN/static caching at Cloudflare edge |

---

## 17. Environments

Strict separation; **prod is fully isolated** from dev/staging.

| Env | Compute | Network | Secrets | Notes |
|---|---|---|---|---|
| **dev** | local `docker-compose` (`docker/`) | localhost | `.env` (see `.env.example`) | no AWS; mirrors container/env layout |
| **staging** | ECS cluster `forge-staging` | **separate VPC** `10.41.0.0/16` | `/forge/staging/*` | single-AZ RDS, single NAT (cost) |
| **prod** | ECS cluster `forge-prod` | VPC `10.40.0.0/16` | `/forge/prod/*` | Multi-AZ, NAT/AZ, deletion protection |

- **Separate clusters + separate VPCs + separate secret prefixes + separate KMS CMKs** per env — staging cannot reach prod data; a staging compromise cannot pivot to prod (same zero-blast-radius principle as §2, applied between Forge's own environments).
- Same Terraform modules, different `*.tfvars` per env (`infra/terraform/env/{staging,prod}.tfvars`).

---

## 18. Cost & tagging

**Mandatory tags on every resource:** `app=forge`, `env=<dev|staging|prod>`, `owner=<team>`, `cost-center=<code>`, `managed-by=terraform`. Tags drive **ABAC** (§2.3), **cost allocation** (per-app billing on the shared account), and **inventory/cleanup**.

| Driver | Lever |
|---|---|
| Fargate | ARM64/Graviton tasks; FARGATE_SPOT for non-critical/non-prod; right-size CPU/mem from Container Insights |
| NAT | VPC interface endpoints (ECR/Secrets/Logs/KMS) cut NAT data-processing; single NAT in non-prod |
| RDS | Graviton instances; reserved instances for steady prod; gp3 storage autoscaling |
| Logs / S3 | 30–90d retention; ALB-log lifecycle to Glacier |
| Visibility | activate `app`/`env` as **cost allocation tags** → per-app, per-env spend reports on the shared account |

---

### Cross-reference index

| Topic | Doc / path |
|---|---|
| Client/server split, module map | [architecture-v2.md](./architecture-v2.md), [architecture.md](./architecture.md) |
| Auth, RBAC×Scope, sessions, app-layer isolation | [security-rbac.md](./security-rbac.md) (security.md) |
| Provider credentials (GitHub/Discord/Google/Groq) | [integration-setup.md](./integration-setup.md) |
| IaC (VPC, ECS, RDS, IAM, observability) | `infra/terraform/` |
| ECS task-def templates | `infra/ecs/` |
| IAM policy JSON | `infra/aws/` |
| Dockerfiles, nginx | `docker/` |
| CI/CD pipeline | `.github/workflows/deploy.yml` |
