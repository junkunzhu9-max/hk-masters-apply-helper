const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.site-nav');
if (menuButton && menu) {
  const closeMenu = () => {
    menu.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.textContent = '菜单';
  };
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menu.classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.textContent = open ? '收起' : '菜单';
  });
  menu.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.classList.contains('is-open')) {
      closeMenu();
      menuButton.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!menu.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
  });
  matchMedia('(min-width: 761px)').addEventListener('change', closeMenu);
}
const panels = [...document.querySelectorAll('[data-case-panel]')];
if (panels.length) {
  const requested = new URLSearchParams(location.search).get('case');
  const active = panels.find(panel => panel.dataset.casePanel === requested) || panels[0];
  panels.forEach(panel => { panel.hidden = panel !== active; });
  document.querySelectorAll('[data-case-link]').forEach(link => {
    if (link.dataset.caseLink === active.dataset.casePanel) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  document.getElementById('case-title').textContent = active.dataset.title;
  document.getElementById('case-crumb').textContent = active.dataset.label;
  document.title = active.dataset.label + '｜港硕申请助手';
}
const copyButton = document.getElementById('copy-draft');
if (copyButton) {
  copyButton.addEventListener('click', async () => {
    const draft = document.getElementById('consult-draft');
    const status = document.getElementById('copy-status');
    if (!draft.value.trim()) {
      status.textContent = '请先写下候选项目、入学年度和材料卡点。';
      draft.focus();
      return;
    }
    try {
      await navigator.clipboard.writeText(draft.value.trim());
      status.textContent = '已复制。请自行粘贴使用；没有发送或提交预约。';
    } catch {
      draft.focus();
      draft.select();
      status.textContent = '浏览器未允许自动复制。文字已选中，请手动复制。';
    }
  });
}

const checkForm = document.getElementById('quick-check-form');
if (checkForm) {
  const issue = document.getElementById('check-issue');
  const state = document.getElementById('check-state');
  const result = document.getElementById('check-result');
  const status = document.getElementById('check-status');
  const copyStatus = document.getElementById('action-copy-status');
  const copyFallback = document.getElementById('action-copy-fallback');
  const labels = ['先做什么', '找谁推进', '完成依据', '何时值得人工核对'];
  const fields = ['first', 'who', 'evidence', 'manual'];
  const rules = {
    transcript: [
      { value: 'request', label: '还没有申请正式成绩单',
        first: '先查看毕业院校正式成绩单的申请办法，申请完整成绩单，并询问评分制度说明如何取得。',
        who: '毕业院校教务处、注册处或负责出具成绩单的部门。',
        evidence: '取得正式文件，再核对姓名、课程记录是否完整以及适用的评分说明。提交申请或付款回执，只能证明已经申请。',
        manual: '先自行申请文件；取得后，如果不清楚不同候选项目及年度需要哪种版本，再考虑人工逐项核对。' },
      { value: 'waiting', label: '已申请，正在等文件',
        first: '确认申请已被受理、预计出具日期和领取方式；如时间紧，查看候选项目是否有适用的补交说明。',
        who: '毕业院校文件出具部门；具体补交规则向候选项目办公室确认。',
        evidence: '出具部门确认受理及预计日期，表示进度已明确；只有收到文件后，才把“尚缺”改为“已取得待核”。',
        manual: '等待与催问可自行推进；如果补交说法不清楚或几个项目要求不同，人工可帮助对应出处、年度和待确认问题。' },
      { value: 'check', label: '已取得文件，待核对版本',
        first: '把文件与候选项目该年度、该申请阶段的官方清单并排查看，核对完整性、语言、认证和提交方式。',
        who: '自己先对照项目官网；文件内容或版本问题找毕业院校，项目要求不明找项目办公室。',
        evidence: '每一项对照都留有适用年度的官方出处或明确答复；仍无依据的项目保留待确认，不自行判定合格。',
        manual: '当多个项目要求不同、版本难以对应时，可考虑人工核对个人文件与项目条款，并保留依据及未知项。' }
    ],
    terms: [
      { value: 'compare', label: '尚未对照两处官方说法',
        first: '分别保存两处官方页面的链接和原文，确认是否属于同一项目、年度与申请阶段。',
        who: '自己先整理出处；无法判断适用范围时，向项目办公室询问。',
        evidence: '两处说法的项目、年度和适用阶段已标清；若仍不一致，继续保留冲突状态。',
        manual: '能自行确认适用范围就先推进；多处条款仍难对应时，人工可协助整理依据和明确的问题。' },
      { value: 'conflict', label: '已对照，仍看到冲突',
        first: '把两处链接、原文和拟入学年度写在同一条询问中，请项目办公室明确该项目本轮应按哪项要求准备。',
        who: '该候选项目办公室或官网列出的招生联系部门。',
        evidence: '取得适用本轮项目的明确官方答复或申请系统条目；发出邮件本身不算问题解决。',
        manual: '如果需要帮助把冲突对应到个人材料，可以考虑人工整理出处、未知项和询问内容；联系学校仍由你完成。' },
      { value: 'asked', label: '已经询问，等待学校回复',
        first: '保留已发出的询问与两处依据，继续准备已经明确的材料；按官方联系办法跟进未答复的问题。',
        who: '此前联系的项目办公室；避免把其他年度或其他项目的答复直接套用。',
        evidence: '收到能明确对应项目、年度与问题的官方答复，再更新结论；没收到时继续标为待确认。',
        manual: '等回复可自行跟进；若已有人工核对清单，新答复可纳入约定的一次原清单反馈复核。' }
    ],
    report: [
      { value: 'choose', label: '尚未确认推荐人同意',
        first: '先核对该项目本轮推荐人要求，再联系合适人选，确认对方是否同意及能否按时完成。',
        who: '拟邀请的推荐人；人数、身份或流程要求不清楚时，找项目办公室。',
        evidence: '推荐人明确同意并了解时间安排，只说明人选已确认，报告提交与学校收件仍需分别跟进。',
        manual: '联系推荐人可自行推进；不同项目对推荐人身份或报告要求不同、难以对应时，再考虑人工核对。' },
      { value: 'invited', label: '推荐人已同意，或已发出邀请',
        first: '按实际申请流程确认邀请是否发出、推荐人是否收到，并分别记录邀请与报告提交状态。',
        who: '推荐人；系统邀请或收件状态有疑问时，找项目官方支持或办公室。',
        evidence: '明确邀请是否送达及报告是否提交；同意或收到邀请都不能作为学校收到报告的依据。',
        manual: '日常跟进可自行完成；几个项目的提交流程不同，或系统与推荐人说法不一致时，可人工整理证据和待确认项。' },
      { value: 'submitted', label: '推荐人说已提交报告',
        first: '查看大学申请系统或正式通知中的报告状态；若未显示收到，保留待确认并向官方联系部门询问。',
        who: '项目办公室或申请系统官方支持；必要时请推荐人确认提交时间与回执。',
        evidence: '学校系统或正式通知明确显示已收到报告，才更新收件状态；推荐人口头说明或自己打勾不能替代学校确认。',
        manual: '查系统和询问可自行推进；提交回执与学校状态不一致时，可人工协助整理对应材料与未知项，仍以官方确认为准。' }
    ]
  };
  let actionText = '';
  const clearCopyFallback = () => {
    copyFallback.hidden = true;
    copyFallback.value = '';
  };
  const clearResult = () => {
    result.hidden = true;
    actionText = '';
    clearCopyFallback();
    status.textContent = '';
    copyStatus.textContent = '';
  };
  const updateStates = () => {
    clearResult();
    state.replaceChildren(new Option(issue.value ? '请选择当前状态' : '先选择材料问题', ''));
    state.disabled = !issue.value;
    if (issue.value) {
      rules[issue.value].forEach(rule => state.add(new Option(rule.label, rule.value)));
      status.textContent = '请选择当前状态，再查看下一步。';
    }
  };
  issue.addEventListener('change', updateStates);
  state.addEventListener('change', clearResult);
  checkForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!checkForm.reportValidity()) return;
    const rule = rules[issue.value].find(item => item.value === state.value);
    const selection = issue.selectedOptions[0].textContent + ' · ' + rule.label;
    document.getElementById('check-selection').textContent = selection;
    fields.forEach(field => { document.getElementById('check-' + field).textContent = rule[field]; });
    actionText = ['材料卡点行动提示', selection, ...fields.map((field, index) => labels[index] + '：' + rule[field]),
      document.querySelector('.check-disclosure').textContent].join('\n\n');
    copyStatus.textContent = '';
    clearCopyFallback();
    result.hidden = false;
    status.textContent = '行动提示已生成，请查看下方四项。';
  });
  document.getElementById('copy-action').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(actionText);
      clearCopyFallback();
      copyStatus.textContent = '已复制行动提示。咨询草稿未被改动，没有发送信息。';
    } catch {
      copyFallback.value = actionText;
      copyFallback.hidden = false;
      copyFallback.focus();
      copyFallback.select();
      copyStatus.textContent = '浏览器未允许自动复制。下方完整行动提示已选中，请手动复制。';
    }
  });
  updateStates();
  checkForm.hidden = false;
}
