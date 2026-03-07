CREATE TABLE
  `_migrations` (
    file VARCHAR(255) PRIMARY KEY NOT NULL,
    applied INTEGER NOT NULL
  );

CREATE TABLE
  `_params` (
    `id` TEXT PRIMARY KEY DEFAULT ('r' || lower(hex (randomblob (7)))) NOT NULL,
    `value` JSON DEFAULT NULL,
    `created` TEXT DEFAULT (strftime ('%Y-%m-%d %H:%M:%fZ')) NOT NULL,
    `updated` TEXT DEFAULT (strftime ('%Y-%m-%d %H:%M:%fZ')) NOT NULL
  );

CREATE TABLE
  `_collections` (
    `id` TEXT PRIMARY KEY DEFAULT ('r' || lower(hex (randomblob (7)))) NOT NULL,
    `system` BOOLEAN DEFAULT FALSE NOT NULL,
    `type` TEXT DEFAULT "base" NOT NULL,
    `name` TEXT UNIQUE NOT NULL,
    `fields` JSON DEFAULT "[]" NOT NULL,
    `indexes` JSON DEFAULT "[]" NOT NULL,
    `listRule` TEXT DEFAULT NULL,
    `viewRule` TEXT DEFAULT NULL,
    `createRule` TEXT DEFAULT NULL,
    `updateRule` TEXT DEFAULT NULL,
    `deleteRule` TEXT DEFAULT NULL,
    `options` JSON DEFAULT "{}" NOT NULL,
    `created` TEXT DEFAULT (strftime ('%Y-%m-%d %H:%M:%fZ')) NOT NULL,
    `updated` TEXT DEFAULT (strftime ('%Y-%m-%d %H:%M:%fZ')) NOT NULL
  );

CREATE INDEX idx__collections_type on `_collections` (`type`);

CREATE TABLE
  `_mfas` (
    `collectionRef` TEXT DEFAULT '' NOT NULL,
    `created` TEXT DEFAULT '' NOT NULL,
    `id` TEXT PRIMARY KEY DEFAULT ('r' || lower(hex (randomblob (7)))) NOT NULL,
    `method` TEXT DEFAULT '' NOT NULL,
    `recordRef` TEXT DEFAULT '' NOT NULL,
    `updated` TEXT DEFAULT '' NOT NULL
  );

CREATE INDEX `idx_mfas_collectionRef_recordRef` ON `_mfas` (`collectionRef`, `recordRef`);

CREATE TABLE
  sqlite_stat1 (tbl, idx, stat);

CREATE TABLE
  sqlite_stat4 (tbl, idx, neq, nlt, ndlt, sample);

CREATE TABLE
  `_otps` (
    `collectionRef` TEXT DEFAULT '' NOT NULL,
    `created` TEXT DEFAULT '' NOT NULL,
    `id` TEXT PRIMARY KEY DEFAULT ('r' || lower(hex (randomblob (7)))) NOT NULL,
    `password` TEXT DEFAULT '' NOT NULL,
    `recordRef` TEXT DEFAULT '' NOT NULL,
    `sentTo` TEXT DEFAULT '' NOT NULL,
    `updated` TEXT DEFAULT '' NOT NULL
  );

CREATE INDEX `idx_otps_collectionRef_recordRef` ON `_otps` (`collectionRef`, `recordRef`);

CREATE TABLE
  `_externalAuths` (
    `collectionRef` TEXT DEFAULT '' NOT NULL,
    `created` TEXT DEFAULT '' NOT NULL,
    `id` TEXT PRIMARY KEY DEFAULT ('r' || lower(hex (randomblob (7)))) NOT NULL,
    `provider` TEXT DEFAULT '' NOT NULL,
    `providerId` TEXT DEFAULT '' NOT NULL,
    `recordRef` TEXT DEFAULT '' NOT NULL,
    `updated` TEXT DEFAULT '' NOT NULL
  );

CREATE UNIQUE INDEX `idx_externalAuths_record_provider` ON `_externalAuths` (`collectionRef`, `recordRef`, `provider`);

CREATE UNIQUE INDEX `idx_externalAuths_collection_provider` ON `_externalAuths` (`collectionRef`, `provider`, `providerId`);

