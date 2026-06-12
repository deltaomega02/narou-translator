# narou-translator — 일본 웹소설 번역 Chrome 확장

일본 웹소설 사이트 '소설가가 되자(小説家になろう)'를 페이지 안에서 바로 한국어로 번역해 읽는 Chrome 확장 프로그램.
기성 번역기의 가장 큰 문제 — **작품마다 고유명사 번역이 매번 달라지는 것** — 을 작품별 용어집(glossary)으로 해결했다.

## 기술 스택

| 영역 | 기술 | 용도 |
|---|---|---|
| 플랫폼 | Chrome Extension Manifest V3 | content script + service worker 구조 |
| 언어 | JavaScript (Vanilla) | 빌드 도구 없이 동작하는 경량 구성 |
| AI | Google Gemini API | 문맥 기반 번역 |
| 저장소 | chrome.storage | API 키 설정, 작품별 용어집 영속화 |

## 동작 방식

```
[content.js]  소설 본문 페이지 감지 → 번역 UI 삽입 → 본문 추출
      ↓ 메시지 패싱
[background.js (service worker)]
      → 작품 ID로 용어집 로드 (glossary.js)
      → 시스템 프롬프트 조립: 번역 규칙 + 용어집 ("이 작품에서 X는 반드시 Y로")
      → Gemini API 호출
      ↓
[content.js]  원문 자리에 번역문 렌더링
```

- **용어집이 핵심**: 등장인물·지명·고유 기술명을 작품 단위로 저장해 두고 매 번역 요청의 프롬프트에 주입한다. 화(話)가 바뀌어도 번역이 일관된다. 새 고유명사는 읽다가 바로 등록.
- **MV3 제약 대응**: 네트워크 호출은 service worker(background)로 모으고, content script는 DOM 조작만 담당 — 권한도 `storage` + 대상 사이트 host 권한으로 최소화.

## 프로젝트 구조

```
narou-translator/
├── manifest.json     # MV3 선언, 최소 권한
├── content.js        # 본문 감지·추출, 번역 UI 삽입/렌더링
├── background.js     # 프롬프트 조립 + Gemini 호출 (service worker)
├── glossary.js       # 작품별 용어집 CRUD
├── options.html/js   # API 키·번역 설정
└── popup.html/js     # 툴바 팝업
```

## 실행

1. `chrome://extensions` → 개발자 모드 → "압축해제된 확장 프로그램 로드"로 이 폴더 선택
2. 옵션 페이지에서 Gemini API 키 입력
3. 소설가가 되자 작품 페이지에서 번역 버튼 사용
