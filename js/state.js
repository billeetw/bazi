/* state.js
 * 全局狀態管理
 * 統一管理應用狀態，避免直接操作 window 對象
 */

(function () {
  "use strict";

  /**
   * 應用狀態存儲
   */
  const state = {
    // 紫微宮位元數據
    ziweiPalaceMetadata: null,
    
    // 紫微分數緩存
    ziweiScores: null,
    
    // 當前選中的宮位（用於移動端底部面板）
    currentSelectedPalace: null,
    
    // 其他狀態...
  };

  /**
   * 狀態管理器
   */
  const StateManager = {
    /**
     * 設置狀態值
     * @param {string} key 狀態鍵名
     * @param {*} value 狀態值
     */
    setState(key, value) {
      if (key in state) {
        state[key] = value;
        // 觸發狀態變化事件（可選）
        if (typeof window !== "undefined" && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent("stateChange", {
            detail: { key, value }
          }));
        }
      } else {
        console.warn(`[StateManager] Unknown state key: ${key}`);
      }
    },

    /**
     * 獲取狀態值
     * @param {string} key 狀態鍵名
     * @returns {*} 狀態值
     */
    getState(key) {
      if (key in state) {
        return state[key];
      }
      console.warn(`[StateManager] Unknown state key: ${key}`);
      return null;
    },

    /**
     * 批量設置狀態
     * @param {Object} updates 要更新的狀態物件
     */
    setStates(updates) {
      Object.keys(updates).forEach(key => {
        if (key in state) {
          state[key] = updates[key];
        }
      });
      // 觸發狀態變化事件
      if (typeof window !== "undefined" && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent("stateChange", {
          detail: { updates }
        }));
      }
    },

    /**
     * 重置狀態
     * @param {string[]} keys 要重置的鍵名陣列（可選，不提供則重置所有）
     */
    resetState(keys = null) {
      if (keys === null) {
        // 重置所有狀態
        state.ziweiPalaceMetadata = null;
        state.ziweiScores = null;
        state.currentSelectedPalace = null;
      } else {
        // 重置指定狀態
        keys.forEach(key => {
          if (key in state) {
            state[key] = null;
          }
        });
      }
    },

    /**
     * 獲取所有狀態（用於調試）
     * @returns {Object} 狀態快照
     */
    getAllState() {
      return { ...state };
    }
  };

  // 導出到 window.BaziApp
  if (typeof window !== "undefined") {
    window.BaziApp = window.BaziApp || {};
    window.BaziApp.State = StateManager;
    // 為了向後兼容，也保留直接訪問 state 的方式（但建議使用 StateManager）
    window.BaziApp.state = state;
  } else if (typeof globalThis !== "undefined") {
    globalThis.BaziApp = globalThis.BaziApp || {};
    globalThis.BaziApp.State = StateManager;
    globalThis.BaziApp.state = state;
  }
})();
