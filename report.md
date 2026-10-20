# Dogfood QA Report

**Target:** https://smart-dental-system-frontend-patien.vercel.app/home
**Date:** 2026-10-09
**Scope:** Public (logged-out) patient frontend: home, services, doctors, promotions, legal pages, auth pages, login-gated pages, search, floating chat widgets (opened only). Desktop 1440x900 and mobile 390x844.
**Tester:** Hermes Agent (automated exploratory QA)



---

## Issues

### Issue #1: Login form ships with a demo patient's credentials prefilled

| Field | Value |
|-------|-------|
| **Severity** | High (Critical if real patients use this deployment) |
| **Category** | Functional / Security |
| **URL** | /auth/login |

**Description:**
The server-rendered HTML of `/auth/login` contains `value="patient01@smartdental.test"` on the email input and a hardcoded password in the `value` attribute of the password input, so the password shows up in view-source. Anyone who opens the login page, including users redirected there from `/consultation`, can click "Đăng nhập ngay" and be logged in as the patient "Nguyễn Văn An" (`POST /api/v1/auth/login -> 201`).

**Steps to Reproduce:**
1. Open https://smart-dental-system-frontend-patien.vercel.app/auth/login
2. Don't type anything. Click "Đăng nhập ngay".
3. The header now shows "Xin chào Nguyễn Văn An" with 4 notifications.

**Expected Behavior:** Both fields start empty. No credentials appear in the shipped HTML or JS.

**Actual Behavior:** Both fields are prefilled, and one click logs into a shared patient account. A real patient could then book appointments or enter health data in someone else's account.

**Suggested fix:** Remove the default values. If a demo login is needed, show a separate "Dùng tài khoản demo" button only when an env flag (e.g. `NEXT_PUBLIC_DEMO_MODE=true`) is set.

**Screenshot:** screenshots/login-prefilled.png

**Tester note:** My empty-submit validation check triggered this login once. I logged out right away and didn't open any account pages.

---

### Issue #2: Footer "Hỗ trợ" link is a 404, and the 404 page is the bare Next.js default

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Category** | Functional |
| **URL** | /contact |

**Steps to Reproduce:**
1. On any page, click "Hỗ trợ" in the footer.

**Expected Behavior:** A support or contact page.

**Actual Behavior:** The English "404 / This page could not be found." page, with no header, footer or link back to the home page. Unknown routes show the same page.

**Suggested fix:** Add `app/contact/page.tsx` or point the link at an existing page. Add a Vietnamese `app/not-found.tsx` that uses the site layout.

**Screenshot:** screenshots/contact-404.png

---

### Issue #3: "Tư vấn" sends guests to the login page and loses their destination

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Category** | UX |
| **URL** | /consultation (also the floating "Tư vấn trực tiếp với lễ tân" button) |

**Description:**
For guests, `/consultation` calls `GET /api/v1/video-consultations/consultation-doctors` and `/packages`. Both return 401, the token refresh also returns 401, and the client then redirects to `/auth/login` with no `?redirect=` parameter. The other gated pages (`/appointment`, `/records`, `/profile`) instead show a "CẦN ĐĂNG NHẬP" card whose button links to `/auth/login?redirect=...`. "Tư vấn" is both a top-nav item and the centre tab of the mobile bottom bar.

**Steps to Reproduce:**
1. While logged out, click "Tư vấn" in the header.

**Expected Behavior:** The same login-required card as the other gated pages (or a public list of doctors and packages), and a return to `/consultation` after login.

**Actual Behavior:** A hard redirect to `/auth/login`. After logging in, the user lands on `/home`.

---

### Issue #4: Inactive promotion is still listed and can be booked from its detail page

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Category** | Functional |
| **URL** | /promotions and the detail page of "Điều Trị Tủy Không Đau Giảm 20%" |

**Description:**
The public `GET /api/v1/promotions` returns `DIEUTRITUY20` with `is_active: false`. The list shows it like the other promotions; the only difference is a greyed-out "Sao chép mã" button with no explanation. Its detail page shows "Hiệu lực: 23/09/2026 - 12/11/2026" and an enabled "Đặt lịch dùng mã" button.

**Expected Behavior:** Inactive promotions are filtered out on the server, or they carry a clear "Tạm ngưng" label and booking with them is disabled.

**Actual Behavior:** The promotion looks valid on its detail page and invites the user to book with the code.

**Screenshot:** screenshots/promotions-list.png (top-left card)

---

