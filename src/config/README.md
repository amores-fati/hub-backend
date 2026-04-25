# Config
 
Este diretório centraliza as configurações de infraestrutura e frameworks utilizados pela aplicação.
 
## Estrutura
 
- `database.config.ts`: Centraliza a montagem das opções de banco usadas pela aplicação.
- `typeorm.datasource.ts`: Expõe o `DataSource` usado pela CLI do TypeORM.
- `typeorm.config.ts`: Arquivo de compatibilidade transitória que reexporta o datasource central.
 
## Boas Práticas
 
- Evite colocar segredos hardcoded aqui. Utilize sempre variáveis de ambiente via `process.env` ou através do `ConfigService` do NestJS.
