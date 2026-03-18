export const VEICULO_STATUS: Record<string, { label: string; className: string }> = {
  disponivel: { label: 'Disponível', className: 'bg-green-100 text-green-800' },
  locado:     { label: 'Locado',     className: 'bg-yellow-100 text-yellow-800' },
  vendido:    { label: 'Vendido',    className: 'bg-red-100 text-red-800' },
};

export function getStatusColor(status: string): string {
  return VEICULO_STATUS[status]?.className ?? 'bg-gray-100 text-gray-800';
}

export function getStatusText(status: string): string {
  return VEICULO_STATUS[status]?.label ?? status;
}

export const VISTORIA_TIPO: Record<string, { label: string; className: string }> = {
  entrada: { label: 'Entrada', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  saida:   { label: 'Saída',   className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
};
