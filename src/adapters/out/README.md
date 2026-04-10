# Adapters Out (Adaptadores de Saída / Driven)

Os adaptadores de saída são implementações concretas das interfaces definidas no `core/ports`. Eles são "acionados" pelo Core para realizar tarefas de infraestrutura.

## Responsabilidades

- Comunicação com Banco de Dados (ex: Repositórios TypeORM).
- Comunicação com APIs externas (ex: cliente HTTP para a API do GitHub ou uma API de pagamentos).
- Envio de mensagens para filas ou sistemas de email.

## Boas Práticas

- Crie "Entidades de Banco de Dados" (`@Entity()` do TypeORM) estritamente dentro desta pasta.
- Sempre crie métodos de "Mapeamento" (Mappers) para converter uma entidade do TypeORM para uma entidade do Domínio (`core/domain`) antes de retornar a informação para os `services`.

## O que NÃO fazer

- Não permita que bibliotecas de terceiros (como tipos do TypeORM, Axios ou AWS SDK) "vazem" no retorno dos métodos. O contrato de retorno deve ser sempre o que a porta (`core/ports`) exige.
- Não chame um adaptador de saída a partir de um adaptador de entrada (ex: um Controller chamando o Repositório diretamente). Todo fluxo deve passar pelo Core.
