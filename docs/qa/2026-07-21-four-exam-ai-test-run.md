# 4 sınav AI test koşumu

**Tarih:** 2026-07-21T13:06:13Z
**Branch:** cursor/guncel-native-terminal-6767

## 1) Functions (jest)

> test
> jest

PASS tests/solveQuestion.test.ts (7.421 s)
PASS tests/runtime.test.ts (7.438 s)
PASS tests/quota.test.ts (7.452 s)
PASS tests/processSolveRequest.test.ts
PASS tests/filterTopicsForExam.test.ts
PASS tests/syncSubscription.test.ts
PASS tests/persistentRateLimit.test.ts
PASS tests/explainAgain.test.ts
PASS tests/bootstrapUser.test.ts
PASS tests/streak.test.ts
PASS tests/listAttempts.test.ts
PASS tests/syncSubscriptionStub.test.ts
PASS tests/safetyMessages.test.ts
PASS tests/itemBank.test.ts
PASS tests/cache.test.ts
PASS tests/examTypes.test.ts
PASS tests/prompts.test.ts
PASS tests/weakestTopic.test.ts
PASS tests/parseUploadPath.test.ts
PASS tests/topics.test.ts
PASS tests/completeOnboarding.test.ts
PASS tests/abuse.test.ts
PASS tests/updateExamType.test.ts
PASS tests/executeSolve.test.ts
PASS tests/parseSolution.test.ts
PASS tests/moderation.test.ts
PASS tests/requestAccountDeletion.test.ts

Test Suites: 27 passed, 27 total
Tests:       74 passed, 74 total
Snapshots:   0 total
Time:        8.18 s, estimated 22 s
Ran all test suites.

## 2) Solve-proxy pipeline matrix (LGS/YGS/KPSS/Ehliyet)
ok lgs-math-order → math math B 8
ok lgs-turkish-anlatim → verbal turkish A öyküleme
ok lgs-turkish-anlam → verbal turkish B Amaç-sonuç
ok ygs-math → math math A 27
ok ygs-turkish-anlatim → verbal turkish B öyküleme
ok ygs-biology-classify → miss biology  
ok kpss-math-fraction → math math E 7
ok kpss-turkish-anlatim → verbal turkish A öyküleme
ok kpss-turkish-anlam → verbal turkish B Amaç-sonuç
ok trafik-light → verbal traffic A Harekete hazırlanmalı
ok trafik-shaft → verbal vehicle A I. Şaft II. Diferansiyel III. Aks
ok trafik-abs → verbal vehicle B Tekerleklerin kilitlenmesini önlemek
ok trafik-abc → verbal firstaid B Hava yolu - solunum - dolaşım
ok trafik-speed → verbal traffic B 50
ok exam-switch isolation turkish→trafik via= miss
ok exam-switch isolation shaft→kpss via= miss turkish
pipeline matrix passed (14 fixtures, 1 soft)

## 3) Solve-proxy exam isolation
ok kpss + trafik OCR → non-trafik subject turkish kpss-turkish-paragraf
ok lgs topicIdFor(vehicle) remaps away from trafik-* lgs-turkish-paragraf
ok trafik + light OCR → traffic topic trafik-traffic-hiz-mesafe
ok trafik + turkish OCR classify stays in ehliyet subjects traffic
ok kpss verbal on trafik OCR does not emit vehicle/traffic branş undefined
ok traffic solver hard-blocked under LGS/YGS/KPSS even with leaked branş
ok trafik verbal returns ehliyet answer A
ok trafik exam blocks turkish anlatım solver null
ok kpss turkish still solves öyküleme
ok mismatch hint without pipeline switch
ok trafik profile keeps solveExam=trafik despite turkish hint
ok assertPipelineIsolation
ok shaft stays in ehliyet vehicle pipeline
ok ygs fen branches classify
ok subjectHint applied
all examPipeline isolation tests passed

## 4) Solve-proxy unit tests
### arithSolve.test.mjs
ok vertical digits (1/3)/(1/7) 2.3333333333333335 -
ok frac lines (1/3)/(1/7) 2.3333333333333335 A
ok bars (1/3)/(1/7) 2.3333333333333335 A
ok stacked complex → 7 (5*(2-3/5))/(2*(3-5/2)) 7 B
ok live phone OCR mangled stack (5*(2-3/5))/(2*(3-5/2)) 7 E
ok bracket outer grouping → 7 (5*(2-3/5))/(2*(3-5/2)) 7 E
all arithSolve tests passed
### verbalSolve.test.mjs
ok live turkish anlatım → öyküleme En uygun anlatım biçimi: öyküleme
ok anlam ilgisi → Amaç-sonuç
all verbalSolve tests passed
### trafficSolve.test.mjs
trafficSolve.test.mjs OK
### examHint.test.mjs
ok kpss profile + Q97 → ygs mismatch
ok ygs profile + Q97 → no mismatch sheet
ok ygs profile + KPSS keyword → mismatch
ok kpss + low Q number → no mismatch
ok kpss profile + trafik OCR → trafik mismatch
ok trafik profile + anlatım biçimi Q96 → ygs
ok trafik profile + Q97 anlam ilgisi → ygs
ok trafik profile + Q52 şaft → stay trafik (no Q# false alarm)
ok trafik profile + Q61 hız → no exam mismatch
all examHint tests passed

## 5) Mobile solve tests

> mobile@1.0.0 test
> jest --testPathPattern=localSolveFallback|normalizeSolved|solutionAnswer|examPipeline|solve

PASS tests/localSolveFallback.test.ts
PASS tests/normalizeSolvedBranch.test.ts
PASS tests/solutionAnswer.test.ts
PASS tests/examPipelineIsolation.test.ts
PASS tests/solveFailureMessage.test.ts
PASS tests/resolveActiveExam.test.ts

Test Suites: 6 passed, 6 total
Tests:       33 passed, 33 total
Snapshots:   0 total
Time:        0.792 s, estimated 2 s
Ran all test suites matching /localSolveFallback|normalizeSolved|solutionAnswer|examPipeline|solve/i.

## 6) Mobile typecheck

> mobile@1.0.0 typecheck
> tsc --noEmit

