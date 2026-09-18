import boto3
from botocore.client import Config

from app.core.config import settings


def s3_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.object_storage_endpoint,
        aws_access_key_id=settings.object_storage_access_key,
        aws_secret_access_key=settings.object_storage_secret_key,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",
        use_ssl=settings.object_storage_secure,
    )


def ensure_bucket() -> None:
    client = s3_client()
    buckets = [b["Name"] for b in client.list_buckets().get("Buckets", [])]
    if settings.object_storage_bucket not in buckets:
        client.create_bucket(Bucket=settings.object_storage_bucket)


def put_object(key: str, data: bytes, content_type: str) -> None:
    s3_client().put_object(Bucket=settings.object_storage_bucket, Key=key, Body=data, ContentType=content_type)


def get_object(key: str) -> bytes:
    return s3_client().get_object(Bucket=settings.object_storage_bucket, Key=key)["Body"].read()


def delete_object(key: str) -> None:
    s3_client().delete_object(Bucket=settings.object_storage_bucket, Key=key)
