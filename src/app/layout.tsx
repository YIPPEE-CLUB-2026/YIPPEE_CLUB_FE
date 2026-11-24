import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import '../styles.css';
import '../reference.css';
import '../brand.css';
import '../club-guides.css';
import '../auth-spec.css';
import '../wireframe.css';
import '../bottom-nav.css';
import '../activity-design.css';

export const metadata: Metadata = {
  title: 'YIPPEE CLUB',
  description: '아이와 함께하는 놀이 활동지, YIPPEE CLUB',
  applicationName: 'YIPPEE CLUB',
  appleWebApp: {
    capable: true,
    title: 'YIPPEE CLUB',
    statusBarStyle: 'default',
  },
  icons: { apple: '/icons/apple-touch-icon.png' },
};

export const viewport: Viewport = { themeColor: '#ffd96b' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>

        {children}
      </body>
    </html>
  );
}
