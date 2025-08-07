import json
import os
from supabase import create_client, Client

def handler(event, context):
    url: str = os.environ.get("SUPABASE_URL")
    key: str = os.environ.get("SUPABASE_KEY")
    supabase: Client = create_client(url, key)

    # Parse query parameters
    query_params = event.get('queryStringParameters', {}) or {}
    search = query_params.get('search', '')
    limit = query_params.get('limit', '')

    try:
        query = supabase.table('clientes').select('*')

        if search:
            # This is a basic search. For more complex scenarios, consider full-text search.
            query = query.ilike('nome', f'%{search}%')

        if limit:
            try:
                limit_int = int(limit)
                query = query.limit(limit_int)
            except ValueError:
                pass

        clientes = query.execute().data

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
                "data": clientes,
                "total": len(clientes),
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
