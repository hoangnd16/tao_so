import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Printer, Copy, FileText, Save, FolderOpen, X, ArrowDown, Settings, FileDigit, Ruler, Plus, Trash2, User, Calendar as CalendarIcon, ChevronUp, ChevronDown, Edit3, Check, AlertCircle, CheckSquare, Square, Play, RotateCcw, Coffee, PanelTopClose, PanelTopOpen } from 'lucide-react';

// --- CẤU HÌNH KHỔ GIẤY ---
const PAPER_SIZES = {
    a3: { name: 'A3 (420x297mm)', width: '420', height: '297', css: 'A3 landscape' },
    a4: { name: 'A4 (297x210mm)', width: '297', height: '210', css: 'A4 landscape' },
    a5: { name: 'A5 (210x148mm)', width: '210', height: '148', css: 'A5 landscape' },
    b3: { name: 'B3 (500x353mm)', width: '500', height: '353', css: 'B3 landscape' },
    b4: { name: 'B4 (353x250mm)', width: '353', height: '250', css: 'B4 landscape' },
    b5: { name: 'B5 (250x176mm)', width: '250', height: '176', css: 'B5 landscape' },
    custom: { name: 'Tự nhập kích thước...', width: 'custom', height: 'custom', css: 'custom' }
};

// --- DỮ LIỆU DANH XƯNG ---
const TITLES = [
    "Tín chủ", "Thân thê", "Phu quân", "Nam tử", "Nữ tử",
    "Hôn tử", "Tế tử", "Nội tôn", "Ngoại tôn", "Dưỡng tử"
];

// --- BỘ TÍNH TOÁN ÂM LỊCH ---
const LUNAR_UTILS = {
    CAN: ["Canh", "Tân", "Nhâm", "Quý", "Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ"],
    CHI: ["Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi"],

    getCanChi: (year) => {
        if (!year) return "...";
        const can = LUNAR_UTILS.CAN[year % 10];
        const chi = LUNAR_UTILS.CHI[year % 12];
        return `${can} ${chi}`;
    },
    getSao: (age, gender) => {
        if (!age || age < 1) return "...";
        const SAO_NAM = ["La Hầu", "Thổ Tú", "Thủy Diệu", "Thái Bạch", "Thái Dương", "Vân Hớn", "Kế Đô", "Thái Âm", "Mộc Đức"];
        const SAO_NU = ["Kế Đô", "Vân Hớn", "Mộc Đức", "Thái Âm", "Thổ Tú", "La Hầu", "Thái Dương", "Thái Bạch", "Thủy Diệu"];
        const index = (age - 1) % 9;
        return gender === 'male' ? SAO_NAM[index] : SAO_NU[index];
    },
    getHan: (age, gender) => {
        if (!age || age < 1) return "...";
        const HAN_NAM = ["Huỳnh Tuyền", "Tam Kheo", "Ngũ Hộ", "Thiên Tinh", "Toán Tận", "Thiên La", "Địa Võng", "Diêm Vương"];
        const HAN_NU = ["Toán Tận", "Thiên Tinh", "Ngũ Hộ", "Tam Kheo", "Huỳnh Tuyền", "Diêm Vương", "Địa Võng", "Thiên La"];
        const index = (age - 1) % 8;
        return gender === 'male' ? HAN_NAM[index] : HAN_NU[index];
    },
    getTuVi: (age) => {
        if (!age || age < 1) return { so: "...", sao: "..." };
        const TU_VI_DATA = [
            { so: "Sở Bị", sao: "Bệnh Phù" }, { so: "Sở Được", sao: "Thái Tuế" }, { so: "Sở Được", sao: "Thái Dương" },
            { so: "Sở Bị", sao: "Tang Môn" }, { so: "Sở Được", sao: "Thái Âm" }, { so: "Sở Bị", sao: "Quan Phù" },
            { so: "Sở Bị", sao: "Tử Phù" }, { so: "Sở Bị", sao: "Tế Phù" }, { so: "Sở Được", sao: "Long Đức" },
            { so: "Sở Bị", sao: "Bạch Hổ" }, { so: "Sở Được", sao: "Phúc Đức" }, { so: "Sở Bị", sao: "Điếu Khách" }
        ];
        const index = age % 12;
        return TU_VI_DATA[index];
    },
    convertSolarToLunar: (dateString) => {
        if (!dateString) return { d: 1, m: 1, y: new Date().getFullYear() };
        const date = new Date(dateString);
        try {
            const formatter = new Intl.DateTimeFormat('vi-VN-u-ca-chinese', {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric'
            });
            const parts = formatter.formatToParts(date);
            const d = parseInt(parts.find(p => p.type === 'day').value);
            const m = parseInt(parts.find(p => p.type === 'month').value);
            const yPart = parts.find(p => p.type === 'relatedYear' || p.type === 'year');
            const y = parseInt(yPart.value.replace(/\D/g, ''));
            return { d, m, y };
        } catch (e) {
            return { d: date.getDate(), m: date.getMonth() + 1, y: date.getFullYear() };
        }
    }
};

// --- HÀM HELPERS ---
const formatVerticalText = (text) => {
    if (!text) return '';
    if (text.includes('\n')) return text;
    let formatted = text.replace(/([,.;])\s*/g, "$1\n");
    formatted = formatted.split('\n').map(line => {
        const words = line.trim().split(/\s+/);
        if (words.length <= 5) return line;
        let chunks = [];
        let currentChunk = [];
        for (let word of words) {
            currentChunk.push(word);
            if (currentChunk.length >= 4 || (word.length > 6 && currentChunk.length >= 2)) {
                chunks.push(currentChunk.join(" "));
                currentChunk = [];
            }
        }
        if (currentChunk.length > 0) chunks.push(currentChunk.join(" "));
        return chunks.join("\n");
    }).join("\n");
    return formatted;
};

// Helper to capitalize first letter of each word
const toTitleCase = (str) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// Helper to mark text for bolding
const markBold = (text) => text ? text.toString().trim().split(/\s+/).map(w => '^' + w).join(' ') : '';

const generateMembersText = (members) => {
    if (!members || members.length === 0) return "....................";
    return members.map(m => {
        const danhXung = m.title || "Tín chủ";
        return `${danhXung} ${m.name.toUpperCase()} ${m.age} Tuổi * `;
    }).join(' ');
};

