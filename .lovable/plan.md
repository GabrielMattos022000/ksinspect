

# App de Medições Dimensionais — MVP

## Visão Geral
Aplicativo web para operadores lançarem medições dimensionais no chão de fábrica. Usa Supabase como banco de dados e autenticação, e gera arquivos TXT para download pelo navegador.

---

## 1. Autenticação e Perfis
- Login com email/senha via Supabase Auth
- Dois perfis: **Admin/Engenharia** e **Operador**
- Tabela de roles no Supabase (admin vs operador) com RLS adequado
- Admin tem acesso total; Operador só lança medições

## 2. Cadastros (Admin)
- **Linhas (ZAP)**: CRUD com nome e status ativo/inativo
- **Máquinas**: vinculadas a uma Linha, CRUD com nome e status
- **Produtos**: campos PB, KS, Cav, Maq (todos texto); nome formatado gerado automaticamente no padrão `PB: {PB} KS: {KS} Cav: {Cav} Máq: {Maq}`
- **Características por Produto**: nome, unidade, nominal, limite min/max, ordem (reordenável por drag-and-drop), status ativo, upload de 2 imagens (desenho e dispositivo) via Supabase Storage

## 3. Ciclo de Medição (Operador)
- **Iniciar ciclo**: selecionar Linha → Máquina (filtrada) → Produto (com busca por PB/KS/Cav/Maq) → informar Semana Fundida (validação regex `^\d{1,2}[A-Za-z]$`) e Chapa Operador (validação `^\d+$`)
- **Tela do ciclo em andamento**:
  - Cards das características na ordem definida
  - Input de valor com cálculo em tempo real de desvio (valor - nominal) e status OK/NOK
  - Indicação visual (cor verde/vermelha) para OK/NOK
  - Botão para ver imagens em modal
  - Possibilidade de corrigir qualquer valor a qualquer momento
  - Resumo no topo: preenchidas/total, quantidade NOK, resultado geral
- **Finalizar ciclo**: habilitado somente quando todas as características têm valor; gera o TXT e oferece download automático pelo navegador

## 4. Geração do Arquivo TXT
- Nome do arquivo no padrão: `{LinhaSemEspacos}_{PB}_{KS}_CAV{Cav}_MAQ{Maq}_{Semana}_OP{Operador}_{YYYYMMDD}_{HHMMSS}.txt`
- Conteúdo com cabeçalho (Máquina, Produto, Semana, Operador, DataHora, Resultado) seguido das características no formato `;` separado
- Download automático via navegador (o operador pode salvar onde quiser, inclusive na pasta de rede se mapeada)

## 5. Histórico (Operador)
- Tabela simples com ciclos finalizados: Linha, Produto, Data/Hora, Chapa, Resultado OK/NOK

## 6. Dashboard de Status (Admin)
- Cards por Linha/Máquina mostrando resultado da última peça medida (OK/NOK), data/hora e resumo dos valores

## 7. Design e UX
- Interface moderna e limpa com cards, chips de status (OK verde / NOK vermelho), ícones
- Navegação lateral com menu diferenciado por perfil
- Responsivo para uso em tablets no chão de fábrica
- Inputs rápidos e validações em tempo real

