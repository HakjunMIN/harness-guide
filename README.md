# Harness Guide — 아이디어에서 프로덕션까지의 스킬 기반 개발 프로세스

이 저장소는 **신규 앱 아이디어를 프로덕션 앱으로 만드는 end-to-end 개발 프로세스**를,
[Superpowers](https://github.com/obra/superpowers)(obra)와
[Matt Pocock Skills](https://github.com/mattpocock/skills) 두 스킬 모음을
**조화롭게 결합**해서 정의한다.

## 두 스킬 모음의 역할 분담

두 모음은 경쟁하지 않고 **맞물린다**.

- **Superpowers — 프로세스의 척추(spine).**
  에이전트가 따라갈 단계의 흐름을 책임진다: 진입 → 발산(brainstorm) → 계획 → 실행 →
  리뷰 → 출시. 작업을 작은 단위로 쪼개고, 서브에이전트로 실행하며, 검증 게이트를 강제한다.
- **Matt Pocock — 각 관절의 엔지니어링 판단.**
  정렬(grilling), 공용 언어(domain model), 깊은 모듈(deep module) 설계,
  아키텍처 건강을 책임진다. 즉 "무엇을, 어떻게 잘 만들지"의 품질을 담당한다.

핵심 결합 예시: **`brainstorming`(발산) → `grill-with-docs`(수렴 + 문서화)**.
브레인스토밍이 아이디어 공간을 넓혀 설계안을 제시하면, grill-with-docs가 그 설계를
집요하게 검증하면서 `CONTEXT.md`(용어집)와 ADR(결정 기록)을 함께 만든다.

## 설치된 스킬 (`./.agents/skills`)

### Superpowers (obra) — 프로세스 척추
| 스킬 | 역할 |
|------|------|
| `using-superpowers` | 작업 시작 시 어떤 스킬을 쓸지 잡는 진입점/라우터 |
| `brainstorming` | 아이디어 → 접근법 비교 → 설계/스펙 문서 (발산) |
| `writing-plans` | 스펙 → 파일·인터페이스가 명시된 잘게 쪼갠 TDD 계획 |
| `subagent-driven-development` | 작업별 서브에이전트로 계획 실행 + 단계별 리뷰 |
| `executing-plans` | 한 세션에서 계획을 배치 실행(체크포인트 리뷰) |
| `test-driven-development` | red-green-refactor 루프 |
| `systematic-debugging` | 재현 → 가설 → 계측 → 수정 → 회귀 테스트 디버깅 루프 |
| `requesting-code-review` | 머지 전 코드 리뷰 게이트 |
| `verification-before-completion` | "완료" 선언 전 실제 동작 검증 |
| `using-git-worktrees` | 격리된 작업 공간(worktree) 생성 |
| `finishing-a-development-branch` | 머지 / PR / 정리로 작업 마무리 |

### Matt Pocock — 엔지니어링 판단
| 스킬 | 역할 |
|------|------|
| `grill-with-docs` | 집요한 인터뷰로 설계를 검증 + `CONTEXT.md`/ADR 생성 |
| `grilling` | 인터뷰 루프 본체(grill-with-docs가 사용) |
| `domain-modeling` | 도메인 용어집(`CONTEXT.md`)·ADR을 최신으로 유지 |
| `codebase-design` | 깊은 모듈 설계 공용 어휘(module/interface/seam/depth) |
| `tdd` | red-green-refactor (Matt Pocock 버전) |
| `improve-codebase-architecture` | "진흙 공" 코드베이스를 주기적으로 구조 개선 |

> **의존성 메모.** `tdd`와 `improve-codebase-architecture`는 `codebase-design`·`grilling`·
> `domain-modeling`을, `writing-plans`의 실행 단계는 `subagent-driven-development`·
> `executing-plans`(및 `test-driven-development`·`finishing-a-development-branch` 등)을
> 참조한다. 이 저장소에는 그 **참조 스킬이 모두 함께 설치**되어 끊긴 의존성이 없다.

### 프론트엔드 / UX (생성 → 크래프트)
프론트엔드 작업은 **만들기 → 정제하기** 두 층으로 나뉜다. `frontend-design`이 대담하고
세련된 UI를 *생성*하면, ibelick의 크래프트 스킬이 그 결과를 일관된 기준으로 *정제*한다.

| 스킬 | 출처 | 역할 |
|------|------|------|
| `frontend-design` | (전역 설치) | 생성형 미학 — 타이포·컬러·모션·구성으로 "AI 슬롭"을 피한 세련된 UI 생성 |
| `baseline-ui` | ibelick | anti-slop 정제 — 스페이싱·위계·타이포·레이아웃을 의견 있는 기준으로 정리(Tailwind/Base UI/`motion`) |
| `fixing-accessibility` | ibelick | 키보드·포커스·ARIA 등 접근성 결함 수정 |
| `fixing-motion-performance` | ibelick | 애니메이션 성능(지터·리플로우) 점검·개선 |

> **선택 확장.** 프로덕션 품질 게이트(Core Web Vitals·성능·SEO·Lighthouse 감사)가 필요하면
> [`addyosmani/web-quality-skills`](https://github.com/addyosmani/web-quality-skills)
> (`core-web-vitals`·`performance`·`accessibility`·`web-quality-audit`)를 추가하면 된다.
> 현재는 미설치 — 한 줄로 도입 가능: `npx skills add addyosmani/web-quality-skills@core-web-vitals -y`

## End-to-End 개발 프로세스

```
아이디어 ──▶ 정렬 ──▶ 모듈 설계 ──▶ 계획 ──▶ 구현(TDD) ──▶ 디버깅 ──▶ 리뷰·검증 ──▶ 출시
                                                                              │
                                            (며칠마다) 아키텍처 개선 ◀────────┘
```

| 단계 | 목적 | 주요 스킬 (조합) |
|------|------|------------------|
| **0. 셋업** | 프로젝트 1회 준비 | `using-superpowers`, 필요 시 `using-git-worktrees`, `domain-modeling`로 `CONTEXT.md` 시작 |
| **1. 정렬** | 무엇을 만들지 합의 | `brainstorming`(발산: 접근법 비교·설계안) → **`grill-with-docs`**(수렴: 설계 검증 + 용어집/ADR 작성) |
| **2. 모듈 설계** | 어떻게 잘 만들지 | `codebase-design`(작은 인터페이스·깊은 구현·깨끗한 seam) + `domain-modeling`(결정 기록) |
| **3. 계획** | 실행 가능한 작업으로 분해 | `writing-plans`(파일·인터페이스 명시, 세로 슬라이스 단위 TDD 작업) |
| **4. 구현** | 코드 작성 | `subagent-driven-development` 또는 `executing-plans`로 계획 실행 + `tdd`/`test-driven-development`로 슬라이스마다 red-green-refactor / *프론트엔드면* `frontend-design`으로 UI 생성 |
| **5. 디버깅** | 막히면 | `systematic-debugging` (가설 기반 루프) |
| **6. 리뷰·검증** | 품질 게이트 | `requesting-code-review` + `verification-before-completion` / *프론트엔드면* `baseline-ui`·`fixing-accessibility`·`fixing-motion-performance`로 정제 |
| **7. 출시** | 통합/배포 | `finishing-a-development-branch` (머지·PR·정리) |
| **상시** | 구조 건강 유지 | `improve-codebase-architecture` (며칠마다 1회, 얕은 모듈을 깊게) |

### 각 단계 운영 팁

1. **정렬(1단계)이 가장 중요하다.** 가장 흔한 실패는 "에이전트가 원하는 걸 안 만든 것".
   `brainstorming`으로 옵션을 펼친 뒤 `grill-with-docs`로 한 설계를 끝까지 추궁한다.
   여기서 만든 `CONTEXT.md`는 이후 모든 단계의 토큰을 아끼고 명명을 일관되게 만든다.
2. **계획 전에 모듈 경계를 정한다.** `codebase-design` 어휘(module/interface/seam/depth)로
   "작은 인터페이스 뒤에 많은 동작"을 추구하면 테스트 가능성이 따라온다.
3. **세로 슬라이스로만 만든다.** 테스트 전부 먼저(가로 슬라이스) 금지.
   한 테스트 → 한 구현 → 반복.
4. **완료 선언 전 반드시 검증.** `verification-before-completion`으로 증상이 실제로
   사라졌는지·테스트가 통과하는지 확인한 뒤에만 "done".

## 공통 원칙

- **DRY, YAGNI, TDD, 잦은 커밋.**
- 큰 기능은 한 번에 만들지 말고 검증 가능한 세로 슬라이스로 쪼갠다.
- 코드보다 먼저 문제·성공 기준·용어를 명확히 한다.
- 구조가 복잡해지면 구현보다 경계(seam)를 먼저 정리한다.
- 에이전트가 빨라질수록 엔트로피도 빨라진다 — 아키텍처를 **매일** 챙긴다.

## 중복 스킬에 대한 안내

두 모음에 비슷한 스킬이 있다. 충돌이 아니라 **진입 지점에 따라 자연스럽게 선택**된다.

- **TDD** — `test-driven-development`(Superpowers)와 `tdd`(Matt Pocock)는 같은
  red-green-refactor 규율이다. Superpowers 실행 체인(`subagent-driven-development`/
  `executing-plans`)을 따라갈 땐 전자를, 독립 기능 작업에서 직접 부를 땐 후자를 쓴다.
- **인터뷰** — `brainstorming`은 **발산**(옵션을 펼침), `grilling`/`grill-with-docs`는
  **수렴**(한 설계를 추궁해 결정 트리를 닫음). 서로 다른 순간에 쓴다.
  `brainstorming`의 design/spec은 초안이자 기준 문서이고, `grill-with-docs`는
  그 문서를 검증해 같은 spec을 갱신한다. `CONTEXT.md`와 ADR은 보조 기록이며,
  구현 plan은 수렴된 spec 하나에서 `writing-plans`로만 생성한다.

## 빠른 시작

```text
1) /using-superpowers 로 흐름을 잡는다
2) /brainstorming 으로 아이디어를 설계안으로 펼친다
3) /grill-with-docs 로 설계를 검증하고 CONTEXT.md·ADR을 만든다
4) /codebase-design 으로 모듈 경계를 설계한다
5) /writing-plans 로 TDD 계획을 만든다
6) /subagent-driven-development(또는 /executing-plans)로 구현한다
7) /requesting-code-review → /finishing-a-development-branch 로 마무리한다
```
