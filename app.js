const DB = {
    // 키 값 상수
    KEYS: {
        TASKS: 'teamwork_tasks',
        DOCS: 'teamwork_docs',
        MEMBERS: 'teamwork_members'
    },

    // 초기화 (데이터가 없으면 빈 배열 생성)
    init() {
        if (!localStorage.getItem(this.KEYS.TASKS)) localStorage.setItem(this.KEYS.TASKS, JSON.stringify([]));
        if (!localStorage.getItem(this.KEYS.DOCS)) localStorage.setItem(this.KEYS.DOCS, JSON.stringify([]));
        if (!localStorage.getItem(this.KEYS.MEMBERS)) localStorage.setItem(this.KEYS.MEMBERS, JSON.stringify([]));
    },

    // 데이터 조회
    get(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    },

    // 데이터 저장
    set(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                alert('브라우저 저장 공간이 가득 찼습니다. 기존 파일을 삭제해주세요.');
            }
        }
    },

    // 아이템 추가 (Auto Increment ID 생성)
    add(key, item) {
        const list = this.get(key);
        const newItem = { 
            ...item, 
            _id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString() 
        };
        list.push(newItem);
        this.set(key, list);
        return newItem;
    },

    // 아이템 수정
    update(key, id, updates) {
        const list = this.get(key);
        const index = list.findIndex(item => item._id === id);
        if (index !== -1) {
            list[index] = { ...list[index], ...updates, updatedAt: new Date().toISOString() };
            this.set(key, list);
            return list[index];
        }
        return null;
    },

    // 아이템 삭제
    delete(key, id) {
        const list = this.get(key);
        const newList = list.filter(item => item._id !== id);
        this.set(key, newList);
    },

    // 전체 초기화
    clearAll() {
        localStorage.clear();
        this.init();
        location.reload();
    }
};

// ==========================================
// [UTILS] 공통 유틸리티
// ==========================================
const MAX_FILE_SIZE = 300 * 1024; // 300KB (LocalStorage 용량 제한 고려)

function showMessage(message, type = 'success') {
    const colors = { success: 'bg-green-500', error: 'bg-red-500', warning: 'bg-yellow-500' };
    const div = document.createElement('div');
    div.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-500 transform translate-y-0`;
    div.textContent = message;
    document.body.appendChild(div);
    setTimeout(() => {
        div.style.opacity = '0';
        div.style.transform = 'translateY(-20px)';
        setTimeout(() => div.remove(), 500);
    }, 3000);
}

const fileUtils = {
    formatSize(bytes) {
        if (bytes < 1024) return bytes + ' bytes';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else return (bytes / 1048576).toFixed(1) + ' MB';
    },
    getIcon(type) {
        if (type.includes('pdf')) return 'fa-file-pdf';
        if (type.includes('image')) return 'fa-file-image';
        return 'fa-file-alt';
    },
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }
};

// ==========================================
// [MODULE 1] 문서 관리 (Original: merged.js)
// ==========================================
const DocumentManager = {
    init() {
        this.render();
        this.setupUpload();
        this.setupSearch();
    },

    setupUpload() {
        const fileInput = document.getElementById('fileUpload');
        if (!fileInput) return;

        fileInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;

            // 조원 선택 모달 호출
            const uploader = await ModalManager.selectMember('파일을 업로드하는 조원을 선택하세요');
            if (!uploader) {
                fileInput.value = '';
                return;
            }

            for (const file of files) {
                if (file.size > MAX_FILE_SIZE) {
                    showMessage(`${file.name}: 용량 초과 (300KB 제한)`, 'error');
                    continue;
                }

                try {
                    const base64 = await fileUtils.fileToBase64(file);
                    DB.add(DB.KEYS.DOCS, {
                        title: file.name,
                        fileName: file.name,
                        fileType: file.type,
                        size: file.size,
                        uploadedBy: uploader,
                        data: base64
                    });
                    showMessage(`${file.name} 업로드 완료`);
                    // 기여도 업데이트 트리거
                    window.dispatchEvent(new CustomEvent('dataChanged'));
                } catch (err) {
                    console.error(err);
                    showMessage('파일 처리 중 오류 발생', 'error');
                }
            }
            this.render();
            fileInput.value = '';
        });
    },

    setupSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.render());
        }
    },

    render() {
        const container = document.getElementById('uploadedFiles');
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
        const files = DB.get(DB.KEYS.DOCS).reverse();

        if (!container) return;

        const filtered = files.filter(f => f.title.toLowerCase().includes(searchTerm));

        if (filtered.length === 0) {
            container.innerHTML = '<p class="text-gray-500 italic text-center py-4">문서가 없습니다.</p>';
            return;
        }

        container.innerHTML = filtered.map(file => `
            <div class="flex items-center justify-between p-4 bg-white rounded-lg shadow mb-4 border border-gray-100 hover:shadow-md transition">
                <div class="flex items-center space-x-4">
                    <div class="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                        <i class="fas ${fileUtils.getIcon(file.fileType)} text-xl"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-gray-800">${file.title}</h3>
                        <div class="text-sm text-gray-500 flex gap-2">
                            <span><i class="fas fa-user mr-1"></i>${file.uploadedBy}</span>
                            <span>|</span>
                            <span>${fileUtils.formatSize(file.size)}</span>
                        </div>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <a href="${file.data}" download="${file.fileName}" class="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition">
                        <i class="fas fa-download"></i>
                    </a>
                    <button onclick="DocumentManager.delete('${file._id}')" class="p-2 text-red-600 hover:bg-red-50 rounded-full transition">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },

    delete(id) {
        if (confirm('정말 삭제하시겠습니까?')) {
            DB.delete(DB.KEYS.DOCS, id);
            this.render();
            window.dispatchEvent(new CustomEvent('dataChanged'));
            showMessage('파일이 삭제되었습니다.');
        }
    }
};

