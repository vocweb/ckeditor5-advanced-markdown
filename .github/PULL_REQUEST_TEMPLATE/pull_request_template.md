<!-- 本文と箇条書きは日本語とベトナム語の両方で記述してください。日本語を先に書き、その直後の行に同じ内容のベトナム語訳を書いてください。 -->
<!-- Nội dung và danh sách phải viết bằng cả tiếng Nhật và tiếng Việt. Viết tiếng Nhật trước, rồi viết bản dịch tiếng Việt có cùng nội dung ngay ở dòng tiếp theo. -->
<!-- タイトルと見出し（表の列見出しを含む）は「日本語 - ベトナム語」の形式で1行にまとめてください。本文と箇条書きでは、日本語の行末に半角スペースを2つ付け、表示時にも改行してください。 -->
<!-- Tiêu đề và header (kể cả header cột trong bảng) viết gọn trên một dòng theo dạng “tiếng Nhật - tiếng Việt”. Với nội dung và danh sách, thêm hai dấu cách ở cuối dòng tiếng Nhật để khi hiển thị vẫn xuống dòng. -->
<!-- 表のデータセルではMarkdownの構文を維持するため、「日本語<br>ベトナム語」の形式を使用してください。コード、コマンド、ファイルパス、URL、識別子は翻訳せず、必要な箇所にそのまま記載してください。 -->
<!-- Trong ô dữ liệu của bảng, để giữ cú pháp Markdown, dùng dạng “tiếng Nhật<br>tiếng Việt”. Giữ nguyên mã nguồn, lệnh, đường dẫn file, URL và định danh, không dịch chúng và chỉ ghi tại nơi cần thiết. -->
<!-- 各項目（「概要 - Tổng quan」「リスクレベル - Mức độ rủi ro」「潜在的な影響 - Tác động」など）に小項目がある場合は、長い段落にまとめず、小見出し（###/####）、箇条書き、番号付きリスト、表などのMarkdownで構造化し、人が最も読みやすい形で記載してください。小見出しも「日本語 - ベトナム語」の1行形式にしてください。 -->
<!-- Với từng mục (như “概要 - Tổng quan”, “リスクレベル - Mức độ rủi ro”, “潜在的な影響 - Tác động”,...), nếu có các mục con thì không dồn vào một đoạn văn dài mà trình bày bằng Markdown (heading con ###/####, danh sách, danh sách đánh số, bảng) để người đọc dễ theo dõi nhất. Heading con cũng viết trên một dòng theo dạng “tiếng Nhật - tiếng Việt”. -->
<!-- 処理の流れ、依存関係、影響範囲などは、必要に応じてmermaid図（```mermaid）で視覚的に示してください。図内のノードやエッジのラベルも「1行日本語、1行ベトナム語」のルールを守り、A["日本語<br>ベトナム語"] のようにダブルクォートで囲んだ「日本語<br>ベトナム語」の形式で記載してください。 -->
<!-- Có thể bổ sung sơ đồ mermaid (```mermaid) khi cần để trình bày trực quan luồng xử lý, quan hệ phụ thuộc hoặc phạm vi ảnh hưởng. Nhãn của node và cạnh trong sơ đồ cũng phải giữ quy tắc “một dòng tiếng Nhật, một dòng tiếng Việt”, viết theo dạng “tiếng Nhật<br>tiếng Việt” đặt trong dấu ngoặc kép như A["tiếng Nhật<br>tiếng Việt"]. -->
<!-- mermaid図はGitHub（Mermaid 11系）とGitLab 18.3（Mermaid 10.7.0）の両方で正しく表示される必要があります。改行には必ず <br> を使用し、\n は使用しないでください（Mermaid 11では文字列のまま表示されるため）。subgraphのタイトルは中のノードより短くしてください（Mermaid 10.7.0ではタイトルが枠の端に接して表示されるため）。 -->
<!-- Sơ đồ mermaid phải hiển thị đúng trên cả GitHub (Mermaid 11.x) và GitLab 18.3 (Mermaid 10.7.0). Luôn dùng <br> để xuống dòng, không dùng \n (Mermaid 11 hiển thị nguyên văn chuỗi này). Tiêu đề subgraph phải ngắn hơn các node bên trong (Mermaid 10.7.0 hiển thị tiêu đề chạm mép khung). -->
<!-- PR/MRを作成するスキルは、このテンプレートを読み、実際の変更と確認結果に基づいて記入し、完成した本文を作成コマンドまたはAPIに渡してください。記入後は案内コメントを削除してください。 -->
<!-- Skill tạo PR/MR phải đọc template này, điền dựa trên thay đổi và kết quả kiểm tra thực tế, rồi truyền nội dung đã hoàn thiện vào lệnh hoặc API tạo PR/MR. Xóa các comment hướng dẫn sau khi điền. -->
<!-- 該当しない項目には「該当なし」とその理由を記載し、直後の行にベトナム語訳を記載してください。未確認の内容を確認済みとして記載しないでください。 -->
<!-- Với mục không áp dụng, ghi “Không áp dụng” cùng lý do theo cặp dòng Nhật - Việt. Không ghi nội dung chưa xác minh thành đã xác minh. -->

# プルリクエスト / マージリクエスト - Yêu cầu hợp nhất thay đổi (PR/MR)

