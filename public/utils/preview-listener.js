// public/utils/preview-listener.js

let hoverOverlay = null;
let isHostDesignModeActive = false; // Track host state

function createHoverOverlay() {
  if (!hoverOverlay) {
    hoverOverlay = document.createElement('div');
    hoverOverlay.style.position = 'absolute';
    hoverOverlay.style.border = '2px solid blue';
    hoverOverlay.style.backgroundColor = 'rgba(0, 0, 255, 0.1)';
    hoverOverlay.style.borderRadius = '3px';
    hoverOverlay.style.pointerEvents = 'none'; // Crucial: let clicks pass through
    hoverOverlay.style.zIndex = '9998'; // Below potential inspector
    hoverOverlay.style.display = 'none'; // Initially hidden
    document.body.appendChild(hoverOverlay);
    console.log('[HappyPlace Preview] Created hover overlay.');
  }
}

function updateHoverOverlay(element) {
  if (!hoverOverlay || !element) {
    if (hoverOverlay) hoverOverlay.style.display = 'none';
    return;
  }
  const rect = element.getBoundingClientRect();
  hoverOverlay.style.left = `${rect.left + window.scrollX}px`;
  hoverOverlay.style.top = `${rect.top + window.scrollY}px`;
  hoverOverlay.style.width = `${rect.width}px`;
  hoverOverlay.style.height = `${rect.height}px`;
  hoverOverlay.style.display = 'block';
}

function hideHoverOverlay() {
  if (hoverOverlay) {
    hoverOverlay.style.display = 'none';
  }
}

function findElementWithUid(startElement) {
    let targetElement = startElement;
    while (targetElement && targetElement !== document.body) {
      if (targetElement.hasAttribute('data-uid')) {
        return targetElement;
      }
      targetElement = targetElement.parentElement;
    }
    return null;
}

// --- Host Message Listener ---
window.addEventListener('message', (event) => {
  // Basic security check (consider origin check in production)
  if (event.source !== window.parent) {
      return; 
  }

  const message = event.data;
  if (message && message.type === 'happyplace-set-design-mode') {
    const wasActive = isHostDesignModeActive;
    isHostDesignModeActive = !!message.active; // Update state
    console.log(`[HappyPlace Preview] Design mode set to: ${isHostDesignModeActive}`);
    
    // If mode was just deactivated, hide any existing overlay
    if (wasActive && !isHostDesignModeActive) {
       hideHoverOverlay();
    }
  }
});

function initializePreviewListeners() {
  console.log('[HappyPlace Preview] Initializing listeners...');
  createHoverOverlay(); // Ensure overlay exists

  // Click Listener - Only posts message if host mode is active
  document.body.addEventListener('click', function(event) {
    if (!isHostDesignModeActive) return; // Check host mode state

    if (!event.target || !(event.target instanceof Element)) return;
    const targetElement = findElementWithUid(event.target);
    if (targetElement) {
      const uid = targetElement.getAttribute('data-uid');
      console.log('[HappyPlace Preview] Clicked element with data-uid: ' + uid + ' (Design Mode Active)');
      window.parent.postMessage({ type: 'happyplace-select-uid', uid: uid }, '*');
    }
  }, true); 

  // Hover Listeners - Only show overlay if host mode is active
  let lastHoveredElement = null;
  document.body.addEventListener('mouseover', function(event) {
    if (!isHostDesignModeActive) return; // Check host mode state

     if (!event.target || !(event.target instanceof Element)) return;
     const targetElementWithUid = findElementWithUid(event.target);
     
     if (targetElementWithUid && targetElementWithUid !== lastHoveredElement) {
       updateHoverOverlay(targetElementWithUid);
       lastHoveredElement = targetElementWithUid;
     }
  });

  document.body.addEventListener('mouseout', function(event) {
    // No need to check isHostDesignModeActive here, hiding should always work
    if (lastHoveredElement && event.relatedTarget instanceof Element) {
        if (!lastHoveredElement.contains(event.relatedTarget) || !findElementWithUid(event.relatedTarget)) {
             hideHoverOverlay();
             lastHoveredElement = null;
        }
    } else if (!event.relatedTarget) { 
        hideHoverOverlay();
        lastHoveredElement = null;
    }
  });

  console.log('[HappyPlace Preview] Listeners attached.');
}

// Ensure listener is attached after the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePreviewListeners);
} else {
  initializePreviewListeners();
} 