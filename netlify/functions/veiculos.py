import json
import urllib.parse

def handler(event, context):
    # Parse query parameters
    query_params = event.get('queryStringParameters', {}) or {}
    status = query_params.get('status', '')
    
    # Mock data for vehicles
    veiculos = [
        {
            "id": 1,
            "marca": "Toyota",
            "modelo": "Corolla",
            "ano": 2022,
            "placa": "ABC-1234",
            "cor": "Branco",
            "status": "disponivel",
            "valor_diaria": 120.00,
            "categoria": "Sedan",
            "combustivel": "Flex",
            "km": 15000
        },
        {
            "id": 2,
            "marca": "Honda",
            "modelo": "Civic",
            "ano": 2021,
            "placa": "DEF-5678",
            "cor": "Preto",
            "status": "locado",
            "valor_diaria": 130.00,
            "categoria": "Sedan",
            "combustivel": "Flex",
            "km": 22000
        },
        {
            "id": 3,
            "marca": "Volkswagen",
            "modelo": "Gol",
            "ano": 2020,
            "placa": "GHI-9012",
            "cor": "Prata",
            "status": "disponivel",
            "valor_diaria": 80.00,
            "categoria": "Hatch",
            "combustivel": "Flex",
            "km": 35000
        },
        {
            "id": 4,
            "marca": "Ford",
            "modelo": "EcoSport",
            "ano": 2023,
            "placa": "JKL-3456",
            "cor": "Azul",
            "status": "disponivel",
            "valor_diaria": 110.00,
            "categoria": "SUV",
            "combustivel": "Flex",
            "km": 8000
        },
        {
            "id": 5,
            "marca": "Chevrolet",
            "modelo": "Onix",
            "ano": 2022,
            "placa": "MNO-7890",
            "cor": "Vermelho",
            "status": "manutencao",
            "valor_diaria": 90.00,
            "categoria": "Hatch",
            "combustivel": "Flex",
            "km": 18000
        }
    ]
    
    # Filter by status if provided
    if status:
        veiculos = [v for v in veiculos if v['status'] == status]
    
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