// ==========================================
// [MODULE 2] 할일 관리 (Original: merged.js)
// ==========================================
const TaskManager = {
    init() {
        this.render();
        this.setupForm();
        this.setupFilters();
    },

    setupForm() {
        const form = document.getElementById('taskForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const assignee = await ModalManager.selectMember('담당자를 선택하세요');
            if (!assignee) return;

            const task = {
                title: document.getElementById('taskTitle').value,
                description: document.getElementById('taskDescription').value,
                dueDate: document.getElementById('taskDueDate').value,
                priority: document.getElementById('taskPriority').value,
                assignedTo: assignee,
                status: 'todo'
            };

            DB.add(DB.KEYS.TASKS, task);
            showMessage('할일이 추가되었습니다.');
            form.reset();
            this.render();
            window.dispatchEvent(new CustomEvent('dataChanged'));
        });
    },

    setupFilters() {
        ['taskSearch', 'statusFilter', 'priorityFilter', 'assigneeFilter'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => this.render());
        });
    },

    render() {
        const tasks = DB.get(DB.KEYS.TASKS);
        
        // 필터값 가져오기
        const search = document.getElementById('taskSearch')?.value.toLowerCase() || '';
        const status = document.getElementById('statusFilter')?.value || 'all';
        const priority = document.getElementById('priorityFilter')?.value || 'all';
        const assignee = document.getElementById('assigneeFilter')?.value || 'all';

        // 필터링
        const filtered = tasks.filter(t => {
            const mSearch = t.title.toLowerCase().includes(search) || t.description?.toLowerCase().includes(search);
            const mStatus = status === 'all' || 
                           (status === 'pending' && t.status === 'todo') ||
                           (status === 'in-progress' && t.status === 'in-progress') ||
                           (status === 'completed' && t.status === 'completed');
            const mPriority = priority === 'all' || t.priority === priority;
            const mAssignee = assignee === 'all' || t.assignedTo === assignee;
            return mSearch && mStatus && mPriority && mAssignee;
        });

        // 렌더링
        const activeList = document.getElementById('taskList');
        const completedList = document.getElementById('completedTaskList');
        
        if (activeList) activeList.innerHTML = this.buildHTML(filtered.filter(t => t.status !== 'completed'));
        if (completedList) completedList.innerHTML = this.buildHTML(filtered.filter(t => t.status === 'completed'));
    },

    buildHTML(tasks) {
        if (tasks.length === 0) return '<p class="text-gray-400 text-center italic py-4">항목이 없습니다.</p>';

        const priorityClass = { high: 'bg-red-100 text-red-800', medium: 'bg-yellow-100 text-yellow-800', low: 'bg-green-100 text-green-800' };
        const statusClass = { todo: 'bg-gray-100', 'in-progress': 'bg-blue-100 text-blue-800', completed: 'bg-green-100 text-green-800' };

        return tasks.map(task => `
            <div class="bg-white p-5 rounded-lg shadow-sm border border-gray-200 mb-4 hover:shadow-md transition relative group">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <h3 class="font-bold text-lg text-gray-800">${task.title}</h3>
                            <span class="px-2 py-1 rounded-full text-xs font-medium ${statusClass[task.status]}">
                                ${task.status === 'todo' ? '대기중' : task.status === 'in-progress' ? '진행중' : '완료됨'}
                            </span>
                            <span class="px-2 py-1 rounded-full text-xs font-medium ${priorityClass[task.priority]}">
                                ${task.priority.toUpperCase()}
                            </span>
                        </div>
                        <p class="text-gray-600 text-sm mb-3">${task.description || '설명 없음'}</p>
                        <div class="flex gap-4 text-xs text-gray-500">
                            <span><i class="far fa-calendar-alt mr-1"></i>${task.dueDate || '날짜 미정'}</span>
                            <span><i class="far fa-user mr-1"></i>${task.assignedTo}</span>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        ${task.status !== 'completed' ? `
                            <button onclick="TaskManager.updateStatus('${task._id}', 'in-progress')" class="w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition" title="진행중">
                                <i class="fas fa-spinner"></i>
                            </button>
                            <button onclick="TaskManager.complete('${task._id}')" class="w-8 h-8 rounded-full bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition" title="완료">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        <button onclick="TaskManager.delete('${task._id}')" class="w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition" title="삭제">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    },

    updateStatus(id, status) {
        DB.update(DB.KEYS.TASKS, id, { status });
        this.render();
        window.dispatchEvent(new CustomEvent('dataChanged'));
    },

    complete(id) {
        DB.update(DB.KEYS.TASKS, id, { status: 'completed', completedAt: new Date().toISOString() });
        this.render();
        window.dispatchEvent(new CustomEvent('dataChanged')); // 기여도 업데이트용
        showMessage('할일이 완료되었습니다! 🎉');
    },

    delete(id) {
        if (confirm('삭제하시겠습니까?')) {
            DB.delete(DB.KEYS.TASKS, id);
            this.render();
            window.dispatchEvent(new CustomEvent('dataChanged'));
            showMessage('삭제되었습니다.');
        }
    }
};

