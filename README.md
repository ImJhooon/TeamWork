# TeamWork - 조별 과제 관리 시스템

> 서버 없이 브라우저만으로 동작하는 올인원 조별 과제 협업 툴

[Project Status](https://img.shields.io/badge/Status-Active-green)
[Tech Stack](https://img.shields.io/badge/Stack-HTML%20%7C%20CSS%20%7C%20JS-blue)
[License](https://img.shields.io/badge/License-MIT-lightgrey)

## 프로젝트 소개

**TeamWork**는 별도의 서버 구축이나 로그인 과정 없이, 브라우저의 저장소(LocalStorage)를 활용하여 팀 프로젝트를 효율적으로 관리할 수 있는 웹 애플리케이션입니다.

문서 공유, 할 일 관리, 기여도 측정을 한 곳에서 해결하며, 동기 부여를 위한 명언 기능까지 제공하여 팀원들의 협업 효율을 극대화합니다.

## 주요 기능

### 1. 문서 관리 (Document Management)
- **파일 업로드**: 드래그 앤 드롭 또는 클릭으로 파일을 업로드합니다. (Base64 인코딩 저장)
- **파일 관리**: 업로드된 파일을 목록으로 확인하고 다운로드하거나 삭제할 수 있습니다.
- **검색 기능**: 파일명으로 문서를 빠르게 찾을 수 있습니다.

### 2. 할 일 관리 (Task Management)
- **Task CRUD**: 할 일을 생성, 조회, 수정(상태 변경), 삭제할 수 있습니다.
- **필터링 & 정렬**: 상태(대기/진행/완료), 우선순위, 담당자별로 필터링하여 봅니다.
- **Sticky UI**: 스크롤이 길어져도 입력 폼이 상단에 고정되어 언제든 할 일을 추가할 수 있습니다.

### 3. 기여도 분석 (Contribution Tracking)
- **실시간 계산**: 파일 업로드 수와 완료한 할 일 개수를 합산하여 기여도(%)를 자동 산출합니다.
- **시각화**: 프로그레스 바를 통해 멤버별 참여율을 직관적으로 확인할 수 있습니다.
- **조원 관리**: 프로젝트에 참여하는 멤버를 등록하고 역할을 배정합니다.

### 4. 동기 부여 (Motivation Quote)
- **오늘의 명언**: 외부 API를 연동하여 매번 새로운 한글 명언을 제공합니다.
- **안정성 확보**: 네트워크가 없는 환경에서도 내장된 명언 데이터를 통해 끊김 없이 동작합니다.
- **인터랙션**: 부드러운 페이드인(Fade-in) 효과와 새로고침 기능을 지원합니다.

## 🛠 기술 스택 (Tech Stack)

| 구분 | 기술 | 설명 |
| :-- | :-- | :-- |
| **Frontend** | ![HTML5]| 시맨틱 마크업 구조 설계 |
| **CSS**| ![CSS3]| CSS Variables, Animations, Responsive Design |
| **Java Script**| ![JavaScript]| ES6+, Module Pattern, LocalStorage API |
| **Library** | ![TailwindCSS]| 유틸리티 퍼스트 CSS 프레임워크 |
| **Icons** | ![FontAwesome] | UI 아이콘 사용 |
| **API** | **Korean Advice API** | 한글 명언 데이터 제공 |
