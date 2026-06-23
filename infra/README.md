# infra/

Infrastructure for the AWS ECS deployment. Full rationale in [`../docs/infra-ecs.md`](../docs/infra-ecs.md); step-by-step runbook in [`../docs/aws/index.html`](../docs/aws/index.html).

```
infra/
├── ecs/
│   ├── task-def.server.json     # Fargate task def — used by CI (deploy.yml) for rollouts
│   └── task-def.client.json     # Fargate task def — Next.js SSR (no secrets)
├── aws/
│   ├── iam-ecs-execution-role.json   # reference copy of the scoped execution policy
│   └── iam-server-task-role.json     # reference copy of the scoped task policy
└── terraform/                   # REAL production IaC (terraform validate ✓) — VPC, NAT, SGs,
                                 # KMS, RDS, Redis, ECR, Secrets, IAM (+ GitHub OIDC deploy role),
                                 # ACM+Cloudflare, ALB path routing, ECS cluster/services,
                                 # CloudWatch alarms + SNS email alerts, CloudTrail (AWS-API audit),
                                 # and bootstrap/ (S3+DynamoDB state). See terraform/README.md.
```

> The `ecs/*.json` and `aws/*.json` files are the **CI deployment artifacts + reference policies**. The authoritative provisioning is now **`terraform/`** — it defines the same roles/task shells natively (no placeholders), and the ECS services `ignore_changes` on the task definition so CI owns rollouts while Terraform owns the infra.

## Placeholders to fill
`<ACCOUNT_ID>` · `<REGION>` · `<ENV>` (staging|prod) · `<IMAGE_TAG>` · `<FORGE_CMK_ID>` · `<your-domain>`

## Account-isolation guarantees (shared AWS account)
This platform runs in an account that **also hosts other unrelated services**. Everything here is built so a compromise of this app has **zero blast radius** into them:
- **Dedicated** VPC, ECS cluster, RDS, ECR repos, security groups — nothing shared/reused.
- **IAM scoped to this app only** — resource ARNs + `aws:ResourceTag/app = forge` conditions, **no `Resource: "*"`** (except `ecr:GetAuthorizationToken`, which AWS does not allow to be scoped).
- **Secrets** namespaced `/forge/<env>/*`; **logs** `/ecs/forge/*`; **KMS** a dedicated CMK whose key policy admits only this app's roles.
- **No VPC peering / transit** to other apps; RDS private + not publicly accessible; tasks in private subnets.
- Every resource **tagged** `app=forge,env=<env>`.

Provisioning order and exact security-group / IAM rules: see [`../docs/infra-ecs.md`](../docs/infra-ecs.md).