// ==========================================
// [MODULE 3] 기여도 및 멤버 관리 (Original: contribution.js)
// ==========================================
const ContributionManager = {
    init() {
        this.render();
        this.setupForm();
        this.setupReset();
    },

    setupForm() {
        const form = document.getElementById('memberForm');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('memberName').value.trim();
            const role = document.getElementById('memberRole').value.trim();

            const members = DB.get(DB.KEYS.MEMBERS);
            if (members.find(m => m.name === name)) {
                showMessage('이미 존재하는 이름입니다.', 'error');
                return;
            }

            DB.add(DB.KEYS.MEMBERS, { name, role });
            showMessage(`${name}님이 추가되었습니다.`);
            form.reset();
            this.updateAll();
        });
    },

    setupReset() {
        document.getElementById('resetContribution')?.addEventListener('click', () => {
            if (confirm('모든 데이터(파일, 할일, 멤버)가 초기화됩니다. 계속하시겠습니까?')) {
                DB.clearAll();
            }
        });
    },

    updateAll() {
        this.render();
        // 할일 탭의 담당자 필터 업데이트
        const filterSelect = document.getElementById('assigneeFilter');
        if (filterSelect) {
            const current = filterSelect.value;
            const members = DB.get(DB.KEYS.MEMBERS);
            filterSelect.innerHTML = `<option value="all">모든 담당자</option>` + 
                members.map(m => `<option value="${m.name}">${m.name}</option>`).join('');
            filterSelect.value = current;
        }
    },

    render() {
        const members = DB.get(DB.KEYS.MEMBERS);
        const tasks = DB.get(DB.KEYS.TASKS);
        const docs = DB.get(DB.KEYS.DOCS);

        // 상단 카운터
        const totalDocsEl = document.getElementById('totalDocuments');
        const completedTasksEl = document.getElementById('completedTasks');
        const completedTasksCount = tasks.filter(t => t.status === 'completed').length;

        if (totalDocsEl) totalDocsEl.textContent = docs.length;
        if (completedTasksEl) completedTasksEl.textContent = completedTasksCount;

        // 기여도 계산
        const totalActivity = docs.length + completedTasksCount;
        const list = document.getElementById('contributionList');
        
        if (!list) return;

        if (members.length === 0) {
            list.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">등록된 조원이 없습니다. 먼저 조원을 추가해주세요.</td></tr>';
            return;
        }

        list.innerHTML = members.map(member => {
            // 이름 매칭으로 카운트
            const myDocs = docs.filter(d => d.uploadedBy === member.name).length;
            const myTasks = tasks.filter(t => t.status === 'completed' && t.assignedTo === member.name).length;
            const myTotal = myDocs + myTasks;
            const percentage = totalActivity === 0 ? 0 : Math.round((myTotal / totalActivity) * 100);

            return `
                <tr class="hover:bg-gray-50 transition">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${member.name}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${member.role}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${myDocs}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${myTasks}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <span class="text-sm font-bold text-blue-600 w-10">${percentage}%</span>
                            <div class="w-24 h-2 bg-gray-200 rounded-full ml-2 overflow-hidden">
                                <div class="h-full bg-blue-500 rounded-full" style="width: ${percentage}%"></div>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }
};

// ==========================================
// [MODULE 4] 한글 명언 관리 (NEW & UPDATED)
// ==========================================
// ==========================================
// [MODULE 4] 한글 명언 관리 (수정됨)
// ==========================================
const QuoteManager = {
    // 한국어 명언 API (무료)
    API_URL: 'https://korean-advice-open-api.vercel.app/api/advice',

    fallbackQuotes: [
        { message: "시작이 반이다.", author: "속담" },
        { message: "늦었다고 생각할 때가 가장 빠르다.", author: "속담" },
        { message: "팀워크는 꿈을 현실로 만든다.", author: "존 맥스웰" },
        { message: "천리길도 한 걸음부터.", author: "노자" },
        { message: "혼자 가면 빨리 가고, 함께 가면 멀리 간다.", author: "아프리카 속담" },
        { message: "실패는 성공의 어머니이다.", author: "에디슨" },
        { message: "중요한 것은 꺾이지 않는 마음이다.", author: "미상" }
    ],

    init() {
        this.fetchQuote();
    },

    async fetchQuote() {
        const quoteEl = document.getElementById('dailyQuote');
        const authorEl = document.getElementById('quoteAuthor');
        const icon = document.getElementById('quoteRefreshIcon');
        
        if(!quoteEl || !authorEl) return;

        // 1. 애니메이션 리셋 (클래스 제거)
        // 클래스를 제거해야 나중에 다시 붙였을 때 애니메이션이 재생됩니다.
        quoteEl.classList.remove('fade-in');
        authorEl.classList.remove('fade-in');

        // 로딩 표시
        if(icon) icon.classList.add('fa-spin');
        quoteEl.style.opacity = '0.5';
        authorEl.style.opacity = '0.5';

        try {
            const response = await fetch(this.API_URL);
            
            if (!response.ok) throw new Error('API Error');
            
            const data = await response.json();
            this.updateUI(data.message, data.author);
            
        } catch(error) {
            console.log("API 호출 실패, 로컬 데이터 사용:", error);
            const randomQuote = this.fallbackQuotes[Math.floor(Math.random() * this.fallbackQuotes.length)];
            this.updateUI(randomQuote.message, randomQuote.author);
        } finally {
            // 아이콘 회전 멈춤
            if(icon) setTimeout(() => icon.classList.remove('fa-spin'), 500);

            // 2. 애니메이션 재실행 트리거 (중요!)
            // 브라우저가 '클래스 제거' -> '클래스 추가'를 인식하도록 강제로 리플로우(Reflow)를 발생시킵니다.
            void quoteEl.offsetWidth; 
            
            // 클래스를 다시 추가하여 애니메이션 실행
            quoteEl.classList.add('fade-in');
            authorEl.classList.add('fade-in');
            
            // 투명도 원상복구
            quoteEl.style.opacity = '1';
            authorEl.style.opacity = '1';
        }
    },

    updateUI(message, author) {
        const quoteEl = document.getElementById('dailyQuote');
        const authorEl = document.getElementById('quoteAuthor');
        
        quoteEl.textContent = `"${message}"`;
        authorEl.textContent = `- ${author}`;
    }
};

// ==========================================
// [UTILS] 모달 매니저
// ==========================================
const ModalManager = {
    selectMember(title) {
        return new Promise((resolve) => {
            const members = DB.get(DB.KEYS.MEMBERS);
            if (members.length === 0) {
                showMessage('조원이 없습니다. 기여도 탭에서 조원을 먼저 등록해주세요.', 'warning');
                resolve(null);
                return;
            }

            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]';
            modal.innerHTML = `
                <div class="bg-white rounded-xl p-6 w-96 shadow-2xl transform transition-all scale-100">
                    <h3 class="text-xl font-bold mb-4 text-gray-800">${title}</h3>
                    <div class="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                        ${members.map(m => `
                            <button class="w-full text-left p-3 hover:bg-blue-50 rounded-lg border border-gray-100 transition-all flex justify-between items-center group member-btn" data-name="${m.name}">
                                <span class="font-bold text-gray-700 group-hover:text-blue-600">${m.name}</span>
                                <span class="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded group-hover:bg-blue-100 group-hover:text-blue-500">${m.role}</span>
                            </button>
                        `).join('')}
                    </div>
                    <div class="mt-6 flex justify-end">
                        <button id="cancelModal" class="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium transition">취소</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            modal.querySelectorAll('.member-btn').forEach(btn => {
                btn.onclick = () => {
                    resolve(btn.dataset.name);
                    modal.remove();
                };
            });

            modal.querySelector('#cancelModal').onclick = () => {
                resolve(null);
                modal.remove();
            };
        });
    }
};

// ==========================================
// [INIT] 앱 초기화 및 탭 설정
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. DB 초기화
    DB.init();

    // 2. 각 모듈 초기화
    DocumentManager.init();
    TaskManager.init();
    ContributionManager.init();
    ContributionManager.updateAll();
    
    // [NEW] 명언 매니저 초기화
    QuoteManager.init(); 

    // 3. 탭 전환 로직
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            // 스타일 초기화
            tabs.forEach(t => {
                t.classList.remove('border-blue-600', 'text-blue-600', 'active');
                t.classList.add('border-transparent');
            });
            // 선택된 탭 활성화
            tab.classList.add('border-blue-600', 'text-blue-600', 'active');
            tab.classList.remove('border-transparent');

            // 섹션 전환
            document.querySelectorAll('.tab-content').forEach(c => {
                c.classList.add('hidden');
                c.classList.remove('active');
            });
            const target = document.getElementById(tab.dataset.target);
            target.classList.remove('hidden');
            target.classList.add('active');

            // 탭 전환 시 데이터 갱신 (싱크 맞추기)
            if (tab.dataset.target === 'contribution-section') ContributionManager.updateAll();
            if (tab.dataset.target === 'tasks-section') TaskManager.render();
            if (tab.dataset.target === 'documents-section') DocumentManager.render();
        });
    });

    // 4. 전역 이벤트 리스너 (데이터 변경 시 모든 뷰 갱신)
    window.addEventListener('dataChanged', () => {
        ContributionManager.updateAll();
        // 현재 활성화된 탭에 따라 리렌더링이 필요할 수 있으나, 탭 클릭 시 리렌더링 하므로 생략 가능
        // 하지만 실시간성을 위해 업데이트
        TaskManager.render();
        DocumentManager.render();
    });
});