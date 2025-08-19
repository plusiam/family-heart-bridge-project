// 🎓 학생 정보 및 다운로드 기능 공통 모듈
// 모든 도구에서 사용할 수 있는 공통 기능

class StudentPortfolioManager {
    constructor() {
        this.studentInfo = this.loadStudentInfo();
        this.activityLog = this.loadActivityLog();
    }

    // 학생 정보 관리
    loadStudentInfo() {
        const saved = localStorage.getItem('studentInfo');
        return saved ? JSON.parse(saved) : {
            name: '',
            school: '',
            grade: '3',
            class: '',
            number: '',
            teacher: ''
        };
    }

    saveStudentInfo(info) {
        this.studentInfo = { ...this.studentInfo, ...info };
        localStorage.setItem('studentInfo', JSON.stringify(this.studentInfo));
        return this.studentInfo;
    }

    // 활동 기록 관리
    loadActivityLog() {
        const saved = localStorage.getItem('activityLog');
        return saved ? JSON.parse(saved) : [];
    }

    addActivity(activity) {
        const activityData = {
            id: `activity_${Date.now()}`,
            timestamp: new Date().toISOString(),
            student: this.studentInfo,
            ...activity
        };
        
        this.activityLog.push(activityData);
        localStorage.setItem('activityLog', JSON.stringify(this.activityLog));
        
        // 포트폴리오 데이터에도 추가
        this.updatePortfolio(activityData);
        
        return activityData;
    }

    updatePortfolio(activity) {
        // 포트폴리오 도구와 연동
        let portfolioData = localStorage.getItem('portfolioData');
        if (portfolioData) {
            portfolioData = JSON.parse(portfolioData);
            portfolioData.activities = portfolioData.activities || [];
            portfolioData.activities.push({
                id: activity.id,
                tool: activity.toolName,
                date: activity.timestamp,
                content: activity.description || activity.toolName + ' 활동 완료'
            });
            localStorage.setItem('portfolioData', JSON.stringify(portfolioData));
        }
    }

    // 학생 정보 입력 UI 생성
    createStudentInfoHTML() {
        return `
            <div class="student-info-section glass-effect rounded-2xl p-4 mb-6">
                <h3 class="font-bold text-lg mb-3 flex items-center gap-2">
                    <span class="text-2xl">👤</span>
                    <span>내 정보</span>
                </h3>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <input type="text" id="studentName" placeholder="이름" 
                           value="${this.studentInfo.name || ''}"
                           class="px-3 py-2 rounded-lg border-2 border-purple-200 focus:border-purple-400 outline-none">
                    <input type="text" id="studentSchool" placeholder="학교" 
                           value="${this.studentInfo.school || ''}"
                           class="px-3 py-2 rounded-lg border-2 border-purple-200 focus:border-purple-400 outline-none">
                    <select id="studentGrade" class="px-3 py-2 rounded-lg border-2 border-purple-200 focus:border-purple-400 outline-none">
                        <option value="3" ${this.studentInfo.grade === '3' ? 'selected' : ''}>3학년</option>
                        <option value="4" ${this.studentInfo.grade === '4' ? 'selected' : ''}>4학년</option>
                        <option value="5" ${this.studentInfo.grade === '5' ? 'selected' : ''}>5학년</option>
                        <option value="6" ${this.studentInfo.grade === '6' ? 'selected' : ''}>6학년</option>
                    </select>
                    <input type="text" id="studentClass" placeholder="반" 
                           value="${this.studentInfo.class || ''}"
                           class="px-3 py-2 rounded-lg border-2 border-purple-200 focus:border-purple-400 outline-none">
                    <input type="text" id="studentNumber" placeholder="번호" 
                           value="${this.studentInfo.number || ''}"
                           class="px-3 py-2 rounded-lg border-2 border-purple-200 focus:border-purple-400 outline-none">
                    <button onclick="portfolioManager.saveStudentInfoFromForm()" 
                            class="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition">
                        💾 저장
                    </button>
                </div>
            </div>
        `;
    }

    saveStudentInfoFromForm() {
        const info = {
            name: document.getElementById('studentName').value,
            school: document.getElementById('studentSchool').value,
            grade: document.getElementById('studentGrade').value,
            class: document.getElementById('studentClass').value,
            number: document.getElementById('studentNumber').value
        };
        this.saveStudentInfo(info);
        alert('정보가 저장되었습니다!');
    }

