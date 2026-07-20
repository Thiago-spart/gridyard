# Gridyard — Mini Editor de Cena 3D
> **Desafio Técnico Dev Full-Stack com 3D Web — InLab / Artefacto**

**Gridyard** é um mini editor 3D no formato de ferramenta de planejamento de layout para armazéns e galpões logísticos (*floor-plan layout tool*). A aplicação permite posicionar, rotacionar, personalizar e medir elementos industriais (como paletes, prateleiras, caixas e estações de trabalho) em uma grade 10×8 com resposta visual instantânea.

---

## 📄 Documentação do Desafio Técnico & Entrega

Em conformidade com as instruções do desafio (`Teste_Tecnico_Dev_InLab_ENVIAR_5dias.pdf`), a entrega completa está dividida e documentada nos seguintes arquivos:

- 📋 **[SUBMISSION.md](file:///home/loki/www/challengers/innovation_challenger/SUBMISSION.md)**: **Documento Oficial de Entrega** (dividido em Parte 1: Resumo Simples para Não-Técnicos, Parte 2: Detalhe Técnico para Desenvolvedores, e Parte 3: Log com IA).
- 🤖 **[AI_LOG.md](file:///home/loki/www/challengers/innovation_challenger/AI_LOG.md)**: **Log de IA Unificado** (sequência real de 21 passos do desenvolvimento assistido por IA, incluindo prompts na íntegra, erros e soluções).
- 🏗️ **[ARCHITECTURE.md](file:///home/loki/www/challengers/innovation_challenger/ARCHITECTURE.md)**: Decisões de stack, estrutura de pastas, Zustand store e schema do Supabase com Row-Level Security (RLS).
- 🎨 **[DESIGN.md](file:///home/loki/www/challengers/innovation_challenger/DESIGN.md)**: Definição de conceito de produto, mecânicas de colisão (AABB), snap, sistema de medidas e design responsivo.
- 💅 **[STYLE_GUIDE.md](file:///home/loki/www/challengers/innovation_challenger/STYLE_GUIDE.md)**: Identidade visual, marca, paleta de cores e tokens do Tailwind CSS v4.

---

## 🛠️ Stack Tecnológica

- **Core**: React 19, TypeScript, Vite, Tailwind CSS v4 (`@tailwindcss/vite`).
- **3D**: Three.js, React Three Fiber (R3F), `@react-three/drei`.
- **Estado**: Zustand (`sceneStore.ts`).
- **Persistência**: Supabase (JS SDK com Auth Anônimo e RLS) + fallback em `localStorage`.
- **Testes & Qualidade**: Vitest, React Testing Library, ESLint, TypeScript Strict Mode, GitHub Actions CI.

---

## 🚀 Como Executar o Projeto

### 1. Requisitos
- Node.js >= 20.x
- pnpm >= 9.x

### 2. Instalação e Execução Local
```bash
# Clone o repositório
git clone https://github.com/Thiago-spart/gridyard.git
cd gridyard

# Instale as dependências
pnpm install

# Inicie o servidor de desenvolvimento
pnpm dev
```
Abra o navegador em `http://localhost:5173`.

### 3. Executando os Testes & Checagem de Tipos
```bash
# Executar a suíte de testes unitários (21 arquivos / 119 testes)
pnpm test

# Executar checagem estática de tipos TypeScript
pnpm typecheck

# Executar linter ESLint
pnpm lint
```

---

## ⚡ Configuração do Supabase (Opcional)

A persistência do Gridyard utiliza o **Supabase** (autenticação anônima + RLS) quando as variáveis de ambiente estão presentes, e alterna automaticamente para `localStorage` caso contrário:

1. Copie `.env.example` para `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Adicione sua URL do Supabase e Anon Key em `.env.local`:
   ```env
   VITE_SUPABASE_URL=https://sua-url-supabase.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-anon-key-publica
   ```
3. Reinicie `pnpm dev`.

Sem `.env.local`, o aplicativo roda 100% via `localStorage` (padrão para CI e execuções sem credenciais).

---

## 📊 Desempenho & Otimizações

- **Arraste Transiente**: Coordenadas de arraste vivem no estado local do ponteiro, evitando re-renderizar a árvore DOM a cada frame de movimento.
- **Memoização com `React.memo`**: `Piece` é memoizado e `Pieces.tsx` fornece um callback `startDrag` estável via `useCallback`, garantindo que o arraste de uma peça re-renderize apenas aquela peça individual.
- **Cálculos Puros em `lib/`**: Checagens de colisão AABB, conversão de grade e formatação de medidas são funções puras e desacopladas da renderização WebGL.