CREATE TABLE
  `_authOrigins` (
    `collectionRef` TEXT DEFAULT '' NOT NULL,
    `created` TEXT DEFAULT '' NOT NULL,
    `fingerprint` TEXT DEFAULT '' NOT NULL,
    `id` TEXT PRIMARY KEY DEFAULT ('r' || lower(hex (randomblob (7)))) NOT NULL,
    `recordRef` TEXT DEFAULT '' NOT NULL,
    `updated` TEXT DEFAULT '' NOT NULL
  );

CREATE UNIQUE INDEX `idx_authOrigins_unique_pairs` ON `_authOrigins` (`collectionRef`, `recordRef`, `fingerprint`);

CREATE TABLE
  `_superusers` (
    `created` TEXT DEFAULT '' NOT NULL,
    `email` TEXT DEFAULT '' NOT NULL,
    `emailVisibility` BOOLEAN DEFAULT FALSE NOT NULL,
    `id` TEXT PRIMARY KEY DEFAULT ('r' || lower(hex (randomblob (7)))) NOT NULL,
    `password` TEXT DEFAULT '' NOT NULL,
    `tokenKey` TEXT DEFAULT '' NOT NULL,
    `updated` TEXT DEFAULT '' NOT NULL,
    `verified` BOOLEAN DEFAULT FALSE NOT NULL
  );

CREATE UNIQUE INDEX `idx_tokenKey_pbc_3142635823` ON `_superusers` (`tokenKey`);

CREATE UNIQUE INDEX `idx_email_pbc_3142635823` ON `_superusers` (`email`)
WHERE
  `email` != '';

CREATE TABLE
  `missao` (
    `created` TEXT DEFAULT '' NOT NULL,
    `criterio` TEXT DEFAULT '' NOT NULL,
    `id` TEXT PRIMARY KEY DEFAULT ('r' || lower(hex (randomblob (7)))) NOT NULL,
    `missao` TEXT DEFAULT '' NOT NULL,
    `pontos` NUMERIC DEFAULT 0 NOT NULL,
    `updated` TEXT DEFAULT '' NOT NULL,
    `validade` NUMERIC DEFAULT 0 NOT NULL,
    "categoria" TEXT DEFAULT '' NOT NULL,
    "automatico" BOOLEAN DEFAULT FALSE NOT NULL
  );

CREATE TABLE
  `relacao` (
    `created` TEXT DEFAULT '' NOT NULL,
    `id` TEXT PRIMARY KEY DEFAULT ('r' || lower(hex (randomblob (7)))) NOT NULL,
    `nome` TEXT DEFAULT '' NOT NULL,
    `updated` TEXT DEFAULT '' NOT NULL
  );

CREATE TABLE
  `nivel` (
    `created` TEXT DEFAULT '' NOT NULL,
    `id` TEXT PRIMARY KEY DEFAULT ('r' || lower(hex (randomblob (7)))) NOT NULL,
    `updated` TEXT DEFAULT '' NOT NULL,
    "nome" TEXT DEFAULT '' NOT NULL,
    "de_pontos" NUMERIC DEFAULT 0 NOT NULL,
    "ate_pontos" NUMERIC DEFAULT 0 NOT NULL
  );

CREATE UNIQUE INDEX `idx_twIZzE54Sn` ON `nivel` (`nome`);

CREATE TABLE
  `unidade` (
    `created` TEXT DEFAULT '' NOT NULL,
    `id` TEXT PRIMARY KEY DEFAULT ('r' || lower(hex (randomblob (7)))) NOT NULL,
    `nome` TEXT DEFAULT '' NOT NULL,
    `updated` TEXT DEFAULT '' NOT NULL
  );

CREATE UNIQUE INDEX `idx_lIjUTNaBCE` ON `unidade` (`nome`);

CREATE TABLE
  `usuario` (
    `administrador` BOOLEAN DEFAULT FALSE NOT NULL,
    `coletor` BOOLEAN DEFAULT FALSE NOT NULL,
    `cpf` TEXT DEFAULT '' NOT NULL,
    `created` TEXT DEFAULT '' NOT NULL,
    `email` TEXT DEFAULT '' NOT NULL,
    `emailVisibility` BOOLEAN DEFAULT FALSE NOT NULL,
    `embaixador` BOOLEAN DEFAULT FALSE NOT NULL,
    `id` TEXT PRIMARY KEY DEFAULT ('r' || lower(hex (randomblob (7)))) NOT NULL,
    `nascimento` TEXT DEFAULT '' NOT NULL,
    `nome` TEXT DEFAULT '' NOT NULL,
    `observacao` TEXT DEFAULT '' NOT NULL,
    `password` TEXT DEFAULT '' NOT NULL,
    `prontuario` TEXT DEFAULT '' NOT NULL,
    `sexo` TEXT DEFAULT '' NOT NULL,
    `telefone` TEXT DEFAULT '' NOT NULL,
    `tokenKey` TEXT DEFAULT '' NOT NULL,
    `updated` TEXT DEFAULT '' NOT NULL,
    `verified` BOOLEAN DEFAULT FALSE NOT NULL,
    "unidade" TEXT DEFAULT '' NOT NULL,
    "nivel" TEXT DEFAULT '' NOT NULL,
    `tipo` TEXT DEFAULT '' NOT NULL
  );

