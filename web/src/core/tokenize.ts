// Split an input line into tokens (ch. 9 opener: "rozdělí na tokeny po mezerách").
// Uppercased because the on-screen keyboard is uppercase-only (ch. 5) and the
// grammar regexes assume uppercase.

export function tokenize(line: string): string[] {
  return line
    .trim()
    .toUpperCase()
    .split(/\s+/)
    .filter((t) => t.length > 0)
}
