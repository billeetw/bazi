import { requireAdmin, jsonResponse } from "../../shared/admin-auth.js";

// GET: 列表查询（支持搜索、筛选、分页）
export async function onRequestGet(context) {
  const { request, env } = context;
  const auth = requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    // 如果提供了 id，返回单个记录
    if (id) {
      const db = env.CONSULT_DB;
      const stmt = db.prepare('SELECT * FROM ui_copy_texts WHERE id = ?');
      const result = await stmt.bind(id).first();

      if (!result) {
        return jsonResponse({ error: '記錄不存在' }, 404);
      }

      return jsonResponse({ ok: true, list: [result] });
    }

    // 否则返回列表
    const keyword = url.searchParams.get('keyword') || '';
    const category = url.searchParams.get('category') || '';
    const locale = url.searchParams.get('locale') || '';
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10);
    const offset = (page - 1) * pageSize;

    const db = env.CONSULT_DB;
    let query = 'SELECT id, copy_key, locale, content, category, description, updated_by, updated_at, created_at FROM ui_copy_texts WHERE 1=1';
    const params = [];

    if (keyword) {
      query += ' AND (copy_key LIKE ? OR content LIKE ?)';
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern);
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (locale) {
      query += ' AND locale = ?';
      params.push(locale);
    }

    // 获取总数
    let countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM');
    const countStmt = db.prepare(countQuery);
    const countResult = await countStmt.bind(...params).first();
    const total = countResult?.total || 0;

    // 获取分页数据
    query += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);

    const stmt = db.prepare(query);
    const { results } = await stmt.bind(...params).all();

    return jsonResponse({
      ok: true,
      list: results || [],
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    console.error('Error in GET /api/admin/copy:', err);
    return jsonResponse({ error: '讀取失敗: ' + err.message }, 500);
  }
}

// POST: 新增文案
export async function onRequestPost(context) {
  const { request, env } = context;
  const auth = requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  try {
    const data = await request.json();
    const { copy_key, locale = 'zh-TW', content, category, description } = data;

    if (!copy_key || !content || !category) {
      return jsonResponse({ error: '缺少必填欄位：copy_key, content, category' }, 400);
    }

    const db = env.CONSULT_DB;
    const now = new Date().toISOString();
    const updatedBy = auth.user;

    // 检查唯一性
    const checkStmt = db.prepare('SELECT id FROM ui_copy_texts WHERE copy_key = ? AND locale = ?');
    const existing = await checkStmt.bind(copy_key, locale).first();
    if (existing) {
      return jsonResponse({ error: `copy_key "${copy_key}" 與 locale "${locale}" 的組合已存在` }, 400);
    }

    const stmt = db.prepare(`
      INSERT INTO ui_copy_texts (copy_key, locale, content, category, description, updated_by, updated_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    await stmt.bind(
      copy_key,
      locale,
      content,
      category,
      description || null,
      updatedBy,
      now,
      now
    ).run();

    // 返回新创建的记录
    const newRecord = await db.prepare('SELECT * FROM ui_copy_texts WHERE copy_key = ? AND locale = ?')
      .bind(copy_key, locale)
      .first();

    // 失效 content KV 快取，使下次請求從 D1 重新載入
    try {
      if (env.CACHE) await env.CACHE.delete(`content:${locale}`);
    } catch (e) {
      console.warn('[admin/copy] KV cache invalidation failed:', e);
    }

    return jsonResponse({ ok: true, data: newRecord }, 201);
  } catch (err) {
    console.error('Error in POST /api/admin/copy:', err);
    return jsonResponse({ error: '新增失敗: ' + err.message }, 500);
  }
}

// PUT: 更新文案
export async function onRequestPut(context) {
  const { request, env } = context;
  const auth = requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  try {
    const data = await request.json();
    const { id, content, category, description } = data;

    if (!id) {
      return jsonResponse({ error: '缺少必填欄位：id' }, 400);
    }

    const db = env.CONSULT_DB;
    const now = new Date().toISOString();
    const updatedBy = auth.user;

    // 检查记录是否存在
    const checkStmt = db.prepare('SELECT id FROM ui_copy_texts WHERE id = ?');
    const existing = await checkStmt.bind(id).first();
    if (!existing) {
      return jsonResponse({ error: '記錄不存在' }, 404);
    }

    // 构建更新语句（只更新提供的字段）
    const updates = [];
    const params = [];

    if (content !== undefined) {
      updates.push('content = ?');
      params.push(content);
    }

    if (category !== undefined) {
      updates.push('category = ?');
      params.push(category);
    }

    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }

    if (updates.length === 0) {
      return jsonResponse({ error: '沒有要更新的欄位' }, 400);
    }

    updates.push('updated_by = ?', 'updated_at = ?');
    params.push(updatedBy, now, id);

    const stmt = db.prepare(`
      UPDATE ui_copy_texts
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    await stmt.bind(...params).run();

    // 返回更新后的记录
    const updatedRecord = await db.prepare('SELECT * FROM ui_copy_texts WHERE id = ?')
      .bind(id)
      .first();

    // 失效 content KV 快取
    try {
      const locale = updatedRecord?.locale;
      if (env.CACHE && locale) await env.CACHE.delete(`content:${locale}`);
    } catch (e) {
      console.warn('[admin/copy] KV cache invalidation failed:', e);
    }

    return jsonResponse({ ok: true, data: updatedRecord });
  } catch (err) {
    console.error('Error in PUT /api/admin/copy:', err);
    return jsonResponse({ error: '更新失敗: ' + err.message }, 500);
  }
}

// DELETE: 删除文案
export async function onRequestDelete(context) {
  const { request, env } = context;
  const auth = requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return jsonResponse({ error: '缺少參數：id' }, 400);
    }

    const db = env.CONSULT_DB;

    // 检查记录是否存在並取得 locale
    const checkStmt = db.prepare('SELECT id, locale FROM ui_copy_texts WHERE id = ?');
    const existing = await checkStmt.bind(id).first();
    if (!existing) {
      return jsonResponse({ error: '記錄不存在' }, 404);
    }

    const stmt = db.prepare('DELETE FROM ui_copy_texts WHERE id = ?');
    await stmt.bind(id).run();

    // 失效 content KV 快取
    try {
      const locale = existing?.locale;
      if (env.CACHE && locale) await env.CACHE.delete(`content:${locale}`);
    } catch (e) {
      console.warn('[admin/copy] KV cache invalidation failed:', e);
    }

    return jsonResponse({ ok: true });
  } catch (err) {
    console.error('Error in DELETE /api/admin/copy:', err);
    return jsonResponse({ error: '刪除失敗: ' + err.message }, 500);
  }
}
