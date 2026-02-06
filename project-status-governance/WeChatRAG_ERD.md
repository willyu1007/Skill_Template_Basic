# WeChatRAG（macOS）ERD
> **目标**：给出一套适用于“聊天 → 结构化 → chunk → embedding → 向量检索（RAG）”的数据模型。  
> **说明**：ERD 以“逻辑数据模型”为主；物理落地可选 **Postgres+pgvector**（统一存储）或“元数据 DB + 向量库（Qdrant/Milvus）”分离存储。

---

## 1. 数据域划分（推荐）

### 方案 A：统一存储（Postgres + pgvector）
- 优点：单一系统、强一致、SQL 过滤方便
- 缺点：向量检索性能与扩展性取决于 pgvector 配置

### 方案 B：分离存储（Metadata DB + Vector DB）
- 元数据（会话/消息/附件/游标/运行记录）在 SQLite/Postgres
- 向量在 Qdrant/Milvus/Chroma，payload 存必要元数据

本 ERD 支持两种方案：
- `EMBEDDING` 作为逻辑实体存在；物理上可映射为 pgvector 表或向量库 collection。

---

## 2. 实体与关系（概览）

### 关键实体
- `CONVERSATION`：会话（单聊/群聊）
- `PARTICIPANT`：参与者（联系人/群成员）
- `MESSAGE`：消息（文本/图片/语音/文件等）
- `ATTACHMENT`：附件（图片/音频/文件落地路径）
- `DERIVED_DOC`：派生文档（OCR/ASR/Caption 文本）
- `CHUNK`：检索单元（多条消息组成）
- `EMBEDDING`：向量（对应 chunk 或 derived_doc）
- `INGEST_RUN`：一次抓取运行
- `INGEST_EVENT`：抓取产生的原始/半原始事件（可选，用于回放）
- `CONVERSATION_CURSOR`：会话游标（断点/增量）
- 两张关联表：`CONVERSATION_PARTICIPANT`、`CHUNK_MESSAGE`

---

## 3. Mermaid ER 图（逻辑模型）

```mermaid
erDiagram
  CONVERSATION ||--o{ MESSAGE : contains
  CONVERSATION ||--o{ CONVERSATION_CURSOR : tracks
  CONVERSATION ||--o{ CONVERSATION_PARTICIPANT : has
  PARTICIPANT ||--o{ CONVERSATION_PARTICIPANT : joins

  MESSAGE ||--o{ ATTACHMENT : has
  MESSAGE ||--o{ DERIVED_DOC : yields

  CONVERSATION ||--o{ CHUNK : groups_into
  CHUNK ||--o{ CHUNK_MESSAGE : includes
  MESSAGE ||--o{ CHUNK_MESSAGE : belongs_to

  CHUNK ||--o{ EMBEDDING : vectorized_as
  DERIVED_DOC ||--o{ EMBEDDING : vectorized_as

  INGEST_RUN ||--o{ INGEST_EVENT : produces
  CONVERSATION ||--o{ INGEST_RUN : scanned_in

  CONVERSATION {
    uuid id PK
    string platform "wechat_macos"
    string type "direct|group"
    string name
    string external_ref "optional"
    timestamptz first_seen_at
    timestamptz last_seen_at
    boolean is_active
  }

  PARTICIPANT {
    uuid id PK
    string display_name
    string external_ref "optional"
    boolean is_self
  }

  CONVERSATION_PARTICIPANT {
    uuid conversation_id FK
    uuid participant_id FK
    string role "member|owner|unknown"
    timestamptz first_seen_at
    timestamptz last_seen_at
  }

  MESSAGE {
    uuid id PK
    uuid conversation_id FK
    uuid sender_participant_id FK
    timestamptz ts_estimated
    float ts_confidence
    string msg_type "text|image|voice|file|link|unknown"
    text text
    string order_key
    string content_hash UNIQUE
    uuid ingest_run_id FK
  }

  ATTACHMENT {
    uuid id PK
    uuid message_id FK
    string kind "image|audio|file"
    string path
    string mime
    bigint size_bytes
    string sha256
    json meta
    timestamptz created_at
  }

  DERIVED_DOC {
    uuid id PK
    uuid message_id FK
    string derived_type "ocr|asr|caption|file_text"
    text text
    float confidence
    string engine
    string engine_version
    string artifact_path
    string content_hash UNIQUE
    timestamptz created_at
  }

  CHUNK {
    uuid id PK
    uuid conversation_id FK
    timestamptz time_start
    timestamptz time_end
    text text
    string content_hash UNIQUE
    json participants
    timestamptz created_at
  }

  CHUNK_MESSAGE {
    uuid chunk_id FK
    uuid message_id FK
    int position
  }

  EMBEDDING {
    uuid id PK
    string target_type "chunk|derived_doc"
    uuid target_id
    string model_name
    int dims
    vector embedding
    json metadata
    timestamptz created_at
  }

  INGEST_RUN {
    uuid id PK
    string method "ui_automation"
    string app_version
    string config_hash
    timestamptz started_at
    timestamptz finished_at
    string status "success|partial|failed"
    text error
  }

  INGEST_EVENT {
    uuid id PK
    uuid ingest_run_id FK
    uuid conversation_id FK
    string event_type "ax_snapshot|item_extract|error"
    json payload
    timestamptz created_at
  }

  CONVERSATION_CURSOR {
    uuid conversation_id PK,FK
    timestamptz last_ts_estimated
    string last_hash
    json recent_hashes
    timestamptz updated_at
  }
```

---

## 4. 字段说明与关键约束

### 4.1 幂等与去重
- `MESSAGE.content_hash`：同一条消息重复抓取不会重复入库
- `CHUNK.content_hash`：chunk 再生成也不会重复
- `DERIVED_DOC.content_hash`：同一附件重复 OCR/ASR 不重复

