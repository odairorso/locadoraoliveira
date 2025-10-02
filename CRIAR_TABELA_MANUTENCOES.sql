-- Criação da tabela de manutenções
-- Execute este script no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS public.manutencoes (
    id BIGSERIAL PRIMARY KEY,
    veiculo_id BIGINT NOT NULL REFERENCES public.veiculos(id) ON DELETE CASCADE,
    data_manutencao DATE NOT NULL,
    tipo_manutencao VARCHAR(100) NOT NULL,
    valor DECIMAL(10,2) NOT NULL CHECK (valor >= 0),
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_manutencoes_veiculo_id ON public.manutencoes(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_manutencoes_data ON public.manutencoes(data_manutencao DESC);
CREATE INDEX IF NOT EXISTS idx_manutencoes_tipo ON public.manutencoes(tipo_manutencao);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_manutencoes_updated_at 
    BEFORE UPDATE ON public.manutencoes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.manutencoes ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações (ajuste conforme necessário)
CREATE POLICY "Permitir todas as operações em manutenções" ON public.manutencoes
    FOR ALL USING (true);

-- Comentários para documentação
COMMENT ON TABLE public.manutencoes IS 'Tabela para registrar gastos de manutenção dos veículos';
COMMENT ON COLUMN public.manutencoes.veiculo_id IS 'ID do veículo que recebeu a manutenção';
COMMENT ON COLUMN public.manutencoes.data_manutencao IS 'Data em que a manutenção foi realizada';
COMMENT ON COLUMN public.manutencoes.tipo_manutencao IS 'Tipo de manutenção (ex: troca de óleo, pneus, revisão, etc.)';
COMMENT ON COLUMN public.manutencoes.valor IS 'Valor gasto na manutenção em reais';
COMMENT ON COLUMN public.manutencoes.descricao IS 'Observações adicionais sobre a manutenção';