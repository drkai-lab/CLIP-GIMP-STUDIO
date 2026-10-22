/**
 * ============================================================================
 * CLAUDE WORKS ADVERTISEMENT ENGINE (PROTECTED BLACK-BOX MODULE)
 * Copyright (c) 2026 drkai-lab. All Rights Reserved.
 * LICENSE: PROPRIETARY & UNMODIFIABLE. MODIFICATION OR TAMPERING IS STRICTLY FORBIDDEN.
 * ============================================================================
 */
(function(global, document){
  'use strict';

  // 署名 & 整合性ハッシュシグネチャ
  const _SIG = 'DRKAI_AD_CORE_V1_VERIFIED';
  let _adList = [];
  let _currentIndex = 0;
  let _carouselTimer = null;
  let _isLocked = true;

  const AdCore = {
    version: '1.0.0-locked',
    signature: _SIG,

    init: async function() {
      try {
        await this._fetchMediaList();
        this._renderCurrentAd();
        this._startAutoCarousel();
        this._installTamperProtection();
      } catch(err) {
        this._renderFallback();
      }
    },

    _fetchMediaList: async function() {
      const res = await fetch('/api/splash-ad');
      const data = await res.json();
      if (data && data.success && Array.isArray(data.ads) && data.ads.length > 0) {
        _adList = data.ads;
      } else {
        _adList = [{
          name: 'Claude Works Official Ad',
          isVideo: false,
          type: 'png',
          url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450"><rect width="100%" height="100%" fill="%23141821"/><rect x="8" y="8" width="784" height="434" rx="4" fill="none" stroke="%2300a8ff" stroke-width="3"/><text x="40" y="60" fill="%2300a8ff" font-size="16" font-family="sans-serif" font-weight="bold">FEATURED CREATOR ADVERTISEMENT</text><text x="40" y="160" fill="%23ffffff" font-size="36" font-family="sans-serif" font-weight="bold">Claude Works Official Gallery</text><text x="40" y="220" fill="%23b4becd" font-size="18" font-family="sans-serif">Place your images or MP4 videos in Pictures/Claude Works to display here.</text></svg>'
        }];
      }

      const countLabel = document.getElementById('ad-count-label');
      if (countLabel) {
        countLabel.textContent = `全 ${_adList.length} 件の Claude Works 広告`;
      }
    },

    _renderCurrentAd: function() {
      const wrapper = document.getElementById('ad-media-wrapper');
      if (!wrapper || _adList.length === 0) return;

      const ad = _adList[_currentIndex];
      wrapper.innerHTML = '';

      if (ad.isVideo) {
        const video = document.createElement('video');
        video.src = ad.url;
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.className = 'ad-video-element';
        video.style.maxWidth = '100%';
        video.style.maxHeight = '100%';
        video.style.objectFit = 'contain';
        wrapper.appendChild(video);
        video.play().catch(e => console.log('Ad autoplay handled'));
      } else {
        const img = document.createElement('img');
        img.src = ad.url;
        img.alt = ad.name;
        img.className = 'ad-image-element';
        img.style.maxWidth = '100%';
        img.style.maxHeight = '100%';
        img.style.objectFit = 'contain';
        wrapper.appendChild(img);
      }
    },

    _startAutoCarousel: function() {
      if (_carouselTimer) clearInterval(_carouselTimer);
      if (_adList.length <= 1) return;

      _carouselTimer = setInterval(() => {
        _currentIndex = (_currentIndex + 1) % _adList.length;
        this._renderCurrentAd();
      }, 6000);
    },

    _renderFallback: function() {
      const wrapper = document.getElementById('ad-media-wrapper');
      if (wrapper) {
        wrapper.innerHTML = '<div style="color:#00a8ff; font-weight:bold; font-size:16px;">Claude Works Sponsored Gallery</div>';
      }
    },

    // 改ざん・削除防止メカニズム (Self-healing Tamper Protection)
    _installTamperProtection: function() {
      const container = document.getElementById('splash-ad-container');
      if (!container || typeof MutationObserver === 'undefined') return;

      const observer = new MutationObserver((mutations) => {
        if (!_isLocked) return;
        const wrapper = document.getElementById('ad-media-wrapper');
        if (!wrapper || wrapper.children.length === 0 || container.style.display === 'none') {
          container.style.display = 'flex';
          this._renderCurrentAd();
        }
      });

      observer.observe(container, { childList: true, subtree: true, attributes: true });
    },

    openClaudeWorksFolder: function() {
      fetch('/api/open-claude-works', { method: 'POST' }).catch(() => {
        alert('Claude Works 広告フォルダ: Pictures/Claude Works');
      });
    }
  };

  // グローバル公開 (不変オブジェクトとしてフリーズ)
  Object.freeze(AdCore);
  global.ClaudeWorksAdEngine = AdCore;

  // DOM 構築後に自動実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AdCore.init());
  } else {
    AdCore.init();
  }

})(window, document);
