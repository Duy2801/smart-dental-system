# AI Service — Smart Dental System

Microservice Python (FastAPI). NestJS backend gọi service này qua HTTP nội bộ.

## Chạy local

**Lần đầu (chỉ 1 lần):**

```bash
pnpm --filter ai-service setup
```


```bash
python download_models.py
```

Script kiểm tra SHA-256 và bỏ qua model đã tải đầy đủ, nên không tải lại trong
những lần chạy sau.

Phân tích phim Panorama dùng YOLO và DeepLab chạy local. Hai model được nạp vào
bộ nhớ ở lần phân tích đầu tiên rồi tái sử dụng cho các request tiếp theo.
Gemini `gemini-3.6-flash` chỉ diễn giải danh sách phát hiện do model local trả về;
Gemini không tự thêm phát hiện và hệ thống không dùng Roboflow.

> Pipeline model yêu cầu Python 3.11–3.13 (khuyến nghị 3.12) và các thư viện AI trong `requirements.txt`.
> Nếu model chưa được tải hoặc thiếu dependency, API trả trạng thái
> `MODEL_UNAVAILABLE` thay vì tạo dữ liệu phát hiện giả.

**Hàng ngày** — từ root monorepo:

```bash
pnpm dev
```

Turbo sẽ chạy luôn AI service tại http://127.0.0.1:8001 (cùng backend/frontend).

Docs: http://127.0.0.1:8001/docs

### API key LLM (mỗi người dùng key của mình)

1. Tạo file `apps/ai-service/.env` (xem mẫu biến bên dưới hoặc file `.env.example` local)
2. Mở `.env`, chọn provider và điền **một** key:

| Provider | Biến cần điền | Lấy key |
|----------|---------------|---------|
| OpenRouter (mặc định) | `LLM_PROVIDER=openrouter` + `OPENROUTER_API_KEY=` + `OPENROUTER_MODEL=` | https://openrouter.ai/keys |
| Groq | `LLM_PROVIDER=groq` + `GROQ_API_KEY=` | https://console.groq.com/keys |
| OpenAI | `LLM_PROVIDER=openai` + `OPENAI_API_KEY=` | https://platform.openai.com/api-keys |
| Gemini | `LLM_PROVIDER=gemini` + `GEMINI_API_KEY=` | https://aistudio.google.com/apikey |

3. Restart `pnpm dev` (đổi `.env` không luôn tự reload).

`.env` đã nằm trong `.gitignore` — **đừng commit key**.

## Deploy AI service lên VM

Frontend trên Vercel gọi NestJS, rồi NestJS gọi AI service trên VM. Model cần nằm
trên VM chạy AI service; tải model trên máy local không cung cấp model cho VM.
Hai file trọng số không nằm trong Git.

Workflow `.github/workflows/deploy-ai.yml` cài `requirements-vision.txt`, tải và
kiểm tra SHA-256 của model, kiểm tra import pipeline rồi mới restart `dental-ai`.
`requirements.txt` chỉ chứa bộ thư viện nhẹ, không đủ để đọc phim bằng YOLO/DeepLab.
Endpoint `/health` chỉ kiểm tra HTTP service, không xác nhận model đã sẵn sàng.

Ultralytics tự kéo thêm `opencv-python` bản desktop. Setup và deploy gỡ bản này
rồi cài lại `opencv-python-headless` để tránh xung đột cùng module `cv2` và lỗi
thiếu thư viện giao diện như `libxcb.so.1` trên VM. Cần cài lại headless vì việc
gỡ bản desktop có thể xóa các file dùng chung. `--no-deps` giữ nguyên các thư viện
đã được cài từ `requirements-vision.txt`.

Để sửa VM đang thiếu model, chạy trên chính VM:

```bash
cd ~/smart-dental-system/apps/ai-service
.venv/bin/pip install -r requirements-vision.txt
.venv/bin/pip uninstall -y opencv-python opencv-contrib-python
.venv/bin/pip install --force-reinstall --no-deps opencv-python-headless
.venv/bin/python ../../download_models.py
.venv/bin/python -c "import cv2, runpy; assert cv2.version.headless, 'OpenCV must be headless'; runpy.run_path('dental-pano-ai/main.py')"
pm2 restart dental-ai --update-env
```