    // 다운로드 버튼 UI 생성
    createDownloadButtonsHTML() {
        return `
            <div class="download-section flex flex-wrap gap-3 justify-center mt-6 no-print">
                <button onclick="portfolioManager.downloadAsImage()" 
                        class="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition flex items-center gap-2">
                    <span>📷</span>
                    <span>이미지로 저장</span>
                </button>
                <button onclick="portfolioManager.downloadAsPDF()" 
                        class="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition flex items-center gap-2">
                    <span>📄</span>
                    <span>PDF로 저장</span>
                </button>
                <button onclick="portfolioManager.saveToPortfolio()" 
                        class="px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition flex items-center gap-2">
                    <span>📚</span>
                    <span>포트폴리오에 추가</span>
                </button>
            </div>
        `;
    }

    // 이미지 다운로드
    async downloadAsImage(elementId = 'mainContent', filename = null) {
        if (!filename) {
            const toolName = document.title.replace(/[^가-힣a-zA-Z0-9]/g, '_');
            const date = new Date().toISOString().split('T')[0];
            filename = `${this.studentInfo.name || '학생'}_${toolName}_${date}.png`;
        }

        try {
            // html2canvas 로드 확인
            if (typeof html2canvas === 'undefined') {
                await this.loadScript('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js');
            }

            const element = document.getElementById(elementId);
            if (!element) {
                alert('저장할 콘텐츠를 찾을 수 없습니다.');
                return;
            }

            // 학생 정보 워터마크 추가
            const watermark = this.addWatermark(element);

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            // 워터마크 제거
            if (watermark) watermark.remove();

            // 다운로드
            const link = document.createElement('a');
            link.download = filename;
            link.href = canvas.toDataURL();
            link.click();

            // 활동 기록
            this.addActivity({
                toolName: document.title,
                type: 'download',
                format: 'image',
                filename: filename
            });

            alert('이미지가 저장되었습니다! 📸');
        } catch (error) {
            console.error('이미지 저장 실패:', error);
            alert('이미지 저장에 실패했습니다. 다시 시도해주세요.');
        }
    }

    // PDF 다운로드
    async downloadAsPDF(elementId = 'mainContent', filename = null) {
        if (!filename) {
            const toolName = document.title.replace(/[^가-힣a-zA-Z0-9]/g, '_');
            const date = new Date().toISOString().split('T')[0];
            filename = `${this.studentInfo.name || '학생'}_${toolName}_${date}.pdf`;
        }

        try {
            // jsPDF 로드 확인
            if (typeof window.jspdf === 'undefined') {
                await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
            }
            if (typeof html2canvas === 'undefined') {
                await this.loadScript('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js');
            }

            const element = document.getElementById(elementId);
            if (!element) {
                alert('저장할 콘텐츠를 찾을 수 없습니다.');
                return;
            }

            // 학생 정보 헤더 추가
            const header = this.addPDFHeader(element);

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false
            });

            // 헤더 제거
            if (header) header.remove();

            const imgData = canvas.toDataURL('image/png');
            const pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
            
            const imgWidth = 210; // A4 width in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            // 여러 페이지 처리
            let heightLeft = imgHeight;
            let position = 0;
            
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= 297; // A4 height
            
            while (heightLeft > 0) {
                position -= 297;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= 297;
            }

            pdf.save(filename);

            // 활동 기록
            this.addActivity({
                toolName: document.title,
                type: 'download',
                format: 'pdf',
                filename: filename
            });

