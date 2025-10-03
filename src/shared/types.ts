import z from "zod";

// Cliente schemas
export const ClienteSchema = z.object({
  id: z.number().optional(),
  nome: z.string().min(1, "Nome é obrigatório"),
  cpf: z.string().min(11, "CPF deve ter 11 dígitos").max(14, "CPF inválido"),
  celular: z.string().min(10, "Celular é obrigatório"),
  endereco: z.string().min(1, "Endereço é obrigatório"),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  cep: z.string().optional(),
  email: z.string().email("Email inválido"),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const ClienteCreateSchema = ClienteSchema.omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

export type Cliente = z.infer<typeof ClienteSchema>;
export type ClienteCreate = z.infer<typeof ClienteCreateSchema>;

// Veículo schemas
export const VeiculoSchema = z.object({
  id: z.number().optional(),
  modelo: z.string().min(1, "Modelo é obrigatório"),
  marca: z.string().min(1, "Marca é obrigatória"),
  ano: z.number().min(1990, "Ano deve ser maior que 1990").max(new Date().getFullYear() + 1, "Ano inválido"),
  placa: z.string().min(7, "Placa deve ter formato brasileiro").max(8, "Placa deve ter formato brasileiro"),
  renavam: z.string().min(1, "Renavam é obrigatório"),
  cor: z.string().min(1, "Cor é obrigatória"),
  valor_diaria: z.number().positive("Valor da diária deve ser positivo").optional().nullable(),
  valor_veiculo: z.number().positive("Valor do veículo deve ser positivo"),
  tipo_operacao: z.enum(["locacao", "venda", "ambos"], {
    errorMap: () => ({ message: "Tipo deve ser 'locacao', 'venda' ou 'ambos'" })
  }),
  status: z.enum(["disponivel", "locado", "vendido"]).default("disponivel"),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const VeiculoCreateSchema = VeiculoSchema.omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

export type Veiculo = z.infer<typeof VeiculoSchema>;
export type VeiculoCreate = z.infer<typeof VeiculoCreateSchema>;

// Locação schemas
export const LocacaoSchema = z.object({
  id: z.number().optional(),
  cliente_id: z.number(),
  veiculo_id: z.number(),
  data_locacao: z.string().min(1, "Data de locação é obrigatória"),
  data_entrega: z.string().min(1, "Data de entrega é obrigatória"),
  valor_diaria: z.number().positive("Valor da diária deve ser positivo"),
  valor_total: z.number().positive("Valor total deve ser positivo"),
  valor_caucao: z.number().min(0, "Valor da caução deve ser positivo ou zero").default(0),
  valor_seguro: z.number().min(0, "Valor do seguro deve ser positivo ou zero").default(0),
  status: z.enum(["ativa", "finalizada", "cancelada"]).default("ativa"),
  observacoes: z.string().optional().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const LocacaoCreateSchema = LocacaoSchema.omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

export type Locacao = z.infer<typeof LocacaoSchema>;
export type LocacaoCreate = z.infer<typeof LocacaoCreateSchema>;

// Venda schemas
export const VendaSchema = z.object({
  id: z.number().optional(),
  cliente_id: z.number(),
  veiculo_id: z.number(),
  valor_venda: z.number().positive("Valor de venda deve ser positivo"),
  data_venda: z.string().min(1, "Data de venda é obrigatória"),
  forma_pagamento: z.string().optional().nullable(),
  status: z.enum(["finalizada"]).default("finalizada"),
  observacoes: z.string().optional().nullable(),
  created_at: z.string().optional(),
});

export const VendaCreateSchema = VendaSchema.omit({ 
  id: true, 
  created_at: true 
});

export type Venda = z.infer<typeof VendaSchema>;
export type VendaCreate = z.infer<typeof VendaCreateSchema>;

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DashboardStats {
  locacoesAtivas: number;
  veiculosDisponiveis: number;
  veiculosLocados: number;
  receitaMes: number;
  receitaSeguro: number;
  saldoCaixa?: number;
}

// Movimentação Financeira schemas
export const MovimentacaoFinanceiraSchema = z.object({
  id: z.number().optional(),
  tipo: z.enum(["entrada", "saida"], {
    errorMap: () => ({ message: "Tipo deve ser 'entrada' ou 'saida'" })
  }),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  valor: z.number().positive("Valor deve ser positivo"),
  data_movimentacao: z.string().min(1, "Data é obrigatória"),
  locacao_id: z.number().optional().nullable(),
  cliente_id: z.number().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  created_at: z.string().optional(),
});

export const MovimentacaoFinanceiraCreateSchema = MovimentacaoFinanceiraSchema.omit({ 
  id: true, 
  created_at: true 
});

export type MovimentacaoFinanceira = z.infer<typeof MovimentacaoFinanceiraSchema>;
export type MovimentacaoFinanceiraCreate = z.infer<typeof MovimentacaoFinanceiraCreateSchema>;
