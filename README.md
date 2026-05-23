# 벼락찢기

모바일 위주의 회독 카드 웹앱입니다. 일본어 문법뿐 아니라 단어, 영어, 중국어, 자격증 암기 카드처럼 원하는 묶음을 만들어 벼락치기하듯 반복 학습할 수 있습니다. 닉네임과 숫자 6자리 코드로 간단히 들어갈 수 있고, Python 표준 라이브러리와 SQLite만 사용해서 Docker Compose로 가볍게 배포할 수 있습니다.

## Docker 실행

```bash
git clone https://github.com/coldrain-f/Bunpo-Loop.git
cd Bunpo-Loop
docker compose up -d --build
```

기본 주소는 `http://서버IP:8000`입니다.

SQLite 데이터는 Docker named volume인 `bunpo-loop-data`에 저장됩니다. 컨테이너를 다시 만들어도 학습 데이터는 유지됩니다.

포트나 기본 인증을 바꾸려면 `.env.example`을 복사해서 `.env`를 만듭니다.

```bash
cp .env.example .env
```

`.env`:

```env
BUNPO_LOOP_PORT=8000
APP_USER=myname
APP_PASSWORD=strong-password
```

변경 후 다시 올립니다.

```bash
docker compose up -d --build
```

업데이트할 때는 서버에서 다음처럼 실행합니다.

```bash
git pull
docker compose up -d --build
```

로그 확인:

```bash
docker compose logs -f
```

중지:

```bash
docker compose down
```

볼륨까지 지우면 SQLite 학습 데이터도 삭제되므로 주의하세요.

```bash
docker compose down -v
```

## 로컬 실행

```bash
python3 app.py
```

기본 주소는 `http://127.0.0.1:8000`입니다.

외부 접속을 받을 때는 다음처럼 실행합니다.

```bash
HOST=0.0.0.0 PORT=8000 python3 app.py
```

개인 서버에 공개할 때는 앱 안의 간단 로그인과 별도로, 서버 전체를 보호하는 기본 인증을 켜는 편이 좋습니다.

```bash
APP_USER=myname APP_PASSWORD='strong-password' HOST=0.0.0.0 PORT=8000 python3 app.py
```

SQLite 파일은 기본으로 `data/jlpt_cards.sqlite3`에 생성됩니다. 다른 위치를 쓰려면 `JLPT_DB`를 지정하세요.

```bash
JLPT_DB=/var/lib/bunpo-loop/bunpo-loop.sqlite3 HOST=0.0.0.0 PORT=8000 python3 app.py
```

## 기능

- 그룹 등록, 수정, 삭제
- 기본값이 채워진 닉네임 + 숫자 6자리 코드 간단 로그인
- 카드 등록, 수정, 삭제
- 여러 줄 카드 대량 등록
- 카드 앞면: 일본어 문법 표현
- 카드 뒷면: 한국어 뜻, 메모, 여러 예문
- 학습 전 그룹 선택 화면
- 그룹 선택으로 돌아가기 전 확인 다이얼로그
- 그룹 단위 학습
- 회독 시작 전 그룹 카드 미리보기
- 순서대로, 랜덤, 자주 틀리는 순 학습
- 학습 시작 확인 다이얼로그
- 오답이 있으면 오답 카드만 반복 후 회독 완료
- 학습 중 회독 포기
- 학습 중 다른 탭 이동 확인 다이얼로그
- 카드 삭제, 그룹 삭제, 학습기록 초기화 확인 다이얼로그
- 회독 완료 기록
- 회독 시작/종료 시각 및 소요 시간 기록
- 학습 중 실시간 소요 시간 표시
- 회독 완료 후 카드별 정오답 상세
- 그룹별 학습기록 초기화
- JSON 백업 파일 만들기 및 복원
- 알맞음/틀림 누적 통계
- 약점 카드 기준 설정 및 약점 카드만 복습

## 카드 대량 등록 형식

카드 탭의 대량 등록은 한 줄에 카드 하나씩 넣습니다.

```text
〜あまり | ~한 나머지 | 메모 | 緊張のあまり、声が震えた。 => 긴장한 나머지 목소리가 떨렸다.
〜に至っては | ~에 이르러서는
```

탭으로 구분해도 되고, 예문은 `;`로 여러 개를 이어 쓸 수 있습니다.

## 우분투 배포 메모

개인 서버에서는 Docker Compose로 실행하고, Nginx나 Caddy 뒤에 붙여 HTTPS를 적용하는 구성을 추천합니다.

프록시 대상:

```text
http://127.0.0.1:8000
```

서버 방화벽을 직접 열어 접속할 경우에는 `BUNPO_LOOP_PORT`로 지정한 포트만 열면 됩니다.
