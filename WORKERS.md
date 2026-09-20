# 워커 계약 (내부 문서, 배포 시 삭제)
플랜: /home/seunghyeong/.claude/plans/snug-booping-grove.md §S가 정본. 소유 폴더만 수정, git commit 금지(통합자가 커밋).
- E: engine/**, templates/project/**, scripts/cli.mjs, scripts/cmd/{init,add,frames,storyboard,upgrade}.mjs, scripts/lib/{schema,fs}.mjs, references/{deck.schema.json,contract.md,pitfalls.md,presenting.md}
- T: templates/scenes/**, references/{techniques,choreography,design}.md
- G: scripts/gates/**, scripts/lib/{browser,wheel}.mjs, scripts/cmd/{check,verify}.mjs, tests/**
- D: SKILL.md, README.md, README.ko.md, examples/sample-deck/**
공유 인터페이스(변경 시 WORKERS.md에 기록): template.json 형식, deck.json 스키마(references/deck.schema.json — E가 먼저 씀), 장면 모듈 계약(references/contract.md), CLI 서브커맨드 이름.
