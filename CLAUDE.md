# Arena Imperial T20 — Instruções para Claude

## Stack
Vue 3 + Vite + Pinia + TailwindCSS + Tauri v1 (desktop Windows)

## Ao commitar mudanças

Sempre commitar com mensagem em PT-BR descrevendo o que mudou.

## Ao fazer release (quando usuário pedir deploy/publicar/lançar versão)

**Sempre** executar estes passos em ordem:

1. Perguntar ao usuário que mudanças incluir no changelog (ou usar os commits desde a última tag)
2. Fazer bump de versão patch em `src-tauri/tauri.conf.json` (campo `package.version`)
   - Exemplo: `1.0.0` → `1.0.1`, `1.1.0` → `1.1.1`
   - Para feature nova: bump minor (`1.0.x` → `1.1.0`)
   - Para breaking change: bump major (`1.x.x` → `2.0.0`)
3. Commitar o bump: `git commit -m "chore: bump version para vX.Y.Z"`
4. Push: `git push`
   - Isso dispara automaticamente o deploy do **site** (GitHub Actions)
5. Criar tag com changelog: `git tag -a vX.Y.Z -m "changelog aqui"`
6. Push da tag: `git push origin vX.Y.Z`
   - Isso dispara automaticamente o build do **EXE** (GitHub Actions release.yml)

## Versão atual
Ver `src-tauri/tauri.conf.json` → `package.version`

## Estrutura de release

- **Site**: https://arena.raynathus.com.br (auto-deploy em push pra main)
- **EXE/MSI**: https://github.com/RaymundoJMSN/arena-imperial-t20/releases (auto-build em push de tag v*)
- **Auto-update**: habilitado via Tauri updater (verifica latest.json nas releases)

## Arquivos importantes

| Arquivo | Função |
|---------|--------|
| `public/json/t20_monsters.json` | 525 monstros T20 |
| `public/json/t20_sources.json` | 8 fontes T20 |
| `src/js/strategy.js` | Lógica de encontros T20 |
| `src/js/monster-t20.js` | Classe MonsterT20 |
| `src/stores/filters.js` | Filtros (size/type/role/subtype/cr) |
| `src-tauri/tauri.conf.json` | Config Tauri (versão, nome, janela) |
| `.github/workflows/deploy.yml` | CI site (GitHub Pages) |
| `.github/workflows/release.yml` | CI EXE (Tauri Windows) |

## Regras T20

- ND do Grupo = soma níveis / 4
- ND < 1: encontro = nd × count (aditivo)
- XP = round(ND × 1000)
- Papéis: Solo, Lacaio, Especial, Enxame, Bando