### Issue #5: Advertised prices don't match the service catalog

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Category** | Content |
| **URL** | /home, /promotions |

**Description:**
- The hero banner says "NHỔ RĂNG KHÔN CHỈ TỪ 499K". The cheapest wisdom-tooth method in the catalog is "Nhổ răng khôn hàm trên" at 1.500.000đ. Promo NHORANG500K requires an order of at least 2.000.000đ, so the lowest price a patient can actually get is 2.000.000đ.
- The promo "Lấy Cao Răng Siêu Âm Chỉ Từ 99K": scaling costs 250.000đ and the discount is 150.000đ, so the real price is 100.000đ.
- The home promo tiles "10% Giảm phí dịch vụ" and "Đặc quyền thành viên & Thẻ VIP Gold" don't match any promotion returned by the API.

Patients check prices first, and price claims in medical-service advertising are regulated in Vietnam.

---

### Issue #6: Placeholder/template content and unverifiable trust claims

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Category** | Content |
| **URL** | /home, /service, /promotions, footer |

**Description:**
- Several service images carry another clinic's branding and dummy contact details: "NHA KHOA UY TÍN", nhakhoauytin.vn, "Hotline: 1900 xxxx", "123 Đường ABC, Quận XYZ, TP.HCM", "0912 345 678".
- The "Bọc răng sứ kim loại Titan" image has a stock-template "IMAGE NOT INCLUDED" strip.
- The banner of the "Điều trị tủy" promotion shows "1900 xxxx | nhakhoatrang.vn".
- The trust bar shows "Bộ Y Tế – GIẤY PHÉP 0123/BYT", "Top 10 Nha Khoa – Giải thưởng 2026" and "ISO 9001:2015".
- The footer shows "123 Nguyen Van Linh, Da Nang", hotline "1900 1234" and contact@smartdental.com, a domain the project probably doesn't own.

A fake Ministry of Health licence number is the riskiest item here.

**Screenshot:** screenshots/placeholder-images-cards.png

---

### Issue #7: "Most booked" ranking shows 0 bookings on every card

| Field | Value |
|-------|-------|
| **Severity** | Low |
| **Category** | Content |
| **URL** | /home |

The section "Dịch vụ được đặt nhiều nhất" says it is "Tự động xếp hạng theo số lượt đặt lịch thực tế trong hệ thống", but every card shows "0 lượt đặt". Meanwhile the promotions show usage such as 142/300 and the trust bar claims "10K+ Khách hàng". Either feed in the real booking counts or hide the count.

**Screenshot:** screenshots/home-scroll-1.png

---

### Issue #8: Symptom search mostly returns nothing

| Field | Value |
|-------|-------|
| **Severity** | Low |
| **Category** | Functional |
| **URL** | Home search -> /service?keyword=... |

The placeholder promises "Tìm kiếm theo dịch vụ, bác sĩ, triệu chứng", but matching only finds the whole phrase as a contiguous substring:
- "răng mọc lệch" doesn't match "Nhổ răng khôn hàm dưới mọc lệch/ngầm".
- "ê buốt", "hôi miệng", "chảy máu chân răng" and "răng thưa" all return "Không tìm thấy dịch vụ hoặc bác sĩ".

Two things already work: accent-insensitive matching ("rang khon" finds wisdom-tooth extraction) and routing doctor names to `/doctor?keyword=`.

**Suggested fix:** Match on individual tokens (all or most tokens present), and add a small map from symptoms to services.

---

### Issue #9: SEO and metadata gaps

| Field | Value |
|-------|-------|
| **Severity** | Low |
| **Category** | Content |
| **URL** | Site-wide |

- `/home` has no `<h1>`.
- `/appointment`, `/consultation`, `/service`, `/doctor`, `/profile`, `/auth/*` and the 404 page all share the generic title "Smart Dental System".
- The brand name appears twice in some titles, e.g. "Ưu Đãi & Khuyến Mãi Nha Khoa | Smart Dental | Smart Dental System" and "Chính sách bảo mật - Smart Dental System | Smart Dental System". The title template appends the brand to titles that already contain it.
- Service detail pages are titled "Chi tiết dịch vụ | ..." instead of the service name.
- The stats counters render as "0K+ / 0+ / 0+" in the server HTML until the count-up animation runs.

---

### Issue #10: Filter inputs have no accessible labels

| Field | Value |
|-------|-------|
| **Severity** | Low |
| **Category** | Accessibility |
| **URL** | /doctor, /promotions |

