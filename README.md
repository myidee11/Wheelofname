# 🎡 Classroom Wheel of Names (วงล้อสุ่มชื่อนักเรียน)

เว็บแอปพลิเคชันวงล้อสุ่มชื่อนักเรียน โทนสีพาสเทลสวยงาม ออกแบบพิเศษสำหรับคุณครูและกิจกรรมในห้องเรียน **ไม่มีโฆษณา 100%** โหลดเร็ว ลื่นไหล พร้อมระบบเสียงสังเคราะห์และพลุกระดาษเฉลิมฉลอง

![Wheel of Names](https://img.shields.io/badge/Status-Production%20Ready-brightgreen?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)
![No Ads](https://img.shields.io/badge/Ads-Free-purple?style=flat-square)

---

## ✨ คุณสมบัติเด่น (Features)

### 🎡 1. วงล้อฟิสิกส์สมจริง (Realistic Physics Wheel)
- เรนเดอร์ด้วย **HTML5 Canvas 2D (HiDPI / Retina Crisp)** ตัวหนังสือภาษาไทยคมชัด ไม่เบลอ
- แอนิเมชันการหมุนผ่อนแรงแบบธรรมชาติ พร้อมเข็มชี้ (Ticker Pointer) กระดิกตามจังหวะช่อง
- เสียงหมุนติ๊กๆ (Ticker Sound) และเสียงเฉลิมฉลอง (Fanfare) ผ่าน **Web Audio API** (ไม่ต้องพึ่งพาไฟล์เสียงภายนอก ทำงานออฟไลน์ได้ 100%)
- อ่านออกเสียงชื่อผู้ชนะภาษาไทยอัตโนมัติผ่าน **Web Speech API** (Text-to-Speech)
- โทนสีพาสเทลให้เลือกถึง 4 สไตล์: Pastel Rainbow, Candy Sweet, Mint & Peach, Sakura Lilac

### 🏫 2. ระบบจัดการห้องเรียนและรายชื่อ (Classroom Management)
- บันทึกและสลับห้องเรียนได้ไม่จำกัด (เช่น ม.1/1, ม.1/2, กลุ่มทดลอง)
- คัดลอกและวางรายชื่อทั้งหมดลงในช่องข้อความได้ทันที (Copy-paste จาก Excel / Word)
- ฟังก์ชัน **สลับตำแหน่ง (Shuffle)**, **เรียงลำดับ ก-ฮ / A-Z (Sort)**, และ **ล้างรายชื่อ (Clear)**
- บันทึกข้อมูลอัตโนมัติในเบราว์เซอร์ (`localStorage`) รีเฟรชหน้าเว็บข้อมูลไม่หาย

### 👥 3. เครื่องมือสุ่มจัดกลุ่มนักเรียน (Group / Team Generator)
- สุ่มแบ่งกลุ่มนักเรียนในห้องได้ 2 โหมด:
  - กำหนดจำนวนกลุ่มที่ต้องการ (เช่น แบ่งเป็น 4 กลุ่ม)
  - กำหนดจำนวนคนต่อกลุ่ม (เช่น จัดกลุ่มละ 5 คน)
- ปุ่ม **คัดลอกผลลัพธ์ (Copy)** นำไปวางในแชทหรือเอกสารได้ทันที

### 📺 4. โหมดเต็มจอสำหรับโปรเจกเตอร์ (Fullscreen Presentation)
- ปุ่มกดขยายเต็มหน้าจอ เพื่อฉายบนจอโปรเจกเตอร์ หรือ SmartBoard ในห้องเรียนได้อย่างชัดเจน
- รองรับการกดปุ่ม **Spacebar** บนคีย์บอร์ดเพื่อสั่งหมุนวงล้อได้อย่างสะดวกรวดเร็ว

---

## 🚀 การ Deploy ขึ้น Vercel

โครงการนี้เขียนด้วย Pure HTML5, CSS3, JavaScript (Static Web App) สามารถ Deploy บน Vercel ได้ทันทีโดยไม่ต้อง Build:

1. นำ Repository นี้เชื่อมต่อกับบัญชี Vercel ของคุณ
2. ที่หน้า New Project บน Vercel เลือก Repository `Wheelofname`
3. กดปุ่ม **Deploy** ได้ทันที (Vercel จะตรวจจับ `vercel.json` และ `index.html` อัตโนมัติ)

---

## 💻 การทดสอบและเปิดใช้งานในเครื่อง (Local Run)

เปิดไฟล์ `index.html` บนเบราว์เซอร์ (Chrome, Edge, Firefox, Safari) ได้ทันที หรือรัน Live Server:

```bash
# ตัวอย่างการรันด้วย Python
python -m http.server 8000

# หรือเปิด index.html โดยตรง
```

---

## 🛠️ สถาปัตยกรรมไฟล์ (Project Structure)

```
├── index.html              # หน้าเว็บหลัก
├── css/
│   └── style.css           # ดีไซน์ระบบ UI โทนสีพาสเทลและ Responsive
├── js/
│   ├── audio.js            # ระบบสร้างเสียงเอฟเฟกต์ Web Audio API & TTS
│   ├── confetti.js         # ระบบอนุภาคพลุกระดาษ Canvas Confetti
│   ├── wheel.js            # Canvas Wheel Engine พร้อมฟิสิกส์และการวาดตัวอักษรไทย
│   └── app.js              # State management, LocalStorage, Group generator, UI Controller
├── vercel.json             # การตั้งค่าสำหรับ Vercel
├── .gitignore              # ไฟล์ยกเว้นสำหรับ Git
└── README.md               # เอกสารคู่มือ
```

---

## 📄 License
MIT License - ใช้งานและพัฒนาต่อได้อย่างอิสระเพื่อการศึกษา
