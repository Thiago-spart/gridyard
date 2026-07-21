# Gridyard — Documento de Entrega
**Desafio Técnico:** Dev Full-Stack com 3D Web — Mini Editor de Cena 3D  
**Empresa:** InLab / Artefacto  
**Projeto:** Gridyard (Warehouse Floor-Plan Layout Tool)  
**Demo ao vivo:** 🔗 [gridyard.vercel.app](https://gridyard.vercel.app)

---

## Parte 1 — Resumo Simples (para Não-Técnicos)

### O que foi construído
O **Gridyard** é uma aplicação web 3D no formato de ferramenta de planejamento de layout para armazéns e galpões logísticos (*floor-plan editor*). Em vez de um jogo abstrato ou visualizador genérico, o projeto foi concebido para resolver um problema real de produto: permitir que operadores e projetistas organizem elementos industriais (como paletes, prateleiras, caixas e estações de trabalho) sobre uma planta baixa retangular em grade (10×8 células).

A interface oferece visualização superior plana (vista ortográfica de planta de arquitetura/blueprint), permitindo arrastar, posicionar, rotacionar e personalizar peças diretamente no navegador com resposta visual imediata.

### Principais Decisões e o que foi Priorizado

1. **Experiência de Uso Intuitiva e Multidispositivo**:
   - **Mover e Ajustar:** Clicar e arrastar peças com o mouse ou tela sensível ao toque (touchscreen). As peças "grudam" automaticamente na grade (*snap*) ao serem soltas.
   - **Prevenção de Erros de Posicionamento:** O sistema calcula o espaço ocupado por cada objeto e impede fisicamente sobreposições. Se uma peça for solta em um local ocupado, ela retorna suavemente para a última posição válida.
   - **Suporte Desktop e Mobile:** A interface se adapta automaticamente para telas de celulares/tablets (painel inferior estilo *bottom sheet*) e computadores (painel lateral), garantindo acessibilidade em qualquer dispositivo.

2. **Medidas Úteis em Tempo Real**:
   - Ao selecionar **uma peça**, o painel exibe suas dimensões reais em metros (adotamos a escala em que 1 célula da grade = 1,2 metros, equivalente ao padrão de um palete industrial real).
   - Ao selecionar **duas peças**, a ferramenta calcula e mostra a distância exata em linha reta entre os centros dos dois objetos.

3. **Salvamento Automático Sem Fricção**:
   - O projeto possui salvamento contínuo: qualquer alteração na disposição das peças é guardada no próprio navegador (`localStorage`) e sincronizada em nuvem através do banco de dados `Supabase`.
   - O salvamento utiliza autenticação anônima automática — o usuário pode fechar a aba, reabrir a página e ver exatamente sua cena restaurada, sem precisar criar conta ou preencher formulários.

4. **Recursos Bônus Entregues**:
   - **Visão 3D em Perspectiva:** Alternância com um clique entre a vista de planta reta (2D/ortográfica) e uma câmera 3D interativa em perspectiva (com rotação e inclinação livres por órbita, e botão de "Resetar vista").
   - **Personalização de Cores:** Seletor de paleta (*swatches*) para alterar a cor de qualquer peça selecionada.
   - **Criação e Exclusão Dinâmica de Peças:** Formulário para criar novas peças personalizadas com dimensões e nomes customizados, além da possibilidade de excluir peças da cena.
   - **Desempenho Otimizado:** Arquitetura preparada para suportar dezenas de peças no tabuleiro mantendo 60 quadros por segundo (60 FPS) e sem travamentos.
   - **Deploy Real e Compartilhável:** Aplicação publicada em produção na Vercel, com domínio próprio (`gridyard.vercel.app`), metadados completos para SEO/compartilhamento (Open Graph, Twitter Card, favicon set, `robots.txt`/`sitemap.xml`) e deploy contínuo a partir de `master`.

---

## Parte 2 — Detalhe Técnico (para Desenvolvedores)

### Stack Tecnológica

| Camada | Tecnologias Utilizadas |
|---|---|
| **App Shell & UI** | React 19, TypeScript, Vite, Tailwind CSS v4 |
| **Renderização 3D** | Three.js, React Three Fiber (R3F), `@react-three/drei` |
| **Estado da Cena** | Zustand (`src/store/sceneStore.ts`) |
| **Persistência & Auth** | Supabase JS SDK (Auth Anônimo + Row-Level Security) / `localStorage` |
| **Qualidade & Testes** | Vitest, React Testing Library, Playwright (E2E), ESLint, TypeScript Strict Mode, GitHub Actions CI/CD |
| **Deploy & Infra** | Vercel (deploy contínuo a partir de `master`, domínio `gridyard.vercel.app`) |

### Arquitetura de Código e Organização

A estrutura de diretórios em `src/` foi projetada para garantir desacoplamento entre lógica de negócios, renderização WebGL e interface de usuário DOM:

```text
src/
├── lib/                       # Lógica pura (sem React/Three) — alvo principal do Vitest
│   ├── collision.ts           # Checagem de colisão AABB (Axis-Aligned Bounding Box)
│   ├── grid.ts                # Conversão mundo ↔ célula e snap à grade
│   ├── measurement.ts         # Cálculo e formatação de dimensões e distâncias reais
│   ├── pieces.ts              # Catálogo, footprints e propriedades dos objetos
│   └── placement.ts           # Algoritmo de busca de espaço livre para novas peças
├── store/
│   └── sceneStore.ts          # Estado global Zustand (peças, seleção, modo de visão, persistência)
├── scene/                     # Renderização R3F / WebGL
│   ├── Scene.tsx              # Canvas R3F + alternância de câmera (Orthographic / Perspective)
│   ├── Board.tsx              # Plano de chão retangular 10×8 + grid visual
│   ├── DragPlane.tsx          # Plano invisível de raycasting para conversão de ponteiro 3D
│   ├── Pieces.tsx             # Gerenciador de renderização com memoização e callbacks estáveis
│   └── Piece.tsx              # Malha 3D individual com destaque por contorno (wireframe outline)
├── ui/                        # Interface DOM / HUD (Tailwind CSS v4)
│   ├── MeasurementPanel/      # Exibição de dimensões e distância entre peças
│   ├── PieceForm/             # Formulário de criação/edição com confirmação de conflito
│   ├── ViewToggle/            # Controles de alternância de visão 2D/3D e reset de câmera
│   ├── SwatchRow/             # Seletor de cores da peça
│   ├── DeleteButton/          # Exclusão de peça selecionada
│   ├── SaveStatus/            # Indicador de estado de salvamento (Salvando... / Salvo)
│   └── ResponsiveLayout/      # Wrapper responsivo (Sidebar no desktop / Bottom sheet no mobile)
└── persistence/
    ├── localStorage.ts        # Fallback local síncrono
    └── supabase.ts            # Integração Supabase via autenticação anônima e RLS
```

Fora de `src/`, um diretório `e2e/` na raiz do repositório contém a suíte Playwright que cobre `scene/` (interações de canvas WebGL — seleção, arraste, rotação, alternância de câmera — não testáveis via React Testing Library), incluindo `e2e/gridToScreen.ts`, um helper de projeção grade↔tela calibrado empiricamente contra a câmera fixa do app.

### Principais Decisões Arquiteturais e Trade-offs

1. **Estado de Arraste Transiente vs. Estado do Store**:
   - **Decisão:** Enquanto uma peça está sendo arrastada, suas coordenadas transientes vivem apenas no estado local do ponteiro ([usePointerDrag.ts](file:///home/loki/www/challengers/innovation_challenger/src/hooks/usePointerDrag.ts)). O store do Zustand só é atualizado via `movePiece()` no evento de soltura (*pointerup*).
   - **Trade-off:** Evita disparar re-renderizações em toda a árvore de componentes DOM (como painéis de medição e legendas) a cada pixel movido pelo mouse.

2. **Otimização de Performance no R3F (`React.memo` + Callbacks Estáveis)**:
   - **Decisão:** O componente `Piece` foi encapsulado em `React.memo`, e o manipulador `startDrag` em `Pieces.tsx` foi estabilizado com `useCallback`.
   - **Resultado:** Em um tabuleiro preenchido com dezenas de peças, o arraste de um objeto re-renderiza exclusivamente aquela peça individual, mantendo o restante da cena e os elementos 3D sem custo de renderização adicional.

3. **Geometrias Primitivas vs. Modelos 3D Extensivos (GLTF)**:
   - **Decisão:** Optou-se por utilizar malhas geométricas primitivas parametrizadas (caixas/cubos com diferentes footprints e cores) em vez de carregar arquivos 3D externos (.gltf/.glb).
   - **Trade-off:** Garante carregamento instantâneo da aplicação, zero consumo de banda com assets 3D e renderização limpa no estilo CAD/blueprint.

4. **Autenticação Anônima + Row-Level Security (RLS) no Supabase**:
   - **Decisão:** A persistência em nuvem realiza `signInAnonymously()` silencioso no carregamento. O banco de dados PostgreSQL impõe a seguinte política RLS:
     ```sql
     create table scenes (
       user_id uuid primary key references auth.users(id) on delete cascade,
       data jsonb not null,
       updated_at timestamptz not null default now()
     );
     alter table scenes enable row level security;
     create policy "Users can manage their own scene" on scenes for all using (auth.uid() = user_id);
     ```
   - **Trade-off:** Atende rigorosamente ao requisito de banco de dados e autenticação sem introduzir fricção de UX (sem formulários de cadastro/login).

---

## Parte 3 — Log do Processo com IA

O desenvolvimento do **Gridyard** foi conduzido através de engenharia de prompts iterativa utilizando **Claude Code** e **Antigravity**.

O histórico unificado de prompts, respostas da IA, diagnósticos de erros, correções e decisões tomadas está registrado na íntegra no documento:

📄 **[AI_LOG.md](file:///home/loki/www/challengers/innovation_challenger/AI_LOG.md)**

### Tabela Resumo das Etapas do Processo com IA

| Etapa | Foco da Atividade | Ferramentas / Prompts Principais | Resultado & Aprendizados |
|---|---|---|---|
| **Etapa 1** | Definição de Conceito | Brainstorming de modelos de tabuleiro 3D | Redirecionamento da IA de estética visual para propósito de produto (armazém/layout). |
| **Etapa 2-4** | Mecânicas e Regras de Negócio | Mapeamento técnico das 7 mecânicas do PDF | Definição de colisão AABB (snap back), rotação 90° e escala 1 célula = 1,2m. |
| **Etapa 5-7** | Arquitetura e MCPs | Alinhamento com vaga InLab + MCP research | Priorização de Vitest + CI/CD. Configuração do MCP oficial `pmndrs` para R3F/Zustand. |
| **Etapa 8-10** | Identidade & Setup do Repo | Criação do `STYLE_GUIDE.md` e marca Gridyard | Setup do Vite, Tailwind v4 e padronização de branches/commits via PR. |
| **Etapa 11-14** | Desenvolvimento TDD Core | Implementação de `lib/`, `store/` e UI | 100% dos testes unitários passando em Vitest. Integração em subagentes. |
| **Etapa 15** | Diagnóstico de Bug em Tela | Correção de interceptação de evento de ponteiro | Rótulo `<Html>` drei capturava eventos de arraste. Corrigido com `wrapperClass`. |
| **Etapa 16** | Persistência Supabase | Autenticação anônima, RLS e salvamento async | Prevenção de race-condition no autosave inicial com flag `hasLoaded`. |
| **Etapa 17** | Câmera 3D em Perspectiva | Alternância entre 2D ortográfico e 3D livre | Análise de React Compiler descartada por conta da reconciliação R3F. |
| **Etapa 18-21** | Cores, Edição Dinâmica & Perf | Paleta de cores, `PieceForm` e memoização | Recolor por contorno (*outline*) e memoização de `Piece` para escala de peças. |
| **Etapa 22** | Suíte E2E com Playwright | Cobertura de `scene/` (canvas WebGL) | Helper de projeção grade→tela calibrado empiricamente; 2 bugs reais de config só encontrados ao executar de verdade. |
| **Etapa 23-24** | Deploy na Vercel | CLI, variáveis de ambiente, sincronização de branches | Recuperação de credenciais Supabase via MCP após `vercel link` sobrescrever `.env.local`; `master` sincronizado com `dev`. |
| **Etapa 25** | SEO, Compartilhamento & Domínio | Metadados, favicon set, imagem OG, domínio `gridyard.vercel.app` | 3 particularidades reais da plataforma Vercel descobertas só na execução (rename não repropaga alias, proteção SSO padrão em alias manual). |

---

## Instruções para Executar o Projeto Localmente

### Pré-requisitos
- Node.js >= 20.x
- pnpm >= 9.x

### Passos
1. Clone o repositório:
   ```bash
   git clone https://github.com/Thiago-spart/gridyard.git
   cd gridyard
   ```
2. Instale as dependências:
   ```bash
   pnpm install
   ```
3. Execute a aplicação em modo de desenvolvimento:
   ```bash
   pnpm dev
   ```
4. Para executar a suíte completa de testes e checagem de tipos:
   ```bash
   pnpm test
   pnpm typecheck
   ```
