# infra/

Infrastructure-as-design for the AWS ECS deployment. Full rationale in [`../docs/infra-ecs.md`](../docs/infra-ecs.md).

```
infra/
├── ecs/
│   ├── task-def.server.json     # Fargate task def — Express API (secrets from Secrets Manager)
│   └── task-def.client.json     # Fargate task def — Next.js SSR (no secrets)
├── aws/
│   ├── iam-ecs-execution-role.json   # pull ECR + inject secrets + logs (scoped)
│   └── iam-server-task-role.json     # app runtime perms (scoped: secrets /forge/*, app KMS, SES)
└── terraform/                   # (placeholder) VPC, ECS, ALB, RDS, SGs, Secrets, KMS as code
```

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
