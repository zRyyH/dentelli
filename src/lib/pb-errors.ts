const FIELD_LABELS: Record<string, string> = {
  email: "Email",
  cpf: "CPF",
  telefone: "Telefone",
  nome: "Nome",
  password: "Senha",
  prontuario: "Prontuário",
  sexo: "Sexo",
  tipo: "Tipo",
  nascimento: "Data de nascimento",
  observacao: "Observação",
  unidade: "Unidade",
};

const CODE_MESSAGES: Record<string, string> = {
  validation_not_unique: "já está em uso",
  validation_required: "é obrigatório",
  validation_min_text_constraint: "é muito curto",
  validation_max_text_constraint: "é muito longo",
  validation_invalid_email: "é inválido",
  validation_is_subdomain: "é inválido",
};

export function parsePbErrors(data: Record<string, { code: string; message: string }> | undefined): string[] {
  if (!data) return [];
  return Object.entries(data).map(([field, err]) => {
    const label = FIELD_LABELS[field] ?? field;
    const reason = CODE_MESSAGES[err.code] ?? err.message ?? "é inválido";
    return `${label} ${reason}`;
  });
}
