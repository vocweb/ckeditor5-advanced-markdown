<!-- 本文と箇条書きは日本語とベトナム語の両方で記述してください。日本語を先に書き、その直後の行に同じ内容のベトナム語訳を書いてください。 -->
<!-- Nội dung và danh sách phải viết bằng cả tiếng Nhật và tiếng Việt. Viết tiếng Nhật trước, rồi viết bản dịch tiếng Việt có cùng nội dung ngay ở dòng tiếp theo. -->
<!-- タイトルと見出し（表の列見出しを含む）は「日本語 - ベトナム語」の形式で1行にまとめてください。本文と箇条書きでは、日本語の行末に半角スペースを2つ付け、表示時にも改行してください。 -->
<!-- Tiêu đề và header (kể cả header cột trong bảng) viết gọn trên một dòng theo dạng “tiếng Nhật - tiếng Việt”. Với nội dung và danh sách, thêm hai dấu cách ở cuối dòng tiếng Nhật để khi hiển thị vẫn xuống dòng. -->
<!-- 表のデータセルではMarkdownの構文を維持するため、「日本語<br>ベトナム語」の形式を使用してください。コード、コマンド、ファイルパス、URL、識別子は翻訳せず、必要な箇所にそのまま記載してください。 -->
<!-- Trong ô dữ liệu của bảng, để giữ cú pháp Markdown, dùng dạng “tiếng Nhật<br>tiếng Việt”. Giữ nguyên mã nguồn, lệnh, đường dẫn file, URL và định danh, không dịch chúng và chỉ ghi tại nơi cần thiết. -->
<!-- 各項目（「修正対象のバグ - Lỗi cần sửa」「リスクレベル - Mức độ rủi ro」「潜在的な影響 - Tác động」など）に小項目がある場合は、長い段落にまとめず、小見出し（###/####）、箇条書き、番号付きリスト、表などのMarkdownで構造化し、人が最も読みやすい形で記載してください。小見出しも「日本語 - ベトナム語」の1行形式にしてください。 -->
<!-- Với từng mục (như “修正対象のバグ - Lỗi cần sửa”, “リスクレベル - Mức độ rủi ro”, “潜在的な影響 - Tác động”,...), nếu có các mục con thì không dồn vào một đoạn văn dài mà trình bày bằng Markdown (heading con ###/####, danh sách, danh sách đánh số, bảng) để người đọc dễ theo dõi nhất. Heading con cũng viết trên một dòng theo dạng “tiếng Nhật - tiếng Việt”. -->
<!-- バグの発生経路、修正前後の処理の流れ、影響範囲などは、必要に応じてmermaid図（```mermaid）で視覚的に示してください。図内のノードやエッジのラベルも「1行日本語、1行ベトナム語」のルールを守り、A["日本語<br>ベトナム語"] のようにダブルクォートで囲んだ「日本語<br>ベトナム語」の形式で記載してください。 -->
<!-- Có thể bổ sung sơ đồ mermaid (```mermaid) khi cần để trình bày trực quan đường phát sinh lỗi, luồng xử lý trước và sau khi sửa hoặc phạm vi ảnh hưởng. Nhãn của node và cạnh trong sơ đồ cũng phải giữ quy tắc “một dòng tiếng Nhật, một dòng tiếng Việt”, viết theo dạng “tiếng Nhật<br>tiếng Việt” đặt trong dấu ngoặc kép như A["tiếng Nhật<br>tiếng Việt"]. -->
<!-- mermaid図はGitHub（Mermaid 11系）とGitLab 18.3（Mermaid 10.7.0）の両方で正しく表示される必要があります。改行には必ず <br> を使用し、\n は使用しないでください（Mermaid 11では文字列のまま表示されるため）。subgraphのタイトルは中のノードより短くしてください（Mermaid 10.7.0ではタイトルが枠の端に接して表示されるため）。 -->
<!-- Sơ đồ mermaid phải hiển thị đúng trên cả GitHub (Mermaid 11.x) và GitLab 18.3 (Mermaid 10.7.0). Luôn dùng <br> để xuống dòng, không dùng \n (Mermaid 11 hiển thị nguyên văn chuỗi này). Tiêu đề subgraph phải ngắn hơn các node bên trong (Mermaid 10.7.0 hiển thị tiêu đề chạm mép khung). -->
<!-- PR/MRを作成するスキルは、このテンプレートを読み、実際の変更と確認結果に基づいて記入し、完成した本文を作成コマンドまたはAPIに渡してください。記入後は案内コメントを削除してください。 -->
<!-- Skill tạo PR/MR phải đọc template này, điền dựa trên thay đổi và kết quả kiểm tra thực tế, rồi truyền nội dung đã hoàn thiện vào lệnh hoặc API tạo PR/MR. Xóa các comment hướng dẫn sau khi điền. -->
<!-- 該当しない項目には「該当なし」とその理由を記載し、直後の行にベトナム語訳を記載してください。未確認の内容を確認済みとして記載しないでください。 -->
<!-- Với mục không áp dụng, ghi “Không áp dụng” cùng lý do theo cặp dòng Nhật - Việt. Không ghi nội dung chưa xác minh thành đã xác minh. -->