Sau khi push thay đổi lên `main`, có thể chạy lại workflow **Deploy AI Service**
trong GitHub Actions để thực hiện các bước này tự động. Lần đầu cần tải khoảng
506 MiB trọng số; các lần sau script bỏ qua file có checksum hợp lệ.

### Local đọc phim được nhưng bản deploy lỗi

Mở DevTools → Network, bấm **Phân tích lại**, kiểm tra status, Response và thời
gian của request `POST /api/v1/admin/ai/doctor/analyze-xray`. Thông báo lỗi kết
nối trên giao diện không đủ để kết luận thiếu model hoặc sai cấu hình Vercel.

| Kết quả | Kiểm tra tiếp |
| --- | --- |
| HTTP 504, nhất là sau khoảng 60 giây | Log timeout của Nginx; so sánh với thời gian inference trên VM. |
| HTTP 502 với response HTML | Log Nginx và `dental-be`: backend có bị dừng/restart trong khi phân tích không? |
| HTTP 502/503 với JSON từ NestJS | Đọc `message`; kiểm tra `AI_SERVICE_URL`, key và log `dental-ai`. |
| Client timeout | Phân tích X-quang: backend chờ 240 giây, Nginx 260 giây, frontend 270 giây. Kiểm tra inference có vượt giới hạn này không. |
| HTTP 200 nhưng `data.status=MODEL_UNAVAILABLE` | Kiểm tra trọng số, dependency và khả năng nạp model trên VM. |
| `ERR_NETWORK` hoặc CORS | Xem cả Network và log proxy: response lỗi do Nginx tạo có thể thiếu header CORS dù response của NestJS có header này. |

Nếu Nginx ghi `upstream prematurely closed connection` và kernel ghi
`Out of memory: Killed process ... (python)`, đây là lỗi hết RAM, không phải
timeout. Pipeline giữ mặt nạ YOLO ở độ phân giải gốc bằng cách chiếu từng nhóm
4 mặt nạ và chỉ giữ vùng bounding box; post-processing cộng dồn vùng mặt nạ để
tránh tạo tensor/array chứa đồng thời 500 mặt nạ toàn ảnh. Với phim 2356×1292,
riêng 500 mặt nạ float32 toàn ảnh có thể cần hơn 5 GiB.

Trong workflow **Deploy AI Service**, chọn `diagnose_only=true, logs_only=true`
để đọc trạng thái và lỗi OOM/proxy mà không chạy thêm inference. Chọn
`candidate_model=true` cùng `diagnose_only=true` để chạy code model của commit
được chọn trong một tiến trình riêng với phim Panorama mẫu trước khi deploy.
Kiểm tra thông thường dùng phim thật `data/sample_panoramic.jpg` và chỉ thành
công với trạng thái `HEALTHY` hoặc `PATHOLOGY_DETECTED`; ảnh tổng hợp bị từ chối
không còn được coi là kiểm chứng đầy đủ cho luồng đọc phim.

Trên VM, kiểm tra service và log quanh đúng thời điểm request lỗi:

```bash
curl -fsS http://127.0.0.1:8001/health
pm2 logs dental-ai --lines 80 --nostream
pm2 logs dental-be --lines 80 --nostream
sudo tail -n 80 /var/log/nginx/error.log
```

Nếu backend và AI chạy cùng VM như hai workflow trong repo, cấu hình **backend**
là `AI_SERVICE_URL=http://127.0.0.1:8001`. Nếu hai service ở hai máy/container
khác nhau, dùng địa chỉ AI service mà máy/container backend truy cập được.
`AI_SERVICE_API_KEY` phải trùng ở hai service. Đổi cấu hình backend thì restart
`dental-be`; đổi cấu hình AI thì restart `dental-ai` với `--update-env`. Không
đặt key nội bộ trong biến `NEXT_PUBLIC_*` của Vercel.

