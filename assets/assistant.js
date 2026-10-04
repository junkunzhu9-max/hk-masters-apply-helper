(() => {
  document.body.insertAdjacentHTML('beforeend', `
    <aside class="ai-assistant" aria-label="申请问答">
      <button class="ai-launcher" type="button" aria-expanded="false" aria-controls="ai-panel">
        <span class="ai-mark" aria-hidden="true">✦</span><span>AI 申请助手</span>
      </button>
      <section class="ai-panel" id="ai-panel" role="dialog" aria-modal="false" aria-labelledby="ai-title" aria-describedby="ai-note" hidden>
        <header class="ai-header">
          <div><p class="ai-kicker">YOUR NEXT STEP</p><h2 id="ai-title">AI 申请助手</h2></div>
          <button class="ai-close" type="button" aria-label="关闭申请助手">×</button>
        </header>
        <div class="ai-content">
          <p class="ai-context" id="ai-context" hidden></p>
          <p class="ai-note" id="ai-note">回答限材料推进与本站说明，具体学校要求仍需官方确认。点击发送后，问题、最近对话与所选卡点会交给 DeepSeek 处理；本站不保存聊天记录，刷新后清空。请勿填写证件或完整申请材料。</p>
          <div class="ai-prompts" aria-label="试着这样问">
            <button type="button">成绩单还没拿到，先做什么？</button>
            <button type="button">推荐人说已提交，怎么确认收件？</button>
            <button type="button">两处官方要求不同，怎么办？</button>
          </div>
          <div class="ai-messages" role="log" aria-label="本次对话" aria-live="polite" aria-relevant="additions"></div>
        </div>
        <form class="ai-form">
          <label class="ai-input-label" for="ai-question">你的材料问题</label>
          <textarea id="ai-question" rows="2" maxlength="1000" placeholder="例如：已经申请成绩单，还没收到……"></textarea>
          <div class="ai-form-actions"><p class="ai-status" role="status" aria-live="polite">打开后检查问答是否可用。</p><button class="ai-send" type="submit" disabled>发送 <span aria-hidden="true">↗</span></button></div>
        </form>
      </section>
    </aside>`);

  const launcher = document.querySelector('.ai-launcher');
  const panel = document.getElementById('ai-panel');
  const form = document.querySelector('.ai-form');
  const input = document.getElementById('ai-question');
  const send = document.querySelector('.ai-send');
  const status = document.querySelector('.ai-status');
  const log = document.querySelector('.ai-messages');
  const content = document.querySelector('.ai-content');
  const contextLabel = document.getElementById('ai-context');
  const assistant = launcher.closest('.ai-assistant');
  const closeButton = document.querySelector('.ai-close');
  const mobile = matchMedia('(max-width:760px)');
  const background = new Map();
  let enabled = false;
  let busy = false;
  let checked = false;
  const messages = [];

  const currentContext = () => {
    const issue = document.getElementById('check-issue');
    const state = document.getElementById('check-state');
    if (!issue?.value || !state?.value) return '';
    return issue.selectedOptions[0].textContent + ' · ' + state.selectedOptions[0].textContent;
  };
  const refreshContext = () => {
    const context = currentContext();
    contextLabel.textContent = context ? '当前卡点：' + context : '';
    contextLabel.hidden = !context;
  };
  const syncViewport = () => {
    if (mobile.matches && !panel.hidden && window.visualViewport) {
      panel.style.height = window.visualViewport.height + 'px';
      panel.style.top = window.visualViewport.offsetTop + 'px';
    } else {
      panel.style.removeProperty('height');
      panel.style.removeProperty('top');
    }
  };
  const syncModal = () => {
    const modal = mobile.matches && !panel.hidden;
    panel.setAttribute('aria-modal', String(modal));
    document.documentElement.classList.toggle('ai-modal-open', modal);
    document.body.classList.toggle('ai-modal-open', modal);
    if (modal && !background.size) {
      [...document.body.children].forEach(element => {
        if (element !== assistant) {
          background.set(element, element.inert);
          element.inert = true;
        }
      });
    } else if (!modal) {
      background.forEach((inert, element) => { element.inert = inert; });
      background.clear();
    }
    syncViewport();
    if (modal && !panel.contains(document.activeElement)) closeButton.focus({ preventScroll: true });
  };
  const setOpen = open => {
    panel.hidden = !open;
    assistant.classList.toggle('is-open', open);
    launcher.setAttribute('aria-expanded', String(open));
    syncModal();
    if (open) {
      refreshContext();
      if (!checked) checkAvailability();
      (mobile.matches ? closeButton : input).focus({ preventScroll: true });
    } else launcher.focus({ preventScroll: true });
  };
  mobile.addEventListener('change', syncModal);
  window.visualViewport?.addEventListener('resize', syncViewport);
  window.visualViewport?.addEventListener('scroll', syncViewport);
  const checkAvailability = async () => {
    checked = true;
    status.textContent = '正在连接申请助手…';
    if (location.protocol === 'file:') {
      status.textContent = '本地文件预览暂未启用 AI。免费材料卡点工具仍可使用。';
      return;
    }
    try {
      const response = await fetch('/api/chat', { signal: AbortSignal.timeout(10000) });
      if (!response.ok && response.status !== 404) throw new Error('unavailable');
      const data = response.status === 404 ? { enabled: false } : await response.json();
      if (typeof data?.enabled !== 'boolean') throw new Error('unavailable');
      enabled = data.enabled;
      send.disabled = !enabled;
      status.textContent = enabled ? '可以提问 · 本次对话刷新后清空' : 'AI 暂未启用。免费材料卡点工具仍可使用。';
    } catch {
      status.textContent = '暂时无法连接 AI。关闭后重新打开可重试。';
      checked = false;
    }
  };
  const addMessage = (role, text) => {
    const item = document.createElement('p');
    item.className = 'ai-message ' + (role === 'user' ? 'is-user' : 'is-assistant');
    const label = document.createElement('span');
    label.className = 'ai-message-label';
    label.textContent = role === 'user' ? '你' : '申请助手';
    const body = document.createElement('span');
    body.textContent = text;
    item.append(label, body);
    log.append(item);
    item.scrollIntoView({ block: 'nearest' });
    content.scrollTop = content.scrollHeight;
  };


  const requestMessages = question => {
    const history = [];
    let remaining = 12000 - question.length - currentContext().length;
    for (let i = messages.length - 2; i >= 0 && history.length < 6; i -= 2) {
      const size = messages[i].content.length + messages[i + 1].content.length;
      if (size > remaining) break;
      history.unshift(messages[i], messages[i + 1]);
      remaining -= size;
    }
    return [...history, { role: 'user', content: question }];
  };

  launcher.addEventListener('click', () => setOpen(panel.hidden));
  closeButton.addEventListener('click', () => setOpen(false));
  panel.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !event.isComposing) {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === 'Tab' && mobile.matches) {
      const controls = [...panel.querySelectorAll('button:not([disabled]), textarea:not([disabled])')];
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
  document.querySelectorAll('.ai-prompts button').forEach(button => {
    button.addEventListener('click', () => {
      input.value = button.textContent;
      input.focus();
    });
  });
  document.getElementById('check-issue')?.addEventListener('change', refreshContext);
  document.getElementById('check-state')?.addEventListener('change', refreshContext);
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      if (enabled && !busy) form.requestSubmit();
    }
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const question = input.value.trim();
    if (!enabled || busy || !question) return;
    busy = true;
    send.disabled = true;
    input.disabled = true;
    addMessage('user', question);
    input.value = '';
    status.textContent = '正在整理下一步…';
    try {
      const response = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: requestMessages(question), context: currentContext() }),
        signal: AbortSignal.timeout(45000)
      });
      const data = await response.json();
      if (!response.ok) {
        const problem = new Error('unavailable');
        problem.status = response.status;
        throw problem;
      }
      if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('unavailable');
      addMessage('assistant', data.reply);
      messages.push({ role: 'user', content: question }, { role: 'assistant', content: data.reply });
      if (messages.length > 6) messages.splice(0, messages.length - 6);
      status.textContent = '可以继续问 · 具体学校要求请核对官方资料';
    } catch (problem) {
      const message = problem.status === 429 ? '提问较频繁，请稍后重试。你的问题已保留在输入框。' :
        problem.status === 504 || problem.name === 'TimeoutError' ? '这次等待回答超时，请稍后重试。你的问题已保留在输入框。' :
        '这次没有取得回答。你可以重新发送，或先使用页面上的免费材料卡点工具。';
      addMessage('assistant', message);
      input.value = question;
      status.textContent = '请求未完成，问题已保留在输入框。';
    } finally {
      busy = false;
      input.disabled = false;
      send.disabled = !enabled;
      if (!panel.hidden) input.focus();
    }
  });
})();