On `/doctor`, the "DỊCH VỤ NHA KHOA" select and the "TÊN BÁC SĨ" input aren't associated with their visible labels (no `for`/`id` pairing and no `aria-label`). The `/promotions` search input has no label either.

---

### Issue #11: Visual polish

| Field | Value |
|-------|-------|
| **Severity** | Low |
| **Category** | Visual |
| **URL** | /doctor, /promotions, mobile /home |

- `/doctor`: the blue circle behind each doctor photo is cut off by a hard vertical edge on its left side and at the bottom (screenshots/doctor-cards-clipped.png).
- `/promotions`: the discount badge covers the title text printed on the banner images, e.g. "GIẢM 500.000Đ" over "...NG KHÔNG ĐAU".
- Mobile (390px): the hero reuses the desktop banner, so its text ("30%", "499K") is too small to read (screenshots/mobile-home-combined.png).

---

### Issue #12: Footer text is missing Vietnamese diacritics

| Field | Value |
|-------|-------|
| **Severity** | Low |
| **Category** | Content |
| **URL** | Footer, site-wide |

"Thu Hai - Thu Sau", "Thu Bay" and "123 Nguyen Van Linh, Da Nang" should read "Thứ Hai – Thứ Sáu", "Thứ Bảy" and "Nguyễn Văn Linh, Đà Nẵng". The text probably comes from the clinic-config data.

---

## Issues Summary Table

| # | Title | Severity | Category | URL |
|---|-------|----------|----------|-----|
| 1 | Login form prefilled with demo patient credentials | High | Functional/Security | /auth/login |
| 2 | "Hỗ trợ" footer link 404; default English 404 page | Medium | Functional | /contact |
| 3 | "Tư vấn" redirects guests to login without return path | Medium | UX | /consultation |
| 4 | Inactive promotion listed and bookable from detail page | Medium | Functional | /promotions |
| 5 | Advertised prices don't match the catalog | Medium | Content | /home, /promotions |
| 6 | Placeholder images, dummy contacts, fake licence number | Medium | Content | /home, /service, footer |
| 7 | "Most booked" shows 0 bookings everywhere | Low | Content | /home |
| 8 | Symptom / multi-word search returns nothing | Low | Functional | /service?keyword= |
| 9 | Missing h1, generic or duplicated page titles | Low | Content | site-wide |
| 10 | Unlabeled filter inputs | Low | Accessibility | /doctor, /promotions |
| 11 | Clipped doctor photo backdrop, badge overlap, tiny mobile hero text | Low | Visual | /doctor, /promotions, mobile |
| 12 | Footer missing diacritics | Low | Content | footer |

## Testing Coverage

### Pages Tested
- /home, /service, /service?keyword=..., /service/{id}, /doctor, /doctor?keyword=..., /promotions, the promotion detail page, /appointment, /consultation, /records, /profile, /privacy, /terms, /contact, /auth/login, /auth/register, /auth/forgot-password (HTML only), an unknown route.

### Features Tested
- Home search: service names, accentless input, doctor names, symptoms, a no-result query and an HTML-injection string (rendered safely).
- Promotions: "Sao chép mã" (works and shows "Đã chép mã!"), the detail page, cross-checks against the public promotions and services APIs.
- Login prompts on gated pages and their redirect parameter.
- AI assistant widget (opened only; no messages sent).
- Mobile layout at 390x844: horizontal-overflow scan on 9 routes.
- JS errors and failed requests captured on every page.

### Not Tested / Out of Scope
- Everything behind login: booking flow, medical records, profile, video consultation, notifications.
- Sending messages to the AI assistant or the receptionist chat.
- Google OAuth, and submitting the registration or forgot-password forms (skipped so I wouldn't create data).
- Other browsers, and real cold-load performance (resources were cached).

### Blockers
- None.

---

## Notes

- What works well: no uncaught JS errors or `console.error` output on any page, no broken images, no horizontal overflow on mobile. The gated pages `/appointment`, `/records` and `/profile` show clear login prompts with a redirect parameter. Search is accent-insensitive. There were no long tasks on the main thread.
- For guests, every page load fires `POST /api/v1/auth/refresh`, which returns 401. That's expected in a refresh-token flow, but it appears as a red network error in DevTools. Skipping the call when no session hint (a cookie or flag) exists would quiet it.
- Side effects of testing: one accidental demo login (Issue #1), immediately logged out. Clicking "Sao chép mã" copied `CAORANG99K` to the system clipboard.
