import json

def handler(event, context):
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json"
        },
        "body": json.dumps({
            "success": True,
            "data": [
                {"id": 1, "nome": "Cliente Teste 1", "cpf": "111.111.111-11", "celular": "(11) 91111-1111", "email": "teste1@example.com", "endereco": "Rua A, 123", "bairro": "Centro", "cidade": "Cidade Teste", "estado": "TS", "cep": "11111-111"},
                {"id": 2, "nome": "Cliente Teste 2", "cpf": "222.222.222-22", "celular": "(22) 92222-2222", "email": "teste2@example.com", "endereco": "Rua B, 456", "bairro": "Bairro Teste", "cidade": "Cidade Teste", "estado": "TS", "cep": "22222-222"}
            ],
            "error": None
        })
    }
