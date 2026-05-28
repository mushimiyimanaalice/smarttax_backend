const express = require('express');
const router = express.Router();
const ussdController = require('../controllers/ussdController');

router.post('/', ussdController.handleUssd);
router.get('/simulate', (req, res) => {
  res.send(`
    <!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>SmartTax USSD Simulator</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Courier New',monospace;background:#1a1a2e;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:16px}
      .phone{width:320px;background:#16213e;border-radius:30px;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,.5);border:2px solid #0f3460}
      .screen{background:#0a0a1a;color:#00ff41;padding:16px;border-radius:10px;min-height:300px;font-size:14px;line-height:1.6;white-space:pre-wrap;word-break:break-word}
      .screen .cursor{animation:blink 1s infinite}
      @keyframes blink{0%,50%{opacity:1}51%,100%{opacity:0}}
      .keypad{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:16px}
      .keypad button{background:#0f3460;color:#fff;border:none;padding:14px;border-radius:8px;font-size:18px;cursor:pointer;font-family:'Courier New',monospace}
      .keypad button:active{background:#1a5276}
      .keypad .action{background:#e94560;grid-column:span 3}
      .keypad .action:active{background:#ff6b81}
      .input-bar{display:flex;gap:8px;margin-top:12px}
      .input-bar input{flex:1;background:#0f3460;color:#00ff41;border:none;padding:12px;border-radius:8px;font-size:16px;font-family:'Courier New',monospace;outline:none}
      .input-bar button{background:#e94560;color:#fff;border:none;padding:12px 20px;border-radius:8px;font-size:14px;cursor:pointer}
      .bottom{display:flex;justify-content:space-between;margin-top:12px;color:#555;font-size:11px}
    </style>
  </head><body>
    <div class="phone">
      <div class="screen" id="screen">Welcome to SmartTax USSD Simulator</div>
      <div class="input-bar">
        <input type="text" id="numberInput" placeholder="Phone (e.g. 0788000001)" value="0788000001">
        <button onclick="startSession()">Call</button>
      </div>
      <div class="keypad" id="keypad" style="display:none">
        <button onclick="press('1')">1</button><button onclick="press('2')">2</button><button onclick="press('3')">3</button>
        <button onclick="press('4')">4</button><button onclick="press('5')">5</button><button onclick="press('6')">6</button>
        <button onclick="press('7')">7</button><button onclick="press('8')">8</button><button onclick="press('9')">9</button>
        <button onclick="press('*')">*</button><button onclick="press('0')">0</button><button onclick="press('#')">#</button>
        <button class="action" onclick="send()">SEND</button>
      </div>
      <div class="bottom"><span>SmartTax</span><span id="sessionInfo">Ready</span></div>
    </div>
    <script>
      let sessionId = Date.now() + '-' + Math.random().toString(36).substr(2,6);
      let text = '';
      let phone = '0788000001';
      const screen = document.getElementById('screen');
      const keypad = document.getElementById('keypad');
      const numberInput = document.getElementById('numberInput');
      const sessionInfo = document.getElementById('sessionInfo');

      function startSession() {
        phone = numberInput.value.trim() || '0788000001';
        sessionId = Date.now() + '-' + Math.random().toString(36).substr(2,6);
        text = '';
        keypad.style.display = 'grid';
        sessionInfo.textContent = 'Session: active';
        send();
      }

      function press(key) {
        text += key;
        screen.textContent += key;
      }

      async function send() {
        const currentText = text;
        sessionInfo.textContent = 'Sending...';
        try {
          const res = await fetch('/api/ussd', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({ phoneNumber: phone, text: currentText, sessionId, serviceCode: '*384*1234#' })
          });
          const data = await res.json();
          screen.textContent = data.response || 'No response';
          if (data.response && data.response.startsWith('END')) {
            sessionInfo.textContent = 'Session: ended';
            text = '';
          } else {
            text = currentText + '*';
          }
        } catch(e) {
          screen.textContent = 'Network error: ' + e.message;
          sessionInfo.textContent = 'Error';
        }
      }

      document.addEventListener('keydown', (e) => {
        if (e.key >= '0' && e.key <= '9') press(e.key);
        if (e.key === '*') press('*');
        if (e.key === '#') press('#');
        if (e.key === 'Enter') send();
      });
    </script>
  </body></html>
  `);
});

module.exports = router;