CREATE TABLE
  `produto` (
    `created` TEXT DEFAULT '' NOT NULL,
    `id` TEXT PRIMARY KEY DEFAULT ('r' || lower(hex (randomblob (7)))) NOT NULL,
    `nome` TEXT DEFAULT '' NOT NULL,
    `pontos` NUMERIC DEFAULT 0 NOT NULL,
    `updated` TEXT DEFAULT '' NOT NULL,
    "categoria" TEXT DEFAULT '' NOT NULL,
    "descricao" TEXT DEFAULT '' NOT NULL,
    `foto` JSON DEFAULT '[]' NOT NULL
  );

CREATE TABLE
  IF NOT EXISTS "fluxo" (
    `created` TEXT DEFAULT '' NOT NULL,
    `custo_unitario` NUMERIC DEFAULT 0 NOT NULL,
    `id` TEXT PRIMARY KEY DEFAULT ('r' || lower(hex (randomblob (7)))) NOT NULL,
    `observacao` TEXT DEFAULT '' NOT NULL,
    "produto" TEXT DEFAULT '' NOT NULL,
    `quantidade` NUMERIC DEFAULT 0 NOT NULL,
    `updated` TEXT DEFAULT '' NOT NULL,
    "unidade" TEXT DEFAULT '' NOT NULL,
    "tipo" TEXT DEFAULT '' NOT NULL
  );

CREATE TABLE
  `pedido` (
    `created` TEXT DEFAULT '' NOT NULL,
    `id` TEXT PRIMARY KEY DEFAULT ('r' || lower(hex (randomblob (7)))) NOT NULL,
    "pontos" NUMERIC DEFAULT 0 NOT NULL,
    `status` TEXT DEFAULT '' NOT NULL,
    `updated` TEXT DEFAULT '' NOT NULL,
    "usuario" TEXT DEFAULT '' NOT NULL,
    `item` JSON DEFAULT '[]' NOT NULL,
    "observacao" TEXT DEFAULT '' NOT NULL
  );

CREATE TABLE
  `indicacao` (
    `created` TEXT DEFAULT '' NOT NULL,
    `id` TEXT PRIMARY KEY DEFAULT ('r' || lower(hex (randomblob (7)))) NOT NULL,
    `nome` TEXT DEFAULT '' NOT NULL,
    "relacao" TEXT DEFAULT '' NOT NULL,
    `telefone` TEXT DEFAULT '' NOT NULL,
    `updated` TEXT DEFAULT '' NOT NULL,
    "usuario_embaixador" TEXT DEFAULT '' NOT NULL,
    "usuario_coletor" TEXT DEFAULT '' NOT NULL
  );

CREATE TABLE
  `desejo` (
    `created` TEXT DEFAULT '' NOT NULL,
    `id` TEXT PRIMARY KEY DEFAULT ('r' || lower(hex (randomblob (7)))) NOT NULL,
    "produto" TEXT DEFAULT '' NOT NULL,
    `updated` TEXT DEFAULT '' NOT NULL,
    "usuario" TEXT DEFAULT '' NOT NULL
  );

CREATE TABLE
  IF NOT EXISTS "item" (
    `created` TEXT DEFAULT '' NOT NULL,
    `id` TEXT PRIMARY KEY DEFAULT ('r' || lower(hex (randomblob (7)))) NOT NULL,
    `pontos` NUMERIC DEFAULT 0 NOT NULL,
    "produto" TEXT DEFAULT '' NOT NULL,
    `quantidade` NUMERIC DEFAULT 0 NOT NULL,
    `updated` TEXT DEFAULT '' NOT NULL
  );

