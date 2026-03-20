# Adapters (Adaptadores)

O diretório `adapters` é a periferia da nossa aplicação. Ele contém todo o código que interage com tecnologias externas, frameworks e protocolos.

## Responsabilidades
Fazer a tradução entre o formato de dados que o mundo exterior entende e o formato de dados que o nosso `core` (Hexágono) entende.

## Estrutura
- `/in`: Adaptadores que chamam o nosso Core (ex: Controladores HTTP).
- `/out`: Adaptadores que são chamados pelo nosso Core (ex: Repositórios de Banco de Dados).

## Boas Práticas
- Mantenha os adaptadores focados em conversão e roteamento. A lógica de negócio nunca deve residir aqui.