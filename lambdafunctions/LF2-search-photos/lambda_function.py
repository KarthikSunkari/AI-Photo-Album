import os
import boto3
import json
import requests
from time import time
from random import random
from requests.auth import HTTPBasicAuth

LEX_BOT_ID = os.environ['LEX_BOT_ID']
LEX_BOT_ALIAS_ID = os.environ['LEX_BOT_ALIAS_ID']
LEX_LOCALE_ID = 'en_US'
OPENSEARCH_HOST = os.environ['OPENSEARCH_HOST']
OPENSEARCH_INDEX = 'photos'
OPENSEARCH_USERNAME = os.environ['OPENSEARCH_USERNAME']
OPENSEARCH_PASSWORD = os.environ['OPENSEARCH_PASSWORD']
SEARCH_URL = f"https://{OPENSEARCH_HOST}/{OPENSEARCH_INDEX}/_search"

lex = boto3.client('lexv2-runtime')

def lambda_handler(event, context):

    # Get query from user input
    query = event.get('q', '')
    if not query:
        return { "results": [] }

    # Call Lex V2 to interpret query
    response = lex.recognize_text(
        botId=LEX_BOT_ID,
        botAliasId=LEX_BOT_ALIAS_ID,
        localeId=LEX_LOCALE_ID,
        sessionId=f'searchSession-{int(random()*time())}',
        text=query
    )

    # Extract interpreted values
    slots = response.get('sessionState', {}).get('intent', {}).get('slots', {})
    keyword_values = slots.get('Keywords', {}).get('values', [])
    search_keywords = [val['value']['interpretedValue'] for val in keyword_values]
    if not search_keywords:
        return { "results": [] }

    print("search_keywords = ", search_keywords)

    # Fuzzy search using keywords in OpenSearch
    os_response = requests.get(
        SEARCH_URL,
        auth=HTTPBasicAuth(OPENSEARCH_USERNAME, OPENSEARCH_PASSWORD),
        headers={"Content-Type": "application/json"},
        data=json.dumps(build_fuzzy_query(search_keywords))
    )

    hits = os_response.json().get('hits', {}).get('hits', [])
    results = [hit.get('_source', {}) for hit in hits]
    
    print(results)

    return { "results": results }


def build_fuzzy_query(keywords):
    should_clauses = [
        {
            "match": {
                "labels": {
                    "query": keyword,
                    "fuzziness": "AUTO"
                }
            }
        } for keyword in keywords
    ]
    return {
        "query": {
            "bool": {
                "should": should_clauses
            }
        }
    }
