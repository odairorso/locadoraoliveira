import json
from datetime import datetime, timedelta

def handler(event, context):
    # Parse query parameters
    query_params = event.get('queryStringParameters', {}) or {}
    status = query_params.get('status', '')
    cliente_id = query_params.get('cliente_id', '')
    
    # Mock data for rentals
    locacoes = [
        {
            "id": 1,
            "cliente_id": 1,
            "cliente_nome": "Cliente Teste 1",
            "veiculo_id": 2,
            "veiculo_info": "Honda Civic 2021 - DEF-5678",
            "data_inicio": "2024-01-15",
            "data_fim": "2024-01-20",
            "data_devolucao": None,
            "valor_diaria": 130.00,
            "valor_total": 650.00,
            "status": "ativa",
            "observacoes": "Locação para viagem de negócios",
            "created_at": "2024-01-15T10:00:00Z",
            "updated_at": "2024-01-15T10:00:00Z"
        },
        {
            "id": 2,
            "cliente_id": 2,
            "cliente_nome": "Cliente Teste 2",
            "veiculo_id": 1,
            "veiculo_info": "Toyota Corolla 2022 - ABC-1234",
            "data_inicio": "2024-01-10",
            "data_fim": "2024-01-12",
            "data_devolucao": "2024-01-12",
            "valor_diaria": 120.00,
            "valor_total": 240.00,
            "status": "finalizada",
            "observacoes": "Devolução sem problemas",
            "created_at": "2024-01-10T09:00:00Z",
            "updated_at": "2024-01-12T16:00:00Z"
        },
        {
            "id": 3,
            "cliente_id": 1,
            "cliente_nome": "Cliente Teste 1",
            "veiculo_id": 4,
            "veiculo_info": "Ford EcoSport 2023 - JKL-3456",
            "data_inicio": "2024-01-22",
            "data_fim": "2024-01-25",
            "data_devolucao": None,
            "valor_diaria": 110.00,
            "valor_total": 330.00,
            "status": "reservada",
            "observacoes": "Reserva para final de semana",
            "created_at": "2024-01-20T14:00:00Z",
            "updated_at": "2024-01-20T14:00:00Z"
        }
    ]
    
    # Filter by status if provided
    if status:
        locacoes = [l for l in locacoes if l['status'] == status]
    
    # Filter by cliente_id if provided
    if cliente_id:
        try:
            cliente_id_int = int(cliente_id)
            locacoes = [l for l in locacoes if l['cliente_id'] == cliente_id_int]
        except ValueError:
            pass
    
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
            "data": locacoes,
            "total": len(locacoes),
            "error": None
        })
    }