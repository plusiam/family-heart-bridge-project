// 📝 감정 날씨 일기 데이터 관리 모듈
// 데이터 백업, 복원, 초기화, 내보내기 기능

class DiaryDataManager {
    constructor() {
        this.storageKey = 'emotionDiaryEntries';
        this.backupKey = 'emotionDiaryBackup';
    }

    // 현재 데이터 가져오기
    getData() {
        return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    }

    // 데이터 저장
    saveData(data) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    // 백업 생성
    createBackup() {
        const data = this.getData();
        const backup = {
            timestamp: new Date().toISOString(),
            data: data,
            count: data.length
        };
        
        // 최근 5개 백업만 유지
        let backups = JSON.parse(localStorage.getItem(this.backupKey) || '[]');
        backups.unshift(backup);
        backups = backups.slice(0, 5);
        
        localStorage.setItem(this.backupKey, JSON.stringify(backups));
        return backup;
    }

    // 백업 목록 가져오기
    getBackups() {
        return JSON.parse(localStorage.getItem(this.backupKey) || '[]');
    }

    // 백업에서 복원
    restoreFromBackup(backupIndex) {
        const backups = this.getBackups();
        if (backups[backupIndex]) {
            this.saveData(backups[backupIndex].data);
            return true;
        }
        return false;
    }

    // 데이터 초기화
    clearData(createBackup = true) {
        if (createBackup) {
            this.createBackup();
        }
        localStorage.removeItem(this.storageKey);
        return true;
    }

    // JSON 파일로 내보내기
    exportToJSON() {
        const data = this.getData();
        const studentInfo = portfolioManager?.getStudentInfo() || {};
        
        const exportData = {
            type: 'emotion-diary',
            exportDate: new Date().toISOString(),
            student: studentInfo,
            diaryCount: data.length,
            entries: data,
            statistics: this.generateStatistics(data)
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], 
            { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `감정일기_${studentInfo.name || '학생'}_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    // CSV로 내보내기 (엑셀용)
    exportToCSV() {
        const data = this.getData();
        const studentInfo = portfolioManager?.getStudentInfo() || {};
        
        // CSV 헤더
        let csv = '날짜,제목,감정온도,아침날씨,점심날씨,저녁날씨,밤날씨,감정스티커,감사1,감사2,감사3,내용\n';
        
        // 데이터 행
        data.forEach(entry => {
            const row = [
                entry.date,
                `"${entry.title.replace(/"/g, '""')}"`,
                entry.mood,
                entry.morningWeather || '',
                entry.noonWeather || '',
                entry.eveningWeather || '',
                entry.nightWeather || '',
                entry.stickers.join(' '),
                entry.gratitude[0] || '',
                entry.gratitude[1] || '',
                entry.gratitude[2] || '',
                `"${entry.content.replace(/"/g, '""').replace(/\n/g, ' ')}"`
            ].join(',');
            csv += row + '\n';
        });
        
        // BOM 추가 (한글 엑셀 호환)
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `감정일기_${studentInfo.name || '학생'}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    // 보고서 생성
    generateReport() {
        const data = this.getData();
        const studentInfo = portfolioManager?.getStudentInfo() || {};
        const stats = this.generateStatistics(data);
        
        const report = `
===========================================
        감정 날씨 일기 보고서
===========================================

학생 정보
-----------
이름: ${studentInfo.name || '미입력'}
학교: ${studentInfo.school || '미입력'} 
학년/반: ${studentInfo.grade || '?'}학년 ${studentInfo.class || '?'}반 ${studentInfo.number || '?'}번
생성일: ${new Date().toLocaleDateString('ko-KR')}

일기 통계
-----------
전체 일기 수: ${stats.totalEntries}개
작성 기간: ${stats.dateRange}
평균 감정 온도: ${stats.averageMood}°
가장 행복한 날: ${stats.happiestDay}
가장 많이 사용한 감정: ${stats.topEmotion}

월별 분석
-----------
${stats.monthlyAnalysis}

감정 분포
-----------
😄 매우 행복: ${stats.veryHappy}일
😊 행복: ${stats.happy}일
😐 보통: ${stats.neutral}일
😟 슬픔: ${stats.sad}일
😢 매우 슬픔: ${stats.verySad}일

특별한 기록
-----------
${stats.specialNotes}

