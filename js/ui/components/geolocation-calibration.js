/* ui/components/geolocation-calibration.js
 * 經緯度校準組件
 * 用於後台管理界面，採集出生地點的經緯度座標
 * 支持瀏覽器定位和手動輸入
 * 整合到 baziCore.js 的計算流程
 */

(function () {
  "use strict";

  /**
   * 經緯度數據結構
   */
  let geolocationData = {
    longitude: null, // 經度（-180 到 180）
    latitude: null,  // 緯度（-90 到 90）
    accuracy: null,   // 精度（米）
    source: null,     // 來源：'browser' | 'manual' | null
    timestamp: null   // 獲取時間
  };

  /**
   * 使用瀏覽器 Geolocation API 獲取當前位置
   * @param {Object} options 選項
   * @param {Function} options.onSuccess 成功回調
   * @param {Function} options.onError 錯誤回調
   * @returns {Promise<Object>} 經緯度數據
   */
  function getBrowserLocation(options = {}) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = new Error('瀏覽器不支持地理位置定位');
        if (options.onError) options.onError(error);
        reject(error);
        return;
      }

      const geoOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        function(position) {
          const data = {
            longitude: position.coords.longitude,
            latitude: position.coords.latitude,
            accuracy: position.coords.accuracy,
            source: 'browser',
            timestamp: new Date().toISOString()
          };

          geolocationData = data;
          saveGeolocationData();

          if (options.onSuccess) options.onSuccess(data);
          resolve(data);
        },
        function(error) {
          const errorMsg = getGeolocationError(error);
          if (options.onError) options.onError(new Error(errorMsg));
          reject(new Error(errorMsg));
        },
        geoOptions
      );
    });
  }

  /**
   * 獲取地理位置錯誤訊息
   * @param {GeolocationPositionError} error 錯誤對象
   * @returns {string} 錯誤訊息
   */
  function getGeolocationError(error) {
    switch(error.code) {
      case error.PERMISSION_DENIED:
        return '用戶拒絕了地理位置請求';
      case error.POSITION_UNAVAILABLE:
        return '無法獲取地理位置資訊';
      case error.TIMEOUT:
        return '地理位置請求超時';
      default:
        return '未知的地理位置錯誤';
    }
  }

  /**
   * 手動設置經緯度
   * @param {number} longitude 經度（-180 到 180）
   * @param {number} latitude 緯度（-90 到 90）
   * @param {Object} options 選項
   * @returns {Object} 經緯度數據
   */
  function setManualLocation(longitude, latitude, options = {}) {
    // 驗證經緯度範圍
    const lon = Number(longitude);
    const lat = Number(latitude);

    if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
      throw new Error('經度必須在 -180 到 180 之間');
    }

    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      throw new Error('緯度必須在 -90 到 90 之間');
    }

    const data = {
      longitude: lon,
      latitude: lat,
      accuracy: null,
      source: 'manual',
      timestamp: new Date().toISOString()
    };

    geolocationData = data;
    saveGeolocationData();

    return data;
  }

  /**
   * 保存經緯度數據到本地存儲
   */
  function saveGeolocationData() {
    try {
      localStorage.setItem('geolocationData', JSON.stringify(geolocationData));
      
      // 同時存儲到全局狀態
      if (typeof window !== "undefined") {
        if (window.BaziApp?.State) {
          window.BaziApp.State.setState("geolocation", geolocationData);
        }
        window.geolocationData = geolocationData;
      }
    } catch (err) {
      console.warn('[geolocation-calibration] 保存數據失敗:', err);
    }
  }

  /**
   * 從本地存儲載入經緯度數據
   */
  function loadGeolocationData() {
    try {
      const saved = localStorage.getItem('geolocationData');
      if (saved) {
        geolocationData = JSON.parse(saved);
        
        // 同步到全局狀態
        if (typeof window !== "undefined") {
          if (window.BaziApp?.State) {
            window.BaziApp.State.setState("geolocation", geolocationData);
          }
          window.geolocationData = geolocationData;
        }
      }
    } catch (err) {
      console.warn('[geolocation-calibration] 載入數據失敗:', err);
    }
  }

  /**
   * 獲取當前經緯度數據
   * @returns {Object} 經緯度數據
   */
  function getGeolocationData() {
    return { ...geolocationData };
  }

  /**
   * 清空經緯度數據
   */
  function clearGeolocationData() {
    geolocationData = {
      longitude: null,
      latitude: null,
      accuracy: null,
      source: null,
      timestamp: null
    };
    
    localStorage.removeItem('geolocationData');
    
    // 清空全局狀態
    if (typeof window !== "undefined") {
      if (window.BaziApp?.State) {
        window.BaziApp.State.setState("geolocation", geolocationData);
      }
      window.geolocationData = geolocationData;
    }
  }

  /**
   * 驗證經緯度格式
   * @param {string} longitudeStr 經度字串
   * @param {string} latitudeStr 緯度字串
   * @returns {Object} { valid: boolean, error: string, longitude: number, latitude: number }
   */
  function validateCoordinates(longitudeStr, latitudeStr) {
    const lon = parseFloat(longitudeStr);
    const lat = parseFloat(latitudeStr);

    if (isNaN(lon)) {
      return { valid: false, error: '經度格式不正確' };
    }

    if (isNaN(lat)) {
      return { valid: false, error: '緯度格式不正確' };
    }

    if (lon < -180 || lon > 180) {
      return { valid: false, error: '經度必須在 -180 到 180 之間' };
    }

    if (lat < -90 || lat > 90) {
      return { valid: false, error: '緯度必須在 -90 到 90 之間' };
    }

    return { valid: true, error: null, longitude: lon, latitude: lat };
  }

  /**
   * 初始化經緯度校準組件
   * @param {HTMLElement|string} container 容器元素或選擇器
   * @param {Object} options 選項
   */
  function initGeolocationCalibration(container, options = {}) {
    const containerEl = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;

    if (!containerEl) {
      console.error('[geolocation-calibration] 容器元素不存在');
      return;
    }

    // 載入已保存的數據
    loadGeolocationData();

    // 創建組件結構
    containerEl.innerHTML = `
      <div class="geolocation-calibration-container">
        <div class="geolocation-header">
          <h3>經緯度校準</h3>
          <p class="geolocation-description">
            用於後台管理界面，採集出生地點的經緯度座標，用於天文校準計算。
          </p>
        </div>

        <div class="geolocation-status" id="geolocation-status">
          ${geolocationData.longitude && geolocationData.latitude 
            ? `<div class="status-success">
                <span>✅ 已設置：經度 ${geolocationData.longitude.toFixed(6)}°，緯度 ${geolocationData.latitude.toFixed(6)}°</span>
                <span class="status-source">（${geolocationData.source === 'browser' ? '瀏覽器定位' : '手動輸入'}）</span>
              </div>`
            : '<div class="status-empty">尚未設置經緯度</div>'
          }
        </div>

        <div class="geolocation-actions">
          <button id="geolocation-browser-btn" class="btn-browser">
            📍 使用瀏覽器定位
          </button>
          <button id="geolocation-manual-btn" class="btn-manual">
            ✏️ 手動輸入
          </button>
          ${geolocationData.longitude && geolocationData.latitude 
            ? '<button id="geolocation-clear-btn" class="btn-clear">清空</button>'
            : ''
          }
        </div>

        <div id="geolocation-manual-form" class="geolocation-manual-form hidden">
          <div class="form-row">
            <label>
              <span>經度（-180 到 180）</span>
              <input type="number" id="geolocation-longitude" 
                     step="0.000001" min="-180" max="180" 
                     placeholder="例如：121.5654" />
            </label>
          </div>
          <div class="form-row">
            <label>
              <span>緯度（-90 到 90）</span>
              <input type="number" id="geolocation-latitude" 
                     step="0.000001" min="-90" max="90" 
                     placeholder="例如：25.0330" />
            </label>
          </div>
          <div class="form-actions">
            <button id="geolocation-submit-btn" class="btn-submit">確認</button>
            <button id="geolocation-cancel-btn" class="btn-cancel">取消</button>
          </div>
        </div>

        <div id="geolocation-error" class="geolocation-error hidden"></div>
      </div>
    `;

    // 綁定事件
    const browserBtn = document.getElementById('geolocation-browser-btn');
    const manualBtn = document.getElementById('geolocation-manual-btn');
    const clearBtn = document.getElementById('geolocation-clear-btn');
    const submitBtn = document.getElementById('geolocation-submit-btn');
    const cancelBtn = document.getElementById('geolocation-cancel-btn');
    const manualForm = document.getElementById('geolocation-manual-form');
    const errorDiv = document.getElementById('geolocation-error');
    const statusDiv = document.getElementById('geolocation-status');

    // 瀏覽器定位按鈕
    if (browserBtn) {
      browserBtn.addEventListener('click', function() {
        browserBtn.disabled = true;
        browserBtn.textContent = '定位中...';
        errorDiv.classList.add('hidden');
        errorDiv.textContent = '';

        getBrowserLocation({
          onSuccess: function(data) {
            browserBtn.disabled = false;
            browserBtn.textContent = '📍 使用瀏覽器定位';
            updateStatus(data);
            
            // 觸發成功事件
            const event = new CustomEvent('geolocationSuccess', {
              detail: { data: data }
            });
            containerEl.dispatchEvent(event);

            if (options.onSuccess) {
              options.onSuccess(data);
            }
          },
          onError: function(error) {
            browserBtn.disabled = false;
            browserBtn.textContent = '📍 使用瀏覽器定位';
            showError(error.message);
          }
        });
      });
    }

    // 手動輸入按鈕
    if (manualBtn) {
      manualBtn.addEventListener('click', function() {
        manualForm.classList.remove('hidden');
        errorDiv.classList.add('hidden');
        
        // 如果有已保存的數據，填入表單
        if (geolocationData.longitude && geolocationData.latitude) {
          document.getElementById('geolocation-longitude').value = geolocationData.longitude;
          document.getElementById('geolocation-latitude').value = geolocationData.latitude;
        }
      });
    }

    // 取消按鈕
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function() {
        manualForm.classList.add('hidden');
        errorDiv.classList.add('hidden');
      });
    }

    // 提交按鈕
    if (submitBtn) {
      submitBtn.addEventListener('click', function() {
        const lonInput = document.getElementById('geolocation-longitude');
        const latInput = document.getElementById('geolocation-latitude');
        
        const validation = validateCoordinates(lonInput.value, latInput.value);
        
        if (!validation.valid) {
          showError(validation.error);
          return;
        }

        try {
          const data = setManualLocation(validation.longitude, validation.latitude);
          manualForm.classList.add('hidden');
          errorDiv.classList.add('hidden');
          updateStatus(data);
          
          // 觸發成功事件
          const event = new CustomEvent('geolocationSuccess', {
            detail: { data: data }
          });
          containerEl.dispatchEvent(event);

          if (options.onSuccess) {
            options.onSuccess(data);
          }
        } catch (error) {
          showError(error.message);
        }
      });
    }

    // 清空按鈕
    if (clearBtn) {
      clearBtn.addEventListener('click', function() {
        if (confirm('確定要清空經緯度數據嗎？')) {
          clearGeolocationData();
          updateStatus(geolocationData);
          manualForm.classList.add('hidden');
          errorDiv.classList.add('hidden');
        }
      });
    }

    // 更新狀態顯示
    function updateStatus(data) {
      if (data.longitude && data.latitude) {
        statusDiv.innerHTML = `
          <div class="status-success">
            <span>✅ 已設置：經度 ${data.longitude.toFixed(6)}°，緯度 ${data.latitude.toFixed(6)}°</span>
            <span class="status-source">（${data.source === 'browser' ? '瀏覽器定位' : '手動輸入'}）</span>
          </div>
        `;
        
        // 顯示清空按鈕
        if (!clearBtn || !clearBtn.parentElement) {
          const actionsDiv = document.querySelector('.geolocation-actions');
          if (actionsDiv && !actionsDiv.querySelector('#geolocation-clear-btn')) {
            const newClearBtn = document.createElement('button');
            newClearBtn.id = 'geolocation-clear-btn';
            newClearBtn.className = 'btn-clear';
            newClearBtn.textContent = '清空';
            newClearBtn.addEventListener('click', function() {
              if (confirm('確定要清空經緯度數據嗎？')) {
                clearGeolocationData();
                updateStatus(geolocationData);
                manualForm.classList.add('hidden');
                errorDiv.classList.add('hidden');
              }
            });
            actionsDiv.appendChild(newClearBtn);
          }
        }
      } else {
        statusDiv.innerHTML = '<div class="status-empty">尚未設置經緯度</div>';
        
        // 隱藏清空按鈕
        const existingClearBtn = document.getElementById('geolocation-clear-btn');
        if (existingClearBtn) {
          existingClearBtn.remove();
        }
      }
    }

    // 顯示錯誤
    function showError(message) {
      errorDiv.textContent = message;
      errorDiv.classList.remove('hidden');
    }
  }

  // 初始化時載入數據
  if (typeof window !== "undefined") {
    loadGeolocationData();
  }

  // ====== 導出 ======

  // 導出到 window.GeolocationCalibration（如果 window 存在）
  if (typeof window !== "undefined") {
    window.GeolocationCalibration = {
      init: initGeolocationCalibration,
      getBrowserLocation: getBrowserLocation,
      setManualLocation: setManualLocation,
      getGeolocationData: getGeolocationData,
      clearGeolocationData: clearGeolocationData,
      validateCoordinates: validateCoordinates,
      loadGeolocationData: loadGeolocationData,
      saveGeolocationData: saveGeolocationData
    };
  } else if (typeof globalThis !== "undefined") {
    globalThis.GeolocationCalibration = {
      init: initGeolocationCalibration,
      getBrowserLocation: getBrowserLocation,
      setManualLocation: setManualLocation,
      getGeolocationData: getGeolocationData,
      clearGeolocationData: clearGeolocationData,
      validateCoordinates: validateCoordinates,
      loadGeolocationData: loadGeolocationData,
      saveGeolocationData: saveGeolocationData
    };
  }
})();
