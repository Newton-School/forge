# Remote state in S3 with DynamoDB state locking. Partial config — the bucket,
# key, region and lock table are supplied at `terraform init` time via
# -backend-config (the deploy.yml workflow passes them from repo Variables).
#
# One-time bootstrap (the state bucket must exist before the first init):
#   aws s3api create-bucket --bucket forge-tfstate-<acct> --region <region> \
#     --create-bucket-configuration LocationConstraint=<region>
#   aws s3api put-bucket-versioning --bucket forge-tfstate-<acct> \
#     --versioning-configuration Status=Enabled
#   aws dynamodb create-table --table-name forge-tflock \
#     --attribute-definitions AttributeName=LockID,AttributeType=S \
#     --key-schema AttributeName=LockID,KeyType=HASH --billing-mode PAY_PER_REQUEST
#
# For local experimentation you can comment this block out to use local state.
terraform {
  backend "s3" {
    encrypt = true
  }
}
