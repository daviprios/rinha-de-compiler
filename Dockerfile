FROM oven/bun

COPY . .
RUN bun i

CMD bun run ./src/index.ts /var/rinha/source.rinha.json