CREATE TABLE
  `transacao` (
    `created` TEXT DEFAULT '' NOT NULL,
    `id` TEXT PRIMARY KEY DEFAULT ('r' || lower(hex (randomblob (7)))) NOT NULL,
    "missao" TEXT DEFAULT '' NOT NULL,
    "pedido" TEXT DEFAULT '' NOT NULL,
    `saldo` NUMERIC DEFAULT 0 NOT NULL,
    `updated` TEXT DEFAULT '' NOT NULL,
    "transacao" TEXT DEFAULT '' NOT NULL,
    "usuario" TEXT DEFAULT '' NOT NULL,
    "usuario_responsavel" TEXT DEFAULT '' NOT NULL,
    "tipo" TEXT DEFAULT '' NOT NULL,
    "observacao" TEXT DEFAULT '' NOT NULL,
    "valor" NUMERIC DEFAULT 0 NOT NULL,
    "indicacao" TEXT DEFAULT '' NOT NULL
  );

CREATE TABLE
  IF NOT EXISTS "tema" (
    `id` TEXT PRIMARY KEY DEFAULT ('r' || lower(hex (randomblob (7)))) NOT NULL,
    "primary" TEXT DEFAULT '' NOT NULL,
    "banner" TEXT DEFAULT '' NOT NULL,
    "logo" TEXT DEFAULT '' NOT NULL,
    `banners_secundarios` JSON DEFAULT '[]' NOT NULL,
    "icone" TEXT DEFAULT '' NOT NULL,
    "email" TEXT DEFAULT '' NOT NULL,
    "telefone" TEXT DEFAULT '' NOT NULL,
    "whatsapp" TEXT DEFAULT '' NOT NULL,
    "facebook" TEXT DEFAULT '' NOT NULL,
    "tiktok" TEXT DEFAULT '' NOT NULL,
    "youtube" TEXT DEFAULT '' NOT NULL,
    "instagram" TEXT DEFAULT '' NOT NULL,
    "informacao" JSON DEFAULT NULL,
    "regulamento" TEXT DEFAULT '' NOT NULL,
    "periodo" TEXT DEFAULT '' NOT NULL,
    "webhook" TEXT DEFAULT '' NOT NULL
  );

CREATE TABLE
  IF NOT EXISTS "catalogo" (
    `created` TEXT DEFAULT '' NOT NULL,
    `id` TEXT PRIMARY KEY DEFAULT ('r' || lower(hex (randomblob (7)))) NOT NULL,
    `produto` TEXT DEFAULT '' NOT NULL,
    `unidade` TEXT DEFAULT '' NOT NULL,
    `updated` TEXT DEFAULT '' NOT NULL,
    "ativo" BOOLEAN DEFAULT FALSE NOT NULL
  );

CREATE TABLE
  `categoria` (
    `created` TEXT DEFAULT '' NOT NULL,
    `id` TEXT PRIMARY KEY DEFAULT ('r' || lower(hex (randomblob (7)))) NOT NULL,
    `updated` TEXT DEFAULT '' NOT NULL,
    "nome" TEXT DEFAULT '' NOT NULL,
    "foto" TEXT DEFAULT '' NOT NULL
  );

CREATE UNIQUE INDEX `idx_vn9Jm644oM` ON `categoria` (`nome`);

CREATE UNIQUE INDEX `idx_TinCAX7RnV` ON `desejo` (`produto`, `usuario`);

CREATE UNIQUE INDEX `idx_SqftDwQymZ` ON `produto` (`nome`);

CREATE UNIQUE INDEX `idx_0KWG4dG8Xg` ON `catalogo` (`produto`, `unidade`);

CREATE VIEW
  `estoque` AS
SELECT
  *
FROM
  (
    SELECT
      c.id,
      c.produto AS produto_id,
      pr.nome AS produto_nome,
      pr.pontos AS produto_pontos,
      pr.foto AS produto_foto,
      pr.categoria AS produto_categoria,
      c.unidade AS unidade_id,
      u.nome AS unidade_nome,
      c.ativo,
      CAST(
        COALESCE(SUM(IIF (f.tipo = 'ENTRADA', f.quantidade, 0)), 0) AS REAL
      ) AS entrada,
      CAST(
        COALESCE(SUM(IIF (f.tipo = 'SAIDA', f.quantidade, 0)), 0) AS REAL
      ) AS saida,
      CAST(
        (
          COALESCE(SUM(IIF (f.tipo = 'ENTRADA', f.quantidade, 0)), 0) - COALESCE(SUM(IIF (f.tipo = 'SAIDA', f.quantidade, 0)), 0)
        ) AS REAL
      ) AS quantidade
    FROM
      catalogo c
      LEFT JOIN produto pr ON pr.id = c.produto
      LEFT JOIN unidade u ON u.id = c.unidade
      LEFT JOIN fluxo f ON f.produto = c.produto
      AND f.unidade = c.unidade
    GROUP BY
      c.id,
      c.produto,
      c.unidade,
      c.ativo,
      pr.nome,
      pr.pontos,
      pr.foto,
      pr.categoria,
      u.nome
  )
  /* estoque(id,produto_id,produto_nome,produto_pontos,produto_foto,produto_categoria,unidade_id,unidade_nome,ativo,entrada,saida,quantidade) */;