            alert('PDF가 저장되었습니다! 📄');
        } catch (error) {
            console.error('PDF 저장 실패:', error);
            alert('PDF 저장에 실패했습니다. 다시 시도해주세요.');
        }
    }

    // 포트폴리오에 저장
    saveToPortfolio() {
        const toolName = document.title;
        const content = this.captureCurrentContent();
        
        const activity = this.addActivity({
            toolName: toolName,
            type: 'portfolio',
            content: content,
            description: `${toolName} 활동을 완료했습니다.`
        });

        alert(`포트폴리오에 추가되었습니다! 📚\n\n"마음 브릿지 포트폴리오"에서 확인할 수 있어요.`);
        return activity;
    }

    // 현재 콘텐츠 캡처
    captureCurrentContent() {
        // 각 도구별로 중요한 데이터를 수집
        const content = {
            timestamp: new Date().toISOString(),
            url: window.location.href,
            title: document.title
        };

        // 입력 필드 값들 수집
        const inputs = document.querySelectorAll('input[type="text"], textarea, select');
        content.formData = {};
        inputs.forEach(input => {
            if (input.id && input.value) {
                content.formData[input.id] = input.value;
            }
        });

        return content;
    }

    // 워터마크 추가
    addWatermark(element) {
        const watermark = document.createElement('div');
        watermark.className = 'watermark-info';
        watermark.style.cssText = `
            position: absolute;
            bottom: 10px;
            right: 10px;
            background: rgba(255, 255, 255, 0.9);
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 10px;
            color: #666;
            z-index: 1000;
        `;
        watermark.innerHTML = `
            ${this.studentInfo.name || '학생'} | 
            ${this.studentInfo.school || '학교'} | 
            ${new Date().toLocaleDateString('ko-KR')}
        `;
        element.appendChild(watermark);
        return watermark;
    }

    // PDF 헤더 추가
    addPDFHeader(element) {
        const header = document.createElement('div');
        header.className = 'pdf-header';
        header.style.cssText = `
            padding: 20px;
            background: #f3f4f6;
            margin-bottom: 20px;
            border-radius: 10px;
        `;
        header.innerHTML = `
            <h2 style="margin: 0 0 10px 0; color: #333;">🌈 마음으로 잇는 우리 가족 프로젝트</h2>
            <div style="color: #666; font-size: 14px;">
                <strong>학생:</strong> ${this.studentInfo.name || '미입력'} | 
                <strong>학교:</strong> ${this.studentInfo.school || '미입력'} 
                ${this.studentInfo.grade}학년 ${this.studentInfo.class}반 ${this.studentInfo.number}번<br>
                <strong>날짜:</strong> ${new Date().toLocaleDateString('ko-KR')} | 
                <strong>활동:</strong> ${document.title}
            </div>
        `;
        element.insertBefore(header, element.firstChild);
        return header;
    }

    // 스크립트 동적 로드
    loadScript(src) {
        return new Promise((resolve, reject) => {
            // 이미 로드되었는지 확인
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // 데이터 내보내기 (교사용)
    exportAllData() {
        const exportData = {
            studentInfo: this.studentInfo,
            activities: this.activityLog,
            exportDate: new Date().toISOString()
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.studentInfo.name || '학생'}_활동기록_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }
}

// 전역 인스턴스 생성
const portfolioManager = new StudentPortfolioManager();

// 페이지 로드 시 자동 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePortfolioManager);
} else {
    initializePortfolioManager();
}

function initializePortfolioManager() {
    // 학생 정보 섹션 자동 삽입
    const targetElement = document.querySelector('.container');
    if (targetElement && !document.getElementById('studentInfoSection')) {
        const infoSection = document.createElement('div');
        infoSection.id = 'studentInfoSection';
        infoSection.innerHTML = portfolioManager.createStudentInfoHTML();
        targetElement.insertBefore(infoSection, targetElement.firstChild.nextSibling);
    }

    // 다운로드 버튼 자동 삽입
    const contentElement = document.querySelector('#mainContent, .main-content, .portfolio-card, .tool-content');
    if (contentElement && !document.getElementById('downloadSection')) {
        const downloadSection = document.createElement('div');
        downloadSection.id = 'downloadSection';
        downloadSection.innerHTML = portfolioManager.createDownloadButtonsHTML();
        contentElement.appendChild(downloadSection);
    }
}

// 각 도구에서 사용할 수 있는 헬퍼 함수들
window.portfolioUtils = {
    // 간단한 활동 저장
    saveActivity: function(activityName, data) {
        return portfolioManager.addActivity({
            toolName: activityName,
            type: 'activity',
            data: data
        });
    },

    // 학생 정보 가져오기
    getStudentInfo: function() {
        return portfolioManager.studentInfo;
    },

    // 이미지로 빠른 저장
    quickSaveAsImage: function() {
        portfolioManager.downloadAsImage();
    },

    // PDF로 빠른 저장
    quickSaveAsPDF: function() {
        portfolioManager.downloadAsPDF();
    }
};