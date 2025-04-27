import boto3
import urllib.parse
import os
from datetime import datetime
import json
import requests
from requests.auth import HTTPBasicAuth

s3 = boto3.client('s3')
rekognition = boto3.client('rekognition')

OPENSEARCH_HOST = os.environ['OPENSEARCH_HOST']
OPENSEARCH_USERNAME = os.environ['OPENSEARCH_USERNAME']
OPENSEARCH_PASSWORD = os.environ['OPENSEARCH_PASSWORD']
INDEX = 'photos'

def lambda_handler(event, context):
    print("region = ", os.environ['AWS_REGION'])
    print(event)
    print("something")
    for record in event['Records']:
        bucket = record['s3']['bucket']['name']
        key = urllib.parse.unquote_plus(record['s3']['object']['key'])

        print(f"Processing {key} in {bucket}")

        # Step 1: Detect labels
        rekog_response = rekognition.detect_labels(
            Image={'S3Object': {'Bucket': bucket, 'Name': key}},
            MaxLabels=10
        )
        rekog_labels = [label['Name'].lower() for label in rekog_response['Labels']]

        print("rekog_labels = ", rekog_labels)

        # Step 2: Retrieve custom labels from S3 metadata
        s3_head = s3.head_object(Bucket=bucket, Key=key)
        custom_labels_raw = s3_head['Metadata'].get('customlabels', '')
        custom_labels = [label.strip().lower() for label in custom_labels_raw.split(',')] if custom_labels_raw else []

        print("custom_labels = ", custom_labels)

        # Combine labels
        all_labels = list(set(rekog_labels + custom_labels))

        print("all_labels = ", all_labels)

        # Step 3: Prepare JSON document
        document = {
            'objectKey': key,
            'bucket': bucket,
            'createdTimestamp': s3_head['LastModified'].isoformat(),
            'labels': all_labels
        }

        # Step 4: Index to OpenSearch using requests
        url = f"https://{OPENSEARCH_HOST}/{INDEX}/_doc/{urllib.parse.quote_plus(key)}"
        headers = {"Content-Type": "application/json"}

        response = requests.put(
            url,
            auth=HTTPBasicAuth(OPENSEARCH_USERNAME, OPENSEARCH_PASSWORD),
            headers=headers,
            data=json.dumps(document)
        )

        print(f"Indexed {key}: {response.status_code} {response.text}")
