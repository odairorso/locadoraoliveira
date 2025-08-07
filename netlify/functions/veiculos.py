import json
import os
from supabase import create_client, Client

def handler(event, context):
    url: str = os.environ.get("SUPABASE_URL")
    key: str = os.environ.get("SUPABASE_KEY")
    supabase: Client = create_client(url, key)

    # Parse query parameters
    query_params = event.get('queryStringParameters', {}) or {}
    status = query_params.get('status', '')

    try:
        query = supabase.table('veiculos').select('*')
        if status:
            query = query.eq('status', status)
        
        veiculos = query.execute().data

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
            },
            "body": json.dumps({
                "success": True,
                "data": veiculos,
                "total": len(veiculos),
                "error": None
            })
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
            },
            "body": json.dumps({
                "success": False,
                "error": str(e)
            })
        }