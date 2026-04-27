# Config
 
Este diretório centraliza as configurações de infraestrutura e frameworks utilizados pela aplicação.
 
## Estrutura
 
- `typeorm.config.ts`: Define a conexão com o banco de dados PostgreSQL, incluindo o carregamento de entidades e a configuração de migrations.
 
## Boas Práticas
 
- Evite colocar segredos hardcoded aqui. Utilize sempre variáveis de ambiente via `process.env` ou através do `ConfigService` do NestJS.
