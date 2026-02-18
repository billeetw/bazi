/**
 * Admin API: Calculation Results Export
 * GET /api/admin/calculation-results
 * 認證：Basic Auth（與其他 admin API 一致）
 */

import { requireAdmin, jsonResponse } from "../../shared/admin-auth.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const auth = requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  try {
    const url = new URL(request.url);
    const chartId = url.searchParams.get('chart_id'); // 選填：特定圖表ID
    
    // 注意：這個 API 目前返回的是前端計算結果的結構說明
    // 實際數據需要從前端計算後通過其他方式傳遞到後台
    // 或者可以擴展為從數據庫讀取已保存的計算結果
    
    // 返回結構化數據格式說明
    const response = {
      ok: true,
      message: '計算結果數據結構說明',
      dataStructure: {
        // 四化系統數據
        fourTransformations: {
          benming: {
            stem: 'string', // 生年天干
            mutagenStars: {
              '祿': 'string', // 化祿星名
              '權': 'string', // 化權星名
              '科': 'string', // 化科星名
              '忌': 'string'  // 化忌星名
            },
            weights: {} // 星曜權重
          },
          dalimit: {
            stem: 'string', // 大限天干
            palace: 'string', // 大限宮位
            mutagenStars: {},
            weights: {}
          },
          liunian: {
            stem: 'string', // 流年天干
            branch: 'string', // 流年地支
            palace: 'string', // 流年宮位
            mutagenStars: {},
            weights: {}
          },
          xiaoxian: {
            stem: 'string', // 小限天干
            palace: 'string', // 小限宮位
            mutagenStars: {},
            weights: {}
          },
          combinedWeights: {}, // 合併權重
          summary: {} // 摘要資訊
        },
        
        // 疊宮分析數據
        overlapAnalysis: {
          palaceMap: {}, // Map<string, PalaceData>
          criticalRisks: [
            {
              palace: 'string',
              jiCount: 'number',
              transformations: {},
              description: 'string'
            }
          ],
          maxOpportunities: [
            {
              palace: 'string',
              luCount: 'number',
              transformations: {},
              description: 'string'
            }
          ],
          summary: {
            totalCriticalRisks: 'number',
            totalMaxOpportunities: 'number',
            riskPalaces: ['string'],
            opportunityPalaces: ['string']
          },
          comments: ['string'] // 生成的評論
        },
        
        // 好命指數數據
        luckIndex: {
          luckIndex: 'number', // 0-100
          brightnessScore: 'number',
          auspiciousRatio: 'number',
          mainStarCombo: 'number',
          breakdown: {
            brightnessWeight: 'number',
            auspiciousWeight: 'number',
            comboWeight: 'number'
          },
          description: 'string'
        },
        
        // 宮位分數和元數據
        palaceScores: {
          '命宮': 'number',
          '兄弟': 'number',
          // ... 其他宮位
        },
        palaceMetadata: {
          '命宮': {
            stars: [],
            baseScore: 'number',
            strategicAdvice: ['string'],
            maxStarRating: 'number',
            // ... 其他元數據
          }
        },
        
        // 五行數據
        fiveElements: {
          raw: {},
          pct: {},
          levels: {},
          diagnosis: 'string'
        },
        
        // 五行健康預警（如果存在）
        healthWarning: {
          riskLevel: 'string', // 'normal' | 'warning' | 'critical'
          warnings: [
            {
              element: 'string',
              type: 'string', // 'weak' | 'excess'
              severity: 'string', // 'warning' | 'critical'
              risk: 'string',
              systems: ['string'],
              symptoms: ['string']
            }
          ],
          recommendations: [
            {
              element: 'string',
              urgency: 'string', // 'normal' | 'urgent'
              action: 'string'
            }
          ],
          multipliers: {
            ageRisk: 'number',
            jiePalaceRisk: 'number'
          },
          jiePalaceNote: 'string'
        },
        
        // AI Prompt（#深度貼文風格）
        aiPrompt: 'string', // 完整的 AI Prompt 模板，用於生成命書
        
        // 結構化數據（完整計算結果）
        structuredData: {
          currentYear: 'number',
          age: 'number',
          luckIndex: {}, // 好命指數數據
          palaceScores: {}, // 宮位分數
          palaceMetadata: {}, // 宮位元數據
          topPalaces: ['string'], // 最強宮位
          fourTransformations: {}, // 四化系統
          overlapAnalysis: {}, // 疊宮分析
          fiveElements: {}, // 五行數據
          healthWarning: {}, // 健康預警
          liuyue: {} // 流月數據
        },
        
        // 流月數據
        liuyue: {
          months: [
            {
              range: 'string',
              riskScore: 'number',
              stars: 'number',
              statusLabel: 'string'
            }
          ]
        }
      },
      note: '實際數據需要從前端計算後通過 POST 請求提交，或從數據庫讀取已保存的結果'
    };

    return jsonResponse(response);
  } catch (err) {
    console.error('Error in GET /api/admin/calculation-results:', err);
    return jsonResponse({ error: '讀取失敗', details: err.message }, 500);
  }
}

/**
 * POST /api/admin/calculation-results
 * 保存計算結果到數據庫（供後台管理使用）
 */
export async function onRequestPost(context) {
  const { request, env } = context;
  const auth = requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  try {
    const data = await request.json();
    const {
      chartId,
      birthInfo, // { year, month, day, hour, minute, gender }
      fourTransformations,
      overlapAnalysis,
      luckIndex,
      palaceScores,
      palaceMetadata,
      fiveElements,
      liuyue,
      // ... 其他計算結果
    } = data || {};

    if (!chartId) {
      return jsonResponse({ error: '缺少 chartId' }, 400);
    }

    // TODO: 保存到數據庫
    // 需要創建 migration 來建立 calculation_results 表
    // 目前先返回成功，實際保存邏輯待實現

    return jsonResponse({
      ok: true,
      message: '計算結果已接收（待實現數據庫保存）',
      chartId: chartId
    });
  } catch (err) {
    console.error('Error in POST /api/admin/calculation-results:', err);
    return jsonResponse({ error: '保存失敗', details: err.message }, 500);
  }
}
