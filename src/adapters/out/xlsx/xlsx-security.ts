// Mitigação de CSV/Formula Injection em planilhas exportadas.
// Células de texto que começam com = + - @ (ou tab/CR) podem ser interpretadas
// como fórmula pelo Excel/Sheets. Prefixamos com aspa simples para forçar texto.
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;

export function neutralizeFormulaValue(value: unknown): unknown {
  return typeof value === 'string' && FORMULA_TRIGGER.test(value)
    ? `'${value}`
    : value;
}

export function neutralizeFormulaRows(rows: readonly unknown[]): unknown[] {
  return rows.map((row) => {
    if (row && typeof row === 'object') {
      const safe: Record<string, unknown> = {
        ...(row as Record<string, unknown>),
      };
      for (const key of Object.keys(safe)) {
        safe[key] = neutralizeFormulaValue(safe[key]);
      }
      return safe;
    }
    return row;
  });
}
