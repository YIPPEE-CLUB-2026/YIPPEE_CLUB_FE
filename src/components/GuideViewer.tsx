import { Link } from 'react-router-dom';
import { WireDialog } from './WireDialog';

const asset = (name: string) => `/assets/design/${name}`;

function GuideHeading({ label, title }: { label: string; title: string }) {
  return (
    <div className="guide-copy">
      <small>{label}</small>
      <h2>{title}</h2>
    </div>
  );
}

export function HowToContent() {
  return (
    <div className="club-introduction">
      <section>
        <small>YIPPEE CLUB 이용방법</small>
        <img
          className="guide-illustration"
          src={asset('howto-6ab9f.png')}
          alt="함께 만세를 하는 아이와 위피 캐릭터"
        />
        <GuideHeading label="반가워요" title="YIPPEE CLUB에 처음 오셨나요?" />
        <p>
          전자기기 없이도 아이의 호기심과 상상력을 키울 수 있는 재미있는 놀이
          세상이 있어요.
        </p>
      </section>
      <section>
        <img
          className="guide-illustration"
          src={asset('howto-cd60c.png')}
          alt="기쁘게 만세를 하는 위피"
        />
        <GuideHeading
          label="이름에 담은 마음"
          title="YIPPEE는 ‘만세!’라는 뜻이에요"
        />
        <p>
          아이가 직접 생각하고, 탐색하고, 몸을 움직이며 ‘진짜 놀이’를 경험할 수
          있도록 만들었어요.
        </p>
        <p>놀이 속 작은 성취가 하나둘 쌓이면 몸도 마음도 튼튼하게 자라요.</p>
      </section>
      <section>
        <img
          className="guide-illustration"
          src={asset('howto-d4e5c.png')}
          alt="아이의 놀이를 고민하는 부모님"
        />
        <GuideHeading
          label="부모님께"
          title={'놀이 고민은 이제 그만,\n프린트 한 장이면 충분해요'}
        />
        <div className="parent-questions">
          {[
            '우리 아이는 뭘 좋아할까?',
            '오늘은 어떤 놀이를 해볼까?',
            '준비물은 얼마나 필요할까?',
          ].map((text) => (
            <p key={text}>{text}</p>
          ))}
        </div>
        <p>
          바쁜 하루에도 아이를 먼저 생각하는 부모님을 위해, 종이 한 장으로
          시작하는 놀이를 준비했어요.
        </p>
      </section>
      <section>
        <img
          className="guide-illustration"
          src={asset('howto-bb0ea.png')}
          alt="위피클럽의 활동안과 놀이 가이드"
        />
        <GuideHeading
          label="YIPPEE CLUB이 준비한 것"
          title="놀이에 필요한 세 가지를 담았어요"
        />
        {[
          [
            '만세 활동안',
            '특별한 놀잇감 없이, 프린트 한 번이면 놀이 준비가 끝나요.',
            '연령·주제·발달 영역별로 정리된 놀이 도안',
            '집에 있는 간단한 준비물로 충분해요',
          ],
          [
            '만세 가이드',
            '도안마다 부모님을 위한 놀이 가이드가 함께 있어 처음이어도 안심이에요.',
            '놀이 효과·방법·난이도·소요 시간 안내',
            '집에서 이어 하기 좋은 연계 팁',
          ],
          [
            '만세도감',
            '놀이를 마친 뒤 짧은 리뷰를 남겨 보세요.',
            '놀이 완료와 리뷰 수에 따라 배지 획득',
            '도감 곳곳에 숨어 있는 반짝배지',
          ],
        ].map(([title, body, ...items], index) => (
          <article className="guide-feature" key={title}>
            <h3>
              <span>{String(index + 1).padStart(2, '0')}</span>
              {title}
            </h3>
            <p>{body}</p>
            <ul>
              {items.map((item) => (
                <li key={item}>
                  <img src={asset('howto-1d257.svg')} alt="" />
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
      <section>
        <img
          className="guide-illustration"
          src={asset('howto-cbed5.png')}
          alt="함께 즐겁게 놀이하는 가족"
        />
        <GuideHeading label="마지막으로" title="놀이에는 정답이 없어요" />
        <p>아이마다 느끼는 마음도, 표현하는 방식도 모두 달라요.</p>
        <p>
          YIPPEE CLUB은 모든 아이를 아끼는 마음으로 다양한 놀이를 연구하고
          있어요. 오늘은 아이와 눈을 맞추고 함께 웃는 시간을 만들어 보세요.
        </p>
        <div className="guide-signoff">
          <strong>Let’s play, Let’s YIPPEE!</strong>
          <p>지금 바로 YIPPEE CLUB과 함께해요.</p>
        </div>
      </section>
    </div>
  );
}

function PlayThumbnail({ step }: { step: number }) {
  return (
    <div
      className={`play-thumbnail play-thumbnail--${step}`}
      aria-hidden="true"
    >
      <div className="play-thumbnail__paper">
        <i />
        <i />
        <i />
      </div>
      {step > 0 && (
        <div className="play-thumbnail__review">
          <span>★★★★★</span>
          <i />
        </div>
      )}
      {step === 2 && (
        <img
          className="play-thumbnail__badge"
          src={asset('badge-guide-41f40.svg')}
          alt=""
        />
      )}
      <small>{['활동지 놀이 완료', '리뷰 쓰기', '배지 획득!'][step]}</small>
    </div>
  );
}

export function BadgeGuideContent() {
  return (
    <div className="badge-explainer">
      <section className="badge-explainer__banner">
        <small>활동배지</small>
        <h2>
          놀이할수록 쌓이는
          <br />
          우리 아이 활동배지
        </h2>
        <img src={asset('badge-guide-f4942.png')} alt="위피 캐릭터" />
      </section>
      <section className="badge-explainer__section">
        <h2>활동배지, 이렇게 모아요</h2>
        <p>활동지로 놀이한 뒤 리뷰를 쓰면 배지를 받을 수 있어요.</p>
        <ol className="badge-steps">
          {[
            ['놀이 완료', '활동지로 놀이'],
            ['리뷰 쓰기', '별점·후기 남기기'],
            ['배지 획득', '활동배지 받기'],
            ['만세도감', '모은 배지 확인'],
          ].map(([title, caption], index) => (
            <li key={title}>
              <div>
                <small>STEP {index + 1}</small>
                <strong>{title}</strong>
              </div>
              <p>{caption}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="badge-benefits">
        {[
          [
            '활동지로 신나게 놀아요',
            '마음에 드는 활동지를 출력해 아이와 함께 놀이해요.',
          ],
          [
            '리뷰를 남겨 주세요',
            '놀이가 끝나면 별점과 짧은 후기를 남겨 주세요.',
          ],
          ['활동배지를 받아요!', '리뷰를 쓰면 활동배지가 만세도감에 쌓여요.'],
          [
            '반짝배지는 대표배지로',
            '‘반짝배지’는 대표배지로 설정해 내 정보에서 보여줄 수 있어요.',
          ],
        ].map(([title, body], index) => (
          <article key={title}>
            {index < 3 ? (
              <PlayThumbnail step={index} />
            ) : (
              <div className="sparkle-thumbnail">
                <img src={asset('badge-guide-ff0cd.svg')} alt="" />
              </div>
            )}
            <div>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          </article>
        ))}
      </section>
      <section className="badge-explainer__section badge-catalogue-preview">
        <h2>만세도감에서 확인해요</h2>
        <p>모은 배지는 만세도감에서 한눈에 볼 수 있어요.</p>
        <div className="badge-preview-list">
          {[
            ['첫걸음', '7ad7c'],
            ['잘했어요', '17172'],
            ['단골손님', '3b498'],
            ['명예가족', '2b48e'],
            ['만세왕', '68eae'],
          ].map(([name, file]) => (
            <div key={name}>
              <img
                src={asset(`badge-guide-example-${file}.png`)}
                alt={`${name} 배지`}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function GuideViewer({
  kind,
  onClose,
}: {
  kind: 'how-to' | 'badges';
  onClose: () => void;
}) {
  const badges = kind === 'badges';
  return (
    <WireDialog
      title={badges ? '활동배지' : '이용방법'}
      className="club-guide-viewer"
      onClose={onClose}
    >
      <div className="club-guide-handle" />
      <header className="club-design-header">
        <button type="button" aria-label="뒤로가기" onClick={onClose}>
          <img src={asset('howto-60e11.svg')} alt="" />
        </button>
        <h1>{badges ? '활동배지' : '이용방법'}</h1>
      </header>
      <div className="club-guide-scroll">
        {badges ? <BadgeGuideContent /> : <HowToContent />}
      </div>
      <footer className="club-guide-footer">
        <Link
          className="button button--primary"
          to={badges ? '/badges' : '/activities'}
          onClick={onClose}
        >
          {badges ? '만세도감 보기' : '놀이활동 시작하기'}
        </Link>
      </footer>
    </WireDialog>
  );
}
