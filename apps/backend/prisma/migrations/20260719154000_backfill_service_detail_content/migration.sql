UPDATE "services"
SET
  "detail_summary" = 'Khám răng tổng quát giúp bác sĩ đánh giá toàn diện răng, nướu, khớp cắn và các dấu hiệu bất thường trong khoang miệng. Đây là bước nền tảng để phát hiện sớm sâu răng, viêm nướu, mòn cổ răng hoặc các vấn đề cần điều trị trước khi trở nên nghiêm trọng.',
  "highlights" = '[
    {"icon":"checkup","title":"Tầm soát toàn diện","description":"Kiểm tra răng, nướu, khớp cắn và thói quen vệ sinh để phát hiện vấn đề sớm."},
    {"icon":"shield","title":"Kế hoạch rõ ràng","description":"Bác sĩ giải thích tình trạng hiện tại, mức độ ưu tiên điều trị và chi phí dự kiến."},
    {"icon":"clock","title":"Phù hợp tái khám định kỳ","description":"Buổi khám gọn, phù hợp để duy trì sức khỏe răng miệng mỗi 3-6 tháng."}
  ]'::jsonb,
  "suitable_for" = '[
    "Người muốn kiểm tra sức khỏe răng miệng định kỳ.",
    "Người có dấu hiệu đau răng, ê buốt, chảy máu nướu hoặc hôi miệng.",
    "Người cần tư vấn trước khi thực hiện tẩy trắng, phục hình, chỉnh nha hoặc điều trị chuyên sâu."
  ]'::jsonb,
  "included_items" = '[
    "Khám tổng quát răng, nướu và khớp cắn.",
    "Tư vấn tình trạng răng miệng và hướng điều trị phù hợp.",
    "Ước tính chi phí, thời gian và số buổi cần thiết.",
    "Hướng dẫn chăm sóc tại nhà sau buổi khám."
  ]'::jsonb,
  "preparation_notes" = '[
    "Chuẩn bị danh sách triệu chứng hoặc mong muốn cần tư vấn.",
    "Mang theo phim chụp, toa thuốc hoặc hồ sơ điều trị cũ nếu có.",
    "Đến trước giờ hẹn khoảng 10 phút để cập nhật thông tin."
  ]'::jsonb,
  "aftercare_notes" = '[
    "Thực hiện theo hướng dẫn vệ sinh răng miệng của bác sĩ.",
    "Đặt lịch điều trị tiếp theo nếu phát hiện vấn đề cần xử lý.",
    "Tái khám định kỳ để kiểm soát sức khỏe răng miệng lâu dài."
  ]'::jsonb,
  "important_notes" = '[
    "Chi phí cuối cùng phụ thuộc vào tình trạng thực tế sau thăm khám.",
    "Một số trường hợp cần chụp phim hoặc xét nghiệm bổ sung trước khi điều trị."
  ]'::jsonb,
  "pricing_note" = 'Giá hiển thị là chi phí khám/tư vấn ban đầu. Nếu cần điều trị thêm, bác sĩ sẽ báo rõ phương án và chi phí trước khi thực hiện.'
WHERE "slug" = 'dental-checkup';

UPDATE "services"
SET
  "detail_summary" = 'Cạo vôi và đánh bóng răng giúp loại bỏ mảng bám khoáng hóa, làm sạch bề mặt răng và hỗ trợ kiểm soát viêm nướu. Dịch vụ phù hợp để duy trì hơi thở sạch, nướu khỏe và phát hiện sớm các vấn đề răng miệng.',
  "highlights" = '[
    {"icon":"checkup","title":"Nướu sạch hơn","description":"Loại bỏ cao răng quanh viền nướu, giảm kích thích gây viêm và chảy máu."},
    {"icon":"sparkles","title":"Răng mịn, ít bám màu","description":"Đánh bóng giúp bề mặt răng sạch và dễ duy trì vệ sinh hơn."},
    {"icon":"shield","title":"Tầm soát nha chu","description":"Bác sĩ kiểm tra dấu hiệu viêm nướu, tụt nướu và nguy cơ nha chu."}
  ]'::jsonb,
  "suitable_for" = '[
    "Người có cao răng, mảng bám, hôi miệng hoặc chảy máu khi chải răng.",
    "Người cần làm sạch trước khi tẩy trắng, chỉnh nha hoặc phục hình.",
    "Người muốn duy trì tái khám định kỳ mỗi 3-6 tháng."
  ]'::jsonb,
  "included_items" = '[
    "Khám nhanh tình trạng nướu và mảng bám.",
    "Cạo vôi bằng dụng cụ phù hợp.",
    "Đánh bóng bề mặt răng.",
    "Hướng dẫn chải răng, dùng chỉ nha khoa hoặc máy tăm nước."
  ]'::jsonb,
  "preparation_notes" = '[
    "Đánh răng trước buổi hẹn để bác sĩ đánh giá nướu rõ hơn.",
    "Thông báo nếu đang dùng thuốc chống đông hoặc có bệnh lý tim mạch.",
    "Nêu rõ vùng răng ê buốt để bác sĩ thao tác nhẹ hơn."
  ]'::jsonb,
  "aftercare_notes" = '[
    "Có thể hơi ê hoặc chảy máu nhẹ nếu nướu đang viêm.",
    "Tránh thức ăn quá nóng hoặc quá lạnh trong vài giờ đầu nếu răng nhạy cảm.",
    "Duy trì vệ sinh kỹ vùng kẽ răng để hạn chế cao răng quay lại."
  ]'::jsonb,
  "important_notes" = '[
    "Cạo vôi đúng kỹ thuật không làm mòn men răng.",
    "Nếu viêm nướu nặng, bạn có thể cần thêm điều trị nha chu chuyên sâu."
  ]'::jsonb,
  "pricing_note" = 'Giá có thể thay đổi theo mức độ cao răng, tình trạng nướu và nhu cầu làm sạch bổ sung.'
