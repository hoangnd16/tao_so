import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Printer, Copy, FileText, Save, FolderOpen, X, ArrowDown, Settings, FileDigit, Ruler, Plus, Trash2, User, Calendar as CalendarIcon, ChevronUp, ChevronDown, Edit3, Check, AlertCircle, CheckSquare, Square, Play, RotateCcw, Coffee, PanelTopClose, PanelTopOpen } from 'lucide-react';

// --- CẤU HÌNH KHỔ GIẤY ---
const PAPER_SIZES = {
    a3: { name: 'A3 (420x297mm)', width: '420', height: '297', css: 'A3 landscape' },
    a4: { name: 'A4 (297x210mm)', width: '297', height: '210', css: 'A4 landscape' },
    a5: { name: 'A5 (210x148mm)', width: '210', height: '148', css: 'A5 landscape' },
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
        if (!dateString) return { d: 1, m: 1, y: 2024 };
        const date = new Date(dateString);
        try {
            const formatter = new Intl.DateTimeFormat('vi-VN-u-ca-chinese', {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric'
            });
            const parts = formatter.formatToParts(date);
            const d = parts.find(p => p.type === 'day').value;
            const m = parts.find(p => p.type === 'month').value;
            const y = date.getFullYear();
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

            // Columns from Right to Left based on the image
            const c0 = "\t\t\t\t\t\t\t\t\tPhục Dĩ"
            const c1 = "Phúc Thọ Khang Ninh Nãi Nhân Tâm Chi Cờ Nguyện Tai Ương Hạn Ách Bằng";
            const c2 = "Thánh Lực Dĩ Giải Trừ Nhất Niệm Chí Thành Thập Phương Cảm Cách \t\t\t Viên Hữu";
            const c3 = markBold(`Việt Nam Quốc ${data.address}`);
            const c4 = "Mõ Hạc Linh Từ Thượng Phụng \t\t\t\t Phật Thánh Hiến Cúng Lệnh Tiết \nTiến Lễ Cầu An Giải Hạn Tổng Ách Trừ Tai Tại Cờ Gia Nội Bình An Nhân Khang Vật Thịnh Duyên Sinh Trường Thọ Kim Thần";
            const c5 = markBold(`${generateMembersText(data.members)} Đồng Gia Quyền Đẳng ${data.userPrayer || ''}`);
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
            const c18 = `Thiên Vận ${data.year} \t\t\tNiên ${data.month} \t\tNguyệt ${data.day} \t\tNhật \t\t\tPhúc-Lộc-Thọ Cầu Bình An \t${markBold(firstMember.title || '')} ${markBold(firstMember.name || '')}`;

            // Combine columns (Note: The app renders lines from the string split by \n. 
            // If the app renders columns Right-to-Left, we should list them in that order? 
            // Actually App.jsx renders: lines.map(line => col). 
            // And CSS is: flex-direction: row-reverse.
            // So the first line in the string becomes the Rightmost column.

            // Logic tự động xuống dòng (thêm cột) cho c5 nếu dài hơn c8
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

            // Combine columns. c0 (Phục dĩ) and c1 (Phúc Thọ...) are combined into the first column (Rightmost)
            // Replace single c5 with ...c5Columns
            return [`${c0}\n${c1}`, c2, c3, c4, ...c5Columns, c7, c8, c9, c10, c11, c12, c13, c14, c15, c16, c17, c18].join('\n');
        }
    },
    dang_sao: {
        id: 'dang_sao',
        name: '2. Sớ Dâng Sao Giải Hạn',
        title: 'DÂNG SAO GIẢI HẠN SỚ',
        content: (data) => `Phục dĩ\nChí tâm\nbái lễ.\nViệt Nam Quốc,\n${data.address}\ncư phụng.\nKim thần\n${generateMembersText(data.members)}\nNgụ tại:\n${data.address}.\nThiết niệm:\nTín chủ\nnăm nay\nvận gặp sao\nchiếu mệnh.\nLo sợ\ntai ương,\nvận hạn\ntrắc trở,\nnay thành tâm\nsắm lễ,\nhương hoa\ntrà quả,\nkim ngân\nchỉ tiền.\nCung thỉnh:\nĐức Bắc Đẩu\nCửu Hàm\nGiải Ách\nTinh Quân.\nĐức\nTinh Quân\n(Vị tiền).\nĐương cai\nBản Mệnh\nThần Quân.\nKhấu đầu\nquy mệnh:\nCầu xin\ngiải trừ\nvận hạn,\ntống khứ\nhung tinh,\nnghinh đón\ncát khánh.\nCầu cho\nbản mệnh\nvững vàng,\ngia môn\nkhang thái,\nđắc tài\nđắc lộc.\n${data.userPrayer ? formatVerticalText(data.userPrayer) + '\n' : ''}Nguyện dốc\nlòng thành,\ncúi xin\nchứng giám.\nCẩn tấu.`
    },
    hinh_nhan: {
        id: 'hinh_nhan',
        name: '3. Sớ Hình Nhân',
        title: 'HÌNH NHÂN SỚ',
        content: (data) => {
            // Template này dành riêng cho từng người, nên data.members sẽ chỉ có 1 người
            const member = data.members[0] || {};

            // Helper to join array into newline-separated string (column)
            const col = (arr) => arr.join(' ');

            const c0 = "\t\t\t\t\t\t\t\tPhục Dĩ\n Lục Quần Lê Lâm Lâm Tư Biểu Kim Sao Anh Khí Chi Chung Linh Ngưỡng Lại Hồng Ân Chi Dục Tú Dục Cầu Nguyện Thọ Tu Hạ \n \t\t\tViên Hữu";
            const c1 = markBold(`Việt Nam Quốc ${data.address}`);
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
            const c15 = `Thiên Vận ${data.year} \t\t\t\t\t\tNiên ${data.month} Nguyệt ${data.day} \t\tNhật Thần Khấu Thủ Thượng Tấu \t\t\t Tiến Hình Hình Nhân`;

            return [c0, c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12, c13, c14, c15].join('\n');
        }
    },
    gia_tien: {
        id: 'gia_tien',
        name: '4. Sớ Gia Tiên',
        title: 'GIA TIÊN SỚ',
        content: (data) => `Phục dĩ\nChí tâm\nbái lễ.\nViệt Nam Quốc,\n${data.address}\ncư phụng.\nTu thiết\nlễ nghi,\ntạ ơn\nTiên Tổ,\ncầu an\nbản mệnh.\nKim thần\n${generateMembersText(data.members)}\nĐồng gia\nquyến đẳng.\nNay nhân\ntiết:\n${data.reason || 'Chính kỵ'},\ntín chủ\nchạnh lòng\nnhớ đức\ncù lao.\nCung duy:\nGia tiên\ndòng họ:\n....................\nCao Tằng\nTổ Khảo,\nCao Tằng\nTổ Tỷ.\nBá Thúc\nHuynh Đệ,\nCô Di\nTỷ Muội.\nNội ngoại\ngia tiên,\nđồng lai\nhâm hưởng.\nCúi xin:\nTổ tiên\nlinh thiêng\nchứng giám\nlòng thành.\nPhù hộ\nđộ trì\ncho con cháu:\nGià\nmạnh khỏe,\ntrẻ\nbình an.\nHọc hành\ntiến tới,\ncông tác\nhanh thông.\n${data.userPrayer ? formatVerticalText(data.userPrayer) + '\n' : ''}Cẩn tấu.`
    },
    le_phat: {
        id: 'le_phat',
        name: '5. Sớ Lễ Phật',
        title: 'LỄ PHẬT SỚ',
        content: (data) => `Phục dĩ\nPhật đức\ntừ bi,\ndĩ độ chúng.\nViệt Nam Quốc,\n${data.address}\ncư phụng.\nPhật Thánh\nhiến cúng,\ntiến lễ\ncầu an.\nKim thần\n${generateMembersText(data.members)}\nNgụ tại:\n${data.address}.\nNhất tâm\nthiện nguyện,\nhương hoa\nkim ngân\nthành tâm\nphụng hiến.\nCung duy:\nNam Mô\nThập Phương\nThường Trụ\nTam Bảo\nTác Đại\nChứng Minh.\nNam Mô\nSa Bà\nGiáo Chủ\nBản Sư\nThích Ca\nMâu Ni\nPhật.\nPhục nguyện:\nPhật nhật\ntăng huy,\nPháp luân\nthường chuyển.\nPhong điều\nvũ thuận,\nquốc thái\ndân an.\nTín chủ\ngia đình\nhưng thịnh,\nphúc thọ\nkhang ninh.\n${data.userPrayer ? formatVerticalText(data.userPrayer) + '\n' : ''}Cẩn tấu.`
    },
    le_mau: {
        id: 'le_mau',
        name: '6. Sớ Lễ Mẫu',
        title: 'THÁNH MẪU SỚ',
        content: (data) => `Phục dĩ\nMẫu đức\nbao la.\nViệt Nam Quốc,\n${data.address}\ncư phụng.\nKim thần\n${generateMembersText(data.members)}\nĐồng gia\nquyến đẳng.\nThiết lễ\nkính dâng\ncửa Mẫu.\nCung duy:\nTam Tòa\nThánh Mẫu,\nTứ Phủ\nVạn Linh\nCông Đồng.\nĐệ Nhất\nThượng Thiên\nThánh Mẫu.\nĐệ Nhị\nThượng Ngàn\nThánh Mẫu.\nĐệ Tam\nThoải Phủ\nThánh Mẫu.\nCúi xin:\nMẫu nghi\nthiên hạ,\ntừ bi\ntiếp độ.\nBan tài\ntiếp lộc,\ngiải bệnh\ntrừ tai.\nSở cầu\nnhư ý,\nsở nguyện\ntòng tâm.\n${data.userPrayer ? formatVerticalText(data.userPrayer) + '\n' : ''}Cẩn tấu.`
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
            { id: 1, title: 'Tín chủ', name: '', birthDay: 1, birthMonth: 1, birthYear: 1990, gender: 'male' }
        ],
        address: '',
        familyLine: '', reason: '',
        userPrayer: '',
        ceremonyDate: new Date().toISOString().split('T')[0],
        currentYear: new Date().getFullYear(),
        selectedTemplates: ['cau_an'],
        paperSize: 'a4',
        customWidth: 297,
        customHeight: 210
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

    const computedData = useMemo(() => {
        const year = LUNAR_UTILS.getCanChi(formData.currentYear);
        const members = formData.members.map(m => {
            const age = m.birthYear ? formData.currentYear - m.birthYear + 1 : 0;
            const tuvi = LUNAR_UTILS.getTuVi(age);
            return {
                ...m,
                age: age > 0 ? age : 0,
                canChi: LUNAR_UTILS.getCanChi(m.birthYear),
                sao: LUNAR_UTILS.getSao(age, m.gender),
                han: LUNAR_UTILS.getHan(age, m.gender),
                soTuVi: tuvi.so,
                saoTuVi: tuvi.sao
            };
        });
        const lunarDate = LUNAR_UTILS.convertSolarToLunar(formData.ceremonyDate);
        const yearCanChi = LUNAR_UTILS.getCanChi(lunarDate.y);
        return { ...formData, members, year: yearCanChi, day: lunarDate.d, month: lunarDate.m, lunarDateObj: lunarDate };
    }, [formData]);

    const handleCreateSo = () => {
        if (!formData.address.trim()) {
            showNotification("Vui lòng nhập địa chỉ!", 'error');
            return;
        }
        const emptyNameMember = formData.members.find(m => !m.name.trim());
        if (emptyNameMember) {
            showNotification("Vui lòng điền đầy đủ họ tên cho tất cả thành viên!", 'error');
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
        setFormData(prev => ({ ...prev, members: [...prev.members, { id: Date.now(), title: '', name: '', birthDay: 1, birthMonth: 1, birthYear: 1990, gender: 'female' }] }));
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
                members: [{ id: Date.now(), title: 'Tín chủ', name: '', birthDay: 1, birthMonth: 1, birthYear: 1990, gender: 'male' }],
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
        const fontSize = Math.min(100 / totalFr, 100 / item.rows * 1.4) * 0.25; // Hệ số 0.25 để đảm bảo vừa vặn

        return (
            <div className="sso-container relative" style={{
                display: 'grid',
                // Cột cuối cùng (bên trái trong RTL) gấp đôi kích thước
                gridTemplateColumns: `repeat(${item.cols - 1}, 1fr) 2fr`,
                gridTemplateRows: `repeat(${item.rows}, 1fr)`,
                width: '100%',
                height: '100%',
                direction: 'rtl',
                padding: '0',
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
                            borderLeft: '1px solid #ccc' // Viền giữa các cột
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
        <div className="min-h-screen font-sans text-gray-800 bg-[#e0d6c2]">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Noto+Serif:ital,wght@0,400;0,700;1,400&family=Playfair+Display:wght@600&display=swap');
                .font-sso { font-family: 'Noto Serif', serif; }
                .font-header { font-family: 'Playfair Display', serif; }
                .paper-bg { 
                    background-color: #fffdf0; 
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1); 
                    background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E"); 
                    container-type: size; 
                }
                .fancy-border { border: 10px solid transparent; padding: 30px; border-image: url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h30v30H0z' fill='none'/%3E%3Cpath d='M2 2h26v26H2z' stroke='%23B91C1C' stroke-width='2' fill='none'/%3E%3Cpath d='M5 5h20v20H5z' stroke='%23D97706' stroke-width='1' fill='none'/%3E%3C/svg>") 30 stretch; }
                
                .excel-input { border: 1px solid #d1d5db; border-radius: 2px; padding: 2px 4px; width: 100%; font-size: 12px; transition: all 0.2s; }
                .excel-input:not(textarea) { height: 24px; }
                .excel-input:focus { border-color: #b91c1c; outline: none; box-shadow: 0 0 0 1px rgba(185, 28, 28, 0.2); }
                .excel-label { font-size: 10px; font-weight: 700; color: #4b5563; margin-bottom: 1px; display: block; text-transform: uppercase; }
                .preview-wrapper { container-type: inline-size; width: 100%; }
                


                @media print {
                    @page { size: ${currentPaper.css}; margin: 0; }
                    body * { visibility: hidden; }
                    #printable-area, #printable-area * { visibility: visible; }
                    #printable-area { position: absolute; left: 0; top: 0; width: 100%; height: auto !important; margin: 0; padding: 0; background-color: white !important; max-width: none !important; aspect-ratio: auto !important; }
                    .print-page-break { break-after: page; }
                    .print-page-break:last-child { break-after: auto; }
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
                <div className="bg-white border-b-2 border-red-800 w-full">
                    <div className="w-full px-2 py-2">
                        <div className="flex flex-col md:flex-row justify-between items-center">
                            <h1 className="text-lg md:text-xl font-bold text-red-800 font-header flex items-center gap-2"><FileText className="w-5 h-5 md:w-6 md:h-6" /> SOẠN SỚ CHUYÊN NGHIỆP</h1>
                            <div className="flex gap-2 items-center mt-1 md:mt-0">
                                <button onClick={() => setShowDonateModal(true)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow transition"><Coffee size={12} /> Donate a coffee</button>
                                <button onClick={() => setShowLoadModal(true)} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow transition"><FolderOpen size={12} /> Sớ đã lưu ({savedSos.length})</button>
                                <button onClick={openSaveModal} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow transition"><Save size={12} /> Lưu sớ</button>
                                <button onClick={handlePrint} className="bg-gray-800 hover:bg-gray-900 text-white px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow transition"><Printer size={12} /> In ngay</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="w-full p-0 pt-0">
                <div className={`transition-all duration-500 w-full ${isInputVisible ? 'opacity-100 max-h-[2000px] overflow-visible' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                    <div className="bg-white p-2 border-b border-gray-200 mb-0 no-print">
                        <div className="bg-blue-50 p-1 rounded border border-blue-200 mb-2 shadow-sm">
                            <div className="flex justify-between items-center mb-1 border-b border-blue-200 pb-1 px-1">
                                <h3 className="text-blue-800 text-xs font-bold flex items-center gap-1"><User size={14} /> NHẬP LIỆU GIA ĐÌNH</h3>
                                <button onClick={addMember} className="bg-green-600 hover:bg-green-700 text-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition shadow"><Plus size={10} /> Thêm người</button>
                            </div>
                            <div className="max-h-40 overflow-y-auto pr-1">
                                <div className="grid grid-cols-12 gap-1 mb-1 text-[10px] font-bold text-gray-500 px-1 text-center hidden md:grid">
                                    <div className="col-span-1 text-left">DANH XƯNG</div>
                                    <div className="col-span-3 text-left">HỌ VÀ TÊN</div>
                                    <div className="col-span-1">GIỚI</div>
                                    <div className="col-span-2">NGÀY SINH</div>
                                    <div className="col-span-1">NĂM ÂM</div>
                                    <div className="col-span-1">TUỔI</div>
                                    <div className="col-span-1">SAO</div>
                                    <div className="col-span-1">HẠN</div>
                                    <div className="col-span-1 text-left">SỞ/SAO(TV)</div>
                                </div>
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
                                        <div className="col-span-8 md:col-span-2 flex gap-1">
                                            <div className="flex-1"><label className="block md:hidden text-[10px] font-bold text-gray-500 uppercase mb-0.5">Ngày</label><input type="number" placeholder="Ng" value={member.birthDay} onChange={(e) => handleMemberChange(member.id, 'birthDay', e.target.value)} className="excel-input text-center px-0 w-full h-8 md:h-6" min="1" max="31" /></div>
                                            <div className="flex-1"><label className="block md:hidden text-[10px] font-bold text-gray-500 uppercase mb-0.5">Tháng</label><input type="number" placeholder="Th" value={member.birthMonth} onChange={(e) => handleMemberChange(member.id, 'birthMonth', e.target.value)} className="excel-input text-center px-0 w-full h-8 md:h-6" min="1" max="12" /></div>
                                            <div className="flex-[1.5]"><label className="block md:hidden text-[10px] font-bold text-gray-500 uppercase mb-0.5">Năm</label><input type="number" placeholder="Năm" value={member.birthYear} onChange={(e) => handleMemberChange(member.id, 'birthYear', e.target.value)} className="excel-input text-center px-0 w-full font-medium h-8 md:h-6" /></div>
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
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 w-full flex flex-col gap-3">
                                <div className="flex-grow flex flex-col">
                                    <label className="excel-label mb-1 ml-1">Địa chỉ</label>
                                    <textarea name="address" value={formData.address} onChange={handleChange} className="excel-input w-full resize-none text-sm flex-grow border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded transition-shadow" placeholder="Nhập đầy đủ địa chỉ..." style={{ minHeight: '88px' }} />
                                </div>
                                <div className="grid grid-cols-12 gap-2 h-10">
                                    <div className="col-span-7 flex items-center border border-gray-300 rounded px-2 bg-white h-full">
                                        <CalendarIcon size={16} className="text-blue-600 flex-shrink-0 mr-1" />
                                        <span className="text-xs font-bold text-gray-600 whitespace-nowrap mr-1">Ngày lễ</span>
                                        <input type="date" name="ceremonyDate" value={formData.ceremonyDate} onChange={handleChange} className="flex-grow outline-none text-blue-800 font-bold text-sm bg-transparent text-right w-full min-w-0" />
                                    </div>
                                    <div className="col-span-5 h-full px-1 bg-purple-50 border border-purple-200 rounded flex items-center justify-center gap-1 whitespace-nowrap overflow-hidden">
                                        <span className="text-sm font-bold text-purple-700">{computedData.day}/{computedData.month}</span>
                                        <span className="text-xs font-bold text-purple-600">({computedData.year})</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 w-full relative flex flex-col gap-3">
                                <h3 className="text-yellow-800 text-[10px] font-bold uppercase ml-1">Nội Dung Sớ (Có thể chọn nhiều)</h3>
                                <div ref={templateDropdownRef} className="relative">
                                    <button onClick={() => setIsTemplateDropdownOpen(!isTemplateDropdownOpen)} className="excel-input font-bold text-red-700 border-red-200 text-left flex items-center justify-between w-full bg-white h-9 rounded hover:border-red-300 transition-colors"><span className="truncate">{getSelectedTemplatesLabel()}</span><ChevronDown size={14} className="text-gray-500" /></button>
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
                                {formData.selectedTemplates?.includes('gia_tien') && (<input type="text" name="familyLine" value={formData.familyLine} onChange={handleChange} placeholder="Dòng họ (VD: Nguyễn Văn)..." className="excel-input animate-in fade-in h-9 rounded border-yellow-300 focus:border-yellow-500" />)}
                                <textarea name="userPrayer" value={formData.userPrayer} onChange={handleChange} placeholder="Nhập lời cầu nguyện riêng (nếu có)..." className="excel-input w-full resize-none border-yellow-300 focus:border-yellow-500 bg-white flex-grow rounded" style={{ minHeight: '80px' }} />
                                <div className="mt-auto flex gap-2">
                                    <button onClick={triggerReset} className="bg-white hover:bg-gray-50 text-gray-500 font-bold py-2 px-3 rounded shadow-sm flex items-center justify-center gap-1 transition-all text-xs uppercase tracking-wide border border-gray-200 h-9 hover:border-red-200 hover:text-red-500" title="Xóa hết thông tin nhập"><RotateCcw size={14} /></button>
                                    <button onClick={handleCreateSo} className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-2 px-4 rounded shadow-sm flex items-center justify-center gap-2 transition-all text-xs uppercase tracking-wide h-9 transform active:scale-[0.98]"><Play size={14} fill="currentColor" /> Tạo Sớ</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`flex justify-center mb-4 relative z-[60] no-print group transition-all duration-300 ${isInputVisible ? 'mt-2' : 'mt-0'}`}>
                    <button onClick={() => setIsInputVisible(!isInputVisible)} className="bg-white hover:bg-red-50 text-gray-500 hover:text-red-700 border border-gray-200 px-4 py-1.5 rounded-full shadow-sm text-xs font-bold flex items-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0">{isInputVisible ? <><PanelTopClose size={14} /> THU GỌN</> : <><PanelTopOpen size={14} /> MỞ RỘNG</>}</button>
                    <div className="absolute top-1/2 left-0 w-full h-px bg-gray-300 -z-10 opacity-30 group-hover:opacity-50 transition"></div>
                </div>

                <div className="sticky top-14 z-40 bg-[#e0d6c2]/95 backdrop-blur-sm border-y border-white/50 p-2 shadow-md mb-2 no-print flex flex-col sm:flex-row justify-between items-center gap-2 transition-all duration-300 w-full">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="flex items-center gap-1 text-xs font-medium text-gray-700 bg-white px-2 py-1 rounded shadow-sm border w-full sm:w-auto">
                            <FileDigit size={14} className="text-indigo-600" />
                            <span className="whitespace-nowrap">Khổ giấy:</span>
                            <select name="paperSize" value={formData.paperSize} onChange={handleChange} className="bg-transparent font-bold text-indigo-700 outline-none cursor-pointer flex-grow sm:flex-grow-0">{Object.entries(PAPER_SIZES).map(([key, size]) => (<option key={key} value={key}>{size.name}</option>))}</select>
                        </div>
                        {formData.paperSize === 'custom' && (<div className="flex items-center gap-1 bg-white px-2 py-1 rounded shadow-sm border text-xs"><Ruler size={14} className="text-orange-600" /><input type="number" name="customWidth" value={formData.customWidth} onChange={handleCustomSizeChange} className="w-12 border-b border-orange-300 outline-none text-center font-bold text-orange-700" placeholder="Rộng" /><span className="text-gray-400">x</span><input type="number" name="customHeight" value={formData.customHeight} onChange={handleCustomSizeChange} className="w-12 border-b border-orange-300 outline-none text-center font-bold text-orange-700" placeholder="Cao" /></div>)}
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto justify-end">

                        <button onClick={handleCopy} className="bg-white hover:bg-gray-100 hover:text-gray-900 text-gray-600 border border-gray-200 px-3 py-1 rounded shadow-sm text-xs flex items-center gap-1 font-medium transition"><Copy size={14} /> Sao chép</button>
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
                                    <div className="mb-2 text-left no-print"><span className="text-red-800 font-bold text-sm uppercase tracking-widest border-b-2 border-red-800 pb-1 inline-block">{item.title}</span></div>
                                    <div className="print-page-break relative w-full" style={{ aspectRatio: currentPaper.aspectRatio, height: 'auto' }}>
                                        <div className="paper-bg text-black relative shadow-2xl overflow-hidden h-full w-full">

                                            <div className="h-full w-full p-0 flex flex-col items-center relative z-0">
                                                <div className="text-center mb-2 w-full pb-2"></div>
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
                    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 no-print backdrop-blur-sm">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                            <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2"><Save size={20} /> Lưu Sớ Hiện Tại</h3>
                            <input type="text" value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="Nhập tên gợi nhớ..." className="w-full border p-2 rounded mb-4 focus:ring-2 focus:ring-blue-500 outline-none" autoFocus />
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setShowSaveModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Hủy</button>
                                <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Lưu ngay</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Donate Modal */}
                {showDonateModal && (
                    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 no-print backdrop-blur-sm">
                        <div className="bg-white rounded-lg shadow-xl p-6 relative max-w-sm w-full animate-in zoom-in duration-200 flex flex-col items-center">
                            <button onClick={() => setShowDonateModal(false)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X size={24} /></button>
                            <h3 className="text-lg font-bold text-center mb-4 text-gray-800 flex items-center gap-2"><Coffee size={20} className="text-yellow-600" /> Mời tác giả ly cà phê</h3>
                            <div className="flex justify-center w-full bg-gray-50 p-2 rounded-lg border border-gray-100">
                                <img src="/image_1b419f.jpg" alt="QR Code Donate" className="max-w-full h-auto rounded shadow-sm object-contain" style={{ maxHeight: '300px' }} />
                            </div>
                            <p className="text-center text-sm text-gray-500 mt-4 italic">Cảm ơn tấm lòng của bạn!</p>
                        </div>
                    </div>
                )}

                {/* Saved Sớ List Modal */}
                {showLoadModal && (
                    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 no-print backdrop-blur-sm">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
                            <div className="p-4 border-b flex justify-between items-center bg-indigo-50 rounded-t-lg">
                                <h3 className="text-lg font-bold text-indigo-800 flex items-center gap-2"><FolderOpen size={20} /> Danh Sách Sớ Đã Lưu</h3>
                                <button onClick={() => setShowLoadModal(false)}><X className="text-gray-400 hover:text-red-500" /></button>
                            </div>
                            <div className="p-2 overflow-y-auto flex-1 relative">
                                {savedSos.length === 0 ? (<p className="text-center text-gray-500 py-8">Chưa có sớ nào được lưu.</p>) : (
                                    <div className="space-y-2">{savedSos.map(item => (<div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 border rounded hover:bg-white hover:shadow transition group"><div><div className="font-bold text-gray-800 text-sm line-clamp-1">{item.name}</div><div className="text-[10px] text-gray-500">{new Date(item.createdAt).toLocaleString('vi-VN')}</div></div><div className="flex gap-2"><button onClick={() => triggerLoad(item)} className="p-2 text-blue-600 hover:bg-blue-100 rounded transition" title="Mở sớ này"><Edit3 size={16} /></button><button onClick={() => triggerDelete(item)} className="p-2 text-red-500 hover:bg-red-100 rounded transition" title="Xóa"><Trash2 size={16} /></button></div></div>))}</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Global Confirmation Modal */}
                {confirmAction && (
                    <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4 no-print backdrop-blur-sm">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 animate-in zoom-in duration-200">
                            <div className="flex flex-col items-center text-center">
                                {confirmAction.type === 'reset' ? (
                                    <><div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-orange-100 text-orange-600"><RotateCcw size={32} /></div><h4 className="text-lg font-bold mb-2 text-gray-800">Làm mới dữ liệu?</h4><p className="text-gray-500 mb-6 text-sm">Tất cả thông tin nhập liệu (Thành viên, Địa chỉ...) sẽ bị xóa trắng.</p></>
                                ) : (
                                    <><div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${confirmAction.type === 'delete' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>{confirmAction.type === 'delete' ? <Trash2 size={32} /> : <FolderOpen size={32} />}</div><h4 className="text-lg font-bold mb-2 text-gray-800">{confirmAction.type === 'delete' ? 'Xác nhận xóa sớ này?' : 'Tải lại sớ này?'}</h4><p className="text-gray-500 mb-6 text-sm">"{confirmAction.item?.name}"{confirmAction.type === 'load' && <br />}{confirmAction.type === 'load' && "(Dữ liệu hiện tại trên màn hình sẽ bị thay thế)"}</p></>
                                )}
                                <div className="flex gap-3 w-full">
                                    <button onClick={() => setConfirmAction(null)} className="flex-1 py-2 border rounded hover:bg-gray-50 font-medium text-gray-600">Hủy bỏ</button>
                                    <button onClick={executeAction} className={`flex-1 py-2 rounded text-white font-bold shadow ${confirmAction.type === 'delete' ? 'bg-red-600 hover:bg-red-700' : confirmAction.type === 'reset' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}>{confirmAction.type === 'delete' ? 'Xóa vĩnh viễn' : confirmAction.type === 'reset' ? 'Đồng ý làm mới' : 'Đồng ý tải'}</button>
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