### 4.2 时间与排序
- `MESSAGE.ts_estimated`：分钟粒度为主（由 time_separator 推断）
- `MESSAGE.order_key`：用于稳定排序（例如 `ts_estimated + sequence_in_block`）

### 4.3 过滤与检索
常用 filters（建议都有索引）：
- `conversation_id`
- `ts_estimated`（或 chunk 的 `time_start/time_end`）
- `msg_type`
- `participants/sender`
- `derived_type`

---

## 5. 物理落地示例：Postgres + pgvector（DDL 参考）

> 说明：需安装 `pgvector` 扩展。维度 `dims` 与模型一致。

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE conversation (
  id uuid PRIMARY KEY,
  platform text NOT NULL DEFAULT 'wechat_macos',
  type text NOT NULL, -- direct|group
  name text,
  external_ref text,
  first_seen_at timestamptz,
  last_seen_at timestamptz,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE participant (
  id uuid PRIMARY KEY,
  display_name text NOT NULL,
  external_ref text,
  is_self boolean NOT NULL DEFAULT false
);

CREATE TABLE conversation_participant (
  conversation_id uuid REFERENCES conversation(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES participant(id) ON DELETE CASCADE,
  role text,
  first_seen_at timestamptz,
  last_seen_at timestamptz,
  PRIMARY KEY (conversation_id, participant_id)
);

CREATE TABLE ingest_run (
  id uuid PRIMARY KEY,
  method text NOT NULL DEFAULT 'ui_automation',
  app_version text,
  config_hash text,
  started_at timestamptz NOT NULL,
  finished_at timestamptz,
  status text NOT NULL,
  error text
);

CREATE TABLE message (
  id uuid PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
  sender_participant_id uuid REFERENCES participant(id),
  ts_estimated timestamptz,
  ts_confidence double precision,
  msg_type text NOT NULL,
  text text,
  order_key text,
  content_hash text NOT NULL UNIQUE,
  ingest_run_id uuid REFERENCES ingest_run(id)
);

CREATE INDEX idx_message_conversation_ts ON message(conversation_id, ts_estimated);
CREATE INDEX idx_message_conversation_order ON message(conversation_id, order_key);
CREATE INDEX idx_message_type ON message(msg_type);

CREATE TABLE attachment (
  id uuid PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES message(id) ON DELETE CASCADE,
  kind text NOT NULL, -- image|audio|file
  path text NOT NULL,
  mime text,
  size_bytes bigint,
  sha256 text,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_attachment_message ON attachment(message_id);
CREATE INDEX idx_attachment_sha ON attachment(sha256);

CREATE TABLE derived_doc (
  id uuid PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES message(id) ON DELETE CASCADE,
  derived_type text NOT NULL, -- ocr|asr|caption|file_text
  text text NOT NULL,
  confidence double precision,
  engine text,
  engine_version text,
  artifact_path text,
  content_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_derived_message ON derived_doc(message_id);
CREATE INDEX idx_derived_type ON derived_doc(derived_type);

CREATE TABLE chunk (
  id uuid PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
  time_start timestamptz,
  time_end timestamptz,
  text text NOT NULL,
  content_hash text NOT NULL UNIQUE,
  participants jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_chunk_conversation_time ON chunk(conversation_id, time_start, time_end);

CREATE TABLE chunk_message (
  chunk_id uuid NOT NULL REFERENCES chunk(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES message(id) ON DELETE CASCADE,
  position int NOT NULL,
  PRIMARY KEY (chunk_id, message_id)
);

CREATE INDEX idx_chunk_message_pos ON chunk_message(chunk_id, position);

-- Embedding table (for chunks and derived docs)
CREATE TABLE embedding (
  id uuid PRIMARY KEY,
  target_type text NOT NULL, -- chunk|derived_doc
  target_id uuid NOT NULL,
  model_name text NOT NULL,
  dims int NOT NULL,
  embedding vector(1536), -- adjust dims
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_embedding_target ON embedding(target_type, target_id);
-- If using IVFFLAT index (example):
-- CREATE INDEX embedding_ivfflat_idx ON embedding USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE TABLE conversation_cursor (
  conversation_id uuid PRIMARY KEY REFERENCES conversation(id) ON DELETE CASCADE,
  last_ts_estimated timestamptz,
  last_hash text,
  recent_hashes jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ingest_event (
  id uuid PRIMARY KEY,
  ingest_run_id uuid NOT NULL REFERENCES ingest_run(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES conversation(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ingest_event_run ON ingest_event(ingest_run_id);
```

---

## 6. 若使用 Qdrant/Milvus（映射建议）
- `chunk` 与 `derived_doc` 分别作为两个 collection，或同一 collection 用 `doc_type` 区分。
- 向量 payload 建议至少包含：
  - `conversation_id`
  - `time_start/time_end` 或 `ts_estimated`
  - `participants/sender`
  - `doc_type`（chunk / image_ocr / voice_asr）
  - `target_id`（用于回表读取原文与引用）

---

## 7. 典型检索（数据模型支撑）

### 7.1 过滤 + 向量召回
- filters：`conversation_id in [...] AND time_start>=X AND time_end<=Y`
- top-k：返回 chunk/derived_doc
- 回溯引用：通过 `chunk_message` 找 message，再找 attachment/derived_doc

### 7.2 引用输出（Citations）
- chunk → message_ids → 附件路径（图片/音频/文件）
- derived_doc → artifact_path（OCR/ASR 文本证据）

---

## 8. 备注
- 该模型的核心是：**文本与向量分离但可关联**，保证 RAG 回答可追溯到“原消息/原附件”。