===========================================
        `;
        
        return report;
    }

    // 통계 생성
    generateStatistics(data) {
        if (data.length === 0) {
            return {
                totalEntries: 0,
                dateRange: '없음',
                averageMood: 0,
                happiestDay: '없음',
                topEmotion: '없음',
                monthlyAnalysis: '데이터 없음',
                veryHappy: 0,
                happy: 0,
                neutral: 0,
                sad: 0,
                verySad: 0,
                specialNotes: '없음'
            };
        }

        const moods = data.map(e => parseInt(e.mood));
        const avgMood = Math.round(moods.reduce((a, b) => a + b, 0) / moods.length);
        
        const sortedByMood = [...data].sort((a, b) => parseInt(b.mood) - parseInt(a.mood));
        const happiestEntry = sortedByMood[0];
        
        // 감정 스티커 통계
        const stickerCount = {};
        data.forEach(entry => {
            entry.stickers.forEach(sticker => {
                stickerCount[sticker] = (stickerCount[sticker] || 0) + 1;
            });
        });
        const topSticker = Object.entries(stickerCount)
            .sort((a, b) => b[1] - a[1])[0];
        
        // 월별 분석
        const monthlyData = {};
        data.forEach(entry => {
            const month = entry.date.substring(0, 7);
            if (!monthlyData[month]) {
                monthlyData[month] = [];
            }
            monthlyData[month].push(parseInt(entry.mood));
        });
        
        const monthlyAnalysis = Object.entries(monthlyData)
            .map(([month, moods]) => {
                const avg = Math.round(moods.reduce((a, b) => a + b, 0) / moods.length);
                return `${month}: 평균 ${avg}° (${moods.length}개 일기)`;
            }).join('\n');
        
        // 감정 분포
        const distribution = {
            veryHappy: data.filter(e => parseInt(e.mood) >= 80).length,
            happy: data.filter(e => parseInt(e.mood) >= 60 && parseInt(e.mood) < 80).length,
            neutral: data.filter(e => parseInt(e.mood) >= 40 && parseInt(e.mood) < 60).length,
            sad: data.filter(e => parseInt(e.mood) >= 20 && parseInt(e.mood) < 40).length,
            verySad: data.filter(e => parseInt(e.mood) < 20).length
        };
        
        // 날짜 범위
        const dates = data.map(e => new Date(e.date)).sort((a, b) => a - b);
        const dateRange = `${dates[0].toLocaleDateString('ko-KR')} ~ ${dates[dates.length - 1].toLocaleDateString('ko-KR')}`;
        
        return {
            totalEntries: data.length,
            dateRange: dateRange,
            averageMood: avgMood,
            happiestDay: `${happiestEntry.date} (${happiestEntry.title})`,
            topEmotion: topSticker ? `${topSticker[0]} (${topSticker[1]}회)` : '없음',
            monthlyAnalysis: monthlyAnalysis,
            ...distribution,
            specialNotes: this.findSpecialNotes(data)
        };
    }

    // 특별한 기록 찾기
    findSpecialNotes(data) {
        const notes = [];
        
        // 가장 긴 일기
        const longestEntry = [...data].sort((a, b) => b.content.length - a.content.length)[0];
        if (longestEntry) {
            notes.push(`가장 긴 일기: ${longestEntry.date} (${longestEntry.content.length}자)`);
        }
        
        // 감사가 가장 많은 날
        const gratitudeEntries = data.filter(e => e.gratitude && e.gratitude.length === 3);
        if (gratitudeEntries.length > 0) {
            notes.push(`감사 일기 작성: ${gratitudeEntries.length}일`);
        }
        
        // 무지개 날
        const rainbowDays = data.filter(e => 
            [e.morningWeather, e.noonWeather, e.eveningWeather, e.nightWeather]
                .includes('rainbow')
        );
        if (rainbowDays.length > 0) {
            notes.push(`무지개 날: ${rainbowDays.length}일`);
        }
        
        return notes.join('\n') || '없음';
    }

    // 데이터 가져오기 (JSON 파일)
    importFromJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const importData = JSON.parse(e.target.result);
                    
                    if (importData.type !== 'emotion-diary') {
                        throw new Error('올바른 감정 일기 파일이 아닙니다.');
                    }
                    
                    // 백업 생성
                    this.createBackup();
                    
                    // 데이터 병합 또는 교체
                    const currentData = this.getData();
                    const mergedData = this.mergeData(currentData, importData.entries);
                    
                    this.saveData(mergedData);
                    resolve(mergedData);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    // 데이터 병합 (중복 제거)
    mergeData(current, imported) {
        const merged = [...current];
        
        imported.forEach(entry => {
            const exists = merged.find(e => e.date === entry.date);
            if (!exists) {
                merged.push(entry);
            }
        });
        
        return merged.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
}

// 전역 인스턴스 생성
const diaryDataManager = new DiaryDataManager();

// 관리 UI 생성 함수
function createDataManagementUI() {
    return `
        <div class="glass-effect rounded-3xl p-6 mb-6">
            <h3 class="font-bold text-lg mb-4 flex items-center gap-2">
                <span class="text-2xl">⚙️</span>
                <span>데이터 관리</span>
            </h3>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <!-- 백업 생성 -->
                <button onclick="createDiaryBackup()" 
                        class="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition flex items-center justify-center gap-2">
                    <span>💾</span>
                    <span>백업</span>
                </button>
                
                <!-- 복원 -->
                <button onclick="showRestoreOptions()" 
                        class="px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition flex items-center justify-center gap-2">
                    <span>♻️</span>
                    <span>복원</span>
                </button>
                
                <!-- 내보내기 -->
                <div class="relative">
                    <button onclick="toggleExportMenu()" 
                            class="w-full px-4 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition flex items-center justify-center gap-2">
                        <span>📤</span>
                        <span>내보내기</span>
                    </button>
                    <div id="exportMenu" class="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-lg p-2 hidden z-10">
                        <button onclick="exportDiaryJSON()" class="w-full text-left px-3 py-2 hover:bg-gray-100 rounded">📄 JSON</button>
                        <button onclick="exportDiaryCSV()" class="w-full text-left px-3 py-2 hover:bg-gray-100 rounded">📊 CSV (엑셀)</button>
                        <button onclick="exportDiaryReport()" class="w-full text-left px-3 py-2 hover:bg-gray-100 rounded">📝 보고서</button>
                    </div>
                </div>
                
                <!-- 초기화 -->
                <button onclick="confirmClearData()" 
                        class="px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition flex items-center justify-center gap-2">
                    <span>🗑️</span>
                    <span>초기화</span>
                </button>
            </div>
            
            <!-- 백업 목록 -->
            <div id="backupList" class="mt-4 hidden">
                <h4 class="font-bold mb-2">백업 목록:</h4>
                <div id="backupItems" class="space-y-2"></div>
            </div>
        </div>
    `;
}

// 백업 생성
function createDiaryBackup() {
    const backup = diaryDataManager.createBackup();
    alert(`백업이 생성되었습니다!\n일기 수: ${backup.count}개\n시간: ${new Date(backup.timestamp).toLocaleString('ko-KR')}`);
}

// 복원 옵션 표시
function showRestoreOptions() {
    const backups = diaryDataManager.getBackups();
    
    if (backups.length === 0) {
        alert('복원할 백업이 없습니다.');
        return;
    }
    
    const backupList = document.getElementById('backupList');
    const backupItems = document.getElementById('backupItems');
    
    backupItems.innerHTML = backups.map((backup, index) => `
        <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <div>
                <p class="font-bold">${new Date(backup.timestamp).toLocaleDateString('ko-KR')}</p>
                <p class="text-sm text-gray-600">${backup.count}개 일기</p>
            </div>
            <button onclick="restoreDiaryBackup(${index})" 
                    class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
                복원
            </button>
        </div>
    `).join('');
    
    backupList.classList.toggle('hidden');
}

// 백업 복원
function restoreDiaryBackup(index) {
    if (confirm('현재 데이터를 백업 데이터로 교체하시겠습니까?')) {
        if (diaryDataManager.restoreFromBackup(index)) {
            alert('백업이 복원되었습니다.');
            location.reload();
        }
    }
}

// 내보내기 메뉴 토글
function toggleExportMenu() {
    document.getElementById('exportMenu').classList.toggle('hidden');
}

// JSON 내보내기
function exportDiaryJSON() {
    diaryDataManager.exportToJSON();
    alert('JSON 파일이 다운로드되었습니다.');
}

// CSV 내보내기
function exportDiaryCSV() {
    diaryDataManager.exportToCSV();
    alert('CSV 파일이 다운로드되었습니다. 엑셀에서 열 수 있습니다.');
}

// 보고서 내보내기
function exportDiaryReport() {
    const report = diaryDataManager.generateReport();
    
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `감정일기_보고서_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    
    URL.revokeObjectURL(url);
    alert('보고서가 다운로드되었습니다.');
}

// 데이터 초기화 확인
function confirmClearData() {
    if (confirm('정말로 모든 일기를 삭제하시겠습니까?\n(백업이 자동으로 생성됩니다)')) {
        if (confirm('한 번 더 확인합니다. 정말 삭제하시겠습니까?')) {
            diaryDataManager.clearData(true);
            alert('모든 일기가 삭제되었습니다.\n백업에서 복원할 수 있습니다.');
            location.reload();
        }
    }
}

// 페이지 로드 시 관리 UI 추가
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDiaryManager);
} else {
    initializeDiaryManager();
}

function initializeDiaryManager() {
    // 관리 UI를 적절한 위치에 삽입
    const container = document.querySelector('.container');
    if (container) {
        const managementUI = document.createElement('div');
        managementUI.id = 'dataManagement';
        managementUI.innerHTML = createDataManagementUI();
        
        // 탭 네비게이션 다음에 삽입
        const tabNav = container.querySelector('.flex.justify-center.mb-8');
        if (tabNav) {
            tabNav.parentNode.insertBefore(managementUI, tabNav.nextSibling);
        }
    }
}