CREATE UNIQUE INDEX `idx_tokenKey_ibnv1yctmn` ON `usuario` (`tokenKey`);

CREATE UNIQUE INDEX `idx_email_ibnv1yctmn` ON `usuario` (`email`)
WHERE
  `email` != '';

CREATE UNIQUE INDEX `idx_3FHfRPq2nJ` ON `usuario` (`telefone`);

CREATE UNIQUE INDEX `idx_M5xZsfskEV` ON `usuario` (`cpf`);

CREATE VIEW
  `saldo` AS
SELECT
  *
FROM
  (
    WITH
      pedido_pendente AS (
        SELECT
          usuario,
          COALESCE(SUM(pontos), 0) AS total
        FROM
          pedido
        WHERE
          status = 'PENDENTE'
        GROUP BY
          usuario
      )
    SELECT
      t.usuario AS id,
      t.usuario,
      CAST(
        COALESCE(SUM(IIF (t.tipo = 'CREDITO', t.valor, 0)), 0) AS REAL
      ) AS credito,
      CAST(
        COALESCE(SUM(IIF (t.tipo = 'DEBITO', t.valor, 0)), 0) AS REAL
      ) AS debito,
      CAST(COALESCE(pp.total, 0) AS REAL) AS pendente,
      CAST(
        (
          COALESCE(SUM(IIF (t.tipo = 'CREDITO', t.valor, 0)), 0) - COALESCE(SUM(IIF (t.tipo = 'DEBITO', t.valor, 0)), 0) - COALESCE(pp.total, 0)
        ) AS REAL
      ) AS saldo
    FROM
      transacao t
      LEFT JOIN pedido_pendente pp ON pp.usuario = t.usuario
    GROUP BY
      t.usuario
  )
  /* saldo(id,usuario,credito,debito,pendente,saldo) */;

CREATE VIEW
  `historico` AS
SELECT
  *
FROM
  (
    SELECT
      t.id,
      t.created,
      CAST(t.tipo AS TEXT) AS tipo,
      CAST(t.valor AS REAL) AS valor,
      CAST(t.observacao AS TEXT) AS observacao,
      CAST(
        IIF (
          LOWER(t.tipo) = 'credito'
          AND t.missao != ''
          AND CAST(m.validade AS INTEGER) > 0,
          strftime (
            '%Y-%m-%d %H:%M:%S.000Z',
            t.created,
            '+' || CAST(m.validade AS INTEGER) || ' days'
          ),
          NULL
        ) AS TEXT
      ) AS valido_ate,
      CAST(t.usuario AS TEXT) AS usuario,
      CAST(t.usuario_responsavel AS TEXT) AS usuario_responsavel,
      CAST((t.missao || '') AS TEXT) AS missao_id,
      CAST(COALESCE(m.missao, '') AS TEXT) AS missao_nome,
      CAST(COALESCE(m.pontos, 0) AS REAL) AS missao_pontos,
      CAST((t.pedido || '') AS TEXT) AS pedido_id,
      CAST(COALESCE(p.status, '') AS TEXT) AS pedido_status,
      CAST(COALESCE(p.pontos, 0) AS REAL) AS pedido_pontos
    FROM
      transacao t
      LEFT JOIN missao m ON m.id = t.missao
      AND t.missao != ''
      LEFT JOIN pedido p ON p.id = t.pedido
      AND t.pedido != ''
    ORDER BY
      t.created DESC
  )
  /* historico(id,created,tipo,valor,observacao,valido_ate,usuario,usuario_responsavel,missao_id,missao_nome,missao_pontos,pedido_id,pedido_status,pedido_pontos) */;

CREATE UNIQUE INDEX `idx_o1qBsDPEX0` ON `indicacao` (`telefone`);