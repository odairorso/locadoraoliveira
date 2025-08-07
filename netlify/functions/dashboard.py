import json
from datetime import datetime, timedelta

def handler(event, context):
    # Mock dashboard data
    dashboard_data = {
        "resumo": {
            "total_clientes": 2,
            "total_veiculos": 5,
            "veiculos_disponiveis": 3,
            "veiculos_locados": 1,
            "veiculos_manutencao": 1,
            "locacoes_ativas": 1,
            "locacoes_reservadas": 1,
            "receita_mensal": 1220.00,
            "receita_total": 15680.00
        },
        "locacoes_recentes": [
            {
                "id": 1,
                "cliente_nome": "Cliente Teste 1",
                "veiculo_info": "Honda Civic 2021",
                "data_inicio": "2024-01-15",
                "data_fim": "2024-01-20",
                "valor_total": 650.00,
                "status": "ativa"
            },
            {
                "id": 3,
                "cliente_nome": "Cliente Teste 1",
                "veiculo_info": "Ford EcoSport 2023",
                "data_inicio": "2024-01-22",
                "data_fim": "2024-01-25",
                "valor_total": 330.00,
                "status": "reservada"
            }
        ],
        "veiculos_status": {
            "disponivel": [
                {"id": 1, "modelo": "Toyota Corolla", "placa": "ABC-1234"},
                {"id": 3, "modelo": "Volkswagen Gol", "placa": "GHI-9012"},
                {"id": 4, "modelo": "Ford EcoSport", "placa": "JKL-3456"}
            ],
            "locado": [
                {"id": 2, "modelo": "Honda Civic", "placa": "DEF-5678"}
            ],
            "manutencao": [
                {"id": 5, "modelo": "Chevrolet Onix", "placa": "MNO-7890"}
            ]
        },
        "receita_mensal": {
            "janeiro": 1220.00,
            "dezembro": 980.00,
            "novembro": 1450.00,
            "outubro": 1100.00,
            "setembro": 1350.00,
            "agosto": 1200.00
        },
        "alertas": [
            {
                "tipo": "vencimento",
                "mensagem": "Locação #1 vence em 2 dias",
                "prioridade": "media"
            },
            {
                "tipo": "manutencao",
                "mensagem": "Chevrolet Onix precisa de revisão",
                "prioridade": "alta"
            }
        ]
    }
    
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
            "data": dashboard_data,
            "error": None
        })
    }