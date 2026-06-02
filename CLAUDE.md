# Arena Imperial T20 — Instruções para Claude

## Visão geral do projeto

Adaptação do [Kobold+ Fight Club](https://github.com/fantasycalendar/kobold-plus-fight-club) (MIT) para Tormenta 20.
Desenvolvido por RayNathus (https://github.com/RaymundoJMSN).

- **Site**: https://arena.raynathus.com.br
- **Repo**: https://github.com/RaymundoJMSN/arena-imperial-t20
- **Issues**: https://github.com/RaymundoJMSN/arena-imperial-t20/issues
- **Releases**: https://github.com/RaymundoJMSN/arena-imperial-t20/releases

## Stack

- Vue 3 + Vite + Pinia + TailwindCSS
- Tauri v1 (desktop Windows, auto-update via NSIS)
- GitHub Pages (site, deploy automático em push pra main)
- GitHub Actions (CI/CD)

## Versão atual

Ver `src-tauri/tauri.conf.json` → `package.version`

A versão é exibida no header do app via `__APP_VERSION__` (definido em `vite.config.js` lendo `tauri.conf.json`).

## Ao commitar mudanças

Sempre commitar com mensagem em PT-BR descrevendo o que mudou.

## Ao fazer release (quando usuário pedir deploy/publicar/lançar versão)

**Sempre** executar estes passos em ordem:

1. Perguntar ao usuário que mudanças incluir no changelog (ou usar commits desde última tag)
2. Bump de versão em `src-tauri/tauri.conf.json` (campo `package.version`)
   - Patch: `1.0.x` → `1.0.x+1` (correções)
   - Minor: `1.x.0` → `1.x+1.0` (features novas)
   - Major: `x.0.0` → `x+1.0.0` (breaking changes)
3. `git add src-tauri/tauri.conf.json && git commit -m "chore: bump version para vX.Y.Z"`
4. `git push` → dispara deploy automático do **site**
5. `git tag -a vX.Y.Z -m "changelog"` 
6. `git push origin vX.Y.Z` → dispara build do **EXE**

## Estrutura de CI/CD

| Workflow | Trigger | Resultado |
|----------|---------|-----------|
| `deploy.yml` | push em `main` | Site no GitHub Pages |
| `release.yml` | push de tag `v*` | EXE Windows (.exe NSIS) nas Releases |

**Importante**: o instalador é NSIS (`.exe`), **não MSI**. MSI foi removido porque não substitui versões anteriores corretamente no Windows, causando loop no auto-update.

O auto-update usa `tauri-update.key` (chave privada guardada fora do repo) + `TAURI_PRIVATE_KEY` no GitHub Secrets. O `latest.json` é gerado automaticamente pelo `tauri-apps/tauri-action@v0` e publicado nas releases.

## Arquivos importantes

| Arquivo | Função |
|---------|--------|
| `src-tauri/tauri.conf.json` | Versão, nome, ícones, config updater |
| `src-tauri/Cargo.toml` | Features Rust (inclui `updater`) |
| `public/json/t20_monsters.json` | 525 monstros T20 |
| `public/json/t20_sources.json` | 8 fontes T20 com links Jambô |
| `public/articles.json` | Novidades do painel lateral |
| `public/CNAME` | Domínio arena.raynathus.com.br |
| `src/js/strategy.js` | Lógica de encontros T20 |
| `src/js/monster-t20.js` | Classe MonsterT20 |
| `src/js/monster.js` | Classe Monster original (D&D, não usar) |
| `src/js/pix.js` | Gerador de payload Pix EMV/CRC16 |
| `src/stores/filters.js` | Filtros (size/type/role/subtype/cr) |
| `src/stores/encounter.js` | Estado do encontro |
| `src/stores/monsters.js` | Carregamento de monstros |
| `src/stores/modals.js` | Estado dos modais (inclui `doacao`) |
| `src/components/DoacaoModal.vue` | Modal de doação (QR Pix + Ko-fi) |
| `src/components/FiltersSlideover.vue` | Painel de filtros |
| `src/components/HeaderNav.vue` | Navbar (exibe versão via `appVersion`) |
| `vite.config.js` | Define `__APP_VERSION__` do tauri.conf.json |
| `.github/ISSUE_TEMPLATE/` | Templates de issue para feedback |
| `scripts/convert-foundry.js` | Script conversão Foundry VTT → T20 |
| `scripts/map-toc.js` | Mapeamento páginas Ameaças de Arton |
| `scripts/map-toc-livrobasico.js` | Mapeamento páginas Livro Básico |

## Regras T20 implementadas

- **ND do Grupo** = soma de todos os níveis dos jogadores ÷ 4
- **Dificuldades**: Fácil = max(0.25, NDG−2) / Moderado = max(0.5, NDG) / Difícil = max(1, NDG+2)
- **ND < 1**: encontro = nd × count (soma aditiva, não fórmula log)
- **ND ≥ 1**: nd + 2×floor(log2(count))
- **XP** = round(min(nd, 20) × 1000)
- **Papéis**: Solo, Lacaio, Especial, Enxame, Bando
- **ND especial**: S = 20.5, S+ = 21 (para comparação; exibidos como "S" e "S+")

## Banco de monstros

- **525 monstros** convertidos do Foundry VTT
- Fontes: Livro Básico/JdA (64), Ameaças de Arton (253), Deuses de Arton (restante)
- Páginas mapeadas para AdA e LB via scripts `map-toc.js` e `map-toc-livrobasico.js`
- Campos: `name`, `nd`, `size`, `type`, `role[]`, `tags[]`, `defense`, `hp`, `init`, `resistances`, `section`, `sources`

## Filtros disponíveis

- **ND** (slider min/max, 24 valores: 1/4, 1/2, 1–20, S, S+)
- **Tamanho** (Minúsculo/Pequeno/Médio/Grande/Enorme/Colossal + variantes "Não-")
- **Tipo** (Animal/Construto/Espírito/Humanoide/Monstro/Morto-Vivo + variantes "Não-")
- **Subtipo** (dinâmico, gerado dos `tags` de todos os monstros carregados)
- **Papel de Combate** (Solo/Lacaio/Especial/Enxame/Bando)

## Modal de doação

- **Chave Pix**: 71cb6e16-c667-482a-93e0-2096a88c70f7 (aleatória, RayNathus)
- **Ko-fi RayNathus**: https://ko-fi.com/raynathus
- **Ko-fi Fantasy Computerworks**: https://ko-fi.com/fantasycomputerworks (projeto original)
- QR code gerado via `qrcode` npm + payload Pix EMV em `src/js/pix.js`

## Novidades (articles.json)

**NUNCA** adicionar artigos anunciando novas versões do app.
O app mostra versão no header e notifica via Tauri updater automaticamente.
Novidades são apenas para: ferramentas externas, loja Jambô, campanhas, conteúdo T20.

## Feedback da comunidade

Issues templates em `.github/ISSUE_TEMPLATE/`:
- `monstro-faltando.yml` → label `monstro-faltando`
- `pagina-errada.yml` → label `pagina-errada`
- `dado-incorreto.yml` → label `dado-incorreto`
- `outro.yml` → label `outro`

## Chaves e segredos

- `tauri-update.key` — chave privada Tauri updater (fora do repo, no .gitignore)
- `tauri-update.key.pub` — chave pública (no .gitignore, valor já em tauri.conf.json)
- `TAURI_PRIVATE_KEY` — GitHub Secret com conteúdo de `tauri-update.key`
- Sem `TAURI_KEY_PASSWORD` (senha em branco na geração)

## Domínio e deploy

- DNS: CNAME `arena.raynathus.com.br` → `raymundojmsn.github.io`
- `public/CNAME` com valor `arena.raynathus.com.br`
- `vite.config.js`: `base: process.env.VITE_BASE_URL ?? "/"` (sem subpath com domínio próprio)
