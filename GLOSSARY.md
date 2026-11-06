# Thuật ngữ

| Thuật ngữ | Nghĩa |
|---|---|
| Source-preserving block | Block cấp cao nhất của tài liệu Markdown có chuỗi nguồn gốc được nhớ lại. Nếu block không bị sửa thì `getData()` xuất đúng chuỗi gốc, nếu đã sửa thì serialize lại theo một style cố định. |
| Baseline | Kết quả serialize của model ngay sau khi `setData()`. So sánh với kết quả serialize hiện tại để biết block nào đã bị sửa. |
| Khối thô (raw block) | Block mà plugin không ánh xạ sang cấu trúc CKEditor: HTML khối, MDX (`import`, `export`, `{expr}`), YAML frontmatter, link reference definition. Giữ nguyên chuỗi, sửa bằng ô text trong widget. |
| Raw inline | Phần tử inline giữ nguyên chuỗi nguồn: HTML inline, text directive, biểu thức MDX. |
| Directive | Cú pháp `remark-directive`: container (`:::name`), leaf (`::name`), text (`:name`). Tên bất kỳ, không cần đăng ký. |
| Preset an toàn | Tập tính năng CKEditor mặc định bật, chỉ gồm những gì biểu diễn được bằng GFM + directive. |
| CK-only feature | Tính năng CKEditor không có dạng Markdown (căn lề, màu, ô gộp, ảnh có kích thước, list style). Bật thêm thì ghi ra HTML inline hợp lệ JSX/XHTML. |