## 概要 - Tổng quan
<!-- このPR/MRの背景、目的、変更の要約を記載してください。 -->
<!-- Ghi bối cảnh, mục đích và tóm tắt thay đổi của PR/MR này. -->

## リスク評価 - Đánh giá rủi ro

### リスクレベル - Mức độ rủi ro
<!-- 「低」「中」「高」から1つだけ選び、選択理由を記載してください。変更を本番環境へ統合する際のリスクを評価してください。 -->
<!-- Chọn duy nhất một mức “Thấp”, “Trung bình” hoặc “Cao” và nêu lý do. Đánh giá rủi ro khi tích hợp thay đổi vào môi trường production. -->

### 修正が必要なファイルと未解決の問題 - Các file cần sửa và vấn đề còn tồn tại
<!-- 変更済みファイルの一覧ではなく、未解決の問題があり修正を必要とするファイルを記載してください。各ファイルにつき1行で、優先度（低・中・高）、ファイルパス、問題と修正案を記載してください。 -->
<!-- Liệt kê các file còn vấn đề cần sửa, không phải danh sách file đã thay đổi. Mỗi file dùng một hàng, ghi mức ưu tiên (Thấp, Trung bình, Cao), đường dẫn file, vấn đề và đề xuất sửa. -->
<!-- 表は必ず残してください。該当するファイルがない場合はデータ行を追加せず、表の下に「修正が必要なファイルはありません。」とそのベトナム語訳を続けて記載してください。 -->
<!-- Luôn giữ bảng. Nếu không có file cần sửa, không thêm hàng dữ liệu; ghi “Không có file cần sửa.” bên dưới bảng theo cặp dòng Nhật - Việt. -->

| 修正優先度 - Mức ưu tiên sửa | ファイルパス - Đường dẫn file | 未解決の問題と修正案 - Vấn đề còn tồn tại và đề xuất sửa |
| --- | --- | --- |

### 潜在的な影響 - Tác động
<!-- どの部分に、どのような悪影響が生じる可能性があるかを記載してください（例：データベースの性能低下、認証の不具合、外部APIとの互換性）。 -->
<!-- Ghi phần nào có thể chịu tác động bất lợi và tác động cụ thể là gì (ví dụ: giảm hiệu năng cơ sở dữ liệu, lỗi xác thực, khả năng tương thích với API bên ngoài). -->

### 障害発生時の対応とロールバック計画 - Kế hoạch xử lý sự cố và hoàn tác
<!-- 本番環境で障害が発生した場合の対応と、変更を元に戻す具体的な手順を記載してください。データベースマイグレーションやデータ変更がある場合は、復元方法と不可逆な変更の有無も記載してください。 -->
<!-- Ghi cách xử lý khi xảy ra sự cố trên production và các bước cụ thể để hoàn tác thay đổi. Nếu có migration hoặc thay đổi dữ liệu, nêu cách khôi phục và có thay đổi không thể đảo ngược hay không. -->

## やったこと - Những việc đã làm
<!-- このPR/MRで実施した変更を記載してください。必要に応じて関連する課題や仕様を参照してください。 -->
<!-- Ghi các thay đổi đã thực hiện trong PR/MR này. Tham chiếu issue hoặc đặc tả liên quan khi cần. -->

## やらないこと - Những việc không thực hiện trong PR/MR này
<!-- このPR/MRの対象外とする作業と、その理由を記載してください。未完了の必須作業を対象外として扱わないでください。 -->
<!-- Ghi các công việc nằm ngoài phạm vi PR/MR này và lý do. Không coi công việc bắt buộc chưa hoàn thành là ngoài phạm vi. -->

## 影響範囲 - Phạm vi ảnh hưởng
<!-- 変更が及ぶモジュール、機能、API、データベース、設定、依存先を記載してください。リスク評価では起こり得る問題を、この項目では変更が及ぶ範囲を記載してください。 -->
<!-- Ghi các module, chức năng, API, cơ sở dữ liệu, cấu hình và thành phần phụ thuộc chịu ảnh hưởng. Mục đánh giá rủi ro ghi vấn đề có thể xảy ra; mục này ghi phạm vi chịu tác động của thay đổi. -->

## テスト - Kiểm thử
<!-- 実行したコマンドや確認シナリオ、実際の結果（成功・失敗）、確認の証拠を記載してください。未実施の確認は、その内容と理由を明記してください。 -->
<!-- Ghi lệnh hoặc kịch bản đã chạy, kết quả thực tế (đạt hoặc thất bại) và bằng chứng kiểm tra. Với phần chưa kiểm tra, ghi rõ nội dung và lý do. -->
<!-- 自動テストと実際のアプリケーションでの動作確認を区別してください。未実行のテストや未確認の動作を成功として記載しないでください。 -->
<!-- Phân biệt kiểm thử tự động với kiểm tra hành vi trên ứng dụng thực tế. Không ghi kiểm thử chưa chạy hoặc hành vi chưa xác minh thành đã đạt. -->

## 備考 - Ghi chú
<!-- レビュワーへの伝達事項、承認待ちの判断、残しておくべき情報を記載してください。 -->
<!-- Ghi lưu ý dành cho người đánh giá, quyết định đang chờ phê duyệt và thông tin cần lưu lại. -->
