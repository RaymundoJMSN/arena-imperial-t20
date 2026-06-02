# Arena Imperial T20

Gerador de encontros para **Tormenta 20** — o RPG brasileiro da Jambô Editora.

Baseado no [Kobold+ Fight Club](https://github.com/fantasycalendar/kobold-plus-fight-club) (MIT License) por Fantasy Computerworks / Ian Toltz.

🌐 **Site**: https://arena.raynathus.com.br  
💾 **Download (Windows)**: [Releases](https://github.com/RaymundoJMSN/arena-imperial-t20/releases/latest) — baixe o arquivo `.exe`

---

## O que faz

- Monta encontros balanceados usando o sistema de **Nível de Desafio (ND)** do T20
- Calcula o **ND do Grupo** automaticamente a partir dos níveis dos personagens
- Suporta dificuldades: Fácil, Moderado, Difícil
- Gera encontros por tipo: Aleatório, Solo, Lacaios, Líder + Lacaios, Bando, Enxame
- **525 monstros** do Bestiário de Arton e Livro Básico com páginas de referência
- Filtros por ND, Tamanho, Tipo, Subtipo e Papel de Combate
- Importação de monstros personalizados via Google Sheets ou CSV
- App desktop com **atualização automática** (Windows)

## Fontes incluídas

| Livro | Monstros |
|-------|----------|
| Livro Básico / Jogo do Ano | 64 |
| Ameaças de Arton | 253 |
| Deuses de Arton | restante |

> Os monstros são referências às obras da Jambô Editora. Este projeto não distribui o conteúdo dos livros — apenas facilita a consulta para mestres que já possuem as obras.

## Reportar erros / sugerir monstros

Encontrou um monstro faltando, página errada ou dado incorreto? Abra uma **Issue**:

👉 [github.com/RaymundoJMSN/arena-imperial-t20/issues/new/choose](https://github.com/RaymundoJMSN/arena-imperial-t20/issues/new/choose)

Há templates específicos para cada tipo de problema.

## Desenvolvimento local

```bash
npm ci          # instalar dependências
npm run dev     # dev server em http://localhost:3000
npm run build   # build de produção em /dist
```

## Adicionar monstros personalizados

Clique em **"Importar Monstros"** no menu. Aceita Google Sheets ou arquivo CSV.

Planilha modelo: https://docs.google.com/spreadsheets/d/19R7j2m13LVWZBhFyhYRhv8MB85FqjCAC4mUER1QgSXw/

Colunas obrigatórias: `name`, `nd`, `size`, `type`, `sources`

## Tecnologias

- Vue 3 + Vite + Pinia + TailwindCSS
- Tauri (app desktop Windows com auto-update)

## Créditos

- **Arena Imperial T20**: [RayNathus](https://github.com/RaymundoJMSN)
- **Kobold+ Fight Club original**: Ian Toltz & Joe Barzilai / [Fantasy Computerworks](https://github.com/fantasycalendar)
- **Tormenta 20**: Jambô Editora (não afiliado)

## Licença

MIT — veja [LICENSE](LICENSE)
