# PC BenchHub 3.0 - Handoff da Fatia 1

## Objetivo
Entregar a fundacao visual e o shell compartilhado da migracao para um produto game-first, sem tocar ainda na logica do catalogo de jogos nem reescrever as paginas de dominio.

## Tese Visual Travada
- Mood: dark editorial industrial, mais atlas tecnico do que dashboard SaaS.
- Materialidade: carvao, ink, off-white quente e um unico accent forte em signal orange.
- Hierarquia: leitura primeiro, listas e paines densos acima de mosaicos de cards.
- Tipografia: `Space Grotesk` para display, `IBM Plex Sans` para UI e `IBM Plex Mono` para dados, labels e navegacao utilitaria.
- Motion: minimo e intencional. Header comprime no scroll, hovers sobem pouco e reveals continuam curtos.

## Escopo Desta Fatia
- Criar um handoff unico dentro do repo com direcao travada.
- Substituir tokens globais de cor, tipografia, spacing, radius, sombras e superficies.
- Refazer o shell compartilhado: `Layout`, `TopNav`, footer e frame base.
- Expor busca global no shell como fallback visual e funcional para `Hardware` enquanto `GET /api/search` nao existe.

## Fora de Escopo
- Nenhuma implementacao de catalogo Steam-first.
- Nenhuma pagina nova de `Games`.
- Nenhuma migracao de `benchmarks` para `primaryGameId`.
- Nenhuma reescrita de `Home`, `Hardware`, `Community`, `Collections`, `Submit`, `Profile` ou `BenchmarkDetail` alem do impacto herdado pelos estilos globais.
- Nenhuma alteracao em contratos backend nesta fatia.

## Decisoes Travadas
- O shell ja aponta a direcao game-first, mas sem criar rotas falsas ou placeholders de dominio.
- A busca global fica sempre visivel no header e hoje redireciona para `Hardware` com `?search=` como fallback seguro.
- O home atual continua existindo como portal editorial temporario ate a fatia de `Games`.
- O design system antigo `Nebula Dark` foi encerrado: sem roxo dominante, sem glassmorphism, sem glow neon como linguagem principal.
- Componentes compartilhados continuam usando as mesmas classes base (`surface`, `btn`, `chip`, `badge`, `table-shell`, etc.) para evitar retrabalho nas telas existentes.

## Rotas-Alvo

### Ja existentes e preservadas nesta fatia
- `/`
- `/hardware`
- `/hardware/:id`
- `/hardware/compare`
- `/community`
- `/collections`
- `/collections/:id`
- `/collections/:id/edit`
- `/submit`
- `/profile`
- `/u/:username`
- `/badges`
- `/benchmarks/:id`
- `/login`
- `/register`
- `/admin`

### Alvo arquitetural da proxima fase
- `/games`
- `/games/:slug`
- `GET /api/search` conectando jogos, hardware e usuarios
- `benchmark` tratado como report game-first, sem quebrar URLs atuais

## Contratos Planejados

### Busca Global
`GET /api/search?q=...`

Payload alvo:

```json
{
  "query": "cyberpunk",
  "results": [
    {
      "type": "game",
      "id": "game_123",
      "slug": "cyberpunk-2077",
      "title": "Cyberpunk 2077",
      "subtitle": "Steam catalog",
      "image": "https://...",
      "href": "/games/cyberpunk-2077"
    }
  ]
}
```

### Catalogo Canonico de Games
`GET /api/games`
`GET /api/games/:slug`
`GET /api/games/:slug/reports`
`GET /api/games/:slug/hardware`
`POST /api/games/resolve`

Entidades planejadas:
- `GameSummary`
- `GameDetail`
- `GameReportRow`
- `GameHardwareRow`

### Reports
- `POST /api/benchmarks` passa a exigir `primaryGameId` em novos envios.
- `GET /api/benchmarks` recebe filtros por `gameId`, `reportType`, `resolution`, `settings` e `sort=recent|helpful|trusted`.
- URLs de benchmark continuam estaveis em `/benchmarks/:id`.

### Collections
- Itens passam a aceitar `type: "game" | "hardware" | "report"`.

Payload alvo:

```json
{
  "id": "collection_1",
  "items": [
    { "type": "game", "gameId": "game_123" },
    { "type": "hardware", "hardwareId": "gpu_456" },
    { "type": "report", "benchmarkId": "bench_789" }
  ]
}
```

## Riscos e Pontos de Atencao
- O shell novo convive com paginas ainda desenhadas no paradigma antigo; por isso a fundacao precisou ser compativel com classes legadas.
- A busca no header ainda nao representa a experiencia final, porque depende do contrato `GET /api/search`.
- O home atual ainda fala mais de hardware/benchmarks do que de jogos; isso fica resolvido na fatia seguinte.
- As rotas atuais de navegacao ainda nao refletem 100% o mapa final do produto, porque `Games` ainda nao pode virar destino real sem backend e pagina canonica.

## Arquivos de Fundacao Esperados na Fatia 1
- `frontend/src/index.css`
- `frontend/src/components/Layout.jsx`
- `frontend/src/components/ui/TopNav.jsx`
- `frontend/tailwind.config.js`
- `frontend/src/i18n/locales/pt.json`
- `frontend/src/i18n/locales/en.json`

## Proxima Fatia
- Subir `/games` e `/games/:slug` como novas superficies primarias.
- Implementar `GET /api/search` e trocar o fallback da busca do header pela busca canonica real.
- Migrar o home para um portal editorial de descoberta centrado em jogos.
- Preparar os primeiros contratos para `primaryGameId` em reports e colecoes mistas.
