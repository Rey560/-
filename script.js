// === 程式初始化 (已升級：加入圖片上傳功能與驗證) ===
document.addEventListener('DOMContentLoaded', () => {
    // --- 頁籤切換功能 (無變動) ---
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            button.classList.add('active');
            document.getElementById(button.dataset.tab).classList.add('active');
        });
    });

    // --- 全面自動儲存與讀取功能 (文字部分) ---
    const allInputs = document.querySelectorAll('input[type="text"], textarea');
    allInputs.forEach(input => {
        const savedValue = localStorage.getItem(input.id);
        if (savedValue) {
            input.value = savedValue;
        }
        input.addEventListener('input', () => {
            localStorage.setItem(input.id, input.value);
        });
    });
    
    // --- 圖片上傳與自動儲存/讀取功能 (已升級) ---
    const sketchUploader = document.getElementById('stall-sketch-upload');
    const previewImage = document.getElementById('sketch-preview-image');
    const placeholder = document.getElementById('sketch-placeholder');
    const imageStorageKey = 'savedSketchImage';

    // 1. 頁面載入時，嘗試讀取已儲存的圖片
    const savedImage = localStorage.getItem(imageStorageKey);
    if (savedImage) {
        previewImage.src = savedImage;
        previewImage.classList.add('has-image');
        placeholder.style.display = 'none';
    }

    // 2. 監聽檔案上傳事件
    sketchUploader.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return; // 如果使用者取消選擇，就直接結束

        // ★ 修改點：在處理檔案前，先進行檔案大小的預先檢查 ★
        const MAX_SIZE_MB = 3;
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            alert(`【上傳失敗】\n\n圖片檔案大小請勿超過 ${MAX_SIZE_MB}MB！\n\n請先壓縮圖片或選擇其他較小的照片。`);
            sketchUploader.value = ""; // 清空選擇，讓使用者可以重新選擇同一檔案
            return; // 中斷後續程序
        }
        
        // 檢查檔案類型
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageData = e.target.result;
                previewImage.src = imageData;
                previewImage.classList.add('has-image');
                placeholder.style.display = 'none';
                try {
                    localStorage.setItem(imageStorageKey, imageData);
                } catch (error) {
                    alert("錯誤：圖片檔案可能太大，無法自動儲存。建議選擇較小的圖片。");
                    console.error("localStorage saving error:", error);
                }
            };
            reader.readAsDataURL(file);
        } else {
            alert("請選擇有效的圖片檔案 (例如 JPG, PNG)。");
            sketchUploader.value = "";
        }
    });

    // --- 為需要驗證的欄位加上即時監聽 (無變動) ---
    const studentNameInput = document.getElementById('student-name');
    const groupMembersInput = document.getElementById('group-members');
    studentNameInput.addEventListener('input', () => validateField(studentNameInput));
    groupMembersInput.addEventListener('input', () => validateField(groupMembersInput));
});

// === 資料驗證核心功能 (無變動) ===
function validateField(inputElement) {
    let isValid = true;
    const id = inputElement.id;
    const value = inputElement.value.trim();
    if (id === 'student-name') {
        if (!/^[\u4e00-\u9fa5]{2,5}$/.test(value)) isValid = false;
    } else if (id === 'group-members') {
        const normalizedValue = value.replace(/，/g, ',');
        const members = normalizedValue.split(',').map(s => s.trim()).filter(s => s);
        if (members.length < 3 || members.length > 5) {
            isValid = false;
        } else {
            isValid = members.every(member => /^\d{5}$/.test(member));
        }
    }
    if (isValid) inputElement.classList.remove('is-invalid');
    else inputElement.classList.add('is-invalid');
    return isValid;
}

function validateForm() {
    const studentNameInput = document.getElementById('student-name');
    const groupMembersInput = document.getElementById('group-members');
    const isNameValid = validateField(studentNameInput);
    const isMembersValid = validateField(groupMembersInput);
    if (isNameValid && isMembersValid) return true;

    let errorMessages = '【資料錯誤】\n\n';
    if (!isNameValid) errorMessages += '🔴 姓名：請輸入 2 到 5 個「中文字」。\n';
    if (!isMembersValid) errorMessages += '🔴 小組成員：請輸入 3 到 5 位組員的「5位數」學號，並用「逗號」隔開。\n';
    errorMessages += '\n請回到「① 護照首頁」修正後再試一次。';
    alert(errorMessages);
    document.querySelector('.tab-button[data-tab="tab1"]').click();
    if (!isNameValid) studentNameInput.focus();
    else if (!isMembersValid) groupMembersInput.focus();
    return false;
}

// === 分頁儲存與列印功能 (圖片處理部分無變動) ===
function saveAndPrint(tabIdToPrint, pageName) {
    if (!validateForm()) return;

    const studentName = document.getElementById('student-name').value;
    const suggestedFilename = `${pageName}_${studentName}.pdf`;
    
    // 處理所有文字輸入框
    const inputs = document.querySelectorAll('input[type="text"], textarea');
    inputs.forEach(input => {
        const printTarget = document.querySelector(`.print-only[data-for="${input.id}"]`);
        if (printTarget) {
            printTarget.textContent = input.value || ' ';
        }
    });

    // 處理上傳的圖片，準備列印
    const previewImage = document.getElementById('sketch-preview-image');
    const printImageContainer = document.querySelector('.print-only[data-for="stall-sketch-upload"]');
    printImageContainer.innerHTML = ''; 
    if (previewImage && previewImage.classList.contains('has-image')) {
        const imgForPrint = document.createElement('img');
        imgForPrint.src = previewImage.src;
        imgForPrint.style.maxWidth = '100%';
        imgForPrint.style.maxHeight = '400px';
        imgForPrint.style.marginTop = '10px';
        printImageContainer.appendChild(imgForPrint);
    }
    
    const printNavItems = document.querySelectorAll('.print-nav-item');
    printNavItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.printTab === tabIdToPrint) {
            item.classList.add('active');
        }
    });

    const tabPaneToPrint = document.getElementById(tabIdToPrint);
    tabPaneToPrint.classList.add('is-printing');
    
    alert(`準備產生學習單PDF！\n\n在接下來的視窗中，請選擇「另存為 PDF」，\n並建議將檔案命名為：\n\n${suggestedFilename}`);

    window.print();

    tabPaneToPrint.classList.remove('is-printing');
}