// --- DỮ LIỆU MẪU SỚ ---
const TEMPLATES = {
    cau_an: {
        id: 'cau_an',
        name: '1. Sớ Phúc Lộc Thọ (Cầu An)',
        title: 'PHÚC LỘC THỌ SỚ',
        content: (data) => {
            // Helper to join array into newline-separated string (column)
            const col = (arr) => arr.join(' ');

            const address = toTitleCase(data.address);
            const prayer = toTitleCase(data.userPrayer);

            // Columns from Right to Left based on the image
            const c0 = "\t\t\t\t\t\t\t\t\tPhục Dĩ"
            const c1 = "Phúc Thọ Khang Ninh Nãi Nhân Tâm Chi Cờ Nguyện Tai Ương Hạn Ách Bằng";
            const c2 = "Thánh Lực Dĩ Giải Trừ Nhất Niệm Chí Thành Thập Phương Cảm Cách \t\t\t Viên Hữu";
            const c3 = markBold(`Việt Nam Quốc ${address}`);
            const c4 = `${data.templeName || 'Mõ Hạc Linh Từ'} Thượng Phụng \t\t\t\t Phật Thánh Hiến Cúng Lệnh Tiết \nTiến Lễ Cầu An Giải Hạn Tổng Ách Trừ Tai Tại Cờ Gia Nội Bình An Nhân Khang Vật Thịnh Duyên Sinh Trường Thọ Kim Thần`;
            const c5 = markBold(`${generateMembersText(data.members)} Đồng Gia Quyền Đẳng ${prayer.replace(/([,.;])*/g, "") || ''}`);
            const c7 = "Ngọc Bệ Hạ Dáng Phàm Tâm Ngôn Niệm Thần Đẳng Sinh Cư Dương Thế Số Hệ \tThiên Cung Hạ Càn Khôn Phủ Tài Chi An Vận Cản";
            const c8 = "Phật Thánh Khuông Phù Chi Đức Tư Phùng Lệnh Tiết \tTiến Lễ Cờ An Giải Nhất Thiết Tai Ương Cờ Vạn Ban Chi Cát Khánh Do Thị Kim Nguyệt \tNhật";
            const c9 = "Tu Thiết Kim Ngân Hương Hoa Lễ Vật Tịnh Cúng Phu Trần Cụ Hữu Sớ Văn Kiền Thân \t\t\t Thượng Tấu\t\t\t\t Cung";
            const c10 = "Nam Mô Thập Phương Thường Trụ Tam Bảo Tác Chư Đại Bồ Tát \t\t\t\t\t\t Kim Liên Tọa Hạ";
            const c11 = "Tam Giới Thiên Chúa Tứ Phủ Vạn Linh Cộng Đồng Đại Đế \t\t\t\t\t\t\t Ngọc Bệ Hạ";
            const c12 = "Tam Tòa Vương Mẫu Ngũ Vị Hoàng Thái Tử Vương Quan Khâm Sai Công Chúa \t\t\t\t Cung Quyết Hạ";
            const c13 = "Bản Điện Phụng Tự Nhất Thiết Uy Linh \t\t\t\t\t\t Vị Tiền Cúng Vọng";
            const c14 = "Hồng Từ \t\t\t\t Động Thùy\t\t\t\t Chiếu Giám\t\t\t\t Phục Nguyện";
            const c15 = "Đức Đại Khuông Phù Ân Hoằng Tế Độ Giáng Phúc Lưu An Trừ Tai Xá Quá Tỉ Thần Đẳng Gia Môn Thanh Thái Bản Mệnh Bình An Tam Tai Bát Nạn Sử";
            const c16 = "Vô Sâm Phạm Chi Ngu Bách Phú Thiên Tường Thường Hưởng Thọ Khang Chi Khánh Nhất Triết Sở Cầu Vạn Ban Như Ý Đãn Thần Hạ Tinh Vô Nhận";
            const c17 = "Kích Thiết Bình Dinh Chi Chí Cẩn Sớ";
            const firstMember = data.members[0] || {};
            const c18 = `Thiên Vận ${data.year} \t\t\tNiên ${data.month} Nguyệt ${data.day} \t\tNhật \t\t\tPhúc-Lộc-Thọ Cầu Bình An \t\t\t${markBold(firstMember.title.toUpperCase() || '')} ${markBold(firstMember.name.toUpperCase() || '')}`;

            const c8WordCount = c8.trim().split(/\s+/).length;
            const c5Words = c5.trim().split(/\s+/);
            const c5Columns = [];

            if (c5Words.length > c8WordCount) {
                for (let i = 0; i < c5Words.length; i += c8WordCount) {
                    c5Columns.push(c5Words.slice(i, i + c8WordCount).join(' '));
                }
            } else {
                c5Columns.push(c5);
            }

            return [c0, c1, c2, c3, c4, ...c5Columns, c7, c8, c9, c10, c11, c12, c13, c14, c15, c16, c17, c18].join('\n');
        }
    },
    dang_sao: {
        id: 'dang_sao',
        name: '2. Sớ Dâng Sao Giải Hạn',
        title: 'DÂNG SAO GIẢI HẠN SỚ',
        content: (data) => {
            const firstMember = data.members[0] || {};
            const membersText = data.members.map(m => {
                let suffix = "";
                if (m.soTuVi === "Sở Bị") suffix = " Tướng Quan Chiếu Lộc";
                else if (m.soTuVi === "Sở Được") suffix = " Tinh Quân Chiếu Mệnh";
                const line = `${m.title || ""} ${m.name.toUpperCase()} Sinh Ư ${m.canChi} Niên ${m.age} Tuổi \t Chiếu Sao ${m.sao} ${m.soTuVi} ${m.saoTuVi} ${suffix} ${m.han} Tinh Quân Chiếu Hạn`;
                return markBold(line);
            }).join('\n');

            const address = toTitleCase(data.address);

            const c0 = "\t\t\t\t\t\t\t\t\tPhục Dĩ \n Tinh Huy Ngân Hán Hoàng Hoàng Nan Trắc Nan Danh Nhân Sứ Dương Môn Lộc Lộc Hữu Lượng Hữu Đảo Phàm Tâm Bất Cách";
            const c1 = "Từ Nhãn Diêu Quan \t\t\t\t\t Viên Hữu \n Phật Cúng Dường \t\t\t\t\t Thiên Tiến Lễ Hương Tinh Giải Hạn Cầu Gia Nội Bình An Sự Kim Thần";
            const c2 = markBold(`Việt Nam Quốc ${address}`);
            const c3 = membersText;
            const c4 = "Tam Quan Phó Thân Nhất Ý Ngôn Niệm Thần Đẳng Sinh Phùng Đế Vương Tỉnh Đàn Thiên Lương Trấn Tai Tinh Tinh Bất Hoán Dĩ Biến Biến Khủng Ác Diệu Gia Ư";
            const c5 = "Cảnh Cảnh Cục Dương Nguyện Cúng Trần Bái Đảo Ngiu \t\t\tNguyên Đắc Trường Sinh Chi Phúc Kim Tấc Đầu Thành Ngũ Thể Tĩnh Tín Nhất Tâm";
            const c6 = "Cụ Hữu Sớ Văn Thiền Thận \t\t\t\t\tThượng Tấu";
            const c7 = "Trung Thiên Tinh Chủ Bắc Cực Tử Vi Trường Sinh Đại Đế \t\t\t\tNgọc Bệ Hạ";
            const c8 = "Tả Nam Tào Lục Ty Điện Tinh Quân \t\t\t\t\tThánh Tiền";
            const c9 = "Hữu Bắc Đẩu Cửu Hoàng Giải Ách \t\t\t\t\tThánh Tiền";
            const c10 = "Thiên Đình Cửu Cung Bát Quái Cửu Diệu Ngũ Hành Đẩu Số Tinh Quân \t\t\t\tVị Tiền Cúng Vọng";
            const c11 = "Tôn Tinh Đổng Thừa Chiếu Giám Phục Nguyện";
            const c12 = "Tử Vi Chiếu Mệnh Thiên Phủ Phù Cung Bảo Mệnh Vị Thiên Tài Thiên Thọ Thiên Tương Đồng Vũ Khúc Dĩ Phù Trì Sử Thân Cung Hóa Lộc Hóa Quyến Hóa Khoa";
            const c13 = "Đối Văn Sương Nhi Ứng Hộ Tam Tai Tống Khứ Tứ Thời Không Bạch Hổ Chi Đàn La Ngũ Phúc Hoàn Lai Bát Tiết Hỷ Thạch Long Chí Tả Phù";
            const c14 = "Tử Tôn Quan Đới Phụ Phụ Lộc Tồnác Diệu Bổn Đằng Cát Tinh Biền Tập";
            const c15 = "Đán Thần Hải Tình Vô Nhậm Khích Thiết Bình Doanh Chi Chí Cẩn Sớ";
            const c16 = `Thiên Vận ${data.year} \t\tNiên ${data.month} Nguyệt ${data.day} \tNhật \tNhượng Chu Thành Tâm Hòa Nam Thượng Sớ Dâng Sao \t${markBold(firstMember.title.toUpperCase() || '')} ${markBold(firstMember.name.toUpperCase() || '')}`;

            return [c0, c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12, c13, c14, c15, c16].join('\n');
        }
    },
    hinh_nhan: {
        id: 'hinh_nhan',
        name: '3. Sớ Hình Nhân',
        title: 'HÌNH NHÂN SỚ',
        content: (data) => {
            // Template này dành riêng cho từng người, nên data.members sẽ chỉ có 1 người
            const member = data.members[0] || {};
            const address = toTitleCase(data.address);

            // Helper to join array into newline-separated string (column)
            const col = (arr) => arr.join(' ');

            const c0 = "\t\t\t\t\t\t\t\tPhục Dĩ\n Lục Quần Lê Lâm Lâm Tư Biểu Kim Sao Anh Khí Chi Chung Linh Ngưỡng Lại Hồng Ân Chi Dục Tú Dục Cầu Nguyện Thọ Tu Hạ \t\tViên Hữu";
            const c1 = markBold(`Việt Nam Quốc ${address}`);
            const c2 = "Phật Thánh Hiến Cúng Lệnh Tiết Tiến Cống Hình Nhân Thế Đại Giải Hạn Trừ Tai Cầu Bản Mệnh Bình An Tăng Duyên Thọ Sự Kim Thần";
            const c3 = markBold(`${member.name?.toUpperCase() || ''} Sinh Ư ${member.canChi || ''} Niên ${member.age || ''} Tuổi * Chiếu Sao ${member.sao} * Chiếu Hạn ${member.han}`);
            const c4 = "Thánh Thính Phủ Giám Phàm Tâm Ngôn Liệm Thần Đăng Sinh Cư Trung Giới Mệnh Thuộc";
            const c5 = `Thượng Cung Tư Sinh Tu Thủy Tố Bẩm Ư`;
            const c6 = "Càn Khôn Thành Tượng Thành Hình Nguyên Nhân Hồ Tạo Hóa Thiết Lự Kim Niên Khung Tinh Phản Súc Khủng Kỳ Tuế Nguyệt Hạn Ách Đa Sâm Tai Ương Vận Hạn Bất";
            const c7 = "Kỳ Thời Khí Lưu Hành Vô Độ Mỗi Lự Du Trương Tuế Nguyệt Tu Đương Thành Kính Khẩn Cầu Giải Nhất Thiết Chi Tai Ương Cờ Vạn Ban Chi Phúc Khánh Mông";
            const c8 = "Uy Quang Thùy Tính Bảo Hựu Cờ";
            const c9 = "Đức Tuất Cập Khuông Phù Do Thị Kim Nguyệt Cát Nhật Tu Thiết";
            const c10 = "Hương Hoa Kim Ngân Hình Nhân Tiến Cống Chi Nghi Cẩn Cụ Sớ Văn Kiền Thân \t\t\t Thượng Tấu \t\t\t Cung Duy";
            const c11 = "Tam Giới Thiên Chúa Tứ Phủ Vạn Linh Công Đồng Thánh Đế \t\t\t Ngọc Bệ Hạ \t\t\t Phục Nguyện";
            const c12 = "Chi Tôn Chiếu Lăm Phàm Khổn Đại Khai Phát Dục Chi Ân Quang Bố Hiếu Sinh Chi Đức Biển Hung Thành Cát Cải Hoạ Vị Tường Hắc Bạ Tiêu Trừ";
            const c13 = "Chu Phê Tang Toán Ty Thần Đảng Thân Cung Trường Thọ Tứ Thời Vô Hạn Ách Chi Sâm Mệnh Vị Bình An Bát Tiết Hữu Chính Tường Chi Ưng";
            const c14 = "Cầu Chi Như Ý Nguyện Gia Tòng Tâm Đã Thần Hạ Tinh Vô Nhậm Khích Thiết Bình Doanh Chi Chí Cẩn Sớ";
            const c15 = `Thiên Vận ${data.year} \t\t\t\t\t\tNiên ${data.month} Nguyệt ${data.day} \t\tNhật Thần Khấu Thủ Thượng Tấu \t\t\t\t\t ${markBold('Tiến Hình Hình Nhân')}`;

            return [c0, c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12, c13, c14, c15].join('\n');
        }
    },
    gia_tien: {
        id: 'gia_tien',
        name: '4. Sớ Gia Tiên',
        title: 'GIA TIÊN SỚ',
        content: (data) => {
            const address = toTitleCase(data.address);
            const prayer = toTitleCase(data.userPrayer);

            const c0 = "\t\t\t\t\t\t\t\t\tPhục Dĩ"
            const c1 = "Tiên Tổ Thị Hoàng Bá Dẫn Chí Công Phất Thế Hạn Cổn Khắc Thiệu Dục Thùy Chi Niệm Bất Vong Viên Kỳ Sở Tôn Chuy Chi";
            const c2 = "Nhị Tự \t\t\t\t\t\t\t\t\t Viên Hữu";
            const c3 = markBold(`Việt Nam Quốc ${address}`);
            const c4 = `${data.templeName || 'Mõ Hạc Linh Từ'} Thượng Phụng \t\t\t Gia Tiên Tiền Tổ \t Tổ Tiên Cúng Dạng \t\tCon Cháu Họ`;
            const c5 = markBold(`${generateMembersText(data.members)} Đồng Gia Quyền Đẳng ${prayer.replace(/([,.;])*/g, "") || ''}`);
            const c7 = "Tiên Dám Phú Tuất Thân Tình Ngôn Niệm Càn Thủy Khôn Sinh Ngưỡng Hạ Di Phong Chí Âm Thiên Kinh Địa Nghĩa Thường Tồn Thốn Thảo";
            const c8 = "Chí Tâm Phụng Thừa Hoặc Khuyết Ư Lễ Nghi Tu Tri Hoặc Sá Ư Phần Mộ Phú Kim Tử Tích Hữu Quý Vũ Chung Tu";
            const c9 = "Nhân Linh Tiết Kiến Cụ Phí Nghi Cụ Hữu Trạng Văn \t\t\tPhụng Thượng";
            const c10 = "Môn Đường Thượng Lịch Đại Nội Ngoại Tổ Tiên Đẳng Chư Vị Chân Linh \t\t\t\t\t\t Vị Tiền";
            const c11 = "Tộc Tổ Cô Chân Linh \t\t\t\t\t\t Mãnh Tổ Chân Linh \t\t\t\t\t\t Vị Tiền";
            const c12 = "Tiên Linh \t\t\t\t\t\t\t\t\t\t\t\t Vị Tiền";
            const c13 = "Phu Thùy Am Lạp Dám Chuy Tự Chi Chí Khổn Dĩ Diễn Dĩ Thừa Thí Phù Hựu Ư Âm Công Năng Bảo Năng Trọ";
            const c14 = "Báo Tứ Tôn Nhi Hữu Lợi Thùy Tộ Dẫn Ư Vô Cương Tông Tự Trường Lưu Hóa Hương Bất Dân Dận Thục Lai";
            const c15 = "Tổ Đức Âm Phù Chi Lục Dã";
            const c18 = `Thiên Vận ${data.year} \t\t\tNiên ${data.month} Nguyệt ${data.day} \tNhật \tLễ Chủ Thành Tâm Thượng Tấu \t${markBold('LỄ GIA TIÊN')}`;

            const c8WordCount = c8.trim().split(/\s+/).length;
            const c5Words = c5.trim().split(/\s+/);
            const c5Columns = [];

            if (c5Words.length > c8WordCount) {
                for (let i = 0; i < c5Words.length; i += c8WordCount) {
                    c5Columns.push(c5Words.slice(i, i + c8WordCount).join(' '));
                }
            } else {
                c5Columns.push(c5);
            }

            return [c0, c1, c2, c3, c4, ...c5Columns, c7, c8, c9, c10, c11, c12, c13, c14, c15, c18].join('\n');
        }
    },
    le_phat: {
        id: 'le_phat',
        name: '5. Sớ Lễ Phật',
        title: 'LỄ PHẬT SỚ',
        content: (data) => {
            const address = toTitleCase(data.address);
            const prayer = toTitleCase(data.userPrayer);

            const c0 = "\t\t\t\t\t\t\t\t\tPhục Dĩ"
            const c1 = "Phật Từ Quản Đại Năng Trừ Hạn Ách Tai Ương \t\t\t Thánh Đức Khoan Hồng Tăng Tứ Khang Ninh Phúc Thọ Phù Nhân Khấu Đảo Ngưỡng Đát";
            const c2 = "Kim Dung \t\t\t\t\t\t\t\t\t Viên Hữu";
            const c3 = markBold(`Việt Nam Quốc ${address}`);
            const c4 = `${data.templeName || 'Mõ Hạc Linh Từ'} Thượng Phụng \t\t\t Chín Phương Trời Mười Phương Chư Phật \n Phật Thánh Hiến Cúng Đương Thiên Bá Đảo Giải Hạn Trừ Tai Cầu Bản Mệnh Khang Cường Sự Kim Thần Đệ Tử`;
            const c5 = markBold(`${generateMembersText(data.members)} Đồng Gia Quyền Đẳng ${prayer.replace(/([,.;])*/g, "") || ''}`);
            const c7 = "Liên Tọa Phù Giám Phàm Tâm Ngôn Niệm Thần Đẳng Sinh Cư Chung Giới Mệnh Thuộc";
            const c8 = "Thượng Cung Hạ Càn Khôn Phú Tài Chi Hồng Ân Cảm Nhật Nguyệt Chiếu Lâm Chi Đại Đức \t Thần Hồn Xuất Nhập Khởi Vô Thiên Ác Chi Quan Tuế Nguyệt";
            const c9 = "Lưu Hành Nam Miền Cát Hưng Chi Vận Cận Phi Khấu Đảo Bằng Nhất Niệm Chi Thiên Duyên Hạt Đắc An Ninh Bảo Tử Thời Chi Cát Khánh Do Thị";
            const c10 = "Kim Nguyệt Cát Nhật Đầu Thành Ngũ Tịnh Tín Nhất Tâm Cụ Hữu Sớ Văn Kiền Thân Thượng Tấu \t\t\t\t Cung Duy";
            const c11 = "Nam Mô Thập Phương Vô Lượng Thường Trụ Tam Bảo \t\t\t\t\t\t Kim Liên Tọa Hạ";
            const c12 = "Nam Mô Tam Thừa Đẳng Giáp Chư Vị Bồ Tát \t\t\t\t\t\t Niệm Tọa Hạ";
            const c13 = "Nam Mô Đại Từ Đại Bi Cứu Khổ Cứu Nạn Linh Cảm Quan Thế Âm Bồ Tát \t\t\t\t\t Hồng Liên Tọa Hạ";
            const c14 = "Tam Giới Thiên Chủ Tứ Phủ Vạn Linh Công Đồng Thánh Đế \t\t\t\t\t Ngọc Bệ Hạ";
            const c15 = "Thập Bát Long Thần Già Lam Chân Tể \t\t\t\t\t\t Vị Tiền Phục Nguyện";
            const c16 = "Chư Phật Chứng Minh Vạn Ninh Giám Cách Siêu Khổ Hải Dĩ Từ Hàng Thứ Đắc Hữu Cầu Tất ứng Độ Mê Tân Vũ Bảo Phật Sử Chi Nguyện";
            const c17 = "Dã Tòng Tâm Niên Niên Cảm Lạc Vũ Xuân Đài Cá Cá Đồng Tê Ư Thọ Vực Tam Tai Bát Nạn Sử Vô Xâm Phạn Chi Ngu Bách Phúc \n Thiên Tường Thường Hưởng Thọ Khang Chi Khánh Lộc Tài Vượng Tiến Nhân Vật Bình An Đãn Thần Hạ Tình Vô Nhân Kích Thiết Bình Minh Chi Chí Cẩn Sớ";
            const c18 = `Thiên Vận ${data.year} \t\t\tNiên ${data.month} Nguyệt ${data.day} \t\tNhật \t\t\tThần Đệ Tử Khấu Thủ Thượng Sớ \t\t\t\ ${markBold('LỄ PHẬT')}`;

            const c8WordCount = c8.trim().split(/\s+/).length;
            const c5Words = c5.trim().split(/\s+/);
            const c5Columns = [];

            if (c5Words.length > c8WordCount) {
                for (let i = 0; i < c5Words.length; i += c8WordCount) {
                    c5Columns.push(c5Words.slice(i, i + c8WordCount).join(' '));
                }
            } else {
                c5Columns.push(c5);
            }

            return [c0, c1, c2, c3, c4, ...c5Columns, c7, c8, c9, c10, c11, c12, c13, c14, c15, c16, c17, c18].join('\n');
        }
    },
    le_mau: {
        id: 'le_mau',
        name: '6. Sớ Lễ Mẫu',
        title: 'LỄ MẪU SỚ',
        content: (data) => {
            const address = toTitleCase(data.address);
            const prayer = toTitleCase(data.userPrayer);

            const c0 = "\t\t\t\t\t\t\t\t\tPhục Dĩ"
            const c1 = "Hữu Tiền Tắc Danh Nguyệt Kính Khả Thiên Khai Sắc Tướng Thánh Mẫu Thụ Phúc Vân Xa Táp Địa Hiển Linh \t\t\tNghĩ Khổ Đấu Thành";
            const c2 = "Long Nhan Động \t\tGiám \t\t\t\t\t\tViên Hữu";
            const c3 = markBold(`Việt Nam Quốc ${address}`);
            const c4 = `${data.templeName || 'Mõ Hạc Linh Từ'} Thượng Phụng \t\t\t Tam Tòa Thánh Mẫu \n Phật Thánh Hiến Cúng \t\t\t Thiên Bái Đảo Cầu Bình An Tập Phúc Lộc Thọ Nghênh Tường Sự Kim Thần`;
            const c5 = markBold(`${generateMembersText(data.members)} Đồng Gia Quyền Đẳng ${prayer.replace(/([,.;])*/g, "") || ''}`);
            const c7 = "Cao Ngự Phủ Giám Phi Thánh Thiết Niệm Thần Thao Sinh Trân Giới Kết Tập Nghiệp Duyên Mỗi Tư Thành Khả Thần U Hiển Sớ Vô";
            const c8 = "Nhi Lý Nham Tín Nhân Hoàn Hữu Cố Kim Nguyên Thị Nhất Đồ Dục Cầu Phúc Thọ Dĩ An Toán Tất Tượng Âm Quang Chí Tuế Độ";
            const c9 = "Cung Phùng Lệnh Tiết Bị Dung Nghi Hương Hoa Kim Ngân Lễ Vật Tịnh Cúng Phu Trần Cụ Hữu Sớ Văn";
            const c10 = "Mao Thần\t\t\t\t Thượng Tấu \t\t\t\t Cung Duy";
            const c11 = "Nam Mô Đại Từ Đại Bi Cứu Khổ Cứu Nạn Linh Cảm Quan Thế Âm Bồ Tát \t\t\t\t\t Hồng Liên Tọa Hạ";
            const c12 = "Tam Giới Thiên Chủ Tứ Phủ Vạn Linh Công Đồng Thánh Đế \t\t\t\t\t Ngọc Bệ Hạ";
            const c13 = "Vân Hương Thiên Tiên Tam Vị Thánh Mẫu Ngũ Vị Tôn Ông Tứ Vị Khâm Sai\t\t\t\t\t\tNgọc Bệ Hạ";
            const c14 = "Tứ Phủ Chầu Bà Tứ Phủ Thanh Hoàng Công Đồng Tiên Cô Công Đồng Hoàng Quận \t\t\t\t\t Ngọc Bệ Hạ";
            const c15 = "Bản Điện Phụng Sự Nhất Thiết Liệt Vị Uy Linh Ngũ Hổ Thần Tướng \t\t\t\t\t\t Vị Tiền Cung Vọng";
            const c16 = "Thánh Từ \t\t\t\tĐổng Thùy \t\t\t\tChiếu Giám \t\t\t\tPhục Nguyện";
            const c17 = "Bàng Chúc Vô Cương Giám Lam Bát Viên Quang Ba Hiếu Sinh Chi Đức Độ Ách Tiêu Tài Hoằng Suy Tế Chúng Chi Nhân Giáng Tường Tích Phúm \n Tý Đắc Uy Quang Phu Anh Như Phung Ba Đan Chi Thiên Lạc Nghiệp An Cư Bát Phu Vạn Minh Chi Địa Thứ Phu Yên Hỷ Cộng Mộc \n Hồng Hữu Đãn Thần Hạ Tình Vô Nhân Khích Thiết Bình Doanh Chi Chí Cẩn Sớ Văn";
            const c18 = `Thiên Vận ${data.year} \t\t\tNiên ${data.month} Nguyệt ${data.day} \t\tNhật \t\tThần Khấu Thủ Thượng Cụ Sớ \t\t ${markBold('LỄ MẪU')}`;

            const c8WordCount = c8.trim().split(/\s+/).length;
            const c5Words = c5.trim().split(/\s+/);
            const c5Columns = [];

            if (c5Words.length > c8WordCount) {
                for (let i = 0; i < c5Words.length; i += c8WordCount) {
                    c5Columns.push(c5Words.slice(i, i + c8WordCount).join(' '));
                }
            } else {
                c5Columns.push(c5);
            }

            return [c0, c1, c2, c3, c4, ...c5Columns, c7, c8, c9, c10, c11, c12, c13, c14, c15, c16, c17, c18].join('\n');
        }
    },
    than_tai: {
        id: 'than_tai',
        name: '7. Sớ Thần Tài',
        title: 'THẦN TÀI SỚ',
        content: (data) => `Phục dĩ\nTài thần\ngiáng phúc.\nViệt Nam Quốc,\n${data.address}\ncư phụng.\nKim thần\n${generateMembersText(data.members)}\nKinh doanh\ntại:\n${data.address}.\nCung duy:\nNgũ Phương\nNgũ Thổ\nLong Thần.\nTiền Hậu\nĐịa Chủ\nTài Thần.\nThành tâm\ncầu nguyện:\nCầu xin\nChư vị\nTôn Thần\nphù hộ\nđộ trì.\nBuôn may\nbán đắt,\ntài lộc\ndồi dào.\nVào cửa\nbình an,\nra cửa\nđại lợi.\n${data.userPrayer ? formatVerticalText(data.userPrayer) + '\n' : ''}Cẩn tấu.`
    },
    tao_quan: {
        id: 'tao_quan',
        name: '8. Sớ Táo Quân',
        title: 'TÁO QUÂN SỚ',
        content: (data) => `Phục dĩ\nThần ân\nquảng đại.\nViệt Nam Quốc,\n${data.address}\ncư phụng.\nKim thần\n${generateMembersText(data.members)}\nNay nhân\ntiết\nông Táo\nchầu trời.\nThành tâm\nsửa biện\nhương hoa.\nCung thỉnh:\nĐông Trù\nTư Mệnh\nTáo Phủ\nThần Quân.\nThiết nghĩ:\nMột năm\nqua nhờ\nơn thần\nche chở.\nNay tiễn\nThần về\ntrời tấu sớ.\nCúi xin\nThần tâu\nđiều lành,\nbỏ điều dữ.\nCầu cho\nnăm mới\ngia chủ\nđắc tài\nđắc lộc.\n${data.userPrayer ? formatVerticalText(data.userPrayer) + '\n' : ''}Cẩn tấu.`
    },
    tat_nien: {
        id: 'tat_nien',
        name: '9. Sớ Tất Niên',
        title: 'TẤT NIÊN SỚ',
        content: (data) => `Phục dĩ\nTống cựu\nnghinh tân.\nViệt Nam Quốc,\n${data.address}\ncư phụng.\nKim thần\n${generateMembersText(data.members)}\nNay nhân\nngày cuối năm\n${data.year}.\nCung duy:\nĐương Niên\nHành Khiển\nTôn Thần.\nBản Cảnh\nThành Hoàng\nChư Vị\nĐại Vương.\nGia Tiên\nTiền Tổ\ndòng họ\n....................\nKính cáo:\nKính tạ\nchư vị\nTôn Thần,\nGia Tiên\nđã phù hộ\nđộ trì\ntrong một\nnăm qua.\nCúi xin\nxá tội\nlỗi lầm,\nban phúc\nlộc thọ\ncho năm mới.\n${data.userPrayer ? formatVerticalText(data.userPrayer) + '\n' : ''}Cẩn tấu.`
    },
    giao_thua: {
        id: 'giao_thua',
        name: '10. Sớ Giao Thừa',
        title: 'GIAO THỪA SỚ',
        content: (data) => `Phục dĩ\nThiên vận\ntuần hoàn.\nGiờ Giao Thừa\nnăm ${data.year}\nchuyển sang\nnăm mới.\nViệt Nam Quốc,\n${data.address}\ncư phụng.\nKim thần\n${generateMembersText(data.members)}\nCung duy:\nCựu Niên\nHành Khiển\nTôn Thần.\nTân Niên\nHành Khiển\nTôn Thần.\nBản Cảnh\nThành Hoàng,\nThổ Địa.\nThành tâm\nkính lễ:\nTiễn đưa\nquan Cựu niên,\nnghinh đón\nquan Tân niên.\nCầu xin\nQuốc thái\ndân an,\nmưa thuận\ngió hòa.\nGia đạo\nhưng long,\nnhân khang\nvật thịnh.\n${data.userPrayer ? formatVerticalText(data.userPrayer) + '\n' : ''}Cẩn tấu.`
    }
};

export default function App() {
    const [formData, setFormData] = useState({
        members: [
            { id: 1, title: 'Tín chủ', name: '', birthDate: '1990-01-01', gender: 'male' }
        ],
        address: '',
        templeName: 'Mõ Hạc Linh Từ',
        userPrayer: '',
        ceremonyDate: new Date().toISOString().split('T')[0],
        currentYear: new Date().getFullYear(),
        selectedTemplates: ['cau_an'],
        paperSize: localStorage.getItem('paperSize') || 'a4',
        customWidth: localStorage.getItem('customWidth') || 297,
        customHeight: localStorage.getItem('customHeight') || 210
    });

    const [isInputVisible, setIsInputVisible] = useState(true);
    const [previewData, setPreviewData] = useState(null);
    const [savedSos, setSavedSos] = useState([]);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [showDonateModal, setShowDonateModal] = useState(false);
    const [saveName, setSaveName] = useState('');
    const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);


    const templateDropdownRef = useRef(null);
    const [confirmAction, setConfirmAction] = useState(null);
    const [notification, setNotification] = useState(null);
    const headerRef = useRef(null);

    // Close template dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (templateDropdownRef.current && !templateDropdownRef.current.contains(event.target)) {
                setIsTemplateDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [templateDropdownRef]);

    useEffect(() => {
        const saved = localStorage.getItem('saved_sos');
        if (saved) {
            try { setSavedSos(JSON.parse(saved)); } catch (e) { console.error(e); }
        }
    }, []);

    // Persist paper size and custom dimensions
    useEffect(() => {
        localStorage.setItem('paperSize', formData.paperSize);
        localStorage.setItem('customWidth', formData.customWidth);
        localStorage.setItem('customHeight', formData.customHeight);
    }, [formData.paperSize, formData.customWidth, formData.customHeight]);

    const computedData = useMemo(() => {
        const year = LUNAR_UTILS.getCanChi(formData.currentYear);
        const lunarDate = LUNAR_UTILS.convertSolarToLunar(formData.ceremonyDate);
        const currentLunarYear = lunarDate.y;

        const members = formData.members.map(m => {
            const birthLunar = LUNAR_UTILS.convertSolarToLunar(m.birthDate);
            const birthLunarYear = birthLunar.y;
            const age = birthLunarYear ? currentLunarYear - birthLunarYear + 1 : 0;
            const tuvi = LUNAR_UTILS.getTuVi(age);

            return {
                ...m,
                age: age > 0 ? age : 0,
                canChi: LUNAR_UTILS.getCanChi(birthLunarYear),
                sao: LUNAR_UTILS.getSao(age, m.gender),
                han: LUNAR_UTILS.getHan(age, m.gender),
                soTuVi: tuvi.so,
                saoTuVi: tuvi.sao
            };
        });
        const yearCanChi = LUNAR_UTILS.getCanChi(lunarDate.y);
        return { ...formData, members, year: yearCanChi, day: lunarDate.d, month: lunarDate.m, lunarDateObj: lunarDate };
    }, [formData]);

    const handleCreateSo = () => {
        const emptyNameMember = formData.members.find(m => !m.name.trim());
        if (emptyNameMember) {
            showNotification("Vui lòng điền đầy đủ họ tên cho tất cả thành viên!", 'error');
            return;
        }
        if (!formData.address.trim()) {
            showNotification("Vui lòng nhập địa chỉ!", 'error');
            return;
        }
        if (!formData.selectedTemplates || formData.selectedTemplates.length === 0) {
            setPreviewData(null);
            showNotification("Vui lòng chọn loại sớ!", 'error');
            return;
        }

        const newData = [];

        formData.selectedTemplates.forEach(id => {
            const template = TEMPLATES[id];

            // Logic đặc biệt cho Sớ Hình Nhân: Mỗi người 1 sớ
            if (id === 'hinh_nhan') {
                computedData.members.forEach(member => {
                    // Tạo data riêng cho từng thành viên
                    const memberData = {
                        ...computedData,
                        members: [member] // Chỉ truyền 1 thành viên vào template
                    };

                    const rawContent = template.content(memberData);
                    const formatted = formatVerticalText(rawContent);
                    const lines = formatted.split('\n');

                    // --- LOGIC TÍNH TOÁN GRID ĐỘNG ---
                    const cols = lines.length;
                    const maxWords = Math.max(...lines.map(l => l.trim().split(/\s+/).length), 15);
                    const rows = maxWords;

                    newData.push({
                        id: `${id}_${member.id}`, // Unique ID cho từng sớ
                        title: `${template.title} - ${member.name}`,
                        contentLines: lines,
                        rows: rows,
                        cols: cols
                    });
                });
            } else {
                // Logic cũ cho các sớ khác (gộp chung)
                const rawContent = template.content(computedData);
                const formatted = formatVerticalText(rawContent);
                const lines = formatted.split('\n');

                // --- LOGIC TÍNH TOÁN GRID ĐỘNG ---
                const cols = lines.length;
                const maxWords = Math.max(...lines.map(l => l.trim().split(/\s+/).length), 15);
                const rows = maxWords;

                newData.push({
                    id: id,
                    title: template.title,
                    contentLines: lines,
                    rows: rows,
                    cols: cols
                });
            }
        });

        setPreviewData(newData);
        showNotification("Đã tạo nội dung sớ mới!");
    };

    const triggerReset = () => { setConfirmAction({ type: 'reset' }); };
    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleTemplateToggle = (id) => {
        setFormData(prev => {
            const current = prev.selectedTemplates || [];
            if (current.includes(id)) return { ...prev, selectedTemplates: current.filter(item => item !== id) };
            else return { ...prev, selectedTemplates: [...current, id] };
        });
    };
    const handleMemberChange = (id, field, value) => {
        setFormData(prev => ({ ...prev, members: prev.members.map(m => m.id === id ? { ...m, [field]: value } : m) }));
    };
    const addMember = () => {
        setFormData(prev => ({ ...prev, members: [...prev.members, { id: Date.now(), title: '', name: '', birthDate: '1990-01-01', gender: 'female' }] }));
    };
    const removeMember = (id) => {
        if (formData.members.length <= 1) return;
        setFormData(prev => ({ ...prev, members: prev.members.filter(m => m.id !== id) }));
    };
    const handleCustomSizeChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    };
    const handlePrint = () => window.print();

    const handleCopy = () => {
        if (!previewData || previewData.length === 0) {
            showNotification('Chưa có nội dung sớ để sao chép', 'error');
            return;
        }
        const textToCopy = previewData.map(item => `${item.title}\n\n${item.contentLines.join('\n')}`).join('\n\n--------------------\n\n');
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            showNotification('Đã sao chép toàn bộ nội dung sớ!');
        } catch (err) {
            showNotification('Không thể sao chép!', 'error');
        }
        document.body.removeChild(textArea);
    };

    const openSaveModal = () => {
        const firstMember = formData.members[0]?.name || "Chưa có tên";
        const count = formData.selectedTemplates?.length || 0;
        const templateName = count > 1 ? `${count} loại sớ` : (TEMPLATES[formData.selectedTemplates[0]]?.name || "Sớ");
        setSaveName(`${firstMember} - ${templateName} (${new Date().toLocaleDateString('vi-VN')})`);
        setShowSaveModal(true);
    };

    const handleSave = () => {
        if (!saveName.trim()) {
            showNotification("Vui lòng nhập tên!", 'error');
            return;
        }
        const newItem = { id: Date.now(), name: saveName, data: formData, createdAt: new Date().toISOString() };
        const newSavedList = [newItem, ...savedSos];
        setSavedSos(newSavedList);
        localStorage.setItem('saved_sos', JSON.stringify(newSavedList));
        setShowSaveModal(false);
        showNotification("Đã lưu sớ thành công!");
    };

    const triggerLoad = (item) => { setConfirmAction({ type: 'load', item }); };
    const triggerDelete = (item) => { setConfirmAction({ type: 'delete', item }); };

    const executeAction = () => {
        if (!confirmAction) return;
        const { type, item } = confirmAction;
        if (type === 'load') {
            const loadedData = { ...item.data };
            if (!loadedData.selectedTemplates) {
                if (loadedData.templateId) loadedData.selectedTemplates = [loadedData.templateId];
                else loadedData.selectedTemplates = ['cau_an'];
            }
            setFormData(loadedData);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setPreviewData(null);
            setShowLoadModal(false);
            showNotification(`Đã tải lại: ${item.name}. Vui lòng bấm "Tạo Sớ".`);
        } else if (type === 'delete') {
            const newSavedList = savedSos.filter(s => s.id !== item.id);
            setSavedSos(newSavedList);
            localStorage.setItem('saved_sos', JSON.stringify(newSavedList));
            showNotification("Đã xóa sớ thành công");
        } else if (type === 'reset') {
            setFormData(prev => ({
                ...prev,
                members: [{ id: Date.now(), title: 'Tín chủ', name: '', birthDate: '1990-01-01', gender: 'male' }],
                address: '', familyLine: '', reason: '', userPrayer: ''
            }));
            setPreviewData(null);
            showNotification("Đã làm mới dữ liệu nhập liệu!");
        }
        setConfirmAction(null);
    };

    const currentPaper = useMemo(() => {
        let w, h;
        if (formData.paperSize === 'custom') {
            w = formData.customWidth;
            h = formData.customHeight;
        } else {
            const size = PAPER_SIZES[formData.paperSize];
            w = parseInt(size.width);
            h = parseInt(size.height);
        }
        return { width: `${w}mm`, height: `${h}mm`, css: `${w}mm ${h}mm`, aspectRatio: `${w} / ${h}` };
    }, [formData.paperSize, formData.customWidth, formData.customHeight]);

    const renderSsoContent = (item) => {
        if (!item || !item.contentLines) return null;

        // Tính toán font size dựa trên tổng số đơn vị fr (cols - 1 + 2 = cols + 1)
        const totalFr = item.cols + 1;
        const fontSize = Math.min(100 / totalFr, 100 / item.rows * 1.4) * 0.2; // Hệ số 0.15 để đảm bảo vừa vặn với từ dài (VD: NGUYỄN)

        return (
            <div className="sso-container relative" style={{
                display: 'grid',
                // Cột cuối cùng (bên trái trong RTL) gấp đôi kích thước
                gridTemplateColumns: `repeat(${item.cols - 1}, 1fr) 2fr`,
                gridTemplateRows: `repeat(${item.rows}, 1fr)`,
                width: '100%',
                height: '100%',
                direction: 'rtl',
                padding: '4px',
                boxSizing: 'border-box',
                border: '1px solid #ccc' // Viền bao ngoài
            }}>
                {item.contentLines.map((line, colIdx) => {
                    // Replace tabs with a special placeholder to preserve them during split
                    const words = line.replace(/\t/g, ' {{TAB}} ').trim().split(/\s+/);
                    return (
                        <div key={colIdx} className="sso-col" style={{
                            gridColumn: `${colIdx + 1} / span 1`,
                            gridRow: '1 / -1',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'flex-start', // Revert: Canh lề trên
                            gap: '0',
                            minWidth: '0',
                            //borderLeft: '1px solid #ccc', // Viền giữa các cột
                            padding: '0 1px'
                        }}>
                            {words.map((word, wordIdx) => {
                                if (word === '{{TAB}}') {
                                    return (
                                        <div key={wordIdx} className="sso-word" style={{
                                            height: `calc(100% / ${item.rows})`,
                                            width: '100%',
                                            // Empty cell for spacing
                                        }}></div>
                                    );
                                }

                                const isBold = word.startsWith('^');
                                const displayWord = isBold ? word.substring(1) : word;

                                return (
                                    <div key={wordIdx} className="sso-word" style={{
                                        height: `calc(100% / ${item.rows})`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '100%',
                                        overflow: 'visible',
                                        whiteSpace: 'nowrap',
                                        // borderBottom: '1px solid #eee' // Đã bỏ kẻ ngang theo yêu cầu
                                    }}>
                                        <span style={{
                                            fontSize: `clamp(8px, ${fontSize}cqi, 120px)`,
                                            lineHeight: 1.0,
                                            fontWeight: isBold ? 800 : 500, // Đậm cho dynamic, thường cho static
                                            fontFamily: isBold ? '"Noto Serif", serif' : '"Noto Serif", serif'
                                        }}>{displayWord}</span>
                                    </div>
                                )
                            })}
                        </div>
                    );
                })}
            </div>
        );
    };

    const getSelectedTemplatesLabel = () => {
        const selected = formData.selectedTemplates || [];
        if (selected.length === 0) return "Chọn loại sớ...";
        if (selected.length === 1) return TEMPLATES[selected[0]]?.name || "Đã chọn 1 sớ";
        return `Đã chọn ${selected.length} loại sớ`;
    };

    return (
        <div className="min-h-screen font-sans" style={{ color: 'var(--vn-dark-brown)' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;1,400&family=Cinzel+Decorative:wght@700&display=swap');
                
                /* Traditional Vietnamese Color Palette */
                :root {
                    --vn-red: #8B0000;
                    --vn-gold: #D4AF37;
                    --vn-jade: #00A86B;
                    --vn-parchment: #F5E6D3;
                    --vn-dark-brown: #3E2723;
                    --vn-light-gold: #F4E4C1;
                }
                
                .font-sso { font-family: 'Noto Serif', serif; }
                .font-header { font-family: 'Cinzel Decorative', serif; }
                
                /* Traditional Paper Background with Texture */
                .paper-bg { 
                    background-color: var(--vn-parchment);
                    box-shadow: 0 15px 40px rgba(139, 0, 0, 0.3); 
                    background-image: 
                        url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E"),
                        url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 10 Q35 15 30 20 Q25 15 30 10' fill='none' stroke='%23D4AF37' stroke-width='0.3' opacity='0.1'/%3E%3C/svg%3E");
                    container-type: size; 
                }
                
                /* Traditional Vietnamese Border with Dragon/Cloud Motifs */
                .fancy-border { 
                    border: 8px solid transparent; 
                    padding: 30px; 
                    border-image: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='2' y='2' width='36' height='36' fill='none' stroke='%238B0000' stroke-width='3'/%3E%3Crect x='6' y='6' width='28' height='28' fill='none' stroke='%23D4AF37' stroke-width='1.5'/%3E%3Ccircle cx='20' cy='4' r='2' fill='%23D4AF37'/%3E%3Ccircle cx='36' cy='20' r='2' fill='%23D4AF37'/%3E%3Ccircle cx='20' cy='36' r='2' fill='%23D4AF37'/%3E%3Ccircle cx='4' cy='20' r='2' fill='%23D4AF37'/%3E%3C/svg%3E") 40 stretch; 
                }
                
                /* Input Fields with Traditional Style */
                .excel-input { 
                    border: 1px solid var(--vn-gold); 
                    border-radius: 2px; 
                    padding: 2px 4px; 
                    width: 100%; 
                    font-size: 12px; 
                    transition: all 0.3s; 
                    background-color: rgba(255, 253, 240, 0.8);
                }
                .excel-input:not(textarea) { height: 24px; }
                .excel-input:focus { 
                    border-color: var(--vn-red); 
                    outline: none; 
                    box-shadow: 0 0 0 2px rgba(139, 0, 0, 0.1), 0 0 8px rgba(212, 175, 55, 0.3); 
                    background-color: #fffef5;
                }
                .excel-label { 
                    font-size: 10px; 
                    font-weight: 700; 
                    color: var(--vn-dark-brown); 
                    margin-bottom: 1px; 
                    display: block; 
                    text-transform: uppercase; 
                }
                .preview-wrapper { container-type: inline-size; width: 100%; }
                
                /* Traditional Background Pattern - Generated Image */
                
                /* Traditional Background Pattern - Generated Image with Opacity */
                body {
                    background-color: #F5E6D3;
                    position: relative;
                    min-height: 100vh;
                }
                body::before {
                    content: "";
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #F5E6D3 0%, #E8D5B7 100%);
                    background-image: url("/bg-pattern.png");
                    background-size: cover;
                    background-attachment: fixed;
                    background-blend-mode: multiply;
                    opacity: 0.15;
                    z-index: -1;
                    pointer-events: none;
                }
                
                /* Decorative divider */
                .traditional-divider {
                    position: relative;
                    height: 2px;
                    background: linear-gradient(90deg, transparent 0%, var(--vn-gold) 50%, transparent 100%);
                }
                .traditional-divider::before {
                    content: '❖';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: var(--vn-gold);
                    background: var(--vn-parchment);
                    padding: 0 10px;
                    font-size: 12px;
                }

                /* Traditional Modal Styling */
                .traditional-modal {
                    background-color: var(--vn-parchment);
                    border: 2px solid var(--vn-gold);
                    position: relative;
                    overflow: hidden;
                }
                .traditional-modal::before {
                    content: "";
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #F5E6D3 0%, #E8D5B7 100%);
                    background-image: url("/bg-pattern.png");
                    background-size: cover;
                    background-blend-mode: multiply;
                    opacity: 0.15;
                    z-index: 0;
                    pointer-events: none;
                }
                .traditional-modal > * {
                    position: relative;
                    z-index: 1;
                }

                @media print {
                    @page { size: ${currentPaper.css}; margin: 0; }
                    body * { visibility: hidden; }
                    #printable-area, #printable-area * { visibility: visible; }
                    #printable-area { 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100%; 
                        height: auto !important; 
                        margin: 0; 
                        padding: 0; 
                        background-color: white !important; 
                        max-width: none !important; 
                        aspect-ratio: auto !important; 
                    }
                    .print-page-break { 
                        break-after: page; 
                        page-break-after: always;
                        height: 100vh !important;
                        max-height: 100vh !important;
                        overflow: hidden !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                    }
                    .print-page-break:last-child { 
                        break-after: auto; 
                        page-break-after: auto;
                    }
                    .print-page-break .paper-bg {
                        max-height: 100vh !important;
                        height: 100vh !important;
                        overflow: hidden !important;
                    }
                    .font-sso { font-size: 20px !important; }
                    .no-print { display: none !important; }
                }
            `}</style>

            {notification && (
                <div className={`fixed top-4 right-4 z-[110] px-4 py-3 rounded shadow-lg flex items-center gap-2 ${notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                    {notification.type === 'error' ? <AlertCircle size={20} /> : <Check size={20} />}
                    <span className="font-bold text-sm">{notification.message}</span>
                </div>
            )}

            <div ref={headerRef} className="sticky top-0 z-50 shadow-xl no-print w-full">
                <div className="border-b-4 border-[var(--vn-gold)] w-full" style={{ background: 'linear-gradient(135deg, var(--vn-red) 0%, #6B0000 100%)' }}>
                    <div className="w-full px-2 py-2">
                        <div className="flex flex-col md:flex-row justify-between items-center">
                            <h1 className="text-lg md:text-xl font-bold font-header flex items-center gap-2" style={{ color: 'var(--vn-gold)', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}><FileText className="w-5 h-5 md:w-6 md:h-6" style={{ filter: 'drop-shadow(0 0 3px var(--vn-gold))' }} /> SỚ VĂN CỔ TRUYỀN</h1>
                            <div className="flex gap-2 items-center mt-1 md:mt-0">
                                {/* <button onClick={() => setShowDonateModal(true)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow transition"><Coffee size={12} /> Donate a coffee</button> */}
                                <button onClick={() => setShowLoadModal(true)} className="hover:opacity-90 px-3 py-1 rounded text-[10px] font-bold flex items-center gap-1 shadow-lg transition" style={{ background: 'var(--vn-light-gold)', color: 'var(--vn-dark-brown)', border: '1px solid var(--vn-gold)' }}><FolderOpen size={12} /> Sớ đã lưu ({savedSos.length})</button>
                                <button onClick={openSaveModal} className="hover:opacity-90 px-3 py-1 rounded text-[10px] font-bold flex items-center gap-1 shadow-lg transition" style={{ background: 'linear-gradient(135deg, var(--vn-light-gold) 0%, var(--vn-gold) 100%)', color: 'var(--vn-dark-brown)', border: '1px solid var(--vn-red)' }}><Save size={12} /> Lưu sớ</button>
                                <button onClick={handlePrint} className="hover:opacity-90 px-3 py-1 rounded text-[10px] font-bold flex items-center gap-1 shadow-lg transition" style={{ background: 'linear-gradient(135deg, var(--vn-gold) 0%, #B8963A 100%)', color: 'var(--vn-dark-brown)', border: '1px solid var(--vn-red)' }}><Printer size={12} /> In ngay</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="w-full p-0 pt-0">
                <div className={`transition-all duration-500 w-full ${isInputVisible ? 'opacity-100 max-h-[2000px] overflow-visible' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                    <div className="p-2 border-b mb-0 no-print" style={{ background: 'rgba(245, 230, 211, 0.5)', borderBottom: '2px solid var(--vn-gold)' }}>
                        <div className="p-1 rounded mb-2 shadow-sm" style={{ background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(245, 230, 211, 0.2) 100%)', border: '1px solid var(--vn-gold)' }}>
                            <div className="flex justify-between items-center mb-1 pb-1 px-1" style={{ borderBottom: '1px solid var(--vn-gold)' }}>
                                <h3 className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--vn-red)' }}><User size={14} /> NHẬP LIỆU GIA ĐÌNH</h3>
                                <button onClick={addMember} className="hover:opacity-90 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition shadow" style={{ background: 'linear-gradient(135deg, var(--vn-light-gold) 0%, var(--vn-gold) 100%)', color: 'var(--vn-dark-brown)', border: '1px solid var(--vn-red)' }}><Plus size={10} /> Thêm người</button>
                            </div>
                            <div className="max-h-40 overflow-y-auto pr-1">
                                {formData.members.map((member, index) => (
                                    <div key={member.id} className="grid grid-cols-12 gap-2 gap-y-3 p-3 bg-white rounded-lg shadow-sm border border-gray-200 mb-2 relative md:gap-1 md:p-1 md:items-center md:border-gray-100 md:rounded md:shadow-none md:mb-1 group">
                                        {formData.members.length > 1 && (
                                            <button onClick={() => removeMember(member.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-600 md:hidden"><Trash2 size={16} /></button>
                                        )}
                                        <div className="col-span-4 md:col-span-1">
                                            <label className="block md:hidden text-[10px] font-bold text-gray-500 uppercase mb-0.5">Danh xưng</label>
                                            <input
                                                type="text"
                                                list="title-options"
                                                value={member.title}
                                                onChange={(e) => handleMemberChange(member.id, 'title', e.target.value)}
                                                className="excel-input px-1 font-medium text-gray-800 w-full h-8 md:h-6"
                                                placeholder="Chọn..."
                                                onFocus={(e) => e.target.select()}
                                            />
                                        </div>
                                        <div className="col-span-8 md:col-span-3">
                                            <label className="block md:hidden text-[10px] font-bold text-gray-500 uppercase mb-0.5">Họ tên</label>
                                            <input type="text" value={member.name} onChange={(e) => handleMemberChange(member.id, 'name', e.target.value)} placeholder="Họ tên..." className={`excel-input uppercase font-bold w-full h-8 md:h-6 ${index === 0 ? 'text-blue-800' : 'text-gray-700'}`} />
                                        </div>
                                        <div className="col-span-4 md:col-span-1">
                                            <label className="block md:hidden text-[10px] font-bold text-gray-500 uppercase mb-0.5">Giới tính</label>
                                            <select value={member.gender} onChange={(e) => handleMemberChange(member.id, 'gender', e.target.value)} className="excel-input px-0 text-center w-full h-8 md:h-6"><option value="male">Nam</option><option value="female">Nữ</option></select>
                                        </div>
                                        <div className="col-span-8 md:col-span-2">
                                            <label className="block md:hidden text-[10px] font-bold text-gray-500 uppercase mb-0.5">Ngày sinh</label>
                                            <input
                                                type="date"
                                                value={member.birthDate}
                                                onChange={(e) => handleMemberChange(member.id, 'birthDate', e.target.value)}
                                                className="excel-input px-1 text-center w-full h-8 md:h-6"
                                            />
                                        </div>
                                        <div className="col-span-12 grid grid-cols-5 gap-1 md:contents">
                                            <div className="col-span-1 md:col-span-1 text-center font-mono text-[10px] font-bold text-purple-700 bg-purple-50 py-1 md:py-0.5 rounded border border-purple-100 flex items-center justify-center h-full">{computedData.members[index]?.canChi}</div>
                                            <div className="col-span-1 md:col-span-1 text-center font-mono text-[10px] font-bold text-gray-600 bg-gray-50 py-1 md:py-0.5 rounded flex items-center justify-center h-full">{computedData.members[index]?.age}T</div>
                                            <div className="col-span-1 md:col-span-1 text-center font-mono text-[10px] font-bold text-green-700 bg-green-50 py-1 md:py-0.5 rounded border border-green-100 flex items-center justify-center h-full overflow-hidden"><span className="truncate">{computedData.members[index]?.sao}</span></div>
                                            <div className="col-span-1 md:col-span-1 text-center font-mono text-[10px] font-bold text-red-600 bg-red-50 py-1 md:py-0.5 rounded border border-red-100 flex items-center justify-center h-full overflow-hidden"><span className="truncate">{computedData.members[index]?.han}</span></div>
                                            <div className="col-span-1 md:col-span-1 flex flex-col items-center justify-center bg-yellow-50 rounded border border-yellow-100 py-0.5 px-1 h-full relative min-h-[32px] md:min-h-0"><div className="text-[9px] font-bold text-yellow-800 whitespace-nowrap leading-none mb-0.5">{computedData.members[index]?.soTuVi}</div><div className="text-[8px] text-gray-500 truncate w-full text-center leading-none">{computedData.members[index]?.saoTuVi}</div>{formData.members.length > 1 && (<button onClick={() => removeMember(member.id)} className="absolute -right-2 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-red-600 bg-white hover:bg-red-50 rounded-full p-0.5 shadow opacity-0 group-hover:opacity-100 transition z-10 hidden md:block" title="Xóa dòng này"><Trash2 size={12} /></button>)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg w-full flex flex-col gap-3" style={{ background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(245, 230, 211, 0.2) 100%)', border: '1px solid var(--vn-gold)' }}>
                                <div className="flex-grow flex flex-col">
                                    <label className="excel-label mb-1 ml-1">Địa chỉ</label>
                                    <textarea name="address" value={formData.address} onChange={handleChange} className="excel-input w-full resize-none text-sm flex-grow rounded transition-shadow" placeholder="Nhập đầy đủ địa chỉ..." style={{ minHeight: '88px' }} />
                                </div>
                                <div className="grid grid-cols-12 gap-2 h-10">
                                    <div className="col-span-7 flex items-center rounded px-2 bg-white h-full" style={{ border: '1px solid var(--vn-gold)' }}>
                                        <CalendarIcon size={16} className="flex-shrink-0 mr-1" style={{ color: 'var(--vn-red)' }} />
                                        <span className="text-xs font-bold text-gray-600 whitespace-nowrap mr-1">Ngày lễ</span>
                                        <input type="date" name="ceremonyDate" value={formData.ceremonyDate} onChange={handleChange} className="flex-grow outline-none font-bold text-sm bg-transparent text-right w-full min-w-0" style={{ color: 'var(--vn-red)' }} />
                                    </div>
                                    <div className="col-span-5 h-full px-1 rounded flex items-center justify-center gap-1 whitespace-nowrap overflow-hidden" style={{ background: 'rgba(212, 175, 55, 0.1)', border: '1px solid var(--vn-gold)' }}>
                                        <span className="text-sm font-bold" style={{ color: 'var(--vn-red)' }}>{computedData.day}/{computedData.month}</span>
                                        <span className="text-xs font-bold" style={{ color: 'var(--vn-dark-brown)' }}>({computedData.year})</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-3 rounded-lg w-full relative flex flex-col gap-3" style={{ background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(245, 230, 211, 0.2) 100%)', border: '1px solid var(--vn-gold)' }}>
                                <h3 className="text-[10px] font-bold uppercase ml-1" style={{ color: 'var(--vn-red)' }}>Nội Dung Sớ (Có thể chọn nhiều)</h3>
                                <div ref={templateDropdownRef} className="relative">
                                    <button onClick={() => setIsTemplateDropdownOpen(!isTemplateDropdownOpen)} className="excel-input font-bold text-left flex items-center justify-between w-full bg-white h-9 rounded hover:border-red-300 transition-colors" style={{ color: 'var(--vn-red)', borderColor: 'var(--vn-gold)' }}><span className="truncate">{getSelectedTemplatesLabel()}</span><ChevronDown size={14} className="text-gray-500" /></button>
                                    {isTemplateDropdownOpen && (
                                        <div className="absolute z-[200] top-full left-0 w-full bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto mt-1">
                                            {Object.values(TEMPLATES).map(t => {
                                                const isSelected = (formData.selectedTemplates || []).includes(t.id);
                                                return (
                                                    <div key={t.id} onClick={() => handleTemplateToggle(t.id)} className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-red-50 border-b border-gray-50 last:border-none transition-colors ${isSelected ? 'bg-red-50 text-red-800 font-medium' : 'text-gray-700'}`}>
                                                        <div className={`w-4 h-4 flex items-center justify-center rounded border ${isSelected ? 'bg-red-600 border-red-600' : 'bg-white border-gray-300'}`}>{isSelected && <Check size={12} className="text-white" />}</div>
                                                        <span className="text-sm">{t.name}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                <input type="text" name="templeName" value={formData.templeName} onChange={handleChange} placeholder="Tên đền/phủ (VD: Mõ Hạc Linh Từ)..." className="excel-input w-full h-9 rounded bg-white shadow-sm border-gray-200" />
                                <textarea name="userPrayer" value={formData.userPrayer} onChange={handleChange} placeholder="Nhập lời cầu nguyện riêng (nếu có)..." className="excel-input w-full resize-none bg-white flex-grow rounded" style={{ minHeight: '80px' }} />
                                <div className="mt-auto flex gap-2">
                                    <button onClick={triggerReset} className="bg-white hover:bg-gray-50 text-gray-500 font-bold py-2 px-3 rounded shadow-sm flex items-center justify-center gap-1 transition-all text-xs uppercase tracking-wide border border-gray-200 h-9 hover:border-red-200 hover:text-red-500" title="Xóa hết thông tin nhập"><RotateCcw size={14} /></button>
                                    <button onClick={handleCreateSo} className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-2 px-4 rounded shadow-sm flex items-center justify-center gap-2 transition-all text-xs uppercase tracking-wide h-9 transform active:scale-[0.98]"><Play size={14} fill="currentColor" /> Tạo Sớ</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`flex justify-center mb-4 relative z-[60] no-print group transition-all duration-300 ${isInputVisible ? 'mt-2' : 'mt-0'}`}>
                    <button onClick={() => setIsInputVisible(!isInputVisible)} className="hover:opacity-90 px-4 py-1.5 rounded shadow-lg text-xs font-bold flex items-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0" style={{ background: 'linear-gradient(135deg, var(--vn-light-gold) 0%, var(--vn-gold) 100%)', color: 'var(--vn-dark-brown)', border: '1px solid var(--vn-red)' }}>{isInputVisible ? <><PanelTopClose size={14} /> THU GỌN</> : <><PanelTopOpen size={14} /> MỞ RỘNG</>}</button>
                    <div className="absolute top-1/2 left-0 w-full h-px bg-gray-300 -z-10 opacity-30 group-hover:opacity-50 transition"></div>
                </div>

                <div className="sticky top-14 z-40 backdrop-blur-sm p-2 shadow-md mb-2 no-print flex flex-col sm:flex-row justify-between items-center gap-2 transition-all duration-300 w-full" style={{ background: 'rgba(245, 230, 211, 0.95)', borderTop: '1px solid var(--vn-gold)', borderBottom: '1px solid var(--vn-gold)' }}>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded shadow-sm w-full sm:w-auto" style={{ color: 'var(--vn-dark-brown)', background: 'rgba(255, 255, 255, 0.9)', border: '1px solid var(--vn-gold)' }}>
                            <FileDigit size={14} style={{ color: 'var(--vn-red)' }} />
                            <span className="whitespace-nowrap">Khổ giấy:</span>
                            <select name="paperSize" value={formData.paperSize} onChange={handleChange} className="bg-transparent font-bold outline-none cursor-pointer flex-grow sm:flex-grow-0" style={{ color: 'var(--vn-red)' }}>{Object.entries(PAPER_SIZES).map(([key, size]) => (<option key={key} value={key}>{size.name}</option>))}</select>
                        </div>
                        {formData.paperSize === 'custom' && (<div className="flex items-center gap-1 bg-white px-2 py-1 rounded shadow-sm border text-xs"><Ruler size={14} className="text-orange-600" /><input type="number" name="customWidth" value={formData.customWidth} onChange={handleCustomSizeChange} className="w-12 border-b border-orange-300 outline-none text-center font-bold text-orange-700" placeholder="Rộng" /><span className="text-gray-400">x</span><input type="number" name="customHeight" value={formData.customHeight} onChange={handleCustomSizeChange} className="w-12 border-b border-orange-300 outline-none text-center font-bold text-orange-700" placeholder="Cao" /></div>)}
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto justify-end">

                        <button onClick={handleCopy} className="hover:opacity-90 px-3 py-1 rounded shadow-lg text-xs flex items-center gap-1 font-medium transition" style={{ background: 'linear-gradient(135deg, var(--vn-light-gold) 0%, var(--vn-gold) 100%)', color: 'var(--vn-dark-brown)', border: '1px solid var(--vn-red)' }}><Copy size={14} /> Sao chép</button>
                    </div>
                </div>

                <div id="printable-area" className="preview-wrapper px-2 pb-8 flex flex-col gap-8">
                    {(!previewData || previewData.length === 0) ? (
                        <div className="text-center py-12 text-gray-500 italic bg-white/50 rounded border border-dashed border-gray-300 mx-auto max-w-lg"><FileText size={48} className="mx-auto mb-2 opacity-30" /><p>Vui lòng nhập thông tin và nhấn nút "Tạo Sớ" để xem trước.</p></div>
                    ) : (
                        previewData.map((item, index) => (
                            <React.Fragment key={index}>
                                {index > 0 && (<div className="w-full h-px bg-gray-300 border-t border-dashed border-gray-400 my-4 no-print relative"><span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#e0d6c2] px-2 text-[10px] text-gray-500 font-bold uppercase">Hết sớ {index} - Sang sớ {index + 1}</span></div>)}
                                <div className="relative mx-auto transition-all duration-300" style={{ width: '100%', maxWidth: currentPaper.width }}>
                                    <div className="mb-2 text-left no-print"><span className="font-bold text-sm uppercase tracking-widest pb-1 inline-block" style={{ color: 'var(--vn-red)', borderBottom: '2px solid var(--vn-gold)' }}>{item.title}</span></div>
                                    <div className="print-page-break relative w-full" style={{ aspectRatio: currentPaper.aspectRatio, height: 'auto' }}>
                                        <div className="paper-bg text-black relative shadow-2xl overflow-hidden h-full w-full">

                                            <div className="h-full w-full p-0 flex flex-col items-center relative z-0">

                                                <div className="flex-1 w-full overflow-hidden font-sso leading-relaxed" style={{ fontSize: 'clamp(8px, 1.8cqi, 24px)' }}>
                                                    {renderSsoContent(item)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </React.Fragment>
                        ))
                    )}
                </div>

                {/* --- GLOBAL MODALS --- */}
                {/* Save Modal */}
                {showSaveModal && (
                    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 no-print backdrop-blur-sm">
                        <div className="rounded-lg shadow-2xl w-full max-w-md p-6 relative traditional-modal">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--vn-gold)] to-transparent opacity-50"></div>
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--vn-red)' }}><Save size={20} /> Lưu Sớ Hiện Tại</h3>
                            <input type="text" value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="Nhập tên gợi nhớ..." className="w-full border p-2 rounded mb-4 outline-none font-sso" style={{ background: 'rgba(255,255,255,0.8)', borderColor: 'var(--vn-gold)', color: 'var(--vn-dark-brown)' }} autoFocus />
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setShowSaveModal(false)} className="px-4 py-2 rounded hover:opacity-80 transition" style={{ color: 'var(--vn-dark-brown)', border: '1px solid var(--vn-gold)' }}>Hủy</button>
                                <button onClick={handleSave} className="px-4 py-2 text-white rounded shadow-lg hover:opacity-90 transition font-bold" style={{ background: 'linear-gradient(135deg, var(--vn-red) 0%, #6B0000 100%)', border: '1px solid var(--vn-gold)' }}>Lưu ngay</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Donate Modal */}
                {showDonateModal && (
                    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 no-print backdrop-blur-sm">
                        <div className="rounded-lg shadow-2xl p-6 relative max-w-sm w-full animate-in zoom-in duration-200 flex flex-col items-center traditional-modal">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--vn-gold)] to-transparent opacity-50"></div>
                            <button onClick={() => setShowDonateModal(false)} className="absolute top-2 right-2 hover:text-red-500" style={{ color: 'var(--vn-dark-brown)' }}><X size={24} /></button>
                            <h3 className="text-lg font-bold text-center mb-4 flex items-center gap-2" style={{ color: 'var(--vn-red)' }}><Coffee size={20} style={{ color: 'var(--vn-gold)' }} /> Mời tác giả ly cà phê</h3>
                            <div className="flex justify-center w-full p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid var(--vn-gold)' }}>
                                <img src="/donate.jpeg" alt="QR Code Donate" className="max-w-full h-auto rounded shadow-sm object-contain" style={{ maxHeight: '300px' }} />
                            </div>
                            <p className="text-center text-sm mt-4 italic font-sso" style={{ color: 'var(--vn-dark-brown)' }}>Cảm ơn tấm lòng của bạn!</p>
                        </div>
                    </div>
                )}

                {/* Saved Sớ List Modal */}
                {showLoadModal && (
                    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 no-print backdrop-blur-sm">
                        <div className="rounded-lg shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col traditional-modal">
                            <div className="p-4 border-b flex justify-between items-center rounded-t-lg" style={{ background: 'rgba(212, 175, 55, 0.1)', borderBottom: '1px solid var(--vn-gold)' }}>
                                <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--vn-red)' }}><FolderOpen size={20} /> Danh Sách Sớ Đã Lưu</h3>
                                <button onClick={() => setShowLoadModal(false)}><X className="hover:text-red-500" style={{ color: 'var(--vn-dark-brown)' }} /></button>
                            </div>
                            <div className="p-2 overflow-y-auto flex-1 relative">
                                {savedSos.length === 0 ? (<p className="text-center py-8 italic" style={{ color: 'var(--vn-dark-brown)' }}>Chưa có sớ nào được lưu.</p>) : (
                                    <div className="space-y-2">{savedSos.map(item => (<div key={item.id} className="flex items-center justify-between p-3 border rounded hover:shadow transition group" style={{ background: 'rgba(255,255,255,0.6)', borderColor: 'var(--vn-gold)' }}><div><div className="font-bold text-sm line-clamp-1" style={{ color: 'var(--vn-red)' }}>{item.name}</div><div className="text-[10px]" style={{ color: 'var(--vn-dark-brown)' }}>{new Date(item.createdAt).toLocaleString('vi-VN')}</div></div><div className="flex gap-2"><button onClick={() => triggerLoad(item)} className="p-2 rounded transition hover:bg-white" style={{ color: 'var(--vn-jade)' }} title="Mở sớ này"><Edit3 size={16} /></button><button onClick={() => triggerDelete(item)} className="p-2 hover:bg-red-50 rounded transition" style={{ color: 'var(--vn-red)' }} title="Xóa"><Trash2 size={16} /></button></div></div>))}</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Global Confirmation Modal */}
                {confirmAction && (
                    <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4 no-print backdrop-blur-sm">
                        <div className="rounded-lg shadow-2xl w-full max-w-sm p-6 animate-in zoom-in duration-200 relative traditional-modal">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--vn-gold)] to-transparent opacity-50"></div>
                            <div className="flex flex-col items-center text-center">
                                {confirmAction.type === 'reset' ? (
                                    <><div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(212, 175, 55, 0.2)', color: 'var(--vn-red)' }}><RotateCcw size={32} /></div><h4 className="text-lg font-bold mb-2" style={{ color: 'var(--vn-red)' }}>Làm mới dữ liệu?</h4><p className="mb-6 text-sm italic" style={{ color: 'var(--vn-dark-brown)' }}>Tất cả thông tin nhập liệu (Thành viên, Địa chỉ...) sẽ bị xóa trắng.</p></>
                                ) : (
                                    <><div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4`} style={{ background: confirmAction.type === 'delete' ? 'rgba(139, 0, 0, 0.1)' : 'rgba(0, 168, 107, 0.1)', color: confirmAction.type === 'delete' ? 'var(--vn-red)' : 'var(--vn-jade)' }}>{confirmAction.type === 'delete' ? <Trash2 size={32} /> : <FolderOpen size={32} />}</div><h4 className="text-lg font-bold mb-2" style={{ color: 'var(--vn-red)' }}>{confirmAction.type === 'delete' ? 'Xác nhận xóa sớ này?' : 'Tải lại sớ này?'}</h4><p className="mb-6 text-sm italic" style={{ color: 'var(--vn-dark-brown)' }}>"{confirmAction.item?.name}"{confirmAction.type === 'load' && <br />}{confirmAction.type === 'load' && "(Dữ liệu hiện tại trên màn hình sẽ bị thay thế)"}</p></>
                                )}
                                <div className="flex gap-3 w-full">
                                    <button onClick={() => setConfirmAction(null)} className="flex-1 py-2 border rounded hover:opacity-80 font-medium transition" style={{ borderColor: 'var(--vn-gold)', color: 'var(--vn-dark-brown)' }}>Hủy bỏ</button>
                                    <button onClick={executeAction} className={`flex-1 py-2 rounded text-white font-bold shadow hover:opacity-90 transition`} style={{ background: confirmAction.type === 'delete' ? 'var(--vn-red)' : confirmAction.type === 'reset' ? 'var(--vn-gold)' : 'var(--vn-jade)', color: confirmAction.type === 'reset' ? 'var(--vn-dark-brown)' : 'white' }}>{confirmAction.type === 'delete' ? 'Xóa vĩnh viễn' : confirmAction.type === 'reset' ? 'Đồng ý làm mới' : 'Đồng ý tải'}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <datalist id="title-options">
                    {TITLES.map(t => <option key={t} value={t} />)}
                </datalist>
            </main>
        </div>
    );
}