# バグ修正 - Sửa lỗi

## 修正対象のバグ - Lỗi cần sửa
<!-- どのようなバグを修正するか、実際の症状と期待される動作を記載してください。 -->
<!-- Mô tả lỗi cần sửa, gồm triệu chứng thực tế và hành vi mong đợi. -->

## リスク評価 - Đánh giá rủi ro

### リスクレベル - Mức độ rủi ro
<!-- 「低」「中」「高」から1つだけ選び、選択理由を記載してください。変更を本番環境へ統合する際のリスクを評価してください。 -->
<!-- Chọn duy nhất một mức “Thấp”, “Trung bình” hoặc “Cao” và nêu lý do. Đánh giá rủi ro khi tích hợp thay đổi vào môi trường production. -->

### 潜在的な影響 - Tác động
<!-- どの部分に、どのような悪影響が生じる可能性があるかを記載してください（例：データベースの性能低下、認証の不具合、外部APIとの互換性）。 -->
<!-- Ghi phần nào có thể chịu tác động bất lợi và tác động cụ thể là gì (ví dụ: giảm hiệu năng cơ sở dữ liệu, lỗi xác thực, khả năng tương thích với API bên ngoài). -->

### 障害発生時の対応とロールバック計画 - Kế hoạch xử lý sự cố và hoàn tác
<!-- 本番環境で障害が発生した場合の対応と、変更を元に戻す具体的な手順を記載してください。データベースマイグレーションのロールバックが必要かどうかも記載してください。 -->
<!-- Ghi cách xử lý khi xảy ra sự cố trên production và các bước cụ thể để hoàn tác thay đổi. Nêu rõ có cần rollback migration cơ sở dữ liệu hay không. -->

## バグの再現手順 - Các bước tái hiện lỗi
<!-- バグを再現するための手順を、番号付きリストで記載してください。 -->
<!-- Ghi các bước tái hiện lỗi dưới dạng danh sách đánh số. -->

## 修正内容 - Nội dung sửa lỗi
<!-- 根本原因と、どのように修正したかを記載してください。 -->
<!-- Ghi nguyên nhân gốc và cách đã sửa lỗi. -->

## 修正後の動作確認 - Kiểm tra chức năng sau khi sửa lỗi
<!-- 実行したコマンドや確認シナリオ、実際の結果（成功・失敗）、確認の証拠を記載してください。未実施の確認は、その内容と理由を明記してください。 -->
<!-- Ghi lệnh hoặc kịch bản đã chạy, kết quả thực tế (đạt hoặc thất bại) và bằng chứng kiểm tra. Với phần chưa kiểm tra, ghi rõ nội dung và lý do. -->

## 関連するIssue - Các issue liên quan
<!-- 関連するIssueがあれば記載してください。 -->
<!-- Ghi các issue liên quan nếu có. -->
