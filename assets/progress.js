(() => {
  const KEY = 'hkmasters.progress.v1';
  const TARGET = 'cuhk-gastroenterology-2027';
  const CHECKED = '2026-10-05';
  const DEADLINE = '2027-04-30';
  const addDays = (day, days) => new Date(Date.parse(day + 'T00:00:00Z') + days * 86400000).toISOString().slice(0, 10);
  const REPORT_DEADLINE = addDays(DEADLINE, 14);
  const statuses = { todo: '待准备', working: '准备中', prepared: '已准备', submitted: '已提交', awaiting: '待学校确认' };
  const regions = { mainland: '中国内地', other: '其他地区', unknown: '授予地待确认' };
  const graduations = { graduated: '已毕业', studying: '在读', unknown: '毕业状态待确认' };
  const englishLabels = { ready: '已有英语证明', preparing: '英语证明准备中', exemption: '拟用英语豁免，待核实' };
  const sources = { project: ['项目申请说明', '#source-project'], general: ['研究生院通用要求', '#source-general'], contact: ['官方联系页', '#source-contact'] };
  const tasks = [
    { id: 'flow', title: '核实具体提交流程', sources: ['project', 'general', 'contact'],
      detail: '必需核对：项目页列网上申请后寄送项目办公室，正式本科成绩单直送或密封；通用页列申请阶段上传全部高等教育成绩单及评分说明，录取阶段提供原件。推荐报告在项目页列直送或密封，通用页列线上填写推荐人资料。两处要求不能直接合并为同一个已核实流程。',
      action: '把两处原文、2027 年度和你的申请阶段整理成一个问题，向 postgrad.gi@cuhk.edu.hk 确认实际提交方式与顺序。' },
    { id: 'application', title: '网上申请', sources: ['project', 'contact'],
      detail: '申请截止 2027-04-30。申请者自行在大学申请系统填写并提交；本页只记录进度。',
      action: '先核实 2027 项目和实际提交要求，再自行完成网上申请并保留系统记录。' },
    { id: 'fee', title: '申请费收据', sources: ['project'],
      detail: '按项目要求准备申请费付款收据；本清单不填写金额，也不提供支付入口。',
      action: '从实际付款渠道取得收据，核对申请对应信息及所需提交方式。' },
    { id: 'transcript', title: '正式成绩单与评分说明', sources: ['project', 'general'],
      detail: '项目页要求正式本科成绩单直送或密封；通用页要求申请阶段上传全部高等教育成绩单及评分说明，录取阶段提供原件。中文／英文以外的文件附认证英文翻译。两处阶段与提交方式的差异需项目确认。',
      action: '向院校出具部门取得正式成绩单和评分说明，保留密封或直送安排；先问清上传与纸本如何衔接。' },
    { id: 'degree', title: '学位证书', sources: ['project', 'general'],
      detail: '准备学位证书。项目列明认可院校的医疗健康相关或生物医学学士学位；同等资格是否认可需由校方确认。本页不依据专业文字判断达标。仍在读是否接受申请、需要何种学历或预计毕业证明，待项目确认。',
      action: '已毕业者整理学位证书；在读或毕业状态未明者，先向项目询问适用文件与补交阶段。' },
    { id: 'graduation-certificate', title: '内地毕业证书', mainland: true, sources: ['project', 'general'],
      detail: '内地学历除学位证书外，再核对毕业证书要求。在读者的适用文件与提交阶段需项目确认。',
      action: '整理毕业证书；尚未毕业时先确认是否允许及如何补交，不把学位证书自动当作毕业证书。' },
    { id: 'verification', title: '内地学历／学位及成绩验证报告', mainland: true, sources: ['general'],
      detail: '通用要求涉及内地学历／学位在线验证报告与成绩验证报告；是否适用、具体版本和提交阶段按校方通知核对。',
      action: '核实对应的官方验证渠道和适用报告，按校方通知取得并提交；不要只凭本清单判定验证完成。' },
    { id: 'english', title: '英语能力证明', sources: ['project', 'general'],
      detail: 'TOEFL／IELTS 成绩两年有效；项目页列 IELTS（Academic）6.5。通用要求填写考试信息并分享正式结果。豁免需要适用证明，不能自动判定通过。',
      action: '核对成绩有效期、适用门槛和正式送分方式，再按校方要求填写考试信息并分享正式结果。' },
    { id: 'referee-1', title: '推荐报告 1', sources: ['project', 'general'],
      detail: '两位推荐人分别提交保密推荐。项目页列推荐人直送或申请者寄密封件，通用页列线上填写推荐人资料。2027-05-14 是按截止后两周计算的办公室最迟收件日期；仅发送不代表收件。推荐人关系与职称本次官网条款未明确。',
      action: '先确认推荐人同意与时间，再向项目确认推荐人条件、邀请和实际提交流程；分别记录提交与收件。' },
    { id: 'referee-2', title: '推荐报告 2', sources: ['project', 'general'],
      detail: '第二位推荐人单独提交保密推荐。办公室最迟收件日期按截止后两周计算为 2027-05-14。直送／密封与线上填写推荐人资料的流程待项目确认，不推定必须教授或任一职称都可。',
      action: '与第二位推荐人确认安排，并单独保留邀请、提交和校方收件依据。' },
    { id: 'identity', title: '身份证或护照复印件', sources: ['project', 'general'],
      detail: '按项目要求自行准备身份证或护照复印件。本页只记录状态，不上传、保存或要求填写证件号码。',
      action: '核对校方实际接收渠道和所需版本，将证件文件留在你自己的安全位置。' },
    { id: 'authorization', title: '学历核验授权表', sources: ['general'],
      detail: '通用网页列学历核验授权表；学历资格验证须在开学前至少一个月完成。开学日尚未明确，本清单不编造具体日期。',
      action: '核对授权表适用要求并按校方通知办理，取得开学日后再核算资格验证时限。' }
  ];
  const form = document.getElementById('background-form');
  const editor = document.getElementById('background-editor');
  const build = document.getElementById('build-checklist');
  const checklist = document.getElementById('checklist');
  const status = document.getElementById('save-status');
  const clear = document.getElementById('clear-progress');
  const retry = document.getElementById('retry-save');
  const receipt = document.getElementById('application-receipt');
  const receiptDate = document.getElementById('receipt-date');
  const fields = { awardRegion: document.getElementById('award-region'), graduation: document.getElementById('graduation'), subject: document.getElementById('subject'), english: document.getElementById('english-proof') };
  const rows = new Map();
  let state = null;
  let stored = false;

  const make = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  };
  const calendarDay = () => {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type).value).join('-');
  };
  const validDay = day => typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isFinite(Date.parse(day + 'T00:00:00Z')) && new Date(day + 'T00:00:00Z').toISOString().slice(0, 10) === day;
  const exact = (value, keys) => value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
  const member = (choices, value) => typeof value === 'string' && Object.hasOwn(choices, value);
  const validRecord = value => exact(value, ['version', 'target', 'background', 'tasks', 'receipt', 'savedAt']) &&
    value.version === 1 && value.target === TARGET && exact(value.background, ['awardRegion', 'graduation', 'subject', 'english']) &&
    member(regions, value.background.awardRegion) && member(graduations, value.background.graduation) &&
    typeof value.background.subject === 'string' && value.background.subject.length <= 100 && member(englishLabels, value.background.english) &&
    exact(value.tasks, tasks.map(task => task.id)) && tasks.every(task => member(statuses, value.tasks[task.id])) &&
    exact(value.receipt, ['status', 'date']) && ['unconfirmed', 'confirmed'].includes(value.receipt.status) &&
    (value.receipt.date === '' || validDay(value.receipt.date)) && typeof value.savedAt === 'string' && Number.isFinite(Date.parse(value.savedAt));
  const say = (text, error = false) => {
    status.textContent = text;
    status.classList.toggle('is-error', error);
  };
  const save = () => {
    state.savedAt = new Date().toISOString();
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      stored = true;
      clear.hidden = false;
      retry.hidden = true;
      say('已保存到当前浏览器。刷新此页可恢复本人记录的进度。');
    } catch {
      retry.hidden = false;
      clear.hidden = false;
      say('本次更改未保存：浏览器可能禁用本地存储或空间已满。当前操作仍留在页面上；刷新或关闭可能丢失。请保持页面打开，允许存储后重试。', true);
    }
  };
  const activeTasks = () => tasks.filter(task => !task.mainland || state.background.awardRegion !== 'other');
  const taskTitle = task => task.id === 'english' && state.background.english === 'exemption' ? '英语豁免证明与资格待确认' : task.title;
  const taskAction = task => {
    const current = state.tasks[task.id];
    if (current === 'submitted' || current === 'awaiting') {
      if (task.id === 'application' && state.receipt.status === 'confirmed') return '你已记录取得正式申请确认。保留通知；这不代表其他材料或推荐报告已被收齐，也不代表录取。';
      return task.id === 'flow' ? '你已将核对问题记录为已提交或待学校确认。保留询问记录，等待项目对实际流程的明确答复。' :
        '你已记录提交或待学校确认。现在核实这一项的送达或正式收件依据；本人记录不代替校方确认。' +
        (task.id.startsWith('referee-') ? '正式申请确认不等于这份推荐报告已被办公室收到。' : '');
    }
    if (current === 'prepared') {
      return task.id === 'flow' ? '你已记录为已准备。保留项目的明确答复，再按已确认方式安排材料提交。' :
        '你已记录材料准备完成。按已确认的渠道和阶段自行提交，保留提交记录后再修改状态。' +
        (task.id === 'english' && state.background.english === 'exemption' ? '豁免资格仍需项目明确确认。' : '');
    }
    if (task.id === 'english' && state.background.english === 'exemption') return '准备豁免证明并询问项目是否适用；未取得明确确认前保留待核实，不把拟用豁免当作已经通过。';
    return task.action;
  };
  const dateNotices = () => {
    const notices = document.getElementById('date-notices');
    notices.replaceChildren();
    const today = calendarDay();
    const distance = day => Math.round((Date.parse(day + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / 86400000);
    for (const item of [{ day: DEADLINE, title: '网上申请', ids: ['application'] }, { day: REPORT_DEADLINE, title: '推荐报告到办公室', ids: ['referee-1', 'referee-2'] }]) {
      const days = distance(item.day);
      if (days > 7) continue;
      const recorded = item.ids.every(id => ['submitted', 'awaiting'].includes(state.tasks[id]));
      let message = item.title + '日期 ' + item.day + (days < 0 ? ' 已过。' : days === 0 ? ' 就在今天。' : ' 距今 ' + days + ' 天。');
      if (recorded) {
        message += item.ids[0] === 'application' && state.receipt.status === 'confirmed' ?
          '你已记录取得正式申请确认，保留通知；这不代表推荐报告已经收齐。' :
          '你已记录提交或待确认，下一步核实正式收件依据，而非把发送当作学校收到。';
      } else message += days < 0 ? '先向项目确认是否仍有适用安排；本页不认定迟交获准。' : '按已确认流程推进尚未提交的项目，并留出送达和确认时间。';
      notices.append(make('p', '', message));
    }
    if (distance(addDays(CHECKED, 10)) <= 0) notices.append(make('p', '', '资料复核已到期：本清单仍按 ' + CHECKED + ' 官网快照整理。请重新打开官方来源核对变化；没有自动更新，也未代表人工服务已复核。'));
  };
  const updateView = () => {
    const active = activeTasks();
    const ready = active.filter(task => ['prepared', 'submitted', 'awaiting'].includes(state.tasks[task.id])).length;
    const submitted = active.filter(task => ['submitted', 'awaiting'].includes(state.tasks[task.id])).length;
    for (const [name, value] of [['prepared', ready], ['submitted', submitted]]) {
      document.getElementById(name + '-count').textContent = value + ' / ' + active.length;
      const meter = document.getElementById(name + '-progress');
      meter.max = active.length;
      meter.value = value;
    }
    tasks.forEach(task => {
      const row = rows.get(task.id);
      row.article.hidden = !active.includes(task);
      row.article.className = 'progress-task is-' + state.tasks[task.id];
      row.title.textContent = taskTitle(task);
      row.select.setAttribute('aria-label', taskTitle(task) + '：我的状态');
      row.select.value = state.tasks[task.id];
      row.detail.textContent = task.detail + (task.mainland && state.background.awardRegion === 'unknown' ? '\n授予地待确认：先核对是否适用此项。' : '');
      row.next.textContent = taskAction(task);
    });
    const next = active.find(task => task.id === 'flow' && ['todo', 'working'].includes(state.tasks[task.id])) ||
      active.find(task => state.tasks[task.id] === 'working') || active.find(task => state.tasks[task.id] === 'todo') ||
      active.find(task => state.tasks[task.id] === 'prepared') || active[0];
    document.getElementById('next-title').textContent = taskTitle(next);
    document.getElementById('next-description').textContent = taskAction(next);
    document.getElementById('next-link').href = '#task-row-' + next.id;
    const inactive = tasks.filter(task => !active.includes(task));
    document.getElementById('inactive-history').hidden = !inactive.length;
    const history = document.getElementById('inactive-tasks');
    history.replaceChildren(...inactive.map(task => make('li', '', task.title + '：' + statuses[state.tasks[task.id]])));
    document.getElementById('background-summary').textContent = regions[state.background.awardRegion] + ' · ' + graduations[state.background.graduation] + ' · ' + englishLabels[state.background.english];
    receipt.value = state.receipt.status;
    receiptDate.value = state.receipt.date;
    receiptDate.disabled = state.receipt.status !== 'confirmed';
    checklist.hidden = false;
    build.textContent = '保存背景修改';
    clear.hidden = false;
    dateNotices();
  };
  tasks.forEach(task => {
    const article = make('article', 'progress-task');
    article.id = 'task-row-' + task.id;
    const body = make('div');
    const title = make('h3', '', task.title);
    const detail = make('p', 'task-detail', task.detail);
    const next = make('p', 'task-next');
    const links = make('div', 'task-sources');
    task.sources.forEach(source => {
      const link = make('a', '', sources[source][0]);
      link.href = sources[source][1];
      links.append(link);
    });
    body.append(title, detail, next, links);
    const control = make('div', 'task-state');
    const label = make('label', '', '我的状态');
    label.htmlFor = 'task-' + task.id;
    const select = make('select');
    select.id = label.htmlFor;
    select.setAttribute('aria-label', task.title + '：我的状态');
    Object.entries(statuses).forEach(([value, text]) => { const option = make('option', '', text); option.value = value; select.append(option); });
    select.addEventListener('change', () => {
      state.tasks[task.id] = select.value;
      updateView();
      save();
    });
    control.append(label, select);
    article.append(body, control);
    document.getElementById('task-list').append(article);
    rows.set(task.id, { article, title, detail, next, select });
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    fields.subject.setCustomValidity(fields.subject.value.length > 100 ? '专业最多填写 100 字。' : '');
    if (!form.reportValidity()) return;
    const background = { awardRegion: fields.awardRegion.value, graduation: fields.graduation.value, subject: fields.subject.value.trim(), english: fields.english.value };
    if (!state) state = { version: 1, target: TARGET, background, tasks: Object.fromEntries(tasks.map(task => [task.id, 'todo'])), receipt: { status: 'unconfirmed', date: '' }, savedAt: '' };
    else state.background = background;
    updateView();
    save();
    editor.open = false;
    document.getElementById('next-title').focus();
  });
  fields.subject.addEventListener('input', () => fields.subject.setCustomValidity(''));
  receipt.addEventListener('change', () => { state.receipt.status = receipt.value; updateView(); save(); });
  receiptDate.addEventListener('change', () => {
    if (!receiptDate.reportValidity() || (receiptDate.value && !validDay(receiptDate.value))) return;
    state.receipt.date = receiptDate.value;
    save();
  });
  retry.addEventListener('click', () => { if (state) save(); });
  clear.addEventListener('click', () => {
    if (!confirm('清除当前浏览器中的这份个人清单？已记录的背景和状态无法恢复。')) return;
    try { localStorage.removeItem(KEY); }
    catch { say('未能清除本地记录。浏览器可能禁止存储操作；当前记录仍保留。', true); return; }
    state = null;
    stored = false;
    form.reset();
    fields.subject.setCustomValidity('');
    checklist.hidden = true;
    editor.open = true;
    build.textContent = '建立我的清单';
    document.getElementById('background-summary').textContent = '用于显示适用材料';
    receipt.value = 'unconfirmed';
    receiptDate.value = '';
    receiptDate.disabled = true;
    clear.hidden = true;
    retry.hidden = true;
    say('已清除这份本地清单。可重新填写背景并建立。');
    fields.awardRegion.focus({ preventScroll: true });
  });
  form.hidden = false;
  document.getElementById('save-controls').hidden = false;
  try {
    const raw = localStorage.getItem(KEY);
    stored = raw !== null;
    if (raw !== null) {
      const saved = JSON.parse(raw);
      if (!validRecord(saved)) throw new Error('invalid record');
      state = saved;
      Object.entries(fields).forEach(([name, field]) => { field.value = state.background[name]; });
      updateView();
      editor.open = false;
      say('已恢复当前浏览器保存的清单。状态仍是本人记录，需保留校方确认依据。');
    } else say('尚未建立清单。填写背景后，点击建立才会本地保存。');
  } catch {
    say('本地记录无法读取或格式已失效，未恢复也未覆盖。你仍可建立新清单；成功保存会替换本站这份旧记录。', true);
  }
  clear.hidden = !state && !stored;
})();
