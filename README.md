# SmartCitys

### Validação completa da entrega final

O comando `npm.cmd run mobile:test:e2e:final -- --citizen-device SERIAL_CIDADAO --manager-device SERIAL_GESTOR`
valida cadastro/login, ocorrência com foto e GPS, acompanhamento e filtros, alteração de status
pela interface do gestor e push real ao cidadão. Exige dois Androids de testes com o mesmo app
da branch e credenciais dedicadas de gestor. Para development com Metro, acrescente `--dev-client`.
Preparação, cuidados com dados e relatórios: [guia da jornada completa](.maestro/README.md#jornada-completa-da-entrega-final).
Execução aprovada em 22/11/2026: [evidências e limites](docs/tas-evidence/final-2026-11-22/README.md).
Evidências refeitas em 23/11/2026, aguardando o mapa carregado: [novo relatório aprovado](docs/tas-evidence/final-map-2026-11-23/README.md).

Aplicativo mobile para registro e acompanhamento de ocorrências urbanas, com mapa, autenticação Keycloak e acesso para cidadãos e gestores. Este repositório é o fork de testes **SmartCitysComIA**: o monorepo reúne o app React Native/Expo, a API Express e a aba **Assistente**, que fala com o chatbot em um Git separado.

O módulo de IA (AV2, Docker, dados mockados) está em [mattkirzner/chatbot-ia-cidade-conectada](https://github.com/mattkirzner/chatbot-ia-cidade-conectada). Clone os dois lado a lado. Quem só vai avaliar o chatbot não precisa deste repositório.

## Setup local com o assistente

O Expo Go **não abre** este app. Use o APK **development**, um emulador com Google Play (ou um Android USB) e o Metro via `npm.cmd run team:android`. Esse script define `SMARTCITYS_PREBUILT_CLIENT=1` e **não pede** chave do Google Maps. Ele aponta o app para a API local (`http://127.0.0.1:8080`) e o chatbot (`http://127.0.0.1:8000`), e encaminha as portas 8080, 8000 e 8081.

### O que instalar

- Git, **Node.js 22 LTS**, Docker Desktop (containers Linux)
- Android Studio: SDK Platform-Tools (`adb`) e um AVD com imagem **Google Play**
- APK **development 1.0.1** (não o preview): [build](https://expo.dev/accounts/dkartss-team/projects/wb/builds/103030d5-f0d1-4134-a6c2-5f0458cc7931) · [APK direto](https://expo.dev/artifacts/eas/X8BhvkN_iwkHaEMfyyRaXxkLemRMIEputo8E9gJHU_c.apk)

Arraste o APK para o emulador. Os pacotes preview e development são o mesmo (`com.darkartsbm.smartcitys`): um substitui o outro. Deixe **um** Android autorizado em `adb devices`.

### Subir na primeira vez

Pastas irmãs, por exemplo `SmartCitysComIA` e `chatbot-ia-cidade-conectada`.

```powershell
git clone https://github.com/mattkirzner/SmartCitysComIA.git
cd SmartCitysComIA
npm.cmd ci
```

Terminal 1 — API:

```powershell
npm.cmd run team:backend -- up
curl.exe http://127.0.0.1:8080/health
```

Terminal 2 — chatbot (no outro clone), para o app ler ocorrências reais:

```powershell
copy .env.example .env
```

No `.env`, `DATA_SOURCE=http` e `GROQ_API_KEY` preenchida. Depois:

```powershell
docker compose up --build
curl.exe http://localhost:8000/health
```

Terminal 3 — emulador já aberto, APK development instalado:

```powershell
$env:NODE_OPTIONS = "--dns-result-order=ipv4first"
npm.cmd run team:android
```

`NODE_OPTIONS` faz o Metro escutar em `127.0.0.1` (IPv4). Sem isso, no Windows ele costuma ficar só em `[::1]:8081` e o emulador falha. Confira: `netstat -ano | findstr :8081` deve listar `127.0.0.1:8081`.

Crie a conta no Keycloak pela tela de registro do app (papel `cidadao`). A aba **Assistente** envia o token e o histórico a `POST /chat`. O modelo não grava ocorrência: o rascunho abre **Nova ocorrência** e o envio continua no Salvar.

A API compartilhada da equipe (`https://api.darkartsbm.com`) fica em `npm.cmd run team:android:shared` e **não** encaminha a porta do chatbot.

### Comandos da API local

| Serviço | Endereço |
|---|---|
| Gateway | `http://127.0.0.1:8080` |
| Chatbot | `http://127.0.0.1:8000` |
| PostgreSQL de desenvolvimento | `127.0.0.1:5433`, banco `smartcitys_dev` |
| PostgreSQL de testes | `127.0.0.1:5434`, banco `smartcitys_test` |

```powershell
npm.cmd run team:backend -- logs
npm.cmd run team:backend -- migrate
npm.cmd run team:backend -- test
npm.cmd run team:backend -- down
```

No backend local o push real fica desativado. Guia completo da equipe: [docs/team-development.md](docs/team-development.md).

## Troubleshooter (Metro e emulador)

Estes casos apareceram ao ligar o fork no Android Studio. Deixe o terminal do Metro aberto enquanto testa.

**Expo Go / tecla `s`.** Este projeto usa `expo-dev-client`, mapa, câmera e notificações. O Expo Go não carrega. Não pressione `s` no Metro.

**`GOOGLE_MAPS_ANDROID_API_KEY` ao subir o Metro.** Você não passou por `team:android`. Esse script define `SMARTCITYS_PREBUILT_CLIENT=1` e remove a chave. Use `npm.cmd run team:android`, não `npx expo start --host lan` solto.

**`unexpected end of stream` em `http://127.0.0.1:8081`.** O app abriu a porta e a resposta veio vazia. Quase sempre o Metro está só em `[::1]:8081`. Rode de novo com `$env:NODE_OPTIONS = "--dns-result-order=ipv4first"`. Enquanto o Metro estiver no ar, uma ponte IPv4 temporária:

```powershell
node -e "const net=require('net'); const s=net.createServer(c=>{ const u=net.connect({host:'::1',port:8081}); c.pipe(u); u.pipe(c); const x=()=>{c.destroy();u.destroy()}; c.on('error',x); u.on('error',x); }); s.listen(8081,'127.0.0.1',()=>console.log('ponte pronta'));"
```

No Chrome do computador, `http://127.0.0.1:8081` deve devolver JSON. No cliente de desenvolvimento do emulador, conecte em `http://127.0.0.1:8081`. O terminal do Metro passa a mostrar Bundling.

**`Failed to connect to /10.0.2.2:8081`.** `team:android` usa `--localhost`; o Metro não escuta no adaptador que o `10.0.2.2` alcança. Volte para `127.0.0.1:8081` com o `adb reverse` (o script já faz isso).

**`No apps connected` ao pressionar `r`.** O JavaScript ainda não entrou no emulador. Ignore o reload até o Bundling aparecer. Feche o SmartCitys, abra de novo o ícone development e conecte em `http://127.0.0.1:8081`.

**Abertura automática falha, mas o Metro está em pé.** `team:android` passa `--android` e tenta abrir o deep link na hora. Se o túnel ainda não estiver pronto, ignore o erro Java, deixe o terminal aberto e conecte na tela do cliente de desenvolvimento.

**Mais de um Android.** O script exige um único `device` em `adb devices`. Feche o outro emulador ou desconecte o celular.

**`adb reverse` listado, mas o Chrome no emulador não abre `127.0.0.1:8081`.** Recrie o servidor ADB e o túnel:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" kill-server
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" start-server
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" reverse tcp:8081 tcp:8081
```

**Assistente não responde.** Confira o container do chatbot, `DATA_SOURCE=http`, `GROQ_API_KEY` e `adb reverse --list` com `tcp:8000`. Recarregue o app depois que o chatbot estiver saudável.

## Declaração de uso de IA generativa na versão com chatbot de IA

Este módulo e a adaptação da AV2 foram escritos com apoio de assistente de código (Cursor) usando Grok 4.6 e Grok 4.7. Os dados são fictícios. A classificação em linguagem natural, quando usada, passa pela API do Groq; a demonstração da AV2 usa só regras e o JSON versionado. Não tratei dados pessoais. Revisei o que foi feito e sou completamente responsável pelo resultado.

## Estado do projeto — 22/11/2026

O MVP Android está disponível para testes internos na versão **1.0.1**. O backend está publicado na AWS com API HTTPS e PostgreSQL de ocorrências no RDS; a antiga migração Supabase → RDS já foi realizada. A autenticação utiliza o realm de testes do Keycloak.

O ambiente de desenvolvimento da equipe já está integrado à `main`: cada integrante usa sua própria conta e pode alterar o app e executar o backend com banco/cache locais, sem receber credenciais privadas AWS ou Firebase Admin.

| Recurso | Endereço / situação |
|---|---|
| API compartilhada de testes | [https://api.darkartsbm.com](https://api.darkartsbm.com) |
| Saúde da API | [https://api.darkartsbm.com/health](https://api.darkartsbm.com/health) |
| Keycloak | [Realm smartcitys-test](https://auth.darkartsbm.com/realms/smartcitys-test) |
| Projeto Expo | [@dkartss-team/wb](https://expo.dev/accounts/dkartss-team/projects/wb) |
| Acompanhamento | [Projeto 5 SmartCity — Trello](https://trello.com/b/KaOhR9dk/projeto-5-smartcity) |

Este é o estado documentado a partir das implementações e validações registradas. Não representa monitoramento contínuo dos serviços nem homologação de produção.

## Qual APK instalar?

| Perfil | Uso | Download |
|---|---|---|
| **Preview 1.0.1** | Avaliar o app pronto, sem Metro ou código-fonte na máquina do avaliador | [Build preview](https://expo.dev/accounts/dkartss-team/projects/wb/builds/c8a701fc-095a-4abe-8dd3-0ad28a0daf67) |
| **Development 1.0.1** | Programar e carregar o código do computador pelo Metro | [Build development](https://expo.dev/accounts/dkartss-team/projects/wb/builds/103030d5-f0d1-4134-a6c2-5f0458cc7931) · [APK direto](https://expo.dev/artifacts/eas/X8BhvkN_iwkHaEMfyyRaXxkLemRMIEputo8E9gJHU_c.apk) |

O development foi concluído e sua assinatura, versão e presença do cliente Expo foram conferidas. Ele permite HTTP de desenvolvimento para a API local. O primeiro ensaio completo em uma máquina da equipe ainda precisa ser registrado.

Os dois perfis usam o pacote `com.darkartsbm.smartcitys`; não ficam instalados lado a lado como aplicativos distintos. Prefira um emulador dedicado ao development para preservar o preview de avaliação. O preview não carrega o código local pelo Metro.

Android é a plataforma validada para o piloto. A configuração iOS existe, mas assinatura, build, distribuição e aceite no iPhone continuam pendentes. Não há distribuição de produção nas lojas configurada neste fluxo.

Como contribuir: [CONTRIBUTING.md](CONTRIBUTING.md), [AGENTS.md](AGENTS.md) e [docs/team-development.md](docs/team-development.md). Para migration: `npm.cmd run team:backend -- migration nome_da_mudanca`.

## Funcionalidades implementadas

- Login e registro pelo Keycloak, com Authorization Code/PKCE, restauração de sessão, renovação de token e SecureStore.
- Mapa Android com Google Maps, localização em primeiro plano, recentralização e tratamento de permissões.
- Listagem e feed de ocorrências, pesquisa textual e filtros locais.
- Criação de ocorrência com endereço **ou** coordenadas GPS e captura de foto.
- Edição e exclusão das ocorrências abertas do cidadão autenticado.
- Painel do gestor na navegação inferior, mantendo também as funções de cidadão.
- Listagem e detalhes para gestão, com alteração de status e prioridade autorizada pela API.
- Notificações de mudança de status via Expo/FCM, com controle de permissão nas configurações do Android.
- Aba Assistente: conversa com o chatbot, consulta de ocorrências e rascunho no formulário (serviço em repositório separado).
- Tema claro/escuro e componentes com GlueStack/NativeWind.
- Perfis EAS development/preview e atualização OTA Android compatível com o runtime instalado.

A lista do cidadão percorre as páginas da API e aplica pesquisa/status localmente ao conjunto carregado. Se qualquer página falhar, mantém a lista anterior e mostra o erro. Esse carregamento pode ficar mais lento com muitas ocorrências e fotos; filtros/paginação sob demanda no servidor continuam como evolução. O feed do mapa ainda mostra até 100 registros recentes.

## Entrega final Android

A [documentação OpenAPI 3.0.3](docs/api/openapi.json) descreve as rotas atuais, autenticação, papéis, corpos, paginação e respostas. Importe o arquivo no Postman/Insomnia ou abra no Swagger Editor. As instruções de banco e variáveis estão no [README da API](apps/backend/README.md); o [exemplo público do app](apps/mobile/.env.team.example) é usado pelo atalho de desenvolvimento. O [exemplo para compilação própria](apps/mobile/.env.example) contém os nomes das variáveis nativas Maps/Firebase exigidas pelo EAS; seus valores ficam fora do Git.

### Android físico no Linux

Com Node.js 22, Android SDK Platform-Tools e o APK development instalados, conecte um celular com depuração USB, autorize o computador e execute na raiz:

```bash
adb devices
npm ci
npm run team:android
```

Mantenha apenas um Android autorizado conectado e o Metro aberto. Para a API local, execute `npm run team:backend -- up` em outro terminal e use `npm run team:android:local`. Docker Engine com Compose no Linux atende a stack; não é necessário iniciar um emulador. Na API local, o envio real de push fica desativado.

As alterações desta branch só aparecem no development carregando este código. A versão preview publicada tem seu próprio bundle/OTA e precisa ser distribuída e validada pelo responsável após integração. Não foi gerado um novo APK nesta revisão.

## Arquitetura

O mobile segue MVVM: telas apresentam os dados; hooks/ViewModels controlam estado e ações; serviços encapsulam API, autenticação, GPS, câmera e armazenamento. A composição conecta essas dependências.

O fluxo principal é:

`App → API Gateway → Demand / Metrics → PostgreSQL e cache/eventos`

O Keycloak emite os tokens; a API verifica assinatura e permissões. O cliente mobile é público e não usa `client_secret`.

```text
apps/
  mobile/
    app/                      Rotas do Expo Router
    src/features/
      auth/                   Login e sessão
      location/               GPS e permissões
      map/                    Mapa e localização
      occurrences/            CRUD, listagem e feed
      manager/                Painel do gestor
      chat/                   Assistente (POST /chat)
      notifications/          Registro e entrega de push
    src/composition/          Montagem das dependências
    src/shared/               HTTP e utilitários
    app.config.ts             Configuração dinâmica do Expo
    eas.json                  Perfis development e preview
  backend/
    api-gateway/              Entrada HTTPS por proxy no servidor
    demand-service/           Ocorrências, permissões e push
    metrics-service/          Métricas, cache e eventos
    compose.team.yml          Stack local da equipe
scripts/                      Atalhos de desenvolvimento
.maestro/                     Fluxos E2E Android
.github/                      Workflows, manutenção da TAS e relatórios
docs/                         Guias da equipe e política de testes
packages/                     Espaço para módulos compartilhados
```

Stack principal: Expo 57, React Native 0.86, React 19, TypeScript, Expo Router, Expo Location/Camera/Notifications, React Native Maps, GlueStack/NativeWind; Express, Prisma, PostgreSQL e Redis no backend.

A versão do app é `1.0.1`, o scheme é `wb` e o callback é `wb://auth/callback`. As versões exatas das dependências estão nos respectivos `package.json` e lockfiles.

## Infraestrutura e operação

O backend compartilhado executa os três serviços em containers na EC2 e utiliza RDS para os dados de ocorrências. O Compose específico da AWS é uma configuração operacional do servidor; ele não está versionado neste checkout. Para desenvolvimento, use `compose.team.yml`.

Os serviços utilizam cache e comunicação compatíveis com Redis. A topologia e a configuração atuais de Redis/Valkey na AWS devem ser confirmadas no inventário operacional; o Compose local utiliza Redis.

Fotos ainda são transmitidas como base64 e persistidas como texto no fluxo atual. **O armazenamento de fotos no S3 ainda não foi implementado.** Essa evolução exige envio, autorização de leitura, referências no banco e tratamento das imagens existentes.

Alterar uma branch local não publica o backend na AWS. Deploy, migrations do RDS e configuração dos serviços compartilhados continuam sob responsabilidade de quem administra a infraestrutura.

## Git, publicação e atualizações

1. Desenvolva em uma branch própria e execute os testes aplicáveis.
2. Abra uma PR para a `main`; as contribuições dos colegas exigem revisão do Code Owner conforme os rulesets. Os testes continuam obrigatórios nas PRs do responsável.
3. Depois da integração, publique backend/migrations na AWS quando houver mudanças que exijam isso.
4. Para mudanças JavaScript/assets compatíveis, o workflow pode publicar OTA no canal `preview` após os testes. A verificação é conservadora e pausa a publicação diante de alterações de backend, dependências ou configuração nativa.
5. Mudanças nativas exigem novo APK compatível. Um push na `main` **não gera automaticamente um novo APK**.

O runtime acompanha `appVersion`. Não atualize `EXPO_PREVIEW_BASE_SHA` antes de validar o estado correspondente do APK e da API. Consulte [distribuição Android e OTA](apps/mobile/RELEASE-PREVIEW.md).

## Testes e manutenção da TAS

```powershell
npm.cmd run mobile:test
npm.cmd run mobile:lint
npm.cmd run mobile:test:coverage
npm.cmd run team:backend -- test
```

| Automação | Execução / finalidade |
|---|---|
| Testes unitários | Pushes de branches e PRs para `main`; check `Unitários e componentes` |
| Ambiente local da equipe | PRs com mudanças pertinentes; sobe a stack, aplica migrations e testa a API em bancos locais |
| Regressão completa | Diariamente às 00h de Brasília (03h UTC) e manualmente; Jest, API e Maestro |
| Manutenção da TAS | Eventos de issues e dias úteis às 9h de Brasília (12h UTC); acompanhamento conforme a política |

Os horários estão sujeitos à fila do GitHub Actions. A rotina de manutenção das issues e a execução da regressão são automações diferentes.

Na validação registrada em 19/11/2026, passaram **55 testes mobile e 26 testes da API**; seis testes de filtros avançados da suíte existente permanecem desativados. A [CI da stack local](https://github.com/Lobiroka/SmartCitys/actions/runs/44577588376) validou banco novo, reaplicação de migrations e saúde dos serviços. Isso não substitui o primeiro onboarding completo em um computador da equipe.

Na revisão local de 22/11/2026 desta entrega, passaram **64 testes mobile**, **39 testes da API** e os **34 testes dos scripts de automação**. Os seis testes de filtros avançados continuam ignorados. Lint, checagem TypeScript mobile, compilação TypeScript do Demand Service, validação da especificação OpenAPI e verificação do diff passaram. A API foi testada em PostgreSQL local isolado, com push simulado. Não houve execução Android nem geração de APK nesta revisão; o novo roteiro Maestro de foto/GPS ainda precisa ser executado no aparelho.

A declaração de CSS está em `apps/mobile/global.d.ts`. A checagem de tipos pode ser executada separadamente com `npx tsc --project apps/mobile/tsconfig.json --noEmit`.

- [Política de manutenção da TAS](docs/tas.md)
- [Evidências da TAS](docs/tas-evidencias.md)
- [Execução E2E com Maestro](.maestro/README.md)
- [Contrato OpenAPI](docs/api/openapi.json)
- [Testes de API](apps/backend/demand-service/README-TEST.md)

## Credenciais e proteção da equipe

- Cada integrante usa sua conta Keycloak. O papel gestor é concedido pelo responsável e validado no backend.
- Não compartilhe credenciais IAM, chave SSH, senha do RDS, keystore, tokens de publicação ou JSON privado Firebase Admin.
- A configuração Firebase cliente e a chave Android do Maps fazem parte do aplicativo e podem ser extraídas. A chave Maps deve permanecer restrita ao pacote, certificado e APIs autorizados.
- Arquivos `.env*.local` e credenciais geradas no computador não devem ser versionados.
- A API compartilhada contém dados comuns de testes; não é um ambiente individual por integrante.

**Proteção da CI ainda pendente:** na última conferência, `EXPO_TOKEN`, `GOOGLE_MAPS_ANDROID_API_KEY`, `E2E_USERNAME` e `E2E_PASSWORD` estavam em Repository secrets. Quem tem escrita pode usá-los por workflows próprios; proteger o merge da main não isola esses secrets.

A [PR #24, em rascunho](https://github.com/Lobiroka/SmartCitys/pull/24), prepara os jobs para o Environment `ci-main`, restrito somente à branch `main`. O novo token de publicação e as credenciais E2E ainda precisam ser recriados e cadastrados. Após validar a migração, remover as cópias do nível do repositório. O token de publicação deve ficar separado do token de push da EC2 para preservar as notificações.

O procedimento e a ordem de ativação estão no [guia da equipe](docs/team-development.md#7-proteger-também-os-secrets-da-automação). A proteção ainda não deve ser considerada concluída.

## Próximos passos

- [ ] Configurar `ci-main`, recriar as credenciais da automação, validar e concluir a PR #24.
- [ ] Realizar e registrar o primeiro uso do development com API compartilhada e API local em uma máquina da equipe.
- [ ] Instalar Docker Desktop nas máquinas que executarão o backend local.
- [x] Corrigir a declaração TypeScript do CSS.
- [ ] Validar no Android o cadastro novo, foto/GPS, filtros, gestão pelas telas, push real e APK preview sem Metro.
- [ ] Evoluir o armazenamento de fotos para S3 e tratar imagens antigas.
- [x] Percorrer as páginas na lista do cidadão para pesquisar também além dos primeiros 100 registros.
- [ ] Evoluir filtros avançados e paginação sob demanda no servidor.
- [ ] Integrar e validar o mapa de calor e o processamento de dados como evolução separada da stack principal.
- [ ] Compilar, assinar e homologar iOS, além de planejar a distribuição de produção.
- [ ] Manter o inventário operacional, os backups e os ensaios de restauração documentados.
