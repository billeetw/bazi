/**
 * User Feedback API
 * POST /api/feedback - Submit feedback
 * GET /api/feedback/stats - Get feedback statistics (admin only)
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    if (!env || !env.CONSULT_DB) {
      return new Response(
        JSON.stringify({ error: '資料庫未綁定（缺少 CONSULT_DB）' }),
        { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    const data = await request.json();

    const {
      chartId,
      feedbackType, // 'prediction', 'satisfaction', 'accuracy', 'suggestion'
      predictionCategory,
      predictionTarget,
      predictedValue,
      actualValue,
      accuracyRating,
      satisfactionRating,
      satisfactionCategory,
      feedbackText,
      positiveAspects,
      negativeAspects,
      contextData,
    } = data || {};

    // Validation
    if (!chartId) {
      return new Response(
        JSON.stringify({ error: '缺少 chartId' }),
        { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    if (!feedbackType || !['prediction', 'satisfaction', 'accuracy', 'suggestion'].includes(feedbackType)) {
      return new Response(
        JSON.stringify({ error: 'feedbackType 必須為 prediction, satisfaction, accuracy 或 suggestion' }),
        { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    // Generate user hash for privacy (optional)
    const userHash = data.userHash || null;
    const ipHash = data.ipHash || null;

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const userAgent = request.headers.get('user-agent') || null;
    const source = 'web';

    // Prepare context data as JSON string
    const contextDataStr = contextData ? JSON.stringify(contextData) : null;

    const db = env.CONSULT_DB;

    await db
      .prepare(`
        INSERT INTO feedback (
          id, created_at, updated_at,
          chart_id, user_hash,
          feedback_type,
          prediction_category, prediction_target,
          predicted_value, actual_value, accuracy_rating,
          satisfaction_rating, satisfaction_category,
          verification_status,
          feedback_text, positive_aspects, negative_aspects,
          context_data,
          source, user_agent, ip_hash
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        id,
        now,
        now,
        String(chartId).trim(),
        userHash,
        feedbackType,
        predictionCategory || null,
        predictionTarget || null,
        predictedValue || null,
        actualValue || null,
        accuracyRating || null,
        satisfactionRating || null,
        satisfactionCategory || null,
        'pending', // verification_status
        feedbackText || null,
        positiveAspects || null,
        negativeAspects || null,
        contextDataStr,
        source,
        userAgent,
        ipHash
      )
      .run();

    return new Response(
      JSON.stringify({ ok: true, id }),
      { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  } catch (error) {
    console.error('[feedback.js] Error:', error);
    return new Response(
      JSON.stringify({ error: '伺服器錯誤：' + (error.message || '未知錯誤') }),
      { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    if (!env || !env.CONSULT_DB) {
      return new Response(
        JSON.stringify({ error: '資料庫未綁定' }),
        { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'stats') {
      // Get feedback statistics
      const db = env.CONSULT_DB;

      // Overall stats
      const overallStats = await db
        .prepare(`
          SELECT 
            COUNT(*) as total_feedback,
            AVG(CASE WHEN satisfaction_rating IS NOT NULL THEN satisfaction_rating END) as avg_satisfaction,
            AVG(CASE WHEN accuracy_rating IS NOT NULL THEN accuracy_rating END) as avg_accuracy
          FROM feedback
        `)
        .first();

      // By category
      const categoryStats = await db
        .prepare(`
          SELECT 
            prediction_category,
            COUNT(*) as count,
            AVG(accuracy_rating) as avg_accuracy
          FROM feedback
          WHERE feedback_type = 'prediction' AND prediction_category IS NOT NULL
          GROUP BY prediction_category
        `)
        .all();

      return new Response(
        JSON.stringify({
          ok: true,
          overall: overallStats,
          byCategory: categoryStats.results || [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    // Default: return recent feedback (for admin)
    const db = env.CONSULT_DB;
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const feedback = await db
      .prepare(`
        SELECT 
          id, created_at, feedback_type,
          prediction_category, satisfaction_rating, accuracy_rating,
          feedback_text
        FROM feedback
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `)
      .bind(limit, offset)
      .all();

    return new Response(
      JSON.stringify({ ok: true, feedback: feedback.results || [] }),
      { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  } catch (error) {
    console.error('[feedback.js] GET Error:', error);
    return new Response(
      JSON.stringify({ error: '伺服器錯誤：' + (error.message || '未知錯誤') }),
      { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  }
}