WHERE "slug" = 'teeth-cleaning';

UPDATE "services"
SET
  "detail_summary" = 'Điều trị tủy giúp loại bỏ mô tủy viêm hoặc nhiễm trùng bên trong răng, làm sạch hệ thống ống tủy và trám bít để giữ lại răng thật. Đây là lựa chọn quan trọng khi răng đau kéo dài, nhạy cảm nặng hoặc có tổn thương quanh chóp.',
  "highlights" = '[
    {"icon":"shield","title":"Bảo tồn răng thật","description":"Kiểm soát nhiễm trùng và giữ lại răng khi còn khả năng phục hồi."},
    {"icon":"checkup","title":"Giảm đau có kiểm soát","description":"Gây tê và xử lý từng bước để giảm đau, giảm áp lực viêm trong răng."},
    {"icon":"clock","title":"Lộ trình rõ ràng","description":"Bác sĩ tư vấn số buổi, phục hồi sau điều trị và thời gian theo dõi."}
  ]'::jsonb,
  "suitable_for" = '[
    "Răng đau tự phát, đau về đêm hoặc đau kéo dài sau kích thích nóng lạnh.",
    "Răng sâu lớn, vỡ mẻ sâu hoặc từng chấn thương.",
    "Có dấu hiệu nhiễm trùng, sưng nướu, mủ hoặc tổn thương quanh chân răng."
  ]'::jsonb,
  "included_items" = '[
    "Khám lâm sàng và đánh giá triệu chứng đau.",
    "Chụp phim theo chỉ định để xác định số lượng ống tủy.",
    "Làm sạch, tạo hình và trám bít hệ thống ống tủy.",
    "Tư vấn phục hồi thân răng sau điều trị."
  ]'::jsonb,
  "preparation_notes" = '[
    "Ăn nhẹ trước buổi hẹn nếu không có chống chỉ định.",
    "Thông báo thuốc đang dùng, tiền sử dị ứng thuốc tê hoặc bệnh nền.",
    "Mang phim chụp hoặc hồ sơ điều trị cũ nếu có."
  ]'::jsonb,
  "aftercare_notes" = '[
    "Tránh nhai mạnh bên răng vừa điều trị cho đến khi phục hồi hoàn tất.",
    "Dùng thuốc đúng chỉ định nếu bác sĩ kê đơn.",
    "Tái khám đúng lịch để kiểm tra lành thương và trám hoặc bọc phục hồi."
  ]'::jsonb,
  "important_notes" = '[
    "Răng viêm lâu ngày hoặc ống tủy phức tạp có thể cần nhiều buổi hẹn.",
    "Răng mất mô lớn có nguy cơ nứt vỡ nếu không phục hồi bảo vệ sau điều trị."
  ]'::jsonb,
  "pricing_note" = 'Giá phụ thuộc vào vị trí răng, số lượng ống tủy, mức độ nhiễm trùng và phương án phục hồi sau điều trị.'
WHERE "slug" = 'root-canal-treatment';

UPDATE "services"
SET
  "detail_summary" = 'Tẩy trắng răng là giải pháp cải thiện màu răng bằng hoạt chất nha khoa chuyên dụng, được kiểm soát thời gian và nồng độ theo nền men răng. Bác sĩ sẽ đánh giá tình trạng nhiễm màu, mảng bám, độ nhạy cảm và các phục hình cũ trước khi chỉ định liệu trình phù hợp.',
  "highlights" = '[
    {"icon":"sparkles","title":"Màu răng sáng tự nhiên","description":"Mục tiêu là nâng tông hài hòa với màu da và khuôn mặt, tránh trắng gắt thiếu tự nhiên."},
    {"icon":"shield","title":"Kiểm soát ê buốt","description":"Bác sĩ đánh giá men răng và hướng dẫn chăm sóc sau điều trị để hạn chế nhạy cảm."},
    {"icon":"clock","title":"Một buổi điều trị gọn","description":"Phù hợp với người bận rộn, kết quả có thể thấy rõ sau buổi hẹn nếu đủ điều kiện."}
  ]'::jsonb,
  "suitable_for" = '[
    "Răng xỉn màu do trà, cà phê, thuốc lá hoặc tuổi tác.",
    "Người muốn cải thiện nụ cười trước sự kiện, chụp ảnh hoặc giao tiếp nhiều.",
    "Men răng còn khỏe, không có sâu răng hoặc viêm nướu chưa điều trị."
  ]'::jsonb,
  "included_items" = '[
    "Khám màu răng nền và kiểm tra mảng bám.",
    "Tư vấn tông màu kỳ vọng và mức độ duy trì.",
    "Che chắn nướu, môi và mô mềm trước khi thao tác.",
    "Hướng dẫn chế độ ăn uống sau tẩy trắng."
  ]'::jsonb,
  "preparation_notes" = '[
    "Nên cạo vôi hoặc làm sạch mảng bám trước nếu bác sĩ chỉ định.",
    "Thông báo nếu từng ê buốt răng hoặc đang có phục hình sứ.",
    "Tránh dùng cà phê, trà hoặc thực phẩm màu đậm ngay trước buổi hẹn."
  ]'::jsonb,
  "aftercare_notes" = '[
    "Trong 24-48 giờ đầu, hạn chế cà phê, trà đặc, rượu vang và thực phẩm có màu đậm.",
    "Dùng kem đánh răng giảm ê buốt nếu bác sĩ khuyến nghị.",
    "Tái khám nếu ê buốt kéo dài hoặc màu răng không đều."
  ]'::jsonb,
  "important_notes" = '[
    "Tẩy trắng không làm trắng mão sứ, miếng trám hoặc veneer cũ.",
    "Răng nhiễm màu nội sinh nặng có thể cần phương án thẩm mỹ khác."
  ]'::jsonb,
  "pricing_note" = 'Giá phụ thuộc vào tình trạng màu răng, mức độ nhiễm màu và việc có cần làm sạch trước tẩy trắng hay không.'
WHERE "slug" = 'teeth-whitening';

UPDATE "services"
SET
  "detail_summary" = COALESCE("detail_summary", 'Dịch vụ được thiết kế để bác sĩ đánh giá tình trạng răng miệng, giải thích lựa chọn điều trị và xây dựng kế hoạch phù hợp với nhu cầu của từng bệnh nhân.'),
  "highlights" = COALESCE("highlights", '[
    {"icon":"checkup","title":"Chẩn đoán rõ ràng","description":"Bác sĩ kiểm tra tình trạng hiện tại và giải thích nguyên nhân, mức độ ưu tiên điều trị."},
    {"icon":"shield","title":"Kế hoạch cá nhân hóa","description":"Phác đồ được đề xuất theo sức khỏe răng miệng, lịch sinh hoạt và ngân sách của bạn."},
    {"icon":"clock","title":"Theo dõi dễ dàng","description":"Thông tin dịch vụ, lịch hẹn và hồ sơ điều trị được đồng bộ trong hệ thống patient."}
  ]'::jsonb),
  "suitable_for" = COALESCE("suitable_for", '[
    "Người cần tư vấn trước khi quyết định điều trị.",
    "Người muốn biết rõ chi phí, thời gian và số buổi thực hiện.",
    "Người muốn có kế hoạch chăm sóc răng miệng rõ ràng."
  ]'::jsonb),
  "included_items" = COALESCE("included_items", '[
    "Thăm khám tình trạng răng, nướu và khớp cắn.",
    "Tư vấn phương án điều trị phù hợp.",
    "Ước tính chi phí, thời lượng và số buổi cần thiết."
  ]'::jsonb),
  "preparation_notes" = COALESCE("preparation_notes", '[
    "Chuẩn bị triệu chứng hoặc mong muốn cần trao đổi với bác sĩ.",
    "Mang hồ sơ, phim chụp hoặc toa thuốc liên quan nếu có."
  ]'::jsonb),
  "aftercare_notes" = COALESCE("aftercare_notes", '[
    "Làm theo hướng dẫn của bác sĩ về vệ sinh và ăn uống sau điều trị.",
    "Theo dõi cảm giác đau, ê buốt hoặc sưng nếu có."
  ]'::jsonb),
  "important_notes" = COALESCE("important_notes", '[
    "Chi phí cuối cùng có thể thay đổi sau khi bác sĩ đánh giá trực tiếp.",
    "Một số trường hợp cần chụp phim hoặc kiểm tra bổ sung trước khi điều trị."
  ]'::jsonb),
  "pricing_note" = COALESCE("pricing_note", 'Giá hiển thị là mức tham khảo. Bác sĩ sẽ xác nhận chi phí cuối cùng sau khi thăm khám.')
WHERE
  "detail_summary" IS NULL
  OR "highlights" IS NULL
  OR "suitable_for" IS NULL
  OR "included_items" IS NULL
  OR "preparation_notes" IS NULL
  OR "aftercare_notes" IS NULL
  OR "important_notes" IS NULL
  OR "pricing_note" IS NULL;