Để phân biệt HTTP service hoạt động với model thực sự nạp được, chạy từ
`apps/ai-service` trên VM:

```bash
.venv/bin/python -c "from app.services.local_panoramic_model import local_panoramic_model; local_panoramic_model._ensure_loaded(); print('YOLO/DeepLab loaded successfully')"
```

Workflow hiện kiểm tra import dependency và `/health`, chưa kiểm tra nạp trọng số
hoặc chạy inference. Nếu tiến trình bị `Killed`, kiểm tra RAM và log OOM của VM;
không kết luận model đã sẵn sàng chỉ vì workflow xanh.

Nếu log xác nhận `upstream timed out` ở Nginx trong lúc AI vẫn xử lý, điều chỉnh
`proxy_read_timeout` trong location đang proxy backend để lớn hơn timeout gọi AI
của backend. Workflow deploy cấu hình `proxy_read_timeout 260s;` cho site backend,
có sao lưu và hoàn tác nếu kiểm tra/reload Nginx thất bại. Frontend chờ 270 giây,
backend chờ 240 giây riêng cho phân tích phim (đổi bằng `AI_XRAY_TIMEOUT_MS`).
Các tác vụ AI khác vẫn dùng `AI_SERVICE_TIMEOUT_MS`, mặc định 90 giây.
Kiểm tra `sudo nginx -t` trước khi `sudo systemctl reload nginx`. Tăng timeout
không sửa được lỗi key, thiếu model hay hết RAM. Nginx mặc định chờ 60 giây giữa
hai lần đọc từ upstream: [tài liệu proxy_read_timeout](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_read_timeout).

## Luồng hệ thống

```
Patient / Doctor UI  →  NestJS (apps/backend)  →  AI Service (apps/ai-service)
                                                      ↓
                                                   LLM API
```

NestJS giữ auth, DB, nghiệp vụ. Python chỉ làm inference / sinh text.

## RAG (kiến thức phòng khám)

Trước khi gọi LLM, service tìm đoạn liên quan trong `data/knowledge.jsonl` (bảng giá, FAQ, quy trình, protocol, mẫu HSBA/chat) rồi nhét vào prompt.

- Sửa/bổ sung tri thức: thêm dòng JSON vào `knowledge.jsonl` (mỗi dòng = 1 chunk).
- Search hiện tại: token-overlap (không cần embedding API). Đổi sang embedding khi KB lớn.

## NestJS proxy (bác sĩ)

Backend gọi AI qua:

- `POST /api/v1/admin/ai/doctor/summarize-patient` `{ consultationId | patientId }`
- `POST /api/v1/admin/ai/doctor/draft-medical-record` `{ patientId?, chiefComplaint?, … }`
- `POST /api/v1/admin/ai/doctor/draft-prescription` `{ medicalRecordId | patientId }`
- `POST /api/v1/admin/ai/doctor/draft-treatment-plan` `{ patientId | medicalRecordId }`
- `POST /api/v1/admin/ai/doctor/review-prescription` `{ medicalRecordId | patientId, items }`
- `POST /api/v1/admin/ai/doctor/generate-aftercare` `{ medicalRecordId }`
- `POST /api/v1/admin/ai/doctor/send-aftercare` `{ medicalRecordId, content }`
- `POST /api/v1/admin/ai/doctor/explain-treatment-plan` `{ treatmentPlanId }`

Env Nest (`apps/backend/.env`) và AI service (`apps/ai-service/.env`) phải dùng
cùng `AI_SERVICE_API_KEY`:

```
AI_SERVICE_URL=http://127.0.0.1:8001
AI_SERVICE_API_KEY=dev-local-key
```

Khi chạy production, đặt một key riêng thay cho `dev-local-key`; service sẽ từ
chối khởi động nếu vẫn dùng key development. Có thể cấu hình danh sách origin
trình duyệt được phép gọi AI service trực tiếp bằng `CORS_ORIGINS`, phân tách bởi
dấu